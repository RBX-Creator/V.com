import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, where, increment, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFYpNQhrN5hRhNR5ZVEqhdfvRtSDsdorM",
  authDomain: "v-com-67ec0.firebaseapp.com",
  projectId: "v-com-67ec0",
  storageBucket: "v-com-67ec0.firebasestorage.app",
  messagingSenderId: "409154950940",
  appId: "1:409154950940:web:030351ef6e317f01bc0cd9",
  measurementId: "G-94DGJZJGG3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== i18n =====
const I18N = {
  en: {
    login_title: "Log in to V", register_title: "Sign up for V",
    login: "Log in", register: "Sign up",
    no_account: "No account? Sign up", has_account: "Already have an account? Log in",
    email: "Email", password: "Password", display_name: "Display name",
    following: "Following", followers: "Followers", profile: "Profile",
    messages: "Messages", bookmarks: "Bookmarks", settings: "Settings", logout: "Log out",
    for_you: "For you", whats_happening: "What's happening?", post: "Post",
    post_public: "Public feed", post_profile: "Profile only",
    search: "Search V", trends: "Trends for you", notifications: "Notifications",
    nothing_yet: "Nothing here yet", likes_replies_here: "Likes and replies will show up here.",
    write_message: "Write a message...", send: "Send",
    save_posts: "Save posts for later", edit_profile: "Edit profile",
    follow: "Follow", following_btn: "Following", message: "Message",
    profile_picture: "Profile picture", banner: "Banner", name: "Name",
    handle: "Handle", bio: "Bio", save: "Save", cancel: "Cancel",
    posts: "Posts", private_profile: "This profile is private",
    follow_to_see: "Follow each other to see their posts.",
    language: "Language", profile_privacy: "Profile privacy",
    privacy_hint: "Private: only mutual friends can see your profile posts.",
    public: "Public – everyone", private: "Private – friends only",
    edit_post: "Edit post", delete_post: "Delete", edit: "Edit",
    confirm_delete: "Delete this post?", verify_email: "Please verify your email first.",
    settings_saved: "Settings saved!", profile_saved: "Profile saved!",
    private_badge: "🔒 Private profile", public_badge: "🌐 Public profile",
    no_replies: "No replies yet. Be the first!", loading_replies: "Loading replies...",
    welcome: "Welcome to V!", write_above: "Write something above or use the blue button.",
    only_mutual_dm: "You can only message mutual friends.",
    no_chats: "No chats yet", mutual_needed: "Follow each other first to chat.",
    need_name: "Please enter a display name",
  },
  de: {
    login_title: "Bei V anmelden", register_title: "Bei V registrieren",
    login: "Anmelden", register: "Registrieren",
    no_account: "Noch kein Konto? Registrieren", has_account: "Schon ein Konto? Anmelden",
    email: "E-Mail", password: "Passwort", display_name: "Anzeigename",
    following: "Folgt", followers: "Follower", profile: "Profil",
    messages: "Nachrichten", bookmarks: "Lesezeichen", settings: "Einstellungen", logout: "Abmelden",
    for_you: "Für dich", whats_happening: "Was gibt's Neues?", post: "Posten",
    post_public: "Öffentlicher Feed", post_profile: "Nur Profil",
    search: "V durchsuchen", trends: "Trends für dich", notifications: "Benachrichtigungen",
    nothing_yet: "Noch nichts hier", likes_replies_here: "Likes und Antworten erscheinen hier.",
    write_message: "Nachricht schreiben...", send: "Senden",
    save_posts: "Posts für später speichern", edit_profile: "Profil bearbeiten",
    follow: "Folgen", following_btn: "Folgend", message: "Nachricht",
    profile_picture: "Profilbild", banner: "Banner", name: "Name",
    handle: "Handle", bio: "Bio", save: "Speichern", cancel: "Abbrechen",
    posts: "Beiträge", private_profile: "Dieses Profil ist privat",
    follow_to_see: "Folgt euch gegenseitig, um Beiträge zu sehen.",
    language: "Sprache", profile_privacy: "Profil-Privatsphäre",
    privacy_hint: "Privat: nur gegenseitige Freunde sehen deine Profil-Posts.",
    public: "Öffentlich – jeder", private: "Privat – nur Freunde",
    edit_post: "Beitrag bearbeiten", delete_post: "Löschen", edit: "Bearbeiten",
    confirm_delete: "Diesen Beitrag löschen?", verify_email: "Bitte zuerst E-Mail bestätigen.",
    settings_saved: "Einstellungen gespeichert!", profile_saved: "Profil gespeichert!",
    private_badge: "🔒 Privates Profil", public_badge: "🌐 Öffentliches Profil",
    no_replies: "Noch keine Kommentare. Sei der Erste!", loading_replies: "Kommentare werden geladen...",
    welcome: "Willkommen bei V!", write_above: "Schreib etwas oben oder nutze den blauen Button.",
    only_mutual_dm: "Nur bei gegenseitigem Follow könnt ihr schreiben.",
    no_chats: "Noch keine Chats", mutual_needed: "Folgt euch zuerst gegenseitig.",
    need_name: "Bitte Anzeigename eingeben",
  }
};

let lang = "en";
function t(key) {
  return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key && t(key)) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key && t(key)) el.placeholder = t(key);
  });
  // update auth switch dynamically based on mode
  const authSwitch = document.getElementById("authSwitch");
  const authTitle = document.getElementById("authTitle");
  const authSubmit = document.getElementById("authSubmit");
  if (authSwitch && authTitle && authSubmit) {
    if (isRegisterMode) {
      authTitle.textContent = t("register_title");
      authSubmit.textContent = t("register");
      authSwitch.textContent = t("has_account");
    } else {
      authTitle.textContent = t("login_title");
      authSubmit.textContent = t("login");
      authSwitch.textContent = t("no_account");
    }
  }
  // scope select options
  const scope = document.getElementById("postScope");
  if (scope) {
    const opts = scope.querySelectorAll("option");
    if (opts[0]) opts[0].textContent = t("post_public");
    if (opts[1]) opts[1].textContent = t("post_profile");
  }
  const privacy = document.getElementById("privacySelect");
  if (privacy) {
    const opts = privacy.querySelectorAll("option");
    if (opts[0]) opts[0].textContent = t("public");
    if (opts[1]) opts[1].textContent = t("private");
  }
}

let currentUser = null;
let currentProfile = null;
let viewingUserId = null;
let isRegisterMode = false;
let allPosts = [];
let selectedMedia = [];
let viewedPosts = new Set();
let openReplyId = null;
let repliesCache = {};
let pendingAvatar = null;
let pendingBanner = null;
let activeChatPartner = null;
let dmUnsub = null;
let editingPostId = null;

function requireVerified() {
  if (!currentUser) return false;
  if (!currentUser.emailVerified) {
    alert(t("verify_email"));
    return false;
  }
  return true;
}

// ===== Roles & moderation =====
// Owner bootstrap: handle "vida" (case-insensitive) is always owner
function getRole(profile) {
  if (!profile) return "user";
  // ONLY handle "vida" is owner – nobody else can be owner
  if ((profile.handle || "").toLowerCase() === "vida") return "owner";
  if (profile.role === "mod") return "mod";
  return "user";
}
function isOwnerProfile(profile) {
  return (profile?.handle || "").toLowerCase() === "vida";
}
function isStaff() {
  const r = getRole(currentProfile);
  return r === "owner" || r === "mod";
}
function isOwner() {
  // Crown ONLY for @vida
  return (currentProfile?.handle || "").toLowerCase() === "vida";
}
async function findUserByHandle(handle) {
  handle = (handle || "").trim().replace(/^@/, "").toLowerCase();
  if (!handle) return null;
  const snap = await getDocs(collection(db, "users"));
  let found = null;
  snap.forEach(d => {
    const p = d.data();
    if ((p.handle || "").toLowerCase() === handle) found = { uid: d.id, ...p };
  });
  return found;
}
function canModerateTarget(targetProfile) {
  const tr = getRole(targetProfile);
  if (tr === "owner") return false;
  if (isOwner()) return true;
  if (getRole(currentProfile) === "mod" && tr === "user") return true;
  return false;
}
async function requireNotBanned() {
  if (!currentUser || !currentProfile) return false;
  if (currentProfile.banned) {
    alert("You are banned from V.");
    return false;
  }
  if (currentProfile.timeoutUntil) {
    const until = currentProfile.timeoutUntil.toDate ? currentProfile.timeoutUntil.toDate() : new Date(currentProfile.timeoutUntil);
    if (until > new Date()) {
      alert("You are timed out until " + until.toLocaleString());
      return false;
    }
  }
  return true;
}
function verifiedBadgeHtml(profile) {
  if (profile && (profile.verified || isOwnerProfile(profile))) {
    return `<span class="verified-badge" title="Verified" aria-label="Verified"><svg class="verified-svg" viewBox="0 0 22 22" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path fill="#1D9BF0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.13-.634-.44-1.218-.892-1.69-.452-.47-1.034-.792-1.67-.934-.637-.143-1.294-.11-1.9.095-.543-.56-.97-1.057-1.51-1.41C13.27.832 12.646.635 12 .618c-.646.017-1.273.214-1.814.57-.54.354-.972.852-1.245 1.438-.607-.223-1.265-.27-1.898-.14-.634.13-1.218.44-1.69.892-.47.452-.792 1.034-.934 1.67-.143.637-.11 1.294.095 1.9-.56.543-1.057.97-1.41 1.509C.832 8.73.635 9.354.618 10c.017.646.214 1.273.57 1.814.354.54.852.972 1.438 1.245-.223.607-.27 1.265-.14 1.898.13.634.44 1.218.892 1.69.452.47 1.034.792 1.67.934.637.143 1.294.11 1.9-.095.543.56.97 1.057 1.509 1.41.541.355 1.165.552 1.811.569.646-.016 1.273-.213 1.814-.569.54-.354.972-.852 1.245-1.438.607.223 1.265.27 1.898.14.634-.13 1.218-.44 1.69-.892.47-.452.792-1.034.934-1.67.143-.637.11-1.294-.095-1.9.56-.543 1.057-.97 1.41-1.509.355-.541.552-1.165.569-1.811zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg></span>`;
  }
  return "";
}
function updateAdminNav() {
  const btn = document.getElementById("adminNavBtn");
  const icon = document.getElementById("adminNavIcon");
  if (!btn) return;
  // ONLY owner @vida sees the crown / owner panel
  if (isOwner()) {
    btn.classList.remove("hidden");
    if (icon) icon.innerHTML = ICO.crown;
  } else if (getRole(currentProfile) === "mod") {
    btn.classList.remove("hidden");
    if (icon) icon.innerHTML = ICO.shield;
  } else {
    btn.classList.add("hidden");
    if (icon) icon.innerHTML = "";
  }
}


const splash = document.getElementById("splash");
const authModal = document.getElementById("authModal");
const appEl = document.getElementById("app");
const sideMenu = document.getElementById("sideMenu");
const sideMenuOverlay = document.getElementById("sideMenuOverlay");

// Splash: wait for intro video to finish (handled in index.html).
setTimeout(() => {
  try {
    const cp = document.getElementById("cartPanel");
    if (cp) { cp.classList.add("hidden"); cp.style.display = "none"; }
  } catch (_) {}
}, 500);

applyI18n();

const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authName = document.getElementById("authName");
const authSubmit = document.getElementById("authSubmit");
const authSwitch = document.getElementById("authSwitch");
const authError = document.getElementById("authError");

async function doAuth() {
  const emailEl = document.getElementById("authEmail");
  const passEl = document.getElementById("authPassword");
  const nameEl = document.getElementById("authName");
  const errEl = document.getElementById("authError");
  const btn = document.getElementById("authSubmit");
  if (!emailEl || !passEl) {
    alert("Login form missing. Please reload the page.");
    return;
  }
  const email = (emailEl.value || "").trim();
  const password = passEl.value || "";
  const name = (nameEl?.value || "").trim();
  if (errEl) { errEl.classList.add("hidden"); errEl.textContent = ""; }
  if (!email || !password) {
    if (errEl) { errEl.textContent = "Please enter email and password."; errEl.classList.remove("hidden"); }
    else alert("Please enter email and password.");
    return;
  }
  const oldText = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.textContent = "…"; }
  try {
    if (isRegisterMode) {
      if (!name) throw new Error(t("need_name") || "Display name required");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        handle: name.toLowerCase().replace(/\s+/g, "").slice(0, 15),
        bio: "",
        following: [],
        followers: [],
        avatarUrl: "",
        bannerUrl: "",
        lang: "en",
        profilePrivacy: "public",
        createdAt: serverTimestamp()
      });
      try { await sendEmailVerification(cred.user); } catch (_) {}
      alert(t("verify_email") || "Please verify your email.");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    console.error("auth error", err);
    const msg = err?.message || String(err);
    if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); }
    else alert(msg);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = oldText || (isRegisterMode ? "Sign up" : "Log in"); }
  }
}

document.getElementById("authSwitch")?.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  document.getElementById("authName")?.classList.toggle("hidden", !isRegisterMode);
  document.getElementById("authError")?.classList.add("hidden");
  applyI18n();
});

document.getElementById("authSubmit")?.addEventListener("click", (e) => {
  e.preventDefault();
  doAuth();
});

// Also support Enter key in password/email fields
["authEmail", "authPassword", "authName"].forEach(id => {
  document.getElementById(id)?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); doAuth(); }
  });
});

// Event delegation backup for login button
document.addEventListener("click", (e) => {
  if (e.target.closest("#authSubmit")) {
    e.preventDefault();
    doAuth();
  }
});


// Remember #shop before auth finishes
try {
  if ((location.hash || "").toLowerCase().includes("shop")) {
    sessionStorage.setItem("vPendingPage", "shop");
  }
} catch (_) {}
onAuthStateChanged(auth, async (user) => {
  try {
  if (user) {
    currentUser = user;
    authModal?.classList.add("hidden");
    appEl?.classList.remove("hidden");
    const userDoc = await getDoc(doc(db, "users", user.uid));
    currentProfile = userDoc.exists() ? userDoc.data() : {
      name: user.displayName || "User", handle: "user", bio: "",
      following: [], followers: [], lang: "en", profilePrivacy: "public"
    };
    if (!currentProfile.following) currentProfile.following = [];
    if (!currentProfile.followers) currentProfile.followers = [];
    lang = currentProfile.lang || "en";
    applyI18n();
    // bootstrap owner role for vida
    if ((currentProfile.handle || "").toLowerCase() === "vida" && currentProfile.role !== "owner") {
      currentProfile.role = "owner";
      currentProfile.verified = true;
      setDoc(doc(db, "users", user.uid), { role: "owner", verified: true }, { merge: true }).catch(() => {});
    }
    const langSelect = document.getElementById("langSelect");
    const privacySelect = document.getElementById("privacySelect");
    if (langSelect) langSelect.value = lang;
    if (privacySelect) privacySelect.value = currentProfile.profilePrivacy || "public";
    updateUIProfile(currentProfile);
    updateAdminNav();
    viewingUserId = user.uid;
    loadPosts();
    showVerifyBanner(user);
    // deep link: #shop or pending page after login
    try {
      const pending = sessionStorage.getItem("vPendingPage");
      if (pending === "shop" || (location.hash || "").toLowerCase().includes("shop")) {
        sessionStorage.removeItem("vPendingPage");
        setTimeout(() => switchPage("shop"), 50);
      } else {
        applyDeepLink();
      }
    } catch (_) {
      try { applyDeepLink(); } catch (__){}
    }
  } else {
    currentUser = null;
    currentProfile = null;
    lang = "en";
    applyI18n();
    authModal.classList.remove("hidden");
    appEl.classList.add("hidden");
  }
  } catch (err) {
    console.error("auth init", err);
    try { if (splash) { splash.classList.add("hidden"); splash.style.display = "none"; } } catch(_){}
    authModal?.classList.remove("hidden");
  }
});

