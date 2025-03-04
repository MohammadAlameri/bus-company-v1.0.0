// Initialize buses section
function loadBuses() {
  if (!currentCompany) return;

  // Update buses section content
  const busesSection = document.getElementById("buses-section");
  if (!busesSection) return;

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
                    <option value="Bus">Bus</option>
                    <option value="Shuttle">Shuttle</option>
                    <option value="Minibus">Minibus</option>
                </select>
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="buses-table">
                <thead>
                    <tr>
                        <th>Vehicle No</th>
                        <th>Type</th>
                        <th>Driver</th>
                        <th>Seats</th>
                        <th>Address</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="buses-table-body">
                    <tr>
                        <td colspan="6" style="text-align: center;">Loading buses...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

  // Add event listener to add bus button
  const addBusBtn = document.getElementById("add-bus-btn");
  if (addBusBtn) {
    addBusBtn.addEventListener("click", showAddBusModal);
  }

  // Add event listener to search input
  const busSearch = document.getElementById("bus-search");
  if (busSearch) {
    busSearch.addEventListener("input", () => {
      const searchTerm = busSearch.value.toLowerCase();
      filterBuses(searchTerm);
    });
  }

  // Add event listener to filter select
  const busFilter = document.getElementById("bus-filter");
  if (busFilter) {
    busFilter.addEventListener("change", () => {
      const filterValue = busFilter.value;
      const searchTerm = busSearch ? busSearch.value.toLowerCase() : "";
      filterBuses(searchTerm, filterValue);
    });
  }

  // Fetch buses
  fetchBuses();
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

    // Query buses/vehicles for this company
    const snapshot = await vehiclesRef
      .where("companyId", "==", currentCompany.id)
      .orderBy("createdAt", "desc")
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

    const promises = [];

    snapshot.forEach((doc) => {
      const busData = {
        id: doc.id,
        ...doc.data(),
      };

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

    showMessage("Error loading buses data: " + error.message, "error");
  }
}

// Get driver details
async function getDriverDetails(driverId) {
  try {
    if (!driverId) return null;

    const doc = await driversRef.doc(driverId).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting driver details:", error);
    return null;
  }
}

// Get address details
async function getAddressDetails(addressId) {
  try {
    if (!addressId) return null;

    const doc = await addressesRef.doc(addressId).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting address details:", error);
    return null;
  }
}

// Add bus to table
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

  tr.innerHTML = `
        <td>${bus.vehicleNo || "N/A"}</td>
        <td>${bus.vehicleType || "N/A"}</td>
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
  // Edit buttons
  const editButtons = document.querySelectorAll("#buses-table .edit-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const busId = button.getAttribute("data-id");
      showEditBusModal(busId);
    });
  });

  // Delete buttons
  const deleteButtons = document.querySelectorAll("#buses-table .delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const busId = button.getAttribute("data-id");
      confirmDeleteBus(busId);
    });
  });
}

// Filter buses
function filterBuses(searchTerm = "", filterValue = "all") {
  const rows = document.querySelectorAll("#buses-table-body tr");

  rows.forEach((row) => {
    // Skip rows with colspan (like "No buses found")
    if (row.cells.length <= 2) return;

    const vehicleNo = row.cells[0].textContent.toLowerCase();
    const vehicleType = row.cells[1].textContent.toLowerCase();
    const driverName = row.cells[2].textContent.toLowerCase();

    // Check search term match
    const matchesSearch =
      !searchTerm ||
      vehicleNo.includes(searchTerm) ||
      vehicleType.includes(searchTerm) ||
      driverName.includes(searchTerm);

    // Check filter match
    let matchesFilter = true;
    if (filterValue !== "all") {
      const rowType = row.getAttribute("data-type");
      matchesFilter = rowType === filterValue;
    }

    // Show/hide row based on matches
    if (matchesSearch && matchesFilter) {
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
                        <option value="Bus">Bus</option>
                        <option value="Shuttle">Shuttle</option>
                        <option value="Minibus">Minibus</option>
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
                    
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="bus-city">City</label>
                            <input type="text" id="bus-city">
                        </div>
                        
                        <div class="form-group half">
                            <label for="bus-district">District</label>
                            <input type="text" id="bus-district">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="bus-country">Country</label>
                        <input type="text" id="bus-country">
                    </div>
                    
                    <div class="form-group">
                        <label for="bus-next-to">Next To</label>
                        <input type="text" id="bus-next-to" placeholder="Landmark or nearby location">
                    </div>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="primary-btn">Add Bus</button>
                </div>
            </form>
        `;

    showModal("Add New Bus", modalContent);

    // Add form submit event listener
    const form = document.getElementById("add-bus-form");
    if (form) {
      form.addEventListener("submit", handleAddBus);
    }
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
                        <option value="Bus" ${
                          bus.vehicleType === "Bus" ? "selected" : ""
                        }>Bus</option>
                        <option value="Shuttle" ${
                          bus.vehicleType === "Shuttle" ? "selected" : ""
                        }>Shuttle</option>
                        <option value="Minibus" ${
                          bus.vehicleType === "Minibus" ? "selected" : ""
                        }>Minibus</option>
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
                    
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="edit-bus-city">City</label>
                            <input type="text" id="edit-bus-city" value="${
                              address.city || ""
                            }">
                        </div>
                        
                        <div class="form-group half">
                            <label for="edit-bus-district">District</label>
                            <input type="text" id="edit-bus-district" value="${
                              address.district || ""
                            }">
                        </div>
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
                        }" placeholder="Landmark or nearby location">
                    </div>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="primary-btn">Update Bus</button>
                </div>
            </form>
        `;

    showModal("Edit Bus", modalContent);

    // Add form submit event listener
    const form = document.getElementById("edit-bus-form");
    if (form) {
      form.addEventListener("submit", handleEditBus);
    }
  } catch (error) {
    console.error("Error fetching bus details:", error);
    showMessage("Error loading bus details", "error");
  }
}

// Confirm delete bus
function confirmDeleteBus(busId) {
  const modalContent = `
        <p>Are you sure you want to delete this bus?</p>
        <p>This action cannot be undone.</p>
        
        <div class="form-footer">
            <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
            <button type="button" class="danger-btn" onclick="deleteBus('${busId}')">Delete</button>
        </div>
    `;

  showModal("Confirm Delete", modalContent);
}

// Fetch company drivers
async function fetchCompanyDrivers() {
  try {
    const snapshot = await driversRef
      .where("companyId", "==", currentCompany.id)
      .orderBy("name")
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
  const driverInput = document.getElementById("bus-driver");
  const seatsInput = document.getElementById("bus-seats");

  // Address inputs
  const streetNameInput = document.getElementById("bus-street-name");
  const streetNumberInput = document.getElementById("bus-street-number");
  const cityInput = document.getElementById("bus-city");
  const districtInput = document.getElementById("bus-district");
  const countryInput = document.getElementById("bus-country");
  const nextToInput = document.getElementById("bus-next-to");

  if (!numberInput || !typeInput || !seatsInput) {
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
    };

    const addressRef = await addressesRef.add(addressData);

    // Create vehicle
    const busData = {
      vehicleNo: numberInput.value,
      vehicleType: typeInput.value,
      driverId: driverInput && driverInput.value ? driverInput.value : null,
      countOfSeats: parseInt(seatsInput.value) || 0,
      addressId: addressRef.id,
      companyId: currentCompany.id,
      createdAt: getTimestamp(),
    };

    const newBusRef = await vehiclesRef.add(busData);

    // Log activity
    await logActivity("create", "vehicle", newBusRef.id);

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
  const driverInput = document.getElementById("edit-bus-driver");
  const seatsInput = document.getElementById("edit-bus-seats");

  // Address inputs
  const streetNameInput = document.getElementById("edit-bus-street-name");
  const streetNumberInput = document.getElementById("edit-bus-street-number");
  const cityInput = document.getElementById("edit-bus-city");
  const districtInput = document.getElementById("edit-bus-district");
  const countryInput = document.getElementById("edit-bus-country");
  const nextToInput = document.getElementById("edit-bus-next-to");

  if (!numberInput || !typeInput || !seatsInput) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    // Update or create address
    let currentAddressId = addressId;

    const addressData = {
      latLon: null,
      streetName: streetNameInput ? streetNameInput.value : "",
      streetNumber: streetNumberInput ? streetNumberInput.value : "",
      city: cityInput ? cityInput.value : "",
      district: districtInput ? districtInput.value : "",
      country: countryInput ? countryInput.value : "",
      nextTo: nextToInput ? nextToInput.value : "",
    };

    if (currentAddressId) {
      // Update existing address
      await addressesRef.doc(currentAddressId).update(addressData);
    } else {
      // Create new address
      const addressRef = await addressesRef.add(addressData);
      currentAddressId = addressRef.id;
    }

    // Update vehicle
    const busData = {
      vehicleNo: numberInput.value,
      vehicleType: typeInput.value,
      driverId: driverInput && driverInput.value ? driverInput.value : null,
      countOfSeats: parseInt(seatsInput.value) || 0,
      addressId: currentAddressId,
    };

    await vehiclesRef.doc(busId).update(busData);

    // Log activity
    await logActivity("update", "vehicle", busId);

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
    // Check for existing trips for this bus
    const tripsSnapshot = await tripsRef.where("vehicleId", "==", busId).get();

    if (!tripsSnapshot.empty) {
      showMessage("Cannot delete bus with existing trips", "error");
      hideModal();
      return;
    }

    // Get bus details to find addressId
    const busDoc = await vehiclesRef.doc(busId).get();
    if (!busDoc.exists) {
      showMessage("Bus not found", "error");
      hideModal();
      return;
    }

    const busData = busDoc.data();
    const addressId = busData.addressId;

    // Delete bus
    await vehiclesRef.doc(busId).delete();

    // Delete address if exists
    if (addressId) {
      await addressesRef.doc(addressId).delete();
    }

    // Log activity
    await logActivity("delete", "vehicle", busId);

    showMessage("Bus deleted successfully", "success");
    hideModal();

    // Refresh buses list
    fetchBuses();
  } catch (error) {
    console.error("Error deleting bus:", error);
    showMessage(`Error deleting bus: ${error.message}`, "error");
  }
}

// Add styles for the buses section
const busStyles = document.createElement("style");
busStyles.textContent = `
    .address-details {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid var(--light-gray);
    }
    
    .address-details h3 {
        margin-bottom: 15px;
        font-size: 16px;
        color: var(--darkest-gray);
    }
`;
document.head.appendChild(busStyles);
