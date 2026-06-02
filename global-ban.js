import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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

// 1. GLOBAL REAL-TIME BAN ENFORCER
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

// 2. ROUTING SAFETY
const nickname = localStorage.getItem("nickname");
const bannedNickname = localStorage.getItem("bannedNickname");

if (!nickname && !bannedNickname && !window.location.pathname.includes("signin.html")) {
    window.location.href = "./signin.html";
}

// 3. SECURE ADMINISTRATIVE CONTROL PANEL MODAL (STYLISH UI)
document.addEventListener("DOMContentLoaded", () => {
    // Target user menus on both main layouts safely to prevent background crashes
    const userMenu = document.getElementById("userMenu");

    if (nickname === admin_nickname && userMenu && !document.getElementById("adminPanelBtn")) {
        const adminPanel = document.createElement("button");
        adminPanel.id = "adminPanelBtn";
        adminPanel.textContent = "⚙️ Admin Controls";
        adminPanel.style.cssText = "margin-left: 12px; padding: 8px 14px; background: #D97D45; color: white; border: none; border-radius: 6px; font-weight: 800; font-size: 12px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(217,125,69,0.3); font-family: 'Montserrat', sans-serif;";
        
        userMenu.parentNode.insertBefore(adminPanel, userMenu.nextSibling);
        
        adminPanel.addEventListener("click", async () => {
            // Remove an old modal instance if it exists
            const oldModal = document.getElementById("adminUiModal");
            if (oldModal) oldModal.remove();

            const profilesRef = collection(db, "profiles");
            
            try {
                // Fetch live active records and ban definitions simultaneously
                const [profilesSnap, banSnap] = await Promise.all([
                    getDocs(profilesRef),
                    getDoc(banDocRef)
                ]);

                const activeNicknames = [];
                profilesSnap.forEach((userDoc) => {
                    const userData = userDoc.data();
                    if (userData.nickname && userData.nickname !== admin_nickname) {
                        activeNicknames.push(userData.nickname);
                    }
                });
                
                const deduplicatedActive = [...new Set(activeNicknames)];
                const bannedUsersList = banSnap.exists() ? banSnap.data().list || [] : [];

                // Create full gorgeous UI overlay container
                const modalDiv = document.createElement("div");
                modalDiv.id = "adminUiModal";
                modalDiv.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 99999; font-family: 'Montserrat', 'Noto Serif Georgian', sans-serif; color: #fff;";

                modalDiv.innerHTML = `
                    <div style="background: #141416; border: 1px solid #23262F; width: 90%; max-width: 550px; padding: 30px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #23262F; padding-bottom: 15px;">
                            <h3 style="margin: 0; font-size: 20px; color: #fff; font-weight: 800;">⚙️ System Admin Hub</h3>
                            <button id="closeAdminUi" style="background: transparent; border: none; color: #777E90; font-size: 20px; cursor: pointer;">&times;</button>
                        </div>

                        <!-- Active Users Section -->
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #777E90; letter-spacing: 1px;">Active Registered Users</h4>
                        <div id="modalActiveContainer" style="background: #1C1D21; border-radius: 8px; padding: 12px; font-size: 14px; max-height: 100px; overflow-y: auto; margin-bottom: 20px; border: 1px solid #23262F; line-height: 1.6;">
                            ${deduplicatedActive.map(name => `<span class="user-pill" style="display:inline-block; background:#23262F; padding: 3px 10px; border-radius: 20px; margin: 4px; font-weight: 600; cursor: pointer; border: 1px solid transparent;" title="Click to copy name">${name}</span>`).join('') || '<span style="color:#555">No registered users located</span>'}
                        </div>

                        <!-- Ban Settings Form -->
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #777E90; letter-spacing: 1px;">Global Ban Management</h4>
                        <p style="margin: 0 0 12px 0; font-size: 12px; color: #B1B5C3;">Add or delete names below separated by commas to update network rules dynamically.</p>
                        <textarea id="banTextEngine" style="width: 100%; height: 110px; background: #1C1D21; color: #fff; border: 1px solid #23262F; border-radius: 10px; padding: 14px; box-sizing: border-box; resize: none; font-size: 14px; font-family: monospace; line-height: 1.5; outline: none; transition: border 0.2s;">${bannedUsersList.join(', ')}</textarea>

                        <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
                            <button id="cancelAdminUi" style="background: #23262F; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">Cancel</button>
                            <button id="saveAdminUi" style="background: #D97D45; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(217,125,69,0.2);">Apply System Rules</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modalDiv);

                // Add focus border animation handling
                const tArea = document.getElementById("banTextEngine");
                tArea.onfocus = () => tArea.style.borderColor = "#D97D45";
                tArea.onblur = () => tArea.style.borderColor = "#23262F";

                // Fast Quick-Action: Click an active name pill to inject it directly into the ban engine box
                modalDiv.querySelectorAll(".user-pill").forEach(pill => {
                    pill.onmouseenter = () => { pill.style.borderColor = "#D97D45"; pill.style.background = "#1C1D21"; };
                    pill.onmouseleave = () => { pill.style.borderColor = "transparent"; pill.style.background = "#23262F"; };
                    pill.onclick = () => {
                        const existingVal = tArea.value.trim();
                        const cleanPillName = pill.textContent.trim();
                        if(existingVal.includes(cleanPillName)) return;
                        tArea.value = existingVal ? `${existingVal}, ${cleanPillName}` : cleanPillName;
                        tArea.focus();
                    };
                });

                // Window Closure Operations
                const destroyModal = () => modalDiv.remove();
                document.getElementById("closeAdminUi").onclick = destroyModal;
                document.getElementById("cancelAdminUi").onclick = destroyModal;

                // Fire database synchronization updates
                document.getElementById("saveAdminUi").onclick = async () => {
                    const saveBtn = document.getElementById("saveAdminUi");
                    saveBtn.disabled = true;
                    saveBtn.textContent = "Syncing...";

                    const rawInput = document.getElementById("banTextEngine").value;
                    const parsedBans = rawInput
                        .split(",")
                        .map(u => u.trim())
                        .filter(u => u && u.toLowerCase() !== admin_nickname);
                    
                    const uniqueBans = [...new Set(parsedBans)];

                    try {
                        await setDoc(banDocRef, { list: uniqueBans });
                        destroyModal();
                        
                        // Spawn a quick beautiful success toast
                        const toast = document.createElement("div");
                        toast.style.cssText = "position: fixed; bottom: 30px; right: 30px; background: #45D982; color: black; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; z-index: 100000; box-shadow: 0 10px 20px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;";
                        toast.textContent = "🚀 Security database rules updated globally!";
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 3500);

                    } catch (error) {
                        alert("Database configuration sync issue: " + error.message);
                        saveBtn.disabled = false;
                        saveBtn.textContent = "Apply System Rules";
                    }
                };

            } catch (err) {
                console.error("Failed to build administrative control structures:", err);
            }
        });
    }
});