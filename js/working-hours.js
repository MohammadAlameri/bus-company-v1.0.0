// Global variables
let db;

// Initialize working hours section
function loadWorkingHours() {
  // Initialize Firebase Firestore reference once
  if (!db) {
    try {
      db = firebase.firestore();
      console.log("Firestore database reference initialized");
    } catch (error) {
      console.error("Failed to initialize Firestore:", error);
      showMessage(
        "Error connecting to database. Please refresh the page.",
        "error"
      );
      return;
    }
  }

  if (!currentCompany) {
    console.error("Cannot load working hours: currentCompany is not defined");
    return;
  }

  console.log("Loading working hours...");

  // Get the working hours section
  const workingHoursSection = document.getElementById("working-hours-section");
  if (!workingHoursSection) {
    console.error("Working hours section not found");
    return;
  }

  // Fetch working hours
  fetchWorkingHours()
    .then(() => {
      console.log("Working hours loaded successfully");
    })
    .catch((error) => {
      console.error("Error loading working hours:", error);
      showMessage("Error loading working hours: " + error.message, "error");
    });
}

// Fetch working hours from Firestore
async function fetchWorkingHours() {
  try {
    if (!currentCompany) {
      showMessage("Error: Company information not available", "error");
      return;
    }

    console.log("Fetching working hours for company:", currentCompany.id);

    // Get the working hours section
    const workingHoursSection = document.getElementById(
      "working-hours-section"
    );

    // Create the working hours HTML
    let workingHoursHTML = `
            <div class="section-header">
                <h2>Working Hours</h2>
                <div class="section-actions">
                    <button id="refresh-working-hours-btn" class="refresh-btn secondary-btn">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button id="add-working-hours-btn" class="primary-btn">Add Hours</button>
                </div>
            </div>
            
            <div class="working-hours-container">
                <div class="working-hours-tabs">
                    <button class="tab-btn active" data-tab="workingHours">Working Hours</button>
                    <button class="tab-btn" data-tab="timeOff">Time Off</button>
                </div>
                
                <div class="tab-content active" id="workingHours-tab">
                    <div class="working-hours-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Default Working Hours</label>
                            </div>
                        </div>
                        
                        <div class="weekday-hours">
                            ${generateWeekdayHoursHTML()}
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <button id="save-working-hours-btn" class="primary-btn">Save Working Hours</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tab-content" id="timeOff-tab">
                    <div class="time-off-container">
                        <div class="time-off-list" id="time-off-list">
                            <div class="empty-state">
                                <i class="fas fa-calendar-times"></i>
                                <p>No time off records found</p>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <button id="add-time-off-btn" class="primary-btn">Add Time Off</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Set the HTML content
    workingHoursSection.innerHTML = workingHoursHTML;

    // Add event listeners
    addWorkingHoursEventListeners();

    // Load existing working hours if available
    loadExistingWorkingHours();

    // Load time off data
    loadTimeOffData();
  } catch (error) {
    console.error("Error fetching working hours:", error);
    showMessage("Error fetching working hours: " + error.message, "error");
    throw error;
  }
}

// Generate HTML for weekday hours inputs
function generateWeekdayHoursHTML() {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return days
    .map(
      (day) => `
        <div class="weekday-row">
            <div class="weekday-name">
              <span class="day-icon"><i class="far fa-calendar-day"></i></span>
              <span>${day}</span>
            </div>
            <div class="weekday-status">
                <label class="toggle-switch">
                    <input type="checkbox" class="day-enabled" data-day="${day}" checked>
                    <span class="toggle-slider"></span>
                </label>
                <span class="status-text">Open</span>
            </div>
            <div class="weekday-times">
                <div class="time-input-group">
                    <div class="time-input-wrapper time-with-format">
                        <i class="far fa-clock time-icon"></i>
                    <input type="time" class="time-input start-time" data-day="${day}" value="09:00">
                        <span class="time-format">AM</span>
                    </div>
                    <span class="time-separator">to</span>
                    <div class="time-input-wrapper time-with-format">
                        <i class="far fa-clock time-icon"></i>
                    <input type="time" class="time-input end-time" data-day="${day}" value="17:00">
                        <span class="time-format">PM</span>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Add event listeners for working hours section
function addWorkingHoursEventListeners() {
  // Tab switching
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all tabs
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));

      // Add active class to current tab
      button.classList.add("active");
      document
        .getElementById(`${button.dataset.tab}-tab`)
        .classList.add("active");
    });
  });

  // Add event listeners to toggle enabled/disabled status for days
  document.querySelectorAll(".day-enabled").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const row = this.closest(".weekday-row");
      const statusText = row.querySelector(".status-text");
      const timeInputs = row.querySelectorAll(".time-input");

      if (this.checked) {
        statusText.textContent = "Open";
        statusText.classList.remove("closed-status");
        timeInputs.forEach((input) => {
          input.disabled = false;
        });
      } else {
        statusText.textContent = "Closed";
        statusText.classList.add("closed-status");
        timeInputs.forEach((input) => {
          input.disabled = true;
        });
      }
    });
  });

  // Add event listeners for time inputs to update AM/PM indicators
  document.querySelectorAll(".time-input").forEach((input) => {
    // Set initial AM/PM value
    updateTimeFormat(input);

    // Update AM/PM when time changes
    input.addEventListener("change", function () {
      updateTimeFormat(this);
    });
  });

  // Save button event listener
  document
    .getElementById("save-working-hours-btn")
    .addEventListener("click", saveWorkingHours);

  // Add time off button
  const addTimeOffBtn = document.getElementById("add-time-off-btn");
  if (addTimeOffBtn) {
    addTimeOffBtn.addEventListener("click", () => {
      // Just switch to the working hours tab
      tabButtons[0].click();
    });
  }

  // Refresh working hours button
  const refreshBtn = document.getElementById("refresh-working-hours-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      showMessage("Refreshing working hours...", "info");
      loadWorkingHours();
    });
  }

  // Add working hours button
  const addHoursBtn = document.getElementById("add-working-hours-btn");
  if (addHoursBtn) {
    addHoursBtn.addEventListener("click", () => {
      // Just switch to the working hours tab
      tabButtons[0].click();
    });
  }
}

// Function to update the time format (AM/PM) based on the input value
function updateTimeFormat(timeInput) {
  const timeFormatElement =
    timeInput.parentElement.querySelector(".time-format");
  if (!timeFormatElement) return;

  // Get the time value
  const timeValue = timeInput.value;
  if (!timeValue) return;

  // Parse hours
  const hours = parseInt(timeValue.split(":")[0]);

  // Set AM/PM based on hours
  if (hours >= 12) {
    timeFormatElement.textContent = "PM";
  } else {
    timeFormatElement.textContent = "AM";
  }
}

