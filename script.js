import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
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
let currentProfile = null; // my profile data
let viewingUserId = null; // profile being viewed
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

function requireVerified() {
  if (!currentUser) return false;
  if (!currentUser.emailVerified) {
    alert("Bitte bestätige zuerst deine E-Mail-Adresse.\n\nSchau in dein Postfach (auch Spam) und klicke auf den Link.\n\nDanach Seite neu laden.");
    return false;
  }
  return true;
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
        following: [],
        followers: [],
        avatarUrl: "",
        bannerUrl: "",
        createdAt: serverTimestamp()
      });
      await sendEmailVerification(cred.user);
      alert("Bestätigungs-E-Mail wurde gesendet. Bitte Postfach prüfen.");
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
    currentProfile = userDoc.exists() ? userDoc.data() : { name: user.displayName || "User", handle: "user", bio: "", following: [], followers: [] };
    // ensure arrays exist
    if (!currentProfile.following) currentProfile.following = [];
    if (!currentProfile.followers) currentProfile.followers = [];
    updateUIProfile(currentProfile);
    viewingUserId = user.uid;
    loadPosts();
    showVerifyBanner(user);
  } else {
    currentUser = null;
    currentProfile = null;
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
      ban.innerHTML = 'Bitte E-Mail bestätigen. <button id="resendVerify" style="margin-left:8px;background:#fff;color:#1d9bf0;border:none;border-radius:9999px;padding:4px 12px;font-weight:700;cursor:pointer;">Erneut senden</button>';
      const header = document.querySelector(".top-header");
      if (header && header.parentNode) header.parentNode.insertBefore(ban, header.nextSibling);
      document.getElementById("resendVerify")?.addEventListener("click", async () => {
        try {
          await sendEmailVerification(auth.currentUser);
          alert("E-Mail erneut gesendet.");
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

// Side menu
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

// Media for posts
const mediaInput = document.getElementById("mediaInput");
const mediaPreview = document.getElementById("mediaPreview");
mediaInput?.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  for (const file of files.slice(0, 4)) {
    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB pro Datei"); continue; }
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

async function createPost() {
  const text = document.getElementById("postText")?.value.trim() || "";
  if ((!text && !selectedMedia.length) || !currentUser) return;
  if (!requireVerified()) return;
  const profile = currentProfile || {};
  const media = selectedMedia.map(m => ({ type: m.type, url: m.dataUrl }));
  await addDoc(collection(db, "posts"), {
    text, media,
    userId: currentUser.uid,
    name: profile.name || currentUser.displayName,
    handle: profile.handle || "user",
    avatarUrl: profile.avatarUrl || "",
    likes: [], repostedBy: [], repliesCount: 0, replyList: [], views: 0,
    createdAt: serverTimestamp()
  });
  document.getElementById("postText").value = "";
  selectedMedia = [];
  renderMediaPreview();
}

function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    allPosts = [];
    snapshot.forEach(d => allPosts.push({ id: d.id, ...d.data() }));
    renderPosts(allPosts, "timeline");
    if (viewingUserId) {
      renderPosts(allPosts.filter(p => p.userId === viewingUserId), "profileTimeline");
    }
  });
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
    timeline.innerHTML = `<div class="empty-state"><h3>Welcome to V!</h3><p>Write something above or use the blue button.</p></div>`;
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
    const mediaList = post.media || [];
    let mediaHtml = "";
    if (mediaList.length) {
      const count = Math.min(mediaList.length, 4);
      const items = mediaList.slice(0, 4).map(m =>
        m.type === "video"
          ? `<div class="media-cell"><video src="${m.url}" controls playsinline></video></div>`
          : `<div class="media-cell"><img src="${m.url}" alt="" loading="lazy" /></div>`
      ).join("");
      mediaHtml = `<div class="media-grid count-${count}">${items}</div>`;
    }
    const el = document.createElement("div");
    el.className = "post";
    el.dataset.id = post.id;
    el.innerHTML = `
      <div class="user-link" data-uid="${post.userId || ""}">${avatarHtml(post.name, post.avatarUrl)}</div>
      <div class="post-content">
        <div class="post-header">
          <strong class="user-link" data-uid="${post.userId || ""}">${escapeHtml(post.name || "User")}</strong>
          <span class="user-link" data-uid="${post.userId || ""}">@${escapeHtml(post.handle || "user")}</span>
          <span>·</span><span>${time}</span>
        </div>
        <div class="post-text">${escapeHtml(post.text || "")}</div>
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
            <input type="text" class="reply-input" placeholder="Post your reply" data-reply-to="${post.id}" />
            <button class="reply-send post-btn-small" data-reply-to="${post.id}">Reply</button>
          </div>
        </div>
      </div>`;
    timeline.appendChild(el);
    if (openReplyId === post.id) loadAndShowReplies(post.id);
  });

  timeline.querySelectorAll(".user-link").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const uid = el.dataset.uid;
      if (uid && uid !== "demo") openUserProfile(uid);
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
      renderPosts(allPosts, "timeline");
      if (viewingUserId) renderPosts(allPosts.filter(p => p.userId === viewingUserId), "profileTimeline");
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

async function loadAndShowReplies(postId) {
  const container = document.getElementById("replies-" + postId);
  if (!container) return;
  container.innerHTML = `<div class="reply-loading">Kommentare werden geladen...</div>`;
  const replies = await loadReplies(postId);
  if (!replies.length) {
    container.innerHTML = `<div class="no-replies">Noch keine Kommentare. Sei der Erste!</div>`;
    return;
  }
  container.innerHTML = replies.map(r => {
    let t = "";
    if (r.createdAt?.toDate) t = timeAgo(r.createdAt.toDate());
    else if (typeof r.createdAt === "string") t = timeAgo(new Date(r.createdAt));
    return `<div class="reply-item">
      <div class="avatar tiny">${(r.name || "U").charAt(0)}</div>
      <div class="reply-body">
        <div class="post-header"><strong>${escapeHtml(r.name || "User")}</strong> <span>@${escapeHtml(r.handle || "user")}</span> <span>·</span> <span>${t}</span></div>
        <div class="post-text">${escapeHtml(r.text || "")}</div>
      </div></div>`;
  }).join("");
}

// ===== PROFILE =====
async function openUserProfile(uid) {
  viewingUserId = uid;
  switchPage("profile");
  await renderProfilePage(uid);
}

async function renderProfilePage(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  const profile = snap.exists() ? snap.data() : { name: "User", handle: "user", bio: "", following: [], followers: [] };
  const isMe = currentUser && uid === currentUser.uid;

  document.getElementById("profileDisplayName").textContent = profile.name || "User";
  document.getElementById("profileDisplayHandle").textContent = "@" + (profile.handle || "user");
  document.getElementById("profileDisplayBio").textContent = profile.bio || "";
  document.getElementById("followingCount").textContent = (profile.following || []).length;
  document.getElementById("followersCount").textContent = (profile.followers || []).length;

  setAvatarEl(document.getElementById("profileAvatar"), profile);
  const banner = document.getElementById("profileBanner");
  if (banner) {
    banner.style.backgroundImage = profile.bannerUrl ? `url(${profile.bannerUrl})` : "";
    if (!profile.bannerUrl) banner.style.background = "linear-gradient(135deg, #1d9bf0, #7856ff)";
  }

  const editBtn = document.getElementById("editProfileBtn");
  const followBtn = document.getElementById("followBtn");
  const messageBtn = document.getElementById("messageBtn");
  const editForm = document.getElementById("profileEditForm");

  if (isMe) {
    editBtn.classList.remove("hidden");
    followBtn.classList.add("hidden");
    messageBtn.classList.add("hidden");
    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileHandle").value = profile.handle || "";
    document.getElementById("profileBio").value = profile.bio || "";
  } else {
    editBtn.classList.add("hidden");
    editForm.classList.add("hidden");
    followBtn.classList.remove("hidden");
    const iFollow = (currentProfile?.following || []).includes(uid);
    followBtn.textContent = iFollow ? "Following" : "Follow";
    followBtn.classList.toggle("following", iFollow);
    followBtn.onclick = () => toggleFollow(uid);

    const theyFollowMe = (profile.following || []).includes(currentUser.uid);
    if (iFollow && theyFollowMe) {
      messageBtn.classList.remove("hidden");
      messageBtn.onclick = () => openChat(uid, profile);
    } else {
      messageBtn.classList.add("hidden");
    }
  }

  renderPosts(allPosts.filter(p => p.userId === uid), "profileTimeline");
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

// Edit profile uploads
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
  if (file.size > 1.5 * 1024 * 1024) { alert("Profilbild max 1.5MB"); return; }
  pendingAvatar = await readFileAsDataURL(file);
  document.getElementById("avatarPreview").innerHTML = `<img src="${pendingAvatar}" alt="" />`;
});

