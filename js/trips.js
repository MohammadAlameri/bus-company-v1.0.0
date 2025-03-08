// Initialize trips section
function loadTrips() {
  if (!currentCompany) return;

  // Update trips section content
  const tripsSection = document.getElementById("trips-section");
  if (!tripsSection) return;

  tripsSection.innerHTML = `
        <div class="section-header">
            <h2>Trips Management</h2>
            <div class="section-actions">
                <button id="refresh-trips-btn" class="refresh-btn secondary-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button id="add-trip-btn" class="primary-btn">Add Trip</button>
            </div>
        </div>
        
        <div class="search-filter">
            <div class="search-input">
                <i class="fas fa-search"></i>
                <input type="text" id="trip-search" placeholder="Search trips...">
            </div>
            <div class="filter-controls">
                <select id="trip-filter">
                    <option value="all">All Trips</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                </select>
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="trips-table">
                <thead>
                    <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Bus</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="trips-table-body">
                    <tr>
                        <td colspan="8" style="text-align: center;">Loading trips...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

  // Add event listeners
  const addTripBtn = document.getElementById("add-trip-btn");
  if (addTripBtn) {
    addTripBtn.addEventListener("click", showAddTripModal);
  }

  const refreshTripsBtn = document.getElementById("refresh-trips-btn");
  if (refreshTripsBtn) {
    refreshTripsBtn.addEventListener("click", () => {
      showMessage("Refreshing trips data...", "info");
      fetchTrips();
    });
  }

  const tripSearch = document.getElementById("trip-search");
  if (tripSearch) {
    tripSearch.addEventListener("input", () => {
      const searchTerm = tripSearch.value.toLowerCase();
      const filterValue = document.getElementById("trip-filter").value;
      filterTrips(searchTerm, filterValue);
    });
  }

  const tripFilter = document.getElementById("trip-filter");
  if (tripFilter) {
    tripFilter.addEventListener("change", () => {
      const filterValue = tripFilter.value;
      const searchTerm = tripSearch ? tripSearch.value.toLowerCase() : "";
      filterTrips(searchTerm, filterValue);
    });
  }

  // Fetch trips
  fetchTrips();
}

// Fetch trips
async function fetchTrips() {
  try {
    const tripsTableBody = document.getElementById("trips-table-body");
    if (!tripsTableBody) return;

    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error("Current company information not available");
      tripsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center;">Error: Company information not available. Please try logging out and back in.</td>
                </tr>
            `;
      return;
    }

    console.log("Fetching trips for company ID:", currentCompany.id);

    // Query trips for this company - without using a composite index
    const snapshot = await tripsRef
      .where("companyId", "==", currentCompany.id)
      .get();

    if (snapshot.empty) {
      tripsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center;">No trips found</td>
                </tr>
            `;
      return;
    }

    // Create table rows
    tripsTableBody.innerHTML = "";

    // Store all trip data for filtering
    window.allTrips = [];

    // Get all trips and sort them by date manually
    const trips = [];
    snapshot.forEach((doc) => {
      const tripData = {
        id: doc.id,
        ...doc.data(),
      };
      trips.push(tripData);
    });

    // Sort by date (descending)
    trips.sort((a, b) => {
      const dateA = a.date
        ? new Date(a.date.toDate ? a.date.toDate() : a.date)
        : new Date(0);
      const dateB = b.date
        ? new Date(b.date.toDate ? b.date.toDate() : b.date)
        : new Date(0);
      return dateB - dateA; // Descending order (newest first)
    });

    // Process each trip
    const promises = [];

    trips.forEach((tripData) => {
      window.allTrips.push(tripData);

      // Fetch vehicle details
      const promise = getVehicleDetails(tripData.vehicleId)
        .then((vehicleDetails) => {
          tripData.vehicleDetails = vehicleDetails;
          addTripToTable(tripData);
        })
        .catch((error) => {
          console.error("Error fetching vehicle details:", error);
          addTripToTable(tripData);
        });

      promises.push(promise);
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    // Add event listeners to action buttons
    addTripActionListeners();
  } catch (error) {
    console.error("Error fetching trips:", error);

    const tripsTableBody = document.getElementById("trips-table-body");
    if (tripsTableBody) {
      tripsTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center;">Error loading trip data: ${error.message}</td>
            </tr>
        `;
    }

    showMessage("Error loading trips data: " + error.message, "error");
  }
}

// Get vehicle details
async function getVehicleDetails(vehicleId) {
  try {
    if (!vehicleId) return null;

    const doc = await vehiclesRef.doc(vehicleId).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting vehicle details:", error);
    return null;
  }
}

