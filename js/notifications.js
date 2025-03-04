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
            <div class="notifications-list">
                <div class="coming-soon">
                    <i class="fas fa-tools"></i>
                    <h3>Coming Soon</h3>
                    <p>The notifications feature is currently under development and will be available soon.</p>
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
      showMessage("Notifications module is under development", "info");
    });
  }

  const markAllReadBtn = document.getElementById("mark-all-read-btn");
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
      showMessage("Mark all as read feature coming soon", "info");
    });
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
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .notification-item {
        padding: 15px;
        border-bottom: 1px solid var(--light-gray);
        display: flex;
        gap: 15px;
        transition: all 0.3s ease;
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
`;
document.head.appendChild(notificationStyles);
