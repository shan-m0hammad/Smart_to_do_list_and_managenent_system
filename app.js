// ========================================
// SMART TO-DO LIST - JAVASCRIPT
// ========================================


// ---------- DATA ----------

// Browser me saved tasks ko load karo
let tasks = JSON.parse(
    localStorage.getItem("smartTodoTasks") || "[]"
);

// Undo ke liye previous states
let undoStack = JSON.parse(
    localStorage.getItem("smartTodoUndo") || "[]"
);

// Next Task ID
let nextId = Number(
    localStorage.getItem("smartTodoNextId") || "1"
);

// Abhi kaunsa task edit ho raha hai
let editingId = null;


// ========================================
// SAVE DATA
// ========================================

// Data ko browser ke Local Storage me save karta hai
function saveState() {

    localStorage.setItem(
        "smartTodoTasks",
        JSON.stringify(tasks)
    );

    // Last 10 undo states save karo
    localStorage.setItem(
        "smartTodoUndo",
        JSON.stringify(undoStack.slice(-10))
    );

    // Next ID save karo
    localStorage.setItem(
        "smartTodoNextId",
        String(nextId)
    );
}


// ========================================
// UNDO FUNCTIONS
// ========================================

// Current tasks ki copy banata hai
function snapshot() {

    return JSON.parse(
        JSON.stringify(tasks)
    );
}


// Change se pehle old data save karta hai
// Iska use Undo ke liye hota hai
function remember() {

    undoStack.push(snapshot());

    // Maximum 10 undo states
    if (undoStack.length > 10) {
        undoStack.shift();
    }
}


// ========================================
// MESSAGE
// ========================================

// Screen par success/error message dikhata hai
function message(text, error = false) {

    let msg = document.getElementById("message");

    msg.textContent = text;

    if (error) {
        msg.className = "message error";
    } else {
        msg.className = "message";
    }

    // 2.2 seconds ke baad message hata do
    setTimeout(function () {
        msg.textContent = "";
    }, 2200);
}


// ========================================
// CLEAR FORM
// ========================================

// Form ke saare fields clear karta hai
function clearForm() {

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskCategory").value = "";
    document.getElementById("taskDeadline").value = "";
    document.getElementById("taskDescription").value = "";

    // Default priority = Medium
    document.getElementById("taskPriority").value = "2";

    // Edit mode band
    editingId = null;

    // Heading wapas Add Task
    document.getElementById("formHeading").textContent =
        "Add a new task";

    // Button wapas Add Task
    document.getElementById("saveTask").textContent =
        "+ Add Task";
}


// ========================================
// ADD / UPDATE TASK
// ========================================

// New task add karta hai
// Existing task ko update bhi karta hai
function addOrUpdate() {

    // Task title lena
    let title =
        document.getElementById("taskTitle").value.trim();


    // Title empty hai
    if (title === "") {

        message(
            "Please enter a task title.",
            true
        );

        document.getElementById("taskTitle").focus();

        return;
    }


    // Form se task ki information lena
    let data = {

        title: title,

        category:
            document.getElementById("taskCategory").value.trim()
            || "General",

        deadline:
            document.getElementById("taskDeadline").value
            || "No deadline",

        priority:
            Number(
                document.getElementById("taskPriority").value
            ),

        description:
            document.getElementById("taskDescription").value.trim()
            || "No description"
    };


    // Change se pehle old state save
    remember();


    // Agar existing task edit ho raha hai
    if (editingId !== null) {

        let task = tasks.find(function (task) {
            return task.id === editingId;
        });


        // Task ki information update
        Object.assign(task, data);

        message("Task updated successfully.");

    }

    // Agar new task hai
    else {

        let newTask = {

            id: nextId++,

            title: data.title,

            category: data.category,

            deadline: data.deadline,

            priority: data.priority,

            description: data.description,

            completed: false,

            // Task create hone ka time
            created: Date.now()
        };


        // Task ko list me add karo
        tasks.push(newTask);

        message("Task added successfully.");
    }


    // Data save karo
    saveState();

    // Form clear karo
    clearForm();

    // Screen update karo
    render();
}


// ========================================
// EDIT TASK
// ========================================

// Task ki information form me show karta hai
function editTask(id) {

    let task = tasks.find(function (task) {
        return task.id === id;
    });


    // Task nahi mila
    if (!task) {
        return;
    }


    // Editing task ki ID save
    editingId = id;


    // Task ki details form me bharna
    document.getElementById("taskTitle").value =
        task.title;

    document.getElementById("taskCategory").value =
        task.category;

    document.getElementById("taskDeadline").value =
        task.deadline === "No deadline"
            ? ""
            : task.deadline;

    document.getElementById("taskDescription").value =
        task.description === "No description"
            ? ""
            : task.description;

    document.getElementById("taskPriority").value =
        String(task.priority);


    // Form ko Update mode me change karo
    document.getElementById("formHeading").textContent =
        "Update task";

    document.getElementById("saveTask").textContent =
        "Save Changes";


    // Form ke paas scroll karo
    window.scrollTo({
        top: 250,
        behavior: "smooth"
    });
}


