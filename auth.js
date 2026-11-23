
// Supabase authentication and per-user task loading.
// This module handles user login, signup, logout and task loading.

(function () {

  // Stores the currently logged-in user's information.
  let currentUser = null;

  // Creates a new HTML div element for the authentication overlay.
  const overlay = document.createElement('div');

  // Assigns an ID to the overlay so CSS can style it.
  overlay.id = 'authOverlay';

  // Adds the complete login and signup interface inside the overlay.
  overlay.innerHTML = `
    <div class="auth-card">
      <div class="auth-logo">✓ Smart<span>Task</span></div>

      <!-- Buttons for switching between Sign in and Sign up -->
      <div class="auth-tabs">
        <button type="button" id="tabSignin" class="active">Sign in</button>
        <button type="button" id="tabSignup">Sign up</button>
      </div>

      <!-- Form used for both login and registration -->
      <form id="authForm" autocomplete="on">

        <!-- Name field is visible only during signup -->
        <input id="authName" type="text" placeholder="Your name"
        autocomplete="name" hidden>

        <!-- Input field for the user's email address -->
        <input id="authEmail" type="email" placeholder="Email"
        autocomplete="email" required>

        <!-- Password field with a minimum length of 6 characters -->
        <input id="authPassword" type="password"
        placeholder="Password (min 6 characters)"
        autocomplete="current-password" minlength="6" required>

        <!-- Button used to submit the login or signup form -->
        <button class="primary-btn" id="authSubmit" type="submit">
          Sign in
        </button>

        <!-- Displays error messages and success messages -->
        <p id="authMsg" class="auth-msg" role="alert"></p>
      </form>
    </div>`;

  // Adds the authentication overlay to the webpage.
  document.body.appendChild(overlay);

  // Helper function to find an HTML element using its ID.
  const el = id => document.getElementById(id);

  // Stores the current authentication mode.
  // Default mode is Sign in.
  let mode = 'signin';


  // Function to display authentication messages.
  // s = message text, ok = whether the message is successful.
  function msg(s, ok=false) {

    // Displays the message inside the authentication message element.
    el('authMsg').textContent = s;

    // Adds or removes the 'ok' CSS class depending on success status.
    el('authMsg').classList.toggle('ok', ok);
  }


  // Function to switch between Sign in and Sign up modes.
  function setMode(m) {

    // Updates the current authentication mode.
    mode = m;

    // Activates the Sign in tab only when signin mode is selected.
    el('tabSignin').classList.toggle('active', m === 'signin');

    // Activates the Sign up tab only when signup mode is selected.
    el('tabSignup').classList.toggle('active', m === 'signup');

    // Shows the name field only during signup.
    el('authName').hidden = m !== 'signup';

    // Changes the submit button text according to the selected mode.
    el('authSubmit').textContent =
      m === 'signin' ? 'Sign in' : 'Create account';

    // Changes password autocomplete depending on the authentication mode.
    el('authPassword').autocomplete =
      m === 'signin' ? 'current-password' : 'new-password';

    // Clears any previous error or success message.
    msg('');
  }


  // Runs setMode('signin') when the Sign in tab is clicked.
  el('tabSignin').onclick = () => setMode('signin');

  // Runs setMode('signup') when the Sign up tab is clicked.
  el('tabSignup').onclick = () => setMode('signup');


  // Creates a new div element for displaying logged-in user information.
  const userBox = document.createElement('div');

  // Assigns the user-box CSS class for styling.
  userBox.className = 'user-box';

  // Adds HTML elements for username, email and logout button.
  userBox.innerHTML = `
    <div class="user-name" id="userName"></div>
    <div class="user-email" id="userEmail"></div>
    <button class="secondary-btn" id="logoutBtn" type="button">
      Log out
    </button>`;

  // Adds the user information section inside the sidebar.
  document.getElementById('sidebar').appendChild(userBox);


  // Overrides the existing saveTasks function.
  // Saves tasks separately for the currently logged-in user.
  // If no user is logged in, it returns an already resolved Promise.
  saveTasks = function () {

    if (currentUser)
      return LocalDB.saveTasks(currentUser.id, tasks);

    return Promise.resolve();
  };


  // Stores the original showPage function before modifying it.
  const originalShowPage = showPage;

  // Overrides showPage to add personalized dashboard functionality.
  showPage = function (page) {

    // Calls the original function to display the requested page.
    originalShowPage(page);

    // Checks whether a user is logged in and dashboard is being opened.
    if (currentUser && page === 'dashboard') {

      // Finds the dashboard heading element.
      const h = el('pageTitle');

      // Replaces the default greeting with the logged-in user's name.
      h.textContent =
        h.textContent.replace(/^Hey\s*!/, 'Hey ' + currentUser.name + '!');
    }
  };


  // Function to start a session after successful login or signup.
  // async allows us to use await inside this function.
  async function startSession(user) {

    // Stores the logged-in user's information.
    currentUser = user;

    // Saves the current user session using LocalDB.
    LocalDB.setSession(user);

    // Displays the logged-in user's name in the sidebar.
    el('userName').textContent = user.name;

    // Displays the logged-in user's email in the sidebar.
    el('userEmail').textContent = user.email;

    try {

      // Loads only the tasks belonging to the current user's ID.
      // await waits until the tasks are loaded.
      tasks = await LocalDB.loadTasks(user.id);

      // Hides the authentication overlay after successful task loading.
      overlay.style.display = 'none';

      // Refreshes the task interface with the loaded data.
      render();

      // Opens the user's dashboard.
      showPage('dashboard');

    } catch (err) {

      // Displays an error if task loading fails.
      msg('Could not load tasks: ' + err.message);

      // Shows the authentication overlay again.
      overlay.style.display = 'flex';
    }
  }


  // Adds a submit event listener to the authentication form.
  // This function runs when the user submits the form.
  el('authForm').addEventListener('submit', async e => {

    // Prevents the browser from reloading the page after form submission.
    e.preventDefault();

    // Stores the authentication submit button.
    const btn = el('authSubmit');

    // Disables the button to prevent multiple submissions.
    btn.disabled = true;

    // Displays a waiting message while authentication is processing.
    msg('Please wait...', true);

    try {

      // Checks the selected mode.
      // If signup is selected, register a new user.
      // Otherwise, login using the existing account.
      const user = mode === 'signup'

        // Registers a new user using name, email and password.
        ? await LocalDB.register(
            el('authName').value,
            el('authEmail').value,
            el('authPassword').value
          )

        // Logs in an existing user using email and password.
        : await LocalDB.login(
            el('authEmail').value,
            el('authPassword').value
          );

      // Starts the user session after successful authentication.
      await startSession(user);

    } catch (err) {

      // Displays the actual error message if authentication fails.
      msg(err.message || 'Something went wrong');

    } finally {

      // Re-enables the submit button whether the operation succeeds or fails.
      btn.disabled = false;
    }
  });


  // Adds a click event to the Logout button.
  el('logoutBtn').onclick = async () => {

    // Stores the logout button element.
    const btn = el('logoutBtn');

    // Disables the button while logout is processing.
    btn.disabled = true;

    try {

      // Synchronizes pending task changes before logging out.
      await LocalDB.flushTasks();

      // Clears the current login session.
      await LocalDB.logout();

      // Removes the current user's information from memory.
      currentUser = null;

      // Clears all tasks from the current task list.
      tasks = [];

      // Refreshes the interface after clearing the tasks.
      render();

      // Clears the password field for security.
      el('authPassword').value = '';

      // Displays the authentication screen again.
      overlay.style.display = 'flex';

      // Switches the authentication screen back to Sign in mode.
      setMode('signin');

    } catch (err) {

      // Displays an alert if tasks could not be synchronized
      // or logout fails.
      alert(
        'Your latest tasks could not be synced. Please check your internet/database connection and try logging out again. '
        + (err.message || '')
      );

    } finally {

      // Re-enables the logout button after the operation finishes.
      btn.disabled = false;
    }
  };


  // Immediately invoked async function.
  // Runs automatically when this authentication module loads.
  (async () => {

    try {

      // Initializes the LocalDB module and its database connection.
      LocalDB.init();

      // Checks whether a previous user session already exists.
      const user = await LocalDB.getSessionUser();

      // If a valid session exists, automatically starts that session.
      if (user)
        await startSession(user);

    } catch (err) {

      // Displays an error if initialization or session restoration fails.
      msg(err.message || 'Supabase connection failed');
    }

  })();

})(); // Ends and immediately executes the main function.
