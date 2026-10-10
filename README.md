# Smart To-Do List & Task Management System

**PBL Project | Data Structures in C and OOPs with C++**  
**Team ID:** DSCPP-III-2026-T302  
**Team Name:** Elite Minds  
**Department:** Computer Science & Engineering, Graphic Era (Deemed to be University), Dehradun  
**Academic Session:** 2026–27

## Team Members
- **Suhail Khan** — 2510360053 (Team Lead / DSA)
- **Shan Mohammad** — 2510011938 (C++ Development)
- **Annant Rastogi** — 251012477 (Testing / Documentation)

**Mentor:** Ms. Nishtha Bhatt

## Project Overview
The Smart To-Do List & Task Management System is a menu-driven console application for organizing daily tasks, deadlines, categories, and priorities. It demonstrates how data structures and algorithms can support practical task-management operations.

Each task stores an ID, title, description, category, deadline, priority, and completion status. The application supports creating, displaying, updating, deleting, searching, sorting, completing, and prioritizing tasks. File handling is used to save task information between runs.

## Features
- Add, display, update, and delete tasks
- Display all, pending, or completed tasks
- Mark a task completed or pending
- Search tasks by title
- Sort tasks by priority or deadline
- Process tasks in FIFO order using a queue
- Undo selected task-list operations using a stack
- C++ version: show the highest-priority pending task and search by category
- Save and load tasks using local text files

## Data Structures & Algorithms Used

| Concept | Purpose |
|---|---|
| Structure and pointers (C) | Represent tasks and connect linked-list nodes |
| Linked list (C) | Dynamic task storage and traversal |
| Vector (C++) | Main collection of task records |
| Linked list (`list`) (C++) | Maintain a linked-list view of task IDs |
| Queue | Process queued tasks in FIFO order |
| Stack | Store task-list snapshots for Undo |
| Priority queue / heap (C++) | Identify a high-priority pending task |
| Map / hashing-style index (C++) | Find tasks by category |
| Linear search | Find task IDs and titles |
| Sorting | Order tasks by priority or deadline |
| File handling | Persist tasks between program runs |

## Project Files
- `smart_todo.c` — C implementation using a linked list, queue, undo stack, searching, sorting, and file handling.
- `smart_todo.cpp` — C++ implementation using STL containers, task management, searching, sorting, priority handling, undo, and file handling.
- `README.md` — Project documentation.

## Requirements
- GCC for the C program
- A C++17-compatible compiler (G++ recommended)
- VS Code, Code::Blocks, or another C/C++ compatible IDE (optional)

## Compile and Run

### C version
Linux/macOS:
```bash
gcc smart_todo.c -o smart_todo
./smart_todo
```

Windows (MinGW):
```powershell
gcc smart_todo.c -o smart_todo.exe
.\smart_todo.exe
```

### C++ version
Linux/macOS:
```bash
g++ smart_todo.cpp -std=c++17 -o smart_todo_cpp
./smart_todo_cpp
```

Windows (MinGW):
```powershell
g++ smart_todo.cpp -std=c++17 -o smart_todo_cpp.exe
.\smart_todo_cpp.exe
```

Run each program from the folder where you want its data file to be stored. The C program uses `tasks_c.txt`; the C++ program uses `tasks_cpp.txt`.

## How to Use
1. Run either the C or C++ executable.
2. Choose an option from the menu.
3. Enter task details when adding a task. Use priority `1` for Low, `2` for Medium, and `3` for High.
4. Use the task ID shown by the program for updating, deleting, completing, or queueing a task.
5. Save tasks from the menu or exit; the program also saves on exit.

## Scope and Limitations
- This is a single-user, console-based academic prototype.
- Deadlines are stored as text in `YYYY-MM-DD` format. Enter dates consistently for correct lexical sorting.
- Task titles, descriptions, and categories should not contain the file delimiter (`|`) in the C version or tab characters in the C++ version.
- Cloud synchronization, multiple-user access, online notifications, and integration with the website UI are outside this console prototype's current scope.
- The C and C++ implementations are separate demonstrations; their data files are separate and are not shared automatically.

## Development Methodology
1. Requirement analysis
2. System design and DSA mapping
3. Implementation
4. Testing and debugging
5. Evaluation and demonstration

## Project Roadmap
- **Phase I:** Proposal and design
- **Phase II:** Development
- **Phase III:** Final implementation, testing, and demonstration

## References
- Data Structures and Algorithms course material
- C/C++ programming and STL documentation
- Standard references for searching and sorting algorithms
- Project requirement and design notes

---
*Developed for the Project-Based Learning (PBL) course.*
