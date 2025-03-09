// Global formatTime function for safely handling time formatting
function formatTime(timeObj) {
  // Handle null or missing timeObj
  if (!timeObj) return "N/A";

  try {
    // If timeObj is a string with HH:MM AM/PM format, return it directly
    if (typeof timeObj === "string") {
      if (timeObj.includes("AM") || timeObj.includes("PM")) {
        return timeObj;
      }

      // If it's a string but not in the correct format, try to convert it
      const parts = timeObj.split(":");
      if (parts.length === 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);

        if (!isNaN(hours) && !isNaN(minutes)) {
          return formatTimeFor12Hour(`${hours}:${minutes}`);
        }
      }
    }

    // If timeObj has a displayFormat property, use that
    if (timeObj.displayFormat) {
      return timeObj.displayFormat;
    }

    // If it has hour and minute properties, format those
    if (
      timeObj &&
      typeof timeObj === "object" &&
      typeof timeObj.hour !== "undefined" &&
      typeof timeObj.minute !== "undefined"
    ) {
      const h = parseInt(timeObj.hour, 10);
      const m = parseInt(timeObj.minute, 10);

      if (isNaN(h) || isNaN(m)) {
        console.warn("Invalid time object values:", timeObj);
        return "N/A";
      }

      const hour12 = h % 12 || 12; // Convert 0 to 12
      const period = h < 12 ? "AM" : "PM";

      return `${String(hour12).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )} ${period}`;
    }

    console.warn("Unrecognized time format:", timeObj);
    return "N/A";
  } catch (error) {
    console.warn("Error formatting time:", error);
    return "N/A";
  }
}

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
                        <th>Vehicle</th>
                        <th>Route</th>
                        <th>Date</th>
                        <th><i class="fas fa-plane-departure mr-1"></i> Departure</th>
                        <th><i class="fas fa-plane-arrival mr-1"></i> Arrival</th>
                        <th><i class="fas fa-clock mr-1"></i> Waiting</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="trips-table-body">
                    <tr>
                        <td colspan="9" style="text-align: center;">Loading trips...</td>
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
                    <td colspan="9" style="text-align: center;">Error: Company information not available. Please try logging out and back in.</td>
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
                    <td colspan="9" style="text-align: center;">No trips found</td>
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
                <td colspan="9" style="text-align: center;">Error loading trip data: ${error.message}</td>
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
    try {
      const date = trip.date.toDate ? trip.date.toDate() : new Date(trip.date);
      formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.warn("Error formatting date:", error);
    }
  }

  // Safely get departure time
  let departureTime = "N/A";
  if (typeof trip.departureTime === "string" && trip.departureTime.trim()) {
    departureTime = trip.departureTime;
  } else if (trip.departureTimeObj) {
    departureTime = formatTime(trip.departureTimeObj);
  }

  // Safely get arrival time
  let arrivalTime = "N/A";
  if (typeof trip.arrivalTime === "string" && trip.arrivalTime.trim()) {
    arrivalTime = trip.arrivalTime;
  } else if (trip.arrivalTimeObj) {
    arrivalTime = formatTime(trip.arrivalTimeObj);
  }

  // Format waiting time
  let waitingTime = "N/A";
  if (trip.waitingTime) {
    try {
      const hours = parseInt(trip.waitingTime.hour) || 0;
      const minutes = parseInt(trip.waitingTime.minute) || 0;
      const totalMinutes = hours * 60 + minutes;

      if (totalMinutes === 0) {
        waitingTime = "None";
      } else if (totalMinutes < 60) {
        waitingTime = `${minutes} min`;
      } else if (minutes === 0) {
        waitingTime = `${hours} hour${hours > 1 ? "s" : ""}`;
      } else {
        waitingTime = `${hours} hour${hours > 1 ? "s" : ""} ${minutes} min`;
      }
    } catch (error) {
      console.warn("Error formatting waiting time:", error);
    }
  }

  // Format price
  let price = "N/A";
  if (trip.price !== undefined) {
    try {
      price = `${trip.price.toLocaleString()} ${trip.currency || ""}`;
    } catch (error) {
      console.warn("Error formatting price:", error);
      price = `${trip.price} ${trip.currency || ""}`;
    }
  }

  // Get vehicle info
  let vehicleInfo = "Unknown Vehicle";
  if (window.vehicles && trip.vehicleId) {
    const vehicle = window.vehicles.find((v) => v.id === trip.vehicleId);
    if (vehicle) {
      vehicleInfo = `${vehicle.name} (${vehicle.plateNumber})`;
    }
  }

  const row = document.createElement("tr");
  row.setAttribute("data-id", trip.id);
  row.setAttribute("data-trip", JSON.stringify(trip));

  row.innerHTML = `
        <td>${vehicleInfo}</td>
    <td>${trip.fromCity} to ${trip.toCity}</td>
    <td>${formattedDate}</td>
    <td>${departureTime}</td>
    <td>${arrivalTime}</td>
    <td>${waitingTime}</td>
    <td>${trip.routeType || "N/A"}</td>
        <td>${price}</td>
        <td>
      <button class="action-btn edit-btn" data-id="${trip.id}">
                    <i class="fas fa-edit"></i>
                </button>
      <button class="action-btn delete-btn" data-id="${trip.id}">
                    <i class="fas fa-trash"></i>
                </button>
        </td>
    `;

  tripsTableBody.appendChild(row);
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

  // Convert search term to lowercase for case-insensitive matching
  searchTerm = searchTerm.toLowerCase();

  rows.forEach((row) => {
    // Skip rows with colspan (like "No trips found")
    if (row.cells.length <= 2) return;

    // Get text from relevant cells
    const vehicleInfo = row.cells[0].textContent.toLowerCase();
    const routeInfo = row.cells[1].textContent.toLowerCase();
    const dateInfo = row.cells[2].textContent.toLowerCase();
    const departureInfo = row.cells[3].textContent.toLowerCase();
    const arrivalInfo = row.cells[4].textContent.toLowerCase();

    // Check search term match
    const matchesSearch =
      !searchTerm ||
      vehicleInfo.includes(searchTerm) ||
      routeInfo.includes(searchTerm) ||
      dateInfo.includes(searchTerm) ||
      departureInfo.includes(searchTerm) ||
      arrivalInfo.includes(searchTerm);

    // Check filter match
    let matchesFilter = true;
    if (filterValue !== "all") {
      // Determine if trip is in the past based on date
      const dateCell = row.cells[2].textContent;
      const tripDate = new Date(dateCell);
      const currentDate = new Date();

      // Set time to beginning of day for fair comparison
      currentDate.setHours(0, 0, 0, 0);

      const isPastTrip = tripDate < currentDate;
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

    // Format default time for display
    const defaultTimeString = `${defaultHour12
      .toString()
      .padStart(2, "0")}:${defaultMinute
      .toString()
      .padStart(2, "0")} ${defaultPeriod}`;

    const modalContent = `
            <form id="add-trip-form" class="wide-form">
                <div class="form-group">
                    <label for="trip-vehicle">Vehicle</label>
                    <select id="trip-vehicle" required>
                        ${vehicleOptions}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="trip-from">From City</label>
                        <input type="text" id="trip-from" required>
                    </div>
                    
                    <div class="form-group half">
                        <label for="trip-to">To City</label>
                        <input type="text" id="trip-to" required>
                    </div>
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
                            <input type="text" id="trip-departure" class="time-input" placeholder="HH:MM AM/PM" value="${defaultTimeString}" required>
                            <i class="far fa-clock time-icon"></i>
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
                            <i class="far fa-clock time-icon"></i>
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
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="trip-waiting">Waiting Time (Minutes)</label>
                        <input type="number" id="trip-waiting" min="0" value="0">
                    </div>
                    
                    <div class="form-group half">
                        <label for="trip-route-type">Route Type</label>
                        <select id="trip-route-type" required>
                            <option value="Direct">Direct</option>
                            <option value="Multiple Stops">Multiple Stops</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="trip-price">Price</label>
                        <input type="number" id="trip-price" min="0" step="0.01" required>
                    </div>
                    
                    <div class="form-group half">
                        <label for="trip-currency">Currency</label>
                        <select id="trip-currency" required>
                            <option value="YER">Yemeni Rial (YER)</option>
                            <option value="SAR">Saudi Riyal (SAR)</option>
                            <option value="USD">US Dollar (USD)</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="cancel-modal-btn" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="primary-btn">
                        <i class="fas fa-plus-circle"></i> Add Trip
                    </button>
                </div>
            </form>
        `;

    showModal("Add Trip", modalContent);

    // Set up form submission
    document
      .getElementById("add-trip-form")
      .addEventListener("submit", handleAddTrip);

    // Add time picker functionality
    setupTimePickers();

    // Pre-fill arrival time with a sensible default (departure time + 1 hour)
    setTimeout(() => {
      const departureInput = document.getElementById("trip-departure");
      const arrivalInput = document.getElementById("trip-arrival");

      // Only set a default for arrival if user hasn't entered something yet
      if (departureInput.value && !arrivalInput.value) {
        const departureObj = parseTimeInput(departureInput.value);
        if (departureObj) {
          // Create a default arrival time (departure + 1 hour)
          let arrivalHour = departureObj.hour + 1;
          const arrivalPeriod =
            arrivalHour < 12 ? "AM" : arrivalHour < 24 ? "PM" : "AM";
          const arrivalHour12 = arrivalHour % 12 || 12;

          arrivalInput.value = `${arrivalHour12
            .toString()
            .padStart(2, "0")}:${departureObj.minute
            .toString()
            .padStart(2, "0")} ${arrivalPeriod}`;

          // Update the select values for consistency
          document.getElementById("arrival-hour").value = arrivalHour12;
          document.getElementById("arrival-minute").value = departureObj.minute;
          document.getElementById("arrival-period").value = arrivalPeriod;
        }
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
    // Show loading
    showMessage("Loading trip data...", "info");

    // Fetch trip data
    const tripDoc = await tripsRef.doc(tripId).get();

    if (!tripDoc.exists) {
      showMessage("Trip not found", "error");
      return;
    }

    const trip = tripDoc.data();

    // Get vehicle details
    const vehicleDetails = await getVehicleDetails(trip.vehicleId);

    // Fetch all vehicles for the company
    const allVehicles = await fetchCompanyVehicles();

    let vehicleOptions = '<option value="">Select Vehicle</option>';
    allVehicles.forEach((vehicle) => {
      vehicleOptions += `<option value="${vehicle.id}" ${
        vehicle.id === trip.vehicleId ? "selected" : ""
      }>${vehicle.vehicleType} (${vehicle.vehicleNo})</option>`;
    });

    // Format date for input
    let formattedDate = "";
    if (trip.date) {
      try {
        const date = trip.date.toDate
          ? trip.date.toDate()
          : new Date(trip.date);
        formattedDate = date.toISOString().split("T")[0];
      } catch (error) {
        console.error("Error formatting date for edit:", error);
      }
    }

    // Parse the times
    let departureTime = "";
    let arrivalTime = "";

    // Check if departure time is available
    if (trip.departureTime) {
      if (typeof trip.departureTime === "string") {
        // If it's already a string format (HH:MM AM/PM)
        departureTime = trip.departureTime;
      } else if (trip.departureTime.displayFormat) {
        // If it has a displayFormat property
        departureTime = trip.departureTime.displayFormat;
      } else {
        // Otherwise, format from hour/minute properties
        departureTime = formatTime(trip.departureTime);
      }
    } else {
      departureTime = "09:00 AM"; // Default
    }

    // Check if arrival time is available
    if (trip.arrivalTime) {
      if (typeof trip.arrivalTime === "string") {
        // If it's already a string format (HH:MM AM/PM)
        arrivalTime = trip.arrivalTime;
      } else if (trip.arrivalTime.displayFormat) {
        // If it has a displayFormat property
        arrivalTime = trip.arrivalTime.displayFormat;
      } else {
        // Otherwise, format from hour/minute properties
        arrivalTime = formatTime(trip.arrivalTime);
      }
    } else {
      arrivalTime = "10:00 AM"; // Default
    }

    // Parse the 12-hour format time strings to get components
    function parseTimeForSelects(timeString) {
      if (!timeString || !timeString.includes(" ")) {
        // Default to 9:00 AM if time string is invalid
        return { hour12: 9, minute: 0, period: "AM" };
      }

      try {
        const [time, period] = timeString.trim().split(" ");
        const [hourStr, minuteStr] = time.split(":");

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
    }

    const departureTimeParts = parseTimeForSelects(departureTime);
    const arrivalTimeParts = parseTimeForSelects(arrivalTime);

    // Get waiting time in minutes
    const waitingHours =
      trip.waitingTime && trip.waitingTime.hour
        ? parseInt(trip.waitingTime.hour, 10)
        : 0;
    const waitingMinutes =
      trip.waitingTime && trip.waitingTime.minute
        ? parseInt(trip.waitingTime.minute, 10)
        : 0;
    const totalWaitingMinutes = waitingHours * 60 + waitingMinutes;

    const modalContent = `
      <form id="edit-trip-form" class="wide-form">
        <input type="hidden" id="edit-trip-id" value="${tripId}">
        
        <div class="form-group">
          <label for="edit-trip-vehicle">Vehicle</label>
          <select id="edit-trip-vehicle" required>
            ${vehicleOptions}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label for="edit-trip-from">From City</label>
            <input type="text" id="edit-trip-from" value="${
              trip.fromCity || ""
            }" required>
          </div>
          
          <div class="form-group half">
            <label for="edit-trip-to">To City</label>
            <input type="text" id="edit-trip-to" value="${
              trip.toCity || ""
            }" required>
          </div>
        </div>
        
        <div class="form-group">
          <label for="edit-trip-date">Date</label>
          <input type="date" id="edit-trip-date" value="${formattedDate}" required>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label for="edit-trip-departure">Departure Time</label>
            <div class="time-input-container">
              <input type="text" id="edit-trip-departure" class="time-input" placeholder="HH:MM AM/PM" value="${departureTime}" required>
              <i class="far fa-clock time-icon"></i>
              <div class="time-picker">
                <select id="edit-departure-hour" class="hour-select">
                  ${Array.from({ length: 12 }, (_, i) => i + 1)
                    .map(
                      (h) =>
                        `<option value="${h}" ${
                          h === departureTimeParts.hour12 ? "selected" : ""
                        }>${h.toString().padStart(2, "0")}</option>`
                    )
                    .join("")}
                </select>
                <span>:</span>
                <select id="edit-departure-minute" class="minute-select">
                  ${Array.from({ length: 60 / 5 }, (_, i) => i * 5)
                    .map(
                      (m) =>
                        `<option value="${m}" ${
                          m === departureTimeParts.minute ? "selected" : ""
                        }>${m.toString().padStart(2, "0")}</option>`
                    )
                    .join("")}
                </select>
                <select id="edit-departure-period">
                  <option value="AM" ${
                    departureTimeParts.period === "AM" ? "selected" : ""
                  }>AM</option>
                  <option value="PM" ${
                    departureTimeParts.period === "PM" ? "selected" : ""
                  }>PM</option>
                </select>
                <button type="button" class="set-time-btn" data-target="edit-trip-departure">Set</button>
              </div>
            </div>
          </div>

          <div class="form-group half">
            <label for="edit-trip-arrival">Arrival Time</label>
            <div class="time-input-container">
              <input type="text" id="edit-trip-arrival" class="time-input" placeholder="HH:MM AM/PM" value="${arrivalTime}" required>
              <i class="far fa-clock time-icon"></i>
              <div class="time-picker">
                <select id="edit-arrival-hour" class="hour-select">
                  ${Array.from({ length: 12 }, (_, i) => i + 1)
                    .map(
                      (h) =>
                        `<option value="${h}" ${
                          h === arrivalTimeParts.hour12 ? "selected" : ""
                        }>${h.toString().padStart(2, "0")}</option>`
                    )
                    .join("")}
                </select>
                <span>:</span>
                <select id="edit-arrival-minute" class="minute-select">
                  ${Array.from({ length: 60 / 5 }, (_, i) => i * 5)
                    .map(
                      (m) =>
                        `<option value="${m}" ${
                          m === arrivalTimeParts.minute ? "selected" : ""
                        }>${m.toString().padStart(2, "0")}</option>`
                    )
                    .join("")}
                </select>
                <select id="edit-arrival-period">
                  <option value="AM" ${
                    arrivalTimeParts.period === "AM" ? "selected" : ""
                  }>AM</option>
                  <option value="PM" ${
                    arrivalTimeParts.period === "PM" ? "selected" : ""
                  }>PM</option>
                </select>
                <button type="button" class="set-time-btn" data-target="edit-trip-arrival">Set</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label for="edit-trip-waiting">Waiting Time (Minutes)</label>
            <input type="number" id="edit-trip-waiting" min="0" value="${totalWaitingMinutes}">
          </div>
          
          <div class="form-group half">
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
              }>Yemeni Rial (YER)</option>
              <option value="SAR" ${
                trip.currency === "SAR" ? "selected" : ""
              }>Saudi Riyal (SAR)</option>
              <option value="USD" ${
                trip.currency === "USD" ? "selected" : ""
              }>US Dollar (USD)</option>
            </select>
          </div>
        </div>
        
        <div class="form-footer">
          <button type="button" class="cancel-modal-btn" onclick="hideModal()">Cancel</button>
          <button type="submit" class="primary-btn">
            <i class="fas fa-save"></i> Update Trip
          </button>
        </div>
      </form>
    `;

    showModal("Edit Trip", modalContent);

    // Set up form submission
    document
      .getElementById("edit-trip-form")
      .addEventListener("submit", handleEditTrip);

    // Add time picker functionality
    setupTimePickers();
  } catch (error) {
    console.error("Error showing edit trip modal:", error);
    showMessage("Error loading trip data: " + error.message, "error");
  }
}

// Confirm delete trip
function confirmDeleteTrip(tripId) {
  const modalContent = `
        <p>Are you sure you want to delete this trip?</p>
        <p>This action cannot be undone.</p>
        
        <div class="form-footer">
            <button type="button" class="danger-btn" onclick="hideModal()">Cancel</button>
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

  // If timeString is not a string, return null
  if (typeof timeString !== "string") {
    console.warn("Invalid time input format:", timeString);
    return null;
  }

  try {
    // Make sure we have a trim'd string to work with
    timeString = timeString.trim();

    // Check if this is a 12-hour format with AM/PM
    if (timeString.includes("AM") || timeString.includes("PM")) {
      // Parse the 12-hour format (e.g., "02:30 PM")
      const timeParts = timeString.split(" ");
      if (timeParts.length !== 2) return null;

      const timePart = timeParts[0];
      const period = timeParts[1];

      if (!timePart || !period) return null;

      const parts = timePart.split(":");
      if (parts.length !== 2) return null;

      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);

      if (isNaN(hours) || isNaN(minutes)) return null;

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
      const parts = timeString.split(":");
      if (parts.length !== 2) return null;

      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);

      if (isNaN(hours) || isNaN(minutes)) return null;

      return {
        hour: hours,
        minute: minutes,
      };
    }
  } catch (error) {
    console.warn("Error parsing time input:", error);
    return null;
  }
}

// Convert from 24-hour to 12-hour format (HH:MM aa)
function formatTimeFor12Hour(timeString) {
  if (!timeString) return "";

  // If timeString is not a string, return empty string
  if (typeof timeString !== "string") {
    console.warn("Invalid time string format:", timeString);
    return "";
  }

  try {
    // Make sure we're working with a trimmed string
    timeString = timeString.trim();

    const parts = timeString.split(":");
    if (parts.length !== 2) return "";

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return "";

    const hour12 = hours % 12 || 12; // Convert 0 to 12
    const period = hours < 12 ? "AM" : "PM";

    return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )} ${period}`;
  } catch (error) {
    console.warn("Error formatting time for 12-hour display:", error);
    return "";
  }
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

  // Check required fields existence
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

  // Check required fields have values
  if (
    !vehicleInput.value ||
    !fromInput.value ||
    !toInput.value ||
    !dateInput.value ||
    !departureInput.value ||
    !arrivalInput.value ||
    !priceInput.value
  ) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    // Validate time formats first
    if (
      !validateTimeInput(departureInput) ||
      !validateTimeInput(arrivalInput)
    ) {
      showMessage(
        "Please enter valid times in the format HH:MM AM/PM",
        "error"
      );
      return;
    }

    // Convert waiting time minutes to TimeOfDay
    const waitingMinutes = parseInt(waitingInput.value) || 0;
    const waitingHours = Math.floor(waitingMinutes / 60);
    const remainingMinutes = waitingMinutes % 60;

    // Parse the departure and arrival times
    const departureTime12h = departureInput.value.trim();
    const arrivalTime12h = arrivalInput.value.trim();

    // Parse to time objects for validation
    const departureTimeObj = parseTimeInput(departureTime12h);
    const arrivalTimeObj = parseTimeInput(arrivalTime12h);

    // Validate the time inputs
    if (!departureTimeObj || !arrivalTimeObj) {
      showMessage(
        "Please enter valid times in the format HH:MM AM/PM",
        "error"
      );
      return;
    }

    // Validate date input
    let tripDate;
    try {
      tripDate = new Date(dateInput.value);
      if (isNaN(tripDate.getTime())) {
        showMessage("Please enter a valid date", "error");
        return;
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      showMessage("Please enter a valid date", "error");
      return;
    }

    // Create trip
    const tripData = {
      vehicleId: vehicleInput.value,
      fromCity: fromInput.value,
      toCity: toInput.value,
      date: tripDate,

      // Store the time in 12-hour format (HH:MM aa)
      departureTime: departureTime12h,
      arrivalTime: arrivalTime12h,

      waitingTime: {
        hour: waitingHours,
        minute: remainingMinutes,
      },
      routeType: routeTypeInput.value, // Direct or Multiple Stops
      price: parseFloat(priceInput.value) || 0,
      currency: currencyInput.value, // YER, SAR, USD
      companyId: currentCompany.id,
      createdAt: getTimestamp(),
    };

    // Add validation for important fields
    if (!tripData.vehicleId || !tripData.fromCity || !tripData.toCity) {
      showMessage("Missing required trip information", "error");
      return;
    }

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
    showMessage("Error adding trip: " + error.message, "error");
  }
}

// Handle edit trip form submission
async function handleEditTrip(e) {
  e.preventDefault();

  const tripId = document.getElementById("edit-trip-id").value;
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

  // Check required fields existence
  if (
    !tripId ||
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

  // Check required fields have values
  if (
    !vehicleInput.value ||
    !fromInput.value ||
    !toInput.value ||
    !dateInput.value ||
    !departureInput.value ||
    !arrivalInput.value ||
    !priceInput.value
  ) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    // Convert waiting time minutes to TimeOfDay
    const waitingMinutes = parseInt(waitingInput.value) || 0;
    const waitingHours = Math.floor(waitingMinutes / 60);
    const remainingMinutes = waitingMinutes % 60;

    // Parse the departure and arrival times
    const departureTimeObj = parseTimeInput(departureInput.value);
    const arrivalTimeObj = parseTimeInput(arrivalInput.value);

    // Validate the time inputs
    if (!departureTimeObj || !arrivalTimeObj) {
      showMessage(
        "Please enter valid times in the format HH:MM AM/PM",
        "error"
      );
      return;
    }

    // Store the 12-hour format times directly
    const departureTime12h = departureInput.value.trim();
    const arrivalTime12h = arrivalInput.value.trim();

    // Validate date input
    let tripDate;
    try {
      tripDate = new Date(dateInput.value);
      if (isNaN(tripDate.getTime())) {
        showMessage("Please enter a valid date", "error");
        return;
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      showMessage("Please enter a valid date", "error");
      return;
    }

    // Create updated trip data
    const tripData = {
      vehicleId: vehicleInput.value,
      fromCity: fromInput.value,
      toCity: toInput.value,
      date: tripDate,

      // Store the time in 12-hour format (HH:MM aa)
      departureTime: departureTime12h,
      arrivalTime: arrivalTime12h,

      waitingTime: {
        hour: waitingHours,
        minute: remainingMinutes,
      },
      routeType: routeTypeInput.value, // Direct or Multiple Stops
      price: parseFloat(priceInput.value) || 0,
      currency: currencyInput.value, // YER, SAR, USD
    };

    // Update trip
    await tripsRef.doc(tripId).update(tripData);

    // Log activity
    await logActivity("update", "trip", tripId);

    showMessage("Trip updated successfully", "success");
    hideModal();

    // Refresh trips list
    fetchTrips();
  } catch (error) {
    console.error("Error updating trip:", error);
    showMessage("Error updating trip: " + error.message, "error");
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