function showVerifyBanner(user) {
  let ban = document.getElementById("verifyBanner");
  if (!user.emailVerified) {
    if (!ban) {
      ban = document.createElement("div");
      ban.id = "verifyBanner";
      ban.style.cssText = "background:#1d9bf0;color:#fff;padding:10px 14px;text-align:center;font-size:14px;position:sticky;top:0;z-index:150;";
      ban.innerHTML = t("verify_email") + ' <button id="resendVerify" style="margin-left:8px;background:#fff;color:#1d9bf0;border:none;border-radius:9999px;padding:4px 12px;font-weight:700;cursor:pointer;">Resend</button>';
      const header = document.querySelector(".top-header");
      if (header && header.parentNode) header.parentNode.insertBefore(ban, header.nextSibling);
      document.getElementById("resendVerify")?.addEventListener("click", async () => {
        try {
          await sendEmailVerification(auth.currentUser);
          alert("Email sent.");
        } catch (e) { alert(e.message); }
      });
    }
  } else if (ban) ban.remove();
}

function setAvatarEl(el, profile) {
  if (!el) return;
  if (profile.avatarUrl) {
    el.style.backgroundImage = `url(${profile.avatarUrl})`;
    el.classList.add("has-img");
    el.textContent = "";
  } else {
    el.style.backgroundImage = "";
    el.classList.remove("has-img");
    el.textContent = (profile.name || "U").charAt(0).toUpperCase();
  }
}

function updateUIProfile(profile) {
  const name = profile.name || "User";
  const handle = profile.handle || "user";
  ["composeAvatar", "headerAvatar", "menuAvatar"].forEach(id => setAvatarEl(document.getElementById(id), profile));
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set("menuName", name);
  set("menuHandle", "@" + handle);
  set("menuFollowing", (profile.following || []).length);
  set("menuFollowers", (profile.followers || []).length);
}

document.getElementById("headerAvatar")?.addEventListener("click", () => {
  sideMenu.classList.remove("hidden");
  sideMenuOverlay.classList.remove("hidden");
  requestAnimationFrame(() => sideMenu.classList.add("open"));
});
function closeSideMenu() {
  sideMenu.classList.remove("open");
  setTimeout(() => { sideMenu.classList.add("hidden"); sideMenuOverlay.classList.add("hidden"); }, 250);
}
sideMenuOverlay?.addEventListener("click", closeSideMenu);
document.querySelectorAll(".side-menu-item").forEach(item => {
  item.addEventListener("click", () => {
    const page = item.dataset.page;
    if (page === "profile") openUserProfile(currentUser.uid);
    else if (page) switchPage(page);
    closeSideMenu();
  });
});
document.getElementById("menuSupport")?.addEventListener("click", () => {
  document.getElementById("sideMenu")?.classList.add("hidden");
  document.getElementById("sideMenuOverlay")?.classList.add("hidden");
  switchPage("more");
  setTimeout(() => {
    document.getElementById("supportSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("supportTitle")?.focus();
  }, 200);
});
document.getElementById("menuLogout")?.addEventListener("click", () => { signOut(auth); closeSideMenu(); });

function switchPage(page, opts = {}) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = document.getElementById("page-" + page);
  if (target) target.classList.remove("hidden");
  else if (page === "communities") { document.getElementById("page-shop")?.classList.remove("hidden"); if (typeof loadShop === "function") loadShop(); }
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (btn) btn.classList.add("active");
  if (page === "messages") loadDmList();
  if (page === "profile" && viewingUserId) renderProfilePage(viewingUserId);
  if (page === "more") {
    document.getElementById("langSelect").value = lang;
    document.getElementById("privacySelect").value = currentProfile?.profilePrivacy || "public";
  }
  if (page === "admin") {
    setupAdminPanel();
  }
  if (page === "shop") {
    loadShop();
  }
  // deep link hash (shop share link)
  if (!opts.skipHash) {
    try {
      if (page === "shop") {
        if (location.hash !== "#shop") history.replaceState(null, "", "#shop");
      } else if (location.hash === "#shop") {
        history.replaceState(null, "", location.pathname + location.search);
      }
    } catch (_) {}
  }
}

/** Open shop from URL hash #shop (after login). */
function applyDeepLink() {
  const h = (location.hash || "").toLowerCase().replace(/^#/, "");
  if (h === "shop" || h === "v-shop" || h.startsWith("shop/")) {
    if (currentUser) {
      switchPage("shop", { skipHash: true });
      try { if (location.hash !== "#shop") history.replaceState(null, "", "#shop"); } catch (_) {}
      return true;
    }
    // not logged in: keep hash, open shop after auth
    sessionStorage.setItem("vPendingPage", "shop");
  }
  return false;
}

window.addEventListener("hashchange", () => {
  if (!currentUser) return;
  applyDeepLink();
});


document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.page === "profile") openUserProfile(currentUser.uid);
    else switchPage(btn.dataset.page);
  });
});

document.querySelectorAll(".tabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    tab.parentElement.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

// Settings save
document.getElementById("saveSettings")?.addEventListener("click", async () => {
  if (!currentUser) return;
  const newLang = document.getElementById("langSelect").value;
  const privacy = document.getElementById("privacySelect").value;
  await setDoc(doc(db, "users", currentUser.uid), { lang: newLang, profilePrivacy: privacy }, { merge: true });
  lang = newLang;
  currentProfile.lang = newLang;
  currentProfile.profilePrivacy = privacy;
  applyI18n();
  alert(t("settings_saved"));
});

// Media
const mediaInput = document.getElementById("mediaInput");
const mediaPreview = document.getElementById("mediaPreview");
mediaInput?.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  for (const file of files.slice(0, 5)) {
    if (selectedMedia.length >= 5) { alert("Max 5 images/videos per post"); break; }
    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB"); continue; }
    const dataUrl = await readFileAsDataURL(file);
    selectedMedia.push({ type: file.type.startsWith("video") ? "video" : "image", dataUrl, name: file.name });
  }
  renderMediaPreview();
  mediaInput.value = "";
});

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderMediaPreview() {
  if (!mediaPreview) return;
  if (!selectedMedia.length) { mediaPreview.classList.add("hidden"); mediaPreview.innerHTML = ""; return; }
  mediaPreview.classList.remove("hidden");
  mediaPreview.innerHTML = selectedMedia.map((m, i) => `
    <div class="media-item">
      ${m.type === "video" ? `<video src="${m.dataUrl}" muted></video>` : `<img src="${m.dataUrl}" alt="" />`}
      <button class="remove-media" data-i="${i}">✕</button>
    </div>`).join("");
  mediaPreview.querySelectorAll(".remove-media").forEach(btn => {
    btn.addEventListener("click", () => { selectedMedia.splice(+btn.dataset.i, 1); renderMediaPreview(); });
  });
}

document.getElementById("postButton")?.addEventListener("click", createPost);
document.getElementById("fabPost")?.addEventListener("click", () => {
  switchPage("home");
  document.getElementById("postText")?.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function extractHashtags(text) {
  // only #word (letters, numbers, underscore) – not lone #
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  // unique, lowercase for search, max 5
  const seen = new Set();
  const tags = [];
  for (const m of matches) {
    const tag = m.slice(1).toLowerCase();
    if (!seen.has(tag) && tags.length < 5) {
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}

function formatPostText(text) {
  // escape HTML then linkify valid hashtags in blue
  const escaped = escapeHtml(text || "");
  return escaped.replace(/#([\p{L}\p{N}_]+)/gu, (match, word) => {
    return `<span class="hashtag" data-tag="${word.toLowerCase()}">#${word}</span>`;
  });
}

async function createPost() {
  let text = document.getElementById("postText")?.value.trim() || "";
  if ((!text && !selectedMedia.length) || !currentUser) return;
  if (!requireVerified()) return;
  if (!(await requireNotBanned())) return;
  if (text.length > 1000) {
    alert("Max 1000 characters");
    return;
  }
  const hashtags = extractHashtags(text);
  // if more than 5 unique tags were typed, warn (we only keep 5)
  const allMatches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  const uniqueAll = new Set(allMatches.map(m => m.slice(1).toLowerCase()));
  if (uniqueAll.size > 5) {
    alert("Max 5 hashtags per post");
    return;
  }
  if (selectedMedia.length > 5) {
    alert("Max 5 images/videos per post");
    return;
  }
  const profile = currentProfile || {};
  const media = selectedMedia.map(m => ({ type: m.type, url: m.dataUrl }));
  const scope = document.getElementById("postScope")?.value || "public";
  await addDoc(collection(db, "posts"), {
    text, media, hashtags,
    userId: currentUser.uid,
    name: profile.name || currentUser.displayName,
    handle: profile.handle || "user",
    avatarUrl: profile.avatarUrl || "",
    verified: !!(profile.verified || isOwnerProfile(profile)),
    scope,
    likes: [], repostedBy: [], repliesCount: 0, replyList: [], views: 0,
    createdAt: serverTimestamp()
  });
  document.getElementById("postText").value = "";
  selectedMedia = [];
  renderMediaPreview();
  updateCharCount();
}

const MAX_POSTS = 200;
let lastPostIdsKey = "";

function postIdsKey(posts) {
  return posts.map(p => p.id).join(",");
}

/** Update like/repost/view counts in-place without rebuilding the feed (no lag). */
function patchPostActionButtons(root = document) {
  root.querySelectorAll(".post[data-id]").forEach(el => {
    const id = el.dataset.id;
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    const liked = !!(currentUser && (post.likes || []).includes(currentUser.uid));
    const reposted = !!(currentUser && (post.repostedBy || []).includes(currentUser.uid));
    const likeCount = (post.likes || []).length;
    const repostCount = (post.repostedBy || []).length;
    const replyCount = post.repliesCount || post.replies || 0;
    const views = formatNumber(post.views || 0);

    const likeBtn = el.querySelector('[data-action="like"]');
    if (likeBtn) {
      likeBtn.classList.toggle("liked", liked);
      likeBtn.innerHTML = `${liked ? ICO.likeOn : ICO.like}<span class="count">${likeCount}</span>`;
    }
    const repostBtn = el.querySelector('[data-action="repost"]');
    if (repostBtn) {
      repostBtn.classList.toggle("reposted", reposted);
      const c = repostBtn.querySelector(".count");
      if (c) c.textContent = String(repostCount);
      else repostBtn.innerHTML = `${ICO.repost}<span class="count">${repostCount}</span>`;
    }
    const replyBtn = el.querySelector('[data-action="reply"]');
    if (replyBtn) {
      const c = replyBtn.querySelector(".count");
      if (c) c.textContent = String(replyCount);
    }
    const viewsBtn = el.querySelector('[data-action="views"]');
    if (viewsBtn) {
      const c = viewsBtn.querySelector(".count");
      if (c) c.textContent = views;
    }
  });
}

function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const next = [];
    snapshot.forEach(d => next.push({ id: d.id, ...d.data() }));
    if (next.length > MAX_POSTS) next.length = MAX_POSTS;
    const key = postIdsKey(next);
    allPosts = next;
    const publicPosts = allPosts.filter(p => (p.scope || "public") === "public");
    const timeline = document.getElementById("timeline");
    // Same posts already on screen → only patch buttons (likes etc.) — no full re-render lag
    if (key === lastPostIdsKey && timeline && timeline.querySelector(".post")) {
      patchPostActionButtons(timeline);
      if (viewingUserId) {
        const pt = document.getElementById("profileTimeline");
        if (pt) patchPostActionButtons(pt);
      }
      return;
    }
    lastPostIdsKey = key;
    renderPosts(publicPosts, "timeline");
    if (viewingUserId) refreshProfileTimeline();
  });
}

function refreshProfileTimeline() {
  if (!viewingUserId) return;
  // show both public and profile-scope posts of that user
  const posts = allPosts.filter(p => p.userId === viewingUserId);
  renderPosts(posts, "profileTimeline");
}

async function countView(postId) {
  if (!postId || viewedPosts.has(postId)) return;
  viewedPosts.add(postId);
  try { await updateDoc(doc(db, "posts", postId), { views: increment(1) }); } catch (e) {}
}

async function loadReplies(postId) {
  if (repliesCache[postId]) return repliesCache[postId];
  const post = allPosts.find(p => p.id === postId);
  if (post && Array.isArray(post.replyList) && post.replyList.length) {
    repliesCache[postId] = post.replyList;
    return post.replyList;
  }
  repliesCache[postId] = [];
  return [];
}


// X-style line icons (gray by default via CSS)
const ICO = {
  reply: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>`,
  repost: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>`,
  like: `<svg class="ico ico-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.253 0 5.74 6.215 11.53 8.55 11.605 2.336-.076 8.55-5.867 8.55-11.605 0-2.265-1.823-4.253-3.904-4.253-2.223 0-3.644 1.662-4.31 2.88l-.336.548-.336-.548c-.664-1.22-2.087-2.88-4.311-2.88z"/></svg>`,
  likeOn: `<svg class="ico ico-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z"/></svg>`,
  views: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10H6v10H4zm9.248 0v-7h2v7h-2z"/></svg>`,
  share: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg>`,
  trash: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.12 2 8 3.12 8 4.5V6H3v2h1.5v11.5c0 1.38 1.12 2.5 2.5 2.5h10c1.38 0 2.5-1.12 2.5-2.5V8H21V6h-5zM10 4.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5V6h-4V4.5zM17.5 19.5c0 .28-.22.5-.5.5H7c-.28 0-.5-.22-.5-.5V8h11v11.5z"/></svg>`,
  crown: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>`,
  bag: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C9.24 2 7 4.24 7 7H4v13c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7h-3c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm6 15H6V9h12v10z"/></svg>`,
  shield: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83V6.31l6-2.25 6 2.25v4.78z"/></svg>`,
};

