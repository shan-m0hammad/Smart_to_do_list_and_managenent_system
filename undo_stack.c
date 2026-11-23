/* SmartTask DSA module: Stack (LIFO) for Undo operations (C). */
#include <stdio.h>
#define MAX 100

typedef struct { int taskId[MAX]; int top; } UndoStack;
void init(UndoStack *s) { s->top = -1; }
int isEmpty(const UndoStack *s) { return s->top == -1; }
int push(UndoStack *s, int id) {
    if (s->top == MAX - 1) return 0;
    s->taskId[++s->top] = id; return 1;
}
int pop(UndoStack *s, int *id) {
    if (isEmpty(s)) return 0;
    *id = s->taskId[s->top--]; return 1;
}
int main(void) {
    UndoStack undo; int id; init(&undo);
    push(&undo, 501); push(&undo, 502); push(&undo, 503);
    puts("Undo order (Last In, First Out):");
    while (pop(&undo, &id)) printf("Restore task %d\n", id);
    return 0;
}
