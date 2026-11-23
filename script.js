// Key name under which all tasks are stored in the browser's localStorage
const STORAGE_KEY = "smartTodoTasksV1";

// Read saved tasks from localStorage; if nothing is saved, fall back to the string "null"
// JSON.parse then converts the saved text back into a JavaScript array (or null)
let tasks = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "null"
);

// Holds the most recently deleted task (and its position) so it can be restored with Undo
let undoTask = null;
// Holds the setTimeout id of the toast, so the old timer can be cancelled when a new toast appears
let undoTimer = null;
// Currently selected filter on the Tasks page ("all", "today", "pending", etc.)
let activeFilter = "all";
// The month currently displayed in the calendar (starts as today's date)
let calendarDate = new Date();
// The date (YYYY-MM-DD string) the user clicked in the calendar; defaults to today
let selectedCalendarDate = formatDate(new Date());
// Flag that says whether the reminder feature is turned on in Settings
let remindersEnabled = true;


// If nothing valid was loaded from storage (first visit or corrupted data)...
if (!Array.isArray(tasks)) {

    // ...create an array of 4 sample tasks so the app doesn't look empty
    tasks = [

        {
            id:1,                                              // unique id of the task
            title:"Complete PBL Documentation",                // task name
            description:"Prepare the Smart To-Do List project documentation.", // details
            priority:"high",                                   // high / medium / low
            dueDate:formatDate(new Date()),                    // due today
            category:"College",                                // label/group
            reminder:"",                                       // reminder field (unused, kept empty)
            completed:false,                                   // not done yet
            createdAt:Date.now()-4000                          // creation time (4 sec earlier than now, to keep ordering)
        },

        {
            id:2,
            title:"Study Data Structures",
            description:"Revise linked list and stack concepts.",
            priority:"high",
            dueDate:formatDate(addDays(new Date(),1)),         // due tomorrow
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
            dueDate:formatDate(addDays(new Date(),2)),         // due the day after tomorrow
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
            dueDate:formatDate(new Date()),                    // due today
            category:"Study",
            reminder:"",
            completed:true,                                    // this sample task is already completed
            createdAt:Date.now()-1000
        }

    ];

    // Save the sample tasks to localStorage immediately
    saveTasks();
}


// Shortcut: $("abc") is the same as document.getElementById("abc")
const $ = id => document.getElementById(id);


// Converts a Date object into a "YYYY-MM-DD" string (the format used by <input type="date">)
function formatDate(date){

    // Get the 4-digit year
    const y = date.getFullYear();

    // Get the month (0-11, so +1) and pad it to 2 digits, e.g. 3 -> "03"
    const m = String(
        date.getMonth()+1
    ).padStart(2,"0");

    // Get the day of the month and pad it to 2 digits
    const d = String(
        date.getDate()
    ).padStart(2,"0");

    // Join them in YYYY-MM-DD format using a template string
    return `${y}-${m}-${d}`;
}


// Converts a "YYYY-MM-DD" string back into a Date object
function parseDate(s){

    // Split the string at "-" and convert each part to a Number (destructured into y, m, d)
    const [y,m,d] = s.split("-").map(Number);

    // Create the Date (month is 0-based, so subtract 1)
    return new Date(y,m-1,d);
}


// Returns a new date that is n days after (or before, if n is negative) the given date
function addDays(date,n){

    // Copy the date so the original is not modified
    const d = new Date(date);

    // Add n days to the day-of-month (JavaScript handles month overflow automatically)
    d.setDate(
        d.getDate()+n
    );

    // Return the new date
    return d;
}


// Returns today's date as a "YYYY-MM-DD" string
function today(){

    return formatDate(
        new Date()
    );

}


// Saves the whole tasks array into localStorage so data survives page refresh
function saveTasks(){

    localStorage.setItem(
        STORAGE_KEY,              // key name
        JSON.stringify(tasks)     // convert the array to a JSON string (localStorage stores only text)
    );

}


// Makes text safe to insert into HTML (prevents XSS / broken layout from characters like < and >)
function escapeHtml(value){

    // Convert value to string ("" if null/undefined), then replace each dangerous character
    return String(value ?? "").replace(
        /[&<>"']/g,               // regex: matches any of & < > " '
        c => ({                   // for each matched character c, look up its HTML-safe version
            "&":"&amp;",
            "<":"&lt;",
            ">":"&gt;",
            '"':"&quot;",
            "'":"&#039;"
        }[c])
    );

}


// Converts a priority name into a number so tasks can be sorted by importance
function priorityWeight(p){

    return p==="high"             // if high...
        ?3                        // ...weight 3
        :p==="medium"             // else if medium...
        ?2                        // ...weight 2
        :1;                       // otherwise (low) weight 1

}


// A task is overdue if it is NOT completed AND its due date is before today
// (string comparison works because YYYY-MM-DD sorts alphabetically in date order)
function isOverdue(t){

    return !t.completed &&
           t.dueDate < today();

}


// Converts a "YYYY-MM-DD" string into a readable date like "5 Nov 2026" (or "Today")
function prettyDate(s){

    // If the date is today, simply show the word "Today"
    if(s===today())
        return "Today";

    // Otherwise convert the string to a Date object
    const d = parseDate(s);

    // Format it using Indian English locale: day number, short month name, full year
    return d.toLocaleDateString(
        "en-IN",
        {
            day:"numeric",
            month:"short",
            year:"numeric"
        }
    );

}


// Returns the HTML for the coloured priority badge (HIGH / MEDIUM / LOW)
function priorityBadge(p){

    // Pick the uppercase label text based on the priority
    const label =
        p==="high"
        ?"HIGH"
        :p==="medium"
        ?"MEDIUM"
        :"LOW";

    // Return a <span> whose CSS class (e.g. priority-high) controls the colour
    return `
        <span class="badge priority-${p}">
            ${label}
        </span>
    `;

}


// Builds and returns the HTML card for ONE task (used in Today, All Tasks and Calendar lists)
function taskHtml(t){

    return `

    <div class="task">

        <!-- Round check button; adds class "done" if task is completed; clicking toggles completion -->
        <button
            class="check ${t.completed?"done":""}"
            onclick="toggleTask(${t.id})"
            aria-label="Complete task">

            ${t.completed?"✓":""}  <!-- show a tick only when completed -->

        </button>


        <div class="task-main">

            <!-- Task title (struck through via CSS when done); escapeHtml keeps it safe -->
            <div class="task-title ${t.completed?"done":""}">
                ${escapeHtml(t.title)}
            </div>


            ${
                t.description                       // show the description block only if one exists
                ?
                `<div class="task-desc">
                    ${escapeHtml(t.description)}
                 </div>`
                :
                ""                                  // otherwise output nothing
            }


            <div class="task-meta">

                <!-- Priority badge -->
                ${priorityBadge(t.priority)}

                <!-- Due date badge -->
                <span class="badge badge-date">
                    📅 ${prettyDate(t.dueDate)}
                </span>

                ${
                    t.reminder                      // show the due time badge only if a time is set
                    ?
                    `<span class="badge badge-date">
                        ⏰ ${prettyTime(t.reminder)}
                     </span>`
                    :
                    ""
                }

                ${
                    t.category                      // show category badge only if a category is set
                    ?
                    `<span class="badge badge-date">
                        ${escapeHtml(t.category)}
                     </span>`
                    :
                    ""
                }

                ${
                    isOverdue(t)                    // show red OVERDUE badge if the task is overdue
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

            <!-- Edit button: opens the edit modal for this task -->
            <button
                class="icon-btn"
                onclick="openEditModal(${t.id})"
                title="Edit">
                ✎
            </button>

            <!-- Delete button: deletes this task (with Undo option) -->
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


// Master render function: redraws every section of the UI from the current tasks data
function render(){

    renderStats();          // top statistic cards
    renderToday();          // today's task list
    renderFocus();          // "Top focus" list
    renderProgress();       // progress bars/circles
    renderAllTasks();       // full task list with filters
    renderCalendar();       // calendar grid
    renderSelectedDate();   // tasks of the selected calendar date
    renderReminder();       // reminder message box

}


// Updates the five statistic numbers on the dashboard
function renderStats(){

    // Total number of tasks
    const total = tasks.length;

    // Count of completed tasks (filter keeps only completed ones, .length counts them)
    const completed =
        tasks.filter(
            t => t.completed
        ).length;


    // Show total count in its element
    $("totalCount").textContent = total;

    // Pending = tasks that are not completed
    $("pendingCount").textContent =
        tasks.filter(
            t => !t.completed
        ).length;

    // Show completed count
    $("completedCount").textContent =
        completed;

    // Overdue = tasks for which isOverdue() returns true
    $("overdueCount").textContent =
        tasks.filter(
            isOverdue
        ).length;

    // High priority tasks that are still pending
    $("highCount").textContent =
        tasks.filter(
            t =>
                t.priority==="high" &&
                !t.completed
        ).length;

}


// Shows the list of tasks that are due today
function renderToday(){

    const list =
        tasks
        .filter(
            t => t.dueDate===today()       // keep only tasks due today
        )
        .sort(
            (a,b) =>
                Number(a.completed) -      // first: pending tasks before completed ones
                Number(b.completed) ||
                priorityWeight(b.priority) -   // then: higher priority first
                priorityWeight(a.priority)
        );


    // Summary sentence: "1 task scheduled..." / "3 tasks scheduled..." / "No tasks for today."
    $("todaySummary").textContent =
        list.length
        ?
        `${list.length} task${list.length===1?"":"s"} scheduled for today.`
        :
        "No tasks for today.";


    // If tasks exist, convert each into HTML and join them; otherwise show an empty-state message
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


// Shows the "Top Focus" list: the 4 most urgent pending tasks
function renderFocus(){

    const list =
        tasks
        .filter(
            t => !t.completed              // only pending tasks
        )
        .sort(
            (a,b) => {

                // 1 if task a is overdue, else 0
                const ao =
                    isOverdue(a) ? 1 : 0;

                // 1 if task b is overdue, else 0
                const bo =
                    isOverdue(b) ? 1 : 0;

                return (
                    bo-ao ||                                   // overdue tasks come first
                    priorityWeight(b.priority) -               // then higher priority first
                    priorityWeight(a.priority) ||
                    a.dueDate.localeCompare(                   // then earlier due date first
                        b.dueDate
                    )
                );

            }
        )
        .slice(0,4);                       // keep only the top 4


    $("focusList").innerHTML =
        list.length
        ?
        list.map(
            (t,i) => `

            <div class="focus-item">

                <div>

                    <!-- Rank number + title -->
                    <strong>
                        ${i+1}. ${escapeHtml(t.title)}
                    </strong>

                    <!-- Priority badge and due date -->
                    <small>
                        ${priorityBadge(t.priority)}
                        ·
                        ${prettyDate(t.dueDate)}
                    </small>

                </div>


                <!-- Quick button to mark this task complete -->
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


// Shows the full task list on the Tasks page, applying search, filter and sort
function renderAllTasks(){

    // Get the search text: trim spaces and make it lowercase for case-insensitive search
    // (?. avoids an error if the search box doesn't exist)
    const q =
        (
            $("searchInput")?.value || ""
        )
        .trim()
        .toLowerCase();


    // Filter tasks according to search text and the active filter button
    let list =
        tasks.filter(t => {

            // Combine title + description + category into one lowercase string to search in
            const text =
                (
                    t.title +
                    " " +
                    t.description +
                    " " +
                    t.category
                ).toLowerCase();


            // If there is a search query and the text doesn't contain it, exclude this task
            if(q && !text.includes(q))
                return false;


            // "Today" filter: only tasks due today
            if(activeFilter==="today")
                return t.dueDate===today();


            // "Pending" filter: only incomplete tasks
            if(activeFilter==="pending")
                return !t.completed;


            // "Completed" filter: only completed tasks
            if(activeFilter==="completed")
                return t.completed;


            // "Overdue" filter: only overdue tasks
            if(activeFilter==="overdue")
                return isOverdue(t);


            // "High" filter: high priority tasks that are still pending
            if(activeFilter==="high")
                return (
                    t.priority==="high" &&
                    !t.completed
                );


            // "All" filter: keep everything
            return true;

        });


    // Read the chosen sort option from the dropdown (default "newest")
    const sort =
        $("sortSelect")?.value ||
        "newest";


    // Sort by priority (high first), ties broken by earlier due date
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

    // Sort by due date (earliest first)
    else if(sort==="due"){

        list.sort(
            (a,b) =>
                a.dueDate.localeCompare(
                    b.dueDate
                )
        );

    }

    // Sort by status (pending first, completed last)
    else if(sort==="status"){

        list.sort(
            (a,b) =>
                Number(a.completed) -
                Number(b.completed)
        );

    }

    // Default: newest created first
    else{

        list.sort(
            (a,b) =>
                b.createdAt -
                a.createdAt
        );

    }


    // Show the tasks, or an empty-state message if the list is empty
    $("allTasks").innerHTML =
        list.length
        ?
        list.map(taskHtml).join("")
        :
        `
        <div class="empty">

            <div class="empty-icon">
                ${
                    q || activeFilter!=="all"      // if a search/filter is active show 🔎, else 🎉
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


// Updates all progress indicators (dashboard + Progress page)
function renderProgress(){

    // Total number of tasks
    const total = tasks.length;

    // Number of completed tasks
    const done =
        tasks.filter(
            t => t.completed
        ).length;


    // Completion percentage (rounded); 0 if there are no tasks (avoids division by zero)
    const pct =
        total
        ?
        Math.round(
            done/total*100
        )
        :
        0;


    // Set the CSS variable --progress on the dashboard circle (CSS draws the ring using it)
    $("dashboardCircle")
        .style
        .setProperty(
            "--progress",
            pct+"%"
        );


    // Show the percentage text inside the dashboard circle
    $("dashboardPercent")
        .textContent =
        pct+"%";


    // Set the width of the dashboard progress bar
    $("dashboardProgress")
        .style.width =
        pct+"%";


    // Text like "3 of 4 tasks completed"
    $("progressText")
        .textContent =
        `${done} of ${total} tasks completed`;


    // Motivational message depending on how much is done
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


    // Same ring, but for the Progress page
    $("progressCircle")
        .style
        .setProperty(
            "--progress",
            pct+"%"
        );


    // Percentage text on the Progress page
    $("progressPercent")
        .textContent =
        pct+"%";


    // Width of the Progress page bar
    $("progressFill")
        .style.width =
        pct+"%";


    // Heading text on the Progress page based on percentage
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


    // Detailed sentence, e.g. "3 completed out of 4 total tasks (75%)."
    $("progressDetail")
        .textContent =
        `${done} completed out of ${total} total tasks (${pct}%).`;


    // Number of tasks completed TODAY (compares completedAt date with today's date)
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


    // Number of tasks completed since the start of this week (Monday)
    $("doneWeek").textContent =
        tasks.filter(
            t =>
                t.completed &&
                t.completedAt &&
                new Date(t.completedAt) >=
                startOfWeek()
        ).length;


    // Total completed tasks
    $("doneTotal").textContent =
        done;


    // Tasks still remaining
    $("remainingTotal").textContent =
        total-done;

}


// Returns true if two Date objects fall on the same calendar day
function sameDate(a,b){

    return formatDate(a) ===
           formatDate(b);

}


// Returns a Date representing Monday 00:00 of the current week
function startOfWeek(){

    // Current date/time
    const d = new Date();

    // Day of the week: 0 = Sunday ... 6 = Saturday
    const day = d.getDay();

    // Move back to Monday (if Sunday go back 6 days, else go back day-1 days)
    d.setDate(
        d.getDate() -
        (day===0 ? 6 : day-1)
    );

    // Reset the time to midnight (00:00:00.000)
    d.setHours(
        0,0,0,0
    );

    return d;

}


// Shows a coloured reminder message based on overdue/today's pending tasks
function renderReminder(){

    // Number of overdue tasks
    const overdue =
        tasks.filter(
            isOverdue
        ).length;


    // Number of pending tasks due today
    const todayPending =
        tasks.filter(
            t =>
                t.dueDate===today() &&
                !t.completed
        ).length;


    // If reminders are switched off in Settings, show a simple message and stop
    if(!remindersEnabled){

        $("reminderBox").innerHTML =
            `
            <p class="muted">
                Reminders are turned off in Settings.
            </p>
            `;

        return;
    }


    // Case 1: there are overdue tasks -> red warning box
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

    // Case 2: no overdue, but tasks due today -> yellow box
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

    // Case 3: nothing urgent -> green "on track" box
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


// Draws the monthly calendar grid
function renderCalendar(){

    // Year of the month being displayed
    const year =
        calendarDate.getFullYear();

    // Month number (0 = January ... 11 = December)
    const month =
        calendarDate.getMonth();


    // Set the title, e.g. "November 2026"
    $("calendarTitle")
        .textContent =
        calendarDate.toLocaleDateString(
            "en-IN",
            {
                month:"long",
                year:"numeric"
            }
        );


    // First day of this month
    const first =
        new Date(
            year,
            month,
            1
        );


    // Last day of this month (day 0 of next month = last day of this month)
    const last =
        new Date(
            year,
            month+1,
            0
        );


    // How many empty cells come before the 1st (calendar starts on Monday, so shift by 6 mod 7)
    const start =
        (first.getDay()+6)%7;


    // Array that will hold the HTML of every calendar cell
    const cells = [];


    // Add the 7 weekday header cells
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


    // Number of days in the previous month (to show greyed-out leading days)
    const prevLast =
        new Date(
            year,
            month,
            0
        ).getDate();


    // Add greyed-out days of the previous month before the 1st
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


    // Add one cell for every day of the current month
    for(
        let d=1;
        d<=last.getDate();
        d++
    ){

        // Date object for this day
        const date =
            new Date(
                year,
                month,
                d
            );


        // Same date as a "YYYY-MM-DD" string
        const ds =
            formatDate(date);


        // How many tasks are due on this day
        const count =
            tasks.filter(
                t =>
                    t.dueDate===ds
            ).length;


        cells.push(
            `
            <div class="day ${ds===today()?"today":""} ${ds===selectedCalendarDate?"selected":""}"
                 onclick="selectCalendarDate('${ds}')">

                <div class="day-number">
                    ${d}
                </div>

                ${
                    count                                        // if the day has tasks, show a dot and count
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


    // Round the number of cells up to a full multiple of 7 (complete weeks)
    const totalCells =
        Math.ceil(
            cells.length/7
        )*7;


    // Counter for next month's leading days (1, 2, 3...)
    let next = 1;


    // Fill the remaining cells with greyed-out days of the next month
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


    // Put all cells into the calendar grid element
    $("calendarGrid")
        .innerHTML =
        cells.join("");

}


// Shows the title and tasks of the date selected in the calendar
function renderSelectedDate(){

    // Convert the selected date string to a Date object
    const d =
        parseDate(
            selectedCalendarDate
        );


    // Title like "Monday, 23 November 2026"
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


    // Tasks whose due date equals the selected date
    const list =
        tasks.filter(
            t =>
                t.dueDate===
                selectedCalendarDate
        );


    // Show the tasks or an empty-state message
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


// Called when a calendar day is clicked
function selectCalendarDate(ds){

    // Remember the clicked date
    selectedCalendarDate = ds;

    // Redraw the calendar (to move the highlight)
    renderCalendar();

    // Redraw the task list for that date
    renderSelectedDate();

}


// Switches between pages (dashboard, tasks, calendar, progress, settings)
function showPage(page){

    // Find every element with class "page" and hide it by removing the "active" class
    document
        .querySelectorAll(".page")
        .forEach(
            p =>
                p.classList.remove("active")
        );


    // Show the requested page (its element id is e.g. "dashboardPage")
    $(page+"Page")
        .classList.add("active");


    // Update the highlighted button in both the sidebar and the mobile navigation
    document
        .querySelectorAll(
            ".nav button,.mobile-nav button"
        )
        .forEach(
            b =>
                b.classList.toggle(
                    "active",                 // class to add/remove
                    b.dataset.page===page     // add it only on the button whose data-page matches
                )
        );


    // Page heading and subheading text for every page
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


    // Set the page title (first item of the array)
    $("pageTitle")
        .textContent =
        titles[page][0];


    // Set the page subtitle (second item of the array)
    $("pageSubtitle")
        .textContent =
        titles[page][1];


    // Close the sidebar (useful on mobile after choosing a page)
    $("sidebar")
        .classList
        .remove("open");


    // Refresh the calendar when it is opened
    if(page==="calendar")
        renderCalendar();


    // Refresh the progress page when it is opened
    if(page==="progress")
        renderProgress();

}


// Opens the modal (popup) in "Add New Task" mode
function openAddModal(){

    // Set the modal heading
    $("modalTitle")
        .textContent =
        "Add New Task";


    // Set the submit button text
    $("saveTaskBtn")
        .textContent =
        "Add Task";


    // Clear the hidden edit id (empty means "new task", not editing)
    $("editId")
        .value = "";


    // Clear all form fields
    $("taskForm").reset();


    // Default priority is medium
    $("taskPriority")
        .value =
        "medium";


    // Default due date is today
    $("taskDate")
        .value =
        today();


    // Show the modal by adding the "show" class
    $("modalBackdrop")
        .classList
        .add("show");


    // After 50 ms put the cursor in the title field (delay lets the modal appear first)
    setTimeout(
        () =>
            $("taskTitle").focus(),
        50
    );

}


// Opens the modal in "Edit Task" mode and fills it with the existing task's data
function openEditModal(id){

    // Find the task with the given id
    const t =
        tasks.find(
            x => x.id===id
        );


    // If no such task exists, do nothing
    if(!t)
        return;


    // Set modal heading
    $("modalTitle")
        .textContent =
        "Edit Task";


    // Set submit button text
    $("saveTaskBtn")
        .textContent =
        "Save Changes";


    // Store the task id in the hidden field so the submit handler knows which task to update
    $("editId")
        .value =
        t.id;


    // Fill the form fields with the task's current values
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


    // Fill the optional due time ("HH:MM" is stored in the reminder field)
    $("taskTime")
        .value =
        t.reminder || "";




    // Show the modal
    $("modalBackdrop")
        .classList
        .add("show");

}


// Closes the add/edit modal
function closeModal(){

    $("modalBackdrop")
        .classList
        .remove("show");

}


// Marks a task complete/incomplete (flips its status)
function toggleTask(id){

    // Find the task by id
    const t =
        tasks.find(
            x => x.id===id
        );


    // Stop if not found
    if(!t)
        return;


    // Flip completed: true -> false, false -> true
    t.completed =
        !t.completed;


    // If now completed store the time of completion, otherwise clear it
    t.completedAt =
        t.completed
        ?
        Date.now()
        :
        null;


    // Save changes to localStorage
    saveTasks();

    // Redraw the UI
    render();


    // Show a feedback message
    showToast(
        t.completed
        ?
        "Task completed ✓"
        :
        "Task marked as pending"
    );

}


// Deletes a task but remembers it so Undo can bring it back
function deleteTask(id){

    // Position (index) of the task in the array; -1 if not found
    const index =
        tasks.findIndex(
            x => x.id===id
        );


    // Stop if not found
    if(index<0)
        return;


    // Remember the deleted task and its original position for Undo
    undoTask = {
        task:tasks[index],
        index:index
    };


    // Remove 1 task at that position from the array
    tasks.splice(
        index,
        1
    );


    // Save and redraw
    saveTasks();

    render();

    // Show toast with the Undo button visible (second argument true)
    showToast(
        "Task deleted",
        true
    );

}


// Shows a small popup message at the bottom; optionally with an Undo button
function showToast(
    message,
    undo=false          // default: no Undo button
){

    // Set the message text
    $("toastText")
        .textContent =
        message;


    // Show the Undo button only when undo is true
    $("undoBtn")
        .style
        .display =
        undo
        ?
        "inline"
        :
        "none";


    // Make the toast visible
    $("toast")
        .classList
        .add("show");


    // Cancel any previous timer so the toast doesn't hide too early
    clearTimeout(
        undoTimer
    );


    // After 5 seconds hide the toast and forget the deleted task (Undo expires)
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


// Undo button: restores the last deleted task
$("undoBtn").onclick = () => {

    // Nothing to undo
    if(!undoTask)
        return;


    // Insert the task back at its original index (0 = delete nothing)
    tasks.splice(
        undoTask.index,
        0,
        undoTask.task
    );


    // Save and redraw
    saveTasks();

    render();


    // Clear the undo memory
    undoTask = null;


    // Hide the toast
    $("toast")
        .classList
        .remove("show");

};


// Runs when the add/edit form is submitted
$("taskForm")
    .addEventListener(
        "submit",
        e => {

            // Stop the browser from reloading the page
            e.preventDefault();


            // Read the title and remove extra spaces
            const title =
                $("taskTitle")
                .value
                .trim();


            // Title is mandatory; stop if empty
            if(!title)
                return;


            // Read the hidden id as a number (0 / NaN-like falsy if adding a new task)
            const editId =
                Number(
                    $("editId").value
                );


            // Collect the form values into one object
            const data = {

                title,                          // shorthand for title: title

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

                reminder: $("taskTime").value   // due time "HH:MM" (empty = no time)

            };


            // If editId has a value we are EDITING an existing task
            if(editId){

                // Find the task
                const t =
                    tasks.find(
                        x =>
                            x.id===editId
                    );


                // Copy the new values into the existing task object
                if(t)
                    Object.assign(
                        t,
                        data
                    );


                // Feedback message
                showToast(
                    "Task updated ✓"
                );

            }

            // Otherwise we are ADDING a new task
            else{

                tasks.push({

                    id:Date.now(),              // unique id from the current timestamp

                    ...data,                    // spread: copy all fields from data

                    completed:false,            // new tasks start as pending

                    completedAt:null,           // not completed yet

                    createdAt:Date.now()        // creation time

                });


                showToast(
                    "Task added ✓"
                );

            }


            // Save, redraw and close the modal
            saveTasks();

            render();

            closeModal();

        }
    );


// "Add Task" button opens the add modal
$("addTaskBtn").onclick = () => openAddModal();


// The X button closes the modal
$("closeModal").onclick =
    closeModal;


// The Cancel button closes the modal
$("cancelModal").onclick =
    closeModal;


// Clicking on the dark area outside the modal also closes it
$("modalBackdrop")
    .addEventListener(
        "click",
        e => {

            // Only if the click was directly on the backdrop (not inside the modal box)
            if(
                e.target ===
                $("modalBackdrop")
            ){

                closeModal();

            }

        }
    );


// Every element with a data-page attribute becomes a navigation button
document
    .querySelectorAll("[data-page]")
    .forEach(
        btn =>
            btn.addEventListener(
                "click",
                () =>
                    showPage(
                        btn.dataset.page      // open the page named in data-page
                    )
            )
    );


// Re-filter the task list on every keystroke in the search box
$("searchInput")
    .addEventListener(
        "input",
        renderAllTasks
    );


// Re-sort the list when the sort dropdown changes
$("sortSelect")
    .addEventListener(
        "change",
        renderAllTasks
    );


// Set up every filter button on the Tasks page
document
    .querySelectorAll(
        "#filters .filter-btn"
    )
    .forEach(
        btn => {

            btn.addEventListener(
                "click",
                () => {

                    // Save the chosen filter (from the button's data-filter attribute)
                    activeFilter =
                        btn.dataset.filter;


                    // Highlight only the clicked button
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


                    // Redraw the list with the new filter
                    renderAllTasks();

                }
            );

        }
    );


// Previous month button in the calendar
$("prevMonth").onclick =
    () => {

        // Move the displayed month back by one
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1);

        renderCalendar();

    };


// Next month button in the calendar
$("nextMonth").onclick =
    () => {

        // Move the displayed month forward by one
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1);

        renderCalendar();

    };


// Hamburger menu button toggles the sidebar (for mobile)
$("menuBtn").onclick =
    () =>
        $("sidebar")
        .classList
        .toggle("open");


// Reminder on/off switch in Settings
$("reminderToggle").onclick =
    () => {

        // Flip the setting
        remindersEnabled =
            !remindersEnabled;


        // Update the switch's look ("on" class when enabled)
        $("reminderToggle")
            .classList
            .toggle(
                "on",
                remindersEnabled
            );


        // Redraw everything (reminder box + due-today alert)
        render();

    };


// "Clear all tasks" button in Settings
$("clearAllBtn").onclick =
    () => {

        // Ask for confirmation first; runs only if user clicks OK
        if(
            confirm(
                "Are you sure you want to delete all tasks? This cannot be undone."
            )
        ){

            // Empty the array
            tasks = [];

            // Save, redraw and notify
            saveTasks();

            render();

            showToast(
                "All tasks cleared"
            );

        }

    };



/* Modern polish: themes, motivation, pending-task centre and strict date rules */
// Key used to save the chosen theme (light/dark) in localStorage
const THEME_KEY = "smartTaskThemeV1";

// List of motivational quotes (each has the quote text and its author)
const quoteBank = [
    { quote: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { quote: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
    { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" }
];
// Index of the last shown quote (-1 = none yet), used to avoid showing the same quote twice in a row
let lastQuoteIndex = -1;

// Prevents choosing past dates in the date input
function setDateMinimum() {
    // Get the date input element
    const dateInput = $("taskDate");
    // If it doesn't exist, stop
    if (!dateInput) return;
    // Set the minimum selectable date to today (browser greys out earlier dates)
    dateInput.min = today();
    // If the current value is in the past, reset it to today
    if (dateInput.value && dateInput.value < today()) {
        dateInput.value = today();
    }
}
// Shows a warning message under the date field
function showDateError(message) {
    const banner = $("dateValidation");   // the warning element
    if (banner) {
        banner.textContent = "⚠ " + message;   // set the text with a warning sign
        banner.hidden = false;                 // make it visible
    }
}
// Hides the date warning message
function clearDateError() {
    const banner = $("dateValidation");
    if (banner) {
        banner.hidden = true;        // hide it
        banner.textContent = "";     // clear the text
    }
}
// Shows a new random motivational quote
function refreshQuote() {
    // Pick a random index from 0 to quoteBank.length-1
    let index = Math.floor(Math.random() * quoteBank.length);
    // If it is the same as the last quote, move to the next one (wraps around with %)
    if (quoteBank.length > 1 && index === lastQuoteIndex) index = (index + 1) % quoteBank.length;
    // Remember this index for next time
    lastQuoteIndex = index;
    // Get the chosen quote object
    const quote = quoteBank[index];
    // Get the quote container (used for the fade animation)
    const content = document.querySelector(".quote-content");
    // Add a CSS class that fades the old quote out
    if (content) content.classList.add("quote-changing");
    // After 170 ms (fade-out finished) swap the text and fade back in
    window.setTimeout(() => {
        $("dailyQuote").textContent = quote.quote;               // quote text
        $("quoteAuthor").textContent = "— " + quote.author;      // author name
        if (content) content.classList.remove("quote-changing"); // fade in
    }, 170);
}
// Applies the light or dark theme
function applyTheme(theme) {
    // Set data-theme on <html>; CSS uses it to switch colours
    document.documentElement.dataset.theme = theme;
    // Save the choice so it is remembered next visit
    localStorage.setItem(THEME_KEY, theme);
    // true if the theme is dark
    const dark = theme === "dark";
    // Show a sun icon in dark mode (to switch to light) and a moon in light mode
    $("themeIcon").textContent = dark ? "☀" : "☾";
    // Get the text label next to the icon
    const label = document.querySelector(".theme-toggle-label");
    // Update the label text
    if (label) label.textContent = dark ? "Light mode" : "Dark mode";
    // Update the accessibility state of the toggle button
    $("themeToggle").setAttribute("aria-pressed", String(dark));
}
// Returns pending tasks sorted by urgency (overdue first, then priority, then due date)
function pendingTasks() {
    return tasks.filter(t => !t.completed).sort((a,b) =>
        (isOverdue(b) - isOverdue(a)) ||                       // overdue first (true/false becomes 1/0)
        priorityWeight(b.priority) - priorityWeight(a.priority) ||  // higher priority first
        a.dueDate.localeCompare(b.dueDate)                     // earlier date first
    );
}
// Updates the notification bell badge and the "due today" alert
function renderPendingCentre() {
    // All pending tasks
    const pending = pendingTasks();
    // The red count badge on the bell icon
    const badge = $("notificationCount");
    // Show "99+" if there are more than 99 tasks, otherwise the exact number
    badge.textContent = pending.length > 99 ? "99+" : String(pending.length);
    // Add the "has-count" style only when there is at least one pending task
    badge.classList.toggle("has-count", pending.length > 0);
    // Number of pending tasks due today
    const dueToday = pending.filter(t => t.dueDate === today()).length;
    // The alert banner element
    const alert = $("dueTodayAlert");
    // Hide it if reminders are off or nothing is due today
    alert.hidden = !remindersEnabled || dueToday === 0;
    // Grammar: singular for 1 task, plural otherwise
    $("dueTodayText").textContent = dueToday === 1
        ? "You have 1 task due today. Make a little progress."
        : `You have ${dueToday} tasks due today. Make a little progress.`;
}
// Opens the popup listing all pending tasks
function openPendingModal() {
    // Get sorted pending tasks
    const pending = pendingTasks();
    // Build one row per task, or an empty-state message if there are none
    $("pendingTasksList").innerHTML = pending.length ? pending.map(t => `
        <div class="pending-item">
            <div class="pending-item-copy">
                <strong>${escapeHtml(t.title)}</strong>
                <!-- Shows "Overdue" or "Due <date>" plus the category (default "General") -->
                <span>${isOverdue(t) ? "Overdue" : "Due " + prettyDate(t.dueDate)} · ${escapeHtml(t.category || "General")}</span>
            </div>
            <!-- Done button: completes the task, then reopens the modal to refresh the list -->
            <button class="complete-quick" onclick="toggleTask(${t.id}); openPendingModal();" ${t.completed ? "disabled" : ""}>✓ Done</button>
        </div>`).join("") : `
        <div class="empty"><div class="empty-icon">✦</div><strong>You're all caught up</strong><p style="margin-top:6px">No pending tasks right now.</p></div>`;
    // Show the popup
    $("pendingBackdrop").classList.add("show");
}
// Closes the pending tasks popup
function closePendingModal() {
    $("pendingBackdrop").classList.remove("show");
}
// Dashboard statistic cards act as shortcuts to their matching task lists.
// Select every stat card that has a data-stat-filter attribute
document.querySelectorAll(".stat-button[data-stat-filter]").forEach(card => {
    // When a card is clicked...
    card.addEventListener("click", () => {
        // Read which filter this card represents (default "all")
        const filter = card.dataset.statFilter || "all";
        // Set it as the active filter
        activeFilter = filter;
        // Go to the Tasks page
        showPage("tasks");
        // Highlight the matching filter button
        document.querySelectorAll("#filters .filter-btn").forEach(button => {
            button.classList.toggle("active", button.dataset.filter === filter);
        });
        // Clear the search box so all matching tasks are visible
        if ($("searchInput")) $("searchInput").value = "";
        // Redraw the task list
        renderAllTasks();
        // Smoothly scroll to the top of the Tasks page
        $("tasksPage").scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

// Theme button: switch between dark and light
$("themeToggle").addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});
// Bell icon opens the pending tasks popup
$("notificationBtn").addEventListener("click", openPendingModal);
// Close button of the pending popup
$("closePending").addEventListener("click", closePendingModal);
// Clicking outside the pending popup closes it
$("pendingBackdrop").addEventListener("click", e => {
    if (e.target === $("pendingBackdrop")) closePendingModal();
});
// Refresh-quote button shows a new quote
$("refreshQuote").addEventListener("click", refreshQuote);
// Clicking the "due today" alert opens the Tasks page filtered to today
$("dueTodayAlert").addEventListener("click", () => {
    showPage("tasks");                // go to Tasks page
    activeFilter = "today";           // set the today filter
    // Highlight the "today" filter button only
    document.querySelectorAll("#filters .filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === "today"));
    renderAllTasks();                 // redraw the list
});
// When the user picks a date in the date input...
$("taskDate").addEventListener("change", () => {
    clearDateError();                 // remove any old warning
    setDateMinimum();                 // re-apply today as minimum
    // If the chosen date is in the past, warn and reset to today
    if ($("taskDate").value < today()) {
        showDateError("Past dates aren't allowed. Choose today or a future date.");
        $("taskDate").value = today();
    }
});
// While typing/changing the date, show or hide the warning live
$("taskDate").addEventListener("input", () => {
    if ($("taskDate").value && $("taskDate").value < today()) {
        showDateError("Past dates aren't allowed. Choose today or a future date.");
    } else clearDateError();
});
// When the browser tab becomes visible again (e.g. after midnight), refresh the date limit and badge
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        setDateMinimum();
        renderPendingCentre();
    }
});
// Keep a reference to the original render function
const originalRender = render;
// Replace render with a version that also updates the pending centre (bell badge)
render = function() {
    originalRender();        // do the normal rendering
    renderPendingCentre();   // then update the bell badge and alert
};
// Keep the original openAddModal
const originalOpenAddModal = openAddModal;
// Wrap it so the date rules are applied every time the add modal opens
openAddModal = function() {
    clearDateError();          // hide old warnings
    originalOpenAddModal();    // open the modal normally
    setDateMinimum();          // block past dates
};
// Keep the original openEditModal
const originalOpenEditModal = openEditModal;
// Wrap it as well for the edit modal
openEditModal = function(id) {
    clearDateError();              // hide old warnings
    originalOpenEditModal(id);     // open the modal normally
    setDateMinimum();              // block past dates
    // Find the task being edited
    const task = tasks.find(t => t.id === id);
    // If that task has a past due date...
    if (task && task.dueDate < today()) {
        // Existing overdue tasks can still be edited, but cannot be saved with a past date.
        $("taskDate").value = today();   // set the date field to today
        showDateError("This task was overdue. Choose today or a future date to save changes.");
    }
};
// Get the form element again (the variable name is misleading; it is just the form)
const originalSubmitHandler = $("taskForm");
// Add an extra submit listener that validates the date BEFORE the main handler runs
// (the final "true" means capture phase, so this runs first)
originalSubmitHandler.addEventListener("submit", e => {
    // Read the chosen date
    const dateValue = $("taskDate").value;
    // If empty or in the past, block saving
    if (!dateValue || dateValue < today()) {
        e.preventDefault();              // stop the default form submission
        e.stopImmediatePropagation();    // stop the main submit handler from running
        setDateMinimum();                // re-apply the minimum date
        showDateError("Please choose today or a future date. Past dates are not permitted.");
        $("taskDate").focus();           // move the cursor to the date field
        return;
    }

    // Time check: a time that has already passed today cannot be saved (unless it was not changed while editing)
    const timeValue = $("taskTime").value;
    const editingId = Number($("editId").value);
    const existing = editingId ? tasks.find(x => x.id === editingId) : null;
    const unchanged = existing && existing.dueDate === dateValue && (existing.reminder || "") === timeValue;
    if (!unchanged && timeValue && dateValue === today() && timeValue < nowHM()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showDateError("That time has already passed today. Choose a later time.");
        $("taskTime").focus();
        return;
    }

    // First time a task gets a due time: ask the browser for notification permission
    if (timeValue && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then(updateNotifyBtn);
    }
}, true);

// On page load: apply saved theme (dark if saved as "dark", otherwise light)
applyTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
// Show an initial motivational quote
refreshQuote();
// Apply the minimum date rule
setDateMinimum();

// Draw the whole UI for the first time
render();


/* ===== Task time notifications ===== */
// Key that remembers which task reminders were already shown (so a page refresh does not repeat them)
const NOTIFIED_KEY = "smartTaskNotifiedV1";
let notified = new Set();
try { notified = new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]")); } catch (err) {}

// Current time as "HH:MM" (24-hour), same format as <input type="time">
function nowHM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Converts "17:30" into "5:30 PM"
function prettyTime(hm) {
    const [h, m] = String(hm).split(":").map(Number);
    return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
}

// Short beep so the user notices the reminder (browsers may block it until the page was clicked once)
function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch (err) {}
}

// Shows the reminder in the app (toast + beep) and as a browser notification if allowed
function fireTaskNotification(t) {
    showToast("⏰ " + t.title + " is due now (" + prettyTime(t.reminder) + ")");
    playBeep();
    if ("Notification" in window && Notification.permission === "granted") {
        try {
            new Notification("SmartTask reminder", {
                body: t.title + " — due at " + prettyTime(t.reminder),
                tag: "smarttask-" + t.id
            });
        } catch (err) {}
    }
}

// Runs every few seconds: notifies for pending tasks whose due date is today and due time has arrived
function checkDueNotifications() {
    if (!remindersEnabled) return;          // respects the "Daily reminders" switch in Settings
    const hm = nowHM();
    let changed = false;
    tasks.forEach(t => {
        if (t.completed || !t.reminder || t.dueDate !== today()) return;
        if (t.reminder > hm) return;        // time not reached yet
        const key = t.id + "|" + t.dueDate + "|" + t.reminder;
        if (notified.has(key)) return;      // already notified
        notified.add(key);
        changed = true;
        fireTaskNotification(t);
    });
    if (changed) {
        try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified].slice(-200))); } catch (err) {}
    }
}

// Updates the Enable button in Settings according to the browser permission
function updateNotifyBtn() {
    const btn = $("notifyBtn");
    if (!btn) return;
    if (!("Notification" in window)) { btn.textContent = "Not supported"; btn.disabled = true; return; }
    const p = Notification.permission;
    btn.textContent = p === "granted" ? "Enabled ✓" : p === "denied" ? "Blocked in browser" : "Enable";
    btn.disabled = p !== "default";
}

$("notifyBtn").addEventListener("click", () => {
    Notification.requestPermission().then(p => {
        updateNotifyBtn();
        if (p === "granted") {
            showToast("Notifications enabled ✓");
            try { new Notification("SmartTask", { body: "You will be notified when a task's time arrives." }); } catch (err) {}
        }
    });
});

updateNotifyBtn();
setInterval(checkDueNotifications, 15000);          // check every 15 seconds
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkDueNotifications(); });
setTimeout(checkDueNotifications, 3000);            // first check shortly after load


/* ===== Animation helpers ===== */

// 1) After every page change, add the class "animating" for a moment so task rows slide in.
//    (It is NOT left on permanently, otherwise every small update would replay the animation.)
let animTimer = null;
const originalShowPageForAnim = showPage;
showPage = function (page) {
    originalShowPageForAnim(page);
    document.body.classList.add("animating");
    clearTimeout(animTimer);
    animTimer = setTimeout(() => document.body.classList.remove("animating"), 900);
};

// 2) When a task is completed, make its tick pop and its row flash green.
const originalToggleTaskForAnim = toggleTask;
toggleTask = function (id) {
    originalToggleTaskForAnim(id);
    document.querySelectorAll('.check.done[onclick="toggleTask(' + id + ')"]').forEach(btn => {
        btn.classList.add("pop");
        const row = btn.closest(".task");
        if (row) row.classList.add("flash");
    });
};

// 3) Smooth fade when switching between light and dark theme.
const originalApplyThemeForAnim = applyTheme;
applyTheme = function (theme) {
    document.documentElement.classList.add("theme-anim");
    originalApplyThemeForAnim(theme);
    setTimeout(() => document.documentElement.classList.remove("theme-anim"), 450);
};
