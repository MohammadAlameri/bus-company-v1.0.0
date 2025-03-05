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
        <div class="section-header">
            <h2>Company Profile</h2>
            <div class="section-actions">
                <button id="refresh-company-profile-btn" class="refresh-btn secondary-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button id="edit-company-profile-btn" class="primary-btn">Edit Profile</button>
            </div>
        </div>
        
        <div class="profile-container">
            <div class="profile-header">
                <div class="profile-image">
                    <img src="${
                      currentCompany.imageURL ||
                      "https://via.placeholder.com/150"
                    }" alt="${currentCompany.name}">
                    <button class="change-image-btn">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
                <div class="profile-info">
                    <h3>${currentCompany.name}</h3>
                    <p>${currentCompany.email}</p>
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${currentCompany.rate || 0} (${
    currentCompany.reviewCount || 0
  } reviews)</span>
                    </div>
                </div>
            </div>
            
            <div class="profile-details">
                <div class="detail-section">
                    <h4>Company Information</h4>
                    <div class="detail-item">
                        <div class="detail-label">Phone Number</div>
                        <div class="detail-value">${
                          currentCompany.phoneNumber || "Not set"
                        }</div>
                    </div>
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
        </div>
    `;

  // Add event listeners
  const refreshCompanyProfileBtn = document.getElementById(
    "refresh-company-profile-btn"
  );
  if (refreshCompanyProfileBtn) {
    refreshCompanyProfileBtn.addEventListener("click", () => {
      showMessage("Refreshing company profile...", "info");
      loadCompanyProfile();
    });
  }

  const editCompanyProfileBtn = document.getElementById(
    "edit-company-profile-btn"
  );
  if (editCompanyProfileBtn) {
    editCompanyProfileBtn.addEventListener("click", () => {
      showEditProfileModal();
    });
  }

  // Load address data
  loadAddress();
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
  const modalContent = `
        <div class="edit-profile-form">
            <div class="form-group">
                <label for="edit-company-name">Company Name</label>
                <input type="text" id="edit-company-name" value="${
                  currentCompany.name || ""
                }">
            </div>
            <div class="form-group">
                <label for="edit-company-phone">Phone Number</label>
                <input type="text" id="edit-company-phone" value="${
                  currentCompany.phoneNumber || ""
                }">
            </div>
            <div class="form-group">
                <label for="edit-company-bank">Bank Account</label>
                <input type="text" id="edit-company-bank" value="${
                  currentCompany.banckAccountNo || ""
                }">
            </div>
            <div class="form-group">
                <label for="edit-company-bio">Bio</label>
                <textarea id="edit-company-bio" rows="4">${
                  currentCompany.bio || ""
                }</textarea>
            </div>
            
            <div class="form-footer">
                <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                <button type="button" class="primary-btn" onclick="updateCompanyProfile()">Save Changes</button>
            </div>
        </div>
    `;

  showModal("Edit Company Profile", modalContent);
}

// Update company profile
async function updateCompanyProfile() {
  try {
    const companyName = document
      .getElementById("edit-company-name")
      .value.trim();
    const phoneNumber = document
      .getElementById("edit-company-phone")
      .value.trim();
    const bankAccount = document
      .getElementById("edit-company-bank")
      .value.trim();
    const bio = document.getElementById("edit-company-bio").value.trim();

    if (!companyName) {
      showMessage("Company name cannot be empty", "error");
      return;
    }

    // Validate phone number format if provided
    if (phoneNumber) {
      const phoneRegex = /^(78|77|70|71|73)\d{7}$/;
      if (!phoneRegex.test(phoneNumber)) {
        showMessage(
          "Phone number must start with 78, 77, 70, 71, or 73 and be 9 digits long",
          "error"
        );
        return;
      }
    }

    // Show loading message
    showMessage("Updating profile...", "info");

    // Update Firestore
    await companiesRef.doc(currentCompany.id).update({
      name: companyName,
      phoneNumber: phoneNumber,
      banckAccountNo: bankAccount,
      bio: bio,
      updatedAt: getTimestamp(),
    });

    // Update local company data
    currentCompany.name = companyName;
    currentCompany.phoneNumber = phoneNumber;
    currentCompany.banckAccountNo = bankAccount;
    currentCompany.bio = bio;

    // Update stored company data
    setCurrentCompany(currentCompany);

    // Hide modal and reload profile
    hideModal();
    loadCompanyProfile();

    // Update company name in header
    if (document.getElementById("company-name")) {
      document.getElementById("company-name").textContent = companyName;
    }

    // Log activity
    await logActivity("update", "company", currentCompany.id);

    // Show success message
    showMessage("Profile updated successfully", "success");
  } catch (error) {
    console.error("Error updating company profile:", error);
    showMessage(`Error updating profile: ${error.message}`, "error");
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
        <div class="form-row">
            <div class="form-group">
                <label for="edit-company-street-name">Street Name</label>
                <input type="text" id="edit-company-street-name" placeholder="Street Name" value="${
                  addressData.streetName || ""
                }">
            </div>
            <div class="form-group">
                <label for="edit-company-street-number">Street Number</label>
                <input type="text" id="edit-company-street-number" placeholder="Street Number" value="${
                  addressData.streetNumber || ""
                }">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="edit-company-city">City</label>
                <input type="text" id="edit-company-city" placeholder="City" value="${
                  addressData.city || ""
                }">
            </div>
            <div class="form-group">
                <label for="edit-company-district">District</label>
                <input type="text" id="edit-company-district" placeholder="District" value="${
                  addressData.district || ""
                }">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="edit-company-country">Country</label>
                <input type="text" id="edit-company-country" placeholder="Country" value="${
                  addressData.country || ""
                }">
            </div>
            <div class="form-group">
                <label for="edit-company-next-to">Next To</label>
                <input type="text" id="edit-company-next-to" placeholder="Next To (e.g., Near Central Bank)" value="${
                  addressData.nextTo || ""
                }">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group map-container">
                <label>Location</label>
                <div id="address-map" style="height: 200px; margin-bottom: 10px;"></div>
                <button type="button" id="get-location-btn" class="outline-btn">
                    <i class="fas fa-map-marker-alt"></i> Get Current Location
                </button>
                <div class="coordinates-display">
                    <span id="lat-lng-display">${
                      addressData.latLon
                        ? `Lat: ${addressData.latLon.latitude}, Lng: ${addressData.latLon.longitude}`
                        : "No coordinates selected"
                    }</span>
                </div>
            </div>
            </div>
            
            <div class="form-footer">
                <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                <button type="button" class="primary-btn" onclick="updateCompanyAddress()">Save Address</button>
            </div>
        </div>
    `;

  // Update the modal content
  document.querySelector(".modal-content").innerHTML = modalContent;
  document.querySelector(".modal-title").textContent = "Edit Company Address";

  // Initialize map if Google Maps API is available
  if (typeof google !== "undefined" && google.maps) {
    initializeAddressMap(addressData.latLon);
  } else {
    document.getElementById("address-map").innerHTML =
      '<div class="map-placeholder">Map cannot be loaded</div>';
  }

  // Add event listener for getting current location
  document
    .getElementById("get-location-btn")
    .addEventListener("click", getCurrentLocation);
}

