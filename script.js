// Sample posts
const initialPosts = [
  {
    id: 1,
    name: "Elon Musk",
    handle: "elonmusk",
    time: "2h",
    text: "V.com is looking interesting. Competition is good for the universe.",
    likes: 4200,
    liked: false,
    replies: 312,
    reposts: 890
  },
  {
    id: 2,
    name: "Grok",
    handle: "grok",
    time: "4h",
    text: "Building the future one post at a time. Welcome to V.",
    likes: 1890,
    liked: false,
    replies: 145,
    reposts: 320
  },
  {
    id: 3,
    name: "You",
    handle: "you",
    time: "6h",
    text: "Just launched V.com 🔥\nThis is only the beginning.",
    likes: 56,
    liked: true,
    replies: 8,
    reposts: 12
  }
];

let posts = JSON.parse(localStorage.getItem("vcom_posts")) || initialPosts;

function savePosts() {
  localStorage.setItem("vcom_posts", JSON.stringify(posts));
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num;
}

function renderPosts() {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  posts.forEach(post => {
    const postEl = document.createElement("div");
    postEl.className = "post";
    postEl.innerHTML = `
      <div class="avatar">${post.name.charAt(0)}</div>
      <div class="post-content">
        <div class="post-header">
          <strong>${post.name}</strong>
          <span>@${post.handle}</span>
          <span>·</span>
          <span>${post.time}</span>
        </div>
        <div class="post-text">${post.text}</div>
        <div class="post-actions">
          <button class="action-btn" data-action="reply">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14.046 2.242l-2.089 2.089L16.5 8.875 21.5 3.875l-2.089-2.089c-.391-.391-1.024-.391-1.414 0L14.046 2.242zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
            <span>${formatNumber(post.replies)}</span>
          </button>
          <button class="action-btn" data-action="repost">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.061 0s-.293.768 0 1.061l3.5 3.5c.145.145.337.219.53.219s.383-.074.53-.219l3.5-3.5c.294-.292.294-.767.001-1.06zM3.23 8.33c.292.293.767.293 1.06 0l2.22-2.22v10.24c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-5.85c-1.24 0-2.25-1.01-2.25-2.25V6.11l2.22 2.22c.293.293.768.293 1.061 0s.293-.768 0-1.061l-3.5-3.5c-.145-.145-.337-.219-.53-.219s-.383.074-.53.219l-3.5 3.5c-.294.292-.294.767-.001 1.06z"/></svg>
            <span>${formatNumber(post.reposts)}</span>
          </button>
          <button class="action-btn ${post.liked ? "liked" : ""}" data-action="like" data-id="${post.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z"/></svg>
            <span>${formatNumber(post.likes)}</span>
          </button>
          <button class="action-btn" data-action="share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
          </button>
        </div>
      </div>
    `;
    timeline.appendChild(postEl);
  });

  // Like buttons
  document.querySelectorAll('[data-action="like"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      const post = posts.find(p => p.id === id);
      if (post) {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        savePosts();
        renderPosts();
      }
    });
  });
}

// Post new message
document.getElementById("postButton").addEventListener("click", () => {
  const text = document.getElementById("postText").value.trim();
  if (!text) return;

  const newPost = {
    id: Date.now(),
    name: "You",
    handle: "you",
    time: "now",
    text: text,
    likes: 0,
    liked: false,
    replies: 0,
    reposts: 0
  };

  posts.unshift(newPost);
  savePosts();
  document.getElementById("postText").value = "";
  renderPosts();
});

// Initial render
renderPosts();
