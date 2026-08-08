import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

let currentUser = null;
let isRegisterMode = false;
let allPosts = [];
let selectedMedia = []; // {type, dataUrl, name}

// Elements
const splash = document.getElementById("splash");
const authModal = document.getElementById("authModal");
const appEl = document.getElementById("app");
const sideMenu = document.getElementById("sideMenu");
const sideMenuOverlay = document.getElementById("sideMenuOverlay");

// Splash: show V logo for 1 second
setTimeout(() => {
  splash.classList.add("hide");
  setTimeout(() => splash.classList.add("hidden"), 300);
}, 1000);

// Auth
const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authName = document.getElementById("authName");
const authSubmit = document.getElementById("authSubmit");
const authSwitch = document.getElementById("authSwitch");
const authError = document.getElementById("authError");

authSwitch.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  authTitle.textContent = isRegisterMode ? "Bei V registrieren" : "Bei V anmelden";
  authSubmit.textContent = isRegisterMode ? "Registrieren" : "Anmelden";
  authSwitch.textContent = isRegisterMode ? "Schon ein Konto? Anmelden" : "Noch kein Konto? Registrieren";
  authName.classList.toggle("hidden", !isRegisterMode);
  authError.classList.add("hidden");
});

authSubmit.addEventListener("click", async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  const name = authName.value.trim();
  authError.classList.add("hidden");
  try {
    if (isRegisterMode) {
      if (!name) throw new Error("Bitte Anzeigename eingeben");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        handle: name.toLowerCase().replace(/\s+/g, "").slice(0, 15),
        bio: "",
        createdAt: serverTimestamp()
      });
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
    const profile = userDoc.exists() ? userDoc.data() : { name: user.displayName || "User", handle: "user", bio: "" };
    updateUIProfile(profile);
    await seedDemoPostsIfEmpty();
    loadPosts();
  } else {
    currentUser = null;
    authModal.classList.remove("hidden");
    appEl.classList.add("hidden");
  }
});

function updateUIProfile(profile) {
  const name = profile.name || "User";
  const handle = profile.handle || "user";
  const initial = name.charAt(0).toUpperCase();
  ["sidebarAvatar", "composeAvatar", "profileAvatar", "headerAvatar", "menuAvatar"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initial;
  });
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set("menuName", name);
  set("menuHandle", "@" + handle);
  set("profileDisplayName", name);
  set("profileDisplayHandle", "@" + handle);
  set("profileDisplayBio", profile.bio || "");
  const pn = document.getElementById("profileName");
  const ph = document.getElementById("profileHandle");
  const pb = document.getElementById("profileBio");
  if (pn) pn.value = name;
  if (ph) ph.value = handle;
  if (pb) pb.value = profile.bio || "";
}

// Side menu
document.getElementById("headerAvatar")?.addEventListener("click", () => {
  sideMenu.classList.remove("hidden");
  sideMenuOverlay.classList.remove("hidden");
  requestAnimationFrame(() => sideMenu.classList.add("open"));
});

function closeSideMenu() {
  sideMenu.classList.remove("open");
  setTimeout(() => {
    sideMenu.classList.add("hidden");
    sideMenuOverlay.classList.add("hidden");
  }, 250);
}

sideMenuOverlay?.addEventListener("click", closeSideMenu);

document.querySelectorAll(".side-menu-item").forEach(item => {
  item.addEventListener("click", () => {
    const page = item.dataset.page;
    if (page) switchPage(page);
    closeSideMenu();
  });
});

document.getElementById("menuLogout")?.addEventListener("click", () => {
  signOut(auth);
  closeSideMenu();
});

// Bottom nav + page switch
function switchPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = document.getElementById("page-" + page);
  if (target) target.classList.remove("hidden");
  else if (page === "communities") {
    // placeholder
    document.getElementById("page-explore")?.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (btn) btn.classList.add("active");
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => switchPage(btn.dataset.page));
});

document.querySelectorAll(".tabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    tab.parentElement.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

// Media upload
const mediaInput = document.getElementById("mediaInput");
const mediaPreview = document.getElementById("mediaPreview");

mediaInput?.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  for (const file of files.slice(0, 4)) {
    if (file.size > 2 * 1024 * 1024) {
      alert("Datei zu groß (max 2MB für Demo). Bitte kleineres Bild wählen.");
      continue;
    }
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
  if (selectedMedia.length === 0) {
    mediaPreview.classList.add("hidden");
    mediaPreview.innerHTML = "";
    return;
  }
  mediaPreview.classList.remove("hidden");
  mediaPreview.innerHTML = selectedMedia.map((m, i) => `
    <div class="media-item">
      ${m.type === "video"
        ? `<video src="${m.dataUrl}" muted></video>`
        : `<img src="${m.dataUrl}" alt="" />`}
      <button class="remove-media" data-i="${i}">✕</button>
    </div>
  `).join("");
  mediaPreview.querySelectorAll(".remove-media").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMedia.splice(+btn.dataset.i, 1);
      renderMediaPreview();
    });
  });
}

// Post
document.getElementById("postButton")?.addEventListener("click", createPost);
document.getElementById("fabPost")?.addEventListener("click", () => {
  switchPage("home");
  document.getElementById("postText")?.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

async function createPost() {
  const text = document.getElementById("postText")?.value.trim() || "";
  if ((!text && selectedMedia.length === 0) || !currentUser) return;

  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  const profile = userDoc.exists() ? userDoc.data() : { name: currentUser.displayName, handle: "user" };

  // Store media as dataURLs (demo only – for production use Firebase Storage)
  const media = selectedMedia.map(m => ({ type: m.type, url: m.dataUrl }));

  await addDoc(collection(db, "posts"), {
    text,
    media,
    userId: currentUser.uid,
    name: profile.name,
    handle: profile.handle,
    likes: [],
    reposts: 0,
    replies: 0,
    views: Math.floor(Math.random() * 200) + 5,
    createdAt: serverTimestamp()
  });

  document.getElementById("postText").value = "";
  selectedMedia = [];
  renderMediaPreview();
}

async function seedDemoPostsIfEmpty() {
  const snap = await getDocs(collection(db, "posts"));
  if (!snap.empty) return;
  const demos = [
    { name: "Elon Musk", handle: "elonmusk", text: "V.com is looking interesting. Competition is good for the universe.", likes: ["x"], reposts: 890, replies: 312, views: 42000 },
    { name: "Grok", handle: "grok", text: "Building the future one post at a time.\nWelcome to V.", likes: [], reposts: 320, replies: 145, views: 18900 },
    { name: "xAI", handle: "xai", text: "The universe is the only true open source project.", likes: ["a","b"], reposts: 1200, replies: 450, views: 98000 },
    { name: "V Official", handle: "v", text: "Welcome to V.com 🔥\nThis is only the beginning. Post, connect, explore.", likes: [], reposts: 56, replies: 12, views: 3400 }
  ];
  for (const d of demos) {
    await addDoc(collection(db, "posts"), { ...d, media: [], userId: "demo", createdAt: serverTimestamp() });
  }
}

function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    allPosts = [];
    snapshot.forEach(docSnap => allPosts.push({ id: docSnap.id, ...docSnap.data() }));
    renderPosts(allPosts, "timeline");
    renderPosts(allPosts.filter(p => p.userId === currentUser?.uid), "profileTimeline");
  });
}

function renderPosts(posts, containerId) {
  const timeline = document.getElementById(containerId);
  if (!timeline) return;
  timeline.innerHTML = "";

  if (posts.length === 0 && containerId === "timeline") {
    timeline.innerHTML = `<div class="empty-state"><h3>Welcome to V!</h3><p>This is your home feed. Write something above or use the blue button.</p></div>`;
    return;
  }

  posts.forEach(post => {
    const liked = post.likes && currentUser && post.likes.includes(currentUser.uid);
    const time = post.createdAt?.toDate ? timeAgo(post.createdAt.toDate()) : "now";
    const likeCount = post.likes ? post.likes.length : 0;
    const mediaHtml = (post.media || []).map(m =>
      m.type === "video"
        ? `<div class="post-media"><video src="${m.url}" controls playsinline></video></div>`
        : `<div class="post-media"><img src="${m.url}" alt="" loading="lazy" /></div>`
    ).join("");

    const el = document.createElement("div");
    el.className = "post";
    el.innerHTML = `
      <div class="avatar">${(post.name || "U").charAt(0)}</div>
      <div class="post-content">
        <div class="post-header">
          <strong>${escapeHtml(post.name || "User")}</strong>
          <span>@${escapeHtml(post.handle || "user")}</span>
          <span>·</span>
          <span>${time}</span>
        </div>
        <div class="post-text">${escapeHtml(post.text || "")}</div>
        ${mediaHtml}
        <div class="post-actions">
          <button class="action-btn"><span>💬</span> <span>${post.replies || 0}</span></button>
          <button class="action-btn"><span>🔁</span> <span>${post.reposts || 0}</span></button>
          <button class="action-btn ${liked ? "liked" : ""}" data-action="like" data-id="${post.id}">
            <span>${liked ? "❤️" : "🤍"}</span> <span>${likeCount}</span>
          </button>
          <button class="action-btn"><span>📊</span> <span>${formatNumber(post.views || 0)}</span></button>
          <button class="action-btn"><span>📤</span></button>
        </div>
      </div>
    `;
    timeline.appendChild(el);
  });

  timeline.querySelectorAll('[data-action="like"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const post = allPosts.find(p => p.id === id);
      if (!post || !currentUser) return;
      const likes = [...(post.likes || [])];
      const idx = likes.indexOf(currentUser.uid);
      if (idx > -1) likes.splice(idx, 1);
      else likes.push(currentUser.uid);
      await updateDoc(doc(db, "posts", id), { likes });
    });
  });
}

document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allPosts.filter(p =>
    (p.text || "").toLowerCase().includes(term) ||
    (p.name || "").toLowerCase().includes(term) ||
    (p.handle || "").toLowerCase().includes(term)
  );
  renderPosts(filtered, "searchResults");
});

document.getElementById("editProfileBtn")?.addEventListener("click", () => {
  document.getElementById("profileEditForm")?.classList.toggle("hidden");
});

document.getElementById("saveProfile")?.addEventListener("click", async () => {
  if (!currentUser) return;
  const name = document.getElementById("profileName").value.trim();
  const handle = document.getElementById("profileHandle").value.trim().replace("@", "");
  const bio = document.getElementById("profileBio").value.trim();
  await setDoc(doc(db, "users", currentUser.uid), { name, handle, bio }, { merge: true });
  await updateProfile(currentUser, { displayName: name });
  updateUIProfile({ name, handle, bio });
  document.getElementById("profileEditForm").classList.add("hidden");
});

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