document.getElementById("bannerInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) { alert("Banner max 1.5MB"); return; }
  pendingBanner = await readFileAsDataURL(file);
  document.getElementById("bannerPreview").innerHTML = `<img src="${pendingBanner}" alt="" />`;
});

document.getElementById("saveProfile")?.addEventListener("click", async () => {
  if (!currentUser) return;
  const name = document.getElementById("profileName").value.trim();
  const handle = document.getElementById("profileHandle").value.trim().replace("@", "");
  const bio = document.getElementById("profileBio").value.trim();
  const data = { name, handle, bio };
  if (pendingAvatar) data.avatarUrl = pendingAvatar;
  if (pendingBanner) data.bannerUrl = pendingBanner;
  await setDoc(doc(db, "users", currentUser.uid), data, { merge: true });
  await updateProfile(currentUser, { displayName: name });
  const snap = await getDoc(doc(db, "users", currentUser.uid));
  currentProfile = snap.data();
  updateUIProfile(currentProfile);
  document.getElementById("profileEditForm").classList.add("hidden");
  await renderProfilePage(currentUser.uid);
  alert("Profil gespeichert!");
});

// ===== DMs (only mutual follows) =====
function chatKey(a, b) {
  return [a, b].sort().join("_");
}

async function loadDmList() {
  const listEl = document.getElementById("dmList");
  const chatEl = document.getElementById("dmChat");
  listEl.classList.remove("hidden");
  chatEl.classList.add("hidden");
  if (dmUnsub) { dmUnsub(); dmUnsub = null; }

  const following = currentProfile?.following || [];
  if (!following.length) {
    listEl.innerHTML = `<div class="dm-empty"><h3>Noch keine Chats</h3><p>Du kannst nur schreiben, wenn ihr euch gegenseitig folgt.</p></div>`;
    return;
  }

  // find mutual follows
  const mutuals = [];
  for (const uid of following) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) continue;
    const p = snap.data();
    if ((p.following || []).includes(currentUser.uid)) {
      mutuals.push({ uid, ...p });
    }
  }

  if (!mutuals.length) {
    listEl.innerHTML = `<div class="dm-empty"><h3>Keine gegenseitigen Follows</h3><p>Folgt euch zuerst gegenseitig, dann könnt ihr schreiben.</p></div>`;
    return;
  }

  listEl.innerHTML = mutuals.map(u => `
    <div class="dm-item" data-uid="${u.uid}">
      ${avatarHtml(u.name, u.avatarUrl)}
      <div class="dm-item-info">
        <strong>${escapeHtml(u.name || "User")}</strong>
        <span>@${escapeHtml(u.handle || "user")}</span>
      </div>
    </div>`).join("");

  listEl.querySelectorAll(".dm-item").forEach(item => {
    item.addEventListener("click", () => {
      const u = mutuals.find(m => m.uid === item.dataset.uid);
      if (u) openChat(u.uid, u);
    });
  });
}

function openChat(partnerUid, partnerProfile) {
  activeChatPartner = { uid: partnerUid, ...partnerProfile };
  switchPage("messages");
  document.getElementById("dmList").classList.add("hidden");
  document.getElementById("dmChat").classList.remove("hidden");
  document.getElementById("dmChatName").textContent = partnerProfile.name || "User";

  if (dmUnsub) { dmUnsub(); dmUnsub = null; }
  const key = chatKey(currentUser.uid, partnerUid);
  const q = query(collection(db, "dms"), where("chatKey", "==", key), orderBy("createdAt", "asc"));
  // fallback without orderBy if index missing
  const box = document.getElementById("dmMessages");
  box.innerHTML = "";

  try {
    dmUnsub = onSnapshot(q, (snap) => {
      const msgs = [];
      snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
      renderDmMessages(msgs);
    }, async () => {
      // fallback: no index
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
    });
  } catch (e) {
    console.error(e);
  }
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
  // verify mutual still
  const them = await getDoc(doc(db, "users", activeChatPartner.uid));
  const p = them.data() || {};
  const mutual = (currentProfile.following || []).includes(activeChatPartner.uid) && (p.following || []).includes(currentUser.uid);
  if (!mutual) {
    alert("Ihr müsst euch gegenseitig folgen, um zu schreiben.");
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
  const term = e.target.value.toLowerCase();
  const filtered = allPosts.filter(p =>
    (p.text || "").toLowerCase().includes(term) ||
    (p.name || "").toLowerCase().includes(term) ||
    (p.handle || "").toLowerCase().includes(term)
  );
  renderPosts(filtered, "searchResults");
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
