// Initialize company profile section
function loadCompanyProfile() {
  if (!currentCompany) return;

  // Fetch address data if addressId exists
  let addressDisplay = "No address information available";

  const loadAddress = async () => {
    if (currentCompany.addressId) {
      try {
        const addressDoc = await addressesRef
          .doc(currentCompany.addressId)
          .get();
        if (addressDoc.exists) {
          const address = addressDoc.data();
          const addressParts = [];

          if (address.streetName) {
            addressParts.push(
              address.streetName +
                (address.streetNumber ? " " + address.streetNumber : "")
            );
          }

          if (address.district) addressParts.push(address.district);
          if (address.city) addressParts.push(address.city);
          if (address.country) addressParts.push(address.country);

          if (address.nextTo) {
            addressParts.push("Next to: " + address.nextTo);
          }

          addressDisplay =
            addressParts.join(", ") || "Address details incomplete";

          // Update the address display if the element exists
          const addressValueEl = document.querySelector(
            '.detail-value[data-address="true"]'
          );
          if (addressValueEl) {
            addressValueEl.textContent = addressDisplay;
          }
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }
    }
  };

  // Update company profile section content
  const companyProfileSection = document.getElementById(
    "company-profile-section"
  );
  if (!companyProfileSection) return;

  companyProfileSection.innerHTML = `
    <div class="profile-header">
      <div class="company-profile-image">
        <img id="company-image" src="${
          currentCompany.imageURL || "img/placeholder-company.jpg"
        }" alt="${currentCompany.name}" class="profile-image">
        <button type="button" class="change-image-btn" title="Change Image">
          <i class="fas fa-camera"></i>
        </button>
      </div>
      <div class="profile-info">
        <h2>${currentCompany.name}</h2>
        <p class="company-email">${currentCompany.email || ""}</p>
        <p class="company-phone">${currentCompany.phoneNumber || ""}</p>
        <div class="rating">
          <i class="fas fa-star"></i>
          <span>${currentCompany.rate || 0} (${
    currentCompany.reviewCount || 0
  } reviews)</span>
        </div>
      </div>
      <button id="edit-profile-btn" class="primary-btn">Edit Profile</button>
    </div>
    <div class="profile-details">
      <div class="detail-section">
        <h4>Company Information</h4>
        <div class="detail-item">
          <div class="detail-label">Bank Account</div>
          <div class="detail-value">${
            currentCompany.banckAccountNo || "Not set"
          }</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Bio</div>
          <div class="detail-value">${
            currentCompany.bio || "No bio available"
          }</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Address Information</h4>
        <div class="detail-item">
          <div class="detail-label">Current Address</div>
          <div class="detail-value" data-address="true">${addressDisplay}</div>
        </div>
        <div class="edit-address-btn-container">
          <button onclick="showEditAddressModal()" class="secondary-btn">Edit Address</button>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Account Information</h4>
        <div class="detail-item">
          <div class="detail-label">Account Created</div>
          <div class="detail-value">${
            currentCompany.createdAt
              ? formatDate(currentCompany.createdAt)
              : "Unknown"
          }</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Last Login</div>
          <div class="detail-value">${
            currentCompany.lastLoginAt
              ? formatDate(currentCompany.lastLoginAt)
              : "Unknown"
          }</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Authentication Provider</div>
          <div class="detail-value">${
            currentCompany.authProvider || "Email"
          }</div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  const editProfileBtn = document.getElementById("edit-profile-btn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", showEditProfileModal);
  }

  // Load address data
  loadAddress();

  // Add this at the end of the function
  setupCompanyImageUpload();
}

// Format date for display
function formatDate(timestamp) {
  if (!timestamp) return "Unknown";

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

// Show edit profile modal
function showEditProfileModal() {
  if (!currentCompany) return;

  const modalContent = `
    <form id="edit-company-form">
      <div class="form-section-heading">
        <h4>Company Details</h4>
        <p>Update your company information visible to users</p>
      </div>
      
      <div class="form-group">
        <label for="edit-company-name">Company Name <span class="required">*</span></label>
        <input type="text" id="edit-company-name" value="${
          currentCompany.name || ""
        }" required>
      </div>
      
      <div class="form-group">
        <label for="edit-company-phone">Phone Number</label>
        <input type="tel" id="edit-company-phone" value="${
          currentCompany.phoneNumber || ""
        }" placeholder="78xxxxxxx">
      </div>
      
      <div class="form-section-heading">
        <h4>Financial Information</h4>
        <p>Update your banking details for financial transactions</p>
      </div>
      
      <div class="form-group">
        <label for="edit-company-bank">Bank Account Number</label>
        <div class="input-with-icon">
          <input type="text" id="edit-company-bank" value="${
            currentCompany.banckAccountNo || ""
          }" placeholder="Enter your bank account number">
          <i class="fas fa-university"></i>
        </div>
      </div>
      
      <div class="form-section-heading">
        <h4>Company Description</h4>
      </div>
      
      <div class="form-group">
        <label for="edit-company-bio">Bio</label>
        <textarea id="edit-company-bio" rows="3" placeholder="Describe your company in a few sentences">${
          currentCompany.bio || ""
        }</textarea>
      </div>
      
      <div class="form-group">
        <label for="edit-company-image">Company Image</label>
        <input type="file" id="edit-company-image" accept="image/*" class="file-input">
        <div class="file-input-preview" id="edit-company-image-preview">
          <img src="${
            currentCompany.imageURL || "img/placeholder-company.jpg"
          }" alt="Company Image" style="max-width: 100%; max-height: 150px;">
          <span>Current image preview (Will be stored as an empty string)</span>
        </div>
      </div>
      
      <div class="form-footer">
        <button type="button" class="cancel-btn" onclick="hideModal()">
          <i class="fas fa-times"></i> Cancel
        </button>
        <button type="submit" class="save-btn">
          <i class="fas fa-save"></i> Save Changes
        </button>
      </div>
    </form>
  `;

  showModal("Edit Company Profile", modalContent);

  // Add event listeners
  const form = document.getElementById("edit-company-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      updateCompanyProfile();
    });

    // Add input validation for bank account number
    const bankAccountInput = document.getElementById("edit-company-bank");
    if (bankAccountInput) {
      bankAccountInput.addEventListener("input", function () {
        const value = this.value.trim();
        const bankAccountRegex = /^[0-9]{8,20}$/;

        // Update validation styling
        if (value === "" || bankAccountRegex.test(value)) {
          this.classList.remove("invalid-input");
          this.classList.add("valid-input");
        } else {
          this.classList.remove("valid-input");
          this.classList.add("invalid-input");
        }
      });
    }
  }

  // Set up file input preview
  setupFileInputPreviews("edit-company-image");

  // Add custom styling for the enhanced form
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    .form-section-heading {
      margin: 20px 0 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .form-section-heading h4 {
      margin-bottom: 5px;
      color: #333;
    }
    
    .form-section-heading p {
      margin: 0;
      font-size: 13px;
      color: #6c757d;
    }
    
    .required {
      color: #dc3545;
    }
    
    .input-with-icon {
      position: relative;
    }
    
    .input-with-icon input {
      padding-right: 35px;
      width: 100%;
    }
    
    .input-with-icon i {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
    }
    
    .valid-input {
      border-color: #28a745 !important;
      background-color: #f7fff9 !important;
    }
    
    .invalid-input {
      border-color: #dc3545 !important;
      background-color: #fff8f8 !important;
    }
    
    .cancel-btn {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .cancel-btn:hover {
      background-color: #e9ecef;
    }
    
    .save-btn {
      background-color: #4a6cf7;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .save-btn:hover {
      background-color: #3a5bd7;
    }
  `;
  document.head.appendChild(styleElement);
}