// Save working hours to Firestore
async function saveWorkingHours() {
  try {
    showMessage("Saving working hours...", "info");

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    // First, get existing records to delete them
    const snapshot = await db
      .collection("workingHours")
      .where("companyId", "==", currentCompany.id)
      .get();

    // Delete existing records in a batch
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Deleted ${snapshot.size} existing working hours records`);

    // Create new batch for adding new records
    const newBatch = db.batch();
    let recordsAdded = 0;

    // Create a new document for each day of the week
    days.forEach((day) => {
      const isOpen = document.querySelector(
        `.day-enabled[data-day="${day}"]`
      ).checked;

      // Only create records for open days
      if (isOpen) {
        const startTime = document.querySelector(
          `.start-time[data-day="${day}"]`
        ).value;
        const endTime = document.querySelector(
          `.end-time[data-day="${day}"]`
        ).value;

        // Validate times
        if (!startTime || !endTime) {
          console.warn(`Missing time for ${day}, skipping`);
          return;
        }

        // Create a new document for this day
        const newDocRef = db.collection("workingHours").doc();

        // Set the data according to the schema
        newBatch.set(newDocRef, {
          companyId: currentCompany.id,
          startTime: startTime,
          endTime: endTime,
          dayOfWeek: day,
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        });

        recordsAdded++;
      }
    });

    // Commit the batch
    if (recordsAdded > 0) {
      await newBatch.commit();
      console.log(`Added ${recordsAdded} working hours records`);
    } else {
      console.warn("No working hours records added");
    }

    await logActivity("update", "workingHours", currentCompany.id);
    showMessage("Working hours saved successfully", "success");
  } catch (error) {
    console.error("Error saving working hours:", error);
    showMessage("Error saving working hours: " + error.message, "error");
  }
}

// Load existing working hours from Firestore
async function loadExistingWorkingHours() {
  try {
    console.log("Loading working hours for company:", currentCompany.id);

    // First reset all days to closed
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    days.forEach((day) => {
      const dayToggle = document.querySelector(
        `.day-enabled[data-day="${day}"]`
      );
      const startTime = document.querySelector(
        `.start-time[data-day="${day}"]`
      );
      const endTime = document.querySelector(`.end-time[data-day="${day}"]`);
      const statusText = dayToggle
        .closest(".weekday-status")
        .querySelector(".status-text");

      dayToggle.checked = false;
      statusText.textContent = "Closed";
      statusText.classList.add("closed-status");
      startTime.disabled = true;
      endTime.disabled = true;

      // Reset to default times
      startTime.value = "09:00";
      endTime.value = "17:00";

      // Update AM/PM indicators
      updateTimeFormat(startTime);
      updateTimeFormat(endTime);
    });

    // Now get all working hours records
    const snapshot = await db
      .collection("workingHours")
      .where("companyId", "==", currentCompany.id)
      .get();

    console.log(`Found ${snapshot.size} working hours records`);

    if (!snapshot.empty) {
      // Process each working hours record
      snapshot.forEach((doc) => {
        const record = doc.data();
        const day = record.dayOfWeek;

        // Find the form elements for this day
        const dayToggle = document.querySelector(
          `.day-enabled[data-day="${day}"]`
        );
        const startTime = document.querySelector(
          `.start-time[data-day="${day}"]`
        );
        const endTime = document.querySelector(`.end-time[data-day="${day}"]`);

        if (dayToggle && startTime && endTime) {
          const statusText = dayToggle
            .closest(".weekday-status")
            .querySelector(".status-text");

          // Set the form values
          dayToggle.checked = true;
          statusText.textContent = "Open";
          statusText.classList.remove("closed-status");
          startTime.disabled = false;
          endTime.disabled = false;

          if (record.startTime) {
            startTime.value = record.startTime;
            updateTimeFormat(startTime);
          }

          if (record.endTime) {
            endTime.value = record.endTime;
            updateTimeFormat(endTime);
          }

          console.log(
            `Loaded working hours for ${day}: ${record.startTime} - ${record.endTime}`
          );
        }
      });
    }
  } catch (error) {
    console.error("Error loading working hours:", error);
  }
}

// Load time off data
async function loadTimeOffData() {
  console.log("Starting loadTimeOffData function...");
  try {
    // Use global db variable and initialize if needed
    if (!db) {
      try {
        db = firebase.firestore();
        console.log(
          "Initializing Firestore database reference in loadTimeOffData"
        );
      } catch (dbError) {
        console.error("Failed to initialize Firestore:", dbError);
        showMessage(
          "Error connecting to database. Please refresh the page.",
          "error"
        );
        return;
      }
    }

    // Find the DOM element
    const timeOffList = document.getElementById("time-off-list");
    if (!timeOffList) {
      console.error("TIME OFF LIST ELEMENT NOT FOUND IN DOM");
      return;
    }

    console.log("Loading time off data for company:", currentCompany?.id);

    // Show loading state
    timeOffList.innerHTML = `
      <div class="time-off-header">
        <h3>Time Off Records</h3>
        <button type="button" id="add-time-off-btn-main" class="add-btn primary-btn">
          <i class="fas fa-plus"></i> Add Time Off
        </button>
      </div>
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading time off records...</span>
      </div>
    `;

    // Set up the Add Time Off button
    const addTimeOffBtnMain = document.getElementById("add-time-off-btn-main");
    if (addTimeOffBtnMain) {
      addTimeOffBtnMain.addEventListener("click", function () {
        console.log("Main Add Time Off button clicked");
        showAddTimeOffModal();
      });
    }

    // Check if company data is available
    if (!currentCompany || !currentCompany.id) {
      console.error("Cannot load time off data: company data is missing");
      timeOffList.innerHTML = `
        <div class="time-off-header">
          <h3>Time Off Records</h3>
          <button id="add-time-off-btn-main" class="add-btn primary-btn">
            <i class="fas fa-plus"></i> Add Time Off
          </button>
        </div>
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Company data is not available. Please refresh the page.</span>
        </div>
      `;
      return;
    }

    // Fetch time off records from Firestore
    const timeOffRecords = await db
      .collection("timeOff")
      .where("companyId", "==", currentCompany.id)
      .orderBy("createdAt", "desc")
      .get();

    console.log(`Found ${timeOffRecords.size} time off records`);

    // Update the time off display with a table structure
    timeOffList.innerHTML = `
      <div class="time-off-header">
        <h3>Time Off Records</h3>
        <button type="button" id="add-time-off-btn-main" class="add-btn primary-btn">
          <i class="fas fa-plus"></i> Add Time Off
        </button>
      </div>
      <div class="table-container">
        <table class="data-table" id="time-off-table">
          <thead>
            <tr>
              <th><i class="fas fa-tag mr-2"></i>Title</th>
              <th><i class="fas fa-calendar-alt mr-2"></i>Date</th>
              <th><i class="fas fa-clock mr-2"></i>Time</th>
              <th><i class="fas fa-repeat mr-2"></i>Frequency</th>
              <th><i class="fas fa-info-circle mr-2"></i>Status</th>
              <th><i class="fas fa-cog mr-2"></i>Actions</th>
            </tr>
          </thead>
          <tbody id="time-off-table-body">
            ${
              timeOffRecords.empty
                ? '<tr><td colspan="6" class="text-center">No time off records found</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    `;

    // Setup the Add Time Off button again
    const addTimeOffBtn = document.getElementById("add-time-off-btn-main");
    if (addTimeOffBtn) {
      addTimeOffBtn.addEventListener("click", function () {
        console.log("Main Add Time Off button clicked");
        showAddTimeOffModal();
      });
    }

    // Add time off records to the table
    const timeOffTableBody = document.getElementById("time-off-table-body");
    if (!timeOffTableBody) {
      console.error("Time off table body not found in DOM");
      return;
    }

    if (!timeOffRecords.empty) {
      timeOffRecords.forEach((doc) => {
        const timeOff = doc.data();
        addTimeOffToTable(timeOff);
      });

      // Add action listeners to the time off table rows
      addTimeOffActionListeners();
    }
  } catch (error) {
    console.error("Error loading time off data:", error);

    // Show error state in the DOM
    const timeOffList = document.getElementById("time-off-list");
    if (timeOffList) {
      timeOffList.innerHTML = `
        <div class="time-off-header">
          <h3>Time Off Records</h3>
          <button id="add-time-off-btn-main" class="add-btn primary-btn">
            <i class="fas fa-plus"></i> Add Time Off
          </button>
        </div>
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Error loading time off data: ${error.message}</span>
        </div>
      `;

      // Setup the Add Time Off button even in error state
      const addTimeOffBtn = document.getElementById("add-time-off-btn-main");
      if (addTimeOffBtn) {
        addTimeOffBtn.addEventListener("click", function () {
          console.log("Main Add Time Off button clicked (error state)");
          showAddTimeOffModal();
        });
      }
    }
  }
}

// Add CSS for the time off table styling
function addTimeOffTableStyles() {
  // Check if styles already exist
  if (document.getElementById("time-off-table-styles")) return;

  const styleElement = document.createElement("style");
  styleElement.id = "time-off-table-styles";
  styleElement.textContent = `
    .time-off-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .data-table thead th {
      background-color: #f8f9fa;
      color: #333;
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .data-table tbody td {
      padding: 12px 15px;
      border-bottom: 1px solid #f1f1f1;
      color: #333;
    }
    
    .data-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .data-table tbody tr:hover {
      background-color: #f8f9fa;
    }
    
    .table-actions {
      display: flex;
      gap: 8px;
    }
    
    .table-actions button {
      background: none;
      border: none;
      cursor: pointer;
      color: #4a6cf7;
      font-size: 16px;
      transition: color 0.2s;
    }
    
    .table-actions button:hover {
      color: #3a5bd7;
    }
    
    .delete-time-off-btn:hover {
      color: #dc3545 !important;
    }
    
    .loading-row, .error-row, .empty-row, .info-row {
      text-align: center;
    }
    
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-upcoming {
      background-color: #e6f7ff;
      color: #0086f9;
    }
    
    .status-past {
      background-color: #f9e6e6;
      color: #c9302c;
    }
    
    .past-record {
      opacity: 0.7;
    }
    
    .info-banner {
      background-color: #fff3cd;
      padding: 10px;
      margin: 5px 0;
      border-radius: 4px;
      border-left: 4px solid #ffc107;
      text-align: left;
    }
  `;

  document.head.appendChild(styleElement);
}

// Add a time off record to the table
function addTimeOffToTable(timeOff) {
  const timeOffTableBody = document.getElementById("time-off-table-body");
  if (!timeOffTableBody) return;

  // Format date based on frequency
  let dateDisplay = "";

  if (timeOff.frequency === "once") {
    // For one-time events, show the specific date
    if (timeOff.specificDay) {
      const date = timeOff.specificDay.toDate
        ? timeOff.specificDay.toDate()
        : new Date(timeOff.specificDay);

      dateDisplay = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } else {
      dateDisplay = "N/A";
    }
  } else if (timeOff.frequency === "weekly") {
    // For weekly events, show the day of the week
    dateDisplay = timeOff.dayOfWeek || "N/A";
  } else if (timeOff.frequency === "daily") {
    // For daily events, show "Every day"
    dateDisplay = "Every day";
  } else {
    dateDisplay = "N/A";
  }

  // Format time
  const timeDisplay =
    timeOff.startTime && timeOff.endTime
      ? `${timeOff.startTime} - ${timeOff.endTime}`
      : timeOff.startTime || timeOff.endTime || "N/A";

  // Format frequency
  let frequencyDisplay = "N/A";
  if (timeOff.frequency === "once") {
    frequencyDisplay = "One-time";
  } else if (timeOff.frequency === "daily") {
    frequencyDisplay = "Daily";
  } else if (timeOff.frequency === "weekly") {
    frequencyDisplay = "Weekly";
  } else {
    frequencyDisplay = timeOff.frequency || "Not specified";
  }

  // Determine status (past or upcoming)
  let isUpcoming = true;
  if (timeOff.specificDay) {
    const date = timeOff.specificDay.toDate
      ? timeOff.specificDay.toDate()
      : new Date(timeOff.specificDay);
    isUpcoming = date >= new Date();
  }
  const statusDisplay = isUpcoming ? "Upcoming" : "Past";
  const statusClass = isUpcoming ? "status-upcoming" : "status-past";

  // Create table row
  const row = document.createElement("tr");
  row.setAttribute("data-id", timeOff.id);

  if (!isUpcoming) {
    row.classList.add("past-record");
  }

  row.innerHTML = `
    <td>${timeOff.title || "Untitled"}</td>
    <td>${dateDisplay}</td>
    <td>${timeDisplay}</td>
    <td>${frequencyDisplay}</td>
    <td><span class="status-badge ${statusClass}">${statusDisplay}</span></td>
    <td class="actions-cell">
      <button class="icon-btn edit-time-off-btn" data-id="${
        timeOff.id
      }" title="Edit Time Off">
        <i class="fas fa-edit"></i>
      </button>
      <button class="icon-btn delete-time-off-btn" data-id="${
        timeOff.id
      }" title="Delete Time Off">
        <i class="fas fa-trash-alt"></i>
      </button>
    </td>
  `;

  timeOffTableBody.appendChild(row);
}

// Add event listeners to time off action buttons
function addTimeOffActionListeners() {
  // Edit buttons
  document.querySelectorAll(".edit-time-off-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const timeOffId = btn.getAttribute("data-id");
      showEditTimeOffModal(timeOffId);
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-time-off-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const timeOffId = btn.getAttribute("data-id");
      confirmDeleteTimeOff(timeOffId);
    });
  });
}

