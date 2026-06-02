import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Initialize Firebase (Assuming you have a separate file for your config, or you can paste your config here)
import { app } from "./firebase-config.js"; // Adjust this to point to your actual config file
const db = getFirestore(app);

const nickname = localStorage.getItem("nickname");

// Only check for bans if the user actually has a name
if (nickname) {
  const banDocRef = doc(db, "admin", "bans");

  // onSnapshot listens to the database in real-time. 
  // The millisecond you add their name to the ban list, this triggers.
  onSnapshot(banDocRef, (snap) => {
    if (snap.exists()) {
      const bannedUsers = snap.data().list || [];
      
      if (bannedUsers.includes(nickname)) {
        // Obliterate the page content and replace it with the BANNED screen
        document.body.innerHTML = `
          <div style="height:100vh; width:100vw; display:flex; align-items:center; justify-content:center; background:#000; margin:0; position:fixed; top:0; left:0; z-index:999999;">
            <span style="font-size:12vw; font-weight:900; color:#FF0000; letter-spacing:10px; text-shadow:0 0 20px rgba(255,0,0,0.8); font-family:sans-serif;">
              BANNED
            </span>
          </div>
        `;
        document.body.style.overflow = "hidden"; // Stop them from scrolling
      }
    }
  });
}