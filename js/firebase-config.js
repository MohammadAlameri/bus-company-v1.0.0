// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChja8Glw_bQDTuT8logN_Y4ULsrejKq0g",
  authDomain: "bookingbusticket-fa422.firebaseapp.com",
  projectId: "bookingbusticket-fa422",
  storageBucket: "bookingbusticket-fa422.firebasestorage.app",
  messagingSenderId: "585501952496",
  appId: "1:585501952496:web:571d27e34f8bafc04a3535",
  measurementId: "G-193GWGC66D",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Auth and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Custom timestamp conversion for TimeOfDay objects in Firestore
db.settings({
  timestampsInSnapshots: true,
});

// Helper for TimeOfDay object conversion
function convertTimeOfDayToString(timeOfDay) {
  if (!timeOfDay) return null;
  return `${timeOfDay.hour}:${timeOfDay.minute.toString().padStart(2, "0")}`;
}

function convertStringToTimeOfDay(timeString) {
  if (!timeString) return null;
  const [hour, minute] = timeString.split(":").map(Number);
  return { hour, minute };
}

// Helper for LatLng object conversion
function convertLatLngToGeoPoint(latLng) {
  if (!latLng) return null;
  return new firebase.firestore.GeoPoint(latLng.latitude, latLng.longitude);
}

function convertGeoPointToLatLng(geoPoint) {
  if (!geoPoint) return null;
  return { latitude: geoPoint.latitude, longitude: geoPoint.longitude };
}

// Document converter helper
function createConverter(toFirestore, fromFirestore) {
  return {
    toFirestore: (data) => toFirestore(data),
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return fromFirestore({ ...data, id: snapshot.id });
    },
  };
}

// Model Converters - Based on the provided schema

// Address Converter
const addressConverter = createConverter(
  (address) => {
    const { id, ...rest } = address;
    return {
      ...rest,
      latLon: address.latLon ? convertLatLngToGeoPoint(address.latLon) : null,
    };
  },
  (data) => ({
    id: data.id,
    latLon: data.latLon ? convertGeoPointToLatLng(data.latLon) : null,
    streetName: data.streetName || "",
    streetNumber: data.streetNumber || "",
    city: data.city || "",
    district: data.district || "",
    country: data.country || "",
    nextTo: data.nextTo || "",
  })
);

// Appointment Converter
const appointmentConverter = createConverter(
  (appointment) => {
    const { id, ...rest } = appointment;
    return {
      ...rest,
      createdAt: appointment.createdAt || getTimestamp(),
    };
  },
  (data) => ({
    id: data.id,
    tripId: data.tripId || "",
    passengerId: data.passengerId || "",
    paymentId: data.paymentId || "",
    appointmentStatus: data.appointmentStatus || "pending",
    seatNumber: data.seatNumber || 0,
    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
  })
);

// Company Converter
const companyConverter = createConverter(
  (company) => {
    const { id, ...rest } = company;
    return {
      ...rest,
      createdAt: company.createdAt || getTimestamp(),
      lastLoginAt: company.lastLoginAt || getTimestamp(),
    };
  },
  (data) => ({
    id: data.id,
    name: data.name || "",
    bio: data.bio || "",
    email: data.email || "",
    banckAccountNo: data.banckAccountNo || "",
    imageURL: data.imageURL || "",
    addressId: data.addressId || "",
    phoneNumber: data.phoneNumber || "",
    rate: data.rate || 0,
    reviewCount: data.reviewCount || 0,
    passengerCount: data.passengerCount || 0,
    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
    lastLoginAt: data.lastLoginAt ? data.lastLoginAt.toDate() : new Date(),
    authProvider: data.authProvider || "email",
  })
);

// Driver Converter
const driverConverter = createConverter(
  (driver) => {
    const { id, ...rest } = driver;
    return {
      ...rest,
      dateOfBirth: driver.dateOfBirth || null,
      createdAt: driver.createdAt || getTimestamp(),
      lastLoginAt: driver.lastLoginAt || getTimestamp(),
    };
  },
  (data) => ({
    id: data.id,
    name: data.name || "",
    phoneNumber: data.phoneNumber || "",
    gender: data.gender || "",
    imageURL: data.imageURL || "",
    bio: data.bio || "",
    dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toDate() : null,
    email: data.email || "",
    addressId: data.addressId || "",
    nationalityNo: data.nationalityNo || "",
    nationalityURL: data.nationalityURL || "",
    passportNo: data.passportNo || "",
    passportURL: data.passportURL || "",
    licenseNo: data.licenseNo || "",
    licenseURL: data.licenseURL || "",
    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
    lastLoginAt: data.lastLoginAt ? data.lastLoginAt.toDate() : new Date(),
    authProvider: data.authProvider || "email",
  })
);

