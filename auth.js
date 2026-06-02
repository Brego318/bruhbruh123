import { 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot, 
    collection, 
    query, 
    where, 
    getDocs, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const admin_nickname = "admin";
const nickname = localStorage.getItem("nickname");
let clientId = localStorage.getItem("clientId");

// Fallback to generate a clientId if a user has a nickname but no tracking ID yet
if (!clientId && nickname) {
    clientId = crypto.randomUUID();
    localStorage.setItem("clientId", clientId);
}

// 1. Force users to signin.html if they don't have a nickname set
if (!nickname && !window.location.pathname.includes("signin.html")) {
    window.location.href = "./signin.html";
}

// 2. Real-time Ban Check & Active Visitor Tracking
if (nickname) {
    const banDocRef = doc(db, "admin", "bans");
    onSnapshot(banDocRef, (snap) => {
        if (snap.exists()) {
            const bannedUsers = snap.data().list || [];
            
            if (bannedUsers.includes(nickname)) {
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

    // Track user's active page and time
    if (clientId) {
        const pageName = window.location.pathname.split("/").pop() || "index.html";
        setDoc(doc(db, "profiles", clientId), {
            nickname: nickname,
            lastActive: serverTimestamp(),
            currentPage: pageName
        }, { merge: true }).catch(e => console.error("Tracking error:", e));
    }
}

// 3. Setup Header UI and Admin Dashboard Modal
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

        // Generate Admin Dashboard Button if the logged-in user is 'admin'
        if (nickname === admin_nickname && userMenu && !document.getElementById("adminPanelBtn")) {
            const adminPanel = document.createElement("button");
            adminPanel.id = "adminPanelBtn";
            adminPanel.textContent = "⚙️ Admin";
            adminPanel.style.cssText = "margin-left: 12px; padding: 8px 12px; background: #D97D45; color: white; border: none; border-radius: 6px; font-weight: 800; font-size: 12px; cursor: pointer;";
            userMenu.appendChild(adminPanel);
            
            adminPanel.addEventListener("click", async () => {
                const banDocRef = doc(db, "admin", "bans");
                
                try {
                    // Fetch bans
                    const banSnap = await getDoc(banDocRef);
                    const bannedUsers = banSnap.exists() ? banSnap.data().list || [] : [];
                    
                    // Fetch profiles active in the last 10 minutes
                    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
                    const activeQuery = query(collection(db, "profiles"), where("lastActive", ">=", tenMinsAgo));
                    const activeSnap = await getDocs(activeQuery);
                    
                    let activeUsersHtml = "";
                    activeSnap.forEach((userDoc) => {
                        const userData = userDoc.data();
                        activeUsersHtml += `
                            <div style="padding: 8px 0; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
                                <span style="color: #fff;">🟢 <strong>${userData.nickname}</strong></span>
                                <span style="color: #aaa; background: #222; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${userData.currentPage}</span>
                            </div>
                        `;
                    });

                    if (!activeUsersHtml) {
                        activeUsersHtml = `<p style="color: #777; font-size: 14px; text-align: center; margin: 15px 0;">No visitors active in the last 10 minutes.</p>`;
                    }

                    // Create Floating Dashboard Overlay Modal
                    const modal = document.createElement("div");
                    modal.id = "adminDashboardModal";
                    modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:999999; display:flex; align-items:center; justify-content:center; font-family:'Montserrat', sans-serif; box-sizing:border-box; padding: 20px;";
                    
                    modal.innerHTML = `
                        <div style="background:#111; border:1px solid #333; border-radius:12px; width:100%; max-width:450px; padding:24px; box-sizing:border-box; position:relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                            <button id="closeAdminModal" style="position:absolute; top:16px; right:16px; background:none; border:none; color:#aaa; font-size:20px; cursor:pointer;">✕</button>
                            <h3 style="margin-top:0; color:#D97D45; border-bottom:1px solid #333; padding-bottom:12px; font-size: 20px; font-weight:900; letter-spacing: 0.5px;">Dashboard</h3>
                            
                            <h4 style="color:#fff; margin: 16px 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Active Visitors</h4>
                            <div style="max-height:160px; overflow-y:auto; background:#161616; padding:0 12px; border-radius:6px; border: 1px solid #222;">
                                ${activeUsersHtml}
                            </div>

                            <h4 style="color:#fff; margin: 20px 0 4px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Ban Management</h4>
                            <p style="font-size:11px; color:#aaa; margin:0 0 8px 0;">Separate names with commas. Delete a name to unban them.</p>
                            <textarea id="banInput" style="width:100%; height:70px; background:#161616; color:#fff; border:1px solid #333; border-radius:6px; padding:10px; box-sizing:border-box; resize:none; font-family: sans-serif; font-size: 14px;">${bannedUsers.join(", ")}</textarea>
                            
                            <button id="saveBansBtn" style="width:100%; margin-top: 16px; padding:12px; background:#D97D45; color:#fff; border:none; border-radius:6px; font-weight:800; font-size: 14px; cursor:pointer; transition: background 0.2s;">Save Changes</button>
                        </div>
                    `;

                    document.body.appendChild(modal);

                    // Modal UI Functionality
                    document.getElementById("closeAdminModal").onclick = () => modal.remove();
                    
                    document.getElementById("saveBansBtn").onclick = async () => {
                        const txt = document.getElementById("banInput").value;
                        const updated = txt.split(",")
                            .map(u => u.trim())
                            .filter(u => u && u !== admin_nickname);
                        
                        const uniqueBans = [...new Set(updated)];
                        
                        try {
                            await setDoc(banDocRef, { list: uniqueBans });
                            alert("Ban list updated successfully!");
                            modal.remove();
                        } catch (error) {
                            alert("Error saving bans: " + error.message);
                        }
                    };

                } catch (error) {
                    alert("Error loading dashboard data: " + error.message);
                }
            });
        }
    } else {
        if (authBtn) authBtn.style.display = "block";
        if (userMenu) userMenu.style.display = "none";
    }
});