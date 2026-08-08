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
  if (profile.role === "owner") return "owner";
  if ((profile.handle || "").toLowerCase() === "vida") return "owner";
  if (profile.role === "mod") return "mod";
  return "user";
}
function isOwnerProfile(profile) {
  return getRole(profile) === "owner";
}
function isStaff() {
  const r = getRole(currentProfile);
  return r === "owner" || r === "mod";
}
function isOwner() {
  return getRole(currentProfile) === "owner";
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
    return `<span class="verified-badge" title="Verified">✓</span>`;
  }
  return "";
}
function updateAdminNav() {
  const btn = document.getElementById("adminNavBtn");
  const icon = document.getElementById("adminNavIcon");
  if (!btn) return;
  if (isOwner()) {
    btn.classList.remove("hidden");
    if (icon) icon.textContent = "👑";
  } else if (getRole(currentProfile) === "mod") {
    btn.classList.remove("hidden");
    if (icon) icon.textContent = "🛡️";
  } else {
    btn.classList.add("hidden");
  }
}


const splash = document.getElementById("splash");
const authModal = document.getElementById("authModal");
const appEl = document.getElementById("app");
const sideMenu = document.getElementById("sideMenu");
const sideMenuOverlay = document.getElementById("sideMenuOverlay");

setTimeout(() => {
  splash.classList.add("hide");
  setTimeout(() => splash.classList.add("hidden"), 300);
}, 1000);

applyI18n();

const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authName = document.getElementById("authName");
const authSubmit = document.getElementById("authSubmit");
const authSwitch = document.getElementById("authSwitch");
const authError = document.getElementById("authError");

authSwitch.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  authName.classList.toggle("hidden", !isRegisterMode);
  authError.classList.add("hidden");
  applyI18n();
});

authSubmit.addEventListener("click", async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  const name = authName.value.trim();
  authError.classList.add("hidden");
  try {
    if (isRegisterMode) {
      if (!name) throw new Error(t("need_name"));
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
      await sendEmailVerification(cred.user);
      alert(t("verify_email"));
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    authError.textContent = err.message;
    authError.classList.remove("hidden");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    authModal.classList.add("hidden");
    appEl.classList.remove("hidden");
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
  } else {
    currentUser = null;
    currentProfile = null;
    lang = "en";
    applyI18n();
    authModal.classList.remove("hidden");
    appEl.classList.add("hidden");
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
document.getElementById("menuLogout")?.addEventListener("click", () => { signOut(auth); closeSideMenu(); });

function switchPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = document.getElementById("page-" + page);
  if (target) target.classList.remove("hidden");
  else if (page === "communities") document.getElementById("page-explore")?.classList.remove("hidden");
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
}

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

function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    allPosts = [];
    snapshot.forEach(d => allPosts.push({ id: d.id, ...d.data() }));
    // home feed: only public posts
    renderPosts(allPosts.filter(p => (p.scope || "public") === "public"), "timeline");
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
          <button data-action="delete" data-id="${post.id}" class="danger">🗑️ ${t("delete_post")}</button>
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
          <button class="action-btn" data-action="reply" data-id="${post.id}"><span>💬</span> <span class="count">${replyCount}</span></button>
          <button class="action-btn ${reposted ? "reposted" : ""}" data-action="repost" data-id="${post.id}"><span>🔁</span> <span class="count">${repostCount}</span></button>
          <button class="action-btn ${liked ? "liked" : ""}" data-action="like" data-id="${post.id}"><span>${liked ? "❤️" : "🤍"}</span> <span class="count">${likeCount}</span></button>
          <button class="action-btn" data-action="views"><span>📊</span> <span class="count">${formatNumber(post.views || 0)}</span></button>
          <button class="action-btn" data-action="share"><span>📤</span></button>
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
      if ((post.likes || []).includes(currentUser.uid)) {
        await updateDoc(doc(db, "posts", id), { likes: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(doc(db, "posts", id), { likes: arrayUnion(currentUser.uid) });
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
      if ((post.repostedBy || []).includes(currentUser.uid)) {
        await updateDoc(doc(db, "posts", id), { repostedBy: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(doc(db, "posts", id), { repostedBy: arrayUnion(currentUser.uid) });
      }
    });
  });

  timeline.querySelectorAll('[data-action="reply"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      openReplyId = openReplyId === id ? null : id;
      renderPosts(allPosts.filter(p => (p.scope || "public") === "public"), "timeline");
      if (viewingUserId) refreshProfileTimeline();
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

document.getElementById("editProfileBtn")?.addEventListener("click", () => {
  document.getElementById("profileEditForm")?.classList.toggle("hidden");
  pendingAvatar = null;
  pendingBanner = null;
  document.getElementById("avatarPreview").innerHTML = "";
  document.getElementById("bannerPreview").innerHTML = "";
});

document.getElementById("avatarInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) { alert("Max 1.5MB"); return; }
  pendingAvatar = await readFileAsDataURL(file);
  document.getElementById("avatarPreview").innerHTML = `<img src="${pendingAvatar}" alt="" />`;
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

async function loadDmList() {
  const listEl = document.getElementById("dmList");
  const chatEl = document.getElementById("dmChat");
  const listView = document.getElementById("dmListView");
  if (listView) listView.classList.remove("hidden");
  if (listEl) listEl.classList.remove("hidden");
  if (chatEl) chatEl.classList.add("hidden");
  if (dmUnsub) { dmUnsub(); dmUnsub = null; }

  const following = currentProfile?.following || [];
  dmMutuals = [];
  for (const uid of following) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) continue;
    const p = snap.data();
    if ((p.following || []).includes(currentUser.uid)) {
      dmMutuals.push({ uid, ...p });
    }
  }
  renderDmContactList(document.getElementById("dmSearch")?.value || "");
}

function renderDmContactList(filter = "") {
  const listEl = document.getElementById("dmList");
  if (!listEl) return;
  const q = (filter || "").toLowerCase().trim().replace(/^@/, "");
  const filtered = !q ? dmMutuals : dmMutuals.filter(u =>
    (u.name || "").toLowerCase().includes(q) ||
    (u.handle || "").toLowerCase().includes(q)
  );
  if (!dmMutuals.length) {
    listEl.innerHTML = `<div class="dm-empty"><h3>${t("no_chats")}</h3><p>${t("mutual_needed")}</p></div>`;
    return;
  }
  if (!filtered.length) {
    listEl.innerHTML = `<div class="dm-empty"><p>No chats match your search.</p></div>`;
    return;
  }
  listEl.innerHTML = filtered.map(u => `
    <div class="dm-item" data-uid="${u.uid}">
      ${avatarHtml(u.name, u.avatarUrl)}
      <div class="dm-item-info">
        <strong>${escapeHtml(u.name || "User")}</strong>
        <span>@${escapeHtml(u.handle || "user")}</span>
      </div>
    </div>`).join("");
  listEl.querySelectorAll(".dm-item").forEach(item => {
    item.addEventListener("click", () => {
      const u = dmMutuals.find(m => m.uid === item.dataset.uid);
      if (u) openChat(u.uid, u);
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
  document.getElementById("dmChatName").textContent = partnerProfile.name || "User";

  if (dmUnsub) { dmUnsub(); dmUnsub = null; }
  const key = chatKey(currentUser.uid, partnerUid);
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
    renderDmMessages(msgs);
  });
}

function renderDmMessages(msgs) {
  const box = document.getElementById("dmMessages");
  box.innerHTML = msgs.map(m => {
    const me = m.from === currentUser.uid;
    return `<div class="dm-bubble ${me ? "me" : "them"}">${escapeHtml(m.text || "")}</div>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

document.getElementById("dmBack")?.addEventListener("click", () => {
  if (dmUnsub) { dmUnsub(); dmUnsub = null; }
  activeChatPartner = null;
  document.getElementById("dmListView")?.classList.remove("hidden");
  loadDmList();
});

document.getElementById("dmSend")?.addEventListener("click", sendDm);
document.getElementById("dmInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendDm();
});

async function sendDm() {
  if (!activeChatPartner || !currentUser || !requireVerified()) return;
  const input = document.getElementById("dmInput");
  const text = input.value.trim();
  if (!text) return;
  const them = await getDoc(doc(db, "users", activeChatPartner.uid));
  const p = them.data() || {};
  const mutual = (currentProfile.following || []).includes(activeChatPartner.uid) && (p.following || []).includes(currentUser.uid);
  if (!mutual) {
    alert(t("only_mutual_dm"));
    return;
  }
  await addDoc(collection(db, "dms"), {
    chatKey: chatKey(currentUser.uid, activeChatPartner.uid),
    from: currentUser.uid,
    to: activeChatPartner.uid,
    text,
    createdAt: serverTimestamp()
  });
  input.value = "";
}

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
