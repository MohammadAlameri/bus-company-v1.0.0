// Check if getTimestamp is defined
if (typeof getTimestamp !== "function") {
  console.error(
    "getTimestamp function is not defined. Make sure firebase-config.js is loaded before buses.js"
  );

  // Define a fallback getTimestamp function
  window.getTimestamp = function () {
    console.log("Using fallback getTimestamp function");
    return firebase.firestore.Timestamp.now();
  };
}

// Check if db is defined
if (typeof db === "undefined") {
  console.error(
    "Firestore db is not defined. Make sure firebase-config.js is loaded before buses.js"
  );

  // Try to initialize db if firebase is available
  if (typeof firebase !== "undefined" && firebase.firestore) {
    console.log("Creating fallback db instance");
    window.db = firebase.firestore();

    // Set timestamp settings
    window.db.settings({
      timestampsInSnapshots: true,
    });
  } else {
    console.error(
      "Firebase is not available. Cannot create fallback db instance."
    );
    // Show error message to user
    setTimeout(() => {
      showMessage(
        "Firebase database is not available. Please refresh the page.",
        "error"
      );
    }, 1000);
  }
}

// Check if createConverter is defined
if (typeof createConverter !== "function") {
  console.error(
    "createConverter function is not defined. Make sure firebase-config.js is loaded before buses.js"
  );

  // Define a fallback createConverter function
  window.createConverter = function (toFirestore, fromFirestore) {
    return {
      toFirestore: function (modelObject) {
        return toFirestore(modelObject);
      },
      fromFirestore: function (snapshot, options) {
        const data = snapshot.data(options);
        return fromFirestore(data);
      },
    };
  };
}

// Check if the converters are defined
if (
  typeof vehicleConverter === "undefined" ||
  typeof driverConverter === "undefined" ||
  typeof addressConverter === "undefined"
) {
  console.error(
    "Required converters are not defined. Make sure firebase-config.js is loaded before buses.js"
  );

  // Define fallback converters if needed
  if (typeof createConverter === "function") {
    console.log("Creating fallback converters");

    if (typeof vehicleConverter === "undefined") {
      window.vehicleConverter = createConverter(
        (vehicle) => {
          const { id, ...rest } = vehicle;
          return { ...rest };
        },
        (data) => ({
          id: data.id,
          driverId: data.driverId || "",
          vehicleNo: data.vehicleNo || "",
          addressId: data.addressId || "",
          vehicleType: data.vehicleType || "",
          typeOfTransportation: data.typeOfTransportation || "",
          companyId: data.companyId || "",
          countOfSeats: data.countOfSeats || 0,
        })
      );
    }

    if (typeof driverConverter === "undefined") {
      window.driverConverter = createConverter(
        (driver) => {
          const { id, ...rest } = driver;
          return { ...rest };
        },
        (data) => ({
          id: data.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          companyId: data.companyId || "",
        })
      );
    }

    if (typeof addressConverter === "undefined") {
      window.addressConverter = createConverter(
        (address) => {
          const { id, ...rest } = address;
          return { ...rest };
        },
        (data) => ({
          id: data.id,
          city: data.city || "",
          streetName: data.streetName || "",
          streetNumber: data.streetNumber || "",
          companyId: data.companyId || "",
        })
      );
    }
  }
}

const companiesRef = db.collection("companies").withConverter(companyConverter);

// Check if vehiclesRef is defined, if not, define it
if (typeof vehiclesRef === "undefined") {
  console.log("Creating vehiclesRef as it was undefined");
  window.vehiclesRef = db
    .collection("vehicles")
    .withConverter(vehicleConverter);
}

// Check if driversRef is defined, if not, define it
if (typeof driversRef === "undefined") {
  console.log("Creating driversRef as it was undefined");
  window.driversRef = db.collection("drivers").withConverter(driverConverter);
}

// Check if addressesRef is defined, if not, define it
if (typeof addressesRef === "undefined") {
  console.log("Creating addressesRef as it was undefined");
  window.addressesRef = db
    .collection("addresses")
    .withConverter(addressConverter);
}

