const STORAGE_KEY = "smartTodoTasksV1";

let tasks = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "null"
);

let undoTask = null;
let undoTimer = null;
let activeFilter = "all";
let calendarDate = new Date();
let selectedCalendarDate = formatDate(new Date());
let remindersEnabled = true;


if (!Array.isArray(tasks)) {

    tasks = [

        {
            id:1,
            title:"Complete PBL Documentation",
            description:"Prepare the Smart To-Do List project documentation.",
            priority:"high",
            dueDate:formatDate(new Date()),
            category:"College",
            reminder:"",
            completed:false,
            createdAt:Date.now()-4000
        },

        {
            id:2,
            title:"Study Data Structures",
            description:"Revise linked list and stack concepts.",
            priority:"high",
            dueDate:formatDate(addDays(new Date(),1)),
            category:"Study",
            reminder:"",
            completed:false,
            createdAt:Date.now()-3000
        },

        {
            id:3,
            title:"Practice C++",
            description:"Practice classes and constructors.",
            priority:"medium",
            dueDate:formatDate(addDays(new Date(),2)),
            category:"Coding",
            reminder:"",
            completed:false,
            createdAt:Date.now()-2000
        },

        {
            id:4,
            title:"Read Documentation",
            description:"Read today's study material.",
            priority:"low",
            dueDate:formatDate(new Date()),
            category:"Study",
            reminder:"",
            completed:true,
            createdAt:Date.now()-1000
        }

    ];

    saveTasks();
}


const $ = id => document.getElementById(id);


function formatDate(date){

    const y = date.getFullYear();

    const m = String(
        date.getMonth()+1
    ).padStart(2,"0");

    const d = String(
        date.getDate()
    ).padStart(2,"0");

    return `${y}-${m}-${d}`;
}


function parseDate(s){

    const [y,m,d] = s.split("-").map(Number);

    return new Date(y,m-1,d);
}


function addDays(date,n){

    const d = new Date(date);

    d.setDate(
        d.getDate()+n
    );

    return d;
}


function today(){

    return formatDate(
        new Date()
    );

}


function saveTasks(){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );

}


