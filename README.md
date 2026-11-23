SMARTTASK - SUPABASE FINAL DEMO BUILD

WHAT CHANGED
- Replaced browser-only local login with Supabase Auth.
- Tasks are stored in Supabase PostgreSQL and filtered by the logged-in user.
- Existing task UI and task actions are retained.
- Added C/C++ source modules for the DSA viva/demo:
  * C: singly linked list (insert/delete/traverse)
  * C: stack (LIFO undo)
  * C++: priority queue / max heap
  * C++: sorting and binary search

SETUP (DO THESE IN ORDER)
1. Open Supabase Dashboard and select your existing project.
2. Go to SQL Editor -> New query. Open supabase_schema.sql from this folder, copy all SQL, paste it, and click Run.
3. Go to Project Settings -> API (or Connect). Copy the Project URL and the Publishable key (or legacy anon public key).
4. Open config.js and replace the two PASTE... values:
   window.SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
   window.SUPABASE_ANON_KEY = "YOUR-PUBLISHABLE-OR-ANON-KEY";
   Never use the secret/service_role key in browser code.
5. For a same-day classroom demo: Supabase Dashboard -> Authentication -> Sign In / Providers -> Email. Turn OFF Confirm email, save, then create a fresh test account in SmartTask. This avoids waiting for an email confirmation. You can turn it back on after the demo.
6. Open this folder in VS Code. Run index.html with Live Server. Internet is needed for Supabase JS CDN and Supabase connection.
7. Sign up with a test email/password, add a task, log out, then sign in again. The task should still be present.
8. Create a second account and verify it sees only its own tasks.

DATABASE
- Table: public.tasks
- RLS is enabled. Each row is restricted to auth.uid() = user_id.
- The SQL script creates select/insert/update/delete policies.

DSA DEMO / COMPILE
C examples (GCC):
  gcc dsa/c/linked_list.c -o linked_list && ./linked_list
  gcc dsa/c/undo_stack.c -o undo_stack && ./undo_stack

C++ examples:
  g++ dsa/cpp/priority_queue.cpp -o priority_queue && ./priority_queue
  g++ dsa/cpp/sorting_searching.cpp -o sorting_searching && ./sorting_searching

IMPORTANT HONEST PROJECT NOTE
The C/C++ files are standalone DSA demonstration modules included with the project. The browser app itself is JavaScript and calls Supabase directly; these C/C++ programs are not compiled into the browser app using WebAssembly in this quick demo build.

TROUBLESHOOTING
- "Supabase credentials missing": check config.js and save it.
- Signup says account created but no session: disable Confirm email in Supabase Auth settings, then try a new email.
- "relation public.tasks does not exist": run supabase_schema.sql in SQL Editor.
- Tasks not saving: check browser console, ensure SQL ran, and ensure RLS policies exist.
- If you edit config.js while Live Server is open, refresh the page.
