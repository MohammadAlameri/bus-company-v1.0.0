// DOM Elements - We'll initialize these after the document has loaded
let loginSection;
let registerSection;
let dashboardSection;
let showRegisterLink;
let showLoginLink;
let loginBtn;
let googleLoginBtn;
let registerBtn;
let registerGoogleBtn;
let logoutBtn;
let verificationSection;
let resendVerificationBtn;
let checkVerificationBtn;
let returnToLoginBtn;
let forgotPasswordLink;

// Wait for the document to be fully loaded before accessing DOM elements
document.addEventListener("DOMContentLoaded", () => {
  console.log("Document loaded - initializing DOM elements");

  // Initialize DOM elements
  loginSection = document.getElementById("login-section");
  registerSection = document.getElementById("register-section");
  dashboardSection = document.getElementById("dashboard-section");
  showRegisterLink = document.getElementById("show-register");
  showLoginLink = document.getElementById("show-login");
  loginBtn = document.getElementById("login-btn");
  googleLoginBtn = document.getElementById("google-login-btn");
  registerBtn = document.getElementById("register-btn");
  registerGoogleBtn = document.getElementById("register-google-btn");
  logoutBtn = document.getElementById("logout-btn");
  forgotPasswordLink = document.getElementById("forgot-password");

  // Debug DOM elements
  console.log("loginSection:", !!loginSection);
  console.log("registerSection:", !!registerSection);
  console.log("dashboardSection:", !!dashboardSection);
  console.log("showRegisterLink:", !!showRegisterLink);
  console.log("showLoginLink:", !!showLoginLink);
  console.log("loginBtn:", !!loginBtn);
  console.log("googleLoginBtn:", !!googleLoginBtn);
  console.log("registerBtn:", !!registerBtn);
  console.log("registerGoogleBtn:", !!registerGoogleBtn);
  console.log("logoutBtn:", !!logoutBtn);
  console.log("forgotPasswordLink:", !!forgotPasswordLink);

  // Initialize verification section
  initializeVerificationSection();

  // Initialize verification buttons after the section is created
  resendVerificationBtn = document.getElementById("resend-verification");
  checkVerificationBtn = document.getElementById("check-verification");
  returnToLoginBtn = document.getElementById("return-to-login");

  console.log("Register button element:", registerBtn);

  // Set up event listeners
  setupEventListeners();

  // Check if user is already logged in
  firebase.auth().onAuthStateChanged(handleAuthStateChanged);
});

// Create verification section element
function initializeVerificationSection() {
  verificationSection = document.createElement("div");
  verificationSection.id = "verification-section";
  verificationSection.className = "auth-section hidden";
  verificationSection.innerHTML = `
    <div class="auth-container">
      <div class="logo">
        <i class="fas fa-bus"></i>
        <h1>Bus Company Dashboard</h1>
      </div>
      <div class="verify-email-container">
        <h2>Verify Your Email</h2>
        <p>We've sent a verification email to <span id="user-email">your email</span>.</p>
        <p>Please check your inbox and click the verification link to continue.</p>
        
        <div class="verification-actions">
          <button id="resend-verification" class="secondary-btn">
            <i class="fas fa-paper-plane"></i> Resend Verification Email
          </button>
          <button id="check-verification" class="primary-btn">
            <i class="fas fa-check-circle"></i> I've Verified My Email
          </button>
        </div>
        
        <div class="verification-footer">
          <button id="return-to-login" class="text-btn">
            <i class="fas fa-arrow-left"></i> Return to Login
          </button>
          <button id="logout-from-verification" class="text-btn">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </div>
  `;

  // Add verification section to the container
  document.querySelector(".container").appendChild(verificationSection);

  // Add verification section event listeners
  document
    .getElementById("resend-verification")
    ?.addEventListener("click", resendVerificationEmail);
  document
    .getElementById("check-verification")
    ?.addEventListener("click", checkEmailVerification);
  document
    .getElementById("return-to-login")
    ?.addEventListener("click", returnToLogin);
  document
    .getElementById("logout-from-verification")
    ?.addEventListener("click", () => auth.signOut());
}

