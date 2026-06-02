import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const admin_nickname = "admin";

// 1. REAL-TIME BAN WATCHER (Kicks banned users instantly)
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

// 3. ADMIN PANEL GENERATOR (Fixes Active User Visibility)
document.addEventListener("DOMContentLoaded", () => {
    const authBtn = document.getElementById("authBtn");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");
    const logoutBtn = document.getElementById("logoutBtn");

    if (nickname) {
        if (authBtn) authBtn.style.display = "none";
        if (userMenu) userMenu.style.display = "flex";
        if (userName) userName.textContent = nickname;

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("nickname");
                window.location.href = "./signin.html";
            });
        }

        // Generate Admin Button if you are logged in as admin
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
                    // FIX: Explicitly queries the 'profiles' collection for all signed-in users
                    const profilesSnap = await getDocs(profilesRef);
                    const activeNicknames = [];
                    
                    profilesSnap.forEach((userDoc) => {
                        const userData = userDoc.data();
                        if (userData.nickname && userData.nickname !== admin_nickname) {
                            activeNicknames.push(userData.nickname);
                        }
                    });
                    
                    // Format active users text block and remove any duplicates
                    const deduplicatedActive = [...new Set(activeNicknames)];
                    const activeListText = deduplicatedActive.length > 0 ? deduplicatedActive.join(", ") : "No active users registered";

                    // Fetch the current ban list
                    const snap = await getDoc(banDocRef);
                    const bannedUsers = snap.exists() ? snap.data().list || [] : [];
                    const banListCsv = bannedUsers.join(", ");
                    
                    // Display the dynamic prompt window
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
    } else {
        if (authBtn) authBtn.style.display = "block";
        if (userMenu) userMenu.style.display = "none";
    }
});