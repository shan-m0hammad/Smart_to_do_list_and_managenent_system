// Local database authentication and per-user task loading.
// This module handles user login, signup, logout and task loading.
// NOTE: load order in index.html must be: localdb file -> script.js -> this file.

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

  // Stores the current authentication mode (default is Sign in).
  let mode = 'signin';


  // Displays authentication messages.
  // s = message text, ok = true for a success/info message (green), false for an error (red).
  function msg(s, ok = false) {

    // Displays the message inside the authentication message element.
    el('authMsg').textContent = s;

    // Adds or removes the 'ok' CSS class depending on success status.
    el('authMsg').classList.toggle('ok', ok);
  }


  // Switches between Sign in and Sign up modes.
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


  // Switch to Sign in mode when the Sign in tab is clicked.
  el('tabSignin').onclick = () => setMode('signin');

  // Switch to Sign up mode when the Sign up tab is clicked.
  el('tabSignup').onclick = () => setMode('signup');


  // Creates a div element for displaying logged-in user information.
  const userBox = document.createElement('div');

  // Assigns the user-box CSS class for styling.
  userBox.className = 'user-box';

  // Adds HTML elements for username, email and the logout button.
  userBox.innerHTML = `
    <div class="user-name" id="userName"></div>
    <div class="user-email" id="userEmail"></div>
    <button class="secondary-btn" id="logoutBtn" type="button">
      Log out
    </button>`;

  // Adds the user information section inside the sidebar.
  document.getElementById('sidebar').appendChild(userBox);


  // Overrides the existing saveTasks function (from script.js).
  // Saves tasks separately for the currently logged-in user.
  // FIX: save errors are now caught and shown to the user instead of failing silently.
  saveTasks = function () {

    // If no user is logged in, there is nothing to save.
    if (!currentUser)
      return Promise.resolve();

    // Save this user's tasks; if saving fails, show a toast message.
    return Promise.resolve(LocalDB.saveTasks(currentUser.id, tasks))
      .catch(err => {
        showToast('Could not save tasks: ' + (err.message || 'unknown error'));
      });
  };


  // Stores the original showPage function before modifying it.
  const originalShowPage = showPage;

  // Overrides showPage to add the logged-in user's name to the dashboard greeting.
  showPage = function (page) {

    // Calls the original function to display the requested page.
    originalShowPage(page);

    // Only when a user is logged in and the dashboard is being opened.
    if (currentUser && page === 'dashboard') {

      // Finds the page heading element.
      const h = el('pageTitle');

      // FIX: the real title is "Good Morning! 👋", so match that text
      // (the old regex looked for "Hey!" which never exists).
      h.textContent =
        h.textContent.replace(/^Good Morning!/, 'Good Morning, ' + currentUser.name + '!');
    }
  };


  // Starts a session after successful login/signup or session restore.
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


  // Runs when the user submits the authentication form.
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

      // If signup mode: register a new user, otherwise log in the existing one.
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


  // Runs when the Log out button is clicked.
  el('logoutBtn').onclick = async () => {

    // Stores the logout button element.
    const btn = el('logoutBtn');

    // Disables the button while logout is processing.
    btn.disabled = true;

    try {

      // Saves any pending task changes before logging out.
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

      // Shows an alert if tasks could not be saved or logout fails.
      alert(
        'Your latest tasks could not be saved. Please check the database connection and try logging out again. '
        + (err.message || '')
      );

    } finally {

      // Re-enables the logout button after the operation finishes.
      btn.disabled = false;
    }
  };


  // Immediately invoked async function.
  // Runs automatically when this module loads.
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

      // FIX: message no longer mentions Supabase, since this version uses LocalDB.
      msg(err.message || 'Could not connect to the local database');
    }

  })();

})(); // Ends and immediately executes the main function.
