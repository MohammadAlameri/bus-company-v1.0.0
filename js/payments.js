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
                        <td colspan="8" style="text-align: center;">
                            <div class="coming-soon">
                                <i class="fas fa-tools"></i>
                                <h3>Coming Soon</h3>
                                <p>The payments management feature is currently under development and will be available soon.</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

  // Add event listeners
  const refreshPaymentsBtn = document.getElementById("refresh-payments-btn");
  if (refreshPaymentsBtn) {
    refreshPaymentsBtn.addEventListener("click", () => {
      showMessage("Payments module is under development", "info");
    });
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
    
    @media (max-width: 768px) {
        .payments-stats {
            flex-direction: column;
            gap: 15px;
        }
        
        .payment-stat-card {
            width: 100%;
        }
    }
`;
document.head.appendChild(paymentStyles);
