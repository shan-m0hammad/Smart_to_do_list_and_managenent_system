/*
 * Smart To-Do List & Task Management System (C++)
 * DSA concepts: vector, linked list, queue, priority_queue, stack, map,
 * searching, sorting, and file handling.
 * Compile: g++ smart_todo.cpp -std=c++17 -o smart_todo
 * Run:     ./smart_todo   (Windows: smart_todo.exe)
 */
#include <algorithm>
#include <fstream>
#include <iostream>
#include <list>
#include <map>
#include <queue>
#include <stack>
#include <string>
#include <vector>
#include <limits>

using namespace std;

struct Task {
    int id{};
    string title, description, category, deadline;
    int priority{1}; // 1=Low, 2=Medium, 3=High
    bool completed{false};
};

class TaskManager {
private:
    vector<Task> tasks;                 // Main task collection
    list<int> taskOrder;                // Linked-list view of task IDs
    queue<int> processingQueue;         // FIFO processing
    priority_queue<pair<int, int>> highPriority; // (priority, task ID)
    stack<vector<Task>> undoStack;      // Snapshots for undo
    map<string, vector<int>> categoryIndex;
    int nextId = 1;
    const string filename = "tasks_cpp.txt";

    static string priorityName(int p) {
        if (p == 3) return "High";
        if (p == 2) return "Medium";
        return "Low";
    }
    Task* findById(int id) {
        for (auto &task : tasks) if (task.id == id) return &task;
        return nullptr;
    }
    const Task* findById(int id) const {
        for (const auto &task : tasks) if (task.id == id) return &task;
        return nullptr;
    }
    void saveUndo() { undoStack.push(tasks); }
    void rebuildIndexes() {
        taskOrder.clear();
        categoryIndex.clear();
        highPriority = priority_queue<pair<int, int>>();
        for (const auto &t : tasks) {
            taskOrder.push_back(t.id);
            categoryIndex[t.category].push_back(t.id);
            if (!t.completed) highPriority.push({t.priority, -t.id});
        }
    }
    static void printTask(const Task &t) {
        cout << "\nID: " << t.id << " | Title: " << t.title
             << "\nPriority: " << priorityName(t.priority)
             << " | Deadline: " << t.deadline
             << " | Status: " << (t.completed ? "Completed" : "Pending")
             << "\nCategory: " << t.category
             << "\nDescription: " << t.description << "\n";
    }
    static string readText(const string &prompt) {
        cout << prompt;
        string value;
        getline(cin, value);
        return value;
    }
    static int readInt(const string &prompt, int low, int high) {
        while (true) {
            cout << prompt;
            int value;
            if (cin >> value && value >= low && value <= high) {
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                return value;
            }
            cout << "Invalid input. Enter a number from " << low << " to " << high << ".\n";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
        }
    }
public:
    TaskManager() { loadTasks(); }
    ~TaskManager() { saveTasks(); }