// Check if currentCompany is defined
if (typeof currentCompany === "undefined") {
  console.error(
    "currentCompany is not defined. Make sure auth.js is loaded before buses.js"
  );

  // Try to get currentCompany from localStorage
  try {
    const companyData = localStorage.getItem("currentCompany");
    if (companyData) {
      window.currentCompany = JSON.parse(companyData);
      console.log(
        "Restored currentCompany from localStorage:",
        window.currentCompany
      );
    } else {
      console.error("No company data found in localStorage");
      // Show error message to user
      setTimeout(() => {
        if (typeof showMessage === "function") {
          showMessage(
            "Company information not available. Please try logging out and back in.",
            "error"
          );
        }
      }, 1000);
    }
  } catch (error) {
    console.error("Error restoring company data from localStorage:", error);
  }
}

function loadBuses() {
  try {
    if (!currentCompany) {
      console.error("Current company information not available in loadBuses");

      // Show error message
      if (typeof showMessage === "function") {
        showMessage(
          "Company information not available. Please try logging out and back in.",
          "error"
        );
      }

      // Update buses section with error
      const busesSection = document.getElementById("buses-section");
      if (busesSection) {
        busesSection.innerHTML = `
          <div class="section-header">
            <h2>Buses Management</h2>
          </div>
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error: Company information not available. Please try logging out and back in.</p>
          </div>
        `;
      }

      return;
    }

    // Update buses section content
    const busesSection = document.getElementById("buses-section");
    if (!busesSection) {
      console.error("Buses section element not found");
      return;
    }

    busesSection.innerHTML = `
        <div class="section-header">
            <h2>Buses Management</h2>
            <button id="add-bus-btn" class="primary-btn">Add Bus</button>
        </div>
        
        <div class="search-filter">
            <div class="search-input">
                <i class="fas fa-search"></i>
                <input type="text" id="bus-search" placeholder="Search buses...">
            </div>
            <div class="filter-controls">
                <select id="bus-filter">
                    <option value="all">All Types</option>
                    <option value="bus">Bus</option>
                    <option value="car">Car</option>
                    <option value="mini bus">Mini Bus</option>
                </select>
                <select id="transport-type-filter">
                    <option value="all">All Transport Types</option>
                    <option value="Economy">Economy</option>
                    <option value="VIP">VIP</option>
                </select>
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="buses-table">
                <thead>
                    <tr>
                        <th>Vehicle No</th>
                        <th>Type</th>
                        <th>Transport Type</th>
                        <th>Driver</th>
                        <th>Seats</th>
                        <th>Address</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="buses-table-body">
                    <tr>
                        <td colspan="7" style="text-align: center;">Loading buses...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Add event listeners
    const addBusBtn = document.getElementById("add-bus-btn");
    if (addBusBtn) {
      addBusBtn.addEventListener("click", showAddBusModal);
    }

    const busSearch = document.getElementById("bus-search");
    if (busSearch) {
      busSearch.addEventListener("input", () => {
        const searchTerm = busSearch.value.toLowerCase();
        const filterValue = document.getElementById("bus-filter").value;
        const transportTypeValue = document.getElementById(
          "transport-type-filter"
        ).value;
        filterBuses(searchTerm, filterValue, transportTypeValue);
      });
    }

    const busFilter = document.getElementById("bus-filter");
    if (busFilter) {
      busFilter.addEventListener("change", () => {
        const searchTerm = document
          .getElementById("bus-search")
          .value.toLowerCase();
        const filterValue = busFilter.value;
        const transportTypeValue = document.getElementById(
          "transport-type-filter"
        ).value;
        filterBuses(searchTerm, filterValue, transportTypeValue);
      });
    }

    const transportTypeFilter = document.getElementById(
      "transport-type-filter"
    );
    if (transportTypeFilter) {
      transportTypeFilter.addEventListener("change", () => {
        const searchTerm = document
          .getElementById("bus-search")
          .value.toLowerCase();
        const filterValue = document.getElementById("bus-filter").value;
        const transportTypeValue = transportTypeFilter.value;
        filterBuses(searchTerm, filterValue, transportTypeValue);
      });
    }

    // Fetch buses
    fetchBuses();
  } catch (error) {
    console.error("Error loading buses:", error);

    const busesTableBody = document.getElementById("buses-table-body");
    if (busesTableBody) {
      busesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Error loading bus data: ${error.message}</td>
                </tr>
            `;
    }
  }
}

