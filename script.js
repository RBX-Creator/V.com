import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc, serverTimestamp, getDocs, where, increment, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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
let selectedMedia = [];
let viewedPosts = new Set(); // session: only count view once per post
let openReplyId = null; // which post has reply box open
let repliesCache = {}; // postId -> replies[]

const splash = document.getElementById("splash");
const authModal = document.getElementById("authModal");
const appEl = document.getElementById("app");
const sideMenu = document.getElementById("sideMenu");
const sideMenuOverlay = document.getElementById("sideMenuOverlay");

setTimeout(() => {
  splash.classList.add("hide");
  setTimeout(() => splash.classList.add("hidden"), 300);
}, 1000);

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
  ["composeAvatar", "profileAvatar", "headerAvatar", "menuAvatar"].forEach(id => {
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

function switchPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = document.getElementById("page-" + page);
  if (target) target.classList.remove("hidden");
  else if (page === "communities") document.getElementById("page-explore")?.classList.remove("hidden");
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

// Media
const mediaInput = document.getElementById("mediaInput");
const mediaPreview = document.getElementById("mediaPreview");

mediaInput?.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  for (const file of files.slice(0, 4)) {
    if (file.size > 2 * 1024 * 1024) {
      alert("Datei zu groß (max 2MB).");
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
      ${m.type === "video" ? `<video src="${m.dataUrl}" muted></video>` : `<img src="${m.dataUrl}" alt="" />`}
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

// Create post
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
  const media = selectedMedia.map(m => ({ type: m.type, url: m.dataUrl }));
  await addDoc(collection(db, "posts"), {
    text,
    media,
    userId: currentUser.uid,
    name: profile.name,
    handle: profile.handle,
    likes: [],
    repostedBy: [],
    repliesCount: 0,
    views: 0,
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
    { name: "Elon Musk", handle: "elonmusk", text: "V.com is looking interesting. Competition is good for the universe.", likes: [], repostedBy: [], repliesCount: 0, views: 0 },
    { name: "Grok", handle: "grok", text: "Building the future one post at a time.\nWelcome to V.", likes: [], repostedBy: [], repliesCount: 0, views: 0 },
    { name: "xAI", handle: "xai", text: "The universe is the only true open source project.", likes: [], repostedBy: [], repliesCount: 0, views: 0 },
    { name: "V Official", handle: "v", text: "Welcome to V.com 🔥\nThis is only the beginning. Post, connect, explore.", likes: [], repostedBy: [], repliesCount: 0, views: 0 }
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

async function countView(postId) {
  if (!postId || viewedPosts.has(postId)) return;
  viewedPosts.add(postId);
  try {
    await updateDoc(doc(db, "posts", postId), { views: increment(1) });
  } catch (e) { /* ignore */ }
}

async function loadReplies(postId) {
  if (repliesCache[postId]) return repliesCache[postId];
  const q = query(collection(db, "replies"), where("postId", "==", postId), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  repliesCache[postId] = list;
  return list;
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
    countView(post.id); // real view count

    const liked = post.likes && currentUser && post.likes.includes(currentUser.uid);
    const reposted = post.repostedBy && currentUser && post.repostedBy.includes(currentUser.uid);
    const time = post.createdAt?.toDate ? timeAgo(post.createdAt.toDate()) : "now";
    const likeCount = post.likes ? post.likes.length : 0;
    const repostCount = post.repostedBy ? post.repostedBy.length : (post.reposts || 0);
    const replyCount = post.repliesCount || post.replies || 0;

    const mediaHtml = (post.media || []).map(m =>
      m.type === "video"
        ? `<div class="post-media"><video src="${m.url}" controls playsinline></video></div>`
        : `<div class="post-media"><img src="${m.url}" alt="" loading="lazy" /></div>`
    ).join("");

    const el = document.createElement("div");
    el.className = "post";
    el.dataset.id = post.id;
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
          <button class="action-btn" data-action="reply" data-id="${post.id}">
            <span>💬</span> <span class="count">${replyCount}</span>
          </button>
          <button class="action-btn ${reposted ? "reposted" : ""}" data-action="repost" data-id="${post.id}">
            <span>🔁</span> <span class="count">${repostCount}</span>
          </button>
          <button class="action-btn ${liked ? "liked" : ""}" data-action="like" data-id="${post.id}">
            <span>${liked ? "❤️" : "🤍"}</span> <span class="count">${likeCount}</span>
          </button>
          <button class="action-btn" data-action="views">
            <span>📊</span> <span class="count">${formatNumber(post.views || 0)}</span>
          </button>
          <button class="action-btn" data-action="share"><span>📤</span></button>
        </div>
        <div class="replies-section ${openReplyId === post.id ? "" : "hidden"}" data-replies-for="${post.id}">
          <div class="replies-list" id="replies-${post.id}"></div>
          <div class="reply-compose">
            <input type="text" class="reply-input" placeholder="Post your reply" data-reply-to="${post.id}" />
            <button class="reply-send post-btn-small" data-reply-to="${post.id}">Reply</button>
          </div>
        </div>
      </div>
    `;
    timeline.appendChild(el);

    if (openReplyId === post.id) {
      loadAndShowReplies(post.id);
    }
  });

  // Event handlers
  timeline.querySelectorAll('[data-action="like"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!currentUser) return;
      const id = btn.dataset.id;
      const post = allPosts.find(p => p.id === id);
      if (!post) return;
      const likes = [...(post.likes || [])];
      const idx = likes.indexOf(currentUser.uid);
      if (idx > -1) {
        await updateDoc(doc(db, "posts", id), { likes: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(doc(db, "posts", id), { likes: arrayUnion(currentUser.uid) });
      }
    });
  });

  timeline.querySelectorAll('[data-action="repost"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!currentUser) return;
      const id = btn.dataset.id;
      const post = allPosts.find(p => p.id === id);
      if (!post) return;
      const list = post.repostedBy || [];
      if (list.includes(currentUser.uid)) {
        await updateDoc(doc(db, "posts", id), { repostedBy: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(doc(db, "posts", id), { repostedBy: arrayUnion(currentUser.uid) });
      }
    });
  });

  timeline.querySelectorAll('[data-action="reply"]').forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      openReplyId = openReplyId === id ? null : id;
      // re-render to show/hide boxes
      renderPosts(allPosts, "timeline");
      if (containerId === "profileTimeline") {
        renderPosts(allPosts.filter(p => p.userId === currentUser?.uid), "profileTimeline");
      }
    });
  });

  timeline.querySelectorAll(".reply-send").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const postId = btn.dataset.replyTo;
      const input = timeline.querySelector(`.reply-input[data-reply-to="${postId}"]`);
      const text = input?.value.trim();
      if (!text || !currentUser) return;

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const profile = userDoc.exists() ? userDoc.data() : { name: currentUser.displayName, handle: "user" };

      await addDoc(collection(db, "replies"), {
        postId,
        text,
        userId: currentUser.uid,
        name: profile.name,
        handle: profile.handle,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "posts", postId), { repliesCount: increment(1) });
      delete repliesCache[postId];
      input.value = "";
      await loadAndShowReplies(postId);
    });
  });

  timeline.querySelectorAll(".reply-input").forEach(input => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const postId = input.dataset.replyTo;
        timeline.querySelector(`.reply-send[data-reply-to="${postId}"]`)?.click();
      }
    });
  });
}

async function loadAndShowReplies(postId) {
  const container = document.getElementById("replies-" + postId);
  if (!container) return;
  container.innerHTML = `<div class="reply-loading">Loading...</div>`;
  const replies = await loadReplies(postId);
  if (replies.length === 0) {
    container.innerHTML = `<div class="no-replies">No replies yet. Be the first!</div>`;
    return;
  }
  container.innerHTML = replies.map(r => {
    const t = r.createdAt?.toDate ? timeAgo(r.createdAt.toDate()) : "";
    return `
      <div class="reply-item">
        <div class="avatar tiny">${(r.name || "U").charAt(0)}</div>
        <div class="reply-body">
          <div class="post-header">
            <strong>${escapeHtml(r.name || "User")}</strong>
            <span>@${escapeHtml(r.handle || "user")}</span>
            <span>·</span>
            <span>${t}</span>
          </div>
          <div class="post-text">${escapeHtml(r.text || "")}</div>
        </div>
      </div>
    `;
  }).join("");
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
