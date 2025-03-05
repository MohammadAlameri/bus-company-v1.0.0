// Initialize drivers section
function loadDrivers() {
  if (!currentCompany) return;

  // Update drivers section content
  const driversSection = document.getElementById("drivers-section");
  if (!driversSection) return;

  driversSection.innerHTML = `
        <div class="section-header">
            <h2>Drivers Management</h2>
            <div class="section-actions">
                <button id="refresh-drivers-btn" class="refresh-btn secondary-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button id="add-driver-btn" class="primary-btn">Add Driver</button>
            </div>
        </div>
        
        <div class="search-filter">
            <div class="search-input">
                <i class="fas fa-search"></i>
                <input type="text" id="driver-search" placeholder="Search drivers...">
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="drivers-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="drivers-table-body">
                    <tr>
                        <td colspan="7" style="text-align: center;">Loading drivers...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

  // Add event listeners to add driver button
  const addDriverBtn = document.getElementById("add-driver-btn");
  if (addDriverBtn) {
    addDriverBtn.addEventListener("click", showAddDriverModal);
  }

  // Add event listener to refresh drivers button
  const refreshDriversBtn = document.getElementById("refresh-drivers-btn");
  if (refreshDriversBtn) {
    refreshDriversBtn.addEventListener("click", () => {
      showMessage("Refreshing drivers data...", "info");
      fetchDrivers();
    });
  }

  // Add event listener to search input
  const driverSearch = document.getElementById("driver-search");
  if (driverSearch) {
    driverSearch.addEventListener("input", () => {
      const searchTerm = driverSearch.value.toLowerCase();
      filterDrivers(searchTerm);
    });
  }

  // Fetch drivers
  fetchDrivers();
}

// Fetch drivers
async function fetchDrivers() {
  try {
    const driversTableBody = document.getElementById("drivers-table-body");
    if (!driversTableBody) return;

    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error("Current company information not available");
      driversTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Error: Company information not available. Please try logging out and back in.</td>
                </tr>
            `;
      return;
    }

    console.log("Fetching drivers for company ID:", currentCompany.id);

    // Query drivers for this company - without using a composite index
    const snapshot = await driversRef
      .where("companyId", "==", currentCompany.id)
      .get();

    if (snapshot.empty) {
      driversTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">No drivers found</td>
                </tr>
            `;
      return;
    }

    // Create table rows
    driversTableBody.innerHTML = "";

    // Sort the drivers by name manually (client-side sorting)
    const drivers = [];
    snapshot.forEach((doc) => {
      drivers.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by name
    drivers.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Add each driver to the table
    drivers.forEach((driverData) => {
      addDriverToTable(driverData);
    });

    // Add event listeners to edit and delete buttons
    addDriverActionListeners();
  } catch (error) {
    console.error("Error fetching drivers:", error);

    const driversTableBody = document.getElementById("drivers-table-body");
    if (driversTableBody) {
      driversTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Error loading driver data: ${error.message}</td>
                </tr>
            `;
    }

    showMessage("Error loading driver data: " + error.message, "error");
  }
}