// Fetch buses
async function fetchBuses() {
  try {
    const busesTableBody = document.getElementById("buses-table-body");
    if (!busesTableBody) return;

    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error("Current company information not available");
      busesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Error: Company information not available. Please try logging out and back in.</td>
                </tr>
            `;
      return;
    }

    console.log("Fetching buses for company ID:", currentCompany.id);

    // Query buses/vehicles for this company - without using a composite index
    const snapshot = await vehiclesRef
      .where("companyId", "==", currentCompany.id)
      .get();

    if (snapshot.empty) {
      busesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">No buses found</td>
                </tr>
            `;
      return;
    }

    // Create table rows
    busesTableBody.innerHTML = "";

    // Store all bus data for filtering
    window.allBuses = [];

    // Get all buses and sort them by creation time manually
    const buses = [];
    const structurePromises = [];

    snapshot.forEach((doc) => {
      const busData = {
        id: doc.id,
        ...doc.data(),
      };

      // Ensure the bus has all required fields according to the Vehicle structure
      const structurePromise = ensureBusStructure(busData, doc.id);
      structurePromises.push(structurePromise);

      buses.push(busData);
    });

    // Wait for all structure updates to complete
    await Promise.all(structurePromises);

    // Sort by createdAt (descending)
    buses.sort((a, b) => {
      const timeA = a.createdAt
        ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt)
        : new Date(0);
      const timeB = b.createdAt
        ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt)
        : new Date(0);
      return timeB - timeA; // Descending order (newest first)
    });

    // Process each bus
    const promises = [];

    buses.forEach((busData) => {
      window.allBuses.push(busData);

      // Fetch driver and address details
      const promise = Promise.all([
        getDriverDetails(busData.driverId),
        getAddressDetails(busData.addressId),
      ])
        .then(([driverDetails, addressDetails]) => {
          busData.driverDetails = driverDetails;
          busData.addressDetails = addressDetails;
          addBusToTable(busData);
        })
        .catch((error) => {
          console.error("Error fetching bus details:", error);
          addBusToTable(busData);
        });

      promises.push(promise);
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    // Add event listeners to action buttons
    addBusActionListeners();
  } catch (error) {
    console.error("Error fetching buses:", error);

    const busesTableBody = document.getElementById("buses-table-body");
    if (busesTableBody) {
      busesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Error loading bus data: ${error.message}</td>
                </tr>
            `;
    }
  }
}

// Get driver details
async function getDriverDetails(driverId) {
  if (!driverId) return null;

  try {
    const doc = await driversRef.doc(driverId).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error fetching driver details:", error);
    return null;
  }
}

// Get address details
async function getAddressDetails(addressId) {
  if (!addressId) return null;

  try {
    const doc = await addressesRef.doc(addressId).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error fetching address details:", error);
    return null;
  }
}

function addBusToTable(bus) {
  const busesTableBody = document.getElementById("buses-table-body");
  if (!busesTableBody) return;

  // Get driver name
  const driverName = bus.driverDetails ? bus.driverDetails.name : "No Driver";

  // Get address info
  let addressInfo = "No Address";
  if (bus.addressDetails) {
    const { city, streetName, streetNumber } = bus.addressDetails;
    const parts = [];

    if (city) parts.push(city);
    if (streetName && streetNumber) {
      parts.push(`${streetName} ${streetNumber}`);
    } else if (streetName) {
      parts.push(streetName);
    }

    if (parts.length > 0) {
      addressInfo = parts.join(", ");
    }
  }

  // Create table row
  const tr = document.createElement("tr");
  tr.setAttribute("data-id", bus.id);
  tr.setAttribute("data-type", bus.vehicleType || "");
  tr.setAttribute("data-transport-type", bus.typeOfTransportation || "Economy");

  tr.innerHTML = `
        <td>${bus.vehicleNo || "N/A"}</td>
        <td>${bus.vehicleType || "N/A"}</td>
        <td>${bus.typeOfTransportation || "Economy"}</td>
        <td>${driverName}</td>
        <td>${bus.countOfSeats || "N/A"}</td>
        <td>${addressInfo}</td>
        <td>
            <div class="table-actions">
                <button class="edit-btn" data-id="${bus.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${bus.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;

  busesTableBody.appendChild(tr);
}

// Add event listeners to bus action buttons
function addBusActionListeners() {
  const editButtons = document.querySelectorAll("#buses-table-body .edit-btn");
  const deleteButtons = document.querySelectorAll(
    "#buses-table-body .delete-btn"
  );

  editButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const busId = btn.getAttribute("data-id");
      showEditBusModal(busId);
    });
  });

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const busId = btn.getAttribute("data-id");
      confirmDeleteBus(busId);
    });
  });
}

