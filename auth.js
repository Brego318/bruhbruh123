import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const admin_nickname = "admin";
const nickname = localStorage.getItem("nickname");

// 1. Force users to signin.html if they don't have a nickname set
if (!nickname && !window.location.pathname.includes("signin.html")) {
    window.location.href = "./signin.html";
}

// 2. Real-time Ban Check (Consolidated from global-ban.js)
if (nickname) {
    const banDocRef = doc(db, "admin", "bans");
    onSnapshot(banDocRef, (snap) => {
        if (snap.exists()) {
            const bannedUsers = snap.data().list || [];
            
            if (bannedUsers.includes(nickname)) {
                // Clear their local session and show the ban screen immediately
                localStorage.removeItem("nickname");
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

// 3. Setup Header UI and Admin Controls
document.addEventListener("DOMContentLoaded", () => {
    const authBtn = document.getElementById("authBtn");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");
    const logoutBtn = document.getElementById("logoutBtn"); // Add id="logoutBtn" to your HTML button if applicable

    if (nickname) {
        if (authBtn) authBtn.style.display = "none";
        if (userMenu) userMenu.style.display = "flex";
        if (userName) userName.textContent = nickname;

        // Handle logout if button element exists
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("nickname");
                window.location.href = "./signin.html";
            });
        }

        // If user is admin, generate the Admin Panel Button
        if (nickname === admin_nickname && userMenu && !document.getElementById("adminPanelBtn")) {
            const adminPanel = document.createElement("button");
            adminPanel.id = "adminPanelBtn";
            adminPanel.textContent = "⚙️ Admin";
            adminPanel.style.cssText = "margin-left: 12px; padding: 8px 12px; background: #D97D45; color: white; border: none; border-radius: 6px; font-weight: 800; font-size: 12px; cursor: pointer;";
            userMenu.appendChild(adminPanel);
            
            adminPanel.addEventListener("click", async () => {
                const banDocRef = doc(db, "admin", "bans");
                try {
                    const snap = await getDoc(banDocRef);
                    const bannedUsers = snap.exists() ? snap.data().list || [] : [];
                    
                    // FIXED: Pre-populate prompt with existing bans separated by commas for seamless editing
                    const banListCsv = bannedUsers.join(", ");
                    const newBans = prompt(
                        "Manage Banned Users (comma-separated):\n\n• To UNBAN a user, delete their name from the list.\n• To BAN a user, add their name separated by a comma.", 
                        banListCsv
                    );
                    
                    if (newBans !== null) {
                        // FIXED: Re-parse the prompt string directly to allow additions AND deletions
                        const updated = newBans
                            .split(",")
                            .map(u => u.trim())
                            .filter(u => u && u !== admin_nickname);
                        
                        const uniqueBans = [...new Set(updated)];
                        
                        await setDoc(banDocRef, { list: uniqueBans });
                        alert("Ban list updated globally!");
                    }
                } catch (error) {
                    alert("Error updating bans: " + error.message);
                }
            });
        }
    } else {
        if (authBtn) authBtn.style.display = "block";
        if (userMenu) userMenu.style.display = "none";
    }
});