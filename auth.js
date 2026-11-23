/* Supabase authentication and per-user task loading. */
(function () {
  let currentUser = null;
  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.innerHTML = `
    <div class="auth-card">
      <div class="auth-logo">✓ Smart<span>Task</span></div>
      <div class="auth-tabs"><button type="button" id="tabSignin" class="active">Sign in</button><button type="button" id="tabSignup">Sign up</button></div>
      <form id="authForm" autocomplete="on">
        <input id="authName" type="text" placeholder="Your name" autocomplete="name" hidden>
        <input id="authEmail" type="email" placeholder="Email" autocomplete="email" required>
        <input id="authPassword" type="password" placeholder="Password (min 6 characters)" autocomplete="current-password" minlength="6" required>
        <button class="primary-btn" id="authSubmit" type="submit">Sign in</button>
        <p id="authMsg" class="auth-msg" role="alert"></p>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  const el = id => document.getElementById(id);
  let mode = 'signin';
  function msg(s, ok=false) { el('authMsg').textContent = s; el('authMsg').classList.toggle('ok', ok); }
  function setMode(m) {
    mode = m;
    el('tabSignin').classList.toggle('active', m === 'signin');
    el('tabSignup').classList.toggle('active', m === 'signup');
    el('authName').hidden = m !== 'signup';
    el('authSubmit').textContent = m === 'signin' ? 'Sign in' : 'Create account';
    el('authPassword').autocomplete = m === 'signin' ? 'current-password' : 'new-password';
    msg('');
  }
  el('tabSignin').onclick = () => setMode('signin');
  el('tabSignup').onclick = () => setMode('signup');

  const userBox = document.createElement('div');
  userBox.className = 'user-box';
  userBox.innerHTML = `<div class="user-name" id="userName"></div><div class="user-email" id="userEmail"></div><button class="secondary-btn" id="logoutBtn" type="button">Log out</button>`;
  document.getElementById('sidebar').appendChild(userBox);

  saveTasks = function () { if (currentUser) return LocalDB.saveTasks(currentUser.id, tasks); return Promise.resolve(); };
  const originalShowPage = showPage;
  showPage = function (page) {
    originalShowPage(page);
    if (currentUser && page === 'dashboard') {
      const h = el('pageTitle');
      h.textContent = h.textContent.replace(/^Hey\s*!/, 'Hey ' + currentUser.name + '!');
    }
  };
  async function startSession(user) {
    currentUser = user;
    LocalDB.setSession(user);
    el('userName').textContent = user.name;
    el('userEmail').textContent = user.email;
    try {
      tasks = await LocalDB.loadTasks(user.id);
      overlay.style.display = 'none';
      render();
      showPage('dashboard');
    } catch (err) {
      msg('Could not load tasks: ' + err.message);
      overlay.style.display = 'flex';
    }
  }
  el('authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = el('authSubmit'); btn.disabled = true; msg('Please wait...', true);
    try {
      const user = mode === 'signup'
        ? await LocalDB.register(el('authName').value, el('authEmail').value, el('authPassword').value)
        : await LocalDB.login(el('authEmail').value, el('authPassword').value);
      await startSession(user);
    } catch (err) { msg(err.message || 'Something went wrong'); }
    finally { btn.disabled = false; }
  });
  el('logoutBtn').onclick = async () => {
    const btn = el('logoutBtn');
    btn.disabled = true;
    try {
      await LocalDB.flushTasks();
      await LocalDB.logout();
      currentUser = null;
      tasks = [];
      render();
      el('authPassword').value = '';
      overlay.style.display = 'flex';
      setMode('signin');
    } catch (err) {
      alert('Your latest tasks could not be synced. Please check your internet/database connection and try logging out again. ' + (err.message || ''));
    } finally { btn.disabled = false; }
  };
  (async () => {
    try {
      LocalDB.init();
      const user = await LocalDB.getSessionUser();
      if (user) await startSession(user);
    } catch (err) { msg(err.message || 'Supabase connection failed'); }
  })();
})();
