/*
 * Smart To-Do List & Task Management System (C)
 * DSA concepts: linked list, queue, stack (undo), linear search, sorting, file handling.
 * Compile: gcc smart_todo.c -o smart_todo
 * Run:     ./smart_todo   (Windows: smart_todo.exe)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TITLE_LEN 100
#define CAT_LEN 50
#define DATE_LEN 20
#define DESC_LEN 200
#define DATA_FILE "tasks_c.txt"

typedef struct Task {
    int id;
    char title[TITLE_LEN];
    char description[DESC_LEN];
    char category[CAT_LEN];
    char deadline[DATE_LEN]; /* YYYY-MM-DD */
    int priority;             /* 1=Low, 2=Medium, 3=High */
    int completed;
    struct Task *next;
} Task;

typedef struct QueueNode {
    int taskId;
    struct QueueNode *next;
} QueueNode;

typedef struct UndoNode {
    Task *snapshot;
    struct UndoNode *next;
} UndoNode;

Task *head = NULL;
QueueNode *queueFront = NULL, *queueRear = NULL;
UndoNode *undoTop = NULL;
int nextId = 1;

void trimNewline(char *s) {
    s[strcspn(s, "\n")] = '\0';
}
void readLine(const char *prompt, char *buffer, int size) {
    printf("%s", prompt);
    if (fgets(buffer, size, stdin) == NULL) buffer[0] = '\0';
    trimNewline(buffer);
}
int readInt(const char *prompt, int min, int max) {
    char buffer[80], *end;
    long value;
    while (1) {
        readLine(prompt, buffer, sizeof(buffer));
        value = strtol(buffer, &end, 10);
        if (end != buffer && *end == '\0' && value >= min && value <= max) return (int)value;
        printf("Invalid input. Enter a number from %d to %d.\n", min, max);
    }
}
Task *copyTask(const Task *t) {
    if (!t) return NULL;
    Task *copy = (Task *)malloc(sizeof(Task));
    if (!copy) { printf("Memory allocation failed.\n"); exit(1); }
    *copy = *t;
    copy->next = NULL;
    return copy;
}
Task *cloneList(Task *source) {
    Task *newHead = NULL, *tail = NULL;
    while (source) {
        Task *node = copyTask(source);
        if (!newHead) newHead = node;
        else tail->next = node;
        tail = node;
        source = source->next;
    }
    return newHead;
}
void freeList(Task *node) {
    while (node) { Task *next = node->next; free(node); node = next; }
}
void saveUndo(void) {
    UndoNode *u = (UndoNode *)malloc(sizeof(UndoNode));
    if (!u) return;
    u->snapshot = cloneList(head);
    u->next = undoTop;
    undoTop = u;
}
void appendTask(Task *task) {
    task->next = NULL;
    if (!head) { head = task; return; }
    Task *cur = head;
    while (cur->next) cur = cur->next;
    cur->next = task;
}
Task *findTask(int id) {
    Task *cur = head;
    while (cur) { if (cur->id == id) return cur; cur = cur->next; }
    return NULL;
}
const char *priorityName(int p) {
    if (p == 3) return "High";
    if (p == 2) return "Medium";
    return "Low";
}
void printTask(const Task *t) {
    printf("\nID: %d | %s | Priority: %s | Deadline: %s | Status: %s\n",
           t->id, t->title, priorityName(t->priority), t->deadline,
           t->completed ? "Completed" : "Pending");
    printf("Category: %s\nDescription: %s\n", t->category, t->description);
}
void displayTasks(int mode) {
    Task *cur = head;
    int count = 0;
    while (cur) {
        if (mode == 0 || (mode == 1 && !cur->completed) || (mode == 2 && cur->completed)) {
            printTask(cur); count++;
        }
        cur = cur->next;
    }
    if (!count) printf("\nNo matching tasks found.\n");
}
void addTask(void) {
    Task *t = (Task *)calloc(1, sizeof(Task));
    if (!t) { printf("Memory allocation failed.\n"); return; }
    t->id = nextId++;
    readLine("Task title: ", t->title, sizeof(t->title));
    if (!t->title[0]) { printf("Title cannot be empty.\n"); free(t); return; }
    readLine("Description: ", t->description, sizeof(t->description));
    readLine("Category: ", t->category, sizeof(t->category));
    readLine("Deadline (YYYY-MM-DD): ", t->deadline, sizeof(t->deadline));
    t->priority = readInt("Priority (1=Low, 2=Medium, 3=High): ", 1, 3);
    saveUndo();
    appendTask(t);
    printf("Task added with ID %d.\n", t->id);
}
void updateTask(void) {
    int id = readInt("Enter task ID to update: ", 1, 1000000000);
    Task *t = findTask(id);
    if (!t) { printf("Task not found.\n"); return; }
    saveUndo();
    char buf[DESC_LEN];
    readLine("New title (leave blank to keep current): ", buf, sizeof(buf));
    if (buf[0]) snprintf(t->title, sizeof(t->title), "%.*s", (int)sizeof(t->title) - 1, buf);
    readLine("New description (blank keeps current): ", buf, sizeof(buf));
    if (buf[0]) snprintf(t->description, sizeof(t->description), "%s", buf);
    readLine("New category (blank keeps current): ", buf, sizeof(buf));
    if (buf[0]) snprintf(t->category, sizeof(t->category), "%.*s", (int)sizeof(t->category) - 1, buf);
    readLine("New deadline YYYY-MM-DD (blank keeps current): ", buf, sizeof(buf));
    if (buf[0]) snprintf(t->deadline, sizeof(t->deadline), "%.*s", (int)sizeof(t->deadline) - 1, buf);
    printf("Current priority: %s\n", priorityName(t->priority));
    t->priority = readInt("New priority (1=Low, 2=Medium, 3=High): ", 1, 3);
    printf("Task updated.\n");
}
void deleteTask(void) {
    int id = readInt("Enter task ID to delete: ", 1, 1000000000);
    Task *cur = head, *prev = NULL;
    while (cur && cur->id != id) { prev = cur; cur = cur->next; }
    if (!cur) { printf("Task not found.\n"); return; }
    saveUndo();
    if (prev) prev->next = cur->next; else head = cur->next;
    free(cur);
    printf("Task deleted.\n");
}
void toggleComplete(void) {
    int id = readInt("Enter task ID: ", 1, 1000000000);
    Task *t = findTask(id);
    if (!t) { printf("Task not found.\n"); return; }
    saveUndo();
    t->completed = !t->completed;
    printf("Task marked %s.\n", t->completed ? "completed" : "pending");
}
void searchTask(void) {
    char query[TITLE_LEN];
    readLine("Search title (case-sensitive): ", query, sizeof(query));
    int found = 0;
    for (Task *cur = head; cur; cur = cur->next) {
        if (strstr(cur->title, query)) { printTask(cur); found = 1; }
    }
    if (!found) printf("No task matched that title.\n");
}
void sortTasks(void) {
    int choice = readInt("Sort by: 1=Priority (high first), 2=Deadline (ascending): ", 1, 2);
    /* Linked-list bubble sort swaps task data but preserves links. */
    if (!head || !head->next) { printf("Not enough tasks to sort.\n"); return; }
    saveUndo();
    for (Task *end = NULL; end != head; ) {
        Task *cur = head;
        while (cur->next != end) {
            int swap = choice == 1 ? cur->priority < cur->next->priority
                                   : strcmp(cur->deadline, cur->next->deadline) > 0;
            if (swap) {
                int id = cur->id, priority = cur->priority, completed = cur->completed;
                char title[TITLE_LEN], desc[DESC_LEN], cat[CAT_LEN], date[DATE_LEN];
                strcpy(title, cur->title); strcpy(desc, cur->description);
                strcpy(cat, cur->category); strcpy(date, cur->deadline);
                cur->id = cur->next->id; cur->priority = cur->next->priority; cur->completed = cur->next->completed;
                strcpy(cur->title, cur->next->title); strcpy(cur->description, cur->next->description);
                strcpy(cur->category, cur->next->category); strcpy(cur->deadline, cur->next->deadline);
                cur->next->id = id; cur->next->priority = priority; cur->next->completed = completed;
                strcpy(cur->next->title, title); strcpy(cur->next->description, desc);
                strcpy(cur->next->category, cat); strcpy(cur->next->deadline, date);
            }
            cur = cur->next;
        }
        end = cur;
    }
    printf("Tasks sorted.\n");
    displayTasks(0);
}
void enqueueTask(void) {
    int id = readInt("Task ID to add to processing queue: ", 1, 1000000000);
    if (!findTask(id)) { printf("Task not found.\n"); return; }
    QueueNode *n = (QueueNode *)malloc(sizeof(QueueNode));
    if (!n) { printf("Memory allocation failed.\n"); return; }
    n->taskId = id; n->next = NULL;
    if (queueRear) queueRear->next = n; else queueFront = n;
    queueRear = n;
    printf("Task added to FIFO queue.\n");
}
void processQueue(void) {
    if (!queueFront) { printf("Processing queue is empty.\n"); return; }
    QueueNode *n = queueFront;
    queueFront = n->next;
    if (!queueFront) queueRear = NULL;
    printf("Next queued task: ");
    Task *t = findTask(n->taskId);
    if (t) printTask(t); else printf("Task ID %d no longer exists.\n", n->taskId);
    free(n);
}
void undoOperation(void) {
    if (!undoTop) { printf("Nothing to undo.\n"); return; }
    UndoNode *u = undoTop;
    undoTop = u->next;
    freeList(head);
    head = u->snapshot;
    u->snapshot = NULL;
    free(u);
    printf("Last task-list operation undone.\n");
}
void saveTasks(void) {
    FILE *f = fopen(DATA_FILE, "w");
    if (!f) { printf("Could not open %s for writing.\n", DATA_FILE); return; }
    for (Task *t = head; t; t = t->next)
        fprintf(f, "%d|%s|%s|%s|%s|%d|%d\n", t->id, t->title, t->description,
                t->category, t->deadline, t->priority, t->completed);
    fclose(f);
    printf("Tasks saved to %s.\n", DATA_FILE);
}
void loadTasks(void) {
    FILE *f = fopen(DATA_FILE, "r");
    if (!f) return;
    freeList(head); head = NULL; nextId = 1;
    char line[700];
    while (fgets(line, sizeof(line), f)) {
        Task *t = (Task *)calloc(1, sizeof(Task));
        if (!t) break;
        if (sscanf(line, "%d|%99[^|]|%199[^|]|%49[^|]|%19[^|]|%d|%d",
                   &t->id, t->title, t->description, t->category, t->deadline,
                   &t->priority, &t->completed) == 7) {
            appendTask(t);
            if (t->id >= nextId) nextId = t->id + 1;
        } else free(t);
    }
    fclose(f);
}
void cleanup(void) {
    freeList(head);
    while (undoTop) { UndoNode *u = undoTop; undoTop = u->next; freeList(u->snapshot); free(u); }
    while (queueFront) { QueueNode *q = queueFront; queueFront = q->next; free(q); }
}
int main(void) {
    loadTasks();
    int choice;
    do {
        printf("\n==== SMART TO-DO LIST (C / DSA) ====\n");
        printf("1 Add task\n2 Display all tasks\n3 Display pending tasks\n4 Display completed tasks\n");
        printf("5 Update task\n6 Delete task\n7 Mark complete/pending\n8 Search by title\n");
        printf("9 Sort tasks\n10 Enqueue task for FIFO processing\n11 Process next queued task\n");
        printf("12 Undo last task-list operation\n13 Save tasks\n0 Save and exit\n");
        choice = readInt("Choose: ", 0, 13);
        switch (choice) {
            case 1: addTask(); break;
            case 2: displayTasks(0); break;
            case 3: displayTasks(1); break;
            case 4: displayTasks(2); break;
            case 5: updateTask(); break;
            case 6: deleteTask(); break;
            case 7: toggleComplete(); break;
            case 8: searchTask(); break;
            case 9: sortTasks(); break;
            case 10: enqueueTask(); break;
            case 11: processQueue(); break;
            case 12: undoOperation(); break;
            case 13: saveTasks(); break;
            case 0: saveTasks(); break;
        }
    } while (choice != 0);
    cleanup();
    return 0;
}