function avatarHtml(name, avatarUrl, extraClass = "") {
  if (avatarUrl) {
    return `<div class="avatar ${extraClass} has-img" style="background-image:url(${avatarUrl})"></div>`;
  }
  return `<div class="avatar ${extraClass}">${(name || "U").charAt(0)}</div>`;
}

function renderPosts(posts, containerId) {
  const timeline = document.getElementById(containerId);
  if (!timeline) return;
  timeline.innerHTML = "";
  if (!posts.length && containerId === "timeline") {
    timeline.innerHTML = `<div class="empty-state"><h3>${t("welcome")}</h3><p>${t("write_above")}</p></div>`;
    return;
  }
  posts.forEach(post => {
    countView(post.id);
    const liked = post.likes && currentUser && post.likes.includes(currentUser.uid);
    const reposted = post.repostedBy && currentUser && post.repostedBy.includes(currentUser.uid);
    const time = post.createdAt?.toDate ? timeAgo(post.createdAt.toDate()) : "now";
    const likeCount = post.likes ? post.likes.length : 0;
    const repostCount = post.repostedBy ? post.repostedBy.length : (post.reposts || 0);
    const replyCount = post.repliesCount || post.replies || 0;
    const isPostOwner = currentUser && post.userId === currentUser.uid;
    const canManagePost = isPostOwner || isStaff();
    const mediaList = post.media || [];
    let mediaHtml = "";
    if (mediaList.length) {
      const count = Math.min(mediaList.length, 5);
      const items = mediaList.slice(0, 5).map((m, idx) =>
        m.type === "video"
          ? `<div class="media-cell media-open" data-type="video" data-url="${m.url.replace(/"/g, "&quot;")}"><video src="${m.url}" muted playsinline preload="metadata"></video></div>`
          : `<div class="media-cell media-open" data-type="image" data-url="${m.url.replace(/"/g, "&quot;")}"><img src="${m.url}" alt="" loading="lazy" /></div>`
      ).join("");
      mediaHtml = `<div class="media-grid count-${count}">${items}</div>`;
    }
    const scopeBadge = post.scope === "profile" ? `<span class="scope-badge">📌 Profile</span>` : "";
    const ownerMenu = canManagePost ? `
      <div class="post-menu">
        <button class="post-menu-btn" data-menu="${post.id}">⋯</button>
        <div class="post-menu-dropdown hidden" id="menu-${post.id}">
          <button data-action="edit" data-id="${post.id}">✏️ ${t("edit")}</button>
          <button data-action="delete" data-id="${post.id}" class="danger">${ICO.trash} ${t("delete_post")}</button>
        </div>
      </div>` : "";

    const el = document.createElement("div");
    el.className = "post";
    el.dataset.id = post.id;
    el.innerHTML = `
      <div class="user-link" data-uid="${post.userId || ""}">${avatarHtml(post.name, post.avatarUrl)}</div>
      <div class="post-content">
        <div class="post-header">
          <strong class="user-link" data-uid="${post.userId || ""}">${escapeHtml(post.name || "User")}</strong>${post.verified || (post.handle || "").toLowerCase() === "vida" ? verifiedBadgeHtml({verified:true}) : (post.verifiedBadge || "")}
          <span class="user-link" data-uid="${post.userId || ""}">@${escapeHtml(post.handle || "user")}</span>
          <span>·</span><span>${time}</span>
          ${scopeBadge}
          ${ownerMenu}
        </div>
        <div class="post-text">${formatPostText(post.text || "")}</div>
        ${mediaHtml}
        <div class="post-actions">
          <button class="action-btn" data-action="reply" data-id="${post.id}">${ICO.reply}<span class="count">${replyCount}</span></button>
          <button class="action-btn ${reposted ? "reposted" : ""}" data-action="repost" data-id="${post.id}">${ICO.repost}<span class="count">${repostCount}</span></button>
          <button class="action-btn ${liked ? "liked" : ""}" data-action="like" data-id="${post.id}">${liked ? ICO.likeOn : ICO.like}<span class="count">${likeCount}</span></button>
          <button class="action-btn" data-action="views">${ICO.views}<span class="count">${formatNumber(post.views || 0)}</span></button>
          <button class="action-btn" data-action="share">${ICO.share}</button>
        </div>
        <div class="replies-section ${openReplyId === post.id ? "" : "hidden"}" data-replies-for="${post.id}">
          <div class="replies-list" id="replies-${post.id}"></div>
          <div class="reply-compose">
            <input type="text" class="reply-input" placeholder="${t("write_message")}" data-reply-to="${post.id}" />
            <button class="reply-send post-btn-small" data-reply-to="${post.id}">${t("send")}</button>
          </div>
        </div>
      </div>`;
    timeline.appendChild(el);
    if (openReplyId === post.id) loadAndShowReplies(post.id);
  });

  // user profile links
  timeline.querySelectorAll(".user-link").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const uid = el.dataset.uid;
      if (uid && uid !== "demo") openUserProfile(uid);
    });
  });

  // owner menu
  timeline.querySelectorAll(".post-menu-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.menu;
      document.querySelectorAll(".post-menu-dropdown").forEach(d => {
        if (d.id !== "menu-" + id) d.classList.add("hidden");
      });
      document.getElementById("menu-" + id)?.classList.toggle("hidden");
    });
  });

  timeline.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(t("confirm_delete"))) return;
      await deleteDoc(doc(db, "posts", btn.dataset.id));
    });
  });

  timeline.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const post = allPosts.find(p => p.id === id);
      if (!post) return;
      editingPostId = id;
      document.getElementById("editPostText").value = post.text || "";
      document.getElementById("editPostModal").classList.remove("hidden");
      document.getElementById("menu-" + id)?.classList.add("hidden");
    });
  });

  timeline.querySelectorAll('[data-action="like"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!currentUser || !requireVerified()) return;
      const id = btn.dataset.id;
      const post = allPosts.find(p => p.id === id);
      if (!post) return;
      if (!Array.isArray(post.likes)) post.likes = [];
      const i = post.likes.indexOf(currentUser.uid);
      if (i >= 0) post.likes.splice(i, 1);
      else post.likes.push(currentUser.uid);
      // instant UI — no full feed re-render
      const liked = post.likes.includes(currentUser.uid);
      btn.classList.toggle("liked", liked);
      btn.innerHTML = `${liked ? ICO.likeOn : ICO.like}<span class="count">${post.likes.length}</span>`;
      try {
        if (liked) await updateDoc(doc(db, "posts", id), { likes: arrayUnion(currentUser.uid) });
        else await updateDoc(doc(db, "posts", id), { likes: arrayRemove(currentUser.uid) });
      } catch (err) {
        // rollback
        if (liked) post.likes = post.likes.filter(u => u !== currentUser.uid);
        else post.likes.push(currentUser.uid);
        const L = post.likes.includes(currentUser.uid);
        btn.classList.toggle("liked", L);
        btn.innerHTML = `${L ? ICO.likeOn : ICO.like}<span class="count">${post.likes.length}</span>`;
        alert(err.message || String(err));
      }
    });
  });

  timeline.querySelectorAll('[data-action="repost"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!currentUser || !requireVerified()) return;
      const id = btn.dataset.id;
      const post = allPosts.find(p => p.id === id);
      if (!post) return;
      if (!Array.isArray(post.repostedBy)) post.repostedBy = [];
      const i = post.repostedBy.indexOf(currentUser.uid);
      if (i >= 0) post.repostedBy.splice(i, 1);
      else post.repostedBy.push(currentUser.uid);
      const reposted = post.repostedBy.includes(currentUser.uid);
      btn.classList.toggle("reposted", reposted);
      btn.innerHTML = `${ICO.repost}<span class="count">${post.repostedBy.length}</span>`;
      try {
        if (reposted) await updateDoc(doc(db, "posts", id), { repostedBy: arrayUnion(currentUser.uid) });
        else await updateDoc(doc(db, "posts", id), { repostedBy: arrayRemove(currentUser.uid) });
      } catch (err) {
        if (reposted) post.repostedBy = post.repostedBy.filter(u => u !== currentUser.uid);
        else post.repostedBy.push(currentUser.uid);
        const R = post.repostedBy.includes(currentUser.uid);
        btn.classList.toggle("reposted", R);
        btn.innerHTML = `${ICO.repost}<span class="count">${post.repostedBy.length}</span>`;
        alert(err.message || String(err));
      }
    });
  });

    timeline.querySelectorAll('[data-action="reply"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const closing = openReplyId === id;
      openReplyId = closing ? null : id;
      // toggle only this post's reply UI if present, else full re-render
      const sec = timeline.querySelector(`[data-replies-for="${id}"]`);
      if (sec && !closing) {
        document.querySelectorAll(".replies-section").forEach(s => s.classList.add("hidden"));
        sec.classList.remove("hidden");
        loadAndShowReplies(id);
        const inp = sec.querySelector(".reply-input");
        if (inp) setTimeout(() => inp.focus(), 50);
      } else if (sec && closing) {
        sec.classList.add("hidden");
        const list = document.getElementById("replies-" + id);
        if (list) list.innerHTML = "";
      } else {
        renderPosts(allPosts.filter(p => (p.scope || "public") === "public"), "timeline");
        if (viewingUserId) refreshProfileTimeline();
      }
    });
  });

  timeline.querySelectorAll(".reply-send").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const postId = btn.dataset.replyTo;
      const input = timeline.querySelector(`.reply-input[data-reply-to="${postId}"]`);
      const text = input?.value.trim();
      if (!text || !currentUser || !requireVerified()) return;
      const profile = currentProfile || {};
      const replyObj = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        text, userId: currentUser.uid,
        name: profile.name, handle: profile.handle,
        avatarUrl: profile.avatarUrl || "",
        createdAt: new Date().toISOString()
      };
      const post = allPosts.find(p => p.id === postId);
      const replyList = [...((post && post.replyList) || []), replyObj];
      await updateDoc(doc(db, "posts", postId), { replyList, repliesCount: replyList.length });
      delete repliesCache[postId];
      input.value = "";
      repliesCache[postId] = replyList;
      await loadAndShowReplies(postId);
    });
  });
}

// Edit post modal
document.getElementById("saveEditPost")?.addEventListener("click", async () => {
  if (!editingPostId || !currentUser) return;
  const text = document.getElementById("editPostText").value.trim();
  await updateDoc(doc(db, "posts", editingPostId), { text });
  document.getElementById("editPostModal").classList.add("hidden");
  editingPostId = null;
});
document.getElementById("cancelEditPost")?.addEventListener("click", () => {
  document.getElementById("editPostModal").classList.add("hidden");
  editingPostId = null;
});

async function loadAndShowReplies(postId) {
  const container = document.getElementById("replies-" + postId);
  if (!container) return;
  container.innerHTML = `<div class="reply-loading">${t("loading_replies")}</div>`;
  const replies = await loadReplies(postId);
  if (!replies.length) {
    container.innerHTML = `<div class="no-replies">${t("no_replies")}</div>`;
    return;
  }
  container.innerHTML = replies.map(r => {
    let tm = "";
    if (r.createdAt?.toDate) tm = timeAgo(r.createdAt.toDate());
    else if (typeof r.createdAt === "string") tm = timeAgo(new Date(r.createdAt));
    return `<div class="reply-item">
      ${avatarHtml(r.name, r.avatarUrl, "tiny")}
      <div class="reply-body">
        <div class="post-header"><strong>${escapeHtml(r.name || "User")}</strong> <span>@${escapeHtml(r.handle || "user")}</span> <span>·</span> <span>${tm}</span></div>
        <div class="post-text">${escapeHtml(r.text || "")}</div>
      </div></div>`;
  }).join("");
}

// ===== PROFILE =====
async function canViewProfile(uid, profile) {
  if (!currentUser) return false;
  if (uid === currentUser.uid) return true;
  const privacy = profile.profilePrivacy || "public";
  if (privacy === "public") return true;
  // private: mutual follow
  const iFollow = (currentProfile?.following || []).includes(uid);
  const theyFollow = (profile.following || []).includes(currentUser.uid);
  return iFollow && theyFollow;
}

async function openUserProfile(uid) {
  viewingUserId = uid;
  switchPage("profile");
  await renderProfilePage(uid);
}

async function renderProfilePage(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  const profile = snap.exists() ? snap.data() : { name: "User", handle: "user", bio: "", following: [], followers: [], profilePrivacy: "public" };
  const isMe = currentUser && uid === currentUser.uid;
  const canView = await canViewProfile(uid, profile);

  const nameEl = document.getElementById("profileDisplayName");
  if (nameEl) {
    nameEl.innerHTML = escapeHtml(profile.name || "User") + verifiedBadgeHtml(profile);
  }
  document.getElementById("profileDisplayHandle").textContent = "@" + (profile.handle || "user");
  document.getElementById("followingCount").textContent = (profile.following || []).length;
  document.getElementById("followersCount").textContent = (profile.followers || []).length;

  setAvatarEl(document.getElementById("profileAvatar"), profile);
  const banner = document.getElementById("profileBanner");
  if (banner) {
    banner.style.backgroundImage = profile.bannerUrl ? `url(${profile.bannerUrl})` : "";
    if (!profile.bannerUrl) banner.style.background = "linear-gradient(135deg, #1d9bf0, #7856ff)";
  }

  const badge = document.getElementById("privacyBadge");
  if (badge) {
    if (isMe || canView) {
      badge.classList.remove("hidden");
      badge.textContent = (profile.profilePrivacy === "private") ? t("private_badge") : t("public_badge");
    } else {
      badge.classList.add("hidden");
    }
  }

  const editBtn = document.getElementById("editProfileBtn");
  const followBtn = document.getElementById("followBtn");
  const messageBtn = document.getElementById("messageBtn");
  const editForm = document.getElementById("profileEditForm");
  const locked = document.getElementById("profileLocked");
  const timeline = document.getElementById("profileTimeline");

  if (isMe) {
    editBtn.classList.remove("hidden");
    followBtn.classList.add("hidden");
    messageBtn.classList.add("hidden");
    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileHandle").value = profile.handle || "";
    document.getElementById("profileBio").value = profile.bio || "";
    document.getElementById("profileDisplayBio").textContent = profile.bio || "";
    locked.classList.add("hidden");
    timeline.classList.remove("hidden");
    refreshProfileTimeline();
  } else {
    editBtn.classList.add("hidden");
    editForm.classList.add("hidden");
    followBtn.classList.remove("hidden");
    const iFollow = (currentProfile?.following || []).includes(uid);
    followBtn.textContent = iFollow ? t("following_btn") : t("follow");
    followBtn.classList.toggle("following", iFollow);
    followBtn.onclick = () => toggleFollow(uid);

    const theyFollowMe = (profile.following || []).includes(currentUser.uid);
    if (iFollow && theyFollowMe) {
      messageBtn.classList.remove("hidden");
      messageBtn.onclick = () => openChat(uid, profile);
    } else {
      messageBtn.classList.add("hidden");
    }

    if (canView) {
      document.getElementById("profileDisplayBio").textContent = profile.bio || "";
      locked.classList.add("hidden");
      timeline.classList.remove("hidden");
      refreshProfileTimeline();
    } else {
      document.getElementById("profileDisplayBio").textContent = "";
      locked.classList.remove("hidden");
      timeline.classList.add("hidden");
      timeline.innerHTML = "";
    }
  }
}