// Setup all event listeners
function setupEventListeners() {
  console.log("Setting up event listeners");

  // Show register form
  if (showRegisterLink) {
    console.log("Adding click listener to showRegisterLink");
    showRegisterLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (loginSection && registerSection) {
        loginSection.classList.add("hidden");
        registerSection.classList.remove("hidden");
      }
    });
  } else {
    console.warn("showRegisterLink element not found");
  }

  // Show login form
  if (showLoginLink) {
    console.log("Adding click listener to showLoginLink");
    showLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (registerSection && loginSection) {
        registerSection.classList.add("hidden");
        loginSection.classList.remove("hidden");
      }
    });
  } else {
    console.warn("showLoginLink element not found");
  }

  // Login button
  if (loginBtn) {
    loginBtn.addEventListener("click", handleLogin);
  }

  // Google login button
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", handleGoogleLogin);
  }

  // Register button
  if (registerBtn) {
    registerBtn.addEventListener("click", handleRegistration);
  }

  // Google registration button
  if (registerGoogleBtn) {
    registerGoogleBtn.addEventListener("click", handleGoogleRegistration);
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => {
        clearCurrentCompany();
        window.location.reload();
      });
    });
  }

  // Verification-related buttons
  if (resendVerificationBtn) {
    resendVerificationBtn.addEventListener("click", resendVerificationEmail);
  }

  if (checkVerificationBtn) {
    checkVerificationBtn.addEventListener("click", checkEmailVerification);
  }

  if (returnToLoginBtn) {
    returnToLoginBtn.addEventListener("click", returnToLogin);
  }

  // Forgot password link
  if (forgotPasswordLink) {
    console.log("Adding click listener to forgotPasswordLink");
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      handlePasswordReset();
    });
  } else {
    console.warn("forgotPasswordLink element not found");
  }
}

// Handle login form submission
async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMessage("Please enter email and password", "error");
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    // Sign in the user
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      showMessage("Please verify your email before continuing", "warning");
      showVerificationScreen(user.email);
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
      return;
    }

    // Check if company profile exists
    const profileExists = await checkCompanyProfileExists(user.uid);

    if (!profileExists) {
      // If profile doesn't exist, create it
      showMessage("Creating company profile...", "info");
      try {
        await createCompanyProfile(
          user.uid,
          "Company " + user.email.split("@")[0],
          user.email,
          "email"
        );
        showMessage("Company profile created", "success");
      } catch (profileError) {
        console.error("Error creating company profile:", profileError);
        showMessage("Error creating company profile", "error");
        // Still continue with login
      }
    }

    // Fetch company profile
    const companyProfile = await fetchCompanyProfile(user.uid);
    setCurrentCompany(companyProfile);

    // Show dashboard
    showDashboard();

    // Initialize dashboard data
    initializeDashboard();
  } catch (error) {
    console.error("Login error:", error);
    showMessage(`Login failed: ${error.message}`, "error");
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
}

// Handle Google login
async function handleGoogleLogin() {
  try {
    googleLoginBtn.disabled = true;

    const provider = new firebase.auth.GoogleAuthProvider();
    const userCredential = await auth.signInWithPopup(provider);
    const user = userCredential.user;

    // Check if company profile exists
    const profileExists = await checkCompanyProfileExists(user.uid);

    if (!profileExists) {
      // If profile doesn't exist, create it
      showMessage("Creating company profile...", "info");
      await createCompanyProfile(
        user.uid,
        user.displayName || "Company " + user.email.split("@")[0],
        user.email,
        "google"
      );
    }

    // Fetch company profile
    const companyProfile = await fetchCompanyProfile(user.uid);
    setCurrentCompany(companyProfile);

    // Show dashboard
    showDashboard();

    // Initialize dashboard data
    initializeDashboard();
  } catch (error) {
    console.error("Google login error:", error);
    showMessage(`Google login failed: ${error.message}`, "error");
    googleLoginBtn.disabled = false;
  }
}

