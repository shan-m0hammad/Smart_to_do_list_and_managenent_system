/* Supabase adapter: keeps the old LocalDB interface so the existing app needs minimal changes. */
const LocalDB = (() => {
  let client;
  let currentUser = null;
  let saveQueue = Promise.resolve();
  let lastSaveError = null;

  function init() {
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY ||
        window.SUPABASE_URL.includes('PASTE_') || window.SUPABASE_ANON_KEY.includes('PASTE_')) {
      throw new Error('Supabase credentials missing. Add Project URL and Publishable key in config.js.');
    }
    client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return client;
  }
  const db = () => client || init();
  const publicUser = u => ({ id: u.id, name: u.user_metadata?.name || u.email?.split('@')[0] || 'User', email: u.email });

  async function register(name, email, password) {
    const { data, error } = await db().auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { data: { name: name.trim() || email.split('@')[0] } }
    });
    if (error) throw error;
    if (!data.session) throw new Error('Account created. For today’s demo, disable Email Confirmations in Supabase Authentication settings, then sign up again.');
    currentUser = publicUser(data.user);
    return currentUser;
  }
  async function login(email, password) {
    const { data, error } = await db().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    currentUser = publicUser(data.user);
    return currentUser;
  }
  async function logout() {
    const { error } = await db().auth.signOut();
    if (error) throw error;
    currentUser = null;
  }
  async function getSessionUser() {
    const { data, error } = await db().auth.getSession();
    if (error) throw error;
    currentUser = data.session?.user ? publicUser(data.session.user) : null;
    return currentUser;
  }
  async function loadTasks(userId) {
    const { data, error } = await db().from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(t => ({
      id: Number(t.id), title: t.title, description: t.description || '', priority: t.priority || 'medium',
      dueDate: t.due_date || '', category: t.category || '', reminder: t.reminder || '',
      completed: !!t.completed, completedAt: t.completed_at ? new Date(t.completed_at).getTime() : null,
      createdAt: t.created_at ? new Date(t.created_at).getTime() : Number(t.id)
    }));
  }
  function saveTasks(userId, tasks) {
    if (!userId) return Promise.resolve();
    const rows = (tasks || []).map(t => ({
      id: String(t.id), user_id: userId, title: String(t.title || 'Untitled task'),
      description: t.description || '', priority: ['low','medium','high'].includes(t.priority) ? t.priority : 'medium',
      due_date: t.dueDate || null, category: t.category || '', reminder: t.reminder || null,
      completed: !!t.completed, completed_at: t.completed && t.completedAt ? new Date(t.completedAt).toISOString() : null
    }));
    const operation = saveQueue.then(async () => {
      const c = db();
      if (rows.length) {
        const { error } = await c.from('tasks').upsert(rows, { onConflict: 'id' });
        if (error) throw error;
        const ids = rows.map(r => r.id);
        const { data: existing, error: readError } = await c.from('tasks').select('id').eq('user_id', userId);
        if (readError) throw readError;
        const stale = (existing || []).map(x => x.id).filter(id => !ids.includes(String(id)));
        if (stale.length) {
          const { error: deleteError } = await c.from('tasks').delete().eq('user_id', userId).in('id', stale);
          if (deleteError) throw deleteError;
        }
      } else {
        const { error } = await c.from('tasks').delete().eq('user_id', userId);
        if (error) throw error;
      }
      lastSaveError = null;
    });
    saveQueue = operation.catch(err => {
      lastSaveError = err;
      console.error('Task sync failed:', err);
    });
    return operation;
  }
  async function flushTasks() {
    await saveQueue;
    if (lastSaveError) throw lastSaveError;
  }
  function setSession(user) { currentUser = user; }
  function clearSession() { currentUser = null; }
  return { init, register, login, logout, getSessionUser, loadTasks, saveTasks, flushTasks, setSession, clearSession };
})();