function escapeHtml(value){

    return String(value ?? "").replace(
        /[&<>"']/g,
        c => ({
            "&":"&amp;",
            "<":"&lt;",
            ">":"&gt;",
            '"':"&quot;",
            "'":"&#039;"
        }[c])
    );

}


function priorityWeight(p){

    return p==="high"
        ?3
        :p==="medium"
        ?2
        :1;

}


function isOverdue(t){

    return !t.completed &&
           t.dueDate < today();

}


function prettyDate(s){

    if(s===today())
        return "Today";

    const d = parseDate(s);

    return d.toLocaleDateString(
        "en-IN",
        {
            day:"numeric",
            month:"short",
            year:"numeric"
        }
    );

}


function priorityBadge(p){

    const label =
        p==="high"
        ?"HIGH"
        :p==="medium"
        ?"MEDIUM"
        :"LOW";

    return `
        <span class="badge priority-${p}">
            ${label}
        </span>
    `;

}


function taskHtml(t){

    return `

    <div class="task">

        <button
            class="check ${t.completed?"done":""}"
            onclick="toggleTask(${t.id})"
            aria-label="Complete task">

            ${t.completed?"✓":""}

        </button>


        <div class="task-main">

            <div class="task-title ${t.completed?"done":""}">
                ${escapeHtml(t.title)}
            </div>


            ${
                t.description
                ?
                `<div class="task-desc">
                    ${escapeHtml(t.description)}
                 </div>`
                :
                ""
            }


            <div class="task-meta">

                ${priorityBadge(t.priority)}

                <span class="badge badge-date">
                    📅 ${prettyDate(t.dueDate)}
                </span>

                ${
                    t.category
                    ?
                    `<span class="badge badge-date">
                        ${escapeHtml(t.category)}
                     </span>`
                    :
                    ""
                }

                ${
                    isOverdue(t)
                    ?
                    `<span class="badge badge-overdue">
                        OVERDUE
                     </span>`
                    :
                    ""
                }

            </div>

        </div>


        <div class="task-actions">

            <button
                class="icon-btn"
                onclick="openEditModal(${t.id})"
                title="Edit">
                ✎
            </button>

            <button
                class="icon-btn"
                onclick="deleteTask(${t.id})"
                title="Delete">
                🗑
            </button>

        </div>

    </div>

    `;

}


function render(){

    renderStats();
    renderToday();
    renderFocus();
    renderProgress();
    renderAllTasks();
    renderCalendar();
    renderSelectedDate();
    renderReminder();

}


function renderStats(){

    const total = tasks.length;

    const completed =
        tasks.filter(
            t => t.completed
        ).length;


    $("totalCount").textContent = total;

    $("pendingCount").textContent =
        tasks.filter(
            t => !t.completed
        ).length;

    $("completedCount").textContent =
        completed;

    $("overdueCount").textContent =
        tasks.filter(
            isOverdue
        ).length;

    $("highCount").textContent =
        tasks.filter(
            t =>
                t.priority==="high" &&
                !t.completed
        ).length;

}


function renderToday(){

    const list =
        tasks
        .filter(
            t => t.dueDate===today()
        )
        .sort(
            (a,b) =>
                Number(a.completed) -
                Number(b.completed) ||
                priorityWeight(b.priority) -
                priorityWeight(a.priority)
        );


    $("todaySummary").textContent =
        list.length
        ?
        `${list.length} task${list.length===1?"":"s"} scheduled for today.`
        :
        "No tasks for today.";


    $("todayTasks").innerHTML =
        list.length
        ?
        list.map(taskHtml).join("")
        :
        `
        <div class="empty">

            <div class="empty-icon">
                🎉
            </div>

            <strong>
                You're all caught up!
            </strong>

            <p style="margin-top:6px">
                You don't have any tasks for today.
            </p>

        </div>
        `;

}


function renderFocus(){

    const list =
        tasks
        .filter(
            t => !t.completed
        )
        .sort(
            (a,b) => {

                const ao =
                    isOverdue(a) ? 1 : 0;

                const bo =
                    isOverdue(b) ? 1 : 0;

                return (
                    bo-ao ||
                    priorityWeight(b.priority) -
                    priorityWeight(a.priority) ||
                    a.dueDate.localeCompare(
                        b.dueDate
                    )
                );

            }
        )
        .slice(0,4);


    $("focusList").innerHTML =
        list.length
        ?
        list.map(
            (t,i) => `

            <div class="focus-item">

                <div>

                    <strong>
                        ${i+1}. ${escapeHtml(t.title)}
                    </strong>

                    <small>
                        ${priorityBadge(t.priority)}
                        ·
                        ${prettyDate(t.dueDate)}
                    </small>

                </div>


                <button
                    class="icon-btn"
                    onclick="toggleTask(${t.id})">
                    ✓
                </button>

            </div>

            `
        ).join("")
        :
        `
        <div class="empty">

            <div class="empty-icon">
                🎉
            </div>

            <strong>
                All done!
            </strong>

            <p style="margin-top:6px">
                Nothing needs your attention.
            </p>

        </div>
        `;

}


function renderAllTasks(){

    const q =
        (
            $("searchInput")?.value || ""
        )
        .trim()
        .toLowerCase();


    let list =
        tasks.filter(t => {

            const text =
                (
                    t.title +
                    " " +
                    t.description +
                    " " +
                    t.category
                ).toLowerCase();


            if(q && !text.includes(q))
                return false;


            if(activeFilter==="today")
                return t.dueDate===today();


            if(activeFilter==="pending")
                return !t.completed;


            if(activeFilter==="completed")
                return t.completed;


            if(activeFilter==="overdue")
                return isOverdue(t);


            if(activeFilter==="high")
                return (
                    t.priority==="high" &&
                    !t.completed
                );


            return true;

        });


    const sort =
        $("sortSelect")?.value ||
        "newest";


    if(sort==="priority"){

        list.sort(
            (a,b) =>
                priorityWeight(b.priority) -
                priorityWeight(a.priority) ||
                a.dueDate.localeCompare(
                    b.dueDate
                )
        );

    }

    else if(sort==="due"){

        list.sort(
            (a,b) =>
                a.dueDate.localeCompare(
                    b.dueDate
                )
        );

    }

    else if(sort==="status"){

        list.sort(
            (a,b) =>
                Number(a.completed) -
                Number(b.completed)
        );

    }

    else{

        list.sort(
            (a,b) =>
                b.createdAt -
                a.createdAt
        );

    }


    $("allTasks").innerHTML =
        list.length
        ?
        list.map(taskHtml).join("")
        :
        `
        <div class="empty">

            <div class="empty-icon">
                ${
                    q || activeFilter!=="all"
                    ? "🔎"
                    : "🎉"
                }
            </div>

            <strong>
                ${
                    q || activeFilter!=="all"
                    ? "No matching tasks"
                    : "You're all caught up!"
                }
            </strong>

            <p style="margin-top:6px">

                ${
                    q || activeFilter!=="all"
                    ? "Try another search or filter."
                    : "Add your first task to get started."
                }

            </p>

        </div>
        `;

}


function renderProgress(){

    const total = tasks.length;

    const done =
        tasks.filter(
            t => t.completed
        ).length;


    const pct =
        total
        ?
        Math.round(
            done/total*100
        )
        :
        0;


    $("dashboardCircle")
        .style
        .setProperty(
            "--progress",
            pct+"%"
        );


    $("dashboardPercent")
        .textContent =
        pct+"%";


    $("dashboardProgress")
        .style.width =
        pct+"%";


    $("progressText")
        .textContent =
        `${done} of ${total} tasks completed`;


    $("progressMessage")
        .textContent =
        total===0
        ?
        "Start your first task today."
        :
        pct===100
        ?
        "Excellent! All tasks are complete."
        :
        pct>=70
        ?
        "Great progress. Keep it going!"
        :
        "One task at a time. You've got this!";


    $("progressCircle")
        .style
        .setProperty(
            "--progress",
            pct+"%"
        );


    $("progressPercent")
        .textContent =
        pct+"%";


    $("progressFill")
        .style.width =
        pct+"%";


    $("progressHeading")
        .textContent =
        pct===100 && total
        ?
        "Excellent! All tasks completed."
        :
        pct>=70
        ?
        "You're doing great!"
        :
        "Keep moving forward!";


    $("progressDetail")
        .textContent =
        `${done} completed out of ${total} total tasks (${pct}%).`;


    $("doneToday").textContent =
        tasks.filter(
            t =>
                t.completed &&
                t.completedAt &&
                sameDate(
                    new Date(t.completedAt),
                    new Date()
                )
        ).length;


    $("doneWeek").textContent =
        tasks.filter(
            t =>
                t.completed &&
                t.completedAt &&
                new Date(t.completedAt) >=
                startOfWeek()
        ).length;


    $("doneTotal").textContent =
        done;


    $("remainingTotal").textContent =
        total-done;

}


function sameDate(a,b){

    return formatDate(a) ===
           formatDate(b);

}


function startOfWeek(){

    const d = new Date();

    const day = d.getDay();

    d.setDate(
        d.getDate() -
        (day===0 ? 6 : day-1)
    );

    d.setHours(
        0,0,0,0
    );

    return d;

}


function renderReminder(){

    const overdue =
        tasks.filter(
            isOverdue
        ).length;


    const todayPending =
        tasks.filter(
            t =>
                t.dueDate===today() &&
                !t.completed
        ).length;


    if(!remindersEnabled){

        $("reminderBox").innerHTML =
            `
            <p class="muted">
                Reminders are turned off in Settings.
            </p>
            `;

        return;
    }


    if(overdue){

        $("reminderBox").innerHTML =
            `
            <div style="
                padding:14px;
                border-radius:12px;
                background:var(--red-bg);
                color:var(--red);
                font-weight:700">

                🔴 ${overdue}
                task${overdue>1?"s are":" is"}
                overdue.

            </div>
            `;

    }

    else if(todayPending){

        $("reminderBox").innerHTML =
            `
            <div style="
                padding:14px;
                border-radius:12px;
                background:var(--yellow-bg);
                color:var(--yellow);
                font-weight:700">

                🟡 ${todayPending}
                task${todayPending>1?"s are":" is"}
                due today.

            </div>
            `;

    }

    else{

        $("reminderBox").innerHTML =
            `
            <div style="
                padding:14px;
                border-radius:12px;
                background:var(--green-bg);
                color:var(--green);
                font-weight:700">

                🟢 You're on track.
                No urgent reminders.

            </div>
            `;

    }

}


function renderCalendar(){

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    $("calendarTitle")
        .textContent =
        calendarDate.toLocaleDateString(
            "en-IN",
            {
                month:"long",
                year:"numeric"
            }
        );


    const first =
        new Date(
            year,
            month,
            1
        );


    const last =
        new Date(
            year,
            month+1,
            0
        );


    const start =
        (first.getDay()+6)%7;


    const cells = [];


    [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ].forEach(
        d =>
            cells.push(
                `<div class="day-name">${d}</div>`
            )
    );


    const prevLast =
        new Date(
            year,
            month,
            0
        ).getDate();


    for(
        let i=start-1;
        i>=0;
        i--
    ){

        cells.push(
            `
            <div class="day other">
                <div class="day-number">
                    ${prevLast-i}
                </div>
            </div>
            `
        );

    }


    for(
        let d=1;
        d<=last.getDate();
        d++
    ){

        const date =
            new Date(
                year,
                month,
                d
            );


        const ds =
            formatDate(date);


        const count =
            tasks.filter(
                t =>
                    t.dueDate===ds
            ).length;


        cells.push(
            `
            <div
                class="day
                ${ds===today()?"today":""}
                ${ds===selectedCalendarDate?"selected":""}"
                onclick="selectCalendarDate('${ds}')">

                <div class="day-number">
                    ${d}
                </div>

                ${
                    count
                    ?
                    `
                    <div class="dot"></div>

                    <div class="day-task-count">
                        ${count}
                        task${count>1?"s":""}
                    </div>
                    `
                    :
                    ""
                }

            </div>
            `
        );

    }


    const totalCells =
        Math.ceil(
            cells.length/7
        )*7;


    let next = 1;


    while(
        cells.length < totalCells
    ){

        cells.push(
            `
            <div class="day other">

                <div class="day-number">
                    ${next++}
                </div>

            </div>
            `
        );

    }


    $("calendarGrid")
        .innerHTML =
        cells.join("");

}


function renderSelectedDate(){

    const d =
        parseDate(
            selectedCalendarDate
        );


    $("selectedDateTitle")
        .textContent =
        d.toLocaleDateString(
            "en-IN",
            {
                weekday:"long",
                day:"numeric",
                month:"long",
                year:"numeric"
            }
        );


    const list =
        tasks.filter(
            t =>
                t.dueDate===
                selectedCalendarDate
        );


    $("selectedDateTasks")
        .innerHTML =
        list.length
        ?
        list.map(taskHtml).join("")
        :
        `
        <div class="empty">

            <div class="empty-icon">
                📅
            </div>

            <strong>
                No tasks on this date.
            </strong>

            <p style="margin-top:6px">
                Add a task for this day if you need one.
            </p>

        </div>
        `;

}


function selectCalendarDate(ds){

    selectedCalendarDate = ds;

    renderCalendar();

    renderSelectedDate();

}


function showPage(page){

    document
        .querySelectorAll(".page")
        .forEach(
            p =>
                p.classList.remove("active")
        );


    $(page+"Page")
        .classList.add("active");


    document
        .querySelectorAll(
            ".nav button,.mobile-nav button"
        )
        .forEach(
            b =>
                b.classList.toggle(
                    "active",
                    b.dataset.page===page
                )
        );


    const titles = {

        dashboard:[
            "Good Morning! 👋",
            "Here is what needs your attention today."
        ],

        tasks:[
            "My Tasks",
            "Everything you need, organized in one place."
        ],

        calendar:[
            "Calendar",
            "Plan your tasks around your days."
        ],

        progress:[
            "Your Progress",
            "Small steps add up to big progress."
        ],

        settings:[
            "Settings",
            "Keep your task experience simple."
        ]

    };


    $("pageTitle")
        .textContent =
        titles[page][0];


    $("pageSubtitle")
        .textContent =
        titles[page][1];


    $("sidebar")
        .classList
        .remove("open");


    if(page==="calendar")
        renderCalendar();


    if(page==="progress")
        renderProgress();

}


function openAddModal(){

    $("modalTitle")
        .textContent =
        "Add New Task";


    $("saveTaskBtn")
        .textContent =
        "Add Task";


    $("editId")
        .value = "";


    $("taskForm").reset();


    $("taskPriority")
        .value =
        "medium";


    $("taskDate")
        .value =
        today();


    $("modalBackdrop")
        .classList
        .add("show");


    setTimeout(
        () =>
            $("taskTitle").focus(),
        50
    );

}


function openEditModal(id){

    const t =
        tasks.find(
            x => x.id===id
        );


    if(!t)
        return;


    $("modalTitle")
        .textContent =
        "Edit Task";


    $("saveTaskBtn")
        .textContent =
        "Save Changes";


    $("editId")
        .value =
        t.id;


    $("taskTitle")
        .value =
        t.title;


    $("taskDescription")
        .value =
        t.description;


    $("taskPriority")
        .value =
        t.priority;


    $("taskDate")
        .value =
        t.dueDate;


    $("taskCategory")
        .value =
        t.category;




    $("modalBackdrop")
        .classList
        .add("show");

}


function closeModal(){

    $("modalBackdrop")
        .classList
        .remove("show");

}


function toggleTask(id){

    const t =
        tasks.find(
            x => x.id===id
        );


    if(!t)
        return;


    t.completed =
        !t.completed;


    t.completedAt =
        t.completed
        ?
        Date.now()
        :
        null;


    saveTasks();

    render();


    showToast(
        t.completed
        ?
        "Task completed ✓"
        :
        "Task marked as pending"
    );

}


function deleteTask(id){

    const index =
        tasks.findIndex(
            x => x.id===id
        );


    if(index<0)
        return;


    undoTask = {
        task:tasks[index],
        index:index
    };


    tasks.splice(
        index,
        1
    );


    saveTasks();

    render();

    showToast(
        "Task deleted",
        true
    );

}


function showToast(
    message,
    undo=false
){

    $("toastText")
        .textContent =
        message;


    $("undoBtn")
        .style
        .display =
        undo
        ?
        "inline"
        :
        "none";


    $("toast")
        .classList
        .add("show");


    clearTimeout(
        undoTimer
    );


    undoTimer =
        setTimeout(
            () => {

                $("toast")
                    .classList
                    .remove("show");

                undoTask = null;

            },
            5000
        );

}


$("undoBtn").onclick = () => {

    if(!undoTask)
        return;


    tasks.splice(
        undoTask.index,
        0,
        undoTask.task
    );


    saveTasks();

    render();


    undoTask = null;


    $("toast")
        .classList
        .remove("show");

};


$("taskForm")
    .addEventListener(
        "submit",
        e => {

            e.preventDefault();


            const title =
                $("taskTitle")
                .value
                .trim();


            if(!title)
                return;


            const editId =
                Number(
                    $("editId").value
                );


            const data = {

                title,

                description:
                    $("taskDescription")
                    .value
                    .trim(),

                priority:
                    $("taskPriority")
                    .value,

                dueDate:
                    $("taskDate")
                    .value,

                category:
                    $("taskCategory")
                    .value
                    .trim(),

                reminder: ""

            };


            if(editId){

                const t =
                    tasks.find(
                        x =>
                            x.id===editId
                    );


                if(t)
                    Object.assign(
                        t,
                        data
                    );


                showToast(
                    "Task updated ✓"
                );

            }

            else{

                tasks.push({

                    id:Date.now(),

                    ...data,

                    completed:false,

                    completedAt:null,

                    createdAt:Date.now()

                });


                showToast(
                    "Task added ✓"
                );

            }


            saveTasks();

            render();

            closeModal();

        }
    );


$("addTaskBtn").onclick =
    openAddModal;


$("closeModal").onclick =
    closeModal;


$("cancelModal").onclick =
    closeModal;


$("modalBackdrop")
    .addEventListener(
        "click",
        e => {

            if(
                e.target ===
                $("modalBackdrop")
            ){

                closeModal();

            }

        }
    );


document
    .querySelectorAll("[data-page]")
    .forEach(
        btn =>
            btn.addEventListener(
                "click",
                () =>
                    showPage(
                        btn.dataset.page
                    )
            )
    );


$("searchInput")
    .addEventListener(
        "input",
        renderAllTasks
    );


$("sortSelect")
    .addEventListener(
        "change",
        renderAllTasks
    );


document
    .querySelectorAll(
        "#filters .filter-btn"
    )
    .forEach(
        btn => {

            btn.addEventListener(
                "click",
                () => {

                    activeFilter =
                        btn.dataset.filter;


                    document
                        .querySelectorAll(
                            "#filters .filter-btn"
                        )
                        .forEach(
                            b =>
                                b.classList.toggle(
                                    "active",
                                    b===btn
                                )
                        );


                    renderAllTasks();

                }
            );

        }
    );


$("prevMonth").onclick =
    () => {

        calendarDate.setMonth(
            calendarDate.getMonth()-1
        );

        renderCalendar();

    };


$("nextMonth").onclick =
    () => {

        calendarDate.setMonth(
            calendarDate.getMonth()+1
        );

        renderCalendar();

    };


$("menuBtn").onclick =
    () =>
        $("sidebar")
        .classList
        .toggle("open");


$("reminderToggle").onclick =
    () => {

        remindersEnabled =
            !remindersEnabled;


        $("reminderToggle")
            .classList
            .toggle(
                "on",
                remindersEnabled
            );


        renderReminder();

    };


$("clearAllBtn").onclick =
    () => {

        if(
            confirm(
                "Are you sure you want to delete all tasks? This cannot be undone."
            )
        ){

            tasks = [];

            saveTasks();

            render();

            showToast(
                "All tasks cleared"
            );

        }

    };



/* Modern polish: themes, motivation, pending-task centre and strict date rules */
const THEME_KEY = "smartTaskThemeV1";
const quoteBank = [
    { quote: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { quote: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
    { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" }
];
let lastQuoteIndex = -1;

function setDateMinimum() {
    const dateInput = $("taskDate");
    if (!dateInput) return;
    dateInput.min = today();
    if (dateInput.value && dateInput.value < today()) {
        dateInput.value = today();
    }
}
function showDateError(message) {
    const banner = $("dateValidation");
    if (banner) {
        banner.textContent = "⚠ " + message;
        banner.hidden = false;
    }
}
function clearDateError() {
    const banner = $("dateValidation");
    if (banner) {
        banner.hidden = true;
        banner.textContent = "";
    }
}
function refreshQuote() {
    let index = Math.floor(Math.random() * quoteBank.length);
    if (quoteBank.length > 1 && index === lastQuoteIndex) index = (index + 1) % quoteBank.length;
    lastQuoteIndex = index;
    const quote = quoteBank[index];
    const content = document.querySelector(".quote-content");
    if (content) content.classList.add("quote-changing");
    window.setTimeout(() => {
        $("dailyQuote").textContent = quote.quote;
        $("quoteAuthor").textContent = "— " + quote.author;
        if (content) content.classList.remove("quote-changing");
    }, 170);
}
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    const dark = theme === "dark";
    $("themeIcon").textContent = dark ? "☀" : "☾";
    const label = document.querySelector(".theme-toggle-label");
    if (label) label.textContent = dark ? "Light mode" : "Dark mode";
    $("themeToggle").setAttribute("aria-pressed", String(dark));
}
function pendingTasks() {
    return tasks.filter(t => !t.completed).sort((a,b) =>
        (isOverdue(b) - isOverdue(a)) ||
        priorityWeight(b.priority) - priorityWeight(a.priority) ||
        a.dueDate.localeCompare(b.dueDate)
    );
}
function renderPendingCentre() {
    const pending = pendingTasks();
    const badge = $("notificationCount");
    badge.textContent = pending.length > 99 ? "99+" : String(pending.length);
    badge.classList.toggle("has-count", pending.length > 0);
    const dueToday = pending.filter(t => t.dueDate === today()).length;
    const alert = $("dueTodayAlert");
    alert.hidden = !remindersEnabled || dueToday === 0;
    $("dueTodayText").textContent = dueToday === 1
        ? "You have 1 task due today. Make a little progress."
        : `You have ${dueToday} tasks due today. Make a little progress.`;
}
function openPendingModal() {
    const pending = pendingTasks();
    $("pendingTasksList").innerHTML = pending.length ? pending.map(t => `
        <div class="pending-item">
            <div class="pending-item-copy">
                <strong>${escapeHtml(t.title)}</strong>
                <span>${isOverdue(t) ? "Overdue" : "Due " + prettyDate(t.dueDate)} · ${escapeHtml(t.category || "General")}</span>
            </div>
            <button class="complete-quick" onclick="toggleTask(${t.id}); openPendingModal();" ${t.completed ? "disabled" : ""}>✓ Done</button>
        </div>`).join("") : `
        <div class="empty"><div class="empty-icon">✦</div><strong>You're all caught up</strong><p style="margin-top:6px">No pending tasks right now.</p></div>`;
    $("pendingBackdrop").classList.add("show");
}
function closePendingModal() {
    $("pendingBackdrop").classList.remove("show");
}
// Dashboard statistic cards act as shortcuts to their matching task lists.
document.querySelectorAll(".stat-button[data-stat-filter]").forEach(card => {
    card.addEventListener("click", () => {
        const filter = card.dataset.statFilter || "all";
        activeFilter = filter;
        showPage("tasks");
        document.querySelectorAll("#filters .filter-btn").forEach(button => {
            button.classList.toggle("active", button.dataset.filter === filter);
        });
        if ($("searchInput")) $("searchInput").value = "";
        renderAllTasks();
        $("tasksPage").scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

$("themeToggle").addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});
$("notificationBtn").addEventListener("click", openPendingModal);
$("closePending").addEventListener("click", closePendingModal);
$("pendingBackdrop").addEventListener("click", e => {
    if (e.target === $("pendingBackdrop")) closePendingModal();
});
$("refreshQuote").addEventListener("click", refreshQuote);
$("dueTodayAlert").addEventListener("click", () => {
    showPage("tasks");
    activeFilter = "today";
    document.querySelectorAll("#filters .filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === "today"));
    renderAllTasks();
});
$("taskDate").addEventListener("change", () => {
    clearDateError();
    setDateMinimum();
    if ($("taskDate").value < today()) {
        showDateError("Past dates aren't allowed. Choose today or a future date.");
        $("taskDate").value = today();
    }
});
$("taskDate").addEventListener("input", () => {
    if ($("taskDate").value && $("taskDate").value < today()) {
        showDateError("Past dates aren't allowed. Choose today or a future date.");
    } else clearDateError();
});
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        setDateMinimum();
        renderPendingCentre();
    }
});
const originalRender = render;
render = function() {
    originalRender();
    renderPendingCentre();
};
const originalOpenAddModal = openAddModal;
openAddModal = function() {
    clearDateError();
    originalOpenAddModal();
    setDateMinimum();
};
const originalOpenEditModal = openEditModal;
openEditModal = function(id) {
    clearDateError();
    originalOpenEditModal(id);
    setDateMinimum();
    const task = tasks.find(t => t.id === id);
    if (task && task.dueDate < today()) {
        // Existing overdue tasks can still be edited, but cannot be saved with a past date.
        $("taskDate").value = today();
        showDateError("This task was overdue. Choose today or a future date to save changes.");
    }
};
const originalSubmitHandler = $("taskForm");
originalSubmitHandler.addEventListener("submit", e => {
    const dateValue = $("taskDate").value;
    if (!dateValue || dateValue < today()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setDateMinimum();
        showDateError("Please choose today or a future date. Past dates are not permitted.");
        $("taskDate").focus();
    }
}, true);

applyTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
refreshQuote();
setDateMinimum();

render();
