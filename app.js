import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7kS8qchec22bF4oiiWtZR9_acBccE8hE",
  authDomain: "vacationsite-49565.firebaseapp.com",
  projectId: "vacationsite-49565",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


function formatTo12Hour(timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const adjustedHour = hour % 12 || 12;
    return `${adjustedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }
  




// 🔐 Handle login state changes
onAuthStateChanged(auth, async (user) => {
  const loginInputs = ['email', 'password', 'loginBtn', 'signupBtn'];
  const userInfo = document.getElementById('userInfo');
  

  if (user) {
    // ✅ Hide login fields
    loginInputs.forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById('logoutBtn').style.display = 'inline-block';

    // ✅ Show user info
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    let role = "user"; // fallback

    if (userDoc.exists()) {
      const data = userDoc.data();
      userInfo.textContent = `${data.firstName} (${data.role})`;
      role = data.role;
    } else {
      userInfo.textContent = user.email;
    }
    
    const adminBtn = document.getElementById("adminBtn");
    adminBtn.style.display = role === "admin" ? "inline-block" : "none";

  } else {
    // 📴 Show login fields
    loginInputs.forEach(id => document.getElementById(id).style.display = 'inline-block');
    userInfo.textContent = '';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById("adminBtn").style.display = "none";
  }
  renderCalendar(); // Always render the calendar
});

// 🔓 Login
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in!");
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// 🆕 Signup
document.getElementById('signupBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const firstName = prompt("Enter your first name:");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email,
      firstName,
      role: email === "youradminemail@example.com" ? "admin" : "user"
    });

    alert("Account created!");

  } catch (err) {
    alert("Signup failed: " + err.message);
  }
});

// 🚪 Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
  alert("Logged out");
});

// 📅 Calendar rendering (always visible)
function renderCalendar() {
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  const daysInMonth = 30;
  const startDay = 5;
  const dayHeaders = document.getElementById('dayHeaders');
  dayHeaders.innerHTML = '';
  dayHeaders.style.display = 'grid';
  dayHeaders.style.gridTemplateColumns = 'repeat(7, 1fr)';
  dayHeaders.style.marginBottom = '10px';
  
  const dayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  dayLabels.forEach(day => {
    const headerCell = document.createElement("div");
    headerCell.className = "day-header";
    headerCell.textContent = day;
    dayHeaders.appendChild(headerCell);
  });
  
  
  
  
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    
    const dateNum = document.createElement('span');

    dateNum.className = 'day-number';
    dateNum.textContent = day;
    cell.appendChild(dateNum);
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-event-btn';
    submitBtn.textContent = "Submit Event";
    submitBtn.onclick = () => {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to submit events.");
        return;
      }
      localStorage.setItem('selectedDate', `2025-11-${String(day).padStart(2, '0')}`);
      window.location.href = 'submit-event.html';
    };
    cell.appendChild(submitBtn);
    cell.addEventListener('click', () => {
        openAvailabilityModal(day);
      });
    calendar.appendChild(cell);
      }
}

// 🗓 Modal logic (unchanged — you can keep your openAvailabilityModal function)

  //Day Modal
  async function openAvailabilityModal(day) {
    const modal = document.getElementById('availabilityModal');
    const modalDateDisplay = document.getElementById('modalDateDisplay');
    const startInput = document.getElementById('startTimeInput');
    const endInput = document.getElementById('endTimeInput');
    const availableList = document.getElementById('availableList');
    const eventList = document.getElementById('eventList');
  
    const year = 2025;
    const month = 10; // November (0-indexed)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Set event button action
    document.getElementById('submitEventBtn').onclick = () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          alert("You must be logged in to submit events.");
          return; // ❌ don't continue
        }
      
        localStorage.setItem('selectedDate', dateStr);
        window.location.href = 'submit-event.html';
      };
  
  
    modalDateDisplay.textContent = dateStr;
    modal.style.display = 'block';
  
    // Clear previous entries
    availableList.innerHTML = '';
    eventList.innerHTML = '';
    startInput.value = '';
    endInput.value = '';
  
    const user = auth.currentUser;
  
    // Load user's own availability
    const availabilityRef = doc(db, "availability", user.uid);
    console.log("Reading YOUR availability from:", availabilityRef.path);
    const availabilitySnap = await getDoc(availabilityRef);
    const availabilityData = availabilitySnap.exists() ? availabilitySnap.data() : {};
  
    if (availabilityData[dateStr]) {
      startInput.value = availabilityData[dateStr].start;
      endInput.value = availabilityData[dateStr].end;
    }
  
    // Save availability
    document.getElementById('saveAvailabilityBtn').onclick = async () => {
      const startTime = startInput.value;
      const endTime = endInput.value;
  
      if (!startTime || !endTime) {
        alert("Please enter both times.");
        return;
      }
  
      let newData = availabilitySnap.exists() ? availabilitySnap.data() : {};
      newData[dateStr] = { start: startTime, end: endTime };
      await setDoc(availabilityRef, newData);
  
      alert("Availability saved.");
      modal.style.display = 'none';
    };
  
    // Load all availability for that day
    const usersSnapshot = await getDocs(collection(db, "users"));

    for (const userDoc of usersSnapshot.docs) {
        try {
          const uid = userDoc.id;
          const userData = userDoc.data();
          const availRef = doc(db, "availability", uid);
      
          console.log("Trying to read availability for UID:", uid);
      
          const availSnap = await getDoc(availRef);
      
          if (availSnap.exists()) {
            const avail = availSnap.data();
            console.log("Checking user:", userData.firstName, "Data:", avail);
      
            if (avail[dateStr]) {
              const li = document.createElement('li');
              li.textContent = `${userData.firstName}: ${formatTo12Hour(avail[dateStr].start)} – ${formatTo12Hour(avail[dateStr].end)}`;
              availableList.appendChild(li);
            }
          }
      
        } catch (error) {
          console.error(`Error reading availability for user:`, error.message);
        }
      }
  
    // Load approved events for that day
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("date", "==", dateStr), where("status", "==", "approved"));
    const eventsSnap = await getDocs(q);
    eventsSnap.forEach(doc => {
      const event = doc.data();
      const li = document.createElement('li');
      li.textContent = `${event.title} @ ${formatTo12Hour(event.time)}`;
      eventList.appendChild(li);
    });
  }