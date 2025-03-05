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
            <div class="weekday-name">${day}</div>
            <div class="weekday-status">
                <label class="switch">
                    <input type="checkbox" class="day-enabled" data-day="${day}" checked>
                    <span class="slider round"></span>
                </label>
                <span class="status-text">Open</span>
            </div>
            <div class="weekday-times">
                <div class="time-input-group">
                    <input type="time" class="time-input start-time" data-day="${day}" value="09:00">
                    <span>to</span>
                    <input type="time" class="time-input end-time" data-day="${day}" value="17:00">
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

  // Day enabled/disabled toggle
  const dayToggles = document.querySelectorAll(".day-enabled");
  dayToggles.forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const statusText = e.target
        .closest(".weekday-status")
        .querySelector(".status-text");
      const timeInputs = e.target
        .closest(".weekday-row")
        .querySelectorAll(".time-input");

      if (e.target.checked) {
        statusText.textContent = "Open";
        timeInputs.forEach((input) => (input.disabled = false));
      } else {
        statusText.textContent = "Closed";
        timeInputs.forEach((input) => (input.disabled = true));
      }
    });
  });

  // Save working hours button
  const saveBtn = document.getElementById("save-working-hours-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveWorkingHours);
  }

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
      startTime.disabled = true;
      endTime.disabled = true;

      // Reset to default times
      startTime.value = "09:00";
      endTime.value = "17:00";
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
          startTime.disabled = false;
          endTime.disabled = false;

          if (record.startTime) {
            startTime.value = record.startTime;
          }

          if (record.endTime) {
            endTime.value = record.endTime;
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

    timeOffList.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading time off records...</p>
        <small>Company ID: ${currentCompany?.id || "N/A"}</small>
      </div>
    `;

    // STEP 3: Verify company data
    if (!currentCompany || !currentCompany.id) {
      console.error("ERROR: Missing company data", currentCompany);
      timeOffList.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Company data is missing or invalid</p>
          <button onclick="location.reload()">Refresh Page</button>
        </div>
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
      timeOffList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <p>No time off records found</p>
          <small>Company ID: ${currentCompany.id}</small>
          <button onclick="showAddTimeOffModal()" class="add-btn">Add Time Off</button>
        </div>
      `;
      return;
    }

    // STEP 7: Process records one by one with careful error handling
    console.log("Building time off display HTML...");
    let timeOffHTML = "";
    let recordCount = 0;

    companyRecords.forEach((doc) => {
      try {
        recordCount++;
        const timeOff = doc.data();
        console.log(
          `Processing record ${recordCount}:`,
          doc.id,
          JSON.stringify(timeOff)
        );

        // Get the specific day
        let specificDayStr = "N/A";
        try {
          if (
            timeOff.specificDay &&
            typeof timeOff.specificDay.toDate === "function"
          ) {
            const specificDayObj = timeOff.specificDay.toDate();
            specificDayStr = specificDayObj.toLocaleDateString();
          } else if (timeOff.specificDay) {
            const specificDayObj = new Date(timeOff.specificDay);
            specificDayStr = specificDayObj.toLocaleDateString();
          }
        } catch (dateError) {
          console.error("Date parsing error:", dateError);
        }

        // Format frequency and day of week
        let frequencyDisplay = "";
        if (timeOff.frequency === "once") {
          frequencyDisplay = "One-time";
        } else if (timeOff.frequency === "daily") {
          frequencyDisplay = "Daily";
        } else if (timeOff.frequency === "weekly") {
          frequencyDisplay = `Weekly (${timeOff.dayOfWeek || "Not specified"})`;
        } else {
          frequencyDisplay = timeOff.frequency || "Not specified";
        }

        // Add this record to our HTML
        timeOffHTML += `
          <div class="time-off-item" data-id="${doc.id}">
            <div class="time-off-header">
              <h3>${timeOff.title || "Untitled"}</h3>
              <span class="time-off-badge">${frequencyDisplay}</span>
            </div>
            <div class="time-off-details">
              <div class="time-off-date">
                <i class="fas fa-calendar"></i>
                <span>${specificDayStr}</span>
              </div>
              <div class="time-off-time">
                <i class="fas fa-clock"></i>
                <span>${timeOff.startTime || "N/A"} - ${
          timeOff.endTime || "N/A"
        }</span>
              </div>
            </div>
            <div class="time-off-actions">
              <button class="icon-btn edit-time-off-btn" data-id="${doc.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-btn delete-time-off-btn" data-id="${doc.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      } catch (recordError) {
        console.error("Error processing record:", recordError);
      }
    });

    // STEP 8: Update the UI with our generated HTML
    console.log("Updating time off list HTML with generated content");
    if (timeOffHTML) {
      // Force update the UI even if there's a problem by using setTimeout
      setTimeout(() => {
        try {
          timeOffList.innerHTML = timeOffHTML;
          console.log(
            "Successfully updated time off list with records:",
            recordCount
          );

          // STEP 9: Add event listeners to the buttons
          try {
            const editButtons = document.querySelectorAll(".edit-time-off-btn");
            const deleteButtons = document.querySelectorAll(
              ".delete-time-off-btn"
            );

            console.log(
              `Adding event listeners to ${editButtons.length} edit buttons and ${deleteButtons.length} delete buttons`
            );

            editButtons.forEach((btn) => {
              btn.addEventListener("click", () => {
                console.log("Edit button clicked for:", btn.dataset.id);
                showEditTimeOffModal(btn.dataset.id);
              });
            });

            deleteButtons.forEach((btn) => {
              btn.addEventListener("click", () => {
                console.log("Delete button clicked for:", btn.dataset.id);
                confirmDeleteTimeOff(btn.dataset.id);
              });
            });

            console.log("All event listeners added successfully");
          } catch (listenerError) {
            console.error("Error adding event listeners:", listenerError);
          }
        } catch (updateError) {
          console.error("Error updating time off list:", updateError);
          timeOffList.innerHTML = `
            <div class="error-state">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Error displaying time off records</p>
              <small>${updateError.message}</small>
              <button onclick="loadTimeOffData()">Try Again</button>
            </div>
          `;
        }
      }, 100); // Small delay to ensure the DOM is ready
    } else {
      console.warn("No HTML generated despite finding records");
      timeOffList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Could not display time off records</p>
          <button onclick="loadTimeOffData()">Try Again</button>
        </div>
      `;
    }
  } catch (error) {
    console.error("CRITICAL ERROR in loadTimeOffData:", error);

    // Try to show an error message even if there are other issues
    try {
      const timeOffList = document.getElementById("time-off-list");
      if (timeOffList) {
        timeOffList.innerHTML = `
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load time off records</p>
            <small>${error.message}</small>
            <button onclick="loadTimeOffData()">Try Again</button>
          </div>
        `;
      } else {
        alert("Critical error loading time off data: " + error.message);
      }
    } catch (finalError) {
      alert("Fatal error in time off system: " + error.message);
    }
  }
}

