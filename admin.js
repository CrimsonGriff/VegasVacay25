import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7kS8qchec22bF4oiiWtZR9_acBccE8hE",
  authDomain: "vacationsite-49565.firebaseapp.com",
  projectId: "vacationsite-49565",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("You must be logged in to view this page.");
    window.location.href = "index.html";
    return;
  }

  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists() || userDocSnap.data().role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "index.html";
    return;
  }

  loadEvents();
});

async function loadEvents() {
  const pendingContainer = document.getElementById("pendingEvents");
  const otherContainer = document.getElementById("otherEvents");
  const otherHeader = document.getElementById("otherHeader");

  const eventsRef = collection(db, "events");
  const snapshot = await getDocs(eventsRef);

  let hasPending = false;
  let hasOther = false;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <strong>${data.title}</strong><br>
      <em>${data.date} @ ${data.time}</em><br>
      <small>Submitted by: ${data.createdBy}</small><br>
      <p>${data.description || ""}</p>
    `;

    const approveBtn = document.createElement("button");
    approveBtn.textContent = "Approve";
    approveBtn.onclick = () => updateDocStatus(docSnap.id, "approved");

    const denyBtn = document.createElement("button");
    denyBtn.textContent = "Deny";
    denyBtn.onclick = () => updateDocStatus(docSnap.id, "denied");

    card.appendChild(approveBtn);
    card.appendChild(denyBtn);

    if (data.status === "pending") {
        hasPending = true;
        pendingContainer.appendChild(card);
      } else {
        hasOther = true;
      
        // Add status label before appending
        const statusLabel = document.createElement("div");
        statusLabel.innerHTML = `<strong>Status:</strong> ${data.status}`;
        statusLabel.style.marginTop = "10px";
        card.appendChild(statusLabel);
      
        otherContainer.appendChild(card);
      }
  });

  if (!hasPending) {
    document.querySelector("h2").textContent = "No Pending Events";
  }

  if (hasOther) {
    otherHeader.style.display = "block";
  }
}

async function updateDocStatus(docId, newStatus) {
  const eventRef = doc(db, "events", docId);
  await updateDoc(eventRef, { status: newStatus });
  location.reload(); // Simple reload to reflect the change
}


document.getElementById("backToCalendarBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
  