// Filter buses
function filterBuses(
  searchTerm = "",
  filterValue = "all",
  transportTypeValue = "all"
) {
  const rows = document.querySelectorAll("#buses-table-body tr");

  rows.forEach((row) => {
    // Skip rows with colspan (like "No buses found")
    if (row.cells.length <= 2) return;

    const vehicleNo = row.cells[0].textContent.toLowerCase();
    const vehicleType = row.cells[1].textContent.toLowerCase();
    const transportType = row.cells[2].textContent.toLowerCase();
    const driverName = row.cells[3].textContent.toLowerCase();

    // Check search term match
    const matchesSearch =
      !searchTerm ||
      vehicleNo.includes(searchTerm) ||
      vehicleType.includes(searchTerm) ||
      transportType.includes(searchTerm) ||
      driverName.includes(searchTerm);

    // Check filter match
    let matchesFilter = true;
    if (filterValue !== "all") {
      const rowType = row.getAttribute("data-type");
      matchesFilter = rowType === filterValue;
    }

    // Check transport type match
    let matchesTransportType = true;
    if (transportTypeValue !== "all") {
      const rowTransportType = row.getAttribute("data-transport-type");
      matchesTransportType = rowTransportType === transportTypeValue;
    }

    // Show/hide row based on matches
    if (matchesSearch && matchesFilter && matchesTransportType) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Show add bus modal
async function showAddBusModal() {
  try {
    // Fetch drivers for the company
    const drivers = await fetchCompanyDrivers();

    let driverOptions = '<option value="">Select Driver</option>';
    drivers.forEach((driver) => {
      driverOptions += `<option value="${driver.id}">${driver.name}</option>`;
    });

    const modalContent = `
            <form id="add-bus-form">
                <div class="form-group">
                    <label for="bus-number">Vehicle Number</label>
                    <input type="text" id="bus-number" placeholder="E.g., BUS-1234" required>
                </div>
                
                <div class="form-group">
                    <label for="bus-type">Vehicle Type</label>
                    <select id="bus-type" required>
                        <option value="">Select Vehicle Type</option>
                        <option value="bus">Bus</option>
                        <option value="car">Car</option>
                        <option value="mini bus">Mini Bus</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="bus-transport-type">Transport Type</label>
                    <select id="bus-transport-type" required>
                        <option value="Economy">Economy</option>
                        <option value="VIP">VIP</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="bus-driver">Driver</label>
                    <select id="bus-driver">
                        ${driverOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="bus-seats">Number of Seats</label>
                    <input type="number" id="bus-seats" min="1" required>
                </div>
                
                <div class="address-details">
                    <h3>Current Location</h3>
                    
                    <div class="form-group">
                        <label for="bus-street-name">Street Name</label>
                        <input type="text" id="bus-street-name">
                    </div>
                    
                    <div class="form-group">
                        <label for="bus-street-number">Street Number</label>
                        <input type="text" id="bus-street-number">
                    </div>
                    
                    <div class="form-group">
                        <label for="bus-city">City</label>
                        <input type="text" id="bus-city">
                    </div>
                    
                    <div class="form-group">
                        <label for="bus-district">District</label>
                        <input type="text" id="bus-district">
                    </div>
                    
                    <div class="form-group">
                        <label for="bus-country">Country</label>
                        <input type="text" id="bus-country">
                    </div>
                    
                    <div class="form-group">
                        <label for="bus-next-to">Next To</label>
                        <input type="text" id="bus-next-to" placeholder="E.g., Near Central Station">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="primary-btn">Add Bus</button>
                </div>
            </form>
        `;

    showModal("Add New Bus", modalContent);

    // Add event listener to the form
    document
      .getElementById("add-bus-form")
      .addEventListener("submit", handleAddBus);
  } catch (error) {
    console.error("Error preparing add bus modal:", error);
    showMessage("Error preparing add bus form", "error");
  }
}

// Show edit bus modal
async function showEditBusModal(busId) {
  try {
    // Fetch bus data
    const doc = await vehiclesRef.doc(busId).get();
    if (!doc.exists) {
      showMessage("Bus not found", "error");
      return;
    }

    const bus = {
      id: doc.id,
      ...doc.data(),
    };

    // Fetch drivers for the company
    const drivers = await fetchCompanyDrivers();

    let driverOptions = '<option value="">Select Driver</option>';
    drivers.forEach((driver) => {
      const selected = driver.id === bus.driverId ? "selected" : "";
      driverOptions += `<option value="${driver.id}" ${selected}>${driver.name}</option>`;
    });

    // Fetch address details
    let address = {
      streetName: "",
      streetNumber: "",
      city: "",
      district: "",
      country: "",
      nextTo: "",
    };

    if (bus.addressId) {
      const addressDoc = await addressesRef.doc(bus.addressId).get();
      if (addressDoc.exists) {
        address = {
          ...address,
          ...addressDoc.data(),
        };
      }
    }

    const modalContent = `
            <form id="edit-bus-form" data-id="${bus.id}" data-address-id="${
      bus.addressId || ""
    }">
                <div class="form-group">
                    <label for="edit-bus-number">Vehicle Number</label>
                    <input type="text" id="edit-bus-number" value="${
                      bus.vehicleNo || ""
                    }" placeholder="E.g., BUS-1234" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-bus-type">Vehicle Type</label>
                    <select id="edit-bus-type" required>
                        <option value="">Select Vehicle Type</option>
                        <option value="bus" ${
                          bus.vehicleType === "bus" ? "selected" : ""
                        }>Bus</option>
                        <option value="car" ${
                          bus.vehicleType === "car" ? "selected" : ""
                        }>Car</option>
                        <option value="mini bus" ${
                          bus.vehicleType === "mini bus" ? "selected" : ""
                        }>Mini Bus</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-bus-transport-type">Transport Type</label>
                    <select id="edit-bus-transport-type" required>
                        <option value="Economy" ${
                          bus.typeOfTransportation === "Economy"
                            ? "selected"
                            : ""
                        }>Economy</option>
                        <option value="VIP" ${
                          bus.typeOfTransportation === "VIP" ? "selected" : ""
                        }>VIP</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-bus-driver">Driver</label>
                    <select id="edit-bus-driver">
                        ${driverOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-bus-seats">Number of Seats</label>
                    <input type="number" id="edit-bus-seats" value="${
                      bus.countOfSeats || ""
                    }" min="1" required>
                </div>
                
                <div class="address-details">
                    <h3>Current Location</h3>
                    
                    <div class="form-group">
                        <label for="edit-bus-street-name">Street Name</label>
                        <input type="text" id="edit-bus-street-name" value="${
                          address.streetName || ""
                        }">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-bus-street-number">Street Number</label>
                        <input type="text" id="edit-bus-street-number" value="${
                          address.streetNumber || ""
                        }">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-bus-city">City</label>
                        <input type="text" id="edit-bus-city" value="${
                          address.city || ""
                        }">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-bus-district">District</label>
                        <input type="text" id="edit-bus-district" value="${
                          address.district || ""
                        }">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-bus-country">Country</label>
                        <input type="text" id="edit-bus-country" value="${
                          address.country || ""
                        }">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-bus-next-to">Next To</label>
                        <input type="text" id="edit-bus-next-to" value="${
                          address.nextTo || ""
                        }" placeholder="E.g., Near Central Station">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="primary-btn">Update Bus</button>
                </div>
            </form>
        `;

    showModal("Edit Bus", modalContent);

    // Add event listener to the form
    document
      .getElementById("edit-bus-form")
      .addEventListener("submit", handleEditBus);
  } catch (error) {
    console.error("Error preparing edit bus modal:", error);
    showMessage("Error preparing edit bus form", "error");
  }
}

// Confirm delete bus
function confirmDeleteBus(busId) {
  const modal = `
        <div class="confirm-dialog">
            <p>Are you sure you want to delete this bus?</p>
            <p class="warning">This action cannot be undone.</p>
            <div class="confirm-actions">
                <button id="confirm-delete-cancel" class="secondary-btn">Cancel</button>
                <button id="confirm-delete-confirm" class="danger-btn">Delete</button>
            </div>
        </div>
    `;

  showModal("Confirm Delete", modal);

  // Add event listeners
  document
    .getElementById("confirm-delete-cancel")
    .addEventListener("click", hideModal);
  document
    .getElementById("confirm-delete-confirm")
    .addEventListener("click", () => {
      deleteBus(busId);
      hideModal();
    });
}

// Fetch company drivers
async function fetchCompanyDrivers() {
  try {
    const snapshot = await driversRef
      .where("companyId", "==", currentCompany.id)
      .get();

    const drivers = [];
    snapshot.forEach((doc) => {
      drivers.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return drivers;
  } catch (error) {
    console.error("Error fetching company drivers:", error);
    return [];
  }
}

// Handle add bus form submission
async function handleAddBus(e) {
  e.preventDefault();

  const numberInput = document.getElementById("bus-number");
  const typeInput = document.getElementById("bus-type");
  const transportTypeInput = document.getElementById("bus-transport-type");
  const driverInput = document.getElementById("bus-driver");
  const seatsInput = document.getElementById("bus-seats");

  // Address inputs
  const streetNameInput = document.getElementById("bus-street-name");
  const streetNumberInput = document.getElementById("bus-street-number");
  const cityInput = document.getElementById("bus-city");
  const districtInput = document.getElementById("bus-district");
  const countryInput = document.getElementById("bus-country");
  const nextToInput = document.getElementById("bus-next-to");

  if (!numberInput || !typeInput || !transportTypeInput || !seatsInput) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    // Create address
    const addressData = {
      latLon: null,
      streetName: streetNameInput ? streetNameInput.value : "",
      streetNumber: streetNumberInput ? streetNumberInput.value : "",
      city: cityInput ? cityInput.value : "",
      district: districtInput ? districtInput.value : "",
      country: countryInput ? countryInput.value : "",
      nextTo: nextToInput ? nextToInput.value : "",
      createdAt: getTimestamp(),
    };

    const addressRef = await addressesRef.add(addressData);

    // Add the id field to the address document
    await addressesRef.doc(addressRef.id).update({
      id: addressRef.id,
    });

    // Create vehicle
    const busData = {
      vehicleNo: numberInput.value,
      vehicleType: typeInput.value, // bus, car, mini bus
      typeOfTransportation: transportTypeInput.value, // Economy or VIP
      driverId: driverInput && driverInput.value ? driverInput.value : "",
      countOfSeats: parseInt(seatsInput.value) || 0,
      addressId: addressRef.id,
      companyId: currentCompany.id,
      createdAt: getTimestamp(),
    };

    const newBusRef = await vehiclesRef.add(busData);

    // Update the vehicle document with its ID
    await vehiclesRef.doc(newBusRef.id).update({
      id: newBusRef.id,
    });

    // Log to console instead of writing to activityLogs
    console.log(
      `Activity: create vehicle ${newBusRef.id} by company ${currentCompany.id}`
    );

    showMessage("Bus added successfully", "success");
    hideModal();

    // Refresh buses list
    fetchBuses();
  } catch (error) {
    console.error("Error adding bus:", error);
    showMessage(`Error adding bus: ${error.message}`, "error");
  }
}

// Handle edit bus form submission
async function handleEditBus(e) {
  e.preventDefault();

  const form = e.target;
  const busId = form.getAttribute("data-id");
  const addressId = form.getAttribute("data-address-id");

  const numberInput = document.getElementById("edit-bus-number");
  const typeInput = document.getElementById("edit-bus-type");
  const transportTypeInput = document.getElementById("edit-bus-transport-type");
  const driverInput = document.getElementById("edit-bus-driver");
  const seatsInput = document.getElementById("edit-bus-seats");

  // Address inputs
  const streetNameInput = document.getElementById("edit-bus-street-name");
  const streetNumberInput = document.getElementById("edit-bus-street-number");
  const cityInput = document.getElementById("edit-bus-city");
  const districtInput = document.getElementById("edit-bus-district");
  const countryInput = document.getElementById("edit-bus-country");
  const nextToInput = document.getElementById("edit-bus-next-to");

  if (!numberInput || !typeInput || !transportTypeInput || !seatsInput) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    // Update or create address
    const addressData = {
      latLon: null,
      streetName: streetNameInput ? streetNameInput.value : "",
      streetNumber: streetNumberInput ? streetNumberInput.value : "",
      city: cityInput ? cityInput.value : "",
      district: districtInput ? districtInput.value : "",
      country: countryInput ? countryInput.value : "",
      nextTo: nextToInput ? nextToInput.value : "",
    };

    let currentAddressId = addressId;
    if (!currentAddressId) {
      // Create new address
      const addressRef = await addressesRef.add(addressData);
      currentAddressId = addressRef.id;

      // Add the id field to the address document
      await addressesRef.doc(currentAddressId).update({
        id: currentAddressId,
      });
    } else {
      // Update existing address
      await addressesRef.doc(currentAddressId).update(addressData);
    }

    // Update bus data
    const busData = {
      vehicleNo: numberInput.value,
      vehicleType: typeInput.value,
      typeOfTransportation: transportTypeInput.value,
      driverId: driverInput && driverInput.value ? driverInput.value : "",
      countOfSeats: parseInt(seatsInput.value) || 0,
      addressId: currentAddressId,
      updatedAt: getTimestamp(),
    };

    await vehiclesRef.doc(busId).update(busData);

    // Check if the id field exists, add it if it doesn't
    const busDoc = await vehiclesRef.doc(busId).get();
    if (busDoc.exists && !busDoc.data().id) {
      await vehiclesRef.doc(busId).update({
        id: busId,
      });
    }

    // Log to console instead of writing to activityLogs
    console.log(
      `Activity: update vehicle ${busId} by company ${currentCompany.id}`
    );

    showMessage("Bus updated successfully", "success");
    hideModal();

    // Refresh buses list
    fetchBuses();
  } catch (error) {
    console.error("Error updating bus:", error);
    showMessage(`Error updating bus: ${error.message}`, "error");
  }
}

// Delete bus
async function deleteBus(busId) {
  try {
    // Get bus data to delete associated address
    const busDoc = await vehiclesRef.doc(busId).get();
    if (!busDoc.exists) {
      showMessage("Bus not found", "error");
      return;
    }

    const busData = busDoc.data();

    // Delete address if exists
    if (busData.addressId) {
      await addressesRef.doc(busData.addressId).delete();
    }

    // Delete bus
    await vehiclesRef.doc(busId).delete();

    // Log to console instead of writing to activityLogs
    console.log(
      `Activity: delete vehicle ${busId} by company ${currentCompany.id}`
    );

    showMessage("Bus deleted successfully", "success");

    // Refresh buses list
    fetchBuses();
  } catch (error) {
    console.error("Error deleting bus:", error);
    showMessage(`Error deleting bus: ${error.message}`, "error");
  }
}

// Check if showModal and hideModal are defined
if (typeof showModal !== "function") {
  console.error(
    "showModal function is not defined. Make sure dashboard.js is loaded before buses.js"
  );

  // Define a fallback showModal function
  window.showModal = function (title, content) {
    console.log("Using fallback showModal function");
    const modal = document.getElementById("modal");
    const modalTitle =
      document.querySelector(".modal-content h2") ||
      document.createElement("h2");
    const modalBody = document.getElementById("modal-body");

    if (!modal || !modalBody) {
      console.error("Modal elements not found in the DOM");
      return;
    }

    // Set modal title
    modalTitle.textContent = title;
    if (!modalTitle.parentNode) {
      const closeBtn = document.querySelector(".modal-content .close-btn");
      if (closeBtn) {
        closeBtn.parentNode.insertBefore(modalTitle, closeBtn.nextSibling);
      }
    }

    // Set modal content
    modalBody.innerHTML = content;

    // Show modal
    modal.classList.remove("hidden");

    // Add event listener to close button
    const closeBtn = document.querySelector(".modal-content .close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        if (typeof hideModal === "function") {
          hideModal();
        } else {
          modal.classList.add("hidden");
        }
      });
    }
  };
}