async function toggleFollow(targetUid) {
  if (!currentUser || !requireVerified()) return;
  const meRef = doc(db, "users", currentUser.uid);
  const themRef = doc(db, "users", targetUid);
  const iFollow = (currentProfile.following || []).includes(targetUid);
  if (iFollow) {
    await updateDoc(meRef, { following: arrayRemove(targetUid) });
    await updateDoc(themRef, { followers: arrayRemove(currentUser.uid) });
    currentProfile.following = (currentProfile.following || []).filter(id => id !== targetUid);
  } else {
    await updateDoc(meRef, { following: arrayUnion(targetUid) });
    await updateDoc(themRef, { followers: arrayUnion(currentUser.uid) });
    currentProfile.following = [...(currentProfile.following || []), targetUid];
  }
  updateUIProfile(currentProfile);
  await renderProfilePage(targetUid);
}

function refreshAvatarPreview(url) {
  const av = document.getElementById("avatarPreview");
  if (!av) return;
  if (url) {
    av.innerHTML = `<img src="${url}" alt="" />`;
    av.classList.add("has-img");
  } else {
    const letter = (currentProfile?.name || currentUser?.displayName || "U").charAt(0).toUpperCase();
    av.innerHTML = `<span class="avatar-letter">${letter}</span>`;
    av.classList.remove("has-img");
  }
}

document.getElementById("editProfileBtn")?.addEventListener("click", () => {
  const form = document.getElementById("profileEditForm");
  if (!form) return;
  form.classList.toggle("hidden");
  pendingAvatar = null;
  pendingBanner = null;
  refreshAvatarPreview(currentProfile?.avatarUrl || "");
  const bn = document.getElementById("bannerPreview");
  if (bn) bn.innerHTML = currentProfile?.bannerUrl
    ? `<img src="${currentProfile.bannerUrl}" alt="" />` : "";
  const nameEl = document.getElementById("profileName");
  const bioEl = document.getElementById("profileBio");
  const handleEl = document.getElementById("profileHandle");
  if (nameEl) nameEl.value = currentProfile?.name || "";
  if (bioEl) bioEl.value = currentProfile?.bio || "";
  if (handleEl) handleEl.value = currentProfile?.handle || "";
});

document.getElementById("avatarPickBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("avatarInput")?.click();
});

document.getElementById("avatarInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { alert("Please choose an image"); return; }
  if (file.size > 3 * 1024 * 1024) { alert("Max 3MB for profile picture"); return; }
  try {
    pendingAvatar = await readFileAsDataURL(file);
    refreshAvatarPreview(pendingAvatar);
  } catch (err) {
    alert(err.message || String(err));
  }
});

document.getElementById("bannerInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) { alert("Max 1.5MB"); return; }
  pendingBanner = await readFileAsDataURL(file);
  document.getElementById("bannerPreview").innerHTML = `<img src="${pendingBanner}" alt="" />`;
});

document.getElementById("saveProfile")?.addEventListener("click", async () => {
  if (!currentUser) return;
  const name = document.getElementById("profileName").value.trim();
  const bio = document.getElementById("profileBio").value.trim();
  // handle is locked after signup
  const data = { name, bio };
  if (pendingAvatar) data.avatarUrl = pendingAvatar;
  if (pendingBanner) data.bannerUrl = pendingBanner;
  await setDoc(doc(db, "users", currentUser.uid), data, { merge: true });
  await updateProfile(currentUser, { displayName: name });
  const snap = await getDoc(doc(db, "users", currentUser.uid));
  currentProfile = snap.data();
  updateUIProfile(currentProfile);
  document.getElementById("profileEditForm").classList.add("hidden");
  await renderProfilePage(currentUser.uid);
  alert(t("profile_saved"));
});

// ===== DMs =====
function chatKey(a, b) {
  return [a, b].sort().join("_");
}

let dmMutuals = [];

let dmOrderChats = []; // shop order chats pinned on top

async function loadDmList() {
  const listEl = document.getElementById("dmList");
  const chatEl = document.getElementById("dmChat");
  const listView = document.getElementById("dmListView");
  if (listView) listView.classList.remove("hidden");
  if (listEl) listEl.classList.remove("hidden");
  if (chatEl) chatEl.classList.add("hidden");
  if (dmUnsub) { dmUnsub(); dmUnsub = null; }

  const hidden = new Set(currentProfile?.hiddenDmUids || []);

  // 1) Order chats — pinned on top
  dmOrderChats = [];
  try {
    const snap = await getDocs(collection(db, "chats"));
    for (const d of snap.docs) {
      const c = d.data();
      if (c.type !== "order" && c.type !== "support") continue;
      if (!(c.participants || []).includes(currentUser.uid)) continue;
      if (c.closed) continue;
      if (Array.isArray(c.hiddenFor) && c.hiddenFor.includes(currentUser.uid)) continue;
      const otherUid = (c.participants || []).find(u => u !== currentUser.uid);
      if (!otherUid) continue;
      if (hidden.has(otherUid)) continue;
      let profile = { uid: otherUid, name: "User", handle: "user" };
      try {
        const us = await getDoc(doc(db, "users", otherUid));
        if (us.exists()) profile = { uid: otherUid, ...us.data() };
      } catch (_) {}
      const isSupport = c.type === "support";
      dmOrderChats.push({
        uid: otherUid,
        ...profile,
        isOrderChat: !isSupport,
        isSupportChat: isSupport,
        chatDocId: d.id,
        title: isSupport ? (c.supportTitle || c.title || "Report/bug") : "Order",
        supportTitle: c.supportTitle || c.title || "",
        updatedAt: c.updatedAt?.toMillis?.() || 0,
        lastText: c.lastText || ""
      });
    }
    dmOrderChats.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (e) {
    console.warn("order chats", e);
  }

  // Support tickets for staff (all open) + users (own)
  try {
    const ts = await getDocs(collection(db, "supportTickets"));
    const have = new Set(dmOrderChats.filter(c => c.isSupportChat).map(c => c.ticketId || c.chatDocId || c.uid));
    for (const d of ts.docs) {
      const t = d.data() || {};
      if (t.status === "closed") continue;
      const reportUid = t.userId;
      if (!reportUid) continue;
      if (!isStaff() && reportUid !== currentUser.uid) continue;
      if (have.has(d.id)) continue;
      have.add(d.id);
      // Partner for staff = reporter; for reporter = staff/owner
      let uid = isStaff() ? reportUid : (t.staffUid || reportUid);
      if (!uid) continue;
      if (hidden.has(uid) && uid !== currentUser.uid) continue;
      let profile = { uid, name: t.name || "User", handle: t.handle || "user" };
      try {
        const us = await getDoc(doc(db, "users", uid));
        if (us.exists()) profile = { uid, ...us.data() };
      } catch (_) {}
      dmOrderChats.push({
        uid,
        ...profile,
        isOrderChat: false,
        isSupportChat: true,
        supportTitle: t.title || "Report/bug",
        ticketId: d.id,
        chatKey: t.chatKey || ("support_" + d.id),
        title: t.title || "Report/bug",
        updatedAt: t.createdAt?.toMillis?.() || Date.now(),
        lastText: t.message ? String(t.message).slice(0, 40) : ("Report/bug: " + (t.title || ""))
      });
    }
    dmOrderChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (e) {
    console.warn("support tickets dm", e);
  }

  // 2) Mutual follow chats
  const following = currentProfile?.following || [];
  dmMutuals = [];
  const orderUids = new Set(dmOrderChats.map(c => c.uid));
  for (const uid of following) {
    if (orderUids.has(uid)) continue;
    if (hidden.has(uid)) continue;
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) continue;
    const p = snap.data();
    if ((p.following || []).includes(currentUser.uid)) {
      dmMutuals.push({ uid, ...p, isOrderChat: false });
    }
  }
  renderDmContactList(document.getElementById("dmSearch")?.value || "");
}

/** Hide a DM chat only for the current user (does not delete messages for the other person). */
async function hideDmChatForMe(otherUid, isOrderChat) {
  if (!currentUser || !otherUid) return;
  if (!confirm("Delete this chat for you? The other person will still see it.")) return;
  try {
    const list = Array.isArray(currentProfile?.hiddenDmUids) ? [...currentProfile.hiddenDmUids] : [];
    if (!list.includes(otherUid)) list.push(otherUid);
    await setDoc(doc(db, "users", currentUser.uid), { hiddenDmUids: list }, { merge: true });
    if (currentProfile) currentProfile.hiddenDmUids = list;

    // also mark on chats doc if exists (order / shared metadata)
    const key = chatKey(currentUser.uid, otherUid);
    try {
      await setDoc(doc(db, "chats", key), {
        chatKey: key,
        participants: [currentUser.uid, otherUid],
        hiddenFor: list.includes(otherUid) ? undefined : undefined, // placeholder replaced below
        updatedAt: serverTimestamp()
      }, { merge: true });
      // arrayUnion-style merge for hiddenFor
      const existing = await getDoc(doc(db, "chats", key));
      const prev = existing.exists() ? (existing.data().hiddenFor || []) : [];
      const next = prev.includes(currentUser.uid) ? prev : [...prev, currentUser.uid];
      await setDoc(doc(db, "chats", key), {
        chatKey: key,
        participants: [currentUser.uid, otherUid],
        hiddenFor: next,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("chats hiddenFor", e);
    }

    // leave open chat if it was this one
    if (activeChatPartner?.uid === otherUid) {
      if (dmUnsub) { dmUnsub(); dmUnsub = null; }
      activeChatPartner = null;
      document.getElementById("dmChat")?.classList.add("hidden");
      document.getElementById("dmListView")?.classList.remove("hidden");
      document.getElementById("dmList")?.classList.remove("hidden");
    }
    await loadDmList();
  } catch (e) {
    alert(e.message || String(e));
  }
}

function renderDmContactList(filter = "") {
  const listEl = document.getElementById("dmList");
  if (!listEl) return;
  const q = (filter || "").toLowerCase().trim().replace(/^@/, "");

  const match = (u) => {
    if (!q) return true;
    if (u.isOrderChat && ("order".includes(q) || "bestellung".includes(q))) return true;
    return (u.name || "").toLowerCase().includes(q) ||
      (u.handle || "").toLowerCase().includes(q) ||
      (u.title || "").toLowerCase().includes(q);
  };

  const orders = dmOrderChats.filter(match);
  const mutuals = dmMutuals.filter(match);
  const all = [...orders, ...mutuals];

  if (!dmOrderChats.length && !dmMutuals.length) {
    listEl.innerHTML = `<div class="dm-empty"><h3>${t("no_chats")}</h3><p>${t("mutual_needed")}</p></div>`;
    return;
  }
  if (!all.length) {
    listEl.innerHTML = `<div class="dm-empty"><p>No chats match your search.</p></div>`;
    return;
  }

  listEl.innerHTML = all.map(u => {
    if (u.isSupportChat) {
      return `<div class="dm-item dm-order-item dm-support-item" data-uid="${u.uid}" data-support="1">
        <div class="dm-order-icon">${ICO.shield}</div>
        <div class="dm-item-info">
          <strong>Report/bug: ${escapeHtml(u.supportTitle || u.title || "")}</strong>
          <span>@${escapeHtml(u.handle || "user")} · ${escapeHtml((u.lastText || "").slice(0, 40))}</span>
        </div>
        <button type="button" class="dm-hide-btn" data-hide="${u.uid}" data-order="0" title="Delete chat for you">${ICO.trash}</button>
      </div>`;
    }
    if (u.isOrderChat) {
      return `<div class="dm-item dm-order-item" data-uid="${u.uid}" data-order="1">
        <div class="dm-order-icon">${ICO.bag}</div>
        <div class="dm-item-info">
          <strong>Order</strong>
          <span>@${escapeHtml(u.handle || "user")} · ${escapeHtml((u.lastText || "").slice(0, 40))}</span>
        </div>
        <button type="button" class="dm-hide-btn" data-hide="${u.uid}" data-order="1" title="Delete chat for you">${ICO.trash}</button>
      </div>`;
    }
    return `<div class="dm-item" data-uid="${u.uid}">
      ${avatarHtml(u.name, u.avatarUrl)}
      <div class="dm-item-info">
        <strong>${escapeHtml(u.name || "User")}</strong>
        <span>@${escapeHtml(u.handle || "user")}</span>
      </div>
      <button type="button" class="dm-hide-btn" data-hide="${u.uid}" data-order="0" title="Delete chat for you">${ICO.trash}</button>
    </div>`;
  }).join("");

  listEl.querySelectorAll(".dm-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".dm-hide-btn")) return;
      const uid = item.dataset.uid;
      const isOrder = item.dataset.order === "1";
      const isSupport = item.dataset.support === "1";
      let u = (isOrder || isSupport)
        ? dmOrderChats.find(m => m.uid === uid)
        : dmMutuals.find(m => m.uid === uid);
      if (!u) u = { uid, name: "User", handle: "user", isOrderChat: isOrder, isSupportChat: isSupport };
      openChat(uid, u);
    });
  });
  listEl.querySelectorAll(".dm-hide-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideDmChatForMe(btn.dataset.hide, btn.dataset.order === "1");
    });
  });
}

document.getElementById("dmSearch")?.addEventListener("input", (e) => {
  renderDmContactList(e.target.value);
});

document.getElementById("dmAddUser")?.addEventListener("click", () => {
  const panel = document.getElementById("dmUserSearchPanel");
  panel?.classList.toggle("hidden");
  if (panel && !panel.classList.contains("hidden")) {
    document.getElementById("userSearchInput")?.focus();
  }
});

let userSearchTimer = null;
document.getElementById("userSearchInput")?.addEventListener("input", (e) => {
  clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(() => searchUsers(e.target.value), 300);
});