// Add trip to table
function addTripToTable(trip) {
  const tripsTableBody = document.getElementById("trips-table-body");
  if (!tripsTableBody) return;

  // Format date
  let formattedDate = "N/A";
  if (trip.date) {
    const date = trip.date.toDate ? trip.date.toDate() : new Date(trip.date);
    formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Format times
  const formatTime = (timeObj) => {
    if (!timeObj) return "N/A";

    const hour = timeObj.hour;
    const minute = timeObj.minute.toString().padStart(2, "0");

    // Convert to 12-hour format
    const hour12 = hour % 12 || 12; // Convert 0 to 12
    const period = hour < 12 ? "AM" : "PM";

    // Format as HH:MM aa
    return `${hour12.toString().padStart(2, "0")}:${minute} ${period}`;
  };

  const departureTime = formatTime(trip.departureTime);
  const arrivalTime = formatTime(trip.arrivalTime);

  // Format price
  const price = trip.price ? `${trip.price} ${trip.currency || ""}` : "N/A";

  // Get vehicle info
  const vehicleInfo = trip.vehicleDetails
    ? `${trip.vehicleDetails.vehicleType} (${trip.vehicleDetails.vehicleNo})`
    : "Unknown Vehicle";

  // Create table row
  const tr = document.createElement("tr");
  tr.setAttribute("data-id", trip.id);

  // Check if trip is past or future
  const isPastTrip =
    trip.date &&
    new Date(trip.date.toDate ? trip.date.toDate() : trip.date) < new Date();

  if (isPastTrip) {
    tr.classList.add("past-trip");
  }

  tr.innerHTML = `
        <td>${trip.fromCity || "N/A"}</td>
        <td>${trip.toCity || "N/A"}</td>
        <td>${formattedDate}</td>
        ${arrivalTime}</td> - <td>${departureTime} 
        <td>${vehicleInfo}</td>
        <td>${price}</td>
        <td>${isPastTrip ? "Past" : "Upcoming"}</td>
        <td>
            <div class="table-actions">
                <button class="edit-btn" data-id="${trip.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${trip.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;

  tripsTableBody.appendChild(tr);
}

// Add event listeners to trip action buttons
function addTripActionListeners() {
  // Edit buttons
  const editButtons = document.querySelectorAll("#trips-table .edit-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tripId = button.getAttribute("data-id");
      showEditTripModal(tripId);
    });
  });

  // Delete buttons
  const deleteButtons = document.querySelectorAll("#trips-table .delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tripId = button.getAttribute("data-id");
      confirmDeleteTrip(tripId);
    });
  });
}

// Filter trips
function filterTrips(searchTerm = "", filterValue = "all") {
  const rows = document.querySelectorAll("#trips-table-body tr");

  rows.forEach((row) => {
    // Skip rows with colspan (like "No trips found")
    if (row.cells.length <= 2) return;

    const fromCity = row.cells[0].textContent.toLowerCase();
    const toCity = row.cells[1].textContent.toLowerCase();
    const date = row.cells[2].textContent.toLowerCase();

    // Check search term match
    const matchesSearch =
      !searchTerm ||
      fromCity.includes(searchTerm) ||
      toCity.includes(searchTerm) ||
      date.includes(searchTerm);

    // Check filter match
    let matchesFilter = true;
    if (filterValue !== "all") {
      const isPastTrip = row.classList.contains("past-trip");
      matchesFilter =
        (filterValue === "past" && isPastTrip) ||
        (filterValue === "upcoming" && !isPastTrip);
    }

    // Show/hide row based on matches
    if (matchesSearch && matchesFilter) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Show add trip modal
async function showAddTripModal() {
  try {
    // Fetch vehicles for the company
    const vehicles = await fetchCompanyVehicles();

    let vehicleOptions = '<option value="">Select Vehicle</option>';
    vehicles.forEach((vehicle) => {
      vehicleOptions += `<option value="${vehicle.id}">${vehicle.vehicleType} (${vehicle.vehicleNo})</option>`;
    });

    // Set default times (current hour rounded to nearest 5 minutes)
    const now = new Date();
    const defaultHour = now.getHours();
    const defaultMinute = Math.ceil(now.getMinutes() / 5) * 5;

    // Convert to 12-hour format
    const defaultHour12 = defaultHour % 12 || 12;
    const defaultPeriod = defaultHour < 12 ? "AM" : "PM";

    const modalContent = `
            <form id="add-trip-form">
                <div class="form-group">
                    <label for="trip-vehicle">Vehicle</label>
                    <select id="trip-vehicle" required>
                        ${vehicleOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="trip-from">From City</label>
                    <input type="text" id="trip-from" required>
                </div>
                
                <div class="form-group">
                    <label for="trip-to">To City</label>
                    <input type="text" id="trip-to" required>
                </div>
                
                <div class="form-group">
                    <label for="trip-date">Date</label>
                    <input type="date" id="trip-date" value="${
                      new Date().toISOString().split("T")[0]
                    }" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="trip-departure">Departure Time</label>
                        <div class="time-input-container">
                            <input type="text" id="trip-departure" class="time-input" placeholder="HH:MM AM/PM" required>
                            <div class="time-picker">
                                <select id="departure-hour" class="hour-select">
                                    ${Array.from(
                                      { length: 12 },
                                      (_, i) => i + 1
                                    )
                                      .map(
                                        (h) =>
                                          `<option value="${h}" ${
                                            h === defaultHour12
                                              ? "selected"
                                              : ""
                                          }>${h
                                            .toString()
                                            .padStart(2, "0")}</option>`
                                      )
                                      .join("")}
                                </select>
                                <span>:</span>
                                <select id="departure-minute" class="minute-select">
                                    ${Array.from(
                                      { length: 60 / 5 },
                                      (_, i) => i * 5
                                    )
                                      .map(
                                        (m) =>
                                          `<option value="${m}" ${
                                            m === defaultMinute % 60
                                              ? "selected"
                                              : ""
                                          }>${m
                                            .toString()
                                            .padStart(2, "0")}</option>`
                                      )
                                      .join("")}
                                </select>
                                <select id="departure-period">
                                    <option value="AM" ${
                                      defaultPeriod === "AM" ? "selected" : ""
                                    }>AM</option>
                                    <option value="PM" ${
                                      defaultPeriod === "PM" ? "selected" : ""
                                    }>PM</option>
                                </select>
                                <button type="button" class="set-time-btn" data-target="trip-departure">Set</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group half">
                        <label for="trip-arrival">Arrival Time</label>
                        <div class="time-input-container">
                            <input type="text" id="trip-arrival" class="time-input" placeholder="HH:MM AM/PM" required>
                            <div class="time-picker">
                                <select id="arrival-hour" class="hour-select">
                                    ${Array.from(
                                      { length: 12 },
                                      (_, i) => i + 1
                                    )
                                      .map(
                                        (h) =>
                                          `<option value="${h}" ${
                                            h === defaultHour12
                                              ? "selected"
                                              : ""
                                          }>${h
                                            .toString()
                                            .padStart(2, "0")}</option>`
                                      )
                                      .join("")}
                                </select>
                                <span>:</span>
                                <select id="arrival-minute" class="minute-select">
                                    ${Array.from(
                                      { length: 60 / 5 },
                                      (_, i) => i * 5
                                    )
                                      .map(
                                        (m) =>
                                          `<option value="${m}" ${
                                            m === defaultMinute % 60
                                              ? "selected"
                                              : ""
                                          }>${m
                                            .toString()
                                            .padStart(2, "0")}</option>`
                                      )
                                      .join("")}
                                </select>
                                <select id="arrival-period">
                                    <option value="AM" ${
                                      defaultPeriod === "AM" ? "selected" : ""
                                    }>AM</option>
                                    <option value="PM" ${
                                      defaultPeriod === "PM" ? "selected" : ""
                                    }>PM</option>
                                </select>
                                <button type="button" class="set-time-btn" data-target="trip-arrival">Set</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="trip-waiting">Waiting Time (Minutes)</label>
                    <input type="number" id="trip-waiting" min="0" value="0">
                </div>
                
                <div class="form-group">
                    <label for="trip-route-type">Route Type</label>
                    <select id="trip-route-type" required>
                        <option value="Direct">Direct</option>
                        <option value="Multiple Stops">Multiple Stops</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="trip-price">Price</label>
                        <input type="number" id="trip-price" min="0" step="0.01" required>
                    </div>
                    
                    <div class="form-group half">
                        <label for="trip-currency">Currency</label>
                        <select id="trip-currency" required>
                            <option value="YER">YER</option>
                            <option value="SAR">SAR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="primary-btn">Add Trip</button>
                </div>
            </form>
            <style>
                .time-input-container {
                    position: relative;
                }
                .time-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .time-picker {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    z-index: 100;
                    width: 100%;
                }
                .time-input:focus + .time-picker,
                .time-picker:hover,
                .time-picker.active {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .set-time-btn {
                    margin-left: auto;
                    padding: 5px 10px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .set-time-btn:hover {
                    background: #3a5bd7;
                }
                .hour-select, .minute-select {
                    padding: 5px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                }
            </style>
        `;

    showModal("Add New Trip", modalContent);

    // Set up event listeners
    document
      .getElementById("add-trip-form")
      .addEventListener("submit", handleAddTrip);

    // Set up time picker functionality with improved behavior
    setupTimePickers();

    // Set the default time values for time inputs
    setTimeout(() => {
      const departureInput = document.getElementById("trip-departure");
      if (departureInput) {
        departureInput.value = `${defaultHour12
          .toString()
          .padStart(2, "0")}:${defaultMinute
          .toString()
          .padStart(2, "0")} ${defaultPeriod}`;
      }

      const arrivalInput = document.getElementById("trip-arrival");
      if (arrivalInput) {
        // Add one hour to arrival time by default
        let arrivalHour = defaultHour + 1;
        const arrivalPeriod = arrivalHour < 12 ? "AM" : "PM";
        const arrivalHour12 = arrivalHour % 12 || 12;

        arrivalInput.value = `${arrivalHour12
          .toString()
          .padStart(2, "0")}:${defaultMinute
          .toString()
          .padStart(2, "0")} ${arrivalPeriod}`;
      }
    }, 100);
  } catch (error) {
    console.error("Error preparing add trip form", error);
    showMessage("Error preparing add trip form", "error");
  }
}

// Function to set up time pickers
function setupTimePickers() {
  // Focus event listeners for time inputs
  document.querySelectorAll(".time-input").forEach((input) => {
    // Allow direct manual entry with validation
    input.addEventListener("input", function (e) {
      validateTimeInput(this);
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
          updateSelectsFromInput(this);
        }
      }
    });

    input.addEventListener("blur", function (e) {
      // Delay hiding to allow clicking on time picker elements
      setTimeout(() => {
        const picker = this.nextElementSibling;
        if (picker && !picker.contains(document.activeElement)) {
          picker.style.display = "none";
          picker.classList.remove("active");
        }
      }, 150);
    });
  });

  // Set time button click handlers
  document.querySelectorAll(".set-time-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const targetId = this.dataset.target;
      const targetInput = document.getElementById(targetId);
      const prefix = targetId.includes("edit")
        ? targetId.split("-")[2] // For edit form (edit-trip-departure)
        : targetId.split("-")[1]; // For add form (trip-departure)

      let hourSelectId = `${prefix}-hour`;
      let minuteSelectId = `${prefix}-minute`;
      let periodSelectId = `${prefix}-period`;

      // Handle edit form selectors which have different naming
      if (targetId.includes("edit")) {
        hourSelectId = `edit-${prefix}-hour`;
        minuteSelectId = `edit-${prefix}-minute`;
        periodSelectId = `edit-${prefix}-period`;
      }

      const hour = document.getElementById(hourSelectId).value;
      const minute = document.getElementById(minuteSelectId).value;
      const period = document.getElementById(periodSelectId).value;

      targetInput.value = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;
      this.parentElement.style.display = "none";
      this.parentElement.classList.remove("active");

      // Trigger validation
      validateTimeInput(targetInput);
    });
  });
}

// Validate a time input field
function validateTimeInput(inputElement) {
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

// Update select elements based on the input value
function updateSelectsFromInput(inputElement) {
  const value = inputElement.value.trim();
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/i;

  if (!timeRegex.test(value)) return;

  const matches = value.match(timeRegex);
  if (matches && matches.length === 4) {
    const hour = parseInt(matches[1], 10);
    const minute = parseInt(matches[2], 10);
    const period = matches[3].toUpperCase();

    const targetId = inputElement.id;
    const prefix = targetId.includes("edit")
      ? targetId.split("-")[2] // For edit form (edit-trip-departure)
      : targetId.split("-")[1]; // For add form (trip-departure)

    let hourSelectId = `${prefix}-hour`;
    let minuteSelectId = `${prefix}-minute`;
    let periodSelectId = `${prefix}-period`;

    // Handle edit form selectors which have different naming
    if (targetId.includes("edit")) {
      hourSelectId = `edit-${prefix}-hour`;
      minuteSelectId = `edit-${prefix}-minute`;
      periodSelectId = `edit-${prefix}-period`;
    }

    // Update selects
    const hourSelect = document.getElementById(hourSelectId);
    const minuteSelect = document.getElementById(minuteSelectId);
    const periodSelect = document.getElementById(periodSelectId);

    if (hourSelect) hourSelect.value = hour;

    // Find closest available minute (in case the entered minute isn't in our 5-min increments)
    if (minuteSelect) {
      const options = Array.from(minuteSelect.options).map((opt) =>
        parseInt(opt.value, 10)
      );
      const closestMinute = options.reduce((prev, curr) =>
        Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev
      );
      minuteSelect.value = closestMinute;
    }

    if (periodSelect) periodSelect.value = period;
  }
}

// Show edit trip modal
async function showEditTripModal(tripId) {
  try {
    // Fetch trip details
    const tripDoc = await tripsRef.doc(tripId).get();
    if (!tripDoc.exists) {
      showMessage("Trip not found", "error");
      return;
    }

    const trip = tripDoc.data();

    // Fetch vehicles for the company
    const vehicles = await fetchCompanyVehicles();

    let vehicleOptions = '<option value="">Select Vehicle</option>';
    vehicles.forEach((vehicle) => {
      const selected = vehicle.id === trip.vehicleId ? "selected" : "";
      vehicleOptions += `<option value="${vehicle.id}" ${selected}>${vehicle.vehicleType} (${vehicle.vehicleNo})</option>`;
    });

    // Format date for input
    const tripDate = trip.date.toDate
      ? trip.date.toDate()
      : new Date(trip.date);
    const formattedDate = tripDate.toISOString().split("T")[0];

    // Format times for display in 12-hour format
    const formatTime = (timeObj) => {
      if (!timeObj) return "";

      // Convert to 12-hour format
      const hour12 = timeObj.hour % 12 || 12; // Convert 0 to 12
      const period = timeObj.hour < 12 ? "AM" : "PM";

      return `${hour12.toString().padStart(2, "0")}:${timeObj.minute
        .toString()
        .padStart(2, "0")} ${period}`;
    };

    const departureTime = formatTime(trip.departureTime);
    const arrivalTime = formatTime(trip.arrivalTime);

    // Extract time components for select options
    const getDepartureHour12 = trip.departureTime
      ? trip.departureTime.hour % 12 || 12
      : 12;
    const getDepartureMinute = trip.departureTime
      ? trip.departureTime.minute
      : 0;
    const getDeparturePeriod = trip.departureTime
      ? trip.departureTime.hour < 12
        ? "AM"
        : "PM"
      : "AM";

    const getArrivalHour12 = trip.arrivalTime
      ? trip.arrivalTime.hour % 12 || 12
      : 12;
    const getArrivalMinute = trip.arrivalTime ? trip.arrivalTime.minute : 0;
    const getArrivalPeriod = trip.arrivalTime
      ? trip.arrivalTime.hour < 12
        ? "AM"
        : "PM"
      : "AM";

    // Calculate waiting time in minutes
    const waitingMinutes =
      (trip.waitingTime?.hour || 0) * 60 + (trip.waitingTime?.minute || 0);

    const modalContent = `
            <form id="edit-trip-form" data-id="${tripId}">
                <div class="form-group">
                    <label for="edit-trip-vehicle">Vehicle</label>
                    <select id="edit-trip-vehicle" required>
                        ${vehicleOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-from">From City</label>
                    <input type="text" id="edit-trip-from" value="${
                      trip.fromCity || ""
                    }" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-to">To City</label>
                    <input type="text" id="edit-trip-to" value="${
                      trip.toCity || ""
                    }" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-date">Date</label>
                    <input type="date" id="edit-trip-date" value="${formattedDate}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="edit-trip-departure">Departure Time</label>
                        <div class="time-input-container">
                            <input type="text" id="edit-trip-departure" class="time-input" value="${departureTime}" placeholder="HH:MM AM/PM" required>
                            <div class="time-picker">
                                <select id="edit-departure-hour" class="hour-select">
                                    ${Array.from(
                                      { length: 12 },
                                      (_, i) => i + 1
                                    )
                                      .map(
                                        (h) =>
                                          `<option value="${h}" ${
                                            h === getDepartureHour12
                                              ? "selected"
                                              : ""
                                          }>${h
                                            .toString()
                                            .padStart(2, "0")}</option>`
                                      )
                                      .join("")}
                                </select>
                                <span>:</span>
                                <select id="edit-departure-minute" class="minute-select">
                                    ${Array.from(
                                      { length: 60 / 5 },
                                      (_, i) => i * 5
                                    )
                                      .map((m) => {
                                        // Find closest 5-minute interval
                                        const closestMinute =
                                          Math.round(getDepartureMinute / 5) *
                                          5;
                                        return `<option value="${m}" ${
                                          m === closestMinute ? "selected" : ""
                                        }>${m
                                          .toString()
                                          .padStart(2, "0")}</option>`;
                                      })
                                      .join("")}
                                </select>
                                <select id="edit-departure-period">
                                    <option value="AM" ${
                                      getDeparturePeriod === "AM"
                                        ? "selected"
                                        : ""
                                    }>AM</option>
                                    <option value="PM" ${
                                      getDeparturePeriod === "PM"
                                        ? "selected"
                                        : ""
                                    }>PM</option>
                                </select>
                                <button type="button" class="set-time-btn" data-target="edit-trip-departure">Set</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group half">
                        <label for="edit-trip-arrival">Arrival Time</label>
                        <div class="time-input-container">
                            <input type="text" id="edit-trip-arrival" class="time-input" value="${arrivalTime}" placeholder="HH:MM AM/PM" required>
                            <div class="time-picker">
                                <select id="edit-arrival-hour" class="hour-select">
                                    ${Array.from(
                                      { length: 12 },
                                      (_, i) => i + 1
                                    )
                                      .map(
                                        (h) =>
                                          `<option value="${h}" ${
                                            h === getArrivalHour12
                                              ? "selected"
                                              : ""
                                          }>${h
                                            .toString()
                                            .padStart(2, "0")}</option>`
                                      )
                                      .join("")}
                                </select>
                                <span>:</span>
                                <select id="edit-arrival-minute" class="minute-select">
                                    ${Array.from(
                                      { length: 60 / 5 },
                                      (_, i) => i * 5
                                    )
                                      .map((m) => {
                                        // Find closest 5-minute interval
                                        const closestMinute =
                                          Math.round(getArrivalMinute / 5) * 5;
                                        return `<option value="${m}" ${
                                          m === closestMinute ? "selected" : ""
                                        }>${m
                                          .toString()
                                          .padStart(2, "0")}</option>`;
                                      })
                                      .join("")}
                                </select>
                                <select id="edit-arrival-period">
                                    <option value="AM" ${
                                      getArrivalPeriod === "AM"
                                        ? "selected"
                                        : ""
                                    }>AM</option>
                                    <option value="PM" ${
                                      getArrivalPeriod === "PM"
                                        ? "selected"
                                        : ""
                                    }>PM</option>
                                </select>
                                <button type="button" class="set-time-btn" data-target="edit-trip-arrival">Set</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-waiting">Waiting Time (Minutes)</label>
                    <input type="number" id="edit-trip-waiting" min="0" value="${waitingMinutes}">
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-route-type">Route Type</label>
                    <select id="edit-trip-route-type" required>
                        <option value="Direct" ${
                          trip.routeType === "Direct" ? "selected" : ""
                        }>Direct</option>
                        <option value="Multiple Stops" ${
                          trip.routeType === "Multiple Stops" ? "selected" : ""
                        }>Multiple Stops</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="edit-trip-price">Price</label>
                        <input type="number" id="edit-trip-price" min="0" step="0.01" value="${
                          trip.price || 0
                        }" required>
                    </div>
                    
                    <div class="form-group half">
                        <label for="edit-trip-currency">Currency</label>
                        <select id="edit-trip-currency" required>
                            <option value="YER" ${
                              trip.currency === "YER" ? "selected" : ""
                            }>YER</option>
                            <option value="SAR" ${
                              trip.currency === "SAR" ? "selected" : ""
                            }>SAR</option>
                            <option value="USD" ${
                              trip.currency === "USD" ? "selected" : ""
                            }>USD</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="primary-btn">Update Trip</button>
                </div>
            </form>
            <style>
                .time-input-container {
                    position: relative;
                }
                .time-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .time-picker {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    z-index: 100;
                    width: 100%;
                }
                .time-input:focus + .time-picker,
                .time-picker:hover,
                .time-picker.active {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .set-time-btn {
                    margin-left: auto;
                    padding: 5px 10px;
                    background: #4a6cf7;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .set-time-btn:hover {
                    background: #3a5bd7;
                }
                .hour-select, .minute-select {
                    padding: 5px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                }
                .valid-input {
                    border-color: #28a745 !important;
                    background-color: #f7fff9 !important;
                }
                .invalid-input {
                    border-color: #dc3545 !important;
                    background-color: #fff8f8 !important;
                }
            </style>
        `;

    showModal("Edit Trip", modalContent);

    // Add form submit event listener
    const form = document.getElementById("edit-trip-form");
    if (form) {
      form.addEventListener("submit", handleEditTrip);
    }

    // Set up time picker functionality
    setupTimePickers();

    // Set the default time values and validate
    setTimeout(() => {
      // Validate time inputs
      const departureInput = document.getElementById("edit-trip-departure");
      const arrivalInput = document.getElementById("edit-trip-arrival");

      if (departureInput) validateTimeInput(departureInput);
      if (arrivalInput) validateTimeInput(arrivalInput);
    }, 100);
  } catch (error) {
    console.error("Error loading trip details:", error);
    showMessage("Error loading trip details", "error");
  }
}

// Confirm delete trip
function confirmDeleteTrip(tripId) {
  const modalContent = `
        <p>Are you sure you want to delete this trip?</p>
        <p>This action cannot be undone.</p>
        
        <div class="form-footer">
            <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
            <button type="button" class="danger-btn" onclick="deleteTrip('${tripId}')">Delete</button>
        </div>
    `;

  showModal("Confirm Delete", modalContent);
}

// Fetch company vehicles
async function fetchCompanyVehicles() {
  try {
    const snapshot = await vehiclesRef
      .where("companyId", "==", currentCompany.id)
      .get();

    const vehicles = [];
    snapshot.forEach((doc) => {
      vehicles.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return vehicles;
  } catch (error) {
    console.error("Error fetching company vehicles:", error);
    return [];
  }
}

// Parse time input to TimeOfDay object
function parseTimeInput(timeString) {
  if (!timeString) return null;

  // Check if this is a 12-hour format with AM/PM
  if (timeString.includes("AM") || timeString.includes("PM")) {
    // Parse the 12-hour format (e.g., "02:30 PM")
    const [timePart, period] = timeString.split(" ");
    const [hours, minutes] = timePart.split(":").map(Number);

    // Convert to 24-hour format
    let hour24 = hours;
    if (period === "PM" && hours < 12) {
      hour24 = hours + 12;
    } else if (period === "AM" && hours === 12) {
      hour24 = 0;
    }

    return {
      hour: hour24,
      minute: minutes,
    };
  } else {
    // Handle standard HTML time input (comes in 24-hour format)
    const [hours, minutes] = timeString.split(":").map(Number);
    return {
      hour: hours,
      minute: minutes,
    };
  }
}

// Convert from 24-hour to 12-hour format (HH:MM aa)
function formatTimeFor12Hour(timeString) {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":").map(Number);

  const hour12 = hours % 12 || 12; // Convert 0 to 12
  const period = hours < 12 ? "AM" : "PM";

  return `${hour12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
}

// Convert from 12-hour to 24-hour format for HTML time input
function formatTimeFor24Hour(timeString) {
  if (!timeString || !timeString.includes(" ")) return timeString;

  const [timePart, period] = timeString.split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);

  // Convert to 24-hour
  let hour24 = hours;
  if (period === "PM" && hours < 12) {
    hour24 = hours + 12;
  } else if (period === "AM" && hours === 12) {
    hour24 = 0;
  }

  return `${hour24.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// Handle add trip form submission
async function handleAddTrip(e) {
  e.preventDefault();

  const vehicleInput = document.getElementById("trip-vehicle");
  const fromInput = document.getElementById("trip-from");
  const toInput = document.getElementById("trip-to");
  const dateInput = document.getElementById("trip-date");
  const departureInput = document.getElementById("trip-departure");
  const arrivalInput = document.getElementById("trip-arrival");
  const waitingInput = document.getElementById("trip-waiting");
  const routeTypeInput = document.getElementById("trip-route-type");
  const priceInput = document.getElementById("trip-price");
  const currencyInput = document.getElementById("trip-currency");

  if (
    !vehicleInput ||
    !fromInput ||
    !toInput ||
    !dateInput ||
    !departureInput ||
    !arrivalInput ||
    !routeTypeInput ||
    !priceInput ||
    !currencyInput
  ) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    // Convert waiting time minutes to TimeOfDay
    const waitingMinutes = parseInt(waitingInput.value) || 0;
    const waitingHours = Math.floor(waitingMinutes / 60);
    const remainingMinutes = waitingMinutes % 60;

    // Parse the departure and arrival times (now in 12-hour format)
    const departureTime = parseTimeInput(departureInput.value);
    const arrivalTime = parseTimeInput(arrivalInput.value);

    // Validate the time inputs
    if (!departureTime || !arrivalTime) {
      showMessage(
        "Please enter valid times in the format HH:MM AM/PM",
        "error"
      );
      return;
    }

    // Create trip
    const tripData = {
      vehicleId: vehicleInput.value,
      fromCity: fromInput.value,
      toCity: toInput.value,
      date: new Date(dateInput.value),
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      waitingTime: {
        hour: waitingHours,
        minute: remainingMinutes,
      },
      routeType: routeTypeInput.value, // Direct or Multiple Stops
      price: parseFloat(priceInput.value),
      currency: currencyInput.value, // YER, SAR, USD
      companyId: currentCompany.id,
      createdAt: getTimestamp(),
    };

    const newTripRef = await tripsRef.add(tripData);

    // Add the id field to the trip document
    await tripsRef.doc(newTripRef.id).update({
      id: newTripRef.id,
    });

    // Log activity
    await logActivity("create", "trip", newTripRef.id);

    showMessage("Trip added successfully", "success");
    hideModal();

    // Refresh trips list
    fetchTrips();
  } catch (error) {
    console.error("Error adding trip:", error);
    showMessage(`Error adding trip: ${error.message}`, "error");
  }
}

// Handle edit trip form submission
async function handleEditTrip(e) {
  e.preventDefault();

  const form = e.target;
  const tripId = form.dataset.id;

  const vehicleInput = document.getElementById("edit-trip-vehicle");
  const fromInput = document.getElementById("edit-trip-from");
  const toInput = document.getElementById("edit-trip-to");
  const dateInput = document.getElementById("edit-trip-date");
  const departureInput = document.getElementById("edit-trip-departure");
  const arrivalInput = document.getElementById("edit-trip-arrival");
  const waitingInput = document.getElementById("edit-trip-waiting");
  const routeTypeInput = document.getElementById("edit-trip-route-type");
  const priceInput = document.getElementById("edit-trip-price");
  const currencyInput = document.getElementById("edit-trip-currency");

  if (
    !vehicleInput ||
    !fromInput ||
    !toInput ||
    !dateInput ||
    !departureInput ||
    !arrivalInput ||
    !routeTypeInput ||
    !priceInput ||
    !currencyInput
  ) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    // Convert waiting time minutes to TimeOfDay
    const waitingMinutes = parseInt(waitingInput.value) || 0;
    const waitingHours = Math.floor(waitingMinutes / 60);
    const remainingMinutes = waitingMinutes % 60;

    // Parse the departure and arrival times (now in 12-hour format)
    const departureTime = parseTimeInput(departureInput.value);
    const arrivalTime = parseTimeInput(arrivalInput.value);

    // Validate the time inputs
    if (!departureTime || !arrivalTime) {
      showMessage(
        "Please enter valid times in the format HH:MM AM/PM",
        "error"
      );
      return;
    }

    // Update trip
    const tripData = {
      vehicleId: vehicleInput.value,
      fromCity: fromInput.value,
      toCity: toInput.value,
      date: new Date(dateInput.value),
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      waitingTime: {
        hour: waitingHours,
        minute: remainingMinutes,
      },
      routeType: routeTypeInput.value,
      price: parseFloat(priceInput.value),
      currency: currencyInput.value,
      updatedAt: getTimestamp(),
    };

    await tripsRef.doc(tripId).update(tripData);

    // Log activity
    await logActivity("update", "trip", tripId);

    showMessage("Trip updated successfully", "success");
    hideModal();

    // Refresh trips list
    fetchTrips();
  } catch (error) {
    console.error("Error updating trip:", error);
    showMessage(`Error updating trip: ${error.message}`, "error");
  }
}

// Delete trip
async function deleteTrip(tripId) {
  try {
    // Check for existing appointments for this trip
    const appointmentsSnapshot = await appointmentsRef
      .where("tripId", "==", tripId)
      .get();

    if (!appointmentsSnapshot.empty) {
      showMessage("Cannot delete trip with existing appointments", "error");
      hideModal();
      return;
    }

    // Delete trip
    await tripsRef.doc(tripId).delete();

    // Log activity
    await logActivity("delete", "trip", tripId);

    showMessage("Trip deleted successfully", "success");
    hideModal();

    // Refresh trips list
    fetchTrips();
  } catch (error) {
    console.error("Error deleting trip:", error);
    showMessage(`Error deleting trip: ${error.message}`, "error");
  }
}

// Add styles for the trips section
const tripStyles = document.createElement("style");
tripStyles.textContent = `
    .filter-controls {
        margin-top: 10px;
    }
    
    .filter-controls select {
        padding: 8px;
        border: 1px solid var(--light-gray);
        border-radius: 4px;
        background-color: var(--white);
    }
    
    .form-row {
        display: flex;
        gap: 15px;
    }
    
    .form-group.half {
        flex: 1;
    }
    
    .past-trip {
        opacity: 0.7;
    }
    
    .section-actions {
        display: flex;
        gap: 10px;
    }
    
    .refresh-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .refresh-btn i {
        font-size: 0.9rem;
    }
`;
document.head.appendChild(tripStyles);
