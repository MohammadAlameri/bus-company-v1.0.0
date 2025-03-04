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

// Load existing working hours from Firestore
async function loadExistingWorkingHours() {
  try {
    const snapshot = await db
      .collection("workingHours")
      .where("companyId", "==", currentCompany.id)
      .get();

    if (!snapshot.empty) {
      const workingHoursData = snapshot.docs[0].data();

      if (workingHoursData && workingHoursData.hours) {
        // Update the form with the loaded data
        Object.entries(workingHoursData.hours).forEach(([day, data]) => {
          const dayToggle = document.querySelector(
            `.day-enabled[data-day="${day}"]`
          );
          const startTime = document.querySelector(
            `.start-time[data-day="${day}"]`
          );
          const endTime = document.querySelector(
            `.end-time[data-day="${day}"]`
          );
          const statusText = dayToggle
            .closest(".weekday-status")
            .querySelector(".status-text");

          if (dayToggle && startTime && endTime) {
            dayToggle.checked = data.isOpen;
            statusText.textContent = data.isOpen ? "Open" : "Closed";

            if (data.startTime) {
              startTime.value = data.startTime;
              startTime.disabled = !data.isOpen;
            }

            if (data.endTime) {
              endTime.value = data.endTime;
              endTime.disabled = !data.isOpen;
            }
          }
        });
      }
    }
  } catch (error) {
    console.error("Error loading existing working hours:", error);
  }
}

// Save working hours to Firestore
async function saveWorkingHours() {
  try {
    showMessage("Saving working hours...", "info");

    const workingHours = {};
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    // Collect data from form
    days.forEach((day) => {
      const isOpen = document.querySelector(
        `.day-enabled[data-day="${day}"]`
      ).checked;
      const startTime = document.querySelector(
        `.start-time[data-day="${day}"]`
      ).value;
      const endTime = document.querySelector(
        `.end-time[data-day="${day}"]`
      ).value;

      workingHours[day] = {
        isOpen,
        startTime: isOpen ? startTime : null,
        endTime: isOpen ? endTime : null,
      };
    });

    // Check if we have existing working hours
    const snapshot = await db
      .collection("workingHours")
      .where("companyId", "==", currentCompany.id)
      .get();

    if (snapshot.empty) {
      // Create new working hours document
      await db.collection("workingHours").add({
        companyId: currentCompany.id,
        hours: workingHours,
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      });
    } else {
      // Update existing working hours
      await snapshot.docs[0].ref.update({
        hours: workingHours,
        updatedAt: getTimestamp(),
      });
    }

    await logActivity("update", "workingHours", currentCompany.id);
    showMessage("Working hours saved successfully", "success");
  } catch (error) {
    console.error("Error saving working hours:", error);
    showMessage("Error saving working hours: " + error.message, "error");
  }
}

