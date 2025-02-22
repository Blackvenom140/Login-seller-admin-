// Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, remove, push, get, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBVqDaD82IzRf0VheHWgJmlniE1-iW65aE",
    authDomain: "login-system-a83ef.firebaseapp.com",
    databaseURL: "https://login-system-a83ef-default-rtdb.firebaseio.com",
    projectId: "login-system-a83ef",
    storageBucket: "login-system-a83ef.firebasestorage.app",
    messagingSenderId: "586906299008",
    appId: "1:586906299008:web:d2d93f383fa8958b551465",
    measurementId: "G-0WF4S9S1PK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Function to format time into 12-hour AM/PM format
function format12HourTime(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 24hr to 12hr format
    const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    return `${date.toLocaleDateString()} ${formattedTime}`;
}

// Function to format remaining time
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s) left`;
    if (hours > 0) return `${hours} hour(s) left`;
    if (minutes > 0) return `${minutes} minute(s) left`;
    return `${seconds} second(s) left`;
}

// Function to load and display saved admins
function loadAdmins() {
    const adminContainer = document.getElementById("adminContainer");
    onValue(ref(db, "admins"), (snapshot) => {
        adminContainer.innerHTML = "";
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                const remainingTime = data.expiry - Date.now();

                const div = document.createElement("div");
                div.classList.add("admin-item");
                div.innerHTML = `
                    <strong>ID:</strong> ${data.adminId} <br>
                    <strong>Password:</strong> ${data.password} <br>
                    <strong>Created On:</strong> ${format12HourTime(data.createdAt)} <br>
                    <strong>Expires In:</strong> ${remainingTime > 0 ? formatTime(remainingTime) : "Expired"}
                `;
                adminContainer.appendChild(div);
            });
        } else {
            adminContainer.innerHTML = "No admins found.";
        }
    });
}

// Prevent Duplicate ID and Store Data
document.getElementById("adminForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const adminId = document.getElementById("adminId").value.trim();
    const password = document.getElementById("password").value.trim();
    const deleteTime = parseInt(document.getElementById("timeSelect").value);
    const expiryTime = Date.now() + deleteTime * 1000;
    const createdAt = Date.now();

    if (adminId && password) {
        get(ref(db, "admins")).then((snapshot) => {
            let isDuplicate = false;

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    if (childSnapshot.val().adminId === adminId) {
                        isDuplicate = true;
                    }
                });
            }

            if (isDuplicate) {
                alert("This Admin ID is already registered.");
            } else {
                const adminRef = push(ref(db, "admins"));
                set(adminRef, {
                    adminId: adminId,
                    password: password,
                    createdAt: createdAt,
                    expiry: expiryTime
                }).then(() => {
                    alert(`Admin Registered Successfully! Data will auto-delete in ${deleteTime / 60} minutes.`);
                    document.getElementById("adminForm").reset();
                    loadAdmins();
                }).catch((error) => {
                    console.error("Error:", error);
                });
            }
        });
    } else {
        alert("Please enter Admin ID and Password");
    }
});

// Auto-delete function
function checkAndDeleteExpiredKeys() {
    get(ref(db, "admins")).then((snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.expiry && Date.now() > data.expiry) {
                    remove(ref(db, "admins/" + childSnapshot.key))
                        .then(() => console.log(`Deleted expired admin: ${data.adminId}`))
                        .catch((error) => console.error("Error deleting expired admin:", error));
                }
            });
        }
    }).catch((error) => console.error("Error checking expiry:", error));
}

// Run auto-delete check every minute
setInterval(checkAndDeleteExpiredKeys, 60000);

// Load admins when page loads
loadAdmins();
