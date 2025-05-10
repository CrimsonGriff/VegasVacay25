import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7kS8qchec22bF4oiiWtZR9_acBccE8hE",
  authDomain: "vacationsite-49565.firebaseapp.com",
  projectId: "vacationsite-49565",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ⏱ Wait for DOM to load before binding
window.addEventListener("DOMContentLoaded", () => {
  const selectedDate = localStorage.getItem('selectedDate');
  document.getElementById('eventDate').value = selectedDate;

  const form = document.getElementById("eventForm");

  // 👤 Ensure user is signed in
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("You must be logged in to submit events.");
      return;
    }

    // ✅ Handle form submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("eventTitle").value;
      const time = document.getElementById("eventTime").value;
      const description = document.getElementById("eventDesc").value;
      const date = document.getElementById("eventDate").value;

      try {
        await addDoc(collection(db, "events"), {
          title,
          time,
          description,
          date,
          createdBy: user.email,
          status: "pending"
        });

        alert("Event submitted!");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Error submitting event:", error);
        alert("Failed to submit event: " + error.message);
      }
    });
  });

  // 🔙 Handle back to calendar
  document.getElementById('backToCalendarBtn').addEventListener('click', () => {
    window.location.href = "index.html";
  });
});
