
// Supabase adapter: Maintains the old LocalDB interface
// so the existing application requires minimal changes.

// Creating a LocalDB object using an Immediately Invoked Function Expression.
const LocalDB = (() => {

  // Stores the Supabase client connection.
  let client;

  // Stores information about the currently logged-in user.
  let currentUser = null;

  // Maintains a queue of database save operations.
  // Promise.resolve() creates an initially resolved Promise.
  let saveQueue = Promise.resolve();

  // Stores the most recent task synchronization error.
  let lastSaveError = null;


  // Initializes the connection with the Supabase backend.
  function init() {

    // Checks whether Supabase library and project credentials are available.
    // Also checks whether placeholder credentials are still being used.
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY ||
        window.SUPABASE_URL.includes('PASTE_') || window.SUPABASE_ANON_KEY.includes('PASTE_')) {

      // Throws an error if Supabase configuration is missing.
      throw new Error('Supabase credentials missing. Add Project URL and Publishable key in config.js.');
    }

    // Creates the Supabase client using the project URL and public key.
    client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // Returns the initialized Supabase client.
    return client;
  }


  // Returns the existing Supabase client or initializes it if necessary.
  const db = () => client || init();


  // Converts the Supabase user object into a simpler public user object.
  // This keeps only the user ID, name and email.
  const publicUser = u => ({
    id: u.id,

    // Gets the name from user metadata.
    // If unavailable, uses the email username.
    // If both are unavailable, uses 'User'.
    name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',

    // Stores the user's email address.
    email: u.email
  });


  // Registers a new user in Supabase Authentication.
  // Takes the user's name, email and password.
  async function register(name, email, password) {

    // Calls Supabase signup API to create a new account.
    const { data, error } = await db().auth.signUp({

      // Removes extra spaces and converts email to lowercase.
      email: email.trim().toLowerCase(),

      // Sends the password for account registration.
      password,

      // Stores additional user information in user metadata.
      options: {
        data: {
          // Uses the entered name or email username as the default name.
          name: name.trim() || email.split('@')[0]
        }
      }
    });

    // Throws the error if registration fails.
    if (error) throw error;

    // Checks whether signup returned an active session.
    // If no session exists, email confirmation may be required.
    if (!data.session)
      throw new Error('Account created. For today’s demo, disable Email Confirmations in Supabase Authentication settings, then sign up again.');

    // Converts the Supabase user into the application's user format.
    currentUser = publicUser(data.user);

    // Returns the registered user's information.
    return currentUser;
  }


  // Logs in an existing user using email and password.
  async function login(email, password) {

    // Calls Supabase password-based authentication.
    const { data, error } = await db().auth.signInWithPassword({

      // Normalizes the email before login.
      email: email.trim().toLowerCase(),

      // Sends the user's password.
      password
    });

    // Throws an error if login fails.
    if (error) throw error;

    // Stores the authenticated user's information.
    currentUser = publicUser(data.user);

    // Returns the logged-in user's information.
    return currentUser;
  }


  // Logs out the currently authenticated user.
  async function logout() {

    // Calls Supabase signOut to end the authentication session.
    const { error } = await db().auth.signOut();

    // Throws an error if logout fails.
    if (error) throw error;

    // Clears the current user's information from memory.
    currentUser = null;
  }


  // Checks whether a user session already exists.
  async function getSessionUser() {

    // Retrieves the current authentication session from Supabase.
    const { data, error } = await db().auth.getSession();

    // Throws an error if session retrieval fails.
    if (error) throw error;

    // Checks whether a session and user exist.
    // If found, converts the user into the application's format.
    // Otherwise, sets currentUser to null.
    currentUser = data.session?.user
      ? publicUser(data.session.user)
      : null;

    // Returns the current user or null.
    return currentUser;
  }


  // Loads tasks belonging to a particular user from Supabase.
  async function loadTasks(userId) {

    // Fetches task records from the tasks table.
    const { data, error } = await db()
      .from('tasks')

      // Selects all columns from the table.
      .select('*')

      // Retrieves only records matching the given user ID.
      .eq('user_id', userId)

      // Sorts tasks by creation date in ascending order.
      .order('created_at', { ascending: true });

    // Throws an error if task loading fails.
    if (error) throw error;

    // Converts database records into the format used by SmartTask.
    return (data || []).map(t => ({

      // Converts task ID into a JavaScript number.
      id: Number(t.id),

      // Copies the task title.
      title: t.title,

      // Uses an empty string if description is missing.
      description: t.description || '',

      // Uses medium priority if no priority is available.
      priority: t.priority || 'medium',

      // Copies the task due date.
      dueDate: t.due_date || '',

      // Copies the task category.
      category: t.category || '',

      // Copies the reminder value.
      reminder: t.reminder || '',

      // Converts the completed value into a Boolean.
      completed: !!t.completed,

      // Converts completion date into a JavaScript timestamp.
      // Returns null if the task has not been completed.
      completedAt: t.completed_at
        ? new Date(t.completed_at).getTime()
        : null,

      // Converts creation date into a timestamp.
      // Uses the task ID as a fallback value.
      createdAt: t.created_at
        ? new Date(t.created_at).getTime()
        : Number(t.id)
    }));
  }


  // Saves or synchronizes the user's complete task list with Supabase.
  function saveTasks(userId, tasks) {

    // If no user ID exists, return an already resolved Promise.
    if (!userId) return Promise.resolve();

    // Converts application task objects into database table records.
    const rows = (tasks || []).map(t => ({

      // Converts task ID into a string for database storage.
      id: String(t.id),

      // Associates every task with its owner.
      user_id: userId,

      // Stores task title or a default title.
      title: String(t.title || 'Untitled task'),

      // Stores the task description.
      description: t.description || '',

      // Accepts only low, medium or high priority.
      // Uses medium if the supplied value is invalid.
      priority: ['low','medium','high'].includes(t.priority)
        ? t.priority
        : 'medium',

      // Maps application dueDate to database due_date.
      due_date: t.dueDate || null,

      // Stores the task category.
      category: t.category || '',

      // Stores the reminder information.
      reminder: t.reminder || null,

      // Stores whether the task is completed.
      completed: !!t.completed,

      // Converts completion timestamp into ISO date format.
      // Stores null if the task is not completed or has no completion time.
      completed_at: t.completed && t.completedAt
        ? new Date(t.completedAt).toISOString()
        : null
    }));


    // Adds this save operation after the previous operation in the queue.
    // This helps prevent overlapping database synchronization operations.
    const operation = saveQueue.then(async () => {

      // Gets the Supabase database client.
      const c = db();

      // Checks whether the user has any tasks to save.
      if (rows.length) {

        // Inserts new records or updates existing records.
        // onConflict specifies that matching IDs should be updated.
        const { error } = await c.from('tasks')
          .upsert(rows, { onConflict: 'id' });

        // Stops synchronization if insertion or update fails.
        if (error) throw error;

        // Collects the IDs of all tasks currently present in the application.
        const ids = rows.map(r => r.id);

        // Retrieves existing task IDs belonging to this user.
        const { data: existing, error: readError } = await c
          .from('tasks')
          .select('id')
          .eq('user_id', userId);

        // Throws an error if existing task retrieval fails.
        if (readError) throw readError;

        // Finds database task IDs that are no longer present
        // in the application's current task list.
        const stale = (existing || [])
          .map(x => x.id)
          .filter(id => !ids.includes(String(id)));

        // Deletes outdated records if any are found.
        if (stale.length) {

          // Deletes only the outdated tasks belonging to this user.
          const { error: deleteError } = await c
            .from('tasks')
            .delete()
            .eq('user_id', userId)
            .in('id', stale);

          // Throws an error if deletion fails.
          if (deleteError) throw deleteError;
        }

      } else {

        // If the task list is empty, deletes all tasks belonging to this user.
        const { error } = await c.from('tasks')
          .delete()
          .eq('user_id', userId);

        // Throws an error if deletion fails.
        if (error) throw error;
      }

      // Clears the previous synchronization error after successful saving.
      lastSaveError = null;
    });


    // Maintains the queue even if an operation fails.
    // Stores the error and logs it in the browser console.
    saveQueue = operation.catch(err => {

      // Stores the latest database synchronization error.
      lastSaveError = err;

      // Prints the error for debugging.
      console.error('Task sync failed:', err);
    });

    // Returns the original operation so the caller can detect failures.
    return operation;
  }


  // Waits for all queued task synchronization operations to finish.
  async function flushTasks() {

    // Waits until the current save queue is completed.
    await saveQueue;

    // Throws the last recorded error if synchronization failed.
    if (lastSaveError) throw lastSaveError;
  }


  // Sets the current user information manually.
  function setSession(user) {
    currentUser = user;
  }


  // Clears the current user information manually.
  function clearSession() {
    currentUser = null;
  }


  // Exposes selected functions so other JavaScript files can use LocalDB.
  return {
    init,
    register,
    login,
    logout,
    getSessionUser,
    loadTasks,
    saveTasks,
    flushTasks,
    setSession,
    clearSession
  };

})(); // Immediately executes the function and creates the LocalDB object.
