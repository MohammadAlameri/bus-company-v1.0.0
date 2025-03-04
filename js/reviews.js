// Initialize reviews section
function loadReviews() {
  if (!currentCompany) return;

  // Update reviews section content
  const reviewsSection = document.getElementById("reviews-section");
  if (!reviewsSection) return;

  reviewsSection.innerHTML = `
        <div class="section-header">
            <h2>Reviews Management</h2>
            <div class="section-actions">
                <button id="refresh-reviews-btn" class="refresh-btn secondary-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </div>
        
        <div class="search-filter">
            <div class="search-input">
                <i class="fas fa-search"></i>
                <input type="text" id="review-search" placeholder="Search reviews...">
            </div>
            <div class="filter-controls">
                <select id="review-filter">
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>
            </div>
        </div>
        
        <div class="reviews-stats">
            <div class="review-stat-card">
                <div class="stat-title">Average Rating</div>
                <div class="stat-value" id="average-rating">
                    <i class="fas fa-star"></i>
                    <span>0.0</span>
                </div>
            </div>
            <div class="review-stat-card">
                <div class="stat-title">Total Reviews</div>
                <div class="stat-value" id="total-reviews">0</div>
            </div>
            <div class="review-stat-card">
                <div class="stat-title">Recent Reviews</div>
                <div class="stat-value" id="recent-reviews">0</div>
            </div>
        </div>
        
        <div class="reviews-container">
            <div class="coming-soon">
                <i class="fas fa-tools"></i>
                <h3>Coming Soon</h3>
                <p>The reviews management feature is currently under development and will be available soon.</p>
            </div>
        </div>
    `;

  // Add event listeners
  const refreshReviewsBtn = document.getElementById("refresh-reviews-btn");
  if (refreshReviewsBtn) {
    refreshReviewsBtn.addEventListener("click", () => {
      showMessage("Reviews module is under development", "info");
    });
  }
}

// Add styles for reviews section
const reviewStyles = document.createElement("style");
reviewStyles.textContent = `
    .reviews-stats {
        display: flex;
        justify-content: space-between;
        margin: 20px 0;
    }
    
    .review-stat-card {
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
        display: flex;
        align-items: center;
    }
    
    .stat-value i {
        color: #f1c40f;
        margin-right: 5px;
    }
    
    .reviews-container {
        margin-top: 20px;
        background-color: var(--white);
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: center;
        min-height: 300px;
    }
    
    @media (max-width: 768px) {
        .reviews-stats {
            flex-direction: column;
            gap: 15px;
        }
        
        .review-stat-card {
            width: 100%;
        }
    }
`;
document.head.appendChild(reviewStyles);
