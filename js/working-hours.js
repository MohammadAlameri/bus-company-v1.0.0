// Initialize working hours section
function loadWorkingHours() {
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
    addTimeOffBtn.addEventListener("click", showAddTimeOffModal);
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
  try {
    // STEP 1: Find the DOM element
    const timeOffList = document.getElementById("time-off-list");

    if (!timeOffList) {
      console.error("TIME OFF LIST ELEMENT NOT FOUND IN DOM");
      alert("Debug: Time off list element not found");
      return;
    }

    // STEP 2: Show loading state with debugging info
    console.warn("STARTING TIME OFF DATA LOAD - " + new Date().toISOString());
    console.log("Current company data:", JSON.stringify(currentCompany));

    // Update the time off display with a table structure
    timeOffList.innerHTML = `
      <div class="time-off-header">
        <h3>Time Off Records</h3>
        <button onclick="showAddTimeOffModal()" class="add-btn primary-btn">
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
              <th><i class="fas fa-cogs mr-2"></i>Actions</th>
            </tr>
          </thead>
          <tbody id="time-off-table-body">
            <tr>
              <td colspan="6" class="loading-row">
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading time off records...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    // Add table styles
    addTimeOffTableStyles();

    // STEP 3: Verify company data
    if (!currentCompany || !currentCompany.id) {
      console.error("ERROR: Missing company data", currentCompany);
      const timeOffTableBody = document.getElementById("time-off-table-body");
      timeOffTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="error-row">
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Company data is missing or invalid</p>
          <button onclick="location.reload()">Refresh Page</button>
        </div>
          </td>
        </tr>
      `;
      return;
    }

    // STEP 4: Query Firestore directly with extreme debugging
    console.warn("QUERYING FIRESTORE TIME OFF COLLECTION");

    // First get ALL records to verify collection exists and has data
    const db = firebase.firestore();
    const timeOffRef = db.collection("timeOff");

    console.log("Checking for ANY time off records...");
    const sampleCheck = await timeOffRef.limit(5).get();

    console.log(`Found ${sampleCheck.size} records in timeOff collection`);
    if (!sampleCheck.empty) {
      sampleCheck.forEach((doc) => {
        console.log("Sample record:", doc.id, JSON.stringify(doc.data()));
      });
    }

    // STEP 5: Query for this specific company's records
    console.log(`Querying specifically for company ID: "${currentCompany.id}"`);
    const timeOffTableBody = document.getElementById("time-off-table-body");

    try {
      const companyRecords = await timeOffRef
        .where("companyId", "==", currentCompany.id)
        .orderBy("specificDay", "desc")
        .get();

      console.log(
        `Found ${companyRecords.size} records for company ID ${currentCompany.id}`
      );

      // STEP 6: Handle empty results
      if (companyRecords.empty) {
        console.warn("No records found for this company");
        timeOffTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-row">
        <div class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <p>No time off records found</p>
          <small>Company ID: ${currentCompany.id}</small>
        </div>
            </td>
          </tr>
      `;
        return;
      }

      // STEP 7: Process records one by one with careful error handling
      console.log("Building time off display HTML...");
      timeOffTableBody.innerHTML = ""; // Clear loading indicator

      let recordCount = 0;

      // Store records for potential filtering
      window.allTimeOffRecords = [];

      companyRecords.forEach((doc) => {
        try {
          recordCount++;
          const timeOff = doc.data();
          timeOff.id = doc.id; // Ensure ID is included

          // Store for filtering
          window.allTimeOffRecords.push(timeOff);

          // Add to the table
          addTimeOffToTable(timeOff);
        } catch (recordError) {
          console.error("Error processing record:", recordError);
        }
      });

      console.log(`Successfully added ${recordCount} records to the table`);

      // Add event listeners to the buttons
      addTimeOffActionListeners();
    } catch (indexError) {
      console.error("Index error in time off query:", indexError);

      if (indexError.message && indexError.message.includes("index")) {
        console.log("This is an index error. Attempting fallback query...");

        try {
          // Try a simpler query without the sorting (which doesn't require the index)
          const fallbackRecords = await timeOffRef
            .where("companyId", "==", currentCompany.id)
            .get();

          if (!fallbackRecords.empty) {
            console.log(
              `Fallback query successful! Found ${fallbackRecords.size} records`
            );

            // Sort the results in JavaScript instead of in the query
            const timeOffItems = [];
            fallbackRecords.forEach((doc) => {
              timeOffItems.push({
                id: doc.id,
                ...doc.data(),
              });
            });

            // Sort by specificDay in descending order
            timeOffItems.sort((a, b) => {
              const getDate = (item) => {
                if (!item.specificDay) return new Date(0);
                if (typeof item.specificDay.toDate === "function") {
                  return item.specificDay.toDate();
                }
                return new Date(item.specificDay);
              };

              return getDate(b) - getDate(a); // descending order
            });

            // Clear loading indicator
            timeOffTableBody.innerHTML = "";

            // Add info banner about the index
            const infoRow = document.createElement("tr");
            infoRow.innerHTML = `
              <td colspan="6" class="info-row">
                <div class="info-banner">
                  <p><i class="fas fa-info-circle"></i> Using limited functionality mode - some sorting may not work correctly</p>
                  <p style="font-size: 0.9em;">To enable full functionality, <a href="https://console.firebase.google.com/v1/r/project/bookingbusticket-fa422/firestore/indexes?create_composite=ClZwcm9qZWN0cy9ib29raW5nYnVzdGlja2V0LWZhNDIyL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90aW1lT2ZmL2luZGV4ZXMvXxABGg0KCWNvbXBhbnlJZBABGg8KC3NwZWNpZmljRGF5EAIaDAoIX19uYW1lX18QAg" target="_blank">create the required database index</a>.</p>
                </div>
              </td>
            `;
            timeOffTableBody.appendChild(infoRow);

            // Store for filtering
            window.allTimeOffRecords = timeOffItems;

            // Add each record to the table
            timeOffItems.forEach((timeOff) => {
              addTimeOffToTable(timeOff);
            });

            // Add action button event listeners
            addTimeOffActionListeners();

            return; // Exit early since we've handled the data
          } else {
            console.log("Fallback query successful but no records found");
            timeOffTableBody.innerHTML = `
              <tr>
                <td colspan="6" class="empty-row">
                  <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No time off records found</p>
                    <small>Company ID: ${currentCompany.id}</small>
                  </div>
                </td>
              </tr>
            `;
          }
        } catch (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
          timeOffTableBody.innerHTML = `
            <tr>
              <td colspan="6" class="error-row">
            <div class="error-state">
              <i class="fas fa-exclamation-triangle"></i>
                  <p>Failed to load time off records</p>
                  <p>Error: ${fallbackError.message}</p>
              <button onclick="loadTimeOffData()">Try Again</button>
            </div>
              </td>
            </tr>
          `;
        }
      } else {
        // Handle other types of errors
        timeOffTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="error-row">
              <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load time off records</p>
                <p>Error: ${indexError.message}</p>
          <button onclick="loadTimeOffData()">Try Again</button>
        </div>
            </td>
          </tr>
      `;
      }
    }
  } catch (error) {
    console.error("CRITICAL ERROR in loadTimeOffData:", error);
    const timeOffTableBody = document.getElementById("time-off-table-body");
    if (timeOffTableBody) {
      timeOffTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="error-row">
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
              <p>An unexpected error occurred while loading time off records</p>
              <p>Error: ${error.message}</p>
            <button onclick="loadTimeOffData()">Try Again</button>
          </div>
          </td>
        </tr>
      `;
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

  // Format date
  let formattedDate = "N/A";
  if (timeOff.specificDay) {
    const date = timeOff.specificDay.toDate
      ? timeOff.specificDay.toDate()
      : new Date(timeOff.specificDay);

    formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
    frequencyDisplay = `Weekly (${timeOff.dayOfWeek || "Not specified"})`;
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
  const tr = document.createElement("tr");
  tr.setAttribute("data-id", timeOff.id);

  if (!isUpcoming) {
    tr.classList.add("past-record");
  }

  tr.innerHTML = `
    <td>${timeOff.title || "Untitled"}</td>
    <td>${formattedDate}</td>
    <td>${timeDisplay}</td>
    <td>${frequencyDisplay}</td>
    <td><span class="status-badge ${statusClass}">${statusDisplay}</span></td>
    <td>
      <div class="table-actions">
        <button class="edit-time-off-btn" data-id="${timeOff.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-time-off-btn" data-id="${timeOff.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </td>
  `;

  timeOffTableBody.appendChild(tr);
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
  const currentTime = new Date().toTimeString().substring(0, 5); // Gets current time in HH:MM format

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
      
      <div class="form-group">
        <label for="time-off-start">Specific Day <span class="required">*</span></label>
        <input type="date" id="time-off-start" min="${today}" value="${today}">
      </div>
      
      <div class="form-group">
        <label for="time-off-start-time">Start Time <span class="required">*</span></label>
        <div class="time-input-wrapper time-with-format">
          <i class="far fa-clock time-icon"></i>
          <input type="time" id="time-off-start-time" value="${currentTime}">
          <span class="time-format">AM</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="time-off-end-time">End Time <span class="required">*</span></label>
        <div class="time-input-wrapper time-with-format">
          <i class="far fa-clock time-icon"></i>
          <input type="time" id="time-off-end-time" value="${currentTime}">
          <span class="time-format">AM</span>
        </div>
      </div>
      
      <div class="form-actions">
        <button class="danger-btn cancel-modal-btn">Cancel</button>
        <button class="primary-btn" id="add-time-off-btn"><i class="fas fa-plus"></i> Add Time Off</button>
      </div>
    </div>
  `;

  showModal("Add Time Off", modalContent);

  // Add event listener for frequency dropdown
  document
    .getElementById("time-off-frequency")
    .addEventListener("change", function () {
      const dayOfWeekGroup = document.querySelector(".day-of-week-group");
      if (this.value === "weekly") {
        dayOfWeekGroup.style.display = "block";
      } else {
        dayOfWeekGroup.style.display = "none";
      }
    });

  // Add event listener for add button
  document
    .getElementById("add-time-off-btn")
    .addEventListener("click", function (e) {
      e.preventDefault();
      addTimeOff();
    });

  // Add event listener for cancel button
  document
    .querySelector(".cancel-modal-btn")
    .addEventListener("click", function () {
      hideModal();
    });

  // Update AM/PM indicators
  updateTimeFormat(document.getElementById("time-off-start-time"));
  updateTimeFormat(document.getElementById("time-off-end-time"));
}

// Add time off record
async function addTimeOff() {
  try {
    // Get form values
    const title = document.getElementById("time-off-reason").value.trim();
    const specificDay = document.getElementById("time-off-start").value;
    const startTimeInput = document.getElementById("time-off-start-time").value;
    const endTimeInput = document.getElementById("time-off-end-time").value;
    const frequency = document.getElementById("time-off-frequency").value;
    const dayOfWeek = document.getElementById("time-off-day").value || "";

    // Validate required fields
    if (
      !title ||
      !specificDay ||
      !startTimeInput ||
      !endTimeInput ||
      !frequency
    ) {
      showMessage("Please fill all required fields", "error");
      return;
    }

    // Show loading message and disable button
    const saveButton = document.getElementById("add-time-off-btn");
    const originalButtonText = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveButton.disabled = true;

    // Convert time inputs to TimeOfDay objects (stored as strings in Firestore)
    const startTime = startTimeInput;
    const endTime = endTimeInput;

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
      saveButton.innerHTML = originalButtonText;
      saveButton.disabled = false;
      return;
    }

    // Create the time off data object matching the schema
    const timeOffData = {
      companyId: currentCompany.id,
      title: title,
      startTime: startTime,
      endTime: endTime,
      frequency: frequency, // "once", "weekly", or "daily"
      dayOfWeek: dayOfWeek, // Only used if frequency is weekly
      specificDay: firebase.firestore.Timestamp.fromDate(new Date(specificDay)),
      createdAt: firebase.firestore.Timestamp.now(),
      status: "active",
    };

    console.log("Time off data to be saved:", JSON.stringify(timeOffData));

    // Add to Firestore
    const db = firebase.firestore();
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
  } catch (error) {
    console.error("Error adding time off record:", error);
    showMessage("Error adding time off record: " + error.message, "error");

    // Reset button state
    const saveButton = document.getElementById("add-time-off-btn");
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-plus"></i> Add Time Off';
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

    const modalContent = `
      <div class="edit-time-off-form" data-id="${timeOffId}">
        <div class="form-group">
          <label for="edit-time-off-reason">Title</label>
          <input type="text" id="edit-time-off-reason" value="${
            timeOff.title || ""
          }">
        </div>
        
        <div class="form-group">
          <label for="edit-time-off-frequency">Frequency</label>
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
          <label for="edit-time-off-day">Day of Week</label>
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
        
        <div class="form-group">
          <label for="edit-time-off-start">Specific Day</label>
          <input type="date" id="edit-time-off-start" min="${today}" value="${specificDayValue}">
        </div>
        
        <div class="form-group">
          <label for="edit-time-off-start-time">Start Time</label>
          <input type="time" id="edit-time-off-start-time" value="${
            timeOff.startTime || ""
          }">
        </div>
        
        <div class="form-group">
          <label for="edit-time-off-end-time">End Time</label>
          <input type="time" id="edit-time-off-end-time" value="${
            timeOff.endTime || ""
          }">
        </div>
        
        <div class="form-actions">
          <button class="danger-btn cancel-modal-btn">Cancel</button>
          <button class="primary-btn" id="update-time-off-btn">Update Time Off</button>
        </div>
      </div>
    `;

    showModal("Edit Time Off", modalContent);

    // Add event listener for frequency dropdown
    document
      .getElementById("edit-time-off-frequency")
      .addEventListener("change", function () {
        const dayOfWeekGroup = document.querySelector(".day-of-week-group");
        if (this.value === "weekly") {
          dayOfWeekGroup.style.display = "block";
        } else {
          dayOfWeekGroup.style.display = "none";
        }
      });

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
    const specificDay = document.getElementById("edit-time-off-start").value;
    const startTime = document.getElementById("edit-time-off-start-time").value;
    const endTime = document.getElementById("edit-time-off-end-time").value;
    const frequency = document.getElementById("edit-time-off-frequency").value;
    const dayOfWeek = document.getElementById("edit-time-off-day")?.value || "";

    // Validate required fields
    if (!title || !specificDay || !startTime || !endTime || !frequency) {
      showMessage("Please fill all required fields", "error");
      return;
    }

    // Show loading message
    showMessage("Updating time off record...", "info");
    console.log("Updating time off record:", timeOffId);

    // Update in Firestore
    await db
      .collection("timeOff")
      .doc(timeOffId)
      .update({
        title: title,
        specificDay: firebase.firestore.Timestamp.fromDate(
          new Date(specificDay)
        ),
        startTime: startTime,
        endTime: endTime,
        frequency: frequency,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : "",
        updatedAt: getTimestamp(),
      });

    // Hide modal and reload time off data
    hideModal();

    // Give the database time to update before reloading
    setTimeout(() => {
      loadTimeOffData();
    }, 500);

    // Log activity
    await logActivity("update", "timeOff", currentCompany.id);

    // Show success message
    showMessage("Time off record updated successfully", "success");
  } catch (error) {
    console.error("Error updating time off record:", error);
    showMessage("Error updating time off record: " + error.message, "error");
  }
}

// Confirm delete time off
function confirmDeleteTimeOff(timeOffId) {
  const modalContent = `
        <div class="confirmation-modal">
            <p>Are you sure you want to delete this time off record?</p>
            <div class="form-footer">
                <button type="button" class="danger-btn" onclick="hideModal()">Cancel</button>
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
