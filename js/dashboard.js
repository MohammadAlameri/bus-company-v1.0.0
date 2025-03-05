// DOM Elements
const menuItems = document.querySelectorAll(".menu-item");
const dashboardSections = document.querySelectorAll(".dashboard-section");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const closeModalBtn = document.querySelector(".close-btn");

// Initialize dashboard
function initializeDashboard() {
  console.log("Initializing dashboard");

  // Check if we have the currentCompany available
  if (!currentCompany || !currentCompany.id) {
    console.error(
      "Cannot initialize dashboard: No company information available"
    );
    return;
  }

  // Set company name in header
  if (document.getElementById("company-name")) {
    document.getElementById("company-name").textContent = currentCompany.name;
  }

  // Load dashboard data
  loadDashboardCounts();
  initializeCharts();
  loadRecentActivities();

  // Get all menu items and dashboard sections
  const menuItems = document.querySelectorAll(".menu-item");
  const dashboardSections = document.querySelectorAll(".dashboard-section");

  // Set default active section (first one)
  if (menuItems.length > 0 && dashboardSections.length > 0) {
    menuItems[0].classList.add("active");
    dashboardSections[0].classList.remove("hidden");
  }

  console.log("Dashboard initialized successfully");
}

// Load dashboard counts
async function loadDashboardCounts() {
  try {
    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error(
        "Current company information not available for dashboard counts"
      );
      showMessage(
        "Unable to load dashboard data: Company information not available",
        "error"
      );
      return;
    }

    console.log("Loading dashboard counts for company ID:", currentCompany.id);

    // Load counts
    const driversCount = await countDrivers();
    const tripsCount = await countActiveTrips();
    const busesCount = await countBuses();
    const passengersCount = await countPassengers();

    // Update UI
    document.getElementById("drivers-count").textContent = driversCount;
    document.getElementById("trips-count").textContent = tripsCount;
    document.getElementById("buses-count").textContent = busesCount;
    document.getElementById("passengers-count").textContent = passengersCount;
  } catch (error) {
    console.error("Error loading dashboard counts:", error);
    showMessage("Error loading dashboard data: " + error.message, "error");
  }
}

// Count drivers
async function countDrivers() {
  try {
    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error(
        "Current company information not available for counting drivers"
      );
      return 0;
    }

    // Query drivers for this company
    const snapshot = await driversRef
      .where("companyId", "==", currentCompany.id)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error("Error counting drivers:", error);
    return 0;
  }
}

// Count active trips
async function countActiveTrips() {
  try {
    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error(
        "Current company information not available for counting trips"
      );
      return 0;
    }

    // Get current date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query upcoming/active trips for this company
    const snapshot = await tripsRef
      .where("companyId", "==", currentCompany.id)
      .where("date", ">=", today)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error("Error counting active trips:", error);
    return 0;
  }
}

// Count buses
async function countBuses() {
  try {
    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error(
        "Current company information not available for counting buses"
      );
      return 0;
    }

    // Query vehicles for this company
    const snapshot = await vehiclesRef
      .where("companyId", "==", currentCompany.id)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error("Error counting buses:", error);
    return 0;
  }
}

// Count passengers
async function countPassengers() {
  try {
    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error(
        "Current company information not available for counting passengers"
      );
      return 0;
    }

    // Get trip IDs for this company
    const tripsSnapshot = await tripsRef
      .where("companyId", "==", currentCompany.id)
      .get();

    if (tripsSnapshot.empty) {
      return 0;
    }

    const tripIds = [];
    tripsSnapshot.forEach((doc) => {
      tripIds.push(doc.id);
    });

    // For large number of trips, we might need to break up the query
    // Firestore 'in' query supports maximum 10 values
    let passengerCount = 0;

    // Process tripIds in chunks of 10
    for (let i = 0; i < tripIds.length; i += 10) {
      const chunk = tripIds.slice(i, i + 10);
      if (chunk.length === 0) continue;

      // Query appointments for these trips
      const appointmentsSnapshot = await appointmentsRef
        .where("tripId", "in", chunk)
        .get();

      passengerCount += appointmentsSnapshot.size;
    }

    return passengerCount;
  } catch (error) {
    console.error("Error counting passengers:", error);
    return 0;
  }
}

// Initialize charts
function initializeCharts() {
  // Initialize bookings chart
  initializeBookingsChart();

  // Initialize revenue chart
  initializeRevenueChart();
}

