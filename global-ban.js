import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Hardcoded configuration so it never fails to connect
const firebaseConfig = {
  apiKey: "AIzaSyBd7OSQKhHA-iY4ET5JQOF-PDwb-fIQ46Y",
  authDomain: "kobestyaosani.firebaseapp.com",
  projectId: "kobestyaosani",
  storageBucket: "kobestyaosani.firebasestorage.app",
  messagingSenderId: "30467496929",
  appId: "1:30467496929:web:2d49f73e90388c2fcd10a0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const admin_nickname = "admin";

// 1. REAL-TIME BAN WATCHER
const banDocRef = doc(db, "admin", "bans");
onSnapshot(banDocRef, (snap) => {
    if (snap.exists()) {
        const bannedUsers = snap.data().list || [];
        const currentNickname = localStorage.getItem("nickname");
        const flaggedName = localStorage.getItem("bannedNickname");

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
            if (flaggedName && !bannedUsers.includes(flaggedName)) {
                localStorage.removeItem("bannedNickname");
                window.location.reload();
            }
        }
    }
});

// 2. ROUTING PROTECTION
const nickname = localStorage.getItem("nickname");
const bannedNickname = localStorage.getItem("bannedNickname");

if (!nickname && !bannedNickname && !window.location.pathname.includes("signin.html")) {
    window.location.href = "./signin.html";
}

// 3. ADMIN PANEL GENERATOR
document.addEventListener("DOMContentLoaded", () => {
    const userMenu = document.getElementById("userMenu");

    if (nickname === admin_nickname && userMenu && !document.getElementById("adminPanelBtn")) {
        const adminPanel = document.createElement("button");
        adminPanel.id = "adminPanelBtn";
        adminPanel.textContent = "⚙️ Admin";
        adminPanel.style.cssText = "margin-left: 12px; padding: 8px 12px; background: #D97D45; color: white; border: none; border-radius: 6px; font-weight: 800; font-size: 12px; cursor: pointer;";
        userMenu.appendChild(adminPanel);
        
        adminPanel.addEventListener("click", async () => {
            const banDocRef = doc(db, "admin", "bans");
            const profilesRef = collection(db, "profiles");
            
            try {
                const profilesSnap = await getDocs(profilesRef);
                const activeNicknames = [];
                
                profilesSnap.forEach((userDoc) => {
                    const userData = userDoc.data();
                    if (userData.nickname && userData.nickname !== admin_nickname) {
                        activeNicknames.push(userData.nickname);
                    }
                });
                
                const deduplicatedActive = [...new Set(activeNicknames)];
                const activeListText = deduplicatedActive.length > 0 ? deduplicatedActive.join(", ") : "No active users registered";

                const snap = await getDoc(banDocRef);
                const bannedUsers = snap.exists() ? snap.data().list || [] : [];
                const banListCsv = bannedUsers.join(", ");
                
                const newBans = prompt(
                    `ACTIVE REGISTERED USERS:\n[ ${activeListText} ]\n\n` +
                    `Manage Banned Users (comma-separated):\n\n` +
                    `• To UNBAN a user, delete their name from the list.\n` +
                    `• To BAN a user, add their name separated by a comma.`, 
                    banListCsv
                );
                
                if (newBans !== null) {
                    const updated = newBans
                        .split(",")
                        .map(u => u.trim())
                        .filter(u => u && u !== admin_nickname);
                    
                    const uniqueBans = [...new Set(updated)];
                    
                    await setDoc(banDocRef, { list: uniqueBans });
                    alert("Ban list updated globally!");
                }
            } catch (error) {
                alert("Error updating database configurations: " + error.message);
            }
        });
    }
});