// Initialize map for address selection
function initializeAddressMap(latLng) {
  if (!latLng) {
    latLng = { latitude: 15.3694, longitude: 44.191 }; // Default to Sana'a, Yemen
  }

  const mapOptions = {
    center: { lat: latLng.latitude, lng: latLng.longitude },
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  const map = new google.maps.Map(
    document.getElementById("address-map"),
    mapOptions
  );

  // Add marker
  let marker = new google.maps.Marker({
    position: { lat: latLng.latitude, lng: latLng.longitude },
    map: map,
    draggable: true,
  });

  // Update coordinates when marker is dragged
  google.maps.event.addListener(marker, "dragend", function () {
    const position = marker.getPosition();
    const newLatLng = {
      latitude: position.lat(),
      longitude: position.lng(),
    };
    updateLatLngDisplay(newLatLng);
  });

  // Add click listener to map
  google.maps.event.addListener(map, "click", function (event) {
    marker.setPosition(event.latLng);
    const newLatLng = {
      latitude: event.latLng.lat(),
      longitude: event.latLng.lng(),
    };
    updateLatLngDisplay(newLatLng);
  });

  // Get current location button
  document
    .getElementById("get-location-btn")
    .addEventListener("click", function () {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const currentLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(currentLocation);
            marker.setPosition(currentLocation);

            const newLatLng = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            updateLatLngDisplay(newLatLng);
          },
          function () {
            showMessage("Error: The Geolocation service failed.", "error");
          }
        );
      } else {
        showMessage(
          "Error: Your browser doesn't support geolocation.",
          "error"
        );
      }
    });
}

// Get current location for address map
function getCurrentLocation() {
  if (navigator.geolocation) {
    // Show loading indicator
    document.getElementById("get-location-btn").innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Getting location...';

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Update the map
        const latLng = { latitude, longitude };
        initializeAddressMap(latLng);

        // Update the display
        updateLatLngDisplay(latLng);

        // Reset button
        document.getElementById("get-location-btn").innerHTML =
          '<i class="fas fa-map-marker-alt"></i> Get Current Location';

        showMessage("Location updated successfully", "success");
      },
      // Error callback
      (error) => {
        console.error("Error getting current location:", error);
        showMessage(`Could not get your location: ${error.message}`, "error");

        // Reset button
        document.getElementById("get-location-btn").innerHTML =
          '<i class="fas fa-map-marker-alt"></i> Get Current Location';
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

// Update the lat/lng display
function updateLatLngDisplay(latLng) {
  if (
    latLng &&
    typeof latLng.latitude === "number" &&
    typeof latLng.longitude === "number"
  ) {
    document.getElementById(
      "lat-lng-display"
    ).textContent = `Lat: ${latLng.latitude.toFixed(
      6
    )}, Lng: ${latLng.longitude.toFixed(6)}`;
  } else {
    document.getElementById("lat-lng-display").textContent =
      "No coordinates selected";
  }
}

// Update company address
async function updateCompanyAddress() {
  try {
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
    const country = document
      .getElementById("edit-company-country")
      .value.trim();
    const nextTo = document.getElementById("edit-company-next-to").value.trim();

    // Validate required fields
    if (!streetName || !city || !country) {
      showMessage("Street name, city, and country are required", "error");
      return;
    }

    // Get lat/lng from display
    let latLon = null;
    const latLngText = document.getElementById("lat-lng-display").textContent;
    if (latLngText && latLngText !== "No coordinates selected") {
      const matches = latLngText.match(/Lat: ([-\d.]+), Lng: ([-\d.]+)/);
      if (matches && matches.length === 3) {
        latLon = {
          latitude: parseFloat(matches[1]),
          longitude: parseFloat(matches[2]),
        };
      }
    }

    if (!latLon) {
      showMessage("Please select a location on the map", "error");
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

    // Hide modal and reload profile
    hideModal();
    loadCompanyProfile();

    // Log activity
    await logActivity("update", "address", currentCompany.addressId);

    showMessage("Address updated successfully", "success");
  } catch (error) {
    console.error("Error updating address:", error);
    showMessage(`Error updating address: ${error.message}`, "error");
  }
}

// Make functions globally available
window.showEditAddressModal = showEditAddressModal;
window.updateCompanyAddress = updateCompanyAddress;

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