// ========================================
// COMPLETE TASK
// ========================================

// Task ko Complete / Pending karta hai
function completeTask(id) {

    let task = tasks.find(function (task) {
        return task.id === id;
    });


    if (!task) {
        return;
    }


    // Old state save
    remember();


    // true -> false
    // false -> true
    task.completed = !task.completed;


    saveState();
    render();


    if (task.completed) {
        message("Task completed.");
    } else {
        message("Task moved back to pending.");
    }
}


// ========================================
// DELETE TASK
// ========================================

// Task delete karta hai
function deleteTask(id) {

    // Delete se pehle old state save
    remember();


    // Selected task ko remove karo
    tasks = tasks.filter(function (task) {

        return task.id !== id;

    });


    saveState();
    render();

    message("Task deleted.");
}


// ========================================
// UNDO
// ========================================

// Last operation ko reverse karta hai
// Stack concept yaha use hota hai
function undo() {

    // Agar undo history empty hai
    if (undoStack.length === 0) {

        message(
            "Nothing to undo.",
            true
        );

        return;
    }


    // Last saved state wapas lao
    tasks = undoStack.pop();


    saveState();
    render();

    message("Last operation undone.");
}


// ========================================
// FIFO PROCESS
// ========================================

// FIFO = First In First Out
// First pending task ko complete karta hai
function processQueue() {

    // Pehla pending task find karo
    let task = tasks.find(function (task) {

        return task.completed === false;

    });


    // Koi pending task nahi hai
    if (!task) {

        message(
            "Queue is empty.",
            true
        );

        return;
    }


    remember();

    // Task complete
    task.completed = true;


    saveState();
    render();

    message(
        "FIFO: first pending task completed."
    );
}


// ========================================
// PRIORITY PROCESS
// ========================================

// Highest priority task ko pehle complete karta hai
function processPriority() {

    // Sirf pending tasks lo
    let pendingTasks = tasks.filter(function (task) {

        return task.completed === false;

    });


    // Pending task nahi hai
    if (pendingTasks.length === 0) {

        message(
            "Priority queue is empty.",
            true
        );

        return;
    }


    // High priority ko pehle rakho
    // 3 = High
    // 2 = Medium
    // 1 = Low
    pendingTasks.sort(function (a, b) {

        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }

        // Same priority me old ID pehle
        return a.id - b.id;
    });


    // Highest priority task find karo
    let task = tasks.find(function (item) {

        return item.id === pendingTasks[0].id;

    });


    remember();

    // Task complete
    task.completed = true;


    saveState();
    render();

    message(
        "Priority Queue: highest priority task completed."
    );
}


// ========================================
// PRIORITY NAME
// ========================================

// Number ko High / Medium / Low me convert karta hai
function priorityName(number) {

    if (number === 3) {
        return "High";
    }

    if (number === 2) {
        return "Medium";
    }

    return "Low";
}


// Priority ke liye CSS class return karta hai
function priorityClass(number) {

    return priorityName(number).toLowerCase();
}


// ========================================
// DISPLAY ONE TASK
// ========================================