// Notification Converter
const notificationConverter = createConverter(
  (notification) => {
    const { id, ...rest } = notification;
    return {
      ...rest,
      sentAt: notification.sentAt || getTimestamp(),
    };
  },
  (data) => ({
    id: data.id,
    from: data.from || "",
    to: data.to || "",
    title: data.title || "",
    content: data.content || "",
    sentAt: data.sentAt ? data.sentAt.toDate() : new Date(),
    isRead: data.isRead || false,
  })
);

// Passenger Converter
const passengerConverter = createConverter(
  (passenger) => {
    const { id, ...rest } = passenger;
    return {
      ...rest,
      dateOfBirth: passenger.dateOfBirth || null,
      createdAt: passenger.createdAt || getTimestamp(),
      lastLoginAt: passenger.lastLoginAt || getTimestamp(),
    };
  },
  (data) => ({
    id: data.id,
    name: data.name || "",
    email: data.email || "",
    phoneNumber: data.phoneNumber || "",
    imageURL: data.imageURL || "",
    bio: data.bio || "",
    addressId: data.addressId || "",
    dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toDate() : null,
    gender: data.gender || "",
    nationalityNo: data.nationalityNo || "",
    nationalityURL: data.nationalityURL || "",
    nationalityCountry: data.nationalityCountry || "",
    passportNo: data.passportNo || "",
    passportURL: data.passportURL || "",
    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
    lastLoginAt: data.lastLoginAt ? data.lastLoginAt.toDate() : new Date(),
    authProvider: data.authProvider || "email",
  })
);

// Payment Converter
const paymentConverter = createConverter(
  (payment) => {
    const { id, ...rest } = payment;
    return {
      ...rest,
      createdAt: payment.createdAt || getTimestamp(),
      updatedAt: payment.updatedAt || getTimestamp(),
    };
  },
  (data) => ({
    id: data.id,
    amount: data.amount || 0,
    currency: data.currency || "",
    paymentMethod: data.paymentMethod || "",
    paymentStatus: data.paymentStatus || "",
    transactionID: data.transactionID || "",
    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    errorMessage: data.errorMessage || null,
  })
);

// Review Converter
const reviewConverter = createConverter(
  (review) => {
    const { id, ...rest } = review;
    return {
      ...rest,
    };
  },
  (data) => ({
    id: data.id,
    passengerId: data.passengerId || "",
    companyId: data.companyId || "",
    comment: data.comment || "",
    rate: data.rate || 0,
  })
);

// TimeOff Converter
const timeOffConverter = createConverter(
  (timeOff) => {
    const { id, ...rest } = timeOff;
    return {
      ...rest,
      startTime: timeOff.startTime
        ? convertTimeOfDayToString(timeOff.startTime)
        : null,
      endTime: timeOff.endTime
        ? convertTimeOfDayToString(timeOff.endTime)
        : null,
      specificDay: timeOff.specificDay || null,
    };
  },
  (data) => ({
    id: data.id,
    companyId: data.companyId || "",
    title: data.title || "",
    startTime: data.startTime ? convertStringToTimeOfDay(data.startTime) : null,
    endTime: data.endTime ? convertStringToTimeOfDay(data.endTime) : null,
    frequency: data.frequency || "once",
    dayOfWeek: data.dayOfWeek || "",
    specificDay: data.specificDay ? data.specificDay.toDate() : null,
  })
);

// Vehicle Converter
const vehicleConverter = createConverter(
  (vehicle) => {
    const { id, ...rest } = vehicle;
    return {
      ...rest,
    };
  },
  (data) => ({
    id: data.id,
    driverId: data.driverId || "",
    vehicleNo: data.vehicleNo || "",
    addressId: data.addressId || "",
    vehicleType: data.vehicleType || "",
    typeOfTransportation: data.typeOfTransportation || "",
    companyId: data.companyId || "",
    countOfSeats: data.countOfSeats || 0,
  })
);