    void addTask() {
        Task t;
        t.id = nextId++;
        t.title = readText("Task title: ");
        if (t.title.empty()) { cout << "Title cannot be empty.\n"; --nextId; return; }
        t.description = readText("Description: ");
        t.category = readText("Category: ");
        t.deadline = readText("Deadline (YYYY-MM-DD): ");
        t.priority = readInt("Priority (1=Low, 2=Medium, 3=High): ", 1, 3);
        saveUndo();
        tasks.push_back(t);
        rebuildIndexes();
        cout << "Task added with ID " << t.id << ".\n";
    }
    void displayTasks(int mode = 0) const {
        int count = 0;
        for (const auto &t : tasks) {
            if (mode == 0 || (mode == 1 && !t.completed) || (mode == 2 && t.completed)) {
                printTask(t); ++count;
            }
        }
        if (!count) cout << "No matching tasks found.\n";
    }
    void updateTask() {
        int id = readInt("Task ID to update: ", 1, 1000000000);
        Task *t = findById(id);
        if (!t) { cout << "Task not found.\n"; return; }
        saveUndo();
        string value = readText("New title (blank keeps current): ");
        if (!value.empty()) t->title = value;
        value = readText("New description (blank keeps current): ");
        if (!value.empty()) t->description = value;
        value = readText("New category (blank keeps current): ");
        if (!value.empty()) t->category = value;
        value = readText("New deadline YYYY-MM-DD (blank keeps current): ");
        if (!value.empty()) t->deadline = value;
        t->priority = readInt("New priority (1=Low, 2=Medium, 3=High): ", 1, 3);
        rebuildIndexes();
        cout << "Task updated.\n";
    }
    void deleteTask() {
        int id = readInt("Task ID to delete: ", 1, 1000000000);
        auto it = find_if(tasks.begin(), tasks.end(), [id](const Task &t) { return t.id == id; });
        if (it == tasks.end()) { cout << "Task not found.\n"; return; }
        saveUndo();
        tasks.erase(it);
        rebuildIndexes();
        cout << "Task deleted.\n";
    }
    void toggleComplete() {
        int id = readInt("Task ID: ", 1, 1000000000);
        Task *t = findById(id);
        if (!t) { cout << "Task not found.\n"; return; }
        saveUndo();
        t->completed = !t->completed;
        rebuildIndexes();
        cout << "Task marked " << (t->completed ? "completed" : "pending") << ".\n";
    }
    void searchTasks() const {
        string query = readText("Search title (case-sensitive): ");
        int count = 0;
        for (const auto &t : tasks) {
            if (t.title.find(query) != string::npos) { printTask(t); ++count; }
        }
        if (!count) cout << "No task matched that title.\n";
    }
    void sortTasks() {
        int mode = readInt("Sort by: 1=Priority (high first), 2=Deadline (earliest first): ", 1, 2);
        saveUndo();
        if (mode == 1) {
            stable_sort(tasks.begin(), tasks.end(), [](const Task &a, const Task &b) {
                return a.priority > b.priority;
            });
        } else {
            stable_sort(tasks.begin(), tasks.end(), [](const Task &a, const Task &b) {
                return a.deadline < b.deadline;
            });
        }
        rebuildIndexes();
        cout << "Tasks sorted.\n";
        displayTasks();
    }
    void enqueueTask() {
        int id = readInt("Task ID to enqueue: ", 1, 1000000000);
        if (!findById(id)) { cout << "Task not found.\n"; return; }
        processingQueue.push(id);
        cout << "Task added to FIFO queue.\n";
    }
    void processQueue() {
        if (processingQueue.empty()) { cout << "Processing queue is empty.\n"; return; }
        int id = processingQueue.front();
        processingQueue.pop();
        const Task *t = findById(id);
        if (t) printTask(*t);
        else cout << "Queued task was deleted (ID " << id << ").\n";
    }
    void showHighestPriority() {
        while (!highPriority.empty()) {
            auto entry = highPriority.top();
            const Task *t = findById(-entry.second);
            if (t && !t->completed && t->priority == entry.first) {
                cout << "Highest-priority pending task:\n";
                printTask(*t);
                return;
            }
            highPriority.pop();
        }
        cout << "No pending tasks.\n";
    }
    void showCategory() const {
        string category = readText("Category to search: ");
        auto it = categoryIndex.find(category);
        if (it == categoryIndex.end()) { cout << "No tasks in this category.\n"; return; }
        for (int id : it->second) {
            const Task *t = findById(id);
            if (t) printTask(*t);
        }
    }
    void undo() {
        if (undoStack.empty()) { cout << "Nothing to undo.\n"; return; }
        tasks = undoStack.top();
        undoStack.pop();
        int maxId = 0;
        for (const auto &t : tasks) maxId = max(maxId, t.id);
        nextId = max(nextId, maxId + 1);
        rebuildIndexes();
        cout << "Last task-list operation undone.\n";
    }
    void saveTasks() const {
        ofstream file(filename);
        if (!file) { cerr << "Could not save " << filename << ".\n"; return; }
        for (const auto &t : tasks) {
            file << t.id << '\t' << t.title << '\t' << t.description << '\t'
                 << t.category << '\t' << t.deadline << '\t'
                 << t.priority << '\t' << t.completed << '\n';
        }
    }
    void loadTasks() {
        ifstream file(filename);
        if (!file) return;
        tasks.clear();
        Task t;
        while (file >> t.id) {
            file.ignore(numeric_limits<streamsize>::max(), '\t');
            getline(file, t.title, '\t');
            getline(file, t.description, '\t');
            getline(file, t.category, '\t');
            getline(file, t.deadline, '\t');
            file >> t.priority >> t.completed;
            file.ignore(numeric_limits<streamsize>::max(), '\n');
            tasks.push_back(t);
            nextId = max(nextId, t.id + 1);
        }
        rebuildIndexes();
    }
    void run() {
        int choice;
        do {
            cout << "\n==== SMART TO-DO LIST (C++ / DSA) ====\n"
                 << "1 Add task\n2 Display all tasks\n3 Display pending tasks\n4 Display completed tasks\n"
                 << "5 Update task\n6 Delete task\n7 Mark complete/pending\n8 Search by title\n"
                 << "9 Sort tasks\n10 Enqueue task for FIFO processing\n11 Process next queued task\n"
                 << "12 Show highest-priority pending task\n13 Search by category (map)\n14 Undo last task-list operation\n"
                 << "15 Save tasks\n0 Save and exit\n";
            choice = readInt("Choose: ", 0, 15);
            switch (choice) {
                case 1: addTask(); break;
                case 2: displayTasks(); break;
                case 3: displayTasks(1); break;
                case 4: displayTasks(2); break;
                case 5: updateTask(); break;
                case 6: deleteTask(); break;
                case 7: toggleComplete(); break;
                case 8: searchTasks(); break;
                case 9: sortTasks(); break;
                case 10: enqueueTask(); break;
                case 11: processQueue(); break;
                case 12: showHighestPriority(); break;
                case 13: showCategory(); break;
                case 14: undo(); break;
                case 15: saveTasks(); cout << "Tasks saved.\n"; break;
                case 0: saveTasks(); cout << "Goodbye.\n"; break;
            }
        } while (choice != 0);
    }
};

int main() {
    TaskManager manager;
    manager.run();
    return 0;
}
