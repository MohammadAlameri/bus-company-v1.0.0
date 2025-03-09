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
            <div id="reviews-list" class="reviews-list">
                <div class="loading-message">Loading reviews...</div>
            </div>
        </div>
    `;

  // Add event listeners
  const refreshReviewsBtn = document.getElementById("refresh-reviews-btn");
  if (refreshReviewsBtn) {
    refreshReviewsBtn.addEventListener("click", () => {
      showMessage("Refreshing reviews...", "info");
      fetchReviews();
    });
  }

  // Add search functionality
  const reviewSearch = document.getElementById("review-search");
  if (reviewSearch) {
    reviewSearch.addEventListener("input", () => {
      filterReviews();
    });
  }

  // Add filter functionality
  const reviewFilter = document.getElementById("review-filter");
  if (reviewFilter) {
    reviewFilter.addEventListener("change", () => {
      filterReviews();
    });
  }

  // Fetch reviews data
  fetchReviews();
}

// Fetch reviews from Firestore
async function fetchReviews() {
  try {
    const reviewsList = document.getElementById("reviews-list");
    if (!reviewsList) return;

    // Update UI to show loading
    reviewsList.innerHTML = `<div class="loading-message">Loading reviews...</div>`;

    // Reset stats
    document.getElementById(
      "average-rating"
    ).innerHTML = `<i class="fas fa-star"></i><span>0.0</span>`;
    document.getElementById("total-reviews").textContent = "0";
    document.getElementById("recent-reviews").textContent = "0";

    // Check if currentCompany is available
    if (!currentCompany || !currentCompany.id) {
      console.error("Current company information not available");
      reviewsList.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error: Company information not available. Please try logging out and back in.</p>
        </div>
      `;
      return;
    }

    console.log("Fetching reviews for company ID:", currentCompany.id);

    // Get reviews from Firestore
    const snapshot = await reviewsRef
      .where("companyId", "==", currentCompany.id)
      .get();

    // Store all reviews for filtering
    window.allReviews = [];

    if (snapshot.empty) {
      reviewsList.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-star"></i>
          <p>No reviews found. When passengers rate your services, reviews will appear here.</p>
        </div>
      `;
      updateReviewStats([]);
      return;
    }

    snapshot.forEach((doc) => {
      window.allReviews.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort reviews by date (newest first)
    window.allReviews.sort((a, b) => {
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

    // Update stats
    updateReviewStats(window.allReviews);

    // Get passenger details for all reviews
    const promises = window.allReviews.map(async (review) => {
      if (review.passengerId) {
        const passengerDetails = await getPassengerDetails(review.passengerId);
        review.passenger = passengerDetails;
      }

      if (review.tripId) {
        const tripDetails = await getTripDetails(review.tripId);
        review.trip = tripDetails;
      }
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    // Display reviews
    displayReviews(window.allReviews);

    console.log("Reviews loaded successfully:", window.allReviews.length);
  } catch (error) {
    console.error("Error fetching reviews:", error);

    const reviewsList = document.getElementById("reviews-list");
    if (reviewsList) {
      reviewsList.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error loading reviews: ${error.message}</p>
        </div>
      `;
    }

    showMessage("Error loading reviews: " + error.message, "error");
  }
}

// Update review stats
function updateReviewStats(reviews) {
  const totalReviews = reviews.length;

  // Calculate average rating
  let averageRating = 0;
  if (totalReviews > 0) {
    const sum = reviews.reduce(
      (total, review) => total + (review.rating || 0),
      0
    );
    averageRating = sum / totalReviews;
  }

  // Count recent reviews (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReviews = reviews.filter((review) => {
    const reviewDate = review.createdAt
      ? review.createdAt.toDate
        ? review.createdAt.toDate()
        : new Date(review.createdAt)
      : new Date();
    return reviewDate >= thirtyDaysAgo;
  }).length;

  // Update UI
  document.getElementById("average-rating").innerHTML = `
    <i class="fas fa-star"></i>
    <span>${averageRating.toFixed(1)}</span>
  `;
  document.getElementById("total-reviews").textContent = totalReviews;
  document.getElementById("recent-reviews").textContent = recentReviews;
}

