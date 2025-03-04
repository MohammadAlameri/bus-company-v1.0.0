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

// Collection references with converters
const companiesRef = db.collection("companies");
const driversRef = db.collection("drivers");
const passengersRef = db.collection("passengers");
const vehiclesRef = db.collection("vehicles");
const tripsRef = db.collection("trips");
const appointmentsRef = db.collection("appointments");
const addressesRef = db.collection("addresses");
const paymentsRef = db.collection("payments");
const reviewsRef = db.collection("reviews");
const workingHoursRef = db.collection("workingHours");
const timeOffsRef = db.collection("timeOffs");
const notificationsRef = db.collection("notifications");

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
