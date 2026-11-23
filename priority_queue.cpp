
/* SmartTask DSA module: Stack (LIFO) for Undo operations (C). */

#include <stdio.h>  // Includes standard input/output functions.

#define MAX 100  // Defines the maximum size of the stack as 100.

/* Creates a structure for the Undo Stack. */
typedef struct {
    int taskId[MAX];  // Array that stores task IDs.
    int top;          // Stores the index of the top element.
} UndoStack;

// Initializes the stack.
void init(UndoStack *s) {
    s->top = -1;  // -1 means the stack is empty.
}

// Checks whether the stack is empty.
int isEmpty(const UndoStack *s) {
    return s->top == -1;  // Returns 1 if empty, otherwise 0.
}

// Inserts a task ID into the stack (Push operation).
int push(UndoStack *s, int id) {

    // Checks whether the stack is full.
    if (s->top == MAX - 1)
        return 0;  // Returns 0 if there is no space.

    s->taskId[++s->top] = id;  // Increases top and stores the task ID.

    return 1;  // Returns 1 when insertion is successful.
}

// Removes the top task ID from the stack (Pop operation).
int pop(UndoStack *s, int *id) {

    // Checks whether the stack is empty.
    if (isEmpty(s))
        return 0;  // Returns 0 if there is no element to remove.

    *id = s->taskId[s->top--];  // Gets the top ID and decreases top.

    return 1;  // Returns 1 when deletion is successful.
}

// Main function: Program execution starts here.
int main(void) {

    UndoStack undo;  // Creates an UndoStack variable.
    int id;          // Stores the task ID removed from the stack.

    init(&undo);  // Initializes the stack.

    // Pushes three task IDs into the stack.
    push(&undo, 501);
    push(&undo, 502);
    push(&undo, 503);

    puts("Undo order (Last In, First Out):");

    // Pops elements until the stack becomes empty.
    while (pop(&undo, &id)) {
        printf("Restore task %d\n", id);  // Displays the removed task ID.
    }

    return 0;  // Ends the program successfully.
}
