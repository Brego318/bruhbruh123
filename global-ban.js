import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js"; 

const nickname = localStorage.getItem("nickname");

if (nickname) {
  const banDocRef = doc(db, "admin", "bans");

  onSnapshot(banDocRef, (snap) => {
    if (snap.exists()) {
      const bannedUsers = snap.data().list || [];
      
      if (bannedUsers.includes(nickname)) {
        // Stop the user entirely
        document.body.innerHTML = `
          <div style="height:100vh; width:100vw; display:flex; align-items:center; justify-content:center; background:#000; margin:0; position:fixed; top:0; left:0; z-index:999999;">
            <span style="font-size:12vw; font-weight:900; color:#FF0000; letter-spacing:10px; text-shadow:0 0 20px rgba(255,0,0,0.8); font-family:sans-serif;">
              BANNED
            </span>
          </div>
        `;
        document.body.style.overflow = "hidden"; 
      }
    }
  });
}