// Show add time off modal
function showAddTimeOffModal() {
  const today = new Date().toISOString().split("T")[0];

  // Set default times (current hour rounded to nearest 5 minutes)
  const now = new Date();
  const defaultHour = now.getHours();
  const defaultMinute = Math.ceil(now.getMinutes() / 5) * 5;

  // Convert to 12-hour format
  const defaultHour12 = defaultHour % 12 || 12;
  const defaultPeriod = defaultHour < 12 ? "AM" : "PM";

  // Format default time for display
  const defaultTimeString = `${defaultHour12
    .toString()
    .padStart(2, "0")}:${defaultMinute
    .toString()
    .padStart(2, "0")} ${defaultPeriod}`;

  console.log(
    "Opening Add Time Off modal with default time:",
    defaultTimeString
  );

  const modalContent = `
    <div class="add-time-off-form">
      <div class="form-group">
        <label for="time-off-reason">Title <span class="required">*</span></label>
        <input type="text" id="time-off-reason" placeholder="Enter time off title">
      </div>
      
      <div class="form-group">
        <label for="time-off-frequency">Frequency <span class="required">*</span></label>
        <select id="time-off-frequency">
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      
      <div class="form-group day-of-week-group" style="display: none;">
        <label for="time-off-day">Day of Week <span class="required">*</span></label>
        <select id="time-off-day">
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
          <option value="Saturday">Saturday</option>
          <option value="Sunday">Sunday</option>
        </select>
      </div>
      
      <div class="form-group specific-day-group">
        <label for="time-off-start">Specific Day <span class="required">*</span></label>
        <input type="date" id="time-off-start" min="${today}" value="${today}">
      </div>
      
      <div class="form-group">
        <label for="time-off-start-time">Start Time <span class="required">*</span></label>
        <div class="time-input-container">
          <input type="text" id="time-off-start-time" class="time-input" placeholder="HH:MM AM/PM" value="${defaultTimeString}" required>
          <i class="far fa-clock time-icon"></i>
          <div class="time-picker">
            <select id="start-hour" class="hour-select">
              ${Array.from({ length: 12 }, (_, i) => i + 1)
                .map(
                  (h) =>
                    `<option value="${h}" ${
                      h === defaultHour12 ? "selected" : ""
                    }>${h.toString().padStart(2, "0")}</option>`
                )
                .join("")}
            </select>
            <span>:</span>
            <select id="start-minute" class="minute-select">
              ${Array.from({ length: 60 / 5 }, (_, i) => i * 5)
                .map(
                  (m) =>
                    `<option value="${m}" ${
                      m === defaultMinute % 60 ? "selected" : ""
                    }>${m.toString().padStart(2, "0")}</option>`
                )
                .join("")}
            </select>
            <select id="start-period">
              <option value="AM" ${
                defaultPeriod === "AM" ? "selected" : ""
              }>AM</option>
              <option value="PM" ${
                defaultPeriod === "PM" ? "selected" : ""
              }>PM</option>
            </select>
            <button type="button" class="set-time-btn" data-target="time-off-start-time">Set</button>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label for="time-off-end-time">End Time <span class="required">*</span></label>
        <div class="time-input-container">
          <input type="text" id="time-off-end-time" class="time-input" placeholder="HH:MM AM/PM" value="${defaultTimeString}" required>
          <i class="far fa-clock time-icon"></i>
          <div class="time-picker">
            <select id="end-hour" class="hour-select">
              ${Array.from({ length: 12 }, (_, i) => i + 1)
                .map(
                  (h) =>
                    `<option value="${h}" ${
                      h === defaultHour12 ? "selected" : ""
                    }>${h.toString().padStart(2, "0")}</option>`
                )
                .join("")}
            </select>
            <span>:</span>
            <select id="end-minute" class="minute-select">
              ${Array.from({ length: 60 / 5 }, (_, i) => i * 5)
                .map(
                  (m) =>
                    `<option value="${m}" ${
                      m === defaultMinute % 60 ? "selected" : ""
                    }>${m.toString().padStart(2, "0")}</option>`
                )
                .join("")}
            </select>
            <select id="end-period">
              <option value="AM" ${
                defaultPeriod === "AM" ? "selected" : ""
              }>AM</option>
              <option value="PM" ${
                defaultPeriod === "PM" ? "selected" : ""
              }>PM</option>
            </select>
            <button type="button" class="set-time-btn" data-target="time-off-end-time">Set</button>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="cancel-modal-btn">Cancel</button>
        <button type="button" class="primary-btn" id="add-time-off-btn"><i class="fas fa-plus"></i> Add Time Off</button>
      </div>
    </div>
  `;

  showModal("Add Time Off", modalContent);

  // Add event listener for frequency dropdown
  document
    .getElementById("time-off-frequency")
    .addEventListener("change", function () {
      const dayOfWeekGroup = document.querySelector(".day-of-week-group");
      const specificDayGroup = document.querySelector(".specific-day-group");

      // Hide both by default
      dayOfWeekGroup.style.display = "none";
      specificDayGroup.style.display = "none";

      // Show based on frequency
      if (this.value === "weekly") {
        dayOfWeekGroup.style.display = "block";
      } else if (this.value === "once") {
        specificDayGroup.style.display = "block";
      }
      // For daily, both remain hidden
    });

  // Trigger the change event to set initial visibility
  const frequencySelect = document.getElementById("time-off-frequency");
  frequencySelect.dispatchEvent(new Event("change"));

  // Make sure the Add Time Off button exists before adding event listener
  const addTimeOffBtn = document.getElementById("add-time-off-btn");
  if (!addTimeOffBtn) {
    console.error("Add Time Off button not found in the modal");
    return;
  }

  console.log("Setting up event listener for Add Time Off button");

  // Add event listener for add button with direct function reference
  addTimeOffBtn.addEventListener("click", function (e) {
    console.log("Add Time Off button clicked");
    e.preventDefault();
    addTimeOff();
  });

  // Add event listener for cancel button
  document
    .querySelector(".cancel-modal-btn")
    .addEventListener("click", function () {
      hideModal();
    });

  // Setup time picker functionality
  setupTimePickersForTimeOff();
}

