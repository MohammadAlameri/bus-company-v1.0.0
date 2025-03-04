// Initialize trips section
function loadTrips() {
    if (!currentCompany) return;
    
    // Update trips section content
    const tripsSection = document.getElementById('trips-section');
    if (!tripsSection) return;
    
    tripsSection.innerHTML = `
        <div class="section-header">
            <h2>Trips Management</h2>
            <button id="add-trip-btn" class="primary-btn">Add Trip</button>
        </div>
        
        <div class="search-filter">
            <div class="search-input">
                <i class="fas fa-search"></i>
                <input type="text" id="trip-search" placeholder="Search trips...">
            </div>
            <div class="filter-controls">
                <select id="trip-filter">
                    <option value="all">All Trips</option>
                    <option value="upcoming">Upcoming Trips</option>
                    <option value="past">Past Trips</option>
                </select>
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="trips-table">
                <thead>
                    <tr>
                        <th>Vehicle</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Date</th>
                        <th>Departure</th>
                        <th>Arrival</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="trips-table-body">
                    <tr>
                        <td colspan="8" style="text-align: center;">Loading trips...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Add event listener to add trip button
    const addTripBtn = document.getElementById('add-trip-btn');
    if (addTripBtn) {
        addTripBtn.addEventListener('click', showAddTripModal);
    }
    
    // Add event listener to search input
    const tripSearch = document.getElementById('trip-search');
    if (tripSearch) {
        tripSearch.addEventListener('input', () => {
            const searchTerm = tripSearch.value.toLowerCase();
            filterTrips(searchTerm);
        });
    }
    
    // Add event listener to filter select
    const tripFilter = document.getElementById('trip-filter');
    if (tripFilter) {
        tripFilter.addEventListener('change', () => {
            const filterValue = tripFilter.value;
            const searchTerm = tripSearch ? tripSearch.value.toLowerCase() : '';
            filterTrips(searchTerm, filterValue);
        });
    }
    
    // Fetch trips
    fetchTrips();
}

// Fetch trips
async function fetchTrips() {
    try {
        const tripsTableBody = document.getElementById('trips-table-body');
        if (!tripsTableBody) return;
        
        // Query trips for this company
        const snapshot = await tripsRef
            .where('companyId', '==', currentCompany.id)
            .orderBy('date', 'desc')
            .get();
            
        if (snapshot.empty) {
            tripsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center;">No trips found</td>
                </tr>
            `;
            return;
        }
        
        // Create table rows
        tripsTableBody.innerHTML = '';
        
        // Store all trip data for filtering
        window.allTrips = [];
        
        const promises = [];
        
        snapshot.forEach(doc => {
            const tripData = {
                id: doc.id,
                ...doc.data()
            };
            
            window.allTrips.push(tripData);
            
            // Fetch vehicle details
            const promise = getVehicleDetails(tripData.vehicleId)
                .then(vehicleDetails => {
                    tripData.vehicleDetails = vehicleDetails;
                    addTripToTable(tripData);
                })
                .catch(error => {
                    console.error('Error fetching vehicle details:', error);
                    addTripToTable(tripData);
                });
                
            promises.push(promise);
        });
        
        // Wait for all promises to resolve
        await Promise.all(promises);
        
        // Add event listeners to edit and delete buttons
        addTripActionListeners();
    } catch (error) {
        console.error('Error fetching trips:', error);
        showMessage('Error loading trips data', 'error');
    }
}

// Get vehicle details
async function getVehicleDetails(vehicleId) {
    try {
        if (!vehicleId) return null;
        
        const doc = await vehiclesRef.doc(vehicleId).get();
        if (!doc.exists) return null;
        
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error getting vehicle details:', error);
        return null;
    }
}

