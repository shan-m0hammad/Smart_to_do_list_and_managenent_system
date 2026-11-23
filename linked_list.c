/* SmartTask DSA module: Singly Linked List for task records (C). */

// Header file for input and output functions like printf() and puts()
#include <stdio.h>

// Header file for memory allocation functions like malloc() and free()
#include <stdlib.h>

// Header file for string handling functions
#include <string.h>

// Creating a structure named TaskNode
// Each node stores one task's ID, title and address of the next node
typedef struct TaskNode {

    int id;                 // Stores the unique ID of the task

    char title[80];         // Stores the task title (maximum 79 characters + null character)

    struct TaskNode *next;  // Pointer that stores the address of the next node

} TaskNode;                 // Giving the structure an alias name TaskNode


// Function to insert a new task at the beginning of the linked list
// head = current first node, id = task ID, title = task name
// Returns the updated head pointer
TaskNode *insertTask(TaskNode *head, int id, const char *title) {

    // Dynamically allocating memory for a new task node
    TaskNode *node = (TaskNode *)malloc(sizeof(TaskNode));

    // Checking whether memory allocation was successful
    // If memory is not available, return the existing list
    if (!node) return head;

    // Assigning the task ID to the new node
    node->id = id;

    // Copying the task title safely into the title array
    snprintf(node->title, sizeof(node->title), "%s", title);

    // Connecting the new node to the previous first node
    node->next = head;

    // Returning the new node because it is now the first node
    return node;
}


// Function to delete a task using its ID
// head = first node of the list, id = ID of the task to delete
TaskNode *deleteTask(TaskNode *head, int id) {

    // cur points to the current node
    // prev points to the previous node
    TaskNode *cur = head, *prev = NULL;

    // Searching for the node having the given ID
    // Loop continues until the node is found or list ends
    while (cur && cur->id != id) {

        prev = cur;       // Moving previous pointer to current node
        cur = cur->next;  // Moving current pointer to the next node
    }

    // If task is not found, return the original list
    if (!cur) return head;

    // If previous node exists, connect it to the next node
    if (prev)
        prev->next = cur->next;

    // Otherwise, the first node is being deleted
    else
        head = cur->next;

    // Freeing the memory occupied by the deleted node
    free(cur);

    // Returning the updated head pointer
    return head;
}


// Function to display all tasks in the linked list
// const means this function will not modify the task nodes
void displayTasks(const TaskNode *head) {

    // Traversing the linked list until the end
    while (head) {

        // Printing task ID and task title
        printf("[%d] %s\n", head->id, head->title);

        // Moving to the next node
        head = head->next;
    }
}


// Main function: execution of the program starts here
int main(void) {

    // Creating an empty linked list
    // NULL means the list currently has no nodes
    TaskNode *tasks = NULL;

    // Inserting the first task
    tasks = insertTask(tasks, 103, "Prepare project report");

    // Inserting the second task
    tasks = insertTask(tasks, 102, "Revise linked list");

    // Inserting the third task
    tasks = insertTask(tasks, 101, "Complete assignment");

    // Printing the heading
    puts("Task list (traversal):");

    // Calling the function to display all tasks
    displayTasks(tasks);

    // Deleting the task having ID 102
    tasks = deleteTask(tasks, 102);

    // Printing the heading after deletion
    puts("After deleting task 102:");

    // Displaying the updated task list
    displayTasks(tasks);

    // Deleting all remaining nodes one by one
    // This prevents memory leakage
    while (tasks)
        tasks = deleteTask(tasks, tasks->id);

    // Returning 0 indicates successful program execution
    return 0;
}
