// Initialize all required functions at the start of the file
// Make sure we have all required helper functions
console.log("Initializing drivers.js...");

// Ensure helper functions are available
ensureTimestampFunction();
ensureModalFunctions();

// Check if Firestore references are available
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded in drivers.js");
  // Check if Firebase and Firestore are initialized
  if (!firebase || !firebase.firestore) {
    console.error("Firebase or Firestore not initialized");
    return;
  }

  // Check if collection references are available
  if (!driversRef || !addressesRef) {
    console.error("Firestore collection references not available");
    return;
  }

  // Check if currentCompany is loaded
  console.log("currentCompany:", currentCompany ? "Loaded" : "Not loaded");

  // Add a listener for the "Add Driver" button
  const addDriverBtn = document.getElementById("add-driver-btn");
  if (addDriverBtn) {
    console.log("Adding click listener to Add Driver button");
    // Remove any existing listeners
    const newBtn = addDriverBtn.cloneNode(true);
    addDriverBtn.parentNode.replaceChild(newBtn, addDriverBtn);

    // Add the event listener
    newBtn.addEventListener("click", function () {
      console.log("Add Driver button clicked");
      showAddDriverModal();
    });
  } else {
    console.log("Add Driver button not found in the DOM yet");
  }
});

// Initialize drivers section
function loadDrivers() {
  console.log("Loading drivers module");

  // Check if currentCompany is defined
  if (!currentCompany) {
    console.error("Error: currentCompany is not defined");
    showMessage(
      "Error: No company profile found. Please log in again.",
      "error"
    );
    return;
  }

  const driversSection = document.getElementById("drivers-section");
  if (!driversSection) {
    console.error("Error: drivers-section element not found");
    return;
  }

  // Update drivers section content
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
  console.log("Showing add driver modal");
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
        <label for="driver-image">Profile Image</label>
        <input type="file" id="driver-image" accept="image/*" class="file-input">
        <div class="file-input-preview" id="driver-image-preview">
          <span>No image selected</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="driver-license-no">License Number</label>
        <input type="text" id="driver-license-no" required>
      </div>
      
      <div class="form-group">
        <label for="driver-license-url">License Document</label>
        <input type="file" id="driver-license-url" accept="image/*,.pdf" class="file-input">
        <div class="file-input-preview" id="driver-license-url-preview">
          <span>No document selected</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="driver-nationality-no">Nationality ID</label>
        <input type="text" id="driver-nationality-no">
      </div>
      
      <div class="form-group">
        <label for="driver-nationality-url">Nationality Document</label>
        <input type="file" id="driver-nationality-url" accept="image/*,.pdf" class="file-input">
        <div class="file-input-preview" id="driver-nationality-url-preview">
          <span>No document selected</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="driver-passport-no">Passport Number</label>
        <input type="text" id="driver-passport-no">
      </div>
      
      <div class="form-group">
        <label for="driver-passport-url">Passport Document</label>
        <input type="file" id="driver-passport-url" accept="image/*,.pdf" class="file-input">
        <div class="file-input-preview" id="driver-passport-url-preview">
          <span>No document selected</span>
        </div>
      </div>
      
      <div class="form-footer">
        <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
        <button type="button" id="add-driver-submit-btn" class="primary-btn">Add Driver</button>
      </div>
    </form>
  `;

  showModal("Add New Driver", modalContent);

  // Get the form and submit button
  const form = document.getElementById("add-driver-form");
  const submitBtn = document.getElementById("add-driver-submit-btn");

  if (form && submitBtn) {
    console.log("Form and submit button found, attaching event listeners");

    // Add click event to the submit button to manually trigger form submission
    submitBtn.addEventListener("click", function () {
      console.log("Submit button clicked, calling handleAddDriver");
      // Create a synthetic submit event
      const event = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });

      // Prevent the default form submission
      event.preventDefault = function () {
        console.log("Prevented default form submission");
      };

      // Call the handler directly
      handleAddDriver(event);
    });
  } else {
    console.error("Form or submit button not found");
  }

  // Add event listeners for file inputs
  setupFileInputPreviews("driver-image");
  setupFileInputPreviews("driver-license-url");
  setupFileInputPreviews("driver-nationality-url");
  setupFileInputPreviews("driver-passport-url");
}

// Setup file input preview functionality
function setupFileInputPreviews(inputId) {
  const fileInput = document.getElementById(inputId);
  const previewDiv = document.getElementById(`${inputId}-preview`);

  if (fileInput && previewDiv) {
    fileInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const file = this.files[0];

        // Check if it's an image
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();

          reader.onload = function (e) {
            previewDiv.innerHTML = `
              <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px;">
              <span>${file.name}</span>
            `;
          };

          reader.readAsDataURL(file);
        } else {
          // For non-image files (like PDFs)
          previewDiv.innerHTML = `
            <i class="fas fa-file-pdf"></i>
            <span>${file.name}</span>
          `;
        }
      } else {
        previewDiv.innerHTML = `<span>No file selected</span>`;
      }
    });
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
            <form id="edit-driver-form" data-driver-id="${driver.id}">
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
                    <label for="edit-driver-image">Profile Image</label>
                    <input type="file" id="edit-driver-image" accept="image/*" class="file-input">
                    <div class="file-input-preview" id="edit-driver-image-preview">
                        <span>No image selected</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-license-no">License Number</label>
                    <input type="text" id="edit-driver-license-no" value="${
                      driver.licenseNo || ""
                    }" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-license-url">License Document</label>
                    <input type="file" id="edit-driver-license-url" accept="image/*,.pdf" class="file-input">
                    <div class="file-input-preview" id="edit-driver-license-url-preview">
                        <span>No document selected</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-nationality-no">Nationality ID</label>
                    <input type="text" id="edit-driver-nationality-no" value="${
                      driver.nationalityNo || ""
                    }">
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-nationality-url">Nationality Document</label>
                    <input type="file" id="edit-driver-nationality-url" accept="image/*,.pdf" class="file-input">
                    <div class="file-input-preview" id="edit-driver-nationality-url-preview">
                        <span>No document selected</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-passport-no">Passport Number</label>
                    <input type="text" id="edit-driver-passport-no" value="${
                      driver.passportNo || ""
                    }">
                </div>
                
                <div class="form-group">
                    <label for="edit-driver-passport-url">Passport Document</label>
                    <input type="file" id="edit-driver-passport-url" accept="image/*,.pdf" class="file-input">
                    <div class="file-input-preview" id="edit-driver-passport-url-preview">
                        <span>No document selected</span>
                    </div>
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

    // Set up the file input previews
    setupFileInputPreviews("edit-driver-image");
    setupFileInputPreviews("edit-driver-license-url");
    setupFileInputPreviews("edit-driver-nationality-url");
    setupFileInputPreviews("edit-driver-passport-url");

    // Display existing image previews if available
    displayExistingImagePreview(
      "edit-driver-image-preview",
      "Driver profile image"
    );
    displayExistingImagePreview(
      "edit-driver-license-url-preview",
      "License document"
    );
    displayExistingImagePreview(
      "edit-driver-nationality-url-preview",
      "Nationality document"
    );
    displayExistingImagePreview(
      "edit-driver-passport-url-preview",
      "Passport document"
    );
  } catch (error) {
    console.error("Error fetching driver details:", error);
    showMessage("Error loading driver details", "error");
  }
}

// Function to display a placeholder for existing documents
function displayExistingImagePreview(previewId, documentType) {
  const previewDiv = document.getElementById(previewId);
  if (previewDiv) {
    previewDiv.innerHTML = `
      <div class="existing-document">
        <i class="fas fa-file-image"></i>
        <span>${documentType} (placeholder)</span>
        <small>New selection will replace this</small>
      </div>
    `;
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
  console.log("handleAddDriver called");

  try {
    console.log("Starting to collect form data");
    const name = document.getElementById("driver-name").value;
    const email = document.getElementById("driver-email").value;
    const phone = document.getElementById("driver-phone").value;
    const gender = document.getElementById("driver-gender").value;
    const dob = document.getElementById("driver-dob").value;
    const bio = document.getElementById("driver-bio").value;
    // Always use empty string for image URLs regardless of file input
    const imageURL = ""; // Empty string instead of the actual file
    const licenseNo = document.getElementById("driver-license-no").value;
    const licenseURL = ""; // Empty string instead of the actual file
    const nationalityNo = document.getElementById(
      "driver-nationality-no"
    ).value;
    const nationalityURL = ""; // Empty string instead of the actual file
    const passportNo = document.getElementById("driver-passport-no").value;
    const passportURL = ""; // Empty string instead of the actual file

    console.log("Form data collected", { name, email, phone, gender, dob });

    // Validate phone number format
    const phoneRegex = /^(78|77|70|71|73)\d{7}$/;
    if (!phoneRegex.test(phone)) {
      console.log("Phone validation failed", phone);
      showMessage(
        "Phone number must start with 78, 77, 70, 71, or 73 and be 9 digits in total.",
        "error"
      );
      return;
    }

    console.log("Phone validation passed");

    // Create address
    console.log("Creating address document");
    const addressData = {
      latLon: null,
      streetName: "",
      streetNumber: "",
      city: "",
      district: "",
      country: "",
      nextTo: "",
      createdAt: getTimestamp(),
    };

    console.log("Adding address to Firestore");
    const addressRef = await addressesRef.add(addressData);
    console.log("Address added with ID:", addressRef.id);

    // Add the id field to the address document
    await addressesRef.doc(addressRef.id).update({
      id: addressRef.id,
    });
    console.log("Address updated with ID field");

    // Create driver
    console.log("Creating driver document");
    const driverData = {
      id: null, // Will be set after document creation
      name,
      email,
      phoneNumber: phone,
      gender,
      dateOfBirth: dob,
      bio,
      imageURL,
      licenseNo: licenseNo,
      licenseURL,
      nationalityNo: nationalityNo,
      nationalityURL,
      passportNo: passportNo,
      passportURL,
      addressId: addressRef.id,
      companyId: currentCompany ? currentCompany.id : null,
      createdAt: getTimestamp(),
      lastLoginAt: getTimestamp(),
      authProvider: "company_created",
    };

    if (!currentCompany) {
      console.error("Error: currentCompany is null");
      showMessage(
        "Error: No company profile found. Please log in again.",
        "error"
      );
      return;
    }

    console.log("Adding driver to Firestore");
    const newDriverRef = await driversRef.add(driverData);
    console.log("Driver added with ID:", newDriverRef.id);

    // Update the driver document with its ID
    await driversRef.doc(newDriverRef.id).update({
      id: newDriverRef.id,
    });
    console.log("Driver updated with ID field");

    // Log activity
    await logActivity("create", "driver", newDriverRef.id);
    console.log("Activity logged");

    showMessage("Driver added successfully", "success");
    hideModal();
    console.log("Modal hidden");

    // Refresh drivers list
    console.log("Refreshing drivers list");
    fetchDrivers();
  } catch (error) {
    console.error("Error adding driver:", error);
    showMessage(`Error adding driver: ${error.message}`, "error");
  }
}

// Handle edit driver form submission
async function handleEditDriver(e) {
  e.preventDefault();
  const driverId = e.target.getAttribute("data-driver-id");
  showLoadingIndicator();

  try {
    const name = document.getElementById("edit-driver-name").value;
    const email = document.getElementById("edit-driver-email").value;
    const phone = document.getElementById("edit-driver-phone").value;
    const gender = document.getElementById("edit-driver-gender").value;
    const dob = document.getElementById("edit-driver-dob").value;
    const bio = document.getElementById("edit-driver-bio").value;
    // Always use empty string for image URLs regardless of file input
    const imageURL = ""; // Empty string instead of the actual file
    const licenseNo = document.getElementById("edit-driver-license-no").value;
    const licenseURL = ""; // Empty string instead of the actual file
    const nationalityNo = document.getElementById(
      "edit-driver-nationality-no"
    ).value;
    const nationalityURL = ""; // Empty string instead of the actual file
    const passportNo = document.getElementById("edit-driver-passport-no").value;
    const passportURL = ""; // Empty string instead of the actual file

    // Validate phone number format
    const phoneRegex = /^(78|77|70|71|73)\d{7}$/;
    if (!phoneRegex.test(phone)) {
      hideLoadingIndicator();
      showNotification(
        "Phone number must start with 78, 77, 70, 71, or 73 and be 9 digits in total.",
        "error"
      );
      return;
    }

    // Update driver
    const driverData = {
      name,
      email,
      phoneNumber: phone,
      gender,
      dateOfBirth: dob,
      bio,
      imageURL,
      licenseNo: licenseNo,
      licenseURL,
      nationalityNo: nationalityNo,
      nationalityURL,
      passportNo: passportNo,
      passportURL,
      updatedAt: getTimestamp(),
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

// Add these functions if they don't exist
function showLoadingIndicator() {
  console.log("Loading indicator shown");
  // Create loading indicator if it doesn't exist
  let loader = document.getElementById("loading-indicator");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loading-indicator";
    loader.className = "loading-indicator";
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = "flex";
}

function hideLoadingIndicator() {
  console.log("Loading indicator hidden");
  const loader = document.getElementById("loading-indicator");
  if (loader) {
    loader.style.display = "none";
  }
}

// Add loading indicator styles
const loaderStyles = document.createElement("style");
loaderStyles.textContent = `
  .loading-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(loaderStyles);

// Function to display messages if not already defined
function showMessage(message, type = "info") {
  console.log(`Showing message: ${message} (${type})`);

  // Create message element
  const messageEl = document.createElement("div");
  messageEl.className = `message ${type}`;
  messageEl.textContent = message;

  // Add to body
  document.body.appendChild(messageEl);

  // Remove after 3 seconds
  setTimeout(() => {
    messageEl.classList.add("hiding");
    setTimeout(() => {
      document.body.removeChild(messageEl);
    }, 500);
  }, 3000);
}

// Function to show notification if not already defined
function showNotification(message, type = "info") {
  console.log(`Showing notification: ${message} (${type})`);
  showMessage(message, type);
}

// Helper functions
// Fallback for getTimestamp if it's not defined in firebase-config.js
function ensureTimestampFunction() {
  // Check if getTimestamp is already defined
  if (typeof getTimestamp === "function") {
    console.log("Using existing getTimestamp function");
    return;
  }

  console.log("Creating fallback getTimestamp function");
  // Define a fallback getTimestamp function
  window.getTimestamp = function () {
    console.log("Using fallback getTimestamp");
    return firebase.firestore.FieldValue.serverTimestamp();
  };
}

// Call this at the beginning of the file, before any function that needs getTimestamp
ensureTimestampFunction();

// Modal functions if not defined elsewhere
// Check if showModal and hideModal exist and create them if not
function ensureModalFunctions() {
  if (typeof showModal !== "function") {
    console.log("Creating showModal function");
    window.showModal = function (title, content) {
      console.log(`Showing modal: ${title}`);
      const modal = document.getElementById("modal");
      if (!modal) {
        console.error("Modal element not found");
        return;
      }

      const modalTitle = document.createElement("h3");
      modalTitle.className = "modal-title";
      modalTitle.textContent = title;

      const modalBody = document.getElementById("modal-body");
      if (!modalBody) {
        console.error("Modal body element not found");
        return;
      }

      modalBody.innerHTML = "";
      modalBody.appendChild(modalTitle);
      modalBody.insertAdjacentHTML("beforeend", content);

      modal.classList.remove("hidden");

      // Add event listener to close button
      const closeBtn = modal.querySelector(".close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", hideModal);
      }
    };
  }

  if (typeof hideModal !== "function") {
    console.log("Creating hideModal function");
    window.hideModal = function () {
      console.log("Hiding modal");
      const modal = document.getElementById("modal");
      if (!modal) {
        console.error("Modal element not found");
        return;
      }

      modal.classList.add("hidden");
    };
  }
}

// Call this at the beginning of the file
ensureModalFunctions();