// Add trip to table
function addTripToTable(trip) {
    const tripsTableBody = document.getElementById('trips-table-body');
    if (!tripsTableBody) return;
    
    // Format date
    let formattedDate = 'N/A';
    if (trip.date) {
        const date = trip.date.toDate ? trip.date.toDate() : new Date(trip.date);
        formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    
    // Format times
    const departureTime = trip.departureTime ? 
        `${trip.departureTime.hour}:${trip.departureTime.minute.toString().padStart(2, '0')}` : 'N/A';
        
    const arrivalTime = trip.arrivalTime ? 
        `${trip.arrivalTime.hour}:${trip.arrivalTime.minute.toString().padStart(2, '0')}` : 'N/A';
    
    // Format price
    const price = trip.price ? `${trip.price} ${trip.currency || ''}` : 'N/A';
    
    // Get vehicle info
    const vehicleInfo = trip.vehicleDetails ? 
        `${trip.vehicleDetails.vehicleType} (${trip.vehicleDetails.vehicleNo})` : 
        'Unknown Vehicle';
    
    // Create table row
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', trip.id);
    
    // Check if trip is past or future
    const isPastTrip = trip.date && (
        new Date(trip.date.toDate ? trip.date.toDate() : trip.date) < new Date()
    );
    
    if (isPastTrip) {
        tr.classList.add('past-trip');
    }
    
    tr.innerHTML = `
        <td>${vehicleInfo}</td>
        <td>${trip.fromCity || 'N/A'}</td>
        <td>${trip.toCity || 'N/A'}</td>
        <td>${formattedDate}</td>
        <td>${departureTime}</td>
        <td>${arrivalTime}</td>
        <td>${price}</td>
        <td>
            <div class="table-actions">
                <button class="edit-btn" data-id="${trip.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${trip.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    tripsTableBody.appendChild(tr);
}

// Add event listeners to trip action buttons
function addTripActionListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('#trips-table .edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tripId = button.getAttribute('data-id');
            showEditTripModal(tripId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('#trips-table .delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tripId = button.getAttribute('data-id');
            confirmDeleteTrip(tripId);
        });
    });
}

// Filter trips
function filterTrips(searchTerm = '', filterValue = 'all') {
    const rows = document.querySelectorAll('#trips-table-body tr');
    
    rows.forEach(row => {
        // Skip rows with colspan (like "No trips found")
        if (row.cells.length <= 2) return;
        
        const fromCity = row.cells[1].textContent.toLowerCase();
        const toCity = row.cells[2].textContent.toLowerCase();
        const date = row.cells[3].textContent.toLowerCase();
        
        // Check search term match
        const matchesSearch = !searchTerm || 
            fromCity.includes(searchTerm) || 
            toCity.includes(searchTerm) || 
            date.includes(searchTerm);
        
        // Check filter match
        let matchesFilter = true;
        if (filterValue !== 'all') {
            const isPastTrip = row.classList.contains('past-trip');
            matchesFilter = (filterValue === 'past' && isPastTrip) || 
                            (filterValue === 'upcoming' && !isPastTrip);
        }
        
        // Show/hide row based on matches
        if (matchesSearch && matchesFilter) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Show add trip modal
async function showAddTripModal() {
    try {
        // Fetch vehicles for the company
        const vehicles = await fetchCompanyVehicles();
        
        let vehicleOptions = '<option value="">Select Vehicle</option>';
        vehicles.forEach(vehicle => {
            vehicleOptions += `<option value="${vehicle.id}">${vehicle.vehicleType} (${vehicle.vehicleNo})</option>`;
        });
        
        const modalContent = `
            <form id="add-trip-form">
                <div class="form-group">
                    <label for="trip-vehicle">Vehicle</label>
                    <select id="trip-vehicle" required>
                        ${vehicleOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="trip-from">From City</label>
                    <input type="text" id="trip-from" required>
                </div>
                
                <div class="form-group">
                    <label for="trip-to">To City</label>
                    <input type="text" id="trip-to" required>
                </div>
                
                <div class="form-group">
                    <label for="trip-date">Date</label>
                    <input type="date" id="trip-date" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="trip-departure">Departure Time</label>
                        <input type="time" id="trip-departure" required>
                    </div>
                    
                    <div class="form-group half">
                        <label for="trip-arrival">Arrival Time</label>
                        <input type="time" id="trip-arrival" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="trip-waiting">Waiting Time (Minutes)</label>
                    <input type="number" id="trip-waiting" min="0" value="0">
                </div>
                
                <div class="form-group">
                    <label for="trip-route-type">Route Type</label>
                    <select id="trip-route-type" required>
                        <option value="">Select Route Type</option>
                        <option value="Direct">Direct</option>
                        <option value="Multiple Stops">Multiple Stops</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="trip-transport-type">Transportation Type</label>
                    <select id="trip-transport-type" required>
                        <option value="">Select Transportation Type</option>
                        <option value="Bus">Bus</option>
                        <option value="Shuttle">Shuttle</option>
                        <option value="Minibus">Minibus</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="trip-price">Price</label>
                        <input type="number" id="trip-price" step="0.01" min="0" required>
                    </div>
                    
                    <div class="form-group half">
                        <label for="trip-currency">Currency</label>
                        <select id="trip-currency" required>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="primary-btn">Add Trip</button>
                </div>
            </form>
        `;
        
        showModal('Add New Trip', modalContent);
        
        // Add form submit event listener
        const form = document.getElementById('add-trip-form');
        if (form) {
            form.addEventListener('submit', handleAddTrip);
        }
    } catch (error) {
        console.error('Error preparing add trip modal:', error);
        showMessage('Error preparing add trip form', 'error');
    }
}

// Show edit trip modal
async function showEditTripModal(tripId) {
    try {
        // Fetch trip data
        const doc = await tripsRef.doc(tripId).get();
        if (!doc.exists) {
            showMessage('Trip not found', 'error');
            return;
        }
        
        const trip = {
            id: doc.id,
            ...doc.data()
        };
        
        // Fetch vehicles for the company
        const vehicles = await fetchCompanyVehicles();
        
        let vehicleOptions = '<option value="">Select Vehicle</option>';
        vehicles.forEach(vehicle => {
            const selected = vehicle.id === trip.vehicleId ? 'selected' : '';
            vehicleOptions += `<option value="${vehicle.id}" ${selected}>${vehicle.vehicleType} (${vehicle.vehicleNo})</option>`;
        });
        
        // Format date
        let dateValue = '';
        if (trip.date) {
            const date = trip.date.toDate ? trip.date.toDate() : new Date(trip.date);
            dateValue = date.toISOString().split('T')[0];
        }
        
        // Format times
        const departureTime = trip.departureTime ? 
            `${trip.departureTime.hour.toString().padStart(2, '0')}:${trip.departureTime.minute.toString().padStart(2, '0')}` : '';
            
        const arrivalTime = trip.arrivalTime ? 
            `${trip.arrivalTime.hour.toString().padStart(2, '0')}:${trip.arrivalTime.minute.toString().padStart(2, '0')}` : '';
            
        const waitingMinutes = trip.waitingTime ? 
            trip.waitingTime.minute + (trip.waitingTime.hour * 60) : 0;
        
        const modalContent = `
            <form id="edit-trip-form" data-id="${trip.id}">
                <div class="form-group">
                    <label for="edit-trip-vehicle">Vehicle</label>
                    <select id="edit-trip-vehicle" required>
                        ${vehicleOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-from">From City</label>
                    <input type="text" id="edit-trip-from" value="${trip.fromCity || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-to">To City</label>
                    <input type="text" id="edit-trip-to" value="${trip.toCity || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-date">Date</label>
                    <input type="date" id="edit-trip-date" value="${dateValue}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="edit-trip-departure">Departure Time</label>
                        <input type="time" id="edit-trip-departure" value="${departureTime}" required>
                    </div>
                    
                    <div class="form-group half">
                        <label for="edit-trip-arrival">Arrival Time</label>
                        <input type="time" id="edit-trip-arrival" value="${arrivalTime}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-waiting">Waiting Time (Minutes)</label>
                    <input type="number" id="edit-trip-waiting" min="0" value="${waitingMinutes}">
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-route-type">Route Type</label>
                    <select id="edit-trip-route-type" required>
                        <option value="">Select Route Type</option>
                        <option value="Direct" ${trip.routeType === 'Direct' ? 'selected' : ''}>Direct</option>
                        <option value="Multiple Stops" ${trip.routeType === 'Multiple Stops' ? 'selected' : ''}>Multiple Stops</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-trip-transport-type">Transportation Type</label>
                    <select id="edit-trip-transport-type" required>
                        <option value="">Select Transportation Type</option>
                        <option value="Bus" ${trip.typeOfTransportation === 'Bus' ? 'selected' : ''}>Bus</option>
                        <option value="Shuttle" ${trip.typeOfTransportation === 'Shuttle' ? 'selected' : ''}>Shuttle</option>
                        <option value="Minibus" ${trip.typeOfTransportation === 'Minibus' ? 'selected' : ''}>Minibus</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group half">
                        <label for="edit-trip-price">Price</label>
                        <input type="number" id="edit-trip-price" step="0.01" min="0" value="${trip.price || ''}" required>
                    </div>
                    
                    <div class="form-group half">
                        <label for="edit-trip-currency">Currency</label>
                        <select id="edit-trip-currency" required>
                            <option value="USD" ${trip.currency === 'USD' ? 'selected' : ''}>USD</option>
                            <option value="EUR" ${trip.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                            <option value="GBP" ${trip.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-footer">
                    <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
                    <button type="submit" class="primary-btn">Update Trip</button>
                </div>
            </form>
        `;
        
        showModal('Edit Trip', modalContent);
        
        // Add form submit event listener
        const form = document.getElementById('edit-trip-form');
        if (form) {
            form.addEventListener('submit', handleEditTrip);
        }
    } catch (error) {
        console.error('Error fetching trip details:', error);
        showMessage('Error loading trip details', 'error');
    }
}

// Confirm delete trip
function confirmDeleteTrip(tripId) {
    const modalContent = `
        <p>Are you sure you want to delete this trip?</p>
        <p>This action cannot be undone.</p>
        
        <div class="form-footer">
            <button type="button" class="outline-btn" onclick="hideModal()">Cancel</button>
            <button type="button" class="danger-btn" onclick="deleteTrip('${tripId}')">Delete</button>
        </div>
    `;
    
    showModal('Confirm Delete', modalContent);
}

// Fetch company vehicles
async function fetchCompanyVehicles() {
    try {
        const snapshot = await vehiclesRef
            .where('companyId', '==', currentCompany.id)
            .get();
            
        const vehicles = [];
        snapshot.forEach(doc => {
            vehicles.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return vehicles;
    } catch (error) {
        console.error('Error fetching company vehicles:', error);
        return [];
    }
}

// Parse time input to TimeOfDay object
function parseTimeInput(timeString) {
    if (!timeString) return null;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    return {
        hour: hours,
        minute: minutes
    };
}

// Handle add trip form submission
async function handleAddTrip(e) {
    e.preventDefault();
    
    const vehicleInput = document.getElementById('trip-vehicle');
    const fromInput = document.getElementById('trip-from');
    const toInput = document.getElementById('trip-to');
    const dateInput = document.getElementById('trip-date');
    const departureInput = document.getElementById('trip-departure');
    const arrivalInput = document.getElementById('trip-arrival');
    const waitingInput = document.getElementById('trip-waiting');
    const routeTypeInput = document.getElementById('trip-route-type');
    const transportTypeInput = document.getElementById('trip-transport-type');
    const priceInput = document.getElementById('trip-price');
    const currencyInput = document.getElementById('trip-currency');
    
    if (!vehicleInput || !fromInput || !toInput || !dateInput || 
        !departureInput || !arrivalInput || !routeTypeInput || 
        !transportTypeInput || !priceInput || !currencyInput) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Convert waiting time minutes to TimeOfDay
        const waitingMinutes = parseInt(waitingInput.value) || 0;
        const waitingHours = Math.floor(waitingMinutes / 60);
        const remainingMinutes = waitingMinutes % 60;
        
        // Create trip
        const tripData = {
            vehicleId: vehicleInput.value,
            fromCity: fromInput.value,
            toCity: toInput.value,
            date: new Date(dateInput.value),
            departureTime: parseTimeInput(departureInput.value),
            arrivalTime: parseTimeInput(arrivalInput.value),
            waitingTime: {
                hour: waitingHours,
                minute: remainingMinutes
            },
            routeType: routeTypeInput.value,
            typeOfTransportation: transportTypeInput.value,
            price: parseFloat(priceInput.value),
            currency: currencyInput.value,
            companyId: currentCompany.id,
            createdAt: getTimestamp()
        };
        
        const newTripRef = await tripsRef.add(tripData);
        
        // Log activity
        await logActivity('create', 'trip', newTripRef.id);
        
        showMessage('Trip added successfully', 'success');
        hideModal();
        
        // Refresh trips list
        fetchTrips();
    } catch (error) {
        console.error('Error adding trip:', error);
        showMessage(`Error adding trip: ${error.message}`, 'error');
    }
}

// Handle edit trip form submission
async function handleEditTrip(e) {
    e.preventDefault();
    
    const form = e.target;
    const tripId = form.getAttribute('data-id');
    
    const vehicleInput = document.getElementById('edit-trip-vehicle');
    const fromInput = document.getElementById('edit-trip-from');
    const toInput = document.getElementById('edit-trip-to');
    const dateInput = document.getElementById('edit-trip-date');
    const departureInput = document.getElementById('edit-trip-departure');
    const arrivalInput = document.getElementById('edit-trip-arrival');
    const waitingInput = document.getElementById('edit-trip-waiting');
    const routeTypeInput = document.getElementById('edit-trip-route-type');
    const transportTypeInput = document.getElementById('edit-trip-transport-type');
    const priceInput = document.getElementById('edit-trip-price');
    const currencyInput = document.getElementById('edit-trip-currency');
    
    if (!vehicleInput || !fromInput || !toInput || !dateInput || 
        !departureInput || !arrivalInput || !routeTypeInput || 
        !transportTypeInput || !priceInput || !currencyInput) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Convert waiting time minutes to TimeOfDay
        const waitingMinutes = parseInt(waitingInput.value) || 0;
        const waitingHours = Math.floor(waitingMinutes / 60);
        const remainingMinutes = waitingMinutes % 60;
        
        // Update trip
        const tripData = {
            vehicleId: vehicleInput.value,
            fromCity: fromInput.value,
            toCity: toInput.value,
            date: new Date(dateInput.value),
            departureTime: parseTimeInput(departureInput.value),
            arrivalTime: parseTimeInput(arrivalInput.value),
            waitingTime: {
                hour: waitingHours,
                minute: remainingMinutes
            },
            routeType: routeTypeInput.value,
            typeOfTransportation: transportTypeInput.value,
            price: parseFloat(priceInput.value),
            currency: currencyInput.value
        };
        
        await tripsRef.doc(tripId).update(tripData);
        
        // Log activity
        await logActivity('update', 'trip', tripId);
        
        showMessage('Trip updated successfully', 'success');
        hideModal();
        
        // Refresh trips list
        fetchTrips();
    } catch (error) {
        console.error('Error updating trip:', error);
        showMessage(`Error updating trip: ${error.message}`, 'error');
    }
}

// Delete trip
async function deleteTrip(tripId) {
    try {
        // Check for existing appointments for this trip
        const appointmentsSnapshot = await appointmentsRef
            .where('tripId', '==', tripId)
            .get();
            
        if (!appointmentsSnapshot.empty) {
            showMessage('Cannot delete trip with existing appointments', 'error');
            hideModal();
            return;
        }
        
        // Delete trip
        await tripsRef.doc(tripId).delete();
        
        // Log activity
        await logActivity('delete', 'trip', tripId);
        
        showMessage('Trip deleted successfully', 'success');
        hideModal();
        
        // Refresh trips list
        fetchTrips();
    } catch (error) {
        console.error('Error deleting trip:', error);
        showMessage(`Error deleting trip: ${error.message}`, 'error');
    }
}

// Add styles for the trips section
const tripStyles = document.createElement('style');
tripStyles.textContent = `
    .filter-controls {
        margin-top: 10px;
    }
    
    .filter-controls select {
        padding: 8px;
        border: 1px solid var(--light-gray);
        border-radius: 4px;
        background-color: var(--white);
    }
    
    .form-row {
        display: flex;
        gap: 15px;
    }
    
    .form-group.half {
        flex: 1;
    }
    
    .past-trip {
        opacity: 0.7;
    }
`;
document.head.appendChild(tripStyles); 