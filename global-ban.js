import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js"; 

const banDocRef = doc(db, "admin", "bans");

onSnapshot(banDocRef, (snap) => {
  if (snap.exists()) {
    const bannedUsers = snap.data().list || [];
    const currentNickname = localStorage.getItem("nickname");
    const flaggedName = localStorage.getItem("bannedNickname");

    // Block if their active session name or persistent device flag matches an active ban
    if ((currentNickname && bannedUsers.includes(currentNickname)) || (flaggedName && bannedUsers.includes(flaggedName))) {
      
      if (currentNickname && !flaggedName) {
        localStorage.setItem("bannedNickname", currentNickname);
      }
      
      localStorage.removeItem("nickname");

      document.body.innerHTML = `
        <div style="height:100vh; width:100vw; display:flex; align-items:center; justify-content:center; background:#000; margin:0; position:fixed; top:0; left:0; z-index:999999;">
          <span style="font-size:12vw; font-weight:900; color:#FF0000; letter-spacing:10px; text-shadow:0 0 20px rgba(255,0,0,0.8); font-family:sans-serif;">
            BANNED
          </span>
        </div>
      `;
      document.body.style.overflow = "hidden"; 
    } else {
      // Clear persistent block if they are removed from the database ban list
      if (flaggedName && !bannedUsers.includes(flaggedName)) {
        localStorage.removeItem("bannedNickname");
        window.location.reload();
      }
    }
  }
});