// Add driver to table
function addDriverToTable(driver) {
  const driversTableBody = document.getElementById("drivers-table-body");
  if (!driversTableBody) return;

  // Calculate age
  let age = "";
  if (driver.dateOfBirth) {
    const birthDate = driver.dateOfBirth.toDate
      ? driver.dateOfBirth.toDate()
      : new Date(driver.dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Create table row
  const tr = document.createElement("tr");
  tr.setAttribute("data-id", driver.id);
  tr.innerHTML = `
        <td>
            <div class="driver-img">
                <img src="${
                  driver.imageURL || "https://via.placeholder.com/40"
                }" alt="${driver.name}">
            </div>
        </td>
        <td>${driver.name}</td>
        <td>${driver.phoneNumber}</td>
        <td>${driver.email}</td>
        <td>${driver.gender || "-"}</td>
        <td>${age || "-"}</td>
        <td>
            <div class="table-actions">
                <button class="edit-btn" data-id="${driver.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${driver.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;

  driversTableBody.appendChild(tr);
}

// Add event listeners to driver action buttons
function addDriverActionListeners() {
  // Edit buttons
  const editButtons = document.querySelectorAll(".edit-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const driverId = button.getAttribute("data-id");
      showEditDriverModal(driverId);
    });
  });

  // Delete buttons
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const driverId = button.getAttribute("data-id");
      confirmDeleteDriver(driverId);
    });
  });
}

// Filter drivers
function filterDrivers(searchTerm) {
  const rows = document.querySelectorAll("#drivers-table-body tr");

  rows.forEach((row) => {
    const name = row.cells[1].textContent.toLowerCase();
    const phone = row.cells[2].textContent.toLowerCase();
    const email = row.cells[3].textContent.toLowerCase();

    if (
      name.includes(searchTerm) ||
      phone.includes(searchTerm) ||
      email.includes(searchTerm)
    ) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Show add driver modal
function showAddDriverModal() {
  const modalContent = `
        <form id="add-driver-form">
            <div class="form-group">
                <label for="driver-name">Name</label>
                <input type="text" id="driver-name" required>
            </div>
            
            <div class="form-group">
                <label for="driver-email">Email</label>
                <input type="email" id="driver-email" required>
            </div>
            
            <div class="form-group">
                <label for="driver-phone">Phone Number</label>
                <input type="tel" id="driver-phone" required>
            </div>
            
            <div class="form-group">
                <label for="driver-gender">Gender</label>
                <select id="driver-gender" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="driver-dob">Date of Birth</label>
                <input type="date" id="driver-dob" required>
            </div>
            
            <div class="form-group">
                <label for="driver-bio">Bio</label>
                <textarea id="driver-bio" rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label for="driver-image">Profile Image URL</label>
                <input type="url" id="driver-image">
            </div>
            
            <div class="form-group">
                <label for="driver-license-no">License Number</label>
                <input type="text" id="driver-license-no" required>
            </div>
            
            <div class="form-group">
                <label for="driver-license-url">License Document URL</label>
                <input type="url" id="driver-license-url">
            </div>
            
            <div class="form-group">
                <label for="driver-nationality-no">Nationality ID</label>
                <input type="text" id="driver-nationality-no">
            </div>
            
            <div class="form-group">
                <label for="driver-nationality-url">Nationality Document URL</label>
                <input type="url" id="driver-nationality-url">
            </div>
            
            <div class="form-group">
                <label for="driver-passport-no">Passport Number</label>
                <input type="text" id="driver-passport-no">
            </div>
            
            <div class="form-group">
                <label for="driver-passport-url">Passport Document URL</label>
                <input type="url" id="driver-passport-url">
            </div>
            
            <div class="form-footer">
                <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                <button type="submit" class="primary-btn">Add Driver</button>
            </div>
        </form>
    `;

  showModal("Add New Driver", modalContent);

  // Add form submit event listener
  const form = document.getElementById("add-driver-form");
  if (form) {
    form.addEventListener("submit", handleAddDriver);
  }
}

// Show edit driver modal
async function showEditDriverModal(driverId) {
  try {
    // Fetch driver data
    const doc = await driversRef.doc(driverId).get();
    if (!doc.exists) {
      showMessage("Driver not found", "error");
      return;
    }

    const driver = {
      id: doc.id,
      ...doc.data(),
    };

    // Format date of birth
    let dobValue = "";
    if (driver.dateOfBirth) {
      const date = driver.dateOfBirth.toDate
        ? driver.dateOfBirth.toDate()
        : new Date(driver.dateOfBirth);
      dobValue = date.toISOString().split("T")[0];
    }

    const modalContent = `
            <form id="edit-driver-form" data-id="${driver.id}">
                <div class="form-group">
                    <label for="edit-driver-name">Name</label>
                    <input type="text" id="edit-driver-name" value="${
                      driver.name || ""
                    }" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-email">Email</label>
                    <input type="email" id="edit-driver-email" value="${
                      driver.email || ""
                    }" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-phone">Phone Number</label>
                    <input type="tel" id="edit-driver-phone" value="${
                      driver.phoneNumber || ""
                    }" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-gender">Gender</label>
                    <select id="edit-driver-gender" required>
                        <option value="">Select Gender</option>
                        <option value="Male" ${
                          driver.gender === "Male" ? "selected" : ""
                        }>Male</option>
                        <option value="Female" ${
                          driver.gender === "Female" ? "selected" : ""
                        }>Female</option>
                        <option value="Other" ${
                          driver.gender === "Other" ? "selected" : ""
                        }>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-dob">Date of Birth</label>
                    <input type="date" id="edit-driver-dob" value="${dobValue}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-bio">Bio</label>
                    <textarea id="edit-driver-bio" rows="3">${
                      driver.bio || ""
                    }</textarea>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-image">Profile Image URL</label>
                    <input type="url" id="edit-driver-image" value="${
                      driver.imageURL || ""
                    }">
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-license-no">License Number</label>
                    <input type="text" id="edit-driver-license-no" value="${
                      driver.licenseNo || ""
                    }" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-license-url">License Document URL</label>
                    <input type="url" id="edit-driver-license-url" value="${
                      driver.licenseURL || ""
                    }">
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-nationality-no">Nationality ID</label>
                    <input type="text" id="edit-driver-nationality-no" value="${
                      driver.nationalityNo || ""
                    }">
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-nationality-url">Nationality Document URL</label>
                    <input type="url" id="edit-driver-nationality-url" value="${
                      driver.nationalityURL || ""
                    }">
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-passport-no">Passport Number</label>
                    <input type="text" id="edit-driver-passport-no" value="${
                      driver.passportNo || ""
                    }">
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-passport-url">Passport Document URL</label>
                    <input type="url" id="edit-driver-passport-url" value="${
                      driver.passportURL || ""
                    }">
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="primary-btn">Update Driver</button>
                </div>
            </form>
        `;

    showModal("Edit Driver", modalContent);

    // Add form submit event listener
    const form = document.getElementById("edit-driver-form");
    if (form) {
      form.addEventListener("submit", handleEditDriver);
    }
  } catch (error) {
    console.error("Error fetching driver details:", error);
    showMessage("Error loading driver details", "error");
  }
}

// Confirm delete driver
function confirmDeleteDriver(driverId) {
  const modalContent = `
        <p>Are you sure you want to delete this driver?</p>
        <p>This action cannot be undone.</p>
        
        <div class="form-footer">
            <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
            <button type="button" class="danger-btn" onclick="deleteDriver('${driverId}')">Delete</button>
        </div>
    `;

  showModal("Confirm Delete", modalContent);
}

// Handle add driver form submission
async function handleAddDriver(e) {
  e.preventDefault();

  const nameInput = document.getElementById("driver-name");
  const emailInput = document.getElementById("driver-email");
  const phoneInput = document.getElementById("driver-phone");
  const genderInput = document.getElementById("driver-gender");
  const dobInput = document.getElementById("driver-dob");
  const bioInput = document.getElementById("driver-bio");
  const imageInput = document.getElementById("driver-image");
  const licenseNoInput = document.getElementById("driver-license-no");
  const licenseUrlInput = document.getElementById("driver-license-url");
  const nationalityNoInput = document.getElementById("driver-nationality-no");
  const nationalityUrlInput = document.getElementById("driver-nationality-url");
  const passportNoInput = document.getElementById("driver-passport-no");
  const passportUrlInput = document.getElementById("driver-passport-url");

  // Validate required fields
  if (
    !nameInput ||
    !emailInput ||
    !phoneInput ||
    !genderInput ||
    !dobInput ||
    !licenseNoInput
  ) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  // Validate phone number format (starts with 78,77,70,71,73 and has 9 digits total)
  const phoneRegex = /^(78|77|70|71|73)\d{7}$/;
  if (!phoneRegex.test(phoneInput.value)) {
    showMessage(
      "Phone number must start with 78, 77, 70, 71, or 73 and be 9 digits long",
      "error"
    );
    return;
  }

  try {
    // Create address
    const addressRef = await addressesRef.add({
      latLon: null,
      streetName: "",
      streetNumber: "",
      city: "",
      district: "",
      country: "",
      nextTo: "",
    });

    // Create driver
    const driverData = {
      name: nameInput.value,
      email: emailInput.value,
      phoneNumber: phoneInput.value,
      gender: genderInput.value,
      dateOfBirth: new Date(dobInput.value),
      bio: bioInput.value || "",
      imageURL: imageInput.value || "",
      licenseNo: licenseNoInput.value,
      licenseURL: licenseUrlInput.value || "",
      nationalityNo: nationalityNoInput.value || "",
      nationalityURL: nationalityUrlInput.value || "",
      passportNo: passportNoInput.value || "",
      passportURL: passportUrlInput.value || "",
      addressId: addressRef.id,
      companyId: currentCompany.id,
      createdAt: getTimestamp(),
      lastLoginAt: getTimestamp(),
      authProvider: "company_created",
    };

    const newDriverRef = await driversRef.add(driverData);

    // Log activity
    await logActivity("create", "driver", newDriverRef.id);

    showMessage("Driver added successfully", "success");
    hideModal();

    // Refresh drivers list
    fetchDrivers();
  } catch (error) {
    console.error("Error adding driver:", error);
    showMessage(`Error adding driver: ${error.message}`, "error");
  }
}

// Handle edit driver form submission
async function handleEditDriver(e) {
  e.preventDefault();

  const form = e.target;
  const driverId = form.getAttribute("data-id");

  const nameInput = document.getElementById("edit-driver-name");
  const emailInput = document.getElementById("edit-driver-email");
  const phoneInput = document.getElementById("edit-driver-phone");
  const genderInput = document.getElementById("edit-driver-gender");
  const dobInput = document.getElementById("edit-driver-dob");
  const bioInput = document.getElementById("edit-driver-bio");
  const imageInput = document.getElementById("edit-driver-image");
  const licenseNoInput = document.getElementById("edit-driver-license-no");
  const licenseUrlInput = document.getElementById("edit-driver-license-url");
  const nationalityNoInput = document.getElementById(
    "edit-driver-nationality-no"
  );
  const nationalityUrlInput = document.getElementById(
    "edit-driver-nationality-url"
  );
  const passportNoInput = document.getElementById("edit-driver-passport-no");
  const passportUrlInput = document.getElementById("edit-driver-passport-url");

  if (
    !nameInput ||
    !emailInput ||
    !phoneInput ||
    !genderInput ||
    !dobInput ||
    !licenseNoInput
  ) {
    showMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    // Update driver
    const driverData = {
      name: nameInput.value,
      email: emailInput.value,
      phoneNumber: phoneInput.value,
      gender: genderInput.value,
      dateOfBirth: new Date(dobInput.value),
      bio: bioInput.value,
      imageURL: imageInput.value,
      licenseNo: licenseNoInput.value,
      licenseURL: licenseUrlInput.value,
      nationalityNo: nationalityNoInput.value,
      nationalityURL: nationalityUrlInput.value,
      passportNo: passportNoInput.value,
      passportURL: passportUrlInput.value,
    };

    await driversRef.doc(driverId).update(driverData);

    // Log activity
    await logActivity("update", "driver", driverId);

    showMessage("Driver updated successfully", "success");
    hideModal();

    // Refresh drivers list
    fetchDrivers();
  } catch (error) {
    console.error("Error updating driver:", error);
    showMessage(`Error updating driver: ${error.message}`, "error");
  }
}

// Delete driver
async function deleteDriver(driverId) {
  try {
    // Get driver details to find addressId
    const driverDoc = await driversRef.doc(driverId).get();
    if (!driverDoc.exists) {
      showMessage("Driver not found", "error");
      hideModal();
      return;
    }

    const driverData = driverDoc.data();
    const addressId = driverData.addressId;

    // Delete driver
    await driversRef.doc(driverId).delete();

    // Delete address if exists
    if (addressId) {
      await addressesRef.doc(addressId).delete();
    }

    // Log activity
    await logActivity("delete", "driver", driverId);

    showMessage("Driver deleted successfully", "success");
    hideModal();

    // Refresh drivers list
    fetchDrivers();
  } catch (error) {
    console.error("Error deleting driver:", error);
    showMessage(`Error deleting driver: ${error.message}`, "error");
  }
}

// Add styles for the drivers section
const driverStyles = document.createElement("style");
driverStyles.textContent = `
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    
    .section-header .primary-btn {
        width: auto;
    }
    
    .search-filter {
        margin-bottom: 20px;
    }
    
    .search-input {
        display: flex;
        align-items: center;
        background-color: var(--light-color);
        border-radius: 4px;
        padding: 8px 15px;
        width: 300px;
    }
    
    .search-input i {
        color: var(--dark-gray);
        margin-right: 10px;
    }
    
    .search-input input {
        border: none;
        background-color: transparent;
        flex: 1;
        font-size: 16px;
    }
    
    .search-input input:focus {
        outline: none;
    }
    
    .driver-img img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--light-gray);
        border-radius: 4px;
        font-size: 16px;
    }
    
    .form-group textarea {
        resize: vertical;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary-color);
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
document.head.appendChild(driverStyles);
