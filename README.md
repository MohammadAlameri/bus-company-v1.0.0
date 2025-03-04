# Bus Company Dashboard

A comprehensive web dashboard for bus companies to manage their operations, including drivers, trips, buses, appointments, and more. This dashboard integrates with a Flutter mobile application for booking bus tickets.

## Features

### Authentication

- Login with email and password
- Login with Google
- Company registration

### Dashboard Overview

- Statistics on drivers, active trips, buses, and passengers
- Booking and revenue charts
- Recent activity feed

### Drivers Management

- Add, edit, and delete drivers
- View driver details including license, nationality, and passport information
- Search and filter drivers

### Trips Management

- Add, edit, and delete trips
- Schedule trips with departure and arrival times
- Set trip routes, prices, and assign vehicles
- Filter trips by status (upcoming/past)
- Search trips by origin, destination, or date

### Buses Management

- Add, edit, and delete buses/vehicles
- Assign drivers to vehicles
- Manage vehicle details like type, registration number, and seating capacity
- Track vehicle locations

### Appointments Management

- View passenger booking details
- Accept or reject booking requests
- Search and filter appointments

### Other Features

- Payment history tracking
- Reviews and ratings management
- Working hours and time off scheduling
- Company profile management
- Address management
- Notifications system

## Technical Details

### Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase Authentication
- Firebase Firestore
- Chart.js for data visualization

### Database Schema

The application uses the following data model:

- **Address**: Location information with coordinates, street details, and city information
- **Appointment**: Booking details connecting passengers with trips
- **Company**: Company profile information including contact details and ratings
- **Driver**: Driver details including personal information and license details
- **Notification**: System notifications for companies and users
- **Passenger**: Passenger information and booking history
- **Payment**: Transaction details for bookings
- **Review**: Customer feedback and ratings
- **TimeOff**: Scheduled off-hours or non-operating days
- **Vehicle**: Bus details including registration, type, and seating capacity
- **WorkingHours**: Company operating hours
- **Trip**: Route information, schedule, and pricing

## Setup Instructions

1. Clone this repository to your local machine or web server
2. Set up a Firebase project and enable Authentication and Firestore
3. Configure `js/firebase-config.js` with your Firebase project credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID",
   };
   ```
4. Deploy the application to your web server or run it locally using a local server

## Firebase Security Rules

For security, set up appropriate Firestore rules to ensure that companies can only access their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Companies can only access their own data
    match /companies/{companyId} {
      allow read, write: if request.auth != null && request.auth.uid == companyId;
    }

    // Vehicles, drivers, and trips can only be accessed by the company that owns them
    match /vehicles/{vehicleId} {
      allow read, write: if request.auth != null &&
                           resource.data.companyId == request.auth.uid;
    }

    match /drivers/{driverId} {
      allow read, write: if request.auth != null &&
                           resource.data.companyId == request.auth.uid;
    }

    match /trips/{tripId} {
      allow read, write: if request.auth != null &&
                           resource.data.companyId == request.auth.uid;
    }

    // Add similar rules for other collections
  }
}
```

## Integration with Mobile App

This dashboard is designed to work alongside a Flutter application for booking bus tickets. The mobile app and dashboard use the same Firebase backend, allowing for real-time synchronization of data between the company dashboard and passenger mobile app.

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For support or inquiries, please contact our team at support@buscompanydashboard.com.