// Add time off record
async function addTimeOff() {
  console.log("addTimeOff function called");

  // Show loading message and disable button first to prevent multiple submissions
  const saveButton = document.getElementById("add-time-off-btn");
  if (!saveButton) {
    console.error("Save button not found - aborting addTimeOff");
    return;
  }

  const originalButtonText = saveButton.innerHTML;
  saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveButton.disabled = true;

  try {
    // Check if database is initialized
    if (!db) {
      try {
        db = firebase.firestore();
        console.log("Initializing Firestore database reference in addTimeOff");
      } catch (dbError) {
        console.error("Failed to initialize Firestore:", dbError);
        showMessage(
          "Error connecting to database. Please refresh the page.",
          "error"
        );
        resetButton();
        return;
      }
    }

    console.log("Getting form values...");

    // Get form values
    const title =
      document.getElementById("time-off-reason")?.value?.trim() || "";
    const frequency =
      document.getElementById("time-off-frequency")?.value || "";
    const startTimeInput =
      document.getElementById("time-off-start-time")?.value?.trim() || "";
    const endTimeInput =
      document.getElementById("time-off-end-time")?.value?.trim() || "";

    console.log("Form values:", {
      title,
      frequency,
      startTimeInput,
      endTimeInput,
    });

    // Get conditional fields based on frequency
    let specificDay = "";
    let dayOfWeek = "";

    if (frequency === "once") {
      specificDay = document.getElementById("time-off-start")?.value || "";
      if (!specificDay) {
        showMessage(
          "Please select a specific day for one-time time off",
          "error"
        );
        resetButton();
        return;
      }
    } else if (frequency === "weekly") {
      dayOfWeek = document.getElementById("time-off-day")?.value || "";
      if (!dayOfWeek) {
        showMessage("Please select a day of week for weekly time off", "error");
        resetButton();
        return;
      }
      // Set a default date for the record (today's date)
      specificDay = new Date().toISOString().split("T")[0];
    } else if (frequency === "daily") {
      // Set a default date for the record (today's date)
      specificDay = new Date().toISOString().split("T")[0];
    }

    // Validate required fields
    if (!title || !startTimeInput || !endTimeInput || !frequency) {
      showMessage("Please fill all required fields", "error");
      resetButton();
      return;
    }

    // Validate time formats
    if (
      !validateTimeOffInput(document.getElementById("time-off-start-time")) ||
      !validateTimeOffInput(document.getElementById("time-off-end-time"))
    ) {
      showMessage(
        "Please enter valid times in the format HH:MM AM/PM",
        "error"
      );
      resetButton();
      return;
    }

    // Verify company data is available
    if (!currentCompany || !currentCompany.id) {
      console.error(
        "Cannot add time off: company data is missing",
        currentCompany
      );
      showMessage(
        "Error: Company data is not available. Please refresh the page.",
        "error"
      );
      resetButton();
      return;
    }

    console.log("Parsing time inputs...");

    // Parse time inputs to get 24-hour format for storage
    const parseTimeToObj = (timeString) => {
      // Regular expression for HH:MM AM/PM format
      const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/i;
      const matches = timeString.match(timeRegex);

      if (!matches || matches.length !== 4) {
        console.warn("Time string didn't match regex pattern:", timeString);
        return null;
      }

      let hours = parseInt(matches[1], 10);
      const minutes = parseInt(matches[2], 10);
      const period = matches[3].toUpperCase();

      // Convert to 24-hour format
      if (period === "PM" && hours < 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      return {
        hour: hours,
        minute: minutes,
        displayFormat: timeString, // Store the original display format
      };
    };

    // Parse the time inputs
    const startTimeObj = parseTimeToObj(startTimeInput);
    const endTimeObj = parseTimeToObj(endTimeInput);

    if (!startTimeObj || !endTimeObj) {
      showMessage(
        "Invalid time format. Please use HH:MM AM/PM format.",
        "error"
      );
      resetButton();
      return;
    }

    console.log("Preparing time off data object...");

    // Create the time off data object matching the schema
    const timeOffData = {
      companyId: currentCompany.id,
      title: title,
      startTime: startTimeInput, // Store the display format (12-hour)
      startTimeObj: startTimeObj, // Store the time object for calculations
      endTime: endTimeInput, // Store the display format (12-hour)
      endTimeObj: endTimeObj, // Store the time object for calculations
      frequency: frequency, // "once", "weekly", or "daily"
      dayOfWeek: dayOfWeek, // Only used if frequency is weekly
      specificDay: firebase.firestore.Timestamp.fromDate(new Date(specificDay)),
      createdAt: firebase.firestore.Timestamp.now(),
      status: "active",
    };

    console.log("Time off data to be saved:", JSON.stringify(timeOffData));

    // Add to Firestore
    console.log("Adding to Firestore...");

    // Ensure we have a valid Firestore instance
    if (!db) {
      console.error("Firestore database reference is invalid");
      showMessage(
        "Error accessing database. Please refresh the page.",
        "error"
      );
      resetButton();
      return;
    }

    // Add the document with error handling
    try {
      const docRef = await db.collection("timeOff").add(timeOffData);
      console.log("Time off record added with ID:", docRef.id);

      // Add id field to the document
      await db.collection("timeOff").doc(docRef.id).update({
        id: docRef.id,
      });
      console.log("Added id field to time off record");

      // Hide modal and reload time off data
      hideModal();

      // Give the database time to update before reloading
      setTimeout(() => {
        loadTimeOffData();
      }, 500);

      // Log activity
      try {
        await logActivity("create", "timeOff", currentCompany.id);
      } catch (logError) {
        console.error("Error logging activity:", logError);
        // Continue since this is non-critical
      }

      // Show success message
      showMessage("Time off record added successfully", "success");
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      showMessage(`Database error: ${firestoreError.message}`, "error");
      resetButton();
    }
  } catch (error) {
    console.error("Error adding time off record:", error);
    showMessage("Error adding time off record: " + error.message, "error");
    resetButton();
  }

  // Helper function to reset the button state
  function resetButton() {
    if (saveButton) {
      saveButton.innerHTML = originalButtonText;
      saveButton.disabled = false;
    }
  }
}

// Show edit time off modal
async function showEditTimeOffModal(timeOffId) {
  try {
    // Show loading
    showMessage("Loading time off data...", "info");

    console.log("Loading time off record for editing:", timeOffId);

    // Get time off document
    const timeOffDoc = await db.collection("timeOff").doc(timeOffId).get();

    if (!timeOffDoc.exists) {
      showMessage("Time off record not found", "error");
      return;
    }

    const timeOff = timeOffDoc.data();
    console.log("Time off data for editing:", JSON.stringify(timeOff));

    // Format specific day for date input
    let specificDayValue = "";
    try {
      if (
        timeOff.specificDay &&
        typeof timeOff.specificDay.toDate === "function"
      ) {
        const specificDayObj = timeOff.specificDay.toDate();
        specificDayValue = specificDayObj.toISOString().split("T")[0];
      } else if (timeOff.specificDay) {
        const specificDayObj = new Date(timeOff.specificDay);
        specificDayValue = specificDayObj.toISOString().split("T")[0];
      }
    } catch (e) {
      console.error("Error formatting specific day:", e);
    }

    const today = new Date().toISOString().split("T")[0];

    // Format time values for display
    const formatTimeForDisplay = (timeValue) => {
      if (
        typeof timeValue === "string" &&
        (timeValue.includes("AM") || timeValue.includes("PM"))
      ) {
        return timeValue; // Already in 12-hour format
      }

      // Default time if none is provided
      const defaultTime = "09:00 AM";

      if (!timeValue) return defaultTime;

      // If it's an object with hour and minute
      if (
        timeValue &&
        typeof timeValue === "object" &&
        "hour" in timeValue &&
        "minute" in timeValue
      ) {
        const hour = parseInt(timeValue.hour, 10);
        const minute = parseInt(timeValue.minute, 10);

        if (isNaN(hour) || isNaN(minute)) return defaultTime;

        const hour12 = hour % 12 || 12;
        const period = hour < 12 ? "AM" : "PM";

        return `${hour12.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")} ${period}`;
      }

      return defaultTime;
    };

    // Get formatted time values
    const startTimeDisplay = formatTimeForDisplay(
      timeOff.startTime || timeOff.startTimeObj
    );
    const endTimeDisplay = formatTimeForDisplay(
      timeOff.endTime || timeOff.endTimeObj
    );

    // Parse time for select values
    const parseTimeForSelects = (timeString) => {
      if (!timeString || !timeString.includes(" ")) {
        return { hour12: 9, minute: 0, period: "AM" };
      }

      try {
        const [timePart, period] = timeString.trim().split(" ");
        const [hourStr, minuteStr] = timePart.split(":");

        const hour12 = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(hour12) || isNaN(minute)) {
          return { hour12: 9, minute: 0, period: "AM" };
        }

        return { hour12, minute, period };
      } catch (error) {
        console.warn("Error parsing time string:", error);
        return { hour12: 9, minute: 0, period: "AM" };
      }
    };

    const startTimeParts = parseTimeForSelects(startTimeDisplay);
    const endTimeParts = parseTimeForSelects(endTimeDisplay);

    const modalContent = `
      <div class="edit-time-off-form" data-id="${timeOffId}">
        <div class="form-group">
          <label for="edit-time-off-reason">Title <span class="required">*</span></label>
          <input type="text" id="edit-time-off-reason" value="${
            timeOff.title || ""
          }">
        </div>
        
        <div class="form-group">
          <label for="edit-time-off-frequency">Frequency <span class="required">*</span></label>
          <select id="edit-time-off-frequency">
            <option value="once" ${
              timeOff.frequency === "once" ? "selected" : ""
            }>Once</option>
            <option value="daily" ${
              timeOff.frequency === "daily" ? "selected" : ""
            }>Daily</option>
            <option value="weekly" ${
              timeOff.frequency === "weekly" ? "selected" : ""
            }>Weekly</option>
          </select>
        </div>
        
        <div class="form-group day-of-week-group" style="display: ${
          timeOff.frequency === "weekly" ? "block" : "none"
        };">
          <label for="edit-time-off-day">Day of Week <span class="required">*</span></label>
          <select id="edit-time-off-day">
            <option value="Monday" ${
              timeOff.dayOfWeek === "Monday" ? "selected" : ""
            }>Monday</option>
            <option value="Tuesday" ${
              timeOff.dayOfWeek === "Tuesday" ? "selected" : ""
            }>Tuesday</option>
            <option value="Wednesday" ${
              timeOff.dayOfWeek === "Wednesday" ? "selected" : ""
            }>Wednesday</option>
            <option value="Thursday" ${
              timeOff.dayOfWeek === "Thursday" ? "selected" : ""
            }>Thursday</option>
            <option value="Friday" ${
              timeOff.dayOfWeek === "Friday" ? "selected" : ""
            }>Friday</option>
            <option value="Saturday" ${
              timeOff.dayOfWeek === "Saturday" ? "selected" : ""
            }>Saturday</option>
            <option value="Sunday" ${
              timeOff.dayOfWeek === "Sunday" ? "selected" : ""
            }>Sunday</option>
          </select>
        </div>
        
        <div class="form-group specific-day-group" style="display: ${
          timeOff.frequency === "once" ? "block" : "none"
        };">
          <label for="edit-time-off-start">Specific Day <span class="required">*</span></label>
          <input type="date" id="edit-time-off-start" min="${today}" value="${specificDayValue}">
        </div>
        
        <div class="form-group">
          <label for="edit-time-off-start-time">Start Time <span class="required">*</span></label>
          <div class="time-input-container">
            <input type="text" id="edit-time-off-start-time" class="time-input" placeholder="HH:MM AM/PM" value="${startTimeDisplay}" required>
            <i class="far fa-clock time-icon"></i>
            <div class="time-picker">
              <select id="edit-start-hour" class="hour-select">
                ${Array.from({ length: 12 }, (_, i) => i + 1)
                  .map(
                    (h) =>
                      `<option value="${h}" ${
                        h === startTimeParts.hour12 ? "selected" : ""
                      }>${h.toString().padStart(2, "0")}</option>`
                  )
                  .join("")}
              </select>
              <span>:</span>
              <select id="edit-start-minute" class="minute-select">
                ${Array.from({ length: 60 / 5 }, (_, i) => i * 5)
                  .map(
                    (m) =>
                      `<option value="${m}" ${
                        m === startTimeParts.minute ? "selected" : ""
                      }>${m.toString().padStart(2, "0")}</option>`
                  )
                  .join("")}
              </select>
              <select id="edit-start-period">
                <option value="AM" ${
                  startTimeParts.period === "AM" ? "selected" : ""
                }>AM</option>
                <option value="PM" ${
                  startTimeParts.period === "PM" ? "selected" : ""
                }>PM</option>
              </select>
              <button type="button" class="set-time-btn" data-target="edit-time-off-start-time">Set</button>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="edit-time-off-end-time">End Time <span class="required">*</span></label>
          <div class="time-input-container">
            <input type="text" id="edit-time-off-end-time" class="time-input" placeholder="HH:MM AM/PM" value="${endTimeDisplay}" required>
            <i class="far fa-clock time-icon"></i>
            <div class="time-picker">
              <select id="edit-end-hour" class="hour-select">
                ${Array.from({ length: 12 }, (_, i) => i + 1)
                  .map(
                    (h) =>
                      `<option value="${h}" ${
                        h === endTimeParts.hour12 ? "selected" : ""
                      }>${h.toString().padStart(2, "0")}</option>`
                  )
                  .join("")}
              </select>
              <span>:</span>
              <select id="edit-end-minute" class="minute-select">
                ${Array.from({ length: 60 / 5 }, (_, i) => i * 5)
                  .map(
                    (m) =>
                      `<option value="${m}" ${
                        m === endTimeParts.minute ? "selected" : ""
                      }>${m.toString().padStart(2, "0")}</option>`
                  )
                  .join("")}
              </select>
              <select id="edit-end-period">
                <option value="AM" ${
                  endTimeParts.period === "AM" ? "selected" : ""
                }>AM</option>
                <option value="PM" ${
                  endTimeParts.period === "PM" ? "selected" : ""
                }>PM</option>
              </select>
              <button type="button" class="set-time-btn" data-target="edit-time-off-end-time">Set</button>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button class="cancel-modal-btn">Cancel</button>
          <button class="primary-btn" id="update-time-off-btn">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      </div>
    `;

    showModal("Edit Time Off", modalContent);

    // Add event listener for frequency dropdown
    document
      .getElementById("edit-time-off-frequency")
      .addEventListener("change", function () {
        const dayOfWeekGroup = document.querySelector(".day-of-week-group");
        const specificDayGroup = document.querySelector(".specific-day-group");

        // Hide both by default
        dayOfWeekGroup.style.display = "none";
        specificDayGroup.style.display = "none";

        // Show based on frequency
        if (this.value === "weekly") {
          dayOfWeekGroup.style.display = "block";
        } else if (this.value === "once") {
          specificDayGroup.style.display = "block";
        }
        // For daily, both remain hidden
      });

    // Setup time picker functionality
    setupTimePickersForTimeOff();

    // Add event listener for update button
    document
      .getElementById("update-time-off-btn")
      .addEventListener("click", updateTimeOff);
  } catch (error) {
    console.error("Error showing edit time off modal:", error);
    showMessage("Error loading time off data: " + error.message, "error");
  }
}