if (typeof hideModal !== "function") {
  console.error(
    "hideModal function is not defined. Make sure dashboard.js is loaded before buses.js"
  );

  // Define a fallback hideModal function
  window.hideModal = function () {
    console.log("Using fallback hideModal function");
    const modal = document.getElementById("modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  };
}

// Check if showMessage is defined
if (typeof showMessage !== "function") {
  console.error(
    "showMessage function is not defined. Make sure dashboard.js is loaded before buses.js"
  );

  // Define a fallback showMessage function
  window.showMessage = function (message, type = "info") {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create message container if it doesn't exist
    let messageContainer = document.getElementById("message-container");
    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.id = "message-container";
      messageContainer.className = "message-container";
      document.body.appendChild(messageContainer);
    }

    // Create message element
    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;

    // Get icon based on message type
    let icon = "fa-info-circle";
    if (type === "success") icon = "fa-check-circle";
    if (type === "error") icon = "fa-exclamation-circle";
    if (type === "warning") icon = "fa-exclamation-triangle";

    messageElement.innerHTML = `
      <div class="message-content">
        <i class="fas ${icon}"></i>
        <span>${message}</span>
      </div>
      <button class="message-close">&times;</button>
    `;

    // Add to container
    messageContainer.appendChild(messageElement);

    // Add event listener to close button
    const closeBtn = messageElement.querySelector(".message-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        messageElement.remove();
      });
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  };
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("Buses.js: DOM content loaded");

  // Check if we're on the dashboard page
  const busesSection = document.getElementById("buses-section");
  if (busesSection) {
    console.log("Buses section found in DOM");

    // Check if currentCompany is available
    if (currentCompany) {
      console.log("Current company available, loading buses");
      loadBuses();
    } else {
      console.error("Current company not available on DOMContentLoaded");

      // Try to get company from localStorage
      try {
        const companyData = localStorage.getItem("currentCompany");
        if (companyData) {
          window.currentCompany = JSON.parse(companyData);
          console.log(
            "Restored currentCompany from localStorage:",
            window.currentCompany
          );
          loadBuses();
        }
      } catch (error) {
        console.error("Error restoring company data from localStorage:", error);
      }
    }
  } else {
    console.log("Buses section not found in DOM, might be on a different page");
  }
});