// Update company profile
async function updateCompanyProfile() {
  showLoadingIndicator();

  try {
    // Check if company data is loaded
    if (!currentCompany || !currentCompany.id) {
      throw new Error("Company data is not loaded. Please refresh the page.");
    }

    const name = document.getElementById("edit-company-name").value.trim();
    const phoneNumber = document
      .getElementById("edit-company-phone")
      .value.trim();
    const bankAccount = document
      .getElementById("edit-company-bank")
      .value.trim();
    const bio = document.getElementById("edit-company-bio").value.trim();

    // Always use empty string for imageURL if not changed
    const imageURL = currentCompany.imageURL || "";

    // Validate inputs
    if (!name) {
      hideLoadingIndicator();
      showMessage("Company name cannot be empty", "error");
      return;
    }

    // Validate phone number
    const phoneRegex = /^(78|77|70|71|73)\d{7}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      hideLoadingIndicator();
      showMessage(
        "Phone number must start with 78, 77, 70, 71, or 73 and be 9 digits in total.",
        "error"
      );
      return;
    }

    // Validate bank account (optional validation - adjust as needed)
    // This is a simple validation for demonstration - modify based on your requirements
    const bankAccountRegex = /^[0-9]{8,20}$/;
    if (bankAccount && !bankAccountRegex.test(bankAccount)) {
      hideLoadingIndicator();
      showMessage(
        "Bank account number should be between 8-20 digits with numbers only.",
        "error"
      );
      return;
    }

    console.log("Updating company profile with ID:", currentCompany.id);

    // Create the update object with only fields that are being updated
    const updateData = {
      name,
      phoneNumber,
      banckAccountNo: bankAccount,
      bio,
      imageURL,
      updatedAt: getTimestamp(),
    };

    // Ensure ID field is set correctly
    if (!currentCompany.id) {
      console.error("Missing company ID for update");
      throw new Error("Company ID is missing");
    }

    // Update company in Firestore
    try {
      await companiesRef.doc(currentCompany.id).update(updateData);
      console.log("Company profile updated successfully in Firestore");

      // Make sure the ID field is set
      await companiesRef.doc(currentCompany.id).update({
        id: currentCompany.id,
      });
    } catch (firestoreError) {
      console.error("Firestore update error:", firestoreError);
      throw new Error(`Database error: ${firestoreError.message}`);
    }

    // Update the currentCompany object
    currentCompany.name = name;
    currentCompany.phoneNumber = phoneNumber;
    currentCompany.banckAccountNo = bankAccount;
    currentCompany.bio = bio;
    currentCompany.imageURL = imageURL;

    // Update the stored company data
    setCurrentCompany(currentCompany);

    // Show success message
    hideLoadingIndicator();
    showMessage("Company profile updated successfully", "success");

    // Update the UI
    loadCompanyProfile();
  } catch (error) {
    console.error("Error updating company profile:", error);
    hideLoadingIndicator();
    showMessage(`Error updating company profile: ${error.message}`, "error");
  }
}