// Handle registration form submission
async function handleRegistration() {
  console.log("Registration handler triggered");
  const name = document.getElementById("register-company").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById(
    "register-confirm-password"
  ).value;

  console.log("Form values:", {
    name,
    email,
    password: "***",
    confirmPassword: "***",
  });

  if (!name || !email || !password || !confirmPassword) {
    showMessage("Please fill in all fields", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match", "error");
    return;
  }

  try {
    registerBtn.disabled = true;
    registerBtn.textContent = "Registering...";

    // Create user with email and password
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    console.log("User created successfully:", user.uid);

    // Send email verification
    await user.sendEmailVerification();
    console.log("Verification email sent");

    // Update display name
    await user.updateProfile({
      displayName: name,
    });
    console.log("Profile display name updated");

    // Create company profile
    await createCompanyProfile(user.uid, name, email, "email");
    console.log("Company profile created");

    // Show verification screen
    showVerificationScreen(email);

    showMessage(
      "Registration successful! Please verify your email.",
      "success"
    );
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  } catch (error) {
    console.error("Registration error:", error);
    showMessage(`Registration failed: ${error.message}`, "error");
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  }
}

// Handle Google registration
async function handleGoogleRegistration() {
  try {
    registerGoogleBtn.disabled = true;

    const provider = new firebase.auth.GoogleAuthProvider();
    const userCredential = await auth.signInWithPopup(provider);
    const user = userCredential.user;

    // Check if company profile exists
    const profileExists = await checkCompanyProfileExists(user.uid);

    if (!profileExists) {
      // If profile doesn't exist, create it
      showMessage("Creating company profile...", "info");
      await createCompanyProfile(
        user.uid,
        user.displayName || "Company " + user.email.split("@")[0],
        user.email,
        "google"
      );
    }

    // Fetch company profile
    const companyProfile = await fetchCompanyProfile(user.uid);
    setCurrentCompany(companyProfile);

    // Show dashboard
    showDashboard();

    // Initialize dashboard data
    initializeDashboard();
  } catch (error) {
    console.error("Google registration error:", error);
    showMessage(`Google registration failed: ${error.message}`, "error");
    registerGoogleBtn.disabled = false;
  }
}

// Authentication state change handler function
async function handleAuthStateChanged(user) {
  if (user) {
    console.log("User is signed in:", user.email);

    // Check email verification
    if (!user.emailVerified) {
      console.log("Email not verified, showing verification screen");
      showVerificationScreen(user.email);
      return;
    }

    try {
      // Check if company profile exists
      const companyProfile = await fetchCompanyProfile(user.uid);

      if (companyProfile) {
        // Set current company
        setCurrentCompany(companyProfile);

        // Show dashboard
        showDashboard();

        // Initialize dashboard
        initializeDashboard();
      } else {
        console.error("No company profile found for user:", user.uid);
        showMessage(
          "Error: Company profile not found. Please contact support.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error in auth state change:", error);
      showMessage(`Error: ${error.message}`, "error");
    }
  } else {
    console.log("User is signed out");
    // Show login screen
    if (loginSection) loginSection.classList.remove("hidden");
    if (registerSection) registerSection.classList.add("hidden");
    if (verificationSection) verificationSection.classList.add("hidden");
    if (dashboardSection) dashboardSection.classList.add("hidden");

    // Reset form fields
    if (document.getElementById("email"))
      document.getElementById("email").value = "";
    if (document.getElementById("password"))
      document.getElementById("password").value = "";
    if (document.getElementById("register-company"))
      document.getElementById("register-company").value = "";
    if (document.getElementById("register-email"))
      document.getElementById("register-email").value = "";
    if (document.getElementById("register-password"))
      document.getElementById("register-password").value = "";
    if (document.getElementById("register-confirm-password"))
      document.getElementById("register-confirm-password").value = "";

    // Reset buttons
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
    if (googleLoginBtn) {
      googleLoginBtn.disabled = false;
    }
    if (registerBtn) {
      registerBtn.disabled = false;
      registerBtn.textContent = "Register";
    }
    if (registerGoogleBtn) {
      registerGoogleBtn.disabled = false;
    }
  }
}

// Check if company profile exists
async function checkCompanyProfileExists(userId) {
  try {
    console.log("Checking if company profile exists for:", userId);
    const doc = await companiesRef.doc(userId).get();
    return doc.exists;
  } catch (error) {
    console.error("Error checking company profile:", error);
    return false;
  }
}

// Show dashboard
function showDashboard() {
  console.log("Showing dashboard");

  // Check if user is logged in and email is verified
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    showVerificationScreen(user.email);
    return;
  }

  if (loginSection) loginSection.classList.add("hidden");
  if (registerSection) registerSection.classList.add("hidden");
  if (verificationSection) verificationSection.classList.add("hidden");
  if (dashboardSection) dashboardSection.classList.remove("hidden");
}

// Show verification screen
function showVerificationScreen(email) {
  console.log("Showing verification screen for:", email);
  if (loginSection) loginSection.classList.add("hidden");
  if (registerSection) registerSection.classList.add("hidden");
  if (dashboardSection) dashboardSection.classList.add("hidden");

  // Update user email in the verification screen
  const userEmailSpan = document.getElementById("user-email");
  if (userEmailSpan) userEmailSpan.textContent = email;

  verificationSection.classList.remove("hidden");
}

// Resend verification email
async function resendVerificationEmail() {
  try {
    const user = auth.currentUser;
    if (user) {
      await user.sendEmailVerification();
      showMessage(
        "Verification email sent. Please check your inbox.",
        "success"
      );
    } else {
      showMessage(
        "You must be logged in to resend verification email.",
        "error"
      );
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Check if email has been verified
async function checkEmailVerification() {
  try {
    // Reload user to get updated email verification status
    await auth.currentUser.reload();
    const user = auth.currentUser;

    if (user.emailVerified) {
      showMessage("Email verified! Redirecting to dashboard...", "success");

      // Fetch company profile
      const companyProfile = await fetchCompanyProfile(user.uid);
      setCurrentCompany(companyProfile);

      // Show dashboard
      setTimeout(() => {
        showDashboard();
        initializeDashboard();
      }, 1000);
    } else {
      showMessage(
        "Your email is not verified yet. Please check your inbox.",
        "warning"
      );
    }
  } catch (error) {
    console.error("Error checking verification:", error);
    showMessage(`Error: ${error.message}`, "error");
  }
}

// Return to login screen
function returnToLogin() {
  if (auth.currentUser) {
    auth.signOut().then(() => {
      if (verificationSection) verificationSection.classList.add("hidden");
      if (loginSection) loginSection.classList.remove("hidden");
    });
  } else {
    if (verificationSection) verificationSection.classList.add("hidden");
    if (loginSection) loginSection.classList.remove("hidden");
  }
}

// Show message
function showMessage(message, type = "info") {
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

// Add CSS for messages
const style = document.createElement("style");
style.textContent = `
    .message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: opacity 0.5s, transform 0.5s;
    }
    .message.info {
        background-color: #3498db;
    }
    .message.error {
        background-color: #e74c3c;
    }
    .message.success {
        background-color: #2ecc71;
    }
    .message.warning {
        background-color: #f39c12;
    }
    .message.hiding {
        opacity: 0;
        transform: translateY(-20px);
    }
`;
document.head.appendChild(style);

// Add styles for verification section
const verificationStyles = document.createElement("style");
verificationStyles.textContent = `
  .verify-email-container {
    background-color: var(--white);
    border-radius: 8px;
    box-shadow: var(--shadow);
    padding: 30px;
    width: 100%;
    max-width: 500px;
    text-align: center;
    margin: 0 auto; /* Center the container */
  }
  
  #verification-section {
    padding-top: 0; /* Remove extra padding */
    margin-top: 0; /* Remove extra margin */
  }
  
  .verify-email-container h2 {
    color: var(--primary-color);
    margin-bottom: 20px;
  }
  
  .verify-email-container p {
    margin-bottom: 15px;
    color: var(--dark-gray);
  }
  
  #user-email {
    font-weight: bold;
    color: var(--darkest-gray);
  }
  
  .verification-actions {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .verification-footer {
    margin-top: 30px;
    display: flex;
    justify-content: space-between;
  }
  
  .text-btn {
    background: none;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .text-btn:hover {
    text-decoration: underline;
  }
`;
document.head.appendChild(verificationStyles);

// Create company profile
async function createCompanyProfile(userId, name, email, authProvider) {
  try {
    console.log("Creating company profile for:", userId, name, email);

    // Check if company profile already exists
    const existingDoc = await companiesRef.doc(userId).get();
    if (existingDoc.exists) {
      console.log("Company profile already exists");
      return {
        id: userId,
        ...existingDoc.data(),
      };
    }

    // Create a default address first
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

    const addressRef = await addressesRef.add(addressData);

    // Update the address document with its ID
    await addressesRef.doc(addressRef.id).update({
      id: addressRef.id,
    });

    console.log("Created address with ID:", addressRef.id);

    // Create company profile
    const companyData = {
      id: userId,
      name,
      bio: "",
      email,
      banckAccountNo: "",
      imageURL: "",
      addressId: addressRef.id,
      phoneNumber: "",
      rate: 0,
      reviewCount: 0,
      passengerCount: 0,
      createdAt: getTimestamp(),
      lastLoginAt: getTimestamp(),
      authProvider,
    };

    console.log("Setting company document with ID:", userId);
    await companiesRef.doc(userId).set(companyData);
    console.log("Company document created successfully");

    // Log activity
    await logActivity("create", "company", userId);

    return {
      id: userId,
      ...companyData,
    };
  } catch (error) {
    console.error("Error creating company profile:", error);
    showMessage(`Error creating company profile: ${error.message}`, "error");
    throw error;
  }
}

// Fetch company profile
async function fetchCompanyProfile(userId) {
  try {
    const doc = await companiesRef.doc(userId).get();

    if (doc.exists) {
      const companyData = {
        id: doc.id,
        ...doc.data(),
      };

      // Update last login
      await companiesRef.doc(userId).update({
        lastLoginAt: getTimestamp(),
      });

      return companyData;
    } else {
      // If profile doesn't exist, create it
      console.log("No company profile found. Creating one...");

      // Get user info
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Create a default company profile
      return await createCompanyProfile(
        userId,
        "Company " + user.email.split("@")[0],
        user.email,
        user.providerData[0].providerId === "google.com" ? "google" : "email"
      );
    }
  } catch (error) {
    console.error("Error fetching company profile:", error);
    throw error;
  }
}

// Handle password reset request
function handlePasswordReset() {
  // Create a modal for password reset
  const modalContent = `
    <div class="password-reset-form">
      <h2>Reset Your Password</h2>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      <div class="input-group">
        <label for="reset-email">Email</label>
        <input type="email" id="reset-email" placeholder="Enter your email">
      </div>
      <div class="form-footer">
        <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
        <button type="button" class="primary-btn" id="send-reset-link">Send Reset Link</button>
      </div>
    </div>
  `;

  // Show the modal
  showModal("Reset Password", modalContent);

  // Pre-fill email if it's already entered in the login form
  const loginEmail = document.getElementById("email").value;
  if (loginEmail) {
    document.getElementById("reset-email").value = loginEmail;
  }

  // Add event listener to the send reset link button
  document
    .getElementById("send-reset-link")
    .addEventListener("click", async () => {
      const email = document.getElementById("reset-email").value.trim();

      if (!email) {
        showMessage("Please enter your email address", "error");
        return;
      }

      try {
        // Send password reset email
        await auth.sendPasswordResetEmail(email);

        // Hide the modal
        hideModal();

        // Show success message
        showMessage(
          "Password reset link sent! Check your email inbox.",
          "success"
        );
      } catch (error) {
        console.error("Error sending password reset email:", error);
        showMessage(`Error: ${error.message}`, "error");
      }
    });
}

// Show modal function
function showModal(title, content) {
  const modal = document.getElementById("modal");
  const modalTitle = document.createElement("h3");
  modalTitle.className = "modal-title";
  modalTitle.textContent = title;

  const modalBody = document.getElementById("modal-body");
  if (modalBody) {
    modalBody.innerHTML = "";
    modalBody.appendChild(modalTitle);
    modalBody.insertAdjacentHTML("beforeend", content);
  } else {
    console.error("Modal body element not found");
  }

  if (modal) {
    modal.classList.remove("hidden");

    // Add event listener to close button
    const closeBtn = document.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", hideModal);
    }
  } else {
    console.error("Modal element not found");
  }
}

// Hide modal function
function hideModal() {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.classList.add("hidden");
  } else {
    console.error("Modal element not found");
  }
}
