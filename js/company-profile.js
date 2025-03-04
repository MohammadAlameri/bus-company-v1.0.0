// Initialize company profile section
function loadCompanyProfile() {
  if (!currentCompany) return;

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
                        <div class="detail-value">${
                          currentCompany.address ||
                          "No address information available"
                        }</div>
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
                    <div class="detail-item">
                        <div class="detail-label">Email Verification</div>
                        <div class="detail-value">
                            <span id="company-verified-badge" class="${
                              auth.currentUser && auth.currentUser.emailVerified
                                ? "status-badge status-success"
                                : "status-badge status-warning"
                            }">
                              ${
                                auth.currentUser &&
                                auth.currentUser.emailVerified
                                  ? "Verified"
                                  : "Unverified"
                              }
                            </span>
                            ${
                              auth.currentUser &&
                              !auth.currentUser.emailVerified
                                ? `<button onclick="sendVerificationEmail()" class="text-btn verification-btn">
                                  <i class="fas fa-envelope"></i> Send Verification Email
                                 </button>`
                                : ""
                            }
                        </div>
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
  console.log("showEditAddressModal function called");

  // Parse existing address if available
  let streetAddress = "";
  let city = "";
  let state = "";
  let zipCode = "";
  let country = "";

  if (currentCompany.address) {
    // Try to parse the existing address
    const addressLines = currentCompany.address.split("\n");

    if (addressLines.length >= 1) {
      streetAddress = addressLines[0];
    }

    if (addressLines.length >= 2) {
      // Try to parse the city, state, zip line
      const cityStateLine = addressLines[1];
      const cityStateMatch = cityStateLine.match(/([^,]+),\s*([^,]+)\s*(\d*)/);

      if (cityStateMatch) {
        city = cityStateMatch[1] || "";
        state = cityStateMatch[2] || "";
        zipCode = cityStateMatch[3] || "";
      }
    }

    if (addressLines.length >= 3) {
      country = addressLines[2];
    }
  }

  // Use stored individual fields if available
  city = currentCompany.city || city;
  state = currentCompany.state || state;
  zipCode = currentCompany.zipCode || zipCode;
  country = currentCompany.country || country;

  const modalContent = `
        <div class="edit-address-form">
            <div class="form-group">
                <label for="edit-company-address">Street Address</label>
                <textarea id="edit-company-address" rows="3" placeholder="Enter your street address">${streetAddress}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-company-city">City</label>
                <input type="text" id="edit-company-city" value="${city}" placeholder="City">
            </div>
            <div class="form-group">
                <label for="edit-company-state">State/Province</label>
                <input type="text" id="edit-company-state" value="${state}" placeholder="State or Province">
            </div>
            <div class="form-group">
                <label for="edit-company-zip">Postal/ZIP Code</label>
                <input type="text" id="edit-company-zip" value="${zipCode}" placeholder="ZIP or Postal Code">
            </div>
            <div class="form-group">
                <label for="edit-company-country">Country</label>
                <input type="text" id="edit-company-country" value="${country}" placeholder="Country">
            </div>
            
            <div class="form-footer">
                <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                <button type="button" class="primary-btn" onclick="updateCompanyAddress()">Save Address</button>
            </div>
        </div>
    `;

  showModal("Edit Company Address", modalContent);
}

// Update company address
async function updateCompanyAddress() {
  try {
    const address = document
      .getElementById("edit-company-address")
      .value.trim();
    const city = document.getElementById("edit-company-city").value.trim();
    const state = document.getElementById("edit-company-state").value.trim();
    const zipCode = document.getElementById("edit-company-zip").value.trim();
    const country = document
      .getElementById("edit-company-country")
      .value.trim();

    // Show loading message
    showMessage("Updating address...", "info");

    // Format full address for display
    let fullAddress = address;
    if (city && state) {
      fullAddress += `\n${city}, ${state}`;
      if (zipCode) {
        fullAddress += ` ${zipCode}`;
      }
    }
    if (country) {
      fullAddress += `\n${country}`;
    }

    // Update Firestore
    await companiesRef.doc(currentCompany.id).update({
      address: fullAddress,
      city: city,
      state: state,
      zipCode: zipCode,
      country: country,
      updatedAt: getTimestamp(),
    });

    // Update local company data
    currentCompany.address = fullAddress;
    currentCompany.city = city;
    currentCompany.state = state;
    currentCompany.zipCode = zipCode;
    currentCompany.country = country;

    // Update stored company data
    setCurrentCompany(currentCompany);

    // Hide modal and reload profile
    hideModal();
    loadCompanyProfile();

    // Log activity
    await logActivity("update", "company_address", currentCompany.id);

    // Show success message
    showMessage("Address updated successfully", "success");
  } catch (error) {
    console.error("Error updating company address:", error);
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
