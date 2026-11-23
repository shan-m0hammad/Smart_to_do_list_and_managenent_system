
/* SmartTask DSA module: Stack (LIFO) for Undo operations (C). */

#include <stdio.h>  // Includes standard input/output functions.

#define MAX 100  // Defines the maximum capacity of the stack.

// Creates a structure for storing task IDs in the Undo Stack.
typedef struct {
    int taskId[MAX];  // Array that stores task IDs.
    int top;          // Stores the index of the top element.
} UndoStack;

// Initializes the stack.
void init(UndoStack *s) {
    s->top = -1;  // -1 indicates that the stack is empty.
}

// Checks whether the stack is empty.
int isEmpty(const UndoStack *s) {
    return s->top == -1;  // Returns 1 if empty, otherwise 0.
}

// Inserts a task ID into the stack. This is called PUSH.
int push(UndoStack *s, int id) {

    // Checks whether the stack is full.
    if (s->top == MAX - 1)
        return 0;  // Returns 0 if the stack is full.

    // Increases top and inserts the task ID.
    s->taskId[++s->top] = id;

    return 1;  // Returns 1 if insertion is successful.
}

// Removes the top task ID from the stack. This is called POP.
int pop(UndoStack *s, int *id) {

    // Checks whether the stack is empty.
    if (isEmpty(s))
        return 0;  // Returns 0 if the stack is empty.

    // Retrieves the top task ID and decreases top.
    *id = s->taskId[s->top--];

    return 1;  // Returns 1 if removal is successful.
}

// Main function: Program execution starts here.
int main(void) {

    UndoStack undo;  // Creates a stack variable.
    int id;          // Stores the task ID removed from the stack.

    init(&undo);  // Initializes the stack.

    // Inserts three task IDs into the stack.
    push(&undo, 501);
    push(&undo, 502);
    push(&undo, 503);

    // Displays the heading.
    puts("Undo order (Last In, First Out):");

    // Removes elements until the stack becomes empty.
    while (pop(&undo, &id)) {

        // Displays the removed task ID.
        printf("Restore task %d\n", id);
    }

    return 0;  // Ends the program successfully.
}