async function searchUsers(term) {
  const resultsEl = document.getElementById("userSearchResults");
  if (!resultsEl) return;
  term = (term || "").toLowerCase().trim().replace(/^@/, "");
  if (term.length < 1) {
    resultsEl.innerHTML = "";
    return;
  }
  resultsEl.innerHTML = `<div class="dm-empty"><p>Searching...</p></div>`;
  try {
    const snap = await getDocs(collection(db, "users"));
    const matches = [];
    snap.forEach(d => {
      if (d.id === currentUser?.uid) return;
      const p = d.data();
      const name = (p.name || "").toLowerCase();
      const handle = (p.handle || "").toLowerCase();
      if (name.includes(term) || handle.includes(term)) {
        matches.push({ uid: d.id, ...p });
      }
    });
    if (!matches.length) {
      resultsEl.innerHTML = `<div class="dm-empty"><p>No users found.</p></div>`;
      return;
    }
    resultsEl.innerHTML = matches.slice(0, 20).map(u => {
      const iFollow = (currentProfile?.following || []).includes(u.uid);
      return `<div class="user-search-item" data-uid="${u.uid}">
        ${avatarHtml(u.name, u.avatarUrl, "small")}
        <div class="dm-item-info">
          <strong>${escapeHtml(u.name || "User")}</strong>
          <span>@${escapeHtml(u.handle || "user")}</span>
        </div>
        <button class="follow-mini ${iFollow ? "following" : ""}" data-uid="${u.uid}">${iFollow ? t("following_btn") : t("follow")}</button>
      </div>`;
    }).join("");
    resultsEl.querySelectorAll(".follow-mini").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        await toggleFollow(uid);
        // refresh button state
        const nowFollow = (currentProfile?.following || []).includes(uid);
        btn.textContent = nowFollow ? t("following_btn") : t("follow");
        btn.classList.toggle("following", nowFollow);
        // reload dm mutuals in case they follow back later
      });
    });
    resultsEl.querySelectorAll(".user-search-item").forEach(item => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".follow-mini")) return;
        openUserProfile(item.dataset.uid);
      });
    });
  } catch (err) {
    resultsEl.innerHTML = `<div class="dm-empty"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function openChat(partnerUid, partnerProfile) {
  activeChatPartner = { uid: partnerUid, ...partnerProfile };
  switchPage("messages");
  document.getElementById("dmListView")?.classList.add("hidden");
  document.getElementById("dmList")?.classList.add("hidden");
  document.getElementById("dmChat").classList.remove("hidden");

  const isOrder = !!(partnerProfile && partnerProfile.isOrderChat);
  const isSupport = !!(partnerProfile && partnerProfile.isSupportChat);
  activeChatPartner.isOrderChat = isOrder;
  activeChatPartner.isSupportChat = isSupport;
  if (partnerProfile?.supportTitle) activeChatPartner.supportTitle = partnerProfile.supportTitle;
  const nameEl = document.getElementById("dmChatName") || document.getElementById("dmPartnerName");
  if (nameEl) {
    if (isSupport) nameEl.textContent = "Report/bug: " + (activeChatPartner.supportTitle || partnerProfile.supportTitle || "Support");
    else if (isOrder) nameEl.textContent = "Order · @" + (partnerProfile.handle || "user");
    else nameEl.textContent = partnerProfile.name || "User";
  }

  const closeBtn = document.getElementById("dmCloseChatBtn");
  if (closeBtn) {
    if ((isOrder && isOwner()) || (isSupport && isStaff())) closeBtn.classList.remove("hidden");
    else closeBtn.classList.add("hidden");
  }

  if (dmUnsub) { dmUnsub(); dmUnsub = null; }
  const key = (partnerProfile && partnerProfile.chatKey) || chatKey(currentUser.uid, partnerUid);
  activeChatPartner.chatKey = key;
  const box = document.getElementById("dmMessages");
  box.innerHTML = "";

  const q2 = query(collection(db, "dms"), where("chatKey", "==", key));
  dmUnsub = onSnapshot(q2, (snap) => {
    const msgs = [];
    snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
    msgs.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return ta - tb;
    });
    // if any shopOrder message, treat as order chat
    if (!activeChatPartner.isOrderChat && msgs.some(m => m.shopOrder)) {
      activeChatPartner.isOrderChat = true;
      if (nameEl) nameEl.textContent = "Order · @" + (partnerProfile.handle || "user");
      if (closeBtn && isOwner()) closeBtn.classList.remove("hidden");
    }
    renderDmMessages(msgs);
  });
}

function renderDmMessages(msgs) {
  const box = document.getElementById("dmMessages");
  box.innerHTML = msgs.map(m => {
    const me = m.from === currentUser.uid;
    const img = m.imageUrl ? `<img class="dm-img" src="${m.imageUrl}" alt="" />` : "";
    const tx = m.text ? `<div>${escapeHtml(m.text)}</div>` : "";
    return `<div class="dm-bubble ${me ? "me" : "them"} ${m.shopOrder ? "shop-order-msg" : ""}">${img}${tx}</div>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

document.getElementById("dmBack")?.addEventListener("click", () => {
  if (dmUnsub) { dmUnsub(); dmUnsub = null; }
  activeChatPartner = null;
  document.getElementById("dmListView")?.classList.remove("hidden");
  document.getElementById("dmList")?.classList.remove("hidden");
  document.getElementById("dmChat")?.classList.add("hidden");
  loadDmList();
});

async function closeOrderChat() {
  if (!currentUser) return alert("Not logged in");
  if (!activeChatPartner) return alert("No chat open");
  const isSupport = !!activeChatPartner.isSupportChat;
  const isOrder = !!activeChatPartner.isOrderChat;
  if (isSupport) {
    if (!isStaff()) return alert("Only mods/owner can close Report/bug chats");
    if (!confirm("Close this Report/bug chat for both sides?")) return;
  } else if (isOrder) {
    if (!isOwner()) return alert("Only @vida (owner) can close order chats");
    if (!confirm("Close this Order chat? The buyer will no longer see it in DMs.")) return;
  } else {
    if (!isStaff()) return alert("Staff only");
    if (!confirm("Chat für beide schließen?")) return;
  }

  const otherUid = activeChatPartner.uid;
  const key = activeChatPartner.chatKey || chatKey(currentUser.uid, otherUid);

  try {
    await setDoc(doc(db, "chats", key), {
      chatKey: key,
      type: isSupport ? "support" : (isOrder ? "order" : "dm"),
      title: isSupport ? (activeChatPartner.supportTitle || "Report/bug") : "Order",
      participants: [currentUser.uid, otherUid],
      buyerUid: activeChatPartner.isOrderChat ? (activeChatPartner.uid === currentUser.uid ? null : otherUid) : otherUid,
      sellerUid: currentUser.uid,
      closed: true,
      closedAt: serverTimestamp(),
      closedBy: currentUser.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error(e);
    alert("Could not close chat. Check Firestore rules for collection \"chats\" (write allowed).\n\n" + (e.message || e));
    return;
  }

  if (dmUnsub) { dmUnsub(); dmUnsub = null; }
  activeChatPartner = null;
  document.getElementById("dmChat")?.classList.add("hidden");
  document.getElementById("dmListView")?.classList.remove("hidden");
  document.getElementById("dmList")?.classList.remove("hidden");
  document.getElementById("dmCloseChatBtn")?.classList.add("hidden");
  await loadDmList();
  if (isSupport) {
      try {
        const ts = await getDocs(collection(db, "supportTickets"));
        for (const d of ts.docs) {
          const t = d.data();
          if (t.userId === otherUid && t.status !== "closed") {
            await updateDoc(doc(db, "supportTickets", d.id), { status: "closed", closedAt: serverTimestamp(), closedBy: currentUser.uid });
          }
        }
      } catch (_) {}
      try { await loadSupportTickets(); } catch (_) {}
    }
    alert(isSupport ? "Report/bug chat closed." : "Order chat closed.");
}

// Robust click: button + event delegation
document.getElementById("dmCloseChatBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeOrderChat();
});
document.addEventListener("click", (e) => {
  if (e.target.closest("#dmCloseChatBtn")) {
    e.preventDefault();
    e.stopPropagation();
    closeOrderChat();
  }
});

document.getElementById("dmSend")?.addEventListener("click", sendDm);
document.getElementById("dmInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendDm();
});

async function sendDm(extra = {}) {
  if (!activeChatPartner || !currentUser || !requireVerified()) return;
  const input = document.getElementById("dmInput");
  const text = (extra.text != null ? extra.text : input?.value.trim()) || "";
  const imageUrl = extra.imageUrl || null;
  if (!text && !imageUrl) return;
  const them = await getDoc(doc(db, "users", activeChatPartner.uid));
  const p = them.data() || {};
  const isShopOwner = (p.handle || "").toLowerCase() === "vida" || (activeChatPartner.handle || "").toLowerCase() === "vida";
  const mutual = (currentProfile.following || []).includes(activeChatPartner.uid) && (p.following || []).includes(currentUser.uid);
  if (!mutual && !isShopOwner && !extra.shopOrder && !extra.supportTicket && !activeChatPartner?.isSupportChat) {
    alert(t("only_mutual_dm"));
    return;
  }
  const msg = {
    chatKey: chatKey(currentUser.uid, activeChatPartner.uid),
    from: currentUser.uid,
    to: activeChatPartner.uid,
    text: text || (imageUrl ? "📷 Bild" : ""),
    createdAt: serverTimestamp()
  };
  if (imageUrl) msg.imageUrl = imageUrl;
  if (extra.shopOrder) msg.shopOrder = true;
  await addDoc(collection(db, "dms"), msg);
  if (input && extra.text == null) input.value = "";
  // if I had hidden this chat, show it again after messaging
  try {
    const hid = currentProfile?.hiddenDmUids || [];
    if (hid.includes(activeChatPartner.uid)) {
      const next = hid.filter(id => id !== activeChatPartner.uid);
      currentProfile.hiddenDmUids = next;
      await setDoc(doc(db, "users", currentUser.uid), { hiddenDmUids: next }, { merge: true });
    }
  } catch (_) {}
}

document.getElementById("dmImageInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file || !activeChatPartner) return;
  if (file.size > 1.2 * 1024 * 1024) return alert("Bild max 1.2MB");
  if (!requireVerified()) return;
  const dataUrl = await readFileAsDataURL(file);
  await sendDm({ imageUrl: dataUrl, text: "" });
});

document.getElementById("searchInput")?.addEventListener("input", (e) => {
  let term = e.target.value.toLowerCase().trim();
  if (term.startsWith("#")) term = term.slice(1);
  const filtered = allPosts.filter(p => {
    if ((p.scope || "public") !== "public") return false;
    if (!term) return true;
    const tags = p.hashtags || extractHashtags(p.text || "");
    return (
      (p.text || "").toLowerCase().includes(term) ||
      (p.name || "").toLowerCase().includes(term) ||
      (p.handle || "").toLowerCase().includes(term) ||
      tags.some(tag => tag.includes(term) || term.includes(tag))
    );
  });
  renderPosts(filtered, "searchResults");
});

// click hashtag -> search
document.addEventListener("click", (e) => {
  const tagEl = e.target.closest(".hashtag");
  if (!tagEl) return;
  e.stopPropagation();
  const tag = tagEl.dataset.tag;
  if (!tag) return;
  switchPage("explore");
  const input = document.getElementById("searchInput");
  if (input) {
    input.value = "#" + tag;
    input.dispatchEvent(new Event("input"));
  }
});

// character counter
function updateCharCount() {
  const ta = document.getElementById("postText");
  let counter = document.getElementById("charCount");
  if (!ta) return;
  if (!counter) {
    counter = document.createElement("span");
    counter.id = "charCount";
    counter.className = "char-count";
    ta.parentElement?.appendChild(counter);
  }
  const len = ta.value.length;
  counter.textContent = len + "/1000";
  counter.classList.toggle("over", len > 1000);
}
document.getElementById("postText")?.addEventListener("input", updateCharCount);

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h";
  return Math.floor(seconds / 86400) + "d";
}
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num;
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// close menus on outside click
document.addEventListener("click", () => {
  document.querySelectorAll(".post-menu-dropdown").forEach(d => d.classList.add("hidden"));
});


