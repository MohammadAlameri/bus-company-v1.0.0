// DOM Elements
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const dashboardSection = document.getElementById("dashboard-section");
const showRegisterLink = document.getElementById("show-register");
const showLoginLink = document.getElementById("show-login");
const loginBtn = document.getElementById("login-btn");
const googleLoginBtn = document.getElementById("google-login-btn");
const registerBtn = document.getElementById("register-btn");
const registerGoogleBtn = document.getElementById("register-google-btn");
const logoutBtn = document.getElementById("logout-btn");

// Show register form
if (showRegisterLink) {
  showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginSection.classList.add("hidden");
    registerSection.classList.remove("hidden");
  });
}

// Show login form
if (showLoginLink) {
  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    registerSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
  });
}

// Email Login
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showMessage("Please enter email and password", "error");
      return;
    }

    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Logging in...";

      await auth.signInWithEmailAndPassword(email, password);
      // Authentication state listener will handle redirection
    } catch (error) {
      console.error("Login error:", error);
      showMessage(`Login failed: ${error.message}`, "error");
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}

// Google Login
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    try {
      googleLoginBtn.disabled = true;

      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      // Authentication state listener will handle redirection
    } catch (error) {
      console.error("Google login error:", error);
      showMessage(`Google login failed: ${error.message}`, "error");
      googleLoginBtn.disabled = false;
    }
  });
}

// Email Registration
if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const companyName = document.getElementById("register-company").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById(
      "register-confirm-password"
    ).value;

    if (!companyName || !email || !password || !confirmPassword) {
      showMessage("Please fill in all fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    try {
      showLoader();

      // Create user in Firebase Authentication
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      // Create company document in Firestore
      await db.collection("companies").doc(user.uid).set({
        companyName: companyName,
        email: email,
        phoneNumber: "",
        address: "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        profileComplete: false,
      });

      // Log activity
      await logActivity("register", "company", user.uid);

      // Set the display name for the user
      await user.updateProfile({
        displayName: companyName,
      });

      hideLoader();
      showMessage("Registration successful!", "success");

      // Redirect after successful registration
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      hideLoader();
      console.error("Registration error:", error);
      showMessage(`Registration failed: ${error.message}`, "error");
    }
  });
}

// Google Registration
if (registerGoogleBtn) {
  registerGoogleBtn.addEventListener("click", async () => {
    const companyName = document.getElementById("register-company").value;

    if (!companyName) {
      showMessage("Please enter your company name", "error");
      return;
    }

    try {
      registerGoogleBtn.disabled = true;

      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await auth.signInWithPopup(provider);
      const user = userCredential.user;

      // Create company profile
      await createCompanyProfile(user.uid, companyName, user.email, "google");

      // Authentication state listener will handle redirection
    } catch (error) {
      console.error("Google registration error:", error);
      showMessage(`Google registration failed: ${error.message}`, "error");
      registerGoogleBtn.disabled = false;
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await auth.signOut();
      // Authentication state listener will handle redirection
    } catch (error) {
      console.error("Logout error:", error);
      showMessage(`Logout failed: ${error.message}`, "error");
    }
  });
}

// Create company profile
async function createCompanyProfile(userId, name, email, authProvider) {
  try {
    // Create a default address first
    const addressRef = await addressesRef.add({
      latLon: null,
      streetName: "",
      streetNumber: "",
      city: "",
      district: "",
      country: "",
      nextTo: "",
    });

    // Create company profile
    const companyData = {
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

    await companiesRef.doc(userId).set(companyData);

    // Log activity
    await logActivity("create", "company", userId);

    return {
      id: userId,
      ...companyData,
    };
  } catch (error) {
    console.error("Error creating company profile:", error);
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
      throw new Error("Company profile not found");
    }
  } catch (error) {
    console.error("Error fetching company profile:", error);
    throw error;
  }
}

// Authentication state change listener
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      // Check if company profile exists
      const profileExists = await checkCompanyProfileExists(user.uid);

      if (profileExists) {
        // Fetch and set company profile
        const companyProfile = await fetchCompanyProfile(user.uid);
        setCurrentCompany(companyProfile);

        // Show dashboard
        showDashboard();

        // Initialize dashboard data
        initializeDashboard();
      } else {
        // If no profile exists, show register view
        if (loginSection) loginSection.classList.add("hidden");
        if (registerSection) registerSection.classList.remove("hidden");

        // Pre-fill email if available
        if (user.email && document.getElementById("register-email")) {
          document.getElementById("register-email").value = user.email;
        }

        // Sign out temporarily until registration is complete
        await auth.signOut();
      }
    } catch (error) {
      console.error("Error in auth state change:", error);
      showMessage(`Authentication error: ${error.message}`, "error");
    }
  } else {
    // User is signed out
    clearCurrentCompany();

    // Show login view
    if (dashboardSection) dashboardSection.classList.add("hidden");
    if (loginSection) loginSection.classList.remove("hidden");
    if (registerSection) registerSection.classList.add("hidden");

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
});

// Check if company profile exists
async function checkCompanyProfileExists(userId) {
  try {
    const doc = await companiesRef.doc(userId).get();
    return doc.exists;
  } catch (error) {
    console.error("Error checking company profile:", error);
    return false;
  }
}

// Show dashboard
function showDashboard() {
  if (loginSection) loginSection.classList.add("hidden");
  if (registerSection) registerSection.classList.add("hidden");
  if (dashboardSection) dashboardSection.classList.remove("hidden");
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
    .message.hiding {
        opacity: 0;
        transform: translateY(-20px);
    }
`;
document.head.appendChild(style);
