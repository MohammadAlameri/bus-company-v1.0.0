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
  switch (sectionId) {
    case "drivers":
      loadDrivers();
      break;
    case "trips":
      loadTrips();
      break;
    case "buses":
      loadBuses();
      break;
    case "appointments":
      loadAppointments();
      break;
    case "payments":
      loadPayments();
      break;
    case "reviews":
      loadReviews();
      break;
    case "working-hours":
      loadWorkingHours();
      break;
    case "company-profile":
      loadCompanyProfile();
      break;
    case "notifications":
      loadNotifications();
      break;
  }
}

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