// ===== Lightbox for images/videos =====
(function setupLightbox() {
  let box = document.getElementById("mediaLightbox");
  if (!box) {
    box = document.createElement("div");
    box.id = "mediaLightbox";
    box.className = "media-lightbox hidden";
    box.innerHTML = `
      <button class="lightbox-close" aria-label="Close">✕</button>
      <div class="lightbox-content"></div>
    `;
    document.body.appendChild(box);
  }
  const content = box.querySelector(".lightbox-content");
  const closeBtn = box.querySelector(".lightbox-close");

  function closeLightbox() {
    box.classList.add("hidden");
    content.innerHTML = "";
    document.body.style.overflow = "";
  }

  function openLightbox(type, url) {
    content.innerHTML = "";
    if (type === "video") {
      const v = document.createElement("video");
      v.src = url;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      content.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      content.appendChild(img);
    }
    box.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  document.addEventListener("click", (e) => {
    const cell = e.target.closest(".media-open");
    if (cell) {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(cell.dataset.type || "image", cell.dataset.url);
      return;
    }
    if (e.target === box || e.target === closeBtn) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
})();


// ===== Admin panel =====
function flashBtnOk(btn) {
  if (!btn) return;
  const prev = btn.textContent;
  const prevBg = btn.style.background;
  btn.textContent = "✓";
  btn.style.background = "#00ba7c";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = prev;
    btn.style.background = prevBg || "";
    btn.disabled = false;
  }, 1200);
}

async function setupAdminPanel() {
  const ownerOnly = document.getElementById("adminOwnerOnly");
  const title = document.getElementById("adminTitle");
  if (isOwner()) {
    if (ownerOnly) ownerOnly.classList.remove("hidden");
    if (title) title.textContent = "Owner Panel";
    await refreshModList();
    try { await loadOrders(); } catch (_) {}
    await loadSupportTickets();
  } else if (getRole(currentProfile) === "mod") {
    if (ownerOnly) ownerOnly.classList.add("hidden");
    if (title) title.textContent = "Mod Panel";
    await loadSupportTickets();
  } else {
    switchPage("home");
  }
}

async function refreshModList() {
  const el = document.getElementById("modList");
  if (!el) return;
  try {
    const snap = await getDocs(collection(db, "users"));
    const mods = [];
    snap.forEach(d => {
      const p = d.data();
      if (p.role === "mod") mods.push({ uid: d.id, ...p });
    });
    el.innerHTML = mods.length
      ? mods.map(m => `<div class="admin-list-item">@${escapeHtml(m.handle || "?")} — ${escapeHtml(m.name || "")}</div>`).join("")
      : `<div class="settings-hint">No mods yet.</div>`;
  } catch (e) {
    el.innerHTML = `<div class="settings-hint">${escapeHtml(e.message)}</div>`;
  }
}

async function adminAction(handleInputId, btn, fn) {
  const raw = document.getElementById(handleInputId)?.value || "";
  const u = await findUserByHandle(raw);
  if (!u) {
    alert("User not found. Check the @handle.");
    return null;
  }
  try {
    await fn(u);
    flashBtnOk(btn);
    return u;
  } catch (e) {
    alert(e.message || String(e));
    return null;
  }
}

document.getElementById("modAddBtn")?.addEventListener("click", async () => {
  if (!isOwner()) return alert("Owner only");
  const btn = document.getElementById("modAddBtn");
  await adminAction("modHandleInput", btn, async (u) => {
    if (isOwnerProfile(u)) throw new Error("Cannot change owner");
    await setDoc(doc(db, "users", u.uid), { role: "mod" }, { merge: true });
    document.getElementById("modHandleInput").value = "";
    await refreshModList();
  });
});

document.getElementById("modRemoveBtn")?.addEventListener("click", async () => {
  if (!isOwner()) return alert("Owner only");
  const btn = document.getElementById("modRemoveBtn");
  await adminAction("modHandleInput", btn, async (u) => {
    if (isOwnerProfile(u)) throw new Error("Cannot change owner");
    await setDoc(doc(db, "users", u.uid), { role: "user" }, { merge: true });
    document.getElementById("modHandleInput").value = "";
    await refreshModList();
  });
});

document.getElementById("verifyAddBtn")?.addEventListener("click", async () => {
  if (!isOwner()) return alert("Owner only");
  const btn = document.getElementById("verifyAddBtn");
  await adminAction("verifyHandleInput", btn, async (u) => {
    await setDoc(doc(db, "users", u.uid), { verified: true }, { merge: true });
    document.getElementById("verifyHandleInput").value = "";
  });
});

document.getElementById("verifyRemoveBtn")?.addEventListener("click", async () => {
  if (!isOwner()) return alert("Owner only");
  const btn = document.getElementById("verifyRemoveBtn");
  await adminAction("verifyHandleInput", btn, async (u) => {
    if (isOwnerProfile(u)) throw new Error("Owner stays verified");
    await setDoc(doc(db, "users", u.uid), { verified: false }, { merge: true });
    document.getElementById("verifyHandleInput").value = "";
  });
});

document.getElementById("banBtn")?.addEventListener("click", async () => {
  if (!isOwner()) return alert("Owner only");
  const btn = document.getElementById("banBtn");
  await adminAction("banHandleInput", btn, async (u) => {
    if (!canModerateTarget(u)) throw new Error("Cannot ban this user");
    await setDoc(doc(db, "users", u.uid), { banned: true }, { merge: true });
  });
});

document.getElementById("unbanBtn")?.addEventListener("click", async () => {
  if (!isOwner()) return alert("Owner only");
  const btn = document.getElementById("unbanBtn");
  await adminAction("banHandleInput", btn, async (u) => {
    await setDoc(doc(db, "users", u.uid), { banned: false }, { merge: true });
  });
});

document.getElementById("timeoutBtn")?.addEventListener("click", async () => {
  if (!isStaff()) return alert("Staff only");
  const btn = document.getElementById("timeoutBtn");
  await adminAction("timeoutHandleInput", btn, async (u) => {
    if (!canModerateTarget(u)) throw new Error("Cannot timeout mods or owner");
    const secs = parseInt(document.getElementById("timeoutDuration").value, 10) || 3600;
    const until = new Date(Date.now() + secs * 1000);
    await setDoc(doc(db, "users", u.uid), { timeoutUntil: until.toISOString() }, { merge: true });
  });
});

document.getElementById("clearTimeoutBtn")?.addEventListener("click", async () => {
  if (!isStaff()) return alert("Staff only");
  const btn = document.getElementById("clearTimeoutBtn");
  await adminAction("timeoutHandleInput", btn, async (u) => {
    await setDoc(doc(db, "users", u.uid), { timeoutUntil: null }, { merge: true });
  });
});





function productStarsHtml(rating) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  let s = '<span class="product-stars">';
  for (let i = 1; i <= 5; i++) {
    s += `<span class="star ${i <= r ? "on" : "off"}">★</span>`;
  }
  s += `</span>`;
  return s;
}

function setProdStarPicker(n) {
  n = Math.max(1, Math.min(5, parseInt(n, 10) || 5));
  const hid = document.getElementById("prodRating");
  if (hid) hid.value = String(n);
  const label = document.getElementById("prodRatingLabel");
  if (label) label.textContent = n + " / 5";
  document.querySelectorAll("#prodStarPicker .star-btn").forEach(btn => {
    const v = parseInt(btn.dataset.star, 10);
    btn.classList.toggle("active", v <= n);
  });
}

document.getElementById("prodStarPicker")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".star-btn");
  if (!btn) return;
  e.preventDefault();
  setProdStarPicker(btn.dataset.star);
});

// ===== V Shop (DM checkout) =====
const ORDER_NOTIFY_EMAIL = "vida.rcm18@gmail.com";
let allProducts = [];
let shopUnsub = null;
let pendingProdImage = null; // main / legacy
let pendingProdImages = []; // up to 5 total (index 0 = title image)
let activeProduct = null;
let pmSlideIndex = 0;
let pmGalleryImages = [];

function productImages(p) {
  if (!p) return [];
  if (Array.isArray(p.images) && p.images.length) {
    return p.images.filter(Boolean).slice(0, 5);
  }
  if (p.imageUrl) return [p.imageUrl];
  return [];
}

function renderProdImagesPreview() {
  const el = document.getElementById("prodImagesPreview");
  if (!el) return;
  if (!pendingProdImages.length) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = pendingProdImages.map((src, i) => `
    <div class="prod-preview-item" data-i="${i}">
      <img src="${src}" alt="" />
      ${i === 0 ? '<span class="badge">Titel</span>' : ''}
      <button type="button" class="rm" data-rm-img="${i}" title="Entfernen">✕</button>
    </div>`).join("");
  el.querySelectorAll("[data-rm-img]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = +btn.dataset.rmImg;
      pendingProdImages.splice(i, 1);
      pendingProdImage = pendingProdImages[0] || null;
      const mainPrev = document.getElementById("prodImagePreview");
      if (mainPrev) {
        mainPrev.innerHTML = pendingProdImage
          ? `<img src="${pendingProdImage}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px" />`
          : "";
      }
      renderProdImagesPreview();
    });
  });
}

function setPmSlide(i) {
  const slides = document.getElementById("pmSlides");
  const dots = document.getElementById("pmDots");
  const thumbs = document.getElementById("pmThumbs");
  const gallery = document.getElementById("pmGallery");
  if (!slides || !pmGalleryImages.length) return;
  pmSlideIndex = Math.max(0, Math.min(i, pmGalleryImages.length - 1));
  slides.style.transform = `translateX(-${pmSlideIndex * 100}%)`;
  if (dots) {
    dots.querySelectorAll(".pm-dot").forEach((d, di) => d.classList.toggle("active", di === pmSlideIndex));
  }
  if (thumbs) {
    thumbs.querySelectorAll(".pm-thumb").forEach((t, ti) => t.classList.toggle("active", ti === pmSlideIndex));
  }
  if (gallery) gallery.classList.toggle("has-many", pmGalleryImages.length > 1);
}

function setupProductGallery(images) {
  pmGalleryImages = (images || []).filter(Boolean).slice(0, 5);
  pmSlideIndex = 0;
  const slides = document.getElementById("pmSlides");
  const dots = document.getElementById("pmDots");
  const thumbs = document.getElementById("pmThumbs");
  const gallery = document.getElementById("pmGallery");
  if (!slides) return;
  if (!pmGalleryImages.length) {
    slides.innerHTML = `<div class="pm-slide"><div style="color:#71767b">No image</div></div>`;
    if (dots) dots.innerHTML = "";
    if (thumbs) thumbs.innerHTML = "";
    if (gallery) gallery.classList.remove("has-many");
    return;
  }
  slides.innerHTML = pmGalleryImages.map(src =>
    `<div class="pm-slide" data-url="${src.replace(/"/g, "&quot;")}"><img src="${src}" alt="" /></div>`
  ).join("");
  if (dots) {
    dots.innerHTML = pmGalleryImages.map((_, i) =>
      `<button type="button" class="pm-dot${i === 0 ? " active" : ""}" data-dot="${i}"></button>`
    ).join("");
    dots.querySelectorAll("[data-dot]").forEach(d => d.addEventListener("click", () => setPmSlide(+d.dataset.dot)));
  }
  if (thumbs) {
    if (pmGalleryImages.length > 1) {
      thumbs.innerHTML = pmGalleryImages.map((src, i) =>
        `<img class="pm-thumb${i === 0 ? " active" : ""}" src="${src}" data-thumb="${i}" alt="" />`
      ).join("");
      thumbs.querySelectorAll("[data-thumb]").forEach(t => t.addEventListener("click", () => setPmSlide(+t.dataset.thumb)));
    } else {
      thumbs.innerHTML = "";
    }
  }
  setPmSlide(0);

  // swipe
  let startX = 0, dx = 0, dragging = false;
  const onStart = (x) => { dragging = true; startX = x; dx = 0; slides.style.transition = "none"; };
  const onMove = (x) => {
    if (!dragging) return;
    dx = x - startX;
    slides.style.transform = `translateX(calc(-${pmSlideIndex * 100}% + ${dx}px))`;
  };
  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    slides.style.transition = "";
    if (Math.abs(dx) > 50) {
      if (dx < 0) setPmSlide(pmSlideIndex + 1);
      else setPmSlide(pmSlideIndex - 1);
    } else setPmSlide(pmSlideIndex);
  };
  slides.ontouchstart = (e) => onStart(e.touches[0].clientX);
  slides.ontouchmove = (e) => onMove(e.touches[0].clientX);
  slides.ontouchend = onEnd;
  slides.onmousedown = (e) => { e.preventDefault(); onStart(e.clientX); };
  window.addEventListener("mousemove", (e) => onMove(e.clientX));
  window.addEventListener("mouseup", onEnd);

  // click to enlarge
  slides.querySelectorAll(".pm-slide").forEach(slide => {
    slide.addEventListener("click", () => {
      const url = slide.dataset.url || pmGalleryImages[pmSlideIndex];
      if (!url) return;
      // reuse media lightbox if available
      let box = document.getElementById("mediaLightbox");
      if (!box) {
        box = document.createElement("div");
        box.id = "mediaLightbox";
        box.className = "media-lightbox hidden";
        box.innerHTML = `<button class="lightbox-close" aria-label="Close">✕</button><div class="lightbox-content"></div>`;
        document.body.appendChild(box);
        box.addEventListener("click", (e) => {
          if (e.target === box || e.target.classList.contains("lightbox-close")) {
            box.classList.add("hidden");
            box.querySelector(".lightbox-content").innerHTML = "";
            document.body.style.overflow = "";
          }
        });
      }
      const content = box.querySelector(".lightbox-content");
      content.innerHTML = `<img src="${url}" alt="" />`;
      box.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    });
  });
}

let cart = [];

function effectivePrice(p) {
  const base = parseFloat(p.price) || 0;
  const disc = parseFloat(p.discount) || 0;
  if (disc > 0 && disc < 100) return base * (1 - disc / 100);
  return base;
}
function formatPrice(price) {
  const n = parseFloat(price);
  if (isNaN(n)) return escapeHtml(String(price || ""));
  return "€" + n.toFixed(2);
}
function getCartTotal() {
  return cart.reduce((s, c) => s + c.price * c.qty, 0);
}

function loadShop() {
  const addBtn = document.getElementById("shopAddBtn");
  if (addBtn) {
    if (isOwner()) addBtn.classList.remove("hidden");
    else addBtn.classList.add("hidden");
  }
  updateCartBadge();
  if (shopUnsub) { renderShop(); return; }
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    shopUnsub = onSnapshot(q, (snap) => {
      allProducts = [];
      snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
      renderShop();
    }, () => {
      shopUnsub = onSnapshot(collection(db, "products"), (snap) => {
        allProducts = [];
        snap.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
        allProducts.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        renderShop();
      });
    });
  } catch (e) {
    console.warn(e);
  }
}

function renderShop() {
  const list = document.getElementById("shopList");
  const empty = document.getElementById("shopEmpty");
  if (!list) return;
  const term = (document.getElementById("shopSearch")?.value || "").toLowerCase().trim();
  let items = allProducts.filter(p => {
    if (!term) return true;
    return (p.name || "").toLowerCase().includes(term) ||
      (p.description || "").toLowerCase().includes(term);
  });
  if (!items.length) {
    list.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }
  empty?.classList.add("hidden");
  list.innerHTML = items.map(p => {
    const stock = parseInt(p.stock, 10);
    const stockNum = isNaN(stock) ? 0 : stock;
    const disc = parseFloat(p.discount) || 0;
    const eff = effectivePrice(p);
    const priceHtml = disc > 0
      ? `<span class="shop-price-now">${formatPrice(eff)}</span> <span class="shop-price-old">${formatPrice(p.price)}</span> <span class="shop-disc">-${disc}%</span>`
      : `<span class="shop-price-now">${formatPrice(p.price)}</span>`;
    const stockHtml = stockNum > 0
      ? `<span class="shop-in-stock">Auf Lager (${stockNum})</span>`
      : `<span class="shop-out-stock">Nicht auf Lager</span>`;
    const cover = productImages(p)[0] || "";
    return `<div class="shop-item" data-id="${p.id}">
      <img class="shop-item-img" src="${cover}" alt="" loading="lazy" />
      <div class="shop-item-body">
        <div class="shop-item-meta">
          <div class="shop-item-title">${escapeHtml(p.name || "Produkt")}</div>
          <div class="shop-item-stars">${productStarsHtml(p.rating != null ? p.rating : 5)}</div>
          <div class="shop-item-desc">${escapeHtml((p.description || "").slice(0, 48))}${(p.description || "").length > 48 ? "…" : ""}</div>
          <div class="shop-item-price-row">${priceHtml}</div>
          <div class="shop-item-stock">${stockHtml}</div>
        </div>
        <div class="shop-item-btns">
          <button class="shop-btn-buy mini" data-buy="${p.id}" ${stockNum < 1 ? "disabled" : ""}>Buy</button>
          <button class="shop-btn-cart mini" data-cart="${p.id}" ${stockNum < 1 ? "disabled" : ""}>Add to cart</button>
        </div>
      </div>
    </div>`;
  }).join("");

  list.querySelectorAll(".shop-item").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openProduct(el.dataset.id);
    });
  });
  list.querySelectorAll("[data-cart]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.cart);
    });
  });
  list.querySelectorAll("[data-buy]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = allProducts.find(x => x.id === btn.dataset.buy);
      if (!p) return;
      const stock = parseInt(p.stock, 10) || 0;
      if (stock < 1) return alert("Out of stock");
      if (!p.buyLink) return alert("No buy link for this product.");
      openExternalBuyLink(p.buyLink);
    });
  });
}

function openProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  activeProduct = p;
  const stock = parseInt(p.stock, 10);
  const stockNum = isNaN(stock) ? 0 : stock;
  const disc = parseFloat(p.discount) || 0;
  setupProductGallery(productImages(p));
  // legacy single image fallback if gallery missing
  const legacyImg = document.getElementById("pmImage");
  if (legacyImg) legacyImg.src = productImages(p)[0] || "";
  document.getElementById("pmName").textContent = p.name || "Produkt";
  const pmStars = document.getElementById("pmStars");
  if (pmStars) pmStars.innerHTML = productStarsHtml(p.rating != null ? p.rating : 5);
  document.getElementById("pmDesc").textContent = p.description || "";
  const priceEl = document.getElementById("pmPrice");
  if (disc > 0) {
    priceEl.innerHTML = `<span class="shop-price-now">${formatPrice(effectivePrice(p))}</span> <span class="shop-price-old">${formatPrice(p.price)}</span> <span class="shop-disc">-${disc}%</span>`;
  } else {
    priceEl.textContent = formatPrice(p.price);
  }
  const stockEl = document.getElementById("pmStock");
  if (stockNum > 0) {
    stockEl.textContent = "Auf Lager (" + stockNum + ")";
    stockEl.className = "pm-stock in";
  } else {
    stockEl.textContent = "Nicht auf Lager";
    stockEl.className = "pm-stock out";
  }
  const cartBtn = document.getElementById("pmCartBtn");
  const buyBtn = document.getElementById("pmBuyBtn");
  if (cartBtn) cartBtn.disabled = stockNum < 1;
  if (buyBtn) buyBtn.disabled = stockNum < 1;
  const ownerAct = document.getElementById("pmOwnerActions");
  if (ownerAct) {
    if (isOwner()) ownerAct.classList.remove("hidden");
    else ownerAct.classList.add("hidden");
  }
  document.getElementById("productModal")?.classList.remove("hidden");
}

function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const stock = parseInt(p.stock, 10) || 0;
  if (stock < 1) return alert("Out of stock");
  const existing = cart.find(c => c.id === id);
  if (existing) {
    if (existing.qty >= stock) return alert("Max. Menge erreicht");
    existing.qty += 1;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      price: effectivePrice(p),
      imageUrl: productImages(p)[0] || p.imageUrl || "",
      buyLink: p.buyLink || "",
      qty: 1,
      stock
    });
  }
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const n = cart.reduce((s, c) => s + c.qty, 0);
  if (n > 0) {
    badge.textContent = n > 99 ? "99+" : String(n);
    badge.classList.remove("hidden");
  } else badge.classList.add("hidden");
}

function openExternalBuyLink(url) {
  url = (url || "").trim();
  if (!url) {
    alert("No buy link for this product.");
    return false;
  }
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

function openCart() {
  const panel = document.getElementById("cartPanel");
  const items = document.getElementById("cartItems");
  if (!panel || !items) return;
  if (!cart.length) {
    items.innerHTML = `<div class="dm-empty"><p>Cart is empty</p></div>`;
  } else {
    items.innerHTML = cart.map((c, i) => `
      <div class="cart-row">
        <img src="${c.imageUrl}" alt="" />
        <div class="cart-row-info">
          <strong>${escapeHtml(c.name)}</strong>
          <span>${formatPrice(c.price)}${c.qty > 1 ? " × " + c.qty : ""}</span>
        </div>
        <div class="cart-row-actions cart-row-actions-wide">
          <button type="button" class="cart-buy-btn" data-buy="${i}">Buy</button>
          <button type="button" class="cart-rm-btn" data-rm="${i}" title="Entfernen">${ICO.trash}</button>
        </div>
      </div>`).join("");
    items.querySelectorAll("[data-buy]").forEach(b => b.addEventListener("click", () => {
      const i = +b.dataset.buy;
      const item = cart[i];
      if (!item) return;
      openExternalBuyLink(item.buyLink);
    }));
    items.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => {
      cart.splice(+b.dataset.rm, 1);
      updateCartBadge(); openCart();
    }));
  }
  const totalEl = document.getElementById("cartTotalSimple");
  if (totalEl) totalEl.textContent = "Total: " + formatPrice(getCartTotal());
  panel.classList.remove("hidden");
  panel.style.display = "flex";
}

async function startShopOrderFromCart() {
  if (!cart.length) return alert("Cart is empty");
  if (!currentUser) return alert("Please log in");
  if (!requireVerified()) return;
  const owner = await findUserByHandle("vida");
  if (!owner) return alert("Seller (@vida) not found");

  const items = cart.map(c => ({
    id: c.id, name: c.name, price: c.price, qty: c.qty, imageUrl: c.imageUrl || ""
  }));
  const total = getCartTotal();
  const orderRef = await addDoc(collection(db, "orders"), {
    items, total,
    buyerUid: currentUser.uid,
    buyerHandle: currentProfile?.handle || "",
    buyerName: currentProfile?.name || "",
    sellerUid: owner.uid,
    status: "pending_chat",
    createdAt: serverTimestamp()
  });

  const lines = items.map(i => `• ${i.name} × ${i.qty} = €${(i.price * i.qty).toFixed(2)}`).join("\n");
  const paypal = owner.paypalName || "Seller will send PayPal name in chat";
  const text =
    `🛒 ORDER REQUEST (V Shop)
Order #: ${orderRef.id.slice(0, 8)}

` +
    `${lines}

Total: €${total.toFixed(2)}

---
` +
    `Payment: PayPal only
PayPal to: ${paypal}
` +
    `Then send your shipping address (Germany only) + optional payment screenshot here.`;

  const key = chatKey(currentUser.uid, owner.uid);
  await setDoc(doc(db, "chats", key), {
    chatKey: key,
    type: "order",
    title: "Order",
    participants: [currentUser.uid, owner.uid],
    buyerUid: currentUser.uid,
    sellerUid: owner.uid,
    closed: false,
    lastText: "🛒 Order request · €" + total.toFixed(2),
    updatedAt: serverTimestamp(),
    orderId: orderRef.id
  }, { merge: true });

  openChat(owner.uid, { ...owner, isOrderChat: true, handle: owner.handle || "vida" });
  await sendDm({ text, shopOrder: true });
  cart = [];
  updateCartBadge();
  const cp = document.getElementById("cartPanel");
  if (cp) { cp.classList.add("hidden"); cp.style.display = "none"; }
  alert("Chat with the seller opened.\nThe chat is called \"Order\" and is pinned at the top of your DMs.\nPayment: PayPal only.");
}

// Cart UI — event delegation (works even if DOM reloads)
document.addEventListener("click", (e) => {
  const cartBtn = e.target.closest("#cartBtn, .shop-cart-btn");
  if (cartBtn) {
    e.preventDefault();
    e.stopPropagation();
    openCart();
    return;
  }
  if (e.target.closest("#cartClose")) {
    const p = document.getElementById("cartPanel");
    if (p) { p.classList.add("hidden"); p.style.display = "none"; }
    return;
  }
});
window.openCart = openCart;

document.getElementById("productModalClose")?.addEventListener("click", () => {
  document.getElementById("productModal")?.classList.add("hidden");
  activeProduct = null;
});
document.getElementById("productModal")?.addEventListener("click", (e) => {
  if (e.target.id === "productModal") {
    document.getElementById("productModal")?.classList.add("hidden");
    activeProduct = null;
  }
});
document.getElementById("pmCartBtn")?.addEventListener("click", () => {
  if (activeProduct) addToCart(activeProduct.id);
});
document.getElementById("pmBuyBtn")?.addEventListener("click", () => {
  if (!activeProduct) return;
  const stock = parseInt(activeProduct.stock, 10) || 0;
  if (stock < 1) return alert("Out of stock");
  if (!activeProduct.buyLink) return alert("No buy link for this product.");
  openExternalBuyLink(activeProduct.buyLink);
});

document.getElementById("pmEditBtn")?.addEventListener("click", () => {
  if (!activeProduct || !isOwner()) return;
  const p = activeProduct;
  document.getElementById("productModal")?.classList.add("hidden");
  document.getElementById("shopAddForm")?.classList.remove("hidden");
  document.getElementById("shopFormTitle").textContent = "Produkt bearbeiten";
  document.getElementById("prodEditId").value = p.id;
  document.getElementById("prodName").value = p.name || "";
  const bl = document.getElementById("prodBuyLink"); if (bl) bl.value = p.buyLink || "";
  document.getElementById("prodDesc").value = p.description || "";
  document.getElementById("prodPrice").value = p.price || "";
  document.getElementById("prodDiscount").value = p.discount || "";
  document.getElementById("prodStock").value = p.stock ?? "";
  setProdStarPicker(p.rating != null ? p.rating : 5);
  pendingProdImages = productImages(p).slice(0, 5);
  pendingProdImage = pendingProdImages[0] || null;
  document.getElementById("prodImagePreview").innerHTML = pendingProdImage
    ? `<img src="${pendingProdImage}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px" />` : "";
  renderProdImagesPreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.getElementById("pmDeleteBtn")?.addEventListener("click", async () => {
  if (!activeProduct || !isOwner()) return;
  if (!confirm("Produkt wirklich löschen?")) return;
  await deleteDoc(doc(db, "products", activeProduct.id));
  document.getElementById("productModal")?.classList.add("hidden");
  activeProduct = null;
});

document.getElementById("shopSearch")?.addEventListener("input", renderShop);
document.getElementById("shopAddBtn")?.addEventListener("click", () => {
  if (!isOwner()) return;
  document.getElementById("shopFormTitle").textContent = "Produkt hinzufügen";
  document.getElementById("prodEditId").value = "";
  const _bl = document.getElementById("prodBuyLink"); if (_bl) _bl.value = "";
  ["prodName","prodDesc","prodPrice","prodDiscount","prodStock","prodImage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("prodImagePreview").innerHTML = "";
  document.getElementById("prodImagesPreview").innerHTML = "";
  const extra = document.getElementById("prodImagesExtra");
  if (extra) extra.value = "";
  pendingProdImage = null;
  pendingProdImages = [];
  document.getElementById("shopAddForm")?.classList.toggle("hidden");
  try { setProdStarPicker(5); } catch (_) {}
});
document.getElementById("prodCancelBtn")?.addEventListener("click", () => {
  document.getElementById("shopAddForm")?.classList.add("hidden");
});
document.getElementById("prodImage")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) return alert("Bild max 1.5MB");
  const dataUrl = await readFileAsDataURL(file);
  pendingProdImage = dataUrl;
  if (pendingProdImages.length) pendingProdImages[0] = dataUrl;
  else pendingProdImages = [dataUrl];
  document.getElementById("prodImagePreview").innerHTML =
    `<img src="${pendingProdImage}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px" />`;
  renderProdImagesPreview();
});

document.getElementById("prodImagesExtra")?.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const room = 5 - pendingProdImages.length;
  if (room <= 0) {
    alert("Maximal 5 Bilder pro Produkt");
    e.target.value = "";
    return;
  }
  const take = files.slice(0, room);
  for (const file of take) {
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Ein Bild ist größer als 1.5MB und wurde übersprungen");
      continue;
    }
    const dataUrl = await readFileAsDataURL(file);
    pendingProdImages.push(dataUrl);
  }
  pendingProdImage = pendingProdImages[0] || null;
  const mainPrev = document.getElementById("prodImagePreview");
  if (mainPrev && pendingProdImage) {
    mainPrev.innerHTML = `<img src="${pendingProdImage}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px" />`;
  }
  renderProdImagesPreview();
  e.target.value = "";
});

