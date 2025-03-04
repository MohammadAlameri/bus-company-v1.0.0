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

      // Sign in the user
      const userCredential = await auth.signInWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

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
  });
}

// Google Login
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
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
        try {
          await createCompanyProfile(
            user.uid,
            "Company " + user.email.split("@")[0],
            user.email,
            "google"
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
      registerBtn.disabled = true;
      registerBtn.textContent = "Registering...";

      // Create user with email and password
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      // Create company profile
      showMessage("Creating company profile...", "info");
      await createCompanyProfile(user.uid, companyName, email, "email");

      // Fetch company profile
      const companyProfile = await fetchCompanyProfile(user.uid);
      setCurrentCompany(companyProfile);

      // Show dashboard
      showDashboard();

      // Initialize dashboard data
      initializeDashboard();

      showMessage("Registration successful!", "success");
    } catch (error) {
      console.error("Registration error:", error);
      showMessage(`Registration failed: ${error.message}`, "error");
      registerBtn.disabled = false;
      registerBtn.textContent = "Register";
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
      showMessage("Creating company profile...", "info");
      await createCompanyProfile(user.uid, companyName, user.email, "google");

      // Fetch company profile
      const companyProfile = await fetchCompanyProfile(user.uid);
      setCurrentCompany(companyProfile);

      // Show dashboard
      showDashboard();

      // Initialize dashboard data
      initializeDashboard();

      showMessage("Registration successful!", "success");
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
      clearCurrentCompany();

      // Show login view
      if (dashboardSection) dashboardSection.classList.add("hidden");
      if (loginSection) loginSection.classList.remove("hidden");
      if (registerSection) registerSection.classList.add("hidden");
    } catch (error) {
      console.error("Logout error:", error);
      showMessage(`Logout failed: ${error.message}`, "error");
    }
  });
}

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
    const addressRef = await addressesRef.add({
      latLon: null,
      streetName: "",
      streetNumber: "",
      city: "",
      district: "",
      country: "",
      nextTo: "",
    });

    console.log("Created address with ID:", addressRef.id);

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

// Authentication state change listener
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      console.log("User signed in:", user.uid);

      // Check if company profile exists
      const profileExists = await checkCompanyProfileExists(user.uid);
      console.log("Profile exists:", profileExists);

      if (profileExists) {
        // Fetch and set company profile
        const companyProfile = await fetchCompanyProfile(user.uid);
        setCurrentCompany(companyProfile);

        // Show dashboard
        showDashboard();

        // Initialize dashboard data
        initializeDashboard();
      } else {
        // Create company profile
        console.log("No profile exists, creating one...");
        const userName =
          user.displayName || "Company " + user.email.split("@")[0];
        const companyProfile = await createCompanyProfile(
          user.uid,
          userName,
          user.email,
          user.providerData[0].providerId === "google.com" ? "google" : "email"
        );

        // Set company profile and show dashboard
        setCurrentCompany(companyProfile);
        showDashboard();

        // Initialize dashboard data
        initializeDashboard();
      }
    } catch (error) {
      console.error("Error in auth state change:", error);
      showMessage(`Authentication error: ${error.message}`, "error");
    }
  } else {
    // User is signed out
    console.log("User signed out");
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