// Initialize bookings chart
async function initializeBookingsChart() {
  try {
    // Get bookings data for last 7 days
    const bookingsData = await getBookingsData();

    // Create chart
    const ctx = document.getElementById("bookings-chart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: bookingsData.labels,
        datasets: [
          {
            label: "Bookings",
            data: bookingsData.data,
            backgroundColor: "rgba(52, 152, 219, 0.2)",
            borderColor: "rgba(52, 152, 219, 1)",
            borderWidth: 2,
            tension: 0.3,
            pointBackgroundColor: "rgba(52, 152, 219, 1)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error initializing bookings chart:", error);
  }
}

// Initialize revenue chart
async function initializeRevenueChart() {
  try {
    // Get revenue data for last 7 days
    const revenueData = await getRevenueData();

    // Create chart
    const ctx = document.getElementById("revenue-chart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: revenueData.labels,
        datasets: [
          {
            label: "Revenue",
            data: revenueData.data,
            backgroundColor: "rgba(46, 204, 113, 0.2)",
            borderColor: "rgba(46, 204, 113, 1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "$" + value;
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "$" + context.raw;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error initializing revenue chart:", error);
  }
}

// Get bookings data for last 7 days
async function getBookingsData() {
  try {
    const labels = [];
    const data = [];

    // Create date labels for last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      labels.push(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );

      // Set initial data to 0
      data.push(0);
    }

    // Get start date (7 days ago)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    // Query appointments for last 7 days
    const snapshot = await appointmentsRef
      .where("companyId", "==", currentCompany.id)
      .where("createdAt", ">=", startDate)
      .get();

    // Count appointments per day
    snapshot.forEach((doc) => {
      const appointmentData = doc.data();
      const createdAt = appointmentData.createdAt?.toDate();

      if (createdAt) {
        const dayIndex = Math.floor(
          (createdAt - startDate) / (24 * 60 * 60 * 1000)
        );
        if (dayIndex >= 0 && dayIndex < 7) {
          data[dayIndex]++;
        }
      }
    });

    return { labels, data };
  } catch (error) {
    console.error("Error getting bookings data:", error);
    return { labels: [], data: [] };
  }
}

// Get revenue data for last 7 days
async function getRevenueData() {
  try {
    const labels = [];
    const data = [];

    // Create date labels for last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      labels.push(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );

      // Set initial data to 0
      data.push(0);
    }

    // Get start date (7 days ago)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    // Query payments for last 7 days
    const snapshot = await paymentsRef
      .where("companyId", "==", currentCompany.id)
      .where("createdAt", ">=", startDate)
      .where("paymentStatus", "==", "completed")
      .get();

    // Sum payments per day
    snapshot.forEach((doc) => {
      const paymentData = doc.data();
      const createdAt = paymentData.createdAt?.toDate();

      if (createdAt) {
        const dayIndex = Math.floor(
          (createdAt - startDate) / (24 * 60 * 60 * 1000)
        );
        if (dayIndex >= 0 && dayIndex < 7) {
          data[dayIndex] += paymentData.amount || 0;
        }
      }
    });

    return { labels, data };
  } catch (error) {
    console.error("Error getting revenue data:", error);
    return { labels: [], data: [] };
  }
}

// Load recent activities
async function loadRecentActivities() {
  try {
    const activityList = document.getElementById("activity-list");
    if (!activityList) return;

    // Clear current activities
    activityList.innerHTML = "";

    // Query recent activities
    const snapshot = await db
      .collection("activityLogs")
      .where("companyId", "==", currentCompany.id)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    if (snapshot.empty) {
      activityList.innerHTML = "<p>No recent activities</p>";
      return;
    }

    // Create activity items
    snapshot.forEach((doc) => {
      const activityData = doc.data();
      const activityTime = activityData.timestamp?.toDate() || new Date();

      // Create activity item
      const activityItem = document.createElement("div");
      activityItem.className = "activity-item";

      // Create activity icon based on action type
      const iconClass = getActivityIcon(
        activityData.action,
        activityData.entityType
      );

      // Create activity content
      activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${formatActivityTitle(
                      activityData.action,
                      activityData.entityType
                    )}</div>
                    <div class="activity-time">${formatTimeAgo(
                      activityTime
                    )}</div>
                </div>
            `;

      activityList.appendChild(activityItem);
    });
  } catch (error) {
    console.error("Error loading recent activities:", error);
  }
}

// Get activity icon
function getActivityIcon(action, entityType) {
  switch (entityType) {
    case "driver":
      return "fas fa-id-card";
    case "trip":
      return "fas fa-route";
    case "vehicle":
    case "bus":
      return "fas fa-bus-alt";
    case "appointment":
      return "fas fa-calendar-check";
    case "payment":
      return "fas fa-money-bill-wave";
    case "review":
      return "fas fa-star";
    case "workingHours":
    case "timeOff":
      return "fas fa-clock";
    case "company":
      return "fas fa-building";
    case "notification":
      return "fas fa-bell";
    default:
      return "fas fa-info-circle";
  }
}

// Format activity title
function formatActivityTitle(action, entityType) {
  let entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  switch (action) {
    case "create":
      return `New ${entityName} created`;
    case "update":
      return `${entityName} updated`;
    case "delete":
      return `${entityName} deleted`;
    case "approve":
      return `${entityName} approved`;
    case "reject":
      return `${entityName} rejected`;
    default:
      return `${action} ${entityName}`;
  }
}

// Format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Document ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("Dashboard.js: Document ready");

  // Initialize dashboard if user is already logged in
  if (currentCompany) {
    console.log("Dashboard.js: Current company found, initializing dashboard");
    initializeDashboard();
  } else {
    console.log("Dashboard.js: No current company, waiting for auth");
  }

  // Add event listeners to menu items
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      const sectionId = this.getAttribute("data-section");

      // Remove active class from all menu items and sections
      document
        .querySelectorAll(".menu-item")
        .forEach((i) => i.classList.remove("active"));
      document
        .querySelectorAll(".dashboard-section")
        .forEach((s) => s.classList.add("hidden"));

      // Add active class to clicked menu item and show corresponding section
      this.classList.add("active");
      const section = document.getElementById(`${sectionId}-section`);
      if (section) {
        section.classList.remove("hidden");

        // Load section data if needed
        loadSectionData(sectionId);
      }
    });
  });
});

// Load section data
function loadSectionData(sectionId) {
  console.log(`Loading section data for: ${sectionId}`);
  try {
    switch (sectionId) {
      case "overview":
        // Already loaded on dashboard initialization
        break;
      case "drivers":
        if (typeof loadDrivers === "function") {
          loadDrivers();
        } else {
          console.error("loadDrivers function not defined");
          showMessage("Driver management module not loaded properly", "error");
        }
        break;
      case "trips":
        if (typeof loadTrips === "function") {
          loadTrips();
        } else {
          console.error("loadTrips function not defined");
          showMessage("Trip management module not loaded properly", "error");
        }
        break;
      case "buses":
        if (typeof loadBuses === "function") {
          loadBuses();
        } else {
          console.error("loadBuses function not defined");
          showMessage("Bus management module not loaded properly", "error");
        }
        break;
      case "appointments":
        if (typeof loadAppointments === "function") {
          loadAppointments();
        } else {
          console.error("loadAppointments function not defined");
          showMessage("Appointments module not loaded properly", "error");
        }
        break;
      case "payments":
        if (typeof loadPayments === "function") {
          loadPayments();
        } else {
          showPlaceholderSection("payments-section", "Payments Management");
        }
        break;
      case "reviews":
        if (typeof loadReviews === "function") {
          loadReviews();
        } else {
          showPlaceholderSection("reviews-section", "Reviews Management");
        }
        break;
      case "working-hours":
        if (typeof loadWorkingHours === "function") {
          loadWorkingHours();
        } else {
          showPlaceholderSection(
            "working-hours-section",
            "Working Hours Management"
          );
        }
        break;
      case "company-profile":
        if (typeof loadCompanyProfile === "function") {
          loadCompanyProfile();
        } else {
          showPlaceholderSection(
            "company-profile-section",
            "Company Profile Management"
          );
        }
        break;
      case "notifications":
        if (typeof loadNotifications === "function") {
          loadNotifications();
        } else {
          showPlaceholderSection(
            "notifications-section",
            "Notifications Management"
          );
        }
        break;
      default:
        console.log(`No loader for section: ${sectionId}`);
    }
  } catch (error) {
    console.error(`Error loading section ${sectionId}:`, error);
    showMessage(
      `Error loading ${sectionId} section: ${error.message}`,
      "error"
    );
  }
}

// Show placeholder section with "Coming Soon" message
function showPlaceholderSection(sectionId, title) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.innerHTML = `
        <div class="section-header">
            <h2>${title}</h2>
            <button class="refresh-btn primary-btn" onclick="loadSectionData('${sectionId.replace(
              "-section",
              ""
            )}')">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
        </div>
        
        <div class="placeholder-content">
            <div class="coming-soon">
                <i class="fas fa-tools"></i>
                <h3>Coming Soon</h3>
                <p>This feature is currently under development and will be available soon.</p>
            </div>
        </div>
    `;
}

// Add styles for placeholder sections
const placeholderStyles = document.createElement("style");
placeholderStyles.textContent = `
    .placeholder-content {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 70vh;
    }
    
    .coming-soon {
        text-align: center;
        padding: 2rem;
        background-color: var(--light-gray);
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 80%;
    }
    
    .coming-soon i {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
    }
    
    .coming-soon h3 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        color: var(--dark);
    }
    
    .coming-soon p {
        color: var(--gray);
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
document.head.appendChild(placeholderStyles);

// Modal functions
function showModal(title, content) {
  if (!modal || !modalBody) return;

  // Set modal title and content
  modalBody.innerHTML = `
        <div class="form-header">
            <h2>${title}</h2>
        </div>
        ${content}
    `;

  // Show modal
  modal.classList.remove("hidden");
}

function hideModal() {
  if (!modal) return;

  // Hide modal
  modal.classList.add("hidden");

  // Clear modal content
  if (modalBody) {
    modalBody.innerHTML = "";
  }
}

// Close modal button click handler
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", hideModal);
}

// Close modal when clicking outside
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });
}

// Handle errors
window.addEventListener("error", (e) => {
  console.error("Global error:", e.error);
  showMessage(`An error occurred: ${e.message}`, "error");
});

// Add a button to the dashboard to run the ID update process
function addUpdateIdsButton() {
  // Check if we already have a settings section in the sidebar
  let settingsItem = document.querySelector(
    '.menu-item[data-section="settings"]'
  );

  // If not, create one
  if (!settingsItem) {
    const sidebarMenu = document.querySelector(".sidebar-menu");

    if (sidebarMenu) {
      // Create settings menu item
      settingsItem = document.createElement("li");
      settingsItem.className = "menu-item";
      settingsItem.setAttribute("data-section", "settings");
      settingsItem.innerHTML = `
        <i class="fas fa-cog"></i>
        <span>Settings</span>
      `;

      // Add it to the sidebar
      sidebarMenu.appendChild(settingsItem);

      // Create settings section in main content
      const content = document.querySelector(".content");
      if (content) {
        const settingsSection = document.createElement("section");
        settingsSection.id = "settings-section";
        settingsSection.className = "dashboard-section hidden";
        settingsSection.innerHTML = `
          <h2>System Settings</h2>
          <div class="settings-container">
            <div class="settings-card">
              <h3>Database Maintenance</h3>
              <p>Update all existing documents to include their ID as a field. This helps with data consistency.</p>
              <button id="update-ids-btn" class="primary-btn">
                <i class="fas fa-database"></i> Update Document IDs
              </button>
              <div id="update-progress" class="update-progress hidden">
                <div class="progress-bar">
                  <div class="progress-bar-inner"></div>
                </div>
                <p id="update-status">Processing...</p>
              </div>
            </div>
          </div>
        `;

        content.appendChild(settingsSection);

        // Add click event to the settings menu item
        settingsItem.addEventListener("click", function () {
          // Hide all sections
          const sections = document.querySelectorAll(".dashboard-section");
          sections.forEach((section) => section.classList.add("hidden"));

          // Remove active class from all menu items
          const menuItems = document.querySelectorAll(".menu-item");
          menuItems.forEach((item) => item.classList.remove("active"));

          // Show settings section and set this item as active
          document
            .getElementById("settings-section")
            .classList.remove("hidden");
          this.classList.add("active");
        });

        // Add event listener to the update IDs button
        document
          .getElementById("update-ids-btn")
          .addEventListener("click", async function () {
            try {
              // Disable the button
              this.disabled = true;

              // Show progress
              const progressDiv = document.getElementById("update-progress");
              progressDiv.classList.remove("hidden");

              // Update status
              document.getElementById("update-status").textContent =
                "Updating documents...";

              // Run the update function
              const result = await window.updateAllDocumentsWithIds();

              // Update status with results
              document.getElementById("update-status").innerHTML = `
              Update complete.<br>
              Companies: ${result.companiesCount}<br>
              Addresses: ${result.addressesCount}<br>
              Drivers: ${result.driversCount}<br>
              Vehicles: ${result.vehiclesCount}<br>
              Appointments: ${result.appointmentsCount}<br>
              Trips: ${result.tripsCount}<br>
              Passengers: ${result.passengersCount}<br>
              Payments: ${result.paymentsCount}<br>
              Reviews: ${result.reviewsCount}<br>
              Working Hours: ${result.workingHoursCount}<br>
              Time Offs: ${result.timeOffsCount}<br>
              Notifications: ${result.notificationsCount}<br>
              <strong>Total: ${result.totalCount} documents updated</strong>
            `;

              // Re-enable the button
              this.disabled = false;

              // Show success message
              showMessage("Documents updated successfully", "success");
            } catch (error) {
              console.error("Error updating documents:", error);
              document.getElementById(
                "update-status"
              ).textContent = `Error: ${error.message}`;
              showMessage(
                `Error updating documents: ${error.message}`,
                "error"
              );

              // Re-enable the button
              this.disabled = false;
            }
          });
      }
    }
  }
}

// Call this function after the dashboard is initialized
document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit to ensure the dashboard is fully loaded
  setTimeout(addUpdateIdsButton, 1000);
});