// WorkingHours Converter
const workingHoursConverter = createConverter(
  (workingHours) => {
    const { id, ...rest } = workingHours;
    return {
      ...rest,
      startTime: workingHours.startTime
        ? convertTimeOfDayToString(workingHours.startTime)
        : null,
      endTime: workingHours.endTime
        ? convertTimeOfDayToString(workingHours.endTime)
        : null,
    };
  },
  (data) => ({
    id: data.id,
    companyId: data.companyId || "",
    startTime: data.startTime ? convertStringToTimeOfDay(data.startTime) : null,
    endTime: data.endTime ? convertStringToTimeOfDay(data.endTime) : null,
    dayOfWeek: data.dayOfWeek || "",
  })
);

// Trip Converter
const tripConverter = createConverter(
  (trip) => {
    const { id, ...rest } = trip;
    return {
      ...rest,
      date: trip.date || null,
      arrivalTime: trip.arrivalTime
        ? convertTimeOfDayToString(trip.arrivalTime)
        : null,
      departureTime: trip.departureTime
        ? convertTimeOfDayToString(trip.departureTime)
        : null,
      waitingTime: trip.waitingTime
        ? convertTimeOfDayToString(trip.waitingTime)
        : null,
    };
  },
  (data) => ({
    id: data.id,
    vehicleId: data.vehicleId || "",
    fromCity: data.fromCity || "",
    toCity: data.toCity || "",
    date: data.date ? data.date.toDate() : null,
    arrivalTime: data.arrivalTime
      ? convertStringToTimeOfDay(data.arrivalTime)
      : null,
    departureTime: data.departureTime
      ? convertStringToTimeOfDay(data.departureTime)
      : null,
    waitingTime: data.waitingTime
      ? convertStringToTimeOfDay(data.waitingTime)
      : null,
    routeType: data.routeType || "Direct",
    price: data.price || 0,
    currency: data.currency || "YER",
  })
);

// Collection references with converters
const companiesRef = db.collection("companies").withConverter(companyConverter);
const driversRef = db.collection("drivers").withConverter(driverConverter);
const passengersRef = db
  .collection("passengers")
  .withConverter(passengerConverter);
const vehiclesRef = db.collection("vehicles").withConverter(vehicleConverter);
const tripsRef = db.collection("trips").withConverter(tripConverter);
const appointmentsRef = db
  .collection("appointments")
  .withConverter(appointmentConverter);
const addressesRef = db.collection("addresses").withConverter(addressConverter);
const paymentsRef = db.collection("payments").withConverter(paymentConverter);
const reviewsRef = db.collection("reviews").withConverter(reviewConverter);
const workingHoursRef = db
  .collection("workingHours")
  .withConverter(workingHoursConverter);
const timeOffsRef = db.collection("timeOffs").withConverter(timeOffConverter);
const notificationsRef = db
  .collection("notifications")
  .withConverter(notificationConverter);

// Current company
let currentCompany = null;

// Set current company after authentication
function setCurrentCompany(company) {
  currentCompany = company;
  localStorage.setItem("currentCompany", JSON.stringify(company));

  // Update UI elements
  if (company && document.getElementById("company-name")) {
    document.getElementById("company-name").textContent = company.name;
  }
}

// Get current company from localStorage on page load
function loadCurrentCompany() {
  const savedCompany = localStorage.getItem("currentCompany");
  if (savedCompany) {
    try {
      currentCompany = JSON.parse(savedCompany);

      // Validate the company object
      if (!currentCompany || !currentCompany.id) {
        console.error("Invalid company data in localStorage");
        localStorage.removeItem("currentCompany");
        currentCompany = null;
        return;
      }

      console.log("Loaded company from localStorage:", currentCompany.id);

      if (document.getElementById("company-name")) {
        document.getElementById("company-name").textContent =
          currentCompany.name;
      }
    } catch (error) {
      console.error("Error parsing saved company:", error);
      localStorage.removeItem("currentCompany");
      currentCompany = null;
    }
  }
}

// Clear current company on logout
function clearCurrentCompany() {
  currentCompany = null;
  localStorage.removeItem("currentCompany");
}

// Helper for creating timestamps
function getTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

// Add activity log
async function logActivity(action, entityType, entityId) {
  if (!currentCompany) return;

  try {
    await db.collection("activityLogs").add({
      companyId: currentCompany.id,
      action,
      entityType,
      entityId,
      timestamp: getTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", loadCurrentCompany);
