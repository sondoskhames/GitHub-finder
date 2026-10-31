const form = document.getElementById("form");
const input = document.getElementById("username");
const result = document.getElementById("result");

const escapeHTML = (str) =>
  String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

async function searchUser(username) {
  username = username.trim();
  if (!username) return;

  result.innerHTML = '<div class="message">Loading...</div>';

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=6`)
    ]);

    if (userRes.status === 404) throw new Error("User not found.");
    if (userRes.status === 403) throw new Error("API rate limit reached. Try again later.");
    if (!userRes.ok || !reposRes.ok) throw new Error("Something went wrong.");

    const user = await userRes.json();
    const repos = await reposRes.json();
    render(user, repos);
  } catch (err) {
    result.innerHTML = `<div class="message error">${escapeHTML(err.message)}</div>`;
  }
}

function render(user, repos) {
  const reposHTML = repos.length
    ? repos.map((r) => `
        <a class="repo" href="${escapeHTML(r.html_url)}" target="_blank" rel="noopener">
          <div class="name">${escapeHTML(r.name)}</div>
          <div class="desc">${escapeHTML(r.description || "No description")}</div>
          <div class="meta">
            <span>⭐ ${r.stargazers_count}</span>
            <span>🍴 ${r.forks_count}</span>
            ${r.language ? `<span>${escapeHTML(r.language)}</span>` : ""}
          </div>
        </a>`).join("")
    : '<div class="message">No public repositories.</div>';

  result.innerHTML = `
    <div class="profile">
      <img src="${escapeHTML(user.avatar_url)}" alt="${escapeHTML(user.login)}">
      <div>
        <h2>${escapeHTML(user.name || user.login)}</h2>
        <a class="login" href="${escapeHTML(user.html_url)}" target="_blank" rel="noopener">@${escapeHTML(user.login)}</a>
        ${user.bio ? `<p>${escapeHTML(user.bio)}</p>` : ""}
        ${user.location ? `<p>📍 ${escapeHTML(user.location)}</p>` : ""}
        <div class="stats">
          <div class="stat"><b>${user.public_repos}</b>Repos</div>
          <div class="stat"><b>${user.followers}</b>Followers</div>
          <div class="stat"><b>${user.following}</b>Following</div>
        </div>
      </div>
    </div>
    <h3>Latest Repositories</h3>
    <div class="repos">${reposHTML}</div>
  `;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  searchUser(input.value);
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    input.value = chip.dataset.user;
    searchUser(chip.dataset.user);
  });
});