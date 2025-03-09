// Initialize notifications section
function loadNotifications() {
  if (!currentCompany) return;

  // Update notifications section content
  const notificationsSection = document.getElementById("notifications-section");
  if (!notificationsSection) return;

  notificationsSection.innerHTML = `
        <div class="section-header">
            <h2>Notifications</h2>
            <div class="section-actions">
                <button id="refresh-notifications-btn" class="refresh-btn secondary-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button id="mark-all-read-btn" class="primary-btn">Mark All as Read</button>
            </div>
        </div>
        
        <div class="search-filter">
            <div class="search-input">
                <i class="fas fa-search"></i>
                <input type="text" id="notification-search" placeholder="Search notifications...">
            </div>
            <div class="filter-controls">
                <select id="notification-filter">
                    <option value="all">All Notifications</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                </select>
            </div>
        </div>
        
        <div class="notifications-container">
            <div id="notifications-list" class="notifications-list">
                <div class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading notifications...</p>
                </div>
            </div>
        </div>
    `;

  // Add event listeners
  const refreshNotificationsBtn = document.getElementById(
    "refresh-notifications-btn"
  );
  if (refreshNotificationsBtn) {
    refreshNotificationsBtn.addEventListener("click", () => {
      showMessage("Refreshing notifications...", "info");
      fetchNotifications();
    });
  }

  const markAllReadBtn = document.getElementById("mark-all-read-btn");
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", markAllNotificationsAsRead);
  }

  // Add search functionality
  const notificationSearch = document.getElementById("notification-search");
  if (notificationSearch) {
    notificationSearch.addEventListener("input", filterNotifications);
  }

  // Add filter functionality
  const notificationFilter = document.getElementById("notification-filter");
  if (notificationFilter) {
    notificationFilter.addEventListener("change", filterNotifications);
  }

  // Fetch notifications
  fetchNotifications();
}

// Fetch notifications from Firestore
async function fetchNotifications() {
  try {
    const notificationsList = document.getElementById("notifications-list");
    if (!notificationsList) return;

    // Show loading message
    notificationsList.innerHTML = `
      <div class="loading-message">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading notifications...</p>
      </div>
    `;

    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error("Current company information not available");
      notificationsList.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error: Company information not available. Please try logging out and back in.</p>
        </div>
      `;
      return;
    }

    console.log("Fetching notifications for company ID:", currentCompany.id);

    // Get notifications from Firestore
    const snapshot = await notificationsRef
      .where("companyId", "==", currentCompany.id)
      .get();

    // Store all notifications for filtering
    window.allNotifications = [];

    if (snapshot.empty) {
      notificationsList.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications found. New notifications will appear here.</p>
        </div>
      `;
      return;
    }

    snapshot.forEach((doc) => {
      window.allNotifications.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort notifications by date (newest first)
    window.allNotifications.sort((a, b) => {
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

    // Display notifications
    displayNotifications(window.allNotifications);

    // Update notification counter in header if exists
    updateNotificationCounter();

    console.log(
      "Notifications loaded successfully:",
      window.allNotifications.length
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);

    const notificationsList = document.getElementById("notifications-list");
    if (notificationsList) {
      notificationsList.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error loading notifications: ${error.message}</p>
        </div>
      `;
    }

    showMessage("Error loading notifications: " + error.message, "error");
  }
}

// Display notifications
function displayNotifications(notifications) {
  const notificationsList = document.getElementById("notifications-list");
  if (!notificationsList) return;

  // Clear list
  notificationsList.innerHTML = "";

  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="empty-message">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications match your search.</p>
      </div>
    `;
    return;
  }

  // Create a fragment to improve performance
  const fragment = document.createDocumentFragment();

  notifications.forEach((notification) => {
    // Format date
    const notificationDate = notification.createdAt
      ? notification.createdAt.toDate
        ? notification.createdAt.toDate()
        : new Date(notification.createdAt)
      : new Date();

    const formattedDate = formatTimeAgo(notificationDate);

    // Create notification item
    const notificationItem = document.createElement("div");
    notificationItem.className = `notification-item ${
      notification.read ? "read" : "unread"
    }`;
    notificationItem.setAttribute("data-id", notification.id);

    // Get icon based on notification type
    const icon = getNotificationIcon(notification.type);

    notificationItem.innerHTML = `
      <div class="notification-icon">
        <i class="${icon}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${
          notification.title || "New Notification"
        }</div>
        <div class="notification-message">${notification.message || ""}</div>
        <div class="notification-time">${formattedDate}</div>
      </div>
      <div class="notification-actions">
        ${
          notification.read
            ? `<button class="mark-unread-btn" title="Mark as unread" data-id="${notification.id}">
            <i class="fas fa-envelope"></i>
          </button>`
            : `<button class="mark-read-btn" title="Mark as read" data-id="${notification.id}">
            <i class="fas fa-envelope-open"></i>
          </button>`
        }
        <button class="delete-notification-btn" title="Delete" data-id="${
          notification.id
        }">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;

    // Add click event to mark as read when clicked (except on buttons)
    notificationItem.addEventListener("click", (e) => {
      // Don't mark as read if clicking on buttons
      if (e.target.closest(".notification-actions")) {
        return;
      }

      // Only mark as read if it's unread
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }

      // Show notification details
      showNotificationDetails(notification.id);
    });

    fragment.appendChild(notificationItem);
  });

  // Add all notifications to the list
  notificationsList.appendChild(fragment);

  // Add event listeners to action buttons
  document.querySelectorAll(".mark-read-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering the parent click
      const notificationId = btn.getAttribute("data-id");
      markNotificationAsRead(notificationId);
    });
  });

  document.querySelectorAll(".mark-unread-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering the parent click
      const notificationId = btn.getAttribute("data-id");
      markNotificationAsUnread(notificationId);
    });
  });

  document.querySelectorAll(".delete-notification-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering the parent click
      const notificationId = btn.getAttribute("data-id");
      confirmDeleteNotification(notificationId);
    });
  });
}

// Get notification icon based on type
function getNotificationIcon(type) {
  switch (type) {
    case "appointment":
      return "fas fa-calendar-check";
    case "payment":
      return "fas fa-money-bill-wave";
    case "trip":
      return "fas fa-route";
    case "driver":
      return "fas fa-user";
    case "review":
      return "fas fa-star";
    case "system":
      return "fas fa-cog";
    default:
      return "fas fa-bell";
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

  // If more than a week ago, show the actual date
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Filter notifications
function filterNotifications() {
  if (!window.allNotifications) return;

  const searchTerm = document
    .getElementById("notification-search")
    .value.toLowerCase();
  const filterValue = document.getElementById("notification-filter").value;

  // Filter notifications
  const filteredNotifications = window.allNotifications.filter(
    (notification) => {
      // Filter by read status
      if (filterValue === "read" && !notification.read) {
        return false;
      }
      if (filterValue === "unread" && notification.read) {
        return false;
      }

      // Search by title or message
      const title = (notification.title || "").toLowerCase();
      const message = (notification.message || "").toLowerCase();

      return title.includes(searchTerm) || message.includes(searchTerm);
    }
  );

  // Display filtered notifications
  displayNotifications(filteredNotifications);
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
  try {
    // Find notification in local array
    const notification = window.allNotifications.find(
      (n) => n.id === notificationId
    );
    if (!notification || notification.read) return;

    // Update in Firestore
    await notificationsRef.doc(notificationId).update({
      read: true,
      updatedAt: getTimestamp(),
    });

    // Update local data
    notification.read = true;

    // Update UI
    const notificationItem = document.querySelector(
      `.notification-item[data-id="${notificationId}"]`
    );
    if (notificationItem) {
      notificationItem.classList.remove("unread");
      notificationItem.classList.add("read");

      // Update action button
      const actionsDiv = notificationItem.querySelector(
        ".notification-actions"
      );
      if (actionsDiv) {
        const readBtn = actionsDiv.querySelector(".mark-read-btn");
        if (readBtn) {
          const unreadBtn = document.createElement("button");
          unreadBtn.className = "mark-unread-btn";
          unreadBtn.title = "Mark as unread";
          unreadBtn.setAttribute("data-id", notificationId);
          unreadBtn.innerHTML = '<i class="fas fa-envelope"></i>';

          // Add event listener
          unreadBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            markNotificationAsUnread(notificationId);
          });

          // Replace button
          actionsDiv.replaceChild(unreadBtn, readBtn);
        }
      }
    }

    // Update notification counter
    updateNotificationCounter();

    console.log("Notification marked as read:", notificationId);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    showMessage(
      "Error marking notification as read: " + error.message,
      "error"
    );
  }
}

// Mark notification as unread
async function markNotificationAsUnread(notificationId) {
  try {
    // Find notification in local array
    const notification = window.allNotifications.find(
      (n) => n.id === notificationId
    );
    if (!notification || !notification.read) return;

    // Update in Firestore
    await notificationsRef.doc(notificationId).update({
      read: false,
      updatedAt: getTimestamp(),
    });

    // Update local data
    notification.read = false;

    // Update UI
    const notificationItem = document.querySelector(
      `.notification-item[data-id="${notificationId}"]`
    );
    if (notificationItem) {
      notificationItem.classList.remove("read");
      notificationItem.classList.add("unread");

      // Update action button
      const actionsDiv = notificationItem.querySelector(
        ".notification-actions"
      );
      if (actionsDiv) {
        const unreadBtn = actionsDiv.querySelector(".mark-unread-btn");
        if (unreadBtn) {
          const readBtn = document.createElement("button");
          readBtn.className = "mark-read-btn";
          readBtn.title = "Mark as read";
          readBtn.setAttribute("data-id", notificationId);
          readBtn.innerHTML = '<i class="fas fa-envelope-open"></i>';

          // Add event listener
          readBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            markNotificationAsRead(notificationId);
          });

          // Replace button
          actionsDiv.replaceChild(readBtn, unreadBtn);
        }
      }
    }

    // Update notification counter
    updateNotificationCounter();

    console.log("Notification marked as unread:", notificationId);
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    showMessage(
      "Error marking notification as unread: " + error.message,
      "error"
    );
  }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
  try {
    if (!window.allNotifications || window.allNotifications.length === 0) {
      showMessage("No notifications to mark as read", "info");
      return;
    }

    showMessage("Marking all notifications as read...", "info");

    // Get unread notifications
    const unreadNotifications = window.allNotifications.filter((n) => !n.read);

    if (unreadNotifications.length === 0) {
      showMessage("All notifications are already read", "info");
      return;
    }

    // Update all unread notifications in Firestore (batch update)
    const batch = db.batch();
    unreadNotifications.forEach((notification) => {
      const notificationRef = notificationsRef.doc(notification.id);
      batch.update(notificationRef, {
        read: true,
        updatedAt: getTimestamp(),
      });

      // Update local data
      notification.read = true;
    });

    // Commit the batch
    await batch.commit();

    // Update UI
    displayNotifications(window.allNotifications);

    // Update notification counter
    updateNotificationCounter();

    showMessage(
      `Marked ${unreadNotifications.length} notifications as read`,
      "success"
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    showMessage(
      "Error marking all notifications as read: " + error.message,
      "error"
    );
  }
}

// Confirm delete notification
function confirmDeleteNotification(notificationId) {
  const notification = window.allNotifications.find(
    (n) => n.id === notificationId
  );
  if (!notification) return;

  const modalContent = `
    <div class="confirmation-modal">
      <p>Are you sure you want to delete this notification?</p>
      <div class="notification-preview">
        <div class="notification-title">${
          notification.title || "New Notification"
        }</div>
        <div class="notification-message">${notification.message || ""}</div>
      </div>
      
      <div class="form-footer">
        <button type="button" class="danger-btn" onclick="hideModal()">Cancel</button>
        <button type="button" class="danger-btn" onclick="deleteNotification('${notificationId}')">Delete</button>
      </div>
    </div>
  `;

  showModal("Confirm Delete", modalContent);
}

// Delete notification
async function deleteNotification(notificationId) {
  try {
    // Delete from Firestore
    await notificationsRef.doc(notificationId).delete();

    // Remove from local array
    window.allNotifications = window.allNotifications.filter(
      (n) => n.id !== notificationId
    );

    // Hide modal
    hideModal();

    // Update UI
    displayNotifications(window.allNotifications);

    // Update notification counter
    updateNotificationCounter();

    showMessage("Notification deleted successfully", "success");
  } catch (error) {
    console.error("Error deleting notification:", error);
    showMessage("Error deleting notification: " + error.message, "error");
  }
}

// Show notification details
function showNotificationDetails(notificationId) {
  const notification = window.allNotifications.find(
    (n) => n.id === notificationId
  );
  if (!notification) return;

  // Format date
  const notificationDate = notification.createdAt
    ? notification.createdAt.toDate
      ? notification.createdAt.toDate()
      : new Date(notification.createdAt)
    : new Date();

  const formattedDate = notificationDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get notification type
  const typeText = notification.type
    ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1)
    : "General";

  // Get related entity
  let relatedEntityHtml = "";
  if (notification.entityId && notification.entityType) {
    relatedEntityHtml = `
      <div class="detail-row">
        <div class="detail-label">Related ${notification.entityType}</div>
        <div class="detail-value">
          <button class="text-btn view-related-btn" data-type="${notification.entityType}" data-id="${notification.entityId}">
            View ${notification.entityType}
          </button>
        </div>
      </div>
    `;
  }

  const modalContent = `
    <div class="notification-details">
      <div class="detail-section">
        <h4>Notification Information</h4>
        <div class="detail-row">
          <div class="detail-label">Type</div>
          <div class="detail-value">${typeText}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Date</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Status</div>
          <div class="detail-value">
            ${
              notification.read
                ? '<span class="status-badge status-success">Read</span>'
                : '<span class="status-badge status-warning">Unread</span>'
            }
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Content</h4>
        <div class="detail-row">
          <div class="detail-label">Title</div>
          <div class="detail-value">${
            notification.title || "New Notification"
          }</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Message</div>
          <div class="detail-value">${notification.message || ""}</div>
        </div>
      </div>
      
      ${
        relatedEntityHtml
          ? `<div class="detail-section">${relatedEntityHtml}</div>`
          : ""
      }
      
      <div class="modal-footer">
        <button type="button" class="danger-btn" onclick="hideModal()">Close</button>
        ${
          notification.read
            ? `<button type="button" class="secondary-btn" onclick="markNotificationAsUnread('${notification.id}'); hideModal();">
            <i class="fas fa-envelope"></i> Mark as Unread
          </button>`
            : `<button type="button" class="secondary-btn" onclick="markNotificationAsRead('${notification.id}'); hideModal();">
            <i class="fas fa-envelope-open"></i> Mark as Read
          </button>`
        }
        <button type="button" class="danger-btn" onclick="confirmDeleteNotification('${
          notification.id
        }'); hideModal();">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      </div>
    </div>
  `;

  showModal("Notification Details", modalContent);

  // Add event listener for related entity button
  const viewRelatedBtn = document.querySelector(".view-related-btn");
  if (viewRelatedBtn) {
    viewRelatedBtn.addEventListener("click", () => {
      hideModal();
      navigateToEntity(
        viewRelatedBtn.getAttribute("data-type"),
        viewRelatedBtn.getAttribute("data-id")
      );
    });
  }
}

// Navigate to related entity
function navigateToEntity(entityType, entityId) {
  // Get menu items
  const menuItems = document.querySelectorAll(".menu-item");

  switch (entityType.toLowerCase()) {
    case "driver":
      // Click on drivers menu item
      menuItems.forEach((item) => {
        if (item.getAttribute("data-section") === "drivers") {
          item.click();

          // Highlight the driver in the table
          setTimeout(() => {
            const driverRow = document.querySelector(
              `.driver-row[data-id="${entityId}"]`
            );
            if (driverRow) {
              driverRow.classList.add("highlight-row");
              driverRow.scrollIntoView({ behavior: "smooth", block: "center" });
              // Remove highlight after a few seconds
              setTimeout(
                () => driverRow.classList.remove("highlight-row"),
                3000
              );
            }
          }, 500);
        }
      });
      break;
    case "trip":
      // Click on trips menu item
      menuItems.forEach((item) => {
        if (item.getAttribute("data-section") === "trips") {
          item.click();

          // Highlight the trip in the table
          setTimeout(() => {
            const tripRow = document.querySelector(
              `.trip-row[data-id="${entityId}"]`
            );
            if (tripRow) {
              tripRow.classList.add("highlight-row");
              tripRow.scrollIntoView({ behavior: "smooth", block: "center" });
              // Remove highlight after a few seconds
              setTimeout(() => tripRow.classList.remove("highlight-row"), 3000);
            }
          }, 500);
        }
      });
      break;
    case "appointment":
      // Click on appointments menu item
      menuItems.forEach((item) => {
        if (item.getAttribute("data-section") === "appointments") {
          item.click();
        }
      });
      break;
    case "payment":
      // Click on payments menu item
      menuItems.forEach((item) => {
        if (item.getAttribute("data-section") === "payments") {
          item.click();
        }
      });
      break;
    case "review":
      // Click on reviews menu item
      menuItems.forEach((item) => {
        if (item.getAttribute("data-section") === "reviews") {
          item.click();
        }
      });
      break;
    default:
      // If no specific section, just stay on notifications
      break;
  }
}

// Update notification counter in header
function updateNotificationCounter() {
  const notificationCounter = document.getElementById("notification-counter");
  if (!notificationCounter) return;

  // Count unread notifications
  const unreadCount = window.allNotifications
    ? window.allNotifications.filter((n) => !n.read).length
    : 0;

  if (unreadCount > 0) {
    notificationCounter.textContent = unreadCount > 99 ? "99+" : unreadCount;
    notificationCounter.style.display = "flex";
  } else {
    notificationCounter.style.display = "none";
  }
}

// Add styles for notifications section
const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
    .notifications-container {
        margin-top: 20px;
        background-color: var(--white);
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .notifications-list {
        min-height: 300px;
    }
    
    .notification-item {
        padding: 15px;
        border-bottom: 1px solid var(--light-gray);
        display: flex;
        gap: 15px;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .notification-item:last-child {
        border-bottom: none;
    }
    
    .notification-item:hover {
        background-color: var(--light-gray);
    }
    
    .notification-item.unread {
        background-color: rgba(52, 152, 219, 0.1);
    }
    
    .notification-icon {
        width: 40px;
        height: 40px;
        background-color: var(--primary-color);
        color: var(--white);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-title {
        font-weight: 500;
        margin-bottom: 5px;
    }
    
    .notification-message {
        color: var(--gray);
        font-size: 0.9rem;
        margin-bottom: 5px;
    }
    
    .notification-time {
        font-size: 0.8rem;
        color: var(--dark-gray);
    }
    
    .notification-actions {
        display: flex;
        align-items: center;
    }
    
    .notification-actions button {
        background: none;
        border: none;
        color: var(--gray);
        cursor: pointer;
        padding: 5px;
        transition: color 0.3s ease;
    }
    
    .notification-actions button:hover {
        color: var(--dark);
    }
    
    .notification-preview {
        background-color: #f9f9f9;
        border-radius: 6px;
        padding: 12px;
        margin: 15px 0;
    }
    
    .loading-message, .empty-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 50px 20px;
        text-align: center;
        color: #777;
    }
    
    .loading-message i, .empty-message i {
        font-size: 48px;
        margin-bottom: 15px;
        color: #aaa;
    }
    
    .highlight-row {
        background-color: rgba(67, 97, 238, 0.2) !important;
        transition: background-color 0.5s ease;
    }
`;
document.head.appendChild(notificationStyles);