// Update time off
async function updateTimeOff() {
  try {
    const timeOffId = document.querySelector(".edit-time-off-form").dataset.id;

    // Get form values
    const title = document.getElementById("edit-time-off-reason").value.trim();
    const frequency = document.getElementById("edit-time-off-frequency").value;
    const startTimeInput = document
      .getElementById("edit-time-off-start-time")
      .value.trim();
    const endTimeInput = document
      .getElementById("edit-time-off-end-time")
      .value.trim();

    // Get conditional fields based on frequency
    let specificDay = "";
    let dayOfWeek = "";

    if (frequency === "once") {
      specificDay = document.getElementById("edit-time-off-start").value;
      if (!specificDay) {
        showMessage(
          "Please select a specific day for one-time time off",
          "error"
        );
        return;
      }
    } else if (frequency === "weekly") {
      dayOfWeek = document.getElementById("edit-time-off-day").value;
      if (!dayOfWeek) {
        showMessage("Please select a day of week for weekly time off", "error");
        return;
      }
      // Set a default date for the record (today's date)
      specificDay = new Date().toISOString().split("T")[0];
    } else if (frequency === "daily") {
      // Set a default date for the record (today's date)
      specificDay = new Date().toISOString().split("T")[0];
    }

    // Validate required fields
    if (!title || !startTimeInput || !endTimeInput || !frequency) {
      showMessage("Please fill all required fields", "error");
      return;
    }

    // Validate time formats
    if (
      !validateTimeOffInput(
        document.getElementById("edit-time-off-start-time")
      ) ||
      !validateTimeOffInput(document.getElementById("edit-time-off-end-time"))
    ) {
      showMessage(
        "Please enter valid times in the format HH:MM AM/PM",
        "error"
      );
      return;
    }

    // Show loading
    const updateBtn = document.getElementById("update-time-off-btn");
    const originalBtnText = updateBtn.innerHTML;
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    updateBtn.disabled = true;

    // Parse time inputs to get 24-hour format for storage
    const parseTimeToObj = (timeString) => {
      // Regular expression for HH:MM AM/PM format
      const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/i;
      const matches = timeString.match(timeRegex);

      if (!matches || matches.length !== 4) {
        return null;
      }

      let hours = parseInt(matches[1], 10);
      const minutes = parseInt(matches[2], 10);
      const period = matches[3].toUpperCase();

      // Convert to 24-hour format
      if (period === "PM" && hours < 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      return {
        hour: hours,
        minute: minutes,
        displayFormat: timeString, // Store the original display format
      };
    };

    // Parse the time inputs
    const startTimeObj = parseTimeToObj(startTimeInput);
    const endTimeObj = parseTimeToObj(endTimeInput);

    if (!startTimeObj || !endTimeObj) {
      showMessage(
        "Invalid time format. Please use HH:MM AM/PM format.",
        "error"
      );
      updateBtn.innerHTML = originalBtnText;
      updateBtn.disabled = false;
      return;
    }

    // Update document in Firestore
    const timeOffData = {
      title: title,
      startTime: startTimeInput, // Store the display format (12-hour)
      startTimeObj: startTimeObj, // Store the time object for calculations
      endTime: endTimeInput, // Store the display format (12-hour)
      endTimeObj: endTimeObj, // Store the time object for calculations
      frequency: frequency,
      dayOfWeek: dayOfWeek,
      specificDay: firebase.firestore.Timestamp.fromDate(new Date(specificDay)),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    console.log(
      "Updating time off record:",
      timeOffId,
      JSON.stringify(timeOffData)
    );

    // Update in Firestore
    await db.collection("timeOff").doc(timeOffId).update(timeOffData);

    // Hide modal and reload time off data
    hideModal();

    // Give the database time to update before reloading
    setTimeout(() => {
      loadTimeOffData();
    }, 500);

    // Log activity
    try {
      await logActivity("update", "timeOff", currentCompany.id);
    } catch (logError) {
      console.error("Error logging activity:", logError);
      // Continue since this is non-critical
    }

    // Show success message
    showMessage("Time off record updated successfully", "success");
  } catch (error) {
    console.error("Error updating time off record:", error);
    showMessage("Error updating time off record: " + error.message, "error");

    // Reset button state
    const updateBtn = document.getElementById("update-time-off-btn");
    if (updateBtn) {
      updateBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
      updateBtn.disabled = false;
    }
  }
}

// Confirm delete time off
function confirmDeleteTimeOff(timeOffId) {
  const modalContent = `
        <div class="confirmation-modal">
            <p>Are you sure you want to delete this time off record?</p>
            <div class="form-footer">
                <button type="button" class="cancel-modal-btn" onclick="hideModal()">Cancel</button>
                <button type="button" class="danger-btn" onclick="deleteTimeOff('${timeOffId}')">Delete</button>
            </div>
        </div>
    `;

  showModal("Confirm Delete", modalContent);
}

// Delete time off record
async function deleteTimeOff(timeOffId) {
  try {
    // Show loading message
    showMessage("Deleting time off record...", "info");

    // Delete from Firestore
    await db.collection("timeOff").doc(timeOffId).delete();

    // Hide modal and reload time off data
    hideModal();
    loadTimeOffData();

    // Log activity
    await logActivity("delete", "timeOff", timeOffId);

    // Show success message
    showMessage("Time off record deleted successfully", "success");
  } catch (error) {
    console.error("Error deleting time off:", error);
    showMessage(`Error deleting time off: ${error.message}`, "error");
  }
}

// Function to set up time pickers for time off
function setupTimePickersForTimeOff() {
  // Focus event listeners for time inputs
  document.querySelectorAll(".time-input").forEach((input) => {
    // Allow direct manual entry with validation
    input.addEventListener("input", function (e) {
      validateTimeOffInput(this);
    });

    // Show time picker when input is focused
    input.addEventListener("focus", function () {
      // Close any other open time pickers first
      document.querySelectorAll(".time-picker").forEach((p) => {
        if (p !== this.nextElementSibling) {
          p.classList.remove("active");
        }
      });

      const picker = this.nextElementSibling;
      if (picker) {
        picker.style.display = "flex";
        picker.classList.add("active");

        // Parse the current value and update selects if it's valid
        if (this.value) {
          updateTimeOffSelectsFromInput(this);
        }
      }
    });

    input.addEventListener("blur", function (e) {
      // Delay hiding to allow clicking on time picker elements
      setTimeout(() => {
        const picker = this.nextElementSibling;
        if (
          picker &&
          !picker.contains(document.activeElement) &&
          document.activeElement !== this
        ) {
          picker.style.display = "none";
          picker.classList.remove("active");
        }
      }, 200);
    });
  });

  // Set time buttons
  document.querySelectorAll(".set-time-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const targetInputId = this.getAttribute("data-target");
      const targetInput = document.getElementById(targetInputId);
      if (!targetInput) return;

      // Determine prefixes for select elements
      const prefix = targetInputId.includes("start") ? "start" : "end";

      // Build the select IDs
      const hourSelectId = `${prefix}-hour`;
      const minuteSelectId = `${prefix}-minute`;
      const periodSelectId = `${prefix}-period`;

      // Get values from selects with additional validation
      let hour = document.getElementById(hourSelectId)?.value || "12";
      let minute = document.getElementById(minuteSelectId)?.value || "00";
      let period = document.getElementById(periodSelectId)?.value || "AM";

      // Ensure values are properly formatted
      hour = parseInt(hour, 10);
      if (isNaN(hour) || hour < 1 || hour > 12) hour = 12;
      hour = hour.toString().padStart(2, "0");

      minute = parseInt(minute, 10);
      if (isNaN(minute) || minute < 0 || minute > 59) minute = 0;
      minute = minute.toString().padStart(2, "0");

      if (period !== "AM" && period !== "PM") period = "AM";

      // Set the formatted time value
      const formattedTime = `${hour}:${minute} ${period}`;
      targetInput.value = formattedTime;
      targetInput.classList.remove("invalid-input");
      targetInput.classList.add("valid-input");

      // Hide the picker
      this.parentElement.style.display = "none";
      this.parentElement.classList.remove("active");

      // Fire change event so other listeners can react
      const changeEvent = new Event("change", { bubbles: true });
      targetInput.dispatchEvent(changeEvent);

      // Also trigger input event for validation
      const inputEvent = new Event("input", { bubbles: true });
      targetInput.dispatchEvent(inputEvent);
    });
  });
}

