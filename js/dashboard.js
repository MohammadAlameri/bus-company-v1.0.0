// DOM Elements
const menuItems = document.querySelectorAll('.menu-item');
const dashboardSections = document.querySelectorAll('.dashboard-section');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.querySelector('.close-btn');

// Initialize dashboard
function initializeDashboard() {
    if (!currentCompany) return;
    
    // Load counts
    loadDashboardCounts();
    
    // Load charts
    initializeCharts();
    
    // Load recent activities
    loadRecentActivities();
}

// Load dashboard counts
async function loadDashboardCounts() {
    if (!currentCompany) return;
    
    try {
        // Count drivers
        const driversCount = await countDrivers();
        document.getElementById('drivers-count').textContent = driversCount;
        
        // Count active trips
        const tripsCount = await countActiveTrips();
        document.getElementById('trips-count').textContent = tripsCount;
        
        // Count buses
        const busesCount = await countBuses();
        document.getElementById('buses-count').textContent = busesCount;
        
        // Load passenger count from company data
        document.getElementById('passengers-count').textContent = currentCompany.passengerCount || 0;
    } catch (error) {
        console.error('Error loading dashboard counts:', error);
        showMessage('Error loading dashboard data', 'error');
    }
}

// Count drivers
async function countDrivers() {
    try {
        const snapshot = await driversRef
            .where('companyId', '==', currentCompany.id)
            .get();
            
        return snapshot.size;
    } catch (error) {
        console.error('Error counting drivers:', error);
        return 0;
    }
}

// Count active trips
async function countActiveTrips() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const snapshot = await tripsRef
            .where('companyId', '==', currentCompany.id)
            .where('date', '>=', today)
            .get();
            
        return snapshot.size;
    } catch (error) {
        console.error('Error counting active trips:', error);
        return 0;
    }
}

// Count buses
async function countBuses() {
    try {
        const snapshot = await vehiclesRef
            .where('companyId', '==', currentCompany.id)
            .get();
            
        return snapshot.size;
    } catch (error) {
        console.error('Error counting buses:', error);
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
        const ctx = document.getElementById('bookings-chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: bookingsData.labels,
                datasets: [{
                    label: 'Bookings',
                    data: bookingsData.data,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(52, 152, 219, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing bookings chart:', error);
    }
}

// Initialize revenue chart
async function initializeRevenueChart() {
    try {
        // Get revenue data for last 7 days
        const revenueData = await getRevenueData();
        
        // Create chart
        const ctx = document.getElementById('revenue-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenueData.data,
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '$' + context.raw;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing revenue chart:', error);
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
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Set initial data to 0
            data.push(0);
        }
        
        // Get start date (7 days ago)
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        // Query appointments for last 7 days
        const snapshot = await appointmentsRef
            .where('companyId', '==', currentCompany.id)
            .where('createdAt', '>=', startDate)
            .get();
            
        // Count appointments per day
        snapshot.forEach(doc => {
            const appointmentData = doc.data();
            const createdAt = appointmentData.createdAt?.toDate();
            
            if (createdAt) {
                const dayIndex = Math.floor((createdAt - startDate) / (24 * 60 * 60 * 1000));
                if (dayIndex >= 0 && dayIndex < 7) {
                    data[dayIndex]++;
                }
            }
        });
        
        return { labels, data };
    } catch (error) {
        console.error('Error getting bookings data:', error);
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
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Set initial data to 0
            data.push(0);
        }
        
        // Get start date (7 days ago)
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        // Query payments for last 7 days
        const snapshot = await paymentsRef
            .where('companyId', '==', currentCompany.id)
            .where('createdAt', '>=', startDate)
            .where('paymentStatus', '==', 'completed')
            .get();
            
        // Sum payments per day
        snapshot.forEach(doc => {
            const paymentData = doc.data();
            const createdAt = paymentData.createdAt?.toDate();
            
            if (createdAt) {
                const dayIndex = Math.floor((createdAt - startDate) / (24 * 60 * 60 * 1000));
                if (dayIndex >= 0 && dayIndex < 7) {
                    data[dayIndex] += paymentData.amount || 0;
                }
            }
        });
        
        return { labels, data };
    } catch (error) {
        console.error('Error getting revenue data:', error);
        return { labels: [], data: [] };
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        // Clear current activities
        activityList.innerHTML = '';
        
        // Query recent activities
        const snapshot = await db.collection('activityLogs')
            .where('companyId', '==', currentCompany.id)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
            
        if (snapshot.empty) {
            activityList.innerHTML = '<p>No recent activities</p>';
            return;
        }
        
        // Create activity items
        snapshot.forEach(doc => {
            const activityData = doc.data();
            const activityTime = activityData.timestamp?.toDate() || new Date();
            
            // Create activity item
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            // Create activity icon based on action type
            const iconClass = getActivityIcon(activityData.action, activityData.entityType);
            
            // Create activity content
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${formatActivityTitle(activityData.action, activityData.entityType)}</div>
                    <div class="activity-time">${formatTimeAgo(activityTime)}</div>
                </div>
            `;
            
            activityList.appendChild(activityItem);
        });
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

// Get activity icon
function getActivityIcon(action, entityType) {
    switch (entityType) {
        case 'driver':
            return 'fas fa-id-card';
        case 'trip':
            return 'fas fa-route';
        case 'vehicle':
        case 'bus':
            return 'fas fa-bus-alt';
        case 'appointment':
            return 'fas fa-calendar-check';
        case 'payment':
            return 'fas fa-money-bill-wave';
        case 'review':
            return 'fas fa-star';
        case 'workingHours':
        case 'timeOff':
            return 'fas fa-clock';
        case 'company':
            return 'fas fa-building';
        case 'notification':
            return 'fas fa-bell';
        default:
            return 'fas fa-info-circle';
    }
}

// Format activity title
function formatActivityTitle(action, entityType) {
    let entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    switch (action) {
        case 'create':
            return `New ${entityName} created`;
        case 'update':
            return `${entityName} updated`;
        case 'delete':
            return `${entityName} deleted`;
        case 'approve':
            return `${entityName} approved`;
        case 'reject':
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
        return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Menu item click handler
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all menu items
        menuItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Get section to show
        const sectionId = item.getAttribute('data-section');
        
        // Hide all sections
        dashboardSections.forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show selected section
        const selectedSection = document.getElementById(`${sectionId}-section`);
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
            
            // Load section data if needed
            loadSectionData(sectionId);
        }
    });
});

// Load section data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'drivers':
            loadDrivers();
            break;
        case 'trips':
            loadTrips();
            break;
        case 'buses':
            loadBuses();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'payments':
            loadPayments();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'working-hours':
            loadWorkingHours();
            break;
        case 'company-profile':
            loadCompanyProfile();
            break;
        case 'notifications':
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
    modal.classList.remove('hidden');
}

function hideModal() {
    if (!modal) return;
    
    // Hide modal
    modal.classList.add('hidden');
    
    // Clear modal content
    if (modalBody) {
        modalBody.innerHTML = '';
    }
}

// Close modal button click handler
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideModal);
}

// Close modal when clicking outside
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
}

// Handle errors
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showMessage(`An error occurred: ${e.message}`, 'error');
}); 