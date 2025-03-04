// Initialize payments section
function loadPayments() {
  if (!currentCompany) return;

  // Update payments section content
  const paymentsSection = document.getElementById("payments-section");
  if (!paymentsSection) return;

  paymentsSection.innerHTML = `
        <div class="section-header">
            <h2>Payments Management</h2>
            <div class="section-actions">
                <button id="refresh-payments-btn" class="refresh-btn secondary-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </div>
        
        <div class="search-filter">
            <div class="search-input">
                <i class="fas fa-search"></i>
                <input type="text" id="payment-search" placeholder="Search payments...">
            </div>
            <div class="filter-controls">
                <select id="payment-filter">
                    <option value="all">All Payments</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                </select>
            </div>
        </div>
        
        <div class="payments-stats">
            <div class="payment-stat-card">
                <div class="stat-title">Total Revenue</div>
                <div class="stat-value" id="total-revenue">Loading...</div>
            </div>
            <div class="payment-stat-card">
                <div class="stat-title">Today's Revenue</div>
                <div class="stat-value" id="today-revenue">Loading...</div>
            </div>
            <div class="payment-stat-card">
                <div class="stat-title">Pending Payments</div>
                <div class="stat-value" id="pending-payments">Loading...</div>
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="payments-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Passenger</th>
                        <th>Trip</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="payments-table-body">
                    <tr>
                        <td colspan="8" style="text-align: center;">Loading payments data...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

  // Add event listeners
  const refreshPaymentsBtn = document.getElementById("refresh-payments-btn");
  if (refreshPaymentsBtn) {
    refreshPaymentsBtn.addEventListener("click", () => {
      showMessage("Refreshing payments data...", "info");
      fetchPayments();
    });
  }

  // Add search functionality
  const paymentSearch = document.getElementById("payment-search");
  if (paymentSearch) {
    paymentSearch.addEventListener("input", () => {
      filterPayments();
    });
  }

  // Add filter functionality
  const paymentFilter = document.getElementById("payment-filter");
  if (paymentFilter) {
    paymentFilter.addEventListener("change", () => {
      filterPayments();
    });
  }

  // Fetch payments data
  fetchPayments();
}

// Fetch payments data from Firestore
async function fetchPayments() {
  try {
    const paymentsTableBody = document.getElementById("payments-table-body");
    if (!paymentsTableBody) return;

    // Update UI to show loading
    paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center;">Loading payments data...</td>
        </tr>
    `;

    // Reset stats
    document.getElementById("total-revenue").textContent = "Loading...";
    document.getElementById("today-revenue").textContent = "Loading...";
    document.getElementById("pending-payments").textContent = "Loading...";

    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error("Current company information not available");
      paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center;">Error: Company information not available. Please try logging out and back in.</td>
        </tr>
      `;
      return;
    }

    console.log("Fetching payments for company ID:", currentCompany.id);

    // Get company trips first
    const trips = await getCompanyTrips();

    if (trips.length === 0) {
      paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center;">No payments found</td>
        </tr>
      `;
      updatePaymentStats([], trips);
      return;
    }

    // Get trip IDs
    const tripIds = trips.map((trip) => trip.id);

    // If there are too many trip IDs, we may need to chunk the query
    const chunkSize = 10; // Firestore 'in' query is limited to 10 items
    const tripIdChunks = [];

    for (let i = 0; i < tripIds.length; i += chunkSize) {
      tripIdChunks.push(tripIds.slice(i, i + chunkSize));
    }

    // Store all payments data
    window.allPayments = [];

    // Get all appointments for these trips first
    const appointments = [];

    // Process each chunk of trip IDs
    for (const chunk of tripIdChunks) {
      const appointmentsSnapshot = await appointmentsRef
        .where("tripId", "in", chunk)
        .get();

      if (!appointmentsSnapshot.empty) {
        appointmentsSnapshot.forEach((doc) => {
          appointments.push({
            id: doc.id,
            ...doc.data(),
          });
        });
      }
    }

    // Now get all payments for these appointments
    const paymentIds = appointments
      .filter((appt) => appt.paymentId)
      .map((appt) => appt.paymentId);

    if (paymentIds.length === 0) {
      paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center;">No payments found</td>
        </tr>
      `;
      updatePaymentStats([], trips);
      return;
    }

    // Process payments in chunks if necessary
    const paymentIdChunks = [];

    for (let i = 0; i < paymentIds.length; i += chunkSize) {
      paymentIdChunks.push(paymentIds.slice(i, i + chunkSize));
    }

    for (const chunk of paymentIdChunks) {
      const paymentsSnapshot = await paymentsRef
        .where(firebase.firestore.FieldPath.documentId(), "in", chunk)
        .get();

      if (!paymentsSnapshot.empty) {
        paymentsSnapshot.forEach((doc) => {
          const paymentData = {
            id: doc.id,
            ...doc.data(),
          };
          window.allPayments.push(paymentData);
        });
      }
    }

    // Sort payments by date
    window.allPayments.sort((a, b) => {
      const dateA = a.createdAt
        ? a.createdAt.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt)
        : new Date(0);
      const dateB = b.createdAt
        ? b.createdAt.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt)
        : new Date(0);
      return dateB - dateA;
    });

    if (window.allPayments.length === 0) {
      paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center;">No payments found</td>
        </tr>
      `;
      updatePaymentStats([], trips);
      return;
    }

    // Update payment stats
    updatePaymentStats(window.allPayments, trips);

    // Find appointment for each payment to get trip and passenger info
    for (const payment of window.allPayments) {
      const appointment = appointments.find((a) => a.paymentId === payment.id);
      if (appointment) {
        payment.appointment = appointment;
        payment.trip = trips.find((t) => t.id === appointment.tripId);
      }
    }

    // Clear table and add payments
    paymentsTableBody.innerHTML = "";

    // Process payments and add them to table
    const promises = window.allPayments.map(async (payment) => {
      try {
        // Get passenger details if not already fetched
        if (payment.appointment && payment.appointment.passengerId) {
          payment.passenger = await getPassengerDetails(
            payment.appointment.passengerId
          );
        }

        // Add to table
        addPaymentToTable(payment);
      } catch (error) {
        console.error("Error processing payment:", error);
      }
    });

    // Wait for all payments to be processed
    await Promise.all(promises);

    // Add event listeners to action buttons
    addPaymentActionListeners();

    console.log("Payments loaded successfully:", window.allPayments.length);
  } catch (error) {
    console.error("Error fetching payments:", error);

    const paymentsTableBody = document.getElementById("payments-table-body");
    if (paymentsTableBody) {
      paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center;">Error loading payments data: ${error.message}</td>
        </tr>
      `;
    }

    showMessage("Error loading payments data: " + error.message, "error");
  }
}

// Add payment to table
function addPaymentToTable(payment) {
  const paymentsTableBody = document.getElementById("payments-table-body");
  if (!paymentsTableBody) return;

  const tr = document.createElement("tr");
  tr.setAttribute("data-id", payment.id);

  // Format date
  const paymentDate = payment.createdAt
    ? payment.createdAt.toDate
      ? payment.createdAt.toDate()
      : new Date(payment.createdAt)
    : new Date();
  const formattedDate = paymentDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format amount
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(payment.amount || 0);

  // Get passenger name
  const passengerName = payment.passenger
    ? `${payment.passenger.firstName} ${payment.passenger.lastName}`
    : "Unknown";

  // Get trip info
  const tripInfo = payment.trip
    ? `${payment.trip.origin} to ${payment.trip.destination}`
    : "Unknown";

  // Get payment status
  const paymentStatus = payment.status || "pending";
  const statusClass =
    paymentStatus === "completed" ? "status-success" : "status-warning";

  tr.innerHTML = `
    <td>${payment.id.substring(0, 8)}...</td>
    <td>${passengerName}</td>
    <td>${tripInfo}</td>
    <td>${formattedAmount}</td>
    <td><span class="status-badge ${statusClass}">${paymentStatus}</span></td>
    <td>${formattedDate}</td>
    <td>${payment.method || "Unknown"}</td>
    <td>
      <div class="action-buttons">
        <button class="icon-btn view-payment-btn" data-id="${
          payment.id
        }" title="View Details">
          <i class="fas fa-eye"></i>
        </button>
        <button class="icon-btn download-receipt-btn" data-id="${
          payment.id
        }" title="Download Receipt">
          <i class="fas fa-file-download"></i>
        </button>
      </div>
    </td>
  `;

  paymentsTableBody.appendChild(tr);
}

// Add event listeners to payment action buttons
function addPaymentActionListeners() {
  // View payment details
  document.querySelectorAll(".view-payment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const paymentId = btn.getAttribute("data-id");
      showPaymentDetails(paymentId);
    });
  });

  // Download receipt
  document.querySelectorAll(".download-receipt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const paymentId = btn.getAttribute("data-id");
      downloadReceipt(paymentId);
    });
  });
}

// Filter payments based on search and filter values
function filterPayments() {
  if (!window.allPayments) return;

  const searchTerm = document
    .getElementById("payment-search")
    .value.toLowerCase();
  const filterValue = document.getElementById("payment-filter").value;

  const paymentsTableBody = document.getElementById("payments-table-body");
  if (!paymentsTableBody) return;

  // Clear table
  paymentsTableBody.innerHTML = "";

  // Filter payments
  const filteredPayments = window.allPayments.filter((payment) => {
    // Filter by status
    if (filterValue !== "all" && payment.status !== filterValue) {
      return false;
    }

    // Search by ID, passenger name, or trip info
    const passenger = payment.passenger
      ? `${payment.passenger.firstName} ${payment.passenger.lastName}`.toLowerCase()
      : "";

    const trip = payment.trip
      ? `${payment.trip.origin} ${payment.trip.destination}`.toLowerCase()
      : "";

    return (
      payment.id.toLowerCase().includes(searchTerm) ||
      passenger.includes(searchTerm) ||
      trip.includes(searchTerm)
    );
  });

  // Add filtered payments to table
  if (filteredPayments.length === 0) {
    paymentsTableBody.innerHTML = `
      <tr>
          <td colspan="8" style="text-align: center;">No payments match your search</td>
      </tr>
    `;
    return;
  }

  filteredPayments.forEach((payment) => {
    addPaymentToTable(payment);
  });

  // Re-add event listeners
  addPaymentActionListeners();
}

// Update payment stats
function updatePaymentStats(payments, trips) {
  // Calculate total revenue
  const totalRevenue = payments.reduce((total, payment) => {
    return total + (payment.status === "completed" ? payment.amount || 0 : 0);
  }, 0);

  // Calculate today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRevenue = payments.reduce((total, payment) => {
    const paymentDate = payment.createdAt
      ? payment.createdAt.toDate
        ? payment.createdAt.toDate()
        : new Date(payment.createdAt)
      : new Date();

    paymentDate.setHours(0, 0, 0, 0);

    return (
      total +
      (payment.status === "completed" &&
      paymentDate.getTime() === today.getTime()
        ? payment.amount || 0
        : 0)
    );
  }, 0);

  // Count pending payments
  const pendingPayments = payments.filter((p) => p.status === "pending").length;

  // Update stats in UI
  document.getElementById("total-revenue").textContent = new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  ).format(totalRevenue);

  document.getElementById("today-revenue").textContent = new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  ).format(todayRevenue);

  document.getElementById("pending-payments").textContent = pendingPayments;
}

// Show payment details in modal
function showPaymentDetails(paymentId) {
  const payment = window.allPayments.find((p) => p.id === paymentId);
  if (!payment) {
    showMessage("Payment not found", "error");
    return;
  }

  // Format date
  const paymentDate = payment.createdAt
    ? payment.createdAt.toDate
      ? payment.createdAt.toDate()
      : new Date(payment.createdAt)
    : new Date();
  const formattedDate = paymentDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format amount
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(payment.amount || 0);

  // Get passenger info
  const passengerName = payment.passenger
    ? `${payment.passenger.firstName} ${payment.passenger.lastName}`
    : "Unknown";

  const passengerPhone = payment.passenger
    ? payment.passenger.phoneNumber
    : "N/A";
  const passengerEmail = payment.passenger ? payment.passenger.email : "N/A";

  // Get trip info
  const tripInfo = payment.trip
    ? `${payment.trip.origin} to ${payment.trip.destination}`
    : "Unknown";

  const tripDate =
    payment.trip && payment.trip.date
      ? (payment.trip.date.toDate
          ? payment.trip.date.toDate()
          : new Date(payment.trip.date)
        ).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown";

  // Create modal content
  const modalContent = `
    <div class="payment-details">
      <div class="detail-row">
        <div class="detail-label">Payment ID</div>
        <div class="detail-value">${payment.id}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Amount</div>
        <div class="detail-value">${formattedAmount}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Status</div>
        <div class="detail-value">
          <span class="status-badge ${
            payment.status === "completed" ? "status-success" : "status-warning"
          }">
            ${payment.status || "pending"}
          </span>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Payment Date</div>
        <div class="detail-value">${formattedDate}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Payment Method</div>
        <div class="detail-value">${payment.method || "Unknown"}</div>
      </div>
      
      <div class="detail-section">
        <h4>Passenger Information</h4>
        <div class="detail-row">
          <div class="detail-label">Name</div>
          <div class="detail-value">${passengerName}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Phone</div>
          <div class="detail-value">${passengerPhone}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Email</div>
          <div class="detail-value">${passengerEmail}</div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Trip Information</h4>
        <div class="detail-row">
          <div class="detail-label">Route</div>
          <div class="detail-value">${tripInfo}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Trip Date</div>
          <div class="detail-value">${tripDate}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Seat Number</div>
          <div class="detail-value">${
            payment.appointment ? payment.appointment.seatNumber : "N/A"
          }</div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="outline-btn" onclick="hideModal()">Close</button>
        <button type="button" class="primary-btn" onclick="downloadReceipt('${
          payment.id
        }')">
          <i class="fas fa-file-download"></i> Download Receipt
        </button>
      </div>
    </div>
  `;

  showModal("Payment Details", modalContent);
}

// Download receipt as PDF
function downloadReceipt(paymentId) {
  const payment = window.allPayments.find((p) => p.id === paymentId);
  if (!payment) {
    showMessage("Payment not found", "error");
    return;
  }

  // Show message for now since PDF generation requires a library
  showMessage(
    "Receipt download functionality will be implemented in a future update",
    "info"
  );
}

// Get passenger details
async function getPassengerDetails(passengerId) {
  try {
    if (!passengerId) return null;

    const doc = await passengersRef.doc(passengerId).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting passenger details:", error);
    return null;
  }
}

// Get company trips
async function getCompanyTrips() {
  try {
    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error(
        "Current company information not available for getCompanyTrips"
      );
      return [];
    }

    console.log("Getting trips for company ID:", currentCompany.id);

    const snapshot = await tripsRef
      .where("companyId", "==", currentCompany.id)
      .get();

    const trips = [];
    snapshot.forEach((doc) => {
      trips.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return trips;
  } catch (error) {
    console.error("Error getting company trips:", error);
    return [];
  }
}

// Add styles for payments section
const paymentStyles = document.createElement("style");
paymentStyles.textContent = `
    .payments-stats {
        display: flex;
        justify-content: space-between;
        margin: 20px 0;
    }
    
    .payment-stat-card {
        background-color: var(--white);
        border-radius: 10px;
        padding: 20px;
        width: 32%;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .stat-title {
        font-size: 0.9rem;
        color: var(--gray);
        margin-bottom: 10px;
    }
    
    .stat-value {
        font-size: 1.8rem;
        font-weight: bold;
        color: var(--dark);
    }
    
    .payment-details {
        padding: 10px;
    }
    
    .detail-row {
        display: flex;
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .detail-label {
        width: 150px;
        font-weight: 500;
        color: #666;
    }
    
    .detail-value {
        flex: 1;
    }
    
    .detail-section {
        margin-top: 20px;
    }
    
    .detail-section h4 {
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #e0e0e0;
        color: #333;
    }
    
    .modal-footer {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    
    @media (max-width: 768px) {
        .payments-stats {
            flex-direction: column;
            gap: 15px;
        }
        
        .payment-stat-card {
            width: 100%;
        }
        
        .detail-row {
            flex-direction: column;
        }
        
        .detail-label {
            width: 100%;
            margin-bottom: 5px;
        }
    }
`;
document.head.appendChild(paymentStyles);