// Show edit address modal
function showEditAddressModal() {
  // Fetch company address data
  let addressData = {
    streetName: "",
    streetNumber: "",
    city: "",
    district: "",
    country: "",
    nextTo: "",
    latLon: null,
  };

  // Show loading indicator in the modal
  showModal(
    "Edit Company Address",
    `<div class="loading-indicator">Loading address data...</div>`
  );

  // If company has addressId, fetch address data
  const fetchAddress = async () => {
    if (currentCompany.addressId) {
      try {
        const doc = await addressesRef.doc(currentCompany.addressId).get();
        if (doc.exists) {
          addressData = { ...addressData, ...doc.data() };
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        showMessage("Error loading address data", "error");
      }
    }

    // Now display the form with data loaded
    showAddressForm(addressData);
  };

  // Start fetching the address
  fetchAddress();
}

// Display the address form with pre-filled data
function showAddressForm(addressData) {
  const modalContent = `
    <div class="edit-address-form">
      <div class="form-section-heading">
        <h4>Location Details</h4>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="edit-company-street-name">Street Name <span class="required">*</span></label>
          <input type="text" id="edit-company-street-name" placeholder="Main Street" value="${
            addressData.streetName || ""
          }" required>
        </div>
        <div class="form-group">
          <label for="edit-company-street-number">Building/House Number</label>
          <input type="text" id="edit-company-street-number" placeholder="123" value="${
            addressData.streetNumber || ""
          }">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="edit-company-city">City <span class="required">*</span></label>
          <input type="text" id="edit-company-city" placeholder="City Name" value="${
            addressData.city || ""
          }" required>
        </div>
        <div class="form-group">
          <label for="edit-company-district">District</label>
          <input type="text" id="edit-company-district" placeholder="District Name" value="${
            addressData.district || ""
          }">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="edit-company-country">Country <span class="required">*</span></label>
          <select id="edit-company-country" required>
            <option value="" disabled ${
              !addressData.country ? "selected" : ""
            }>Select country</option>
            <option value="JO" ${
              addressData.country === "JO" ? "selected" : ""
            }>Jordan</option>
            <option value="PS" ${
              addressData.country === "PS" ? "selected" : ""
            }>Palestine</option>
            <option value="SA" ${
              addressData.country === "SA" ? "selected" : ""
            }>Saudi Arabia</option>
            <option value="AE" ${
              addressData.country === "AE" ? "selected" : ""
            }>United Arab Emirates</option>
            <option value="QA" ${
              addressData.country === "QA" ? "selected" : ""
            }>Qatar</option>
            <option value="KW" ${
              addressData.country === "KW" ? "selected" : ""
            }>Kuwait</option>
            <option value="BH" ${
              addressData.country === "BH" ? "selected" : ""
            }>Bahrain</option>
            <option value="OM" ${
              addressData.country === "OM" ? "selected" : ""
            }>Oman</option>
            <option value="YE" ${
              addressData.country === "YE" ? "selected" : ""
            }>Yemen</option>
          </select>
        </div>
        <div class="form-group">
          <label for="edit-company-next-to">Landmark</label>
          <input type="text" id="edit-company-next-to" placeholder="Near Central Bank" value="${
            addressData.nextTo || ""
          }">
        </div>
      </div>
      
      <div class="form-section-heading">
        <h4>Map Location <span class="required">*</span></h4>
      </div>
      
      <div class="map-section">
        <div id="address-map" class="address-map"></div>
        
        <div class="map-controls">
          <button type="button" id="get-location-btn" class="location-btn">
            <i class="fas fa-map-marker-alt"></i> Use My Current Location
          </button>
          
          <div class="coordinates-display">
            <span id="lat-lng-display" class="${
              addressData.latLon ? "has-coordinates" : "no-coordinates"
            }">
              ${
                addressData.latLon
                  ? `<i class="fas fa-check-circle"></i> Coordinates set: ${addressData.latLon.latitude.toFixed(
                      6
                    )}, ${addressData.latLon.longitude.toFixed(6)}`
                  : '<i class="fas fa-exclamation-circle"></i> No location selected'
              }
            </span>
          </div>
        </div>
      </div>
      
      <div class="form-footer">
        <button type="button" class="danger-btn" onclick="hideModal()">
          <i class="fas fa-times"></i> Cancel
        </button>
        <button type="button" class="primary-btn" id="save-address-btn">
          <i class="fas fa-save"></i> Save Address
        </button>
      </div>
    </div>
  `;

  // Update the modal content
  document.querySelector(".modal-content").innerHTML = modalContent;
  document.querySelector(".modal-title").textContent = "Edit Company Address";

  // Add custom styles to improve the form appearance
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    .edit-address-form {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 15px;
    }
    
    .form-section-heading {
      margin: 20px 0 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .form-section-heading h4 {
      margin-bottom: 5px;
      color: #333;
    }
    
    .form-row {
      display: flex;
      flex-wrap: wrap;
      margin: 0 -10px;
    }
    
    .form-group {
      flex: 1;
      min-width: 250px;
      padding: 0 10px;
      margin-bottom: 20px;
    }
    
    .address-map {
      width: 100%;
      height: 300px;
      border: 1px solid #ccc;
      border-radius: 5px;
      margin-bottom: 15px;
    }
    
    .map-controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .location-btn {
      padding: 8px 16px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    
    .location-btn:hover {
      background-color: var(--primary-dark);
    }
    
    .coordinates-display {
      flex: 1;
      padding: 8px 12px;
      background-color: #f9f9f9;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      font-size: 14px;
      min-width: 250px;
    }
    
    .has-coordinates {
      color: var(--success-color);
      font-weight: 500;
    }
    
    .no-coordinates {
      color: var(--danger-color);
      font-weight: 500;
    }

    .required {
      color: var(--danger-color);
      margin-left: 3px;
    }
    
    @media (max-width: 768px) {
      .form-group {
        min-width: 100%;
      }
      
      .map-controls {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .coordinates-display {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(styleElement);

  // Initialize the map
  if (
    typeof google !== "undefined" &&
    typeof google.maps !== "undefined" &&
    google.maps.Map
  ) {
    setTimeout(() => {
      initializeAddressMap(addressData.latLon);
    }, 500);
  } else {
    console.error("Google Maps API is not loaded.");
    document.getElementById("address-map").innerHTML =
      "<div class='map-error'>Google Maps API failed to load. Please refresh the page.</div>";
  }

  // Add click event for the "Use My Current Location" button
  document
    .getElementById("get-location-btn")
    .addEventListener("click", getCurrentLocation);

  // Add click event for the save button
  document
    .getElementById("save-address-btn")
    .addEventListener("click", validateAndUpdateAddress);
}

// Function to validate form fields before saving
function validateAndUpdateAddress() {
  const streetName = document
    .getElementById("edit-company-street-name")
    .value.trim();
  const city = document.getElementById("edit-company-city").value.trim();
  const countrySelect = document.getElementById("edit-company-country");
  const country = countrySelect.value;
  const latLngDisplay = document.getElementById("lat-lng-display");
  const hasCoordinates = latLngDisplay.classList.contains("has-coordinates");

  // Visual validation feedback
  let isValid = true;

  // Check street name
  if (!streetName) {
    highlightInvalidField("edit-company-street-name");
    isValid = false;
  } else {
    resetFieldValidation("edit-company-street-name");
  }

  // Check city
  if (!city) {
    highlightInvalidField("edit-company-city");
    isValid = false;
  } else {
    resetFieldValidation("edit-company-city");
  }

  // Check country
  if (!country) {
    highlightInvalidField("edit-company-country");
    isValid = false;
  } else {
    resetFieldValidation("edit-company-country");
  }

  // Check map coordinates
  if (!hasCoordinates) {
    document.querySelector(".coordinates-display").style.animation =
      "shake 0.5s";
    document.querySelector(".address-map").style.borderColor = "#dc3545";
    showMessage("Please select a location on the map", "error");
    isValid = false;
  } else {
    document.querySelector(".coordinates-display").style.animation = "";
    document.querySelector(".address-map").style.borderColor = "#ccc";
  }

  if (isValid) {
    // Disable the save button to prevent multiple submissions
    const saveButton = document.getElementById("save-address-btn");
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    // Process the form
    updateCompanyAddress();
  } else {
    showMessage("Please complete all required fields marked with *", "error");

    // Add animation keyframes if they don't exist
    if (!document.getElementById("validation-animations")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "validation-animations";
      styleSheet.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }
}

// Helper function to highlight invalid fields
function highlightInvalidField(fieldId) {
  const field = document.getElementById(fieldId);
  field.style.borderColor = "#dc3545";
  field.style.backgroundColor = "#fff8f8";

  // Add a small animation to draw attention
  field.style.animation = "shake 0.5s";
  setTimeout(() => {
    field.style.animation = "";
  }, 500);
}

// Helper function to reset field validation
function resetFieldValidation(fieldId) {
  const field = document.getElementById(fieldId);
  field.style.borderColor = "";
  field.style.backgroundColor = "";
}

// Initialize map for address selection with improved user experience
function initializeAddressMap(latLng) {
  if (!latLng) {
    latLng = { latitude: 15.3694, longitude: 44.191 }; // Default to Sana'a, Yemen
  }

  const mapOptions = {
    center: { lat: latLng.latitude, lng: latLng.longitude },
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: "greedy", // Improves mobile map interaction
  };

  const map = new google.maps.Map(
    document.getElementById("address-map"),
    mapOptions
  );

  // Add marker with animation
  let marker = new google.maps.Marker({
    position: { lat: latLng.latitude, lng: latLng.longitude },
    map: map,
    draggable: true,
    animation: google.maps.Animation.DROP,
    title: "Drag me to your location",
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      scaledSize: new google.maps.Size(40, 40),
    },
  });

  // Add info window with instructions
  const infoWindow = new google.maps.InfoWindow({
    content:
      "<div class='map-info-window'>Drag this marker to set your exact location</div>",
  });

  // Show info window briefly
  infoWindow.open(map, marker);
  setTimeout(() => infoWindow.close(), 3000);

  // Update coordinates when marker is dragged
  google.maps.event.addListener(marker, "dragend", function () {
    const position = marker.getPosition();
    const newLatLng = {
      latitude: position.lat(),
      longitude: position.lng(),
    };

    // Animate marker to bounce briefly to draw attention
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => marker.setAnimation(null), 750);

    updateLatLngDisplay(newLatLng);

    // Try to get address from coordinates (reverse geocoding)
    tryReverseGeocode(position.lat(), position.lng());
  });

  // Add click listener to map to set the marker location
  google.maps.event.addListener(map, "click", function (event) {
    const clickedLocation = event.latLng;
    marker.setPosition(clickedLocation);
    map.panTo(clickedLocation);

    const newLatLng = {
      latitude: clickedLocation.lat(),
      longitude: clickedLocation.lng(),
    };

    // Animate marker
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => marker.setAnimation(null), 750);

    updateLatLngDisplay(newLatLng);

    // Try to get address from coordinates
    tryReverseGeocode(clickedLocation.lat(), clickedLocation.lng());
  });

  // Add CSS for info window
  const mapStyle = document.createElement("style");
  mapStyle.textContent = `
    .map-info-window {
      padding: 5px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
    .gm-style-iw {
      padding: 10px;
    }
  `;
  document.head.appendChild(mapStyle);

  // Make map responsive - redraw when window is resized
  window.addEventListener("resize", function () {
    google.maps.event.trigger(map, "resize");
    map.setCenter({ lat: latLng.latitude, lng: latLng.longitude });
  });

  return map;
}

// Try to get address from coordinates (reverse geocoding)
async function tryReverseGeocode(lat, lng) {
  try {
    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({ location: latLng }, function (results, status) {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        updateAddressFieldsFromPlace(results[0]);

        // Provide visual feedback that address fields have been updated
        const addressFields = document.querySelectorAll(
          ".edit-address-form input, .edit-address-form select"
        );
        addressFields.forEach((field) => {
          if (field.value && field.value.trim() !== "") {
            field.classList.add("field-updated");
            setTimeout(() => {
              field.classList.remove("field-updated");
            }, 1500);
          }
        });
      }
    });
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
  }
}

// Update address fields from a Google Maps place result
function updateAddressFieldsFromPlace(place) {
  if (!place || !place.address_components) return;

  // Create a map for the components
  const componentMap = {};

  for (const component of place.address_components) {
    const types = component.types;

    // Map component types to field IDs
    if (types.includes("route")) {
      componentMap.streetName = component.long_name;
    } else if (types.includes("street_number")) {
      componentMap.streetNumber = component.long_name;
    } else if (types.includes("locality") || types.includes("postal_town")) {
      componentMap.city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      componentMap.district = component.long_name;
    } else if (types.includes("country")) {
      componentMap.country = component.short_name;
      componentMap.countryName = component.long_name;
    }
  }

  // Fill in form fields if we have the data
  if (componentMap.streetName) {
    document.getElementById("edit-company-street-name").value =
      componentMap.streetName;
  }

  if (componentMap.streetNumber) {
    document.getElementById("edit-company-street-number").value =
      componentMap.streetNumber;
  }

  if (componentMap.city) {
    document.getElementById("edit-company-city").value = componentMap.city;
  }

  if (componentMap.district) {
    document.getElementById("edit-company-district").value =
      componentMap.district;
  }

  // Handle country dropdown
  if (componentMap.country) {
    const countrySelect = document.getElementById("edit-company-country");
    const countryOptions = Array.from(countrySelect.options);

    // First try to match by country code
    const matchingOption = countryOptions.find(
      (option) => option.value === componentMap.country
    );

    if (matchingOption) {
      countrySelect.value = matchingOption.value;
    } else {
      // If no match by code, try matching by name (for non-standard country codes)
      const nameMatch = countryOptions.find((option) =>
        option.text
          .toLowerCase()
          .includes(componentMap.countryName.toLowerCase())
      );

      if (nameMatch) {
        countrySelect.value = nameMatch.value;
      }
    }
  }

  // Add a style for the field updated effect if it doesn't exist
  if (!document.getElementById("field-updated-style")) {
    const style = document.createElement("style");
    style.id = "field-updated-style";
    style.textContent = `
      @keyframes fieldUpdated {
        0% { background-color: #ffffff; }
        50% { background-color: #e3f2fd; }
        100% { background-color: #ffffff; }
      }
      .field-updated {
        animation: fieldUpdated 1.5s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

// Update the lat-lng display with better styling
function updateLatLngDisplay(latLng) {
  const display = document.getElementById("lat-lng-display");
  if (display) {
    display.innerHTML = `<i class="fas fa-check-circle"></i> Coordinates set: ${latLng.latitude.toFixed(
      6
    )}, ${latLng.longitude.toFixed(6)}`;
    display.className = "has-coordinates";

    // Add animation to show the change
    display.style.animation = "pulse 0.5s";
    setTimeout(() => {
      display.style.animation = "";
    }, 500);
  }

  // Store the selected coordinates in a hidden field for form submission
  let hiddenField = document.getElementById("selected-coordinates");
  if (!hiddenField) {
    hiddenField = document.createElement("input");
    hiddenField.type = "hidden";
    hiddenField.id = "selected-coordinates";
    document.querySelector(".edit-address-form").appendChild(hiddenField);
  }
  hiddenField.value = JSON.stringify(latLng);
}

// Get current location for address map
function getCurrentLocation() {
  if (navigator.geolocation) {
    // Show loading indicator
    const locationBtn = document.getElementById("get-location-btn");
    locationBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Getting location...';
    locationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const currentLocation = { lat: latitude, lng: longitude };
        const latLng = { latitude, longitude };

        // Get the map and update it
        const mapElement = document.getElementById("address-map");
        if (mapElement && typeof google !== "undefined" && google.maps) {
          // The map instance is not directly accessible, so we need to recreate it
          // This is a workaround since we can't access the existing map instance
          const mapOptions = {
            center: currentLocation,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
          };

          const map = new google.maps.Map(mapElement, mapOptions);

          // Create a new marker
          const marker = new google.maps.Marker({
            position: currentLocation,
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            title: "Your location",
          });

          // Add listeners to the marker
          google.maps.event.addListener(marker, "dragend", function () {
            const position = marker.getPosition();
            const newLatLng = {
              latitude: position.lat(),
              longitude: position.lng(),
            };
            updateLatLngDisplay(newLatLng);
            tryReverseGeocode(position.lat(), position.lng());
          });

          // Try to get address information from the coordinates
          tryReverseGeocode(latitude, longitude);
        }

        // Update the display with the coordinates
        updateLatLngDisplay(latLng);

        // Reset button
        locationBtn.innerHTML =
          '<i class="fas fa-map-marker-alt"></i> Use My Current Location';
        locationBtn.disabled = false;

        showMessage("Location updated successfully", "success");
      },
      // Error callback
      (error) => {
        console.error("Error getting current location:", error);

        // Reset button
        locationBtn.innerHTML =
          '<i class="fas fa-map-marker-alt"></i> Use My Current Location';
        locationBtn.disabled = false;

        // Show appropriate error message
        let errorMessage = "Could not get your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please enable location services in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information is unavailable. Please try again later.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          case error.UNKNOWN_ERROR:
            errorMessage =
              "An unknown error occurred while getting your location.";
            break;
        }

        showMessage(errorMessage, "error");
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    showMessage("Geolocation is not supported by this browser", "error");
  }
}

// Update company address
async function updateCompanyAddress() {
  try {
    // Show loading indicator
    showLoadingIndicator();

    // Get form values
    const streetName = document
      .getElementById("edit-company-street-name")
      .value.trim();
    const streetNumber = document
      .getElementById("edit-company-street-number")
      .value.trim();
    const city = document.getElementById("edit-company-city").value.trim();
    const district = document
      .getElementById("edit-company-district")
      .value.trim();
    const countrySelect = document.getElementById("edit-company-country");
    const country = countrySelect.value;
    const countryName = countrySelect.options[countrySelect.selectedIndex].text;
    const nextTo = document.getElementById("edit-company-next-to").value.trim();

    // Validate required fields
    if (!streetName || !city || !country) {
      hideLoadingIndicator();
      showMessage("Street name, city, and country are required", "error");

      // Reset the save button
      const saveButton = document.getElementById("save-address-btn");
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Address';
      }
      return;
    }

    // Get lat/lng from display
    let latLon = null;
    const latLngText = document.getElementById("lat-lng-display").textContent;
    if (latLngText && latLngText.includes("Coordinates set")) {
      const matches = latLngText.match(/Coordinates set: ([-\d.]+), ([-\d.]+)/);
      if (matches && matches.length === 3) {
        latLon = {
          latitude: parseFloat(matches[1]),
          longitude: parseFloat(matches[2]),
        };
      }
    }

    if (!latLon) {
      hideLoadingIndicator();
      showMessage("Please select a location on the map", "error");

      // Reset the save button
      const saveButton = document.getElementById("save-address-btn");
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Address';
      }
      return;
    }

    // Show loading message
    showMessage("Updating address...", "info");

    // Prepare address data object
    const addressData = {
      streetName,
      streetNumber,
      city,
      district,
      country,
      countryName, // Store the country name as well as the code
      nextTo,
      latLon,
      updatedAt: getTimestamp(),
    };

    // Create or update address
    if (currentCompany.addressId) {
      // Update existing address
      await addressesRef.doc(currentCompany.addressId).update(addressData);

      // Check if the id field exists, add it if it doesn't
      const addressDoc = await addressesRef.doc(currentCompany.addressId).get();
      if (addressDoc.exists && !addressDoc.data().id) {
        await addressesRef.doc(currentCompany.addressId).update({
          id: currentCompany.addressId,
        });
      }
    } else {
      // Create new address
      addressData.createdAt = getTimestamp();
      const addressRef = await addressesRef.add(addressData);

      // Add the id field to the new address document
      await addressesRef.doc(addressRef.id).update({
        id: addressRef.id,
      });

      // Update company with new addressId
      await companiesRef.doc(currentCompany.id).update({
        addressId: addressRef.id,
        updatedAt: getTimestamp(),
      });

      // Update local company data
      currentCompany.addressId = addressRef.id;
      setCurrentCompany(currentCompany);
    }

    // Hide loading indicator
    hideLoadingIndicator();

    // Hide modal and reload profile
    hideModal();
    loadCompanyProfile();

    // Log activity
    await logActivity("update", "address", currentCompany.addressId);

    showMessage("Address updated successfully", "success");
  } catch (error) {
    console.error("Error updating address:", error);
    hideLoadingIndicator();
    showMessage(`Error updating address: ${error.message}`, "error");
  }
}

// Make functions globally available
window.showEditAddressModal = showEditAddressModal;
window.updateCompanyAddress = updateCompanyAddress;
window.validateAndUpdateAddress = validateAndUpdateAddress;

// Add styles for company profile section
const companyProfileStyles = document.createElement("style");
companyProfileStyles.textContent = `
    .profile-container {
        margin-top: 20px;
    }
    
    .profile-header {
        display: flex;
        align-items: center;
        background-color: var(--white);
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
    }
    
    .profile-image {
        position: relative;
        margin-right: 30px;
    }
    
    .profile-image img {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--primary-color);
    }
    
    .change-image-btn {
        position: absolute;
        bottom: 5px;
        right: 5px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: var(--white);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    
    .profile-info h3 {
        margin: 0 0 5px 0;
        font-size: 1.5rem;
    }
    
    .profile-info p {
        margin: 0 0 10px 0;
        color: var(--gray);
    }
    
    .rating {
        display: flex;
        align-items: center;
    }
    
    .rating i {
        color: #f1c40f;
        margin-right: 5px;
    }
    
    .profile-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }
    
    .detail-section {
        background-color: var(--white);
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .detail-section h4 {
        margin-top: 0;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--light-gray);
    }
    
    .detail-item {
        margin-bottom: 15px;
    }
    
    .detail-label {
        font-weight: 500;
        margin-bottom: 5px;
        color: var(--gray);
    }
    
    .detail-value {
        color: var(--dark);
    }
    
    .edit-address-btn-container {
        text-align: center;
        margin-top: 20px;
    }
    
    .edit-profile-form {
        padding: 10px;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .form-group input, .form-group textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--light-gray);
        border-radius: 5px;
    }
    
    .form-group textarea {
        resize: vertical;
    }
    
    @media (max-width: 768px) {
        .profile-header {
            flex-direction: column;
            text-align: center;
        }
        
        .profile-image {
            margin-right: 0;
            margin-bottom: 20px;
        }
    }
`;
document.head.appendChild(companyProfileStyles);

// Function to update profile image section
function setupCompanyImageUpload() {
  const changeImageBtn = document.querySelector(".change-image-btn");
  if (changeImageBtn) {
    changeImageBtn.addEventListener("click", () => {
      // Create a file input element
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";
      document.body.appendChild(fileInput);

      // Trigger click on the file input
      fileInput.click();

      // Handle file selection
      fileInput.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          const file = this.files[0];
          const reader = new FileReader();

          reader.onload = function (e) {
            // Update the profile image preview
            const profileImage = document.querySelector("#company-image");
            if (profileImage) {
              profileImage.src = e.target.result;
            }

            // Show notification
            showMessage(
              "Image preview updated. Save changes to apply.",
              "info"
            );
          };

          reader.readAsDataURL(file);
        }

        // Remove the file input from the DOM
        document.body.removeChild(fileInput);
      });
    });
  }
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

// Helper functions for UI
function showLoadingIndicator() {
  // Check if loading overlay already exists
  let loadingOverlay = document.querySelector(".loading-overlay");

  if (!loadingOverlay) {
    // Create loading overlay
    loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Processing...</p>
      </div>
    `;
    document.body.appendChild(loadingOverlay);

    // Style the overlay
    loadingOverlay.style.position = "fixed";
    loadingOverlay.style.top = "0";
    loadingOverlay.style.left = "0";
    loadingOverlay.style.width = "100%";
    loadingOverlay.style.height = "100%";
    loadingOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    loadingOverlay.style.display = "flex";
    loadingOverlay.style.justifyContent = "center";
    loadingOverlay.style.alignItems = "center";
    loadingOverlay.style.zIndex = "9999";

    // Style the spinner container
    const spinner = loadingOverlay.querySelector(".loading-spinner");
    spinner.style.backgroundColor = "white";
    spinner.style.padding = "20px";
    spinner.style.borderRadius = "5px";
    spinner.style.textAlign = "center";

    // Style the icon
    const icon = spinner.querySelector("i");
    icon.style.fontSize = "2rem";
    icon.style.color = "#4a6cf7";

    // Style the text
    const text = spinner.querySelector("p");
    text.style.marginTop = "10px";
    text.style.color = "#333";
  } else {
    // Just make sure it's visible
    loadingOverlay.style.display = "flex";
  }
}

function hideLoadingIndicator() {
  const loadingOverlay = document.querySelector(".loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }
}