// Display reviews
function displayReviews(reviews) {
  const reviewsList = document.getElementById("reviews-list");
  if (!reviewsList) return;

  // Clear list
  reviewsList.innerHTML = "";

  if (reviews.length === 0) {
    reviewsList.innerHTML = `
      <div class="empty-message">
        <i class="fas fa-star"></i>
        <p>No reviews match your search.</p>
      </div>
    `;
    return;
  }

  reviews.forEach((review) => {
    // Format date
    const reviewDate = review.createdAt
      ? review.createdAt.toDate
        ? review.createdAt.toDate()
        : new Date(review.createdAt)
      : new Date();

    const formattedDate = reviewDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Get passenger name
    const passengerName = review.passenger
      ? `${review.passenger.firstName} ${review.passenger.lastName}`
      : "Anonymous User";

    // Get trip info
    const tripInfo = review.trip
      ? `${review.trip.origin} to ${review.trip.destination}`
      : "Unknown Trip";

    // Create review card
    const reviewCard = document.createElement("div");
    reviewCard.className = "review-card";
    reviewCard.setAttribute("data-id", review.id);
    reviewCard.setAttribute("data-rating", review.rating || 0);

    // Generate stars HTML
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      const starClass = i <= review.rating ? "fas" : "far";
      starsHtml += `<i class="${starClass} fa-star"></i>`;
    }

    reviewCard.innerHTML = `
      <div class="review-header">
        <div class="review-passenger">
          <i class="fas fa-user-circle"></i>
          <span>${passengerName}</span>
        </div>
        <div class="review-date">${formattedDate}</div>
      </div>
      <div class="review-rating">
        ${starsHtml}
      </div>
      <div class="review-trip">
        <i class="fas fa-route"></i>
        <span>${tripInfo}</span>
      </div>
      <div class="review-content">
        ${review.comment || "No comment provided."}
      </div>
      <div class="review-actions">
        ${
          review.replied
            ? `
          <div class="reply-badge">
            <i class="fas fa-reply"></i>
            <span>Replied</span>
          </div>
        `
            : `
          <button class="reply-btn secondary-btn" data-id="${review.id}">
            <i class="fas fa-reply"></i> Reply
          </button>
        `
        }
        <button class="view-details-btn text-btn" data-id="${review.id}">
          View Details
        </button>
      </div>
    `;

    reviewsList.appendChild(reviewCard);
  });

  // Add event listeners
  document.querySelectorAll(".reply-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const reviewId = btn.getAttribute("data-id");
      showReplyModal(reviewId);
    });
  });

  document.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const reviewId = btn.getAttribute("data-id");
      showReviewDetails(reviewId);
    });
  });
}

// Filter reviews
function filterReviews() {
  if (!window.allReviews) return;

  const searchTerm = document
    .getElementById("review-search")
    .value.toLowerCase();
  const filterValue = document.getElementById("review-filter").value;

  // Filter reviews
  const filteredReviews = window.allReviews.filter((review) => {
    // Filter by rating
    if (filterValue !== "all" && review.rating !== parseInt(filterValue)) {
      return false;
    }

    // Search by passenger name, comment, or trip info
    const passenger = review.passenger
      ? `${review.passenger.firstName} ${review.passenger.lastName}`.toLowerCase()
      : "";

    const comment = (review.comment || "").toLowerCase();

    const trip = review.trip
      ? `${review.trip.origin} ${review.trip.destination}`.toLowerCase()
      : "";

    return (
      passenger.includes(searchTerm) ||
      comment.includes(searchTerm) ||
      trip.includes(searchTerm)
    );
  });

  // Display filtered reviews
  displayReviews(filteredReviews);
}

// Show reply modal
function showReplyModal(reviewId) {
  const review = window.allReviews.find((r) => r.id === reviewId);
  if (!review) {
    showMessage("Review not found", "error");
    return;
  }

  // Get passenger name
  const passengerName = review.passenger
    ? `${review.passenger.firstName} ${review.passenger.lastName}`
    : "Anonymous User";

  // Generate stars HTML
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= review.rating ? "fas" : "far";
    starsHtml += `<i class="${starClass} fa-star"></i>`;
  }

  const modalContent = `
    <div class="reply-review-form">
      <div class="review-summary">
        <div class="review-passenger">
          <strong>${passengerName}</strong> left a review:
        </div>
        <div class="review-rating">
          ${starsHtml}
        </div>
        <div class="review-content">
          "${review.comment || "No comment provided."}"
        </div>
      </div>
      
      <div class="form-group">
        <label for="review-reply">Your Reply</label>
        <textarea id="review-reply" rows="4" placeholder="Write your response to this review...">${
          review.reply || ""
        }</textarea>
      </div>
      
      <div class="form-footer">
        <button type="button" class="danger-btn" onclick="hideModal()">Cancel</button>
        <button type="button" class="primary-btn" onclick="submitReply('${reviewId}')">Submit Reply</button>
      </div>
    </div>
  `;

  showModal(`Reply to Review`, modalContent);
}

// Submit reply to review
async function submitReply(reviewId) {
  try {
    const reply = document.getElementById("review-reply").value.trim();

    if (!reply) {
      showMessage("Please enter a reply", "error");
      return;
    }

    showMessage("Submitting reply...", "info");

    // Update review in Firestore
    await reviewsRef.doc(reviewId).update({
      reply: reply,
      replied: true,
      replyDate: getTimestamp(),
      updatedAt: getTimestamp(),
    });

    // Update local review data
    const review = window.allReviews.find((r) => r.id === reviewId);
    if (review) {
      review.reply = reply;
      review.replied = true;
      review.replyDate = new Date();
    }

    // Hide modal
    hideModal();

    // Log activity
    await logActivity("reply", "review", reviewId);

    // Refresh reviews display
    displayReviews(window.allReviews);

    showMessage("Reply submitted successfully", "success");
  } catch (error) {
    console.error("Error submitting reply:", error);
    showMessage("Error submitting reply: " + error.message, "error");
  }
}

