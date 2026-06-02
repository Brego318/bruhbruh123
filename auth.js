import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const admin_nickname = "admin";
const nickname = localStorage.getItem("nickname");

// 1. Force users to signin.html if they have no name
if (!nickname && !window.location.pathname.includes("signin.html")) {
    window.location.href = "./signin.html";
}

// 2. Setup the header UI and Admin Panel
document.addEventListener("DOMContentLoaded", () => {
    const authBtn = document.getElementById("authBtn");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");

    if (nickname) {
        if (authBtn) authBtn.style.display = "none";
        if (userMenu) userMenu.style.display = "flex";
        if (userName) userName.textContent = nickname;

        // If admin, show the Admin button
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
                    const banList = bannedUsers.join("\n") || "No banned users";
                    const newBans = prompt("Current banned users:\n\n" + banList + "\n\nEnter usernames to ban (comma-separated):", "");
                    
                    if (newBans !== null) {
                        const usersToAdd = newBans.split(",").map(u => u.trim()).filter(u => u && u !== admin_nickname);
                        const updated = [...new Set([...bannedUsers, ...usersToAdd])];
                        await setDoc(banDocRef, { list: updated });
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