// Initialize working hours section
function loadWorkingHours() {
  if (!currentCompany) return;

  // Update working hours section content
  const workingHoursSection = document.getElementById("working-hours-section");
  if (!workingHoursSection) return;

  workingHoursSection.innerHTML = `
        <div class="section-header">
            <h2>Working Hours Management</h2>
            <div class="section-actions">
                <button id="refresh-working-hours-btn" class="refresh-btn secondary-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button id="add-time-off-btn" class="primary-btn">Add Time Off</button>
            </div>
        </div>
        
        <div class="working-hours-container">
            <div class="working-hours-card">
                <h3>Regular Working Hours</h3>
                <div class="days-container">
                    <div class="day-row">
                        <div class="day-name">Monday</div>
                        <div class="time-slots">09:00 - 17:00</div>
                    </div>
                    <div class="day-row">
                        <div class="day-name">Tuesday</div>
                        <div class="time-slots">09:00 - 17:00</div>
                    </div>
                    <div class="day-row">
                        <div class="day-name">Wednesday</div>
                        <div class="time-slots">09:00 - 17:00</div>
                    </div>
                    <div class="day-row">
                        <div class="day-name">Thursday</div>
                        <div class="time-slots">09:00 - 17:00</div>
                    </div>
                    <div class="day-row">
                        <div class="day-name">Friday</div>
                        <div class="time-slots">09:00 - 17:00</div>
                    </div>
                    <div class="day-row">
                        <div class="day-name">Saturday</div>
                        <div class="time-slots">10:00 - 15:00</div>
                    </div>
                    <div class="day-row">
                        <div class="day-name">Sunday</div>
                        <div class="time-slots closed">Closed</div>
                    </div>
                </div>
                <div class="edit-hours-btn-container">
                    <button class="secondary-btn">Edit Working Hours</button>
                </div>
            </div>
            
            <div class="time-off-card">
                <h3>Scheduled Time Off</h3>
                <div class="time-off-list">
                    <div class="coming-soon">
                        <i class="fas fa-tools"></i>
                        <h3>Coming Soon</h3>
                        <p>The working hours management feature is currently under development and will be available soon.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add event listeners
  const refreshWorkingHoursBtn = document.getElementById(
    "refresh-working-hours-btn"
  );
  if (refreshWorkingHoursBtn) {
    refreshWorkingHoursBtn.addEventListener("click", () => {
      showMessage("Working hours module is under development", "info");
    });
  }

  const addTimeOffBtn = document.getElementById("add-time-off-btn");
  if (addTimeOffBtn) {
    addTimeOffBtn.addEventListener("click", () => {
      showMessage("Time off functionality is coming soon", "info");
    });
  }
}

// Add styles for working hours section
const workingHoursStyles = document.createElement("style");
workingHoursStyles.textContent = `
    .working-hours-container {
        display: flex;
        gap: 20px;
        margin-top: 20px;
    }
    
    .working-hours-card, .time-off-card {
        background-color: var(--white);
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 48%;
    }
    
    .working-hours-card h3, .time-off-card h3 {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--light-gray);
    }
    
    .days-container {
        margin-bottom: 20px;
    }
    
    .day-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid var(--light-gray);
    }
    
    .day-name {
        font-weight: 500;
    }
    
    .time-slots {
        color: var(--gray);
    }
    
    .time-slots.closed {
        color: var(--danger-color);
    }
    
    .edit-hours-btn-container {
        text-align: center;
        margin-top: 20px;
    }
    
    .time-off-list {
        min-height: 200px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    @media (max-width: 768px) {
        .working-hours-container {
            flex-direction: column;
        }
        
        .working-hours-card, .time-off-card {
            width: 100%;
        }
    }
`;
document.head.appendChild(workingHoursStyles);