// Also check if the document is already loaded
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log("Document already loaded, checking buses section");

  // Check if we're on the dashboard page with the buses section visible
  const busesSection = document.getElementById("buses-section");
  const dashboardContent = document.querySelector(".dashboard-content");

  if (
    busesSection &&
    dashboardContent &&
    !busesSection.classList.contains("hidden")
  ) {
    console.log("Buses section is visible, loading buses");

    // Check if currentCompany is available
    if (currentCompany) {
      console.log("Current company available, loading buses");
      loadBuses();
    } else {
      console.error("Current company not available on document ready check");
    }
  }
}

// Function to ensure bus data has the correct structure
async function ensureBusStructure(busData, docId) {
  const updates = {};
  let needsUpdate = false;

  // Check for required fields and set default values if missing
  if (!busData.id) {
    updates.id = docId;
    needsUpdate = true;
  }

  if (
    !busData.vehicleType ||
    (busData.vehicleType !== "bus" &&
      busData.vehicleType !== "car" &&
      busData.vehicleType !== "mini bus")
  ) {
    // Convert old values to new format if needed
    if (busData.vehicleType === "Bus") {
      updates.vehicleType = "bus";
      needsUpdate = true;
    } else if (
      busData.vehicleType === "Shuttle" ||
      busData.vehicleType === "Minibus"
    ) {
      updates.vehicleType = "mini bus";
      needsUpdate = true;
    } else if (!busData.vehicleType) {
      updates.vehicleType = "bus"; // Default value
      needsUpdate = true;
    }
  }

  if (
    !busData.typeOfTransportation ||
    (busData.typeOfTransportation !== "Economy" &&
      busData.typeOfTransportation !== "VIP")
  ) {
    updates.typeOfTransportation = "Economy"; // Default value
    needsUpdate = true;
  }

  if (busData.driverId === undefined) {
    updates.driverId = "";
    needsUpdate = true;
  }

  if (busData.countOfSeats === undefined) {
    updates.countOfSeats = 0;
    needsUpdate = true;
  }

  if (busData.companyId === undefined && currentCompany) {
    updates.companyId = currentCompany.id;
    needsUpdate = true;
  }

  // Apply updates if needed
  if (needsUpdate) {
    try {
      console.log(`Updating bus ${docId} to match required structure`, updates);
      await vehiclesRef.doc(docId).update(updates);

      // Update the local data
      Object.assign(busData, updates);
    } catch (error) {
      console.error(`Error updating bus structure for ${docId}:`, error);
    }
  }
}