document.getElementById("pmPrev")?.addEventListener("click", () => setPmSlide(pmSlideIndex - 1));
document.getElementById("pmNext")?.addEventListener("click", () => setPmSlide(pmSlideIndex + 1));
document.getElementById("prodSaveBtn")?.addEventListener("click", async () => {
  if (!currentUser || !isOwner()) return alert("Nur Owner");
  const name = document.getElementById("prodName")?.value.trim();
  const description = document.getElementById("prodDesc")?.value.trim();
  const price = document.getElementById("prodPrice")?.value.trim();
  const discount = document.getElementById("prodDiscount")?.value.trim() || "0";
  const stock = document.getElementById("prodStock")?.value.trim();
  let buyLink = document.getElementById("prodBuyLink")?.value.trim() || "";
  const editId = document.getElementById("prodEditId")?.value || "";
  if (!name) return alert("Titel fehlt");
  if (!description) return alert("Beschreibung fehlt");
  if (!price || isNaN(parseFloat(price))) return alert("Preis fehlt");
  if (stock === "" || isNaN(parseInt(stock, 10))) return alert("Lagerbestand fehlt");
  if (!buyLink) return alert("Buy-Link fehlt");
  if (!/^https?:\/\//i.test(buyLink)) buyLink = "https://" + buyLink;
  if (!pendingProdImages.length && !pendingProdImage && !editId) return alert("Bild fehlt");
  const rating = Math.max(1, Math.min(5, parseInt(document.getElementById("prodRating")?.value || "5", 10) || 5));
  const data = {
    name, description,
    price: parseFloat(price),
    discount: Math.min(99, Math.max(0, parseFloat(discount) || 0)),
    stock: parseInt(stock, 10),
    buyLink,
    rating,
    sellerId: currentUser.uid,
    sellerHandle: currentProfile?.handle || "vida",
    sellerName: currentProfile?.name || "Vida"
  };
  const imgs = (pendingProdImages.length ? pendingProdImages : (pendingProdImage ? [pendingProdImage] : [])).slice(0, 5);
  if (imgs.length) {
    data.imageUrl = imgs[0]; // cover / title image
    data.images = imgs;
  } else if (!editId) {
    return alert("Bild fehlt");
  }
  if (editId) {
    await updateDoc(doc(db, "products", editId), data);
    alert("Produkt aktualisiert");
  } else {
    data.createdAt = serverTimestamp();
    await addDoc(collection(db, "products"), data);
    alert("Produkt hinzugefügt");
  }
  document.getElementById("shopAddForm")?.classList.add("hidden");
  document.getElementById("prodEditId").value = "";
  pendingProdImage = null;
  pendingProdImages = [];
  document.getElementById("prodImagesPreview").innerHTML = "";
});

async function loadOrders() {
  const el = document.getElementById("ordersList");
  if (!el || !isOwner()) return;
  const pp = document.getElementById("ownerPaypalName");
  if (pp && currentProfile) pp.value = currentProfile.paypalName || "";
  try {
    const snap = await getDocs(collection(db, "orders"));
    const orders = [];
    snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
    orders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    if (!orders.length) {
      el.innerHTML = `<div class="settings-hint">Noch keine Kaufanfragen.</div>`;
      return;
    }
    el.innerHTML = orders.slice(0, 40).map(o => {
      const items = (o.items || []).map(i => `${escapeHtml(i.name)} × ${i.qty}`).join(", ");
      const when = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString("de-DE") : "";
      return `<div class="admin-list-item order-item" data-buyer="${o.buyerUid || ""}" style="cursor:pointer">
        <strong>€${(o.total || 0).toFixed(2)}</strong> · ${escapeHtml(o.status || "")} · ${escapeHtml(when)}<br/>
        👤 @${escapeHtml(o.buyerHandle || "?")} — ${escapeHtml(o.buyerName || "")}<br/>
        ${items}<br/>
        <span style="color:#1d9bf0">Chat öffnen →</span>
      </div>`;
    }).join("");
    el.querySelectorAll(".order-item").forEach(row => {
      row.addEventListener("click", async () => {
        const uid = row.dataset.buyer;
        if (!uid) return;
        const snap = await getDoc(doc(db, "users", uid));
        const profile = snap.exists() ? snap.data() : { name: "Käufer", handle: "?" };
        openChat(uid, { ...profile, uid });
      });
    });
  } catch (e) {
    el.innerHTML = `<div class="settings-hint">${escapeHtml(e.message)}</div>`;
  }
}
document.getElementById("savePaypalNameBtn")?.addEventListener("click", async () => {
  if (!isOwner() || !currentUser) return;
  const name = document.getElementById("ownerPaypalName")?.value.trim() || "";
  await setDoc(doc(db, "users", currentUser.uid), { paypalName: name }, { merge: true });
  if (currentProfile) currentProfile.paypalName = name;
  alert("PayPal-Name gespeichert");
});



// ===== Support / Report-bug =====
document.getElementById("supportTitle")?.addEventListener("input", (e) => {
  const v = (e.target.value || "").slice(0, 10);
  if (e.target.value !== v) e.target.value = v;
  const c = document.getElementById("supportTitleCount");
  if (c) c.textContent = `${v.length} / 10`;
});

document.getElementById("supportSubmitBtn")?.addEventListener("click", async () => {
  if (!currentUser || !currentProfile) return alert("Please log in");
  if (!(await requireNotBanned())) return;
  const title = (document.getElementById("supportTitle")?.value || "").trim().slice(0, 10);
  const message = (document.getElementById("supportMsg")?.value || "").trim().slice(0, 1000);
  const statusEl = document.getElementById("supportStatus");
  if (!title) {
    if (statusEl) statusEl.textContent = "Title is required (max 10 characters).";
    return alert("Title is required (max 10 characters)");
  }
  const owner = await findUserByHandle("vida");
  if (!owner) return alert("Support is currently unavailable (@vida missing)");

  const btn = document.getElementById("supportSubmitBtn");
  if (btn) btn.disabled = true;
  try {
    const ticketRef = await addDoc(collection(db, "supportTickets"), {
      title,
      message,
      userId: currentUser.uid,
      handle: currentProfile.handle || "",
      name: currentProfile.name || "",
      status: "open",
      staffUid: owner.uid,
      createdAt: serverTimestamp()
    });
    const key = "support_" + ticketRef.id;
    await updateDoc(doc(db, "supportTickets", ticketRef.id), { chatKey: key });

    await setDoc(doc(db, "chats", key), {
      chatKey: key,
      type: "support",
      title: title,
      supportTitle: title,
      ticketId: ticketRef.id,
      participants: Array.from(new Set([currentUser.uid, owner.uid])),
      userUid: currentUser.uid,
      staffUid: owner.uid,
      closed: false,
      lastText: "Report/bug: " + title,
      updatedAt: serverTimestamp()
    }, { merge: true });

    const body = "🛠 Report/bug\nTitle: " + title + (message ? "\n\n" + message : "\n\n(no details)");

    openChat(owner.uid, {
      ...owner,
      uid: owner.uid,
      isSupportChat: true,
      isOrderChat: false,
      supportTitle: title,
      chatKey: key,
      ticketId: ticketRef.id,
      name: owner.name || "Support",
      handle: owner.handle || "vida"
    });
    if (activeChatPartner) activeChatPartner.chatKey = key;
    await sendDm({ text: body, supportTicket: true });

    document.getElementById("supportTitle").value = "";
    document.getElementById("supportMsg").value = "";
    const c = document.getElementById("supportTitleCount");
    if (c) c.textContent = "0 / 10";
    if (statusEl) statusEl.textContent = "Sent — visible under Messages as Report/bug.";
    switchPage("messages");
    try { await loadDmList(); } catch (_) {}
  } catch (e) {
    alert(e.message || String(e));
    if (statusEl) statusEl.textContent = e.message || String(e);
  } finally {
    if (btn) btn.disabled = false;
  }
});

async function loadSupportTickets() {
  const el = document.getElementById("supportTicketsList");
  if (!el || !isStaff()) return;
  el.innerHTML = `<div class="settings-hint">Loading…</div>`;
  try {
    const snap = await getDocs(collection(db, "supportTickets"));
    const tickets = [];
    snap.forEach(d => {
      const t = d.data() || {};
      if (t.status === "closed") return;
      tickets.push({ id: d.id, ...t });
    });
    tickets.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    if (!tickets.length) {
      el.innerHTML = `<div class="settings-hint">No open Report/bug requests.</div>`;
      return;
    }
    el.innerHTML = tickets.map(t => `
      <div class="admin-list-item support-ticket-row" data-uid="${t.userId}" data-ticket="${t.id}" data-title="${escapeHtml(t.title || "")}" style="cursor:pointer">
        <strong>${escapeHtml(t.title || "?")}</strong>
        <span class="settings-hint">@${escapeHtml(t.handle || "?")} · ${escapeHtml(t.name || "")}</span>
      </div>`).join("");
    el.querySelectorAll(".support-ticket-row").forEach(row => {
      row.addEventListener("click", async () => {
        const uid = row.dataset.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, "users", uid));
        const profile = snap.exists() ? { uid, ...snap.data() } : { uid, name: "User", handle: "user" };
        const ticketId = row.dataset.ticket;
        openChat(uid, {
          ...profile,
          uid,
          isSupportChat: true,
          supportTitle: row.dataset.title || "Report/bug",
          chatKey: ticketId ? ("support_" + ticketId) : undefined,
          ticketId
        });
        switchPage("messages");
      });
    });
  } catch (e) {
    el.innerHTML = `<div class="settings-hint">${escapeHtml(e.message || String(e))}</div>`;
  }
}

// ===== Legal (Privacy / Terms / Community) =====
const LEGAL = {
  privacy: `
    <p class="legal-note"><strong>Hinweis:</strong> Dies ist eine verständliche Vorlage für V.com (privat / Test). Keine Rechtsberatung. Bei öffentlichem Betrieb in DE/EU: Anwalt prüfen, Impressum ergänzen, Firebase/Verarbeitungsverzeichnis dokumentieren.</p>
    <h2>Datenschutzerklärung / Privacy Policy</h2>
    <p><strong>Stand:</strong> August 2026 · Betreiber: Betreiber von V.com (@vida)</p>
    <h3>1. Verantwortlicher</h3>
    <p>Verantwortlich für die Datenverarbeitung auf dieser Web-App ist der Betreiber von V.com. Kontakt über die auf der Plattform angegebene Betreiber-E-Mail / DM an @vida.</p>
    <h3>2. Welche Daten wir verarbeiten</h3>
    <ul>
      <li><strong>Account:</strong> E-Mail, Passwort (bei Firebase Auth gehasht), Anzeigename, Benutzername (Handle)</li>
      <li><strong>Profil:</strong> Bio, Profilbild, Banner, Sprache, Profil-Privatsphäre, Follows</li>
      <li><strong>Inhalte:</strong> Posts, Kommentare, Likes, Medien (Bilder/Videos), Hashtags</li>
      <li><strong>Nachrichten:</strong> DM-Texte und Bilder zwischen Nutzern, Bestell-Chats im Shop</li>
      <li><strong>Shop:</strong> Produkte, Warenkorb-Anfragen, Bestellmetadaten (kein automatischer Zahlungsabwicklungsspeicher außer dem, was du im Chat teilst)</li>
      <li><strong>Moderation:</strong> Rollen (Owner/Mod), Verify, Ban, Timeout</li>
      <li><strong>Technik:</strong> Geräte-/Browserdaten, die Firebase für Login und Sicherheit benötigt; Session, damit du eingeloggt bleibst</li>
    </ul>
    <h3>3. Zwecke & Rechtsgrundlagen (DSGVO)</h3>
    <ul>
      <li>Vertrag / Nutzungsverhältnis (Art. 6 Abs. 1 lit. b) – Account, Feed, DMs, Shop-Anfragen</li>
      <li>Berechtigte Interessen (Art. 6 Abs. 1 lit. f) – Sicherheit, Missbrauch verhindern, Moderation</li>
      <li>Einwilligung (Art. 6 Abs. 1 lit. a) – wo ausdrücklich eingeholt (z. B. optionale Marketing-Mails – derzeit nicht vorgesehen)</li>
    </ul>
    <h3>4. Hosting & Auftragsverarbeitung</h3>
    <p>Technik läuft über <strong>Google Firebase</strong> (Authentication, Firestore u. a.) und Hosting (z. B. GitHub Pages). Daten können in Rechenzentren außerhalb der EU verarbeitet werden; Google nutzt Standardvertragsklauseln / geeignete Garantien. Details: Firebase/Google Privacy.</p>
    <h3>5. Speicherdauer</h3>
    <p>Account- und Inhaltsdaten bleiben, solange der Account besteht bzw. bis du Inhalte löschst. Moderationsdaten solange zur Durchsetzung der Regeln nötig. Nach Account-Löschung bemühen wir uns um Löschung bzw. Anonymisierung, soweit technisch und rechtlich möglich.</p>
    <h3>6. Deine Rechte</h3>
    <p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch (Art. 15–21 DSGVO). Beschwerde bei einer Aufsichtsbehörde. Kontakt: Betreiber / @vida.</p>
    <h3>7. Cookies & lokale Speicherung</h3>
    <p><strong>Kein Cookie-Banner nötig</strong> für rein technisch notwendige Speicherung (Firebase Auth Session, damit Login bestehen bleibt). Wir setzen derzeit keine Werbe- oder Analyse-Cookies Dritter. Wenn später Tracking/Ads kommen, wird ein Banner nachgezogen.</p>
    <h3>8. Minderjährige</h3>
    <p>Die Plattform richtet sich nicht an Kinder unter 16. Eltern/Erziehungsberechtigte sollen die Nutzung beaufsichtigen.</p>
    <h3>9. Sicherheit</h3>
    <p>HTTPS, Firebase Auth, serverseitige Regeln soweit konfiguriert. Absolute Sicherheit gibt es nicht – bitte starke Passwörter nutzen und keine sensiblen Daten unnötig posten.</p>
  `,
  terms: `
    <p class="legal-note"><strong>Note:</strong> Short terms for a social + shop demo. For a real business in Germany you may also need an Impressum (§ 5 TMG / DDG) and consumer info for distance selling.</p>
    <h2>Nutzungsbedingungen / Terms of Use</h2>
    <p><strong>Effective:</strong> August 2026</p>
    <h3>1. Service</h3>
    <p>V.com is a social platform with profiles, posts, DMs and a shop area operated by the site owner (@vida). Features can change or stop without notice (especially in beta/test mode).</p>
    <h3>2. Account</h3>
    <ul>
      <li>You must provide a real email and keep access secure.</li>
      <li>One person should not create masses of fake accounts to manipulate likes or harassment.</li>
      <li>Username is chosen at registration and may be locked from later changes.</li>
    </ul>
    <h3>3. Your content</h3>
    <p>You keep rights to your posts. By uploading you grant V.com a license to host and display them on the service. You must have the rights to images/videos you upload.</p>
    <h3>4. Shop / resale</h3>
    <p>Shop products may include an external <strong>buy link</strong> set by the seller. V.com does not process payments. Complete purchases on the linked site. Shipping and disputes are between you and the seller; the owner moderates abuse on V.com.</p>
    <h3>5. Moderation</h3>
    <p>Owner and assigned mods may verify, timeout, ban, or remove content/accounts that break the rules. Order chats may be closed by the owner.</p>
    <h3>6. Availability & liability</h3>
    <p>Service is provided “as is”. No guarantee of uninterrupted uptime or data survival. To the extent allowed by law, liability for free/test use is limited; mandatory consumer rights remain unaffected.</p>
    <h3>7. Termination</h3>
    <p>You may stop using the service anytime. We may suspend accounts that violate these terms or the law.</p>
  `,
  community: `
    <h2>Community Rules / Regeln</h2>
    <p>Damit V.com nutzbar bleibt – Verstöße können Timeout, Ban oder Löschung bedeuten.</p>
    <h3>Verboten</h3>
    <ul>
      <li>Illegale Inhalte (Drogenhandel, Betrug, Waffen wo verboten, etc.)</li>
      <li>Gewalt, Drohungen, Belästigung, Stalking</li>
      <li>Hassrede, Diskriminierung, Extremismus</li>
      <li>Sexuelle Inhalte mit Minderjährigen – null Toleranz</li>
      <li>Nicht-einvernehmliche Intimfotos / Doxxing</li>
      <li>Spam, Scam, Phishing, Malware</li>
      <li>Manipulation durch Fake-Accounts (Self-Likes etc.)</li>
      <li>Urheberrechtsverletzungen in großem Stil</li>
    </ul>
    <h3>Umgang</h3>
    <ul>
      <li>Respekt in Posts und DMs</li>
      <li>Keine Werbung/Spam ohne Absprache mit dem Owner</li>
      <li>Shop: ehrliche Beschreibungen, kein Betrug</li>
    </ul>
    <h3>Mods & Owner</h3>
    <p>Owner (@vida) und Mods dürfen Inhalte und Accounts moderieren. Entscheidungen dienen der Sicherheit der Community. Bei Fragen: DM an @vida.</p>
    <h3>Meldung</h3>
    <p>Problematische Inhalte dem Owner/Mod melden. Bei akuter Gefahr: lokale Notfallnummern / Polizei.</p>
  `
};

function openLegal(section = "privacy") {
  const modal = document.getElementById("legalModal");
  const body = document.getElementById("legalBody");
  if (!modal || !body) {
    console.error("legal modal missing");
    alert("Legal text could not open. Please re-upload index.html.");
    return;
  }
  const key = LEGAL[section] ? section : "privacy";
  body.innerHTML = LEGAL[key];
  body.scrollTop = 0;
  document.querySelectorAll(".legal-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.legalTab === key);
  });
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  modal.style.zIndex = "10050";
}

function closeLegal() {
  const modal = document.getElementById("legalModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "";
}

// Event delegation — works even if nodes re-render
document.addEventListener("click", (e) => {
  const link = e.target.closest(".legal-link, [data-legal]");
  if (link && (link.classList.contains("legal-link") || link.dataset.legal)) {
    // don't steal tab clicks that only have data-legal-tab
    if (link.classList.contains("legal-tab")) return;
    const section = link.dataset.legal;
    if (!section) return;
    e.preventDefault();
    e.stopPropagation();
    openLegal(section);
    return;
  }
  const tab = e.target.closest(".legal-tab");
  if (tab && tab.dataset.legalTab) {
    e.preventDefault();
    openLegal(tab.dataset.legalTab);
    return;
  }
  if (e.target.closest("#legalClose")) {
    e.preventDefault();
    closeLegal();
    return;
  }
  if (e.target.id === "legalModal") {
    closeLegal();
  }
});

window.openLegal = openLegal;