// Validate a time input field for time off
function validateTimeOffInput(inputElement) {
  const value = inputElement.value.trim();

  // Regular expression for HH:MM AM/PM format
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/i;

  if (value === "" || timeRegex.test(value)) {
    // Valid format
    inputElement.classList.remove("invalid-input");
    inputElement.classList.add("valid-input");
    return true;
  } else {
    // Invalid format
    inputElement.classList.remove("valid-input");
    inputElement.classList.add("invalid-input");
    return false;
  }
}

// Update select elements based on the input value for time off
function updateTimeOffSelectsFromInput(inputElement) {
  const value = inputElement.value.trim();
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/i;

  if (!timeRegex.test(value)) return;

  const matches = value.match(timeRegex);
  if (matches && matches.length === 4) {
    const hour = parseInt(matches[1], 10);
    const minute = parseInt(matches[2], 10);
    const period = matches[3].toUpperCase();

    const targetId = inputElement.id;
    const prefix = targetId.includes("start") ? "start" : "end";

    // Update selects
    const hourSelect = document.getElementById(`${prefix}-hour`);
    const minuteSelect = document.getElementById(`${prefix}-minute`);
    const periodSelect = document.getElementById(`${prefix}-period`);

    if (hourSelect) hourSelect.value = hour;

    // Find closest 5-minute interval for the minute select
    if (minuteSelect) {
      const closestMinute = Math.round(minute / 5) * 5;
      minuteSelect.value = closestMinute >= 60 ? 55 : closestMinute;
    }

    if (periodSelect) periodSelect.value = period;
  }
}