// Show review details
function showReviewDetails(reviewId) {
  const review = window.allReviews.find((r) => r.id === reviewId);
  if (!review) {
    showMessage("Review not found", "error");
    return;
  }

  // Format date
  const reviewDate = review.createdAt
    ? review.createdAt.toDate
      ? review.createdAt.toDate()
      : new Date(review.createdAt)
    : new Date();

  const formattedDate = reviewDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format reply date if available
  let replyDateStr = "N/A";
  if (review.replyDate) {
    const replyDate = review.replyDate.toDate
      ? review.replyDate.toDate()
      : new Date(review.replyDate);
    replyDateStr = replyDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Get passenger info
  const passengerName = review.passenger
    ? `${review.passenger.firstName} ${review.passenger.lastName}`
    : "Anonymous User";

  const passengerPhone = review.passenger
    ? review.passenger.phoneNumber
    : "N/A";
  const passengerEmail = review.passenger ? review.passenger.email : "N/A";

  // Get trip info
  const tripInfo = review.trip
    ? `${review.trip.origin} to ${review.trip.destination}`
    : "Unknown Trip";

  const tripDate =
    review.trip && review.trip.date
      ? (review.trip.date.toDate
          ? review.trip.date.toDate()
          : new Date(review.trip.date)
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown";

  // Generate stars HTML
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= review.rating ? "fas" : "far";
    starsHtml += `<i class="${starClass} fa-star"></i>`;
  }

  const modalContent = `
    <div class="review-details">
      <div class="detail-section">
        <h4>Review Information</h4>
        <div class="detail-row">
          <div class="detail-label">Rating</div>
          <div class="detail-value">
            <div class="review-rating">${starsHtml}</div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Date</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Comment</div>
          <div class="detail-value">${
            review.comment || "No comment provided."
          }</div>
        </div>
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
      </div>
      
      <div class="detail-section">
        <h4>Reply Information</h4>
        <div class="detail-row">
          <div class="detail-label">Status</div>
          <div class="detail-value">
            ${
              review.replied
                ? '<span class="status-badge status-success">Replied</span>'
                : '<span class="status-badge status-warning">No Reply</span>'
            }
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Reply Date</div>
          <div class="detail-value">${replyDateStr}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Reply</div>
          <div class="detail-value">${
            review.reply || "No reply provided yet."
          }</div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="outline-btn" onclick="hideModal()">Close</button>
        ${
          !review.replied
            ? `
          <button type="button" class="primary-btn" onclick="showReplyModal('${review.id}')">
            <i class="fas fa-reply"></i> Reply to Review
          </button>
        `
            : `
          <button type="button" class="secondary-btn" onclick="showReplyModal('${review.id}')">
            <i class="fas fa-edit"></i> Edit Reply
          </button>
        `
        }
      </div>
    </div>
  `;

  showModal("Review Details", modalContent);
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

// Get trip details
async function getTripDetails(tripId) {
  try {
    if (!tripId) return null;

    const doc = await tripsRef.doc(tripId).get();
    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting trip details:", error);
    return null;
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
        min-height: 300px;
    }
    
    .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .review-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        position: relative;
        background-color: #fff;
    }
    
    .review-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    }
    
    .review-passenger {
        font-weight: 500;
        display: flex;
        align-items: center;
    }
    
    .review-passenger i {
        margin-right: 8px;
        color: #666;
    }
    
    .review-date {
        color: #777;
        font-size: 0.9rem;
    }
    
    .review-rating {
        margin-bottom: 10px;
    }
    
    .review-rating i {
        color: #f1c40f;
        margin-right: 3px;
    }
    
    .review-trip {
        margin-bottom: 10px;
        color: #666;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
    }
    
    .review-trip i {
        margin-right: 8px;
    }
    
    .review-content {
        margin-bottom: 15px;
        line-height: 1.5;
    }
    
    .review-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
    }
    
    .reply-badge {
        background-color: #f0f0f0;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.85rem;
        color: #555;
        display: flex;
        align-items: center;
    }
    
    .reply-badge i {
        margin-right: 5px;
    }
    
    .review-summary {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
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
    
    .empty-message i {
        font-size: 48px;
        margin-bottom: 15px;
        color: #aaa;
    }
    
    @media (max-width: 768px) {
        .reviews-stats {
            flex-direction: column;
            gap: 15px;
        }
        
        .review-stat-card {
            width: 100%;
        }
        
        .review-header {
            flex-direction: column;
            gap: 5px;
        }
        
        .review-actions {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }
    }
`;
document.head.appendChild(reviewStyles);