// Load time off data
async function loadTimeOffData() {
  try {
    const timeOffList = document.getElementById("time-off-list");
    if (!timeOffList) return;

    console.log("Loading time off data for company ID:", currentCompany.id);

    timeOffList.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading time off records...</p>
      </div>
    `;

    // Make sure we're using the correct collection reference
    // There might be a typo or case sensitivity issue with the collection name
    const timeOffRef = db.collection("timeOff");

    // Debug: Check if the collection exists and has documents
    const allTimeOff = await timeOffRef.limit(5).get();
    console.log("Found total time off records in db:", allTimeOff.size);

    const snapshot = await timeOffRef
      .where("companyId", "==", currentCompany.id)
      .orderBy("startDate", "desc")
      .get();

    console.log("Found time off records for this company:", snapshot.size);

    if (snapshot.empty) {
      timeOffList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No time off records found</p>
                    <small>CompanyID: ${currentCompany.id}</small>
                </div>
            `;
      return;
    }

    let timeOffHTML = "";
    snapshot.forEach((doc) => {
      const timeOff = doc.data();
      console.log("Time off record:", doc.id, timeOff);

      // Check if dates are valid
      let startDate, endDate;
      try {
        startDate = timeOff.startDate
          ? timeOff.startDate.toDate
            ? timeOff.startDate.toDate()
            : new Date(timeOff.startDate)
          : new Date();
        endDate = timeOff.endDate
          ? timeOff.endDate.toDate
            ? timeOff.endDate.toDate()
            : new Date(timeOff.endDate)
          : new Date();
      } catch (e) {
        console.error("Error parsing dates for timeOff:", e);
        startDate = new Date();
        endDate = new Date();
      }

      timeOffHTML += `
                <div class="time-off-item" data-id="${doc.id}">
                    <div class="time-off-date">
                        <span>${startDate.toLocaleDateString()}</span>
                        <span>to</span>
                        <span>${endDate.toLocaleDateString()}</span>
                    </div>
                    <div class="time-off-reason">
                        ${timeOff.reason || "No reason provided"}
                    </div>
                    <div class="time-off-actions">
                        <button class="icon-btn edit-time-off-btn" data-id="${
                          doc.id
                        }">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn delete-time-off-btn" data-id="${
                          doc.id
                        }">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
    });

    timeOffList.innerHTML =
      timeOffHTML ||
      `
      <div class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <p>No time off records could be displayed</p>
      </div>
    `;

    // Add event listeners to edit and delete buttons
    document.querySelectorAll(".edit-time-off-btn").forEach((btn) => {
      btn.addEventListener("click", () => showEditTimeOffModal(btn.dataset.id));
    });

    document.querySelectorAll(".delete-time-off-btn").forEach((btn) => {
      btn.addEventListener("click", () => confirmDeleteTimeOff(btn.dataset.id));
    });
  } catch (error) {
    console.error("Error loading time off data:", error);
  }
}

// Show add time off modal
function showAddTimeOffModal() {
  const today = new Date().toISOString().split("T")[0];

  const modalContent = `
        <div class="add-time-off-form">
            <div class="form-group">
                <label for="time-off-start">Start Date</label>
                <input type="date" id="time-off-start" min="${today}">
            </div>
            <div class="form-group">
                <label for="time-off-end">End Date</label>
                <input type="date" id="time-off-end" min="${today}">
            </div>
            <div class="form-group">
                <label for="time-off-reason">Reason (Optional)</label>
                <textarea id="time-off-reason" rows="3"></textarea>
            </div>
            
            <div class="form-footer">
                <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                <button type="button" class="primary-btn" onclick="addTimeOff()">Add Time Off</button>
            </div>
        </div>
    `;

  showModal("Add Time Off", modalContent);

  // Initialize end date to default to start date when start date changes
  document.getElementById("time-off-start").addEventListener("change", (e) => {
    const endDateInput = document.getElementById("time-off-end");
    if (endDateInput.value === "" || endDateInput.value < e.target.value) {
      endDateInput.value = e.target.value;
    }
    endDateInput.min = e.target.value;
  });
}

// Add time off record
async function addTimeOff() {
  try {
    const startDate = document.getElementById("time-off-start").value;
    const endDate = document.getElementById("time-off-end").value;
    const reason = document.getElementById("time-off-reason").value.trim();

    if (!startDate || !endDate) {
      showMessage("Please select both start and end dates", "error");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      showMessage("End date cannot be before start date", "error");
      return;
    }

    // Show loading message
    showMessage("Adding time off record...", "info");

    // Add to Firestore
    await db.collection("timeOff").add({
      companyId: currentCompany.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    });

    // Hide modal and reload time off data
    hideModal();
    loadTimeOffData();

    // Log activity
    await logActivity("create", "timeOff", currentCompany.id);

    // Show success message
    showMessage("Time off record added successfully", "success");
  } catch (error) {
    console.error("Error adding time off:", error);
    showMessage(`Error adding time off: ${error.message}`, "error");
  }
}

// Show edit time off modal
async function showEditTimeOffModal(timeOffId) {
  try {
    const timeOffDoc = await db.collection("timeOff").doc(timeOffId).get();
    if (!timeOffDoc.exists) {
      showMessage("Time off record not found", "error");
      return;
    }

    const timeOff = timeOffDoc.data();
    const startDate = timeOff.startDate.toDate
      ? timeOff.startDate.toDate()
      : new Date(timeOff.startDate);
    const endDate = timeOff.endDate.toDate
      ? timeOff.endDate.toDate()
      : new Date(timeOff.endDate);

    const today = new Date().toISOString().split("T")[0];
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    const modalContent = `
            <div class="edit-time-off-form">
                <input type="hidden" id="time-off-id" value="${timeOffId}">
                <div class="form-group">
                    <label for="edit-time-off-start">Start Date</label>
                    <input type="date" id="edit-time-off-start" min="${today}" value="${formattedStartDate}">
                </div>
                <div class="form-group">
                    <label for="edit-time-off-end">End Date</label>
                    <input type="date" id="edit-time-off-end" min="${formattedStartDate}" value="${formattedEndDate}">
                </div>
                <div class="form-group">
                    <label for="edit-time-off-reason">Reason (Optional)</label>
                    <textarea id="edit-time-off-reason" rows="3">${
                      timeOff.reason || ""
                    }</textarea>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                    <button type="button" class="primary-btn" onclick="updateTimeOff()">Update Time Off</button>
                </div>
            </div>
        `;

    showModal("Edit Time Off", modalContent);

    // Initialize end date to default to start date when start date changes
    document
      .getElementById("edit-time-off-start")
      .addEventListener("change", (e) => {
        const endDateInput = document.getElementById("edit-time-off-end");
        if (endDateInput.value === "" || endDateInput.value < e.target.value) {
          endDateInput.value = e.target.value;
        }
        endDateInput.min = e.target.value;
      });
  } catch (error) {
    console.error("Error showing edit time off modal:", error);
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Update time off record
async function updateTimeOff() {
  try {
    const timeOffId = document.getElementById("time-off-id").value;
    const startDate = document.getElementById("edit-time-off-start").value;
    const endDate = document.getElementById("edit-time-off-end").value;
    const reason = document.getElementById("edit-time-off-reason").value.trim();

    if (!startDate || !endDate) {
      showMessage("Please select both start and end dates", "error");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      showMessage("End date cannot be before start date", "error");
      return;
    }

    // Show loading message
    showMessage("Updating time off record...", "info");

    // Update in Firestore
    await db
      .collection("timeOff")
      .doc(timeOffId)
      .update({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason,
        updatedAt: getTimestamp(),
      });

    // Hide modal and reload time off data
    hideModal();
    loadTimeOffData();

    // Log activity
    await logActivity("update", "timeOff", timeOffId);

    // Show success message
    showMessage("Time off record updated successfully", "success");
  } catch (error) {
    console.error("Error updating time off:", error);
    showMessage(`Error updating time off: ${error.message}`, "error");
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