// Task ko HTML format me convert karta hai
function renderTask(task) {

    let completedClass = "";

    if (task.completed) {
        completedClass = "completed";
    }


    let buttonText = "Complete";

    if (task.completed) {
        buttonText = "Undo";
    }


    return `
        <div class="task ${completedClass}">

            <div>

                <h3>
                    ${escapeHtml(task.title)}
                </h3>

                <p>
                    Category:
                    ${escapeHtml(task.category)}
                </p>

                <p>
                    Deadline:
                    ${escapeHtml(task.deadline)}
                </p>

                <p class="priority ${priorityClass(task.priority)}">
                    Priority:
                    ${priorityName(task.priority)}
                </p>

                <p>
                    ${escapeHtml(task.description)}
                </p>

            </div>


            <div class="task-actions">

                <button
                    class="edit-btn"
                    onclick="editTask(${task.id})"
                >
                    Edit
                </button>

                <button
                    class="complete-btn"
                    onclick="completeTask(${task.id})"
                >
                    ${buttonText}
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteTask(${task.id})"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}


// ========================================
// SECURITY
// ========================================

// User ke input ko safe HTML me convert karta hai
function escapeHtml(text) {

    return String(text).replace(
        /[&<>"']/g,

        function (character) {

            let characters = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return characters[character];
        }
    );
}


// ========================================
// RENDER / DISPLAY
// ========================================

// Search, sorting aur task display karta hai
function render() {

    // Search text
    let searchText =
        document.getElementById("search")
            .value
            .toLowerCase()
            .trim();


    // Search ke according tasks filter
    let list = tasks.filter(function (task) {

        return (
            task.title.toLowerCase().includes(searchText) ||

            task.category.toLowerCase().includes(searchText) ||

            task.description.toLowerCase().includes(searchText)
        );
    });


    // Selected sorting option
    let sortOption =
        document.getElementById("sortOption").value;


    // Priority High -> Low
    if (sortOption === "priority") {

        list.sort(function (a, b) {

            return b.priority - a.priority;

        });
    }


    // Deadline ke according
    else if (sortOption === "deadline") {

        list.sort(function (a, b) {

            let dateA =
                a.deadline === "No deadline"
                    ? "9999-99-99"
                    : a.deadline;

            let dateB =
                b.deadline === "No deadline"
                    ? "9999-99-99"
                    : b.deadline;

            return dateA.localeCompare(dateB);
        });
    }


    // Title A -> Z
    else if (sortOption === "title") {

        list.sort(function (a, b) {

            return a.title.localeCompare(b.title);

        });
    }


    // Default: Newest first
    else {

        list.sort(function (a, b) {

            return (
                (b.created || b.id) -
                (a.created || a.id)
            );

        });
    }


    // Pending aur completed tasks alag karo
    let pending = list.filter(function (task) {

        return task.completed === false;

    });

    let completed = list.filter(function (task) {

        return task.completed === true;

    });


    // ====================================
    // SHOW PENDING TASKS
    // ====================================

    if (pending.length > 0) {

        document.getElementById("pendingList").innerHTML =
            pending.map(renderTask).join("");

    } else {

        document.getElementById("pendingList").innerHTML = `
            <div class="empty">

                <strong>
                    No pending tasks
                </strong>

                Add a task above to start.

            </div>
        `;
    }


    // ====================================
    // SHOW COMPLETED TASKS
    // ====================================

    if (completed.length > 0) {

        document.getElementById("completedList").innerHTML =
            completed.map(renderTask).join("");

    } else {

        document.getElementById("completedList").innerHTML = `
            <div class="empty">

                <strong>
                    No completed tasks
                </strong>

                Completed work will appear here.

            </div>
        `;
    }


    // ====================================
    // UPDATE STATISTICS
    // ====================================

    let total = tasks.length;


    // Completed tasks count
    let completedCount = tasks.filter(function (task) {

        return task.completed === true;

    }).length;


    // Total
    document.getElementById("totalTasks").textContent =
        total;

    // Pending
    document.getElementById("pendingTasks").textContent =
        total - completedCount;

    // Completed
    document.getElementById("completedTasks").textContent =
        completedCount;


    // High priority pending tasks
    let highPriority = tasks.filter(function (task) {

        return (
            task.completed === false &&
            task.priority === 3
        );

    }).length;


    document.getElementById("highTasks").textContent =
        highPriority;


    // Pending section count
    document.getElementById("pendingLabel").textContent =
        total - completedCount;

    // Completed section count
    document.getElementById("doneLabel").textContent =
        completedCount;
}


// ========================================
// BUTTON EVENTS
// ========================================

// Add Task button
document.getElementById("saveTask")
    .addEventListener("click", addOrUpdate);


// Clear button
document.getElementById("clearForm")
    .addEventListener("click", clearForm);


// Search box
document.getElementById("search")
    .addEventListener("input", render);


// Sort dropdown
document.getElementById("sortOption")
    .addEventListener("change", render);


// Undo button
document.getElementById("undoBtn")
    .addEventListener("click", undo);


// FIFO button
document.getElementById("queueBtn")
    .addEventListener("click", processQueue);


// Priority button
document.getElementById("priorityBtn")
    .addEventListener("click", processPriority);


// ========================================
// ENTER KEY
// ========================================

// Task title me Enter dabane par task add hoga
document.getElementById("taskTitle")
    .addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            addOrUpdate();
        }

    });
    function setMinimumDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayDate = `${year}-${month}-${day}`;

    const deadlineInput = document.getElementById("taskDeadline");

    if (deadlineInput) {
        deadlineInput.min = todayDate;
    }
}

setMinimumDate();


// ========================================
// START PROGRAM
// ========================================

// Page open hote hi tasks display karo
render();