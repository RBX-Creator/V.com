import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

// Auth UI
const authModal = document.getElementById("authModal");
const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authName = document.getElementById("authName");
const authSubmit = document.getElementById("authSubmit");
const authSwitch = document.getElementById("authSwitch");
const authError = document.getElementById("authError");
const appEl = document.getElementById("app");

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
        name: name,
        handle: name.toLowerCase().replace(/\s+/g, ""),
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

    // Load user profile
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const profile = userDoc.exists() ? userDoc.data() : { name: user.displayName || "User", handle: "user", bio: "" };

    document.getElementById("sidebarName").textContent = profile.name;
    document.getElementById("sidebarHandle").textContent = "@" + profile.handle;
    document.getElementById("sidebarAvatar").textContent = profile.name.charAt(0).toUpperCase();
    document.getElementById("composeAvatar").textContent = profile.name.charAt(0).toUpperCase();

    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileHandle").value = profile.handle || "";
    document.getElementById("profileBio").value = profile.bio || "";

    loadPosts();
  } else {
    currentUser = null;
    authModal.classList.remove("hidden");
    appEl.classList.add("hidden");
  }
});

// Navigation
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    document.getElementById("page-home").classList.add("hidden");
    document.getElementById("page-explore").classList.add("hidden");
    document.getElementById("page-profile").classList.add("hidden");

    const page = item.dataset.page;
    document.getElementById("page-" + page).classList.remove("hidden");
  });
});

// Post
document.getElementById("postButton").addEventListener("click", async () => {
  const text = document.getElementById("postText").value.trim();
  if (!text || !currentUser) return;

  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  const profile = userDoc.exists() ? userDoc.data() : { name: currentUser.displayName, handle: "user" };

  await addDoc(collection(db, "posts"), {
    text,
    userId: currentUser.uid,
    name: profile.name,
    handle: profile.handle,
    likes: [],
    createdAt: serverTimestamp()
  });

  document.getElementById("postText").value = "";
});

// Load posts
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    allPosts = [];
    snapshot.forEach(docSnap => {
      allPosts.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderPosts(allPosts);
  });
}

function renderPosts(posts) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  posts.forEach(post => {
    const liked = post.likes && post.likes.includes(currentUser?.uid);
    const time = post.createdAt?.toDate ? timeAgo(post.createdAt.toDate()) : "now";

    const el = document.createElement("div");
    el.className = "post";
    el.innerHTML = `
      <div class="avatar">${(post.name || "U").charAt(0)}</div>
      <div class="post-content">
        <div class="post-header">
          <strong>${post.name || "User"}</strong>
          <span>@${post.handle || "user"}</span>
          <span>·</span>
          <span>${time}</span>
        </div>
        <div class="post-text">${escapeHtml(post.text)}</div>
        <div class="post-actions">
          <button class="action-btn ${liked ? "liked" : ""}" data-id="${post.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z"/></svg>
            <span>${post.likes ? post.likes.length : 0}</span>
          </button>
        </div>
      </div>
    `;
    timeline.appendChild(el);
  });

  // Like handlers
  document.querySelectorAll("[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const post = allPosts.find(p => p.id === id);
      if (!post || !currentUser) return;

      const likes = post.likes || [];
      const idx = likes.indexOf(currentUser.uid);
      if (idx > -1) likes.splice(idx, 1);
      else likes.push(currentUser.uid);

      await updateDoc(doc(db, "posts", id), { likes });
    });
  });
}

// Search
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allPosts.filter(p => 
    (p.text || "").toLowerCase().includes(term) ||
    (p.name || "").toLowerCase().includes(term) ||
    (p.handle || "").toLowerCase().includes(term)
  );
  const container = document.getElementById("searchResults");
  container.innerHTML = "";
  // Reuse render logic roughly
  filtered.forEach(post => {
    const el = document.createElement("div");
    el.className = "post";
    el.innerHTML = `
      <div class="avatar">${(post.name || "U").charAt(0)}</div>
      <div class="post-content">
        <div class="post-header">
          <strong>${post.name}</strong>
          <span>@${post.handle}</span>
        </div>
        <div class="post-text">${escapeHtml(post.text)}</div>
      </div>
    `;
    container.appendChild(el);
  });
});

// Profile save
document.getElementById("saveProfile").addEventListener("click", async () => {
  if (!currentUser) return;
  const name = document.getElementById("profileName").value.trim();
  const handle = document.getElementById("profileHandle").value.trim().replace("@", "");
  const bio = document.getElementById("profileBio").value.trim();

  await setDoc(doc(db, "users", currentUser.uid), { name, handle, bio }, { merge: true });
  await updateProfile(currentUser, { displayName: name });

  document.getElementById("sidebarName").textContent = name;
  document.getElementById("sidebarHandle").textContent = "@" + handle;
  document.getElementById("sidebarAvatar").textContent = name.charAt(0).toUpperCase();
  alert("Profil gespeichert!");
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h";
  return Math.floor(seconds / 86400) + "d";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