// Show add time off modal
function showAddTimeOffModal() {
  const today = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toTimeString().substring(0, 5); // Gets current time in HH:MM format

  const modalContent = `
    <div class="add-time-off-form">
      <div class="form-group">
        <label for="time-off-reason">Title</label>
        <input type="text" id="time-off-reason" placeholder="Enter time off title">
      </div>
      
      <div class="form-group">
        <label for="time-off-frequency">Frequency</label>
        <select id="time-off-frequency">
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      
      <div class="form-group day-of-week-group" style="display: none;">
        <label for="time-off-day">Day of Week</label>
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
        <label for="time-off-start">Specific Day</label>
        <input type="date" id="time-off-start" min="${today}">
      </div>
      
      <div class="form-group">
        <label for="time-off-start-time">Start Time</label>
        <input type="time" id="time-off-start-time" value="${currentTime}">
      </div>
      
      <div class="form-group">
        <label for="time-off-end-time">End Time</label>
        <input type="time" id="time-off-end-time" value="${currentTime}">
      </div>
      
      <div class="form-actions">
        <button class="secondary-btn cancel-modal-btn">Cancel</button>
        <button class="primary-btn" id="add-time-off-btn">Add Time Off</button>
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
    .addEventListener("click", addTimeOff);
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
      return;
    }

    // Show loading message
    showMessage("Adding time off record...", "info");
    console.log("Adding time off record with title:", title);
    console.log("Current company ID:", currentCompany.id);

    // Create the time off data object matching the schema
    const timeOffData = {
      companyId: currentCompany.id,
      title: title,
      startTime: startTime,
      endTime: endTime,
      frequency: frequency, // "once", "weekly", or "daily"
      dayOfWeek: dayOfWeek, // Only used if frequency is weekly
      specificDay: firebase.firestore.Timestamp.fromDate(new Date(specificDay)),
      createdAt: getTimestamp(),
    };

    console.log("Time off data to be saved:", JSON.stringify(timeOffData));

    // Add to Firestore
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
    await logActivity("create", "timeOff", currentCompany.id);

    // Show success message
    showMessage("Time off record added successfully", "success");
  } catch (error) {
    console.error("Error adding time off record:", error);
    showMessage("Error adding time off record: " + error.message, "error");
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
          <button class="secondary-btn cancel-modal-btn">Cancel</button>
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
                <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
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

// Add styles for working hours section
const workingHoursStyles = document.createElement("style");
workingHoursStyles.textContent = `
    .working-hours-container {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        overflow: hidden;
    }
    
    .working-hours-tabs {
        display: flex;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .tab-btn {
        padding: 12px 20px;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 500;
        color: #666;
        position: relative;
    }
    
    .tab-btn.active {
        color: #4361ee;
    }
    
    .tab-btn.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background-color: #4361ee;
    }
    
    .tab-content {
        display: none;
        padding: 20px;
    }
    
    .tab-content.active {
        display: block;
    }
    
    .working-hours-form {
        max-width: 800px;
    }
    
    .weekday-hours {
        margin-bottom: 20px;
    }
    
    .weekday-row {
        display: flex;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .weekday-row:last-child {
        border-bottom: none;
    }
    
    .weekday-name {
        width: 120px;
        font-weight: 500;
    }
    
    .weekday-status {
        width: 120px;
        display: flex;
        align-items: center;
    }
    
    .status-text {
        margin-left: 10px;
        font-size: 14px;
    }
    
    .weekday-times {
        flex: 1;
    }
    
    .time-input-group {
        display: flex;
        align-items: center;
    }
    
    .time-input-group span {
        margin: 0 10px;
    }
    
    .time-input {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 120px;
    }
    
    /* Switch styles */
    .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
    }
    
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
    }
    
    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
    }
    
    input:checked + .slider {
        background-color: #4361ee;
    }
    
    input:focus + .slider {
        box-shadow: 0 0 1px #4361ee;
    }
    
    input:checked + .slider:before {
        transform: translateX(26px);
    }
    
    .slider.round {
        border-radius: 24px;
    }
    
    .slider.round:before {
        border-radius: 50%;
    }
    
    /* Time off styles */
    .time-off-container {
        padding: 10px 0;
    }
    
    .time-off-list {
        margin-bottom: 20px;
    }
    
    .time-off-item {
        display: flex;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .time-off-date {
        width: 250px;
    }
    
    .time-off-date span {
        margin: 0 5px;
    }
    
    .time-off-reason {
        flex: 1;
        padding: 0 15px;
    }
    
    .time-off-actions {
        display: flex;
    }
    
    .time-off-actions button {
        margin-left: 10px;
    }
    
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: #999;
    }
    
    .empty-state i {
        font-size: 48px;
        margin-bottom: 15px;
    }
`;

document.head.appendChild(workingHoursStyles);
