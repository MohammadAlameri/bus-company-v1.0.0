// Initialize appointments section
function loadAppointments() {
  if (!currentCompany) return;

  // Update appointments section content
  const appointmentsSection = document.getElementById("appointments-section");
  if (!appointmentsSection) return;

  appointmentsSection.innerHTML = `
        <div class="section-header">
            <h2>Appointments Management</h2>
        </div>
        
        <div class="search-filter">
            <div class="search-input">
                <i class="fas fa-search"></i>
                <input type="text" id="appointment-search" placeholder="Search appointments...">
            </div>
            <div class="filter-controls">
                <select id="appointment-filter">
                    <option value="all">All Appointments</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="appointments-table">
                <thead>
                    <tr>
                        <th>Trip</th>
                        <th>Passenger</th>
                        <th>Seat</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="appointments-table-body">
                    <tr>
                        <td colspan="7" style="text-align: center;">Loading appointments...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

  // Add event listener to search input
  const appointmentSearch = document.getElementById("appointment-search");
  if (appointmentSearch) {
    appointmentSearch.addEventListener("input", () => {
      const searchTerm = appointmentSearch.value.toLowerCase();
      filterAppointments(searchTerm);
    });
  }

  // Add event listener to filter select
  const appointmentFilter = document.getElementById("appointment-filter");
  if (appointmentFilter) {
    appointmentFilter.addEventListener("change", () => {
      const filterValue = appointmentFilter.value;
      const searchTerm = appointmentSearch
        ? appointmentSearch.value.toLowerCase()
        : "";
      filterAppointments(searchTerm, filterValue);
    });
  }

  // Fetch appointments
  fetchAppointments();
}

// Fetch appointments
async function fetchAppointments() {
  try {
    const appointmentsTableBody = document.getElementById(
      "appointments-table-body"
    );
    if (!appointmentsTableBody) return;

    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error("Current company information not available");
      appointmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Error: Company information not available. Please try logging out and back in.</td>
                </tr>
            `;
      return;
    }

    console.log("Fetching appointments for company ID:", currentCompany.id);

    // Get company trips
    const trips = await getCompanyTrips();

    if (trips.length === 0) {
      appointmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">No appointments found</td>
                </tr>
            `;
      return;
    }

    // Get trip IDs
    const tripIds = trips.map((trip) => trip.id);

    // Query appointments for these trips
    const snapshot = await appointmentsRef
      .where("tripId", "in", tripIds)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      appointmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">No appointments found</td>
                </tr>
            `;
      return;
    }

    // Create table rows
    appointmentsTableBody.innerHTML = "";

    // Store all appointment data for filtering
    window.allAppointments = [];

    const promises = [];

    snapshot.forEach((doc) => {
      const appointmentData = {
        id: doc.id,
        ...doc.data(),
      };

      window.allAppointments.push(appointmentData);

      // Find trip data
      const trip = trips.find((t) => t.id === appointmentData.tripId);
      if (trip) {
        appointmentData.tripDetails = trip;
      }

      // Fetch passenger and payment details
      const promise = Promise.all([
        getPassengerDetails(appointmentData.passengerId),
        getPaymentDetails(appointmentData.paymentId),
      ])
        .then(([passengerDetails, paymentDetails]) => {
          appointmentData.passengerDetails = passengerDetails;
          appointmentData.paymentDetails = paymentDetails;
          addAppointmentToTable(appointmentData);
        })
        .catch((error) => {
          console.error("Error fetching appointment details:", error);
          addAppointmentToTable(appointmentData);
        });

      promises.push(promise);
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    // Add event listeners to action buttons
    addAppointmentActionListeners();
  } catch (error) {
    console.error("Error fetching appointments:", error);

    const appointmentsTableBody = document.getElementById(
      "appointments-table-body"
    );
    if (appointmentsTableBody) {
      appointmentsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Error loading appointments data: ${error.message}</td>
                </tr>
            `;
    }

    showMessage("Error loading appointments data: " + error.message, "error");
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

// Get payment details
async function getPaymentDetails(paymentId) {
  try {
    if (!paymentId) return null;

    const doc = await paymentsRef.doc(paymentId).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting payment details:", error);
    return null;
  }
}

// Add appointment to table
function addAppointmentToTable(appointment) {
  const appointmentsTableBody = document.getElementById(
    "appointments-table-body"
  );
  if (!appointmentsTableBody) return;

  // Get trip info
  let tripInfo = "Unknown Trip";
  if (appointment.tripDetails) {
    tripInfo = `${appointment.tripDetails.fromCity} to ${appointment.tripDetails.toCity}`;
  }

  // Get passenger info
  const passengerName = appointment.passengerDetails
    ? appointment.passengerDetails.name
    : "Unknown Passenger";

  // Format date
  let formattedDate = "N/A";
  if (appointment.createdAt) {
    const date = appointment.createdAt.toDate
      ? appointment.createdAt.toDate()
      : new Date(appointment.createdAt);
    formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Format payment status
  let paymentStatus = "No Payment";
  if (appointment.paymentDetails) {
    paymentStatus =
      appointment.paymentDetails.paymentStatus === "completed"
        ? `Paid ${appointment.paymentDetails.amount} ${appointment.paymentDetails.currency}`
        : "Payment Pending";
  }

  // Format appointment status
  const statusClass = getStatusClass(appointment.appointmentStatus);
  const statusText = appointment.appointmentStatus || "Pending";

  // Create table row
  const tr = document.createElement("tr");
  tr.setAttribute("data-id", appointment.id);
  tr.setAttribute("data-status", appointment.appointmentStatus || "pending");

  tr.innerHTML = `
        <td>${tripInfo}</td>
        <td>${passengerName}</td>
        <td>${appointment.seatNumber || "N/A"}</td>
        <td>${formattedDate}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${paymentStatus}</td>
        <td>
            <div class="table-actions">
                <button class="view-btn" data-id="${appointment.id}">
                    <i class="fas fa-eye"></i>
                </button>
                ${
                  appointment.appointmentStatus === "pending"
                    ? `
                <button class="approve-btn" data-id="${appointment.id}">
                    <i class="fas fa-check"></i>
                </button>
                <button class="reject-btn" data-id="${appointment.id}">
                    <i class="fas fa-times"></i>
                </button>
                `
                    : ""
                }
            </div>
        </td>
    `;

  appointmentsTableBody.appendChild(tr);
}

// Get status class for styling
function getStatusClass(status) {
  switch (status) {
    case "approved":
      return "status-approved";
    case "rejected":
      return "status-rejected";
    default:
      return "status-pending";
  }
}

// Add event listeners to appointment action buttons
function addAppointmentActionListeners() {
  // View buttons
  const viewButtons = document.querySelectorAll(
    "#appointments-table .view-btn"
  );
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentId = button.getAttribute("data-id");
      showAppointmentDetails(appointmentId);
    });
  });

  // Approve buttons
  const approveButtons = document.querySelectorAll(
    "#appointments-table .approve-btn"
  );
  approveButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentId = button.getAttribute("data-id");
      confirmApproveAppointment(appointmentId);
    });
  });

  // Reject buttons
  const rejectButtons = document.querySelectorAll(
    "#appointments-table .reject-btn"
  );
  rejectButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentId = button.getAttribute("data-id");
      confirmRejectAppointment(appointmentId);
    });
  });
}

// Filter appointments
function filterAppointments(searchTerm = "", filterValue = "all") {
  const rows = document.querySelectorAll("#appointments-table-body tr");

  rows.forEach((row) => {
    // Skip rows with colspan (like "No appointments found")
    if (row.cells.length <= 2) return;

    const tripInfo = row.cells[0].textContent.toLowerCase();
    const passengerName = row.cells[1].textContent.toLowerCase();
    const date = row.cells[3].textContent.toLowerCase();

    // Check search term match
    const matchesSearch =
      !searchTerm ||
      tripInfo.includes(searchTerm) ||
      passengerName.includes(searchTerm) ||
      date.includes(searchTerm);

    // Check filter match
    let matchesFilter = true;
    if (filterValue !== "all") {
      const rowStatus = row.getAttribute("data-status");
      matchesFilter = rowStatus === filterValue;
    }

    // Show/hide row based on matches
    if (matchesSearch && matchesFilter) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

// Show appointment details
async function showAppointmentDetails(appointmentId) {
  try {
    const appointment = window.allAppointments.find(
      (a) => a.id === appointmentId
    );

    if (!appointment) {
      showMessage("Appointment not found", "error");
      return;
    }

    // Format date
    let formattedDate = "N/A";
    if (appointment.createdAt) {
      const date = appointment.createdAt.toDate
        ? appointment.createdAt.toDate()
        : new Date(appointment.createdAt);
      formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Get passenger details
    const passenger = appointment.passengerDetails || {};

    // Get trip details
    const trip = appointment.tripDetails || {};

    // Get payment details
    const payment = appointment.paymentDetails || {};

    // Format passenger details
    const passengerDetails = `
            <p><strong>Name:</strong> ${passenger.name || "N/A"}</p>
            <p><strong>Email:</strong> ${passenger.email || "N/A"}</p>
            <p><strong>Phone:</strong> ${passenger.phoneNumber || "N/A"}</p>
            <p><strong>Gender:</strong> ${passenger.gender || "N/A"}</p>
            <p><strong>Nationality:</strong> ${
              passenger.nationalityCountry || "N/A"
            }</p>
        `;

    // Format trip details
    const tripDate = trip.date
      ? new Date(
          trip.date.toDate ? trip.date.toDate() : trip.date
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    const departureTime = trip.departureTime
      ? `${trip.departureTime.hour}:${trip.departureTime.minute
          .toString()
          .padStart(2, "0")}`
      : "N/A";

    const arrivalTime = trip.arrivalTime
      ? `${trip.arrivalTime.hour}:${trip.arrivalTime.minute
          .toString()
          .padStart(2, "0")}`
      : "N/A";

    const tripDetails = `
            <p><strong>From:</strong> ${trip.fromCity || "N/A"}</p>
            <p><strong>To:</strong> ${trip.toCity || "N/A"}</p>
            <p><strong>Date:</strong> ${tripDate}</p>
            <p><strong>Departure:</strong> ${departureTime}</p>
            <p><strong>Arrival:</strong> ${arrivalTime}</p>
            <p><strong>Seat Number:</strong> ${
              appointment.seatNumber || "N/A"
            }</p>
        `;

    // Format payment details
    const paymentStatus =
      payment.paymentStatus === "completed"
        ? '<span class="status-badge status-approved">Paid</span>'
        : '<span class="status-badge status-pending">Pending</span>';

    const paymentDetails = `
            <p><strong>Status:</strong> ${paymentStatus}</p>
            <p><strong>Amount:</strong> ${payment.amount || "N/A"} ${
      payment.currency || ""
    }</p>
            <p><strong>Method:</strong> ${payment.paymentMethod || "N/A"}</p>
            <p><strong>Transaction ID:</strong> ${
              payment.transactionID || "N/A"
            }</p>
            <p><strong>Date:</strong> ${
              payment.createdAt
                ? new Date(
                    payment.createdAt.toDate
                      ? payment.createdAt.toDate()
                      : payment.createdAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"
            }</p>
        `;

    // Format status
    const statusClass = getStatusClass(appointment.appointmentStatus);
    const statusText = appointment.appointmentStatus || "Pending";
    const appointmentStatus = `<span class="status-badge ${statusClass} large">${statusText}</span>`;

    const modalContent = `
            <div class="appointment-details">
                <div class="appointment-header">
                    <h3>Appointment Details</h3>
                    <p>Created on ${formattedDate}</p>
                    <div class="appointment-status">
                        Status: ${appointmentStatus}
                    </div>
                </div>
                
                <div class="details-section">
                    <h4>Passenger Information</h4>
                    <div class="details-content">
                        ${passengerDetails}
                    </div>
                </div>
                
                <div class="details-section">
                    <h4>Trip Information</h4>
                    <div class="details-content">
                        ${tripDetails}
                    </div>
                </div>
                
                <div class="details-section">
                    <h4>Payment Information</h4>
                    <div class="details-content">
                        ${paymentDetails}
                    </div>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Close</button>
                    ${
                      appointment.appointmentStatus === "pending"
                        ? `
                    <button type="button" class="secondary-btn" onclick="confirmApproveAppointment('${appointment.id}')">Approve</button>
                    <button type="button" class="danger-btn" onclick="confirmRejectAppointment('${appointment.id}')">Reject</button>
                    `
                        : ""
                    }
                </div>
            </div>
        `;

    showModal("Appointment Details", modalContent);
  } catch (error) {
    console.error("Error showing appointment details:", error);
    showMessage("Error loading appointment details", "error");
  }
}

// Confirm approve appointment
function confirmApproveAppointment(appointmentId) {
  const modalContent = `
        <p>Are you sure you want to approve this appointment?</p>
        
        <div class="form-footer">
            <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
            <button type="button" class="secondary-btn" onclick="approveAppointment('${appointmentId}')">Approve</button>
        </div>
    `;

  showModal("Confirm Approval", modalContent);
}

// Confirm reject appointment
function confirmRejectAppointment(appointmentId) {
  const modalContent = `
        <p>Are you sure you want to reject this appointment?</p>
        
        <div class="form-footer">
            <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
            <button type="button" class="danger-btn" onclick="rejectAppointment('${appointmentId}')">Reject</button>
        </div>
    `;

  showModal("Confirm Rejection", modalContent);
}

// Approve appointment
async function approveAppointment(appointmentId) {
  try {
    // Update appointment status
    await appointmentsRef.doc(appointmentId).update({
      appointmentStatus: "approved",
    });

    // Log activity
    await logActivity("approve", "appointment", appointmentId);

    // Send notification to passenger
    const appointment = window.allAppointments.find(
      (a) => a.id === appointmentId
    );
    if (appointment && appointment.passengerId) {
      await sendNotificationToPassenger(
        appointment.passengerId,
        "Appointment Approved",
        "Your bus appointment has been approved."
      );
    }

    showMessage("Appointment approved successfully", "success");
    hideModal();

    // Refresh appointments list
    fetchAppointments();
  } catch (error) {
    console.error("Error approving appointment:", error);
    showMessage(`Error approving appointment: ${error.message}`, "error");
  }
}

// Reject appointment
async function rejectAppointment(appointmentId) {
  try {
    // Update appointment status
    await appointmentsRef.doc(appointmentId).update({
      appointmentStatus: "rejected",
    });

    // Log activity
    await logActivity("reject", "appointment", appointmentId);

    // Send notification to passenger
    const appointment = window.allAppointments.find(
      (a) => a.id === appointmentId
    );
    if (appointment && appointment.passengerId) {
      await sendNotificationToPassenger(
        appointment.passengerId,
        "Appointment Rejected",
        "Your bus appointment has been rejected."
      );
    }

    showMessage("Appointment rejected successfully", "success");
    hideModal();

    // Refresh appointments list
    fetchAppointments();
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    showMessage(`Error rejecting appointment: ${error.message}`, "error");
  }
}

// Send notification to passenger
async function sendNotificationToPassenger(passengerId, title, content) {
  try {
    await notificationsRef.add({
      from: currentCompany.id,
      to: passengerId,
      title,
      content,
      sentAt: getTimestamp(),
      isRead: false,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

// Add styles for the appointments section
const appointmentStyles = document.createElement("style");
appointmentStyles.textContent = `
    .status-badge {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .status-badge.large {
        font-size: 14px;
        padding: 8px 15px;
    }
    
    .status-pending {
        background-color: #f39c12;
        color: white;
    }
    
    .status-approved {
        background-color: #2ecc71;
        color: white;
    }
    
    .status-rejected {
        background-color: #e74c3c;
        color: white;
    }
    
    .appointment-details {
        padding: 10px;
    }
    
    .appointment-header {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--light-gray);
    }
    
    .appointment-status {
        margin-top: 10px;
    }
    
    .details-section {
        margin-bottom: 20px;
    }
    
    .details-section h4 {
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid var(--light-gray);
    }
    
    .details-content {
        padding: 0 10px;
    }
    
    .details-content p {
        margin-bottom: 5px;
    }
    
    .view-btn {
        background-color: var(--primary-color);
        color: var(--white);
    }
    
    .view-btn:hover {
        background-color: var(--primary-dark);
    }
    
    .approve-btn {
        background-color: var(--secondary-color);
        color: var(--white);
    }
    
    .approve-btn:hover {
        background-color: var(--secondary-dark);
    }
    
    .reject-btn {
        background-color: var(--danger-color);
        color: var(--white);
    }
    
    .reject-btn:hover {
        background-color: var(--danger-dark);
    }
`;
document.head.appendChild(appointmentStyles);
