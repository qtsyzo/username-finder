const el = (id) => document.getElementById(id);

const engines = [
  { name: "Google (exact)",  url: (u)=>`https://www.google.com/search?q=%22${encodeURIComponent(u)}%22` , note:"\"username\"" },
  { name: "Bing (exact)",    url: (u)=>`https://www.bing.com/search?q=%22${encodeURIComponent(u)}%22` , note:"\"username\"" },
  { name: "DuckDuckGo",      url: (u)=>`https://duckduckgo.com/?q=%22${encodeURIComponent(u)}%22` , note:"\"username\"" },
  { name: "Yandex",          url: (u)=>`https://yandex.com/search/?text=%22${encodeURIComponent(u)}%22`, note:"\"username\"" },
  { name: "Reddit search",   url: (u)=>`https://www.reddit.com/search/?q=${encodeURIComponent(u)}`, note:"posts/comments" },
  { name: "GitHub search",   url: (u)=>`https://github.com/search?q=${encodeURIComponent(u)}&type=users`, note:"users" },
  { name: "YouTube search",  url: (u)=>`https://www.youtube.com/results?search_query=${encodeURIComponent(u)}`, note:"channels/videos" },
  { name: "Roblox users",    url: (u)=>`https://www.roblox.com/search/users?keyword=${encodeURIComponent(u)}`, note:"user search" },
];

const sites = [
  { site:"Roblox Profile",    make:(u)=>`https://www.roblox.com/users/profile?username=${encodeURIComponent(u)}`, check:false },
  { site:"X (Twitter)",       make:(u)=>`https://x.com/${encodeURIComponent(u)}`, check:true },
  { site:"Instagram",         make:(u)=>`https://www.instagram.com/${encodeURIComponent(u)}/`, check:true },
  { site:"TikTok",            make:(u)=>`https://www.tiktok.com/@${encodeURIComponent(u)}`, check:true },
  { site:"YouTube (handle)",  make:(u)=>`https://www.youtube.com/@${encodeURIComponent(u)}`, check:true },
  { site:"Twitch",            make:(u)=>`https://www.twitch.tv/${encodeURIComponent(u)}`, check:true },
  { site:"GitHub",            make:(u)=>`https://github.com/${encodeURIComponent(u)}`, check:true },
  { site:"Reddit",            make:(u)=>`https://www.reddit.com/user/${encodeURIComponent(u)}/`, check:true },
  { site:"Steam",             make:(u)=>`https://steamcommunity.com/id/${encodeURIComponent(u)}`, check:true },
  { site:"Linktree",          make:(u)=>`https://linktr.ee/${encodeURIComponent(u)}`, check:true },
];

function setMsg(text) {
  const m = el("msg");
  if (!text) { m.classList.add("hidden"); m.textContent=""; return; }
  m.classList.remove("hidden");
  m.textContent = text;
}

function normalizeUsername(u) {
  return (u || "").trim().replace(/\s+/g, "");
}

function renderEngines(u) {
  const root = el("engines");
  root.innerHTML = "";
  for (const e of engines) {
    const a = document.createElement("a");
    a.className = "cardlink";
    a.href = e.url(u);
    a.target = "_blank";
    a.rel = "noreferrer";
    a.innerHTML = `<b>${e.name}</b><span class="sub">${e.note}</span>`;
    root.appendChild(a);
  }
}

function renderTable(u) {
  const root = el("results");
  const header = `
    <div class="trow">
      <div class="cell"><b>Site</b></div>
      <div class="cell"><b>Profile URL</b></div>
      <div class="cell"><b>Status</b></div>
    </div>`;
  root.innerHTML = header + sites.map(s => {
    const url = s.make(u);
    return `
      <div class="trow" data-site="${escapeHtml(s.site)}" data-url="${escapeAttr(url)}" data-check="${s.check}">
        <div class="cell">${escapeHtml(s.site)}</div>
        <div class="cell"><a class="inline" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></div>
        <div class="cell"><span class="badge warn">Not checked</span></div>
      </div>`;
  }).join("");
}

function escapeHtml(str){return String(str).replace(/[&<>"']/g, s=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]))}
function escapeAttr(str){return escapeHtml(str)}

async function tryCheck(url) {
  const proxy = "https://r.jina.ai/http://";
  const proxied = proxy + url.replace(/^https?:\/\//, "");
  const res = await fetch(proxied, { method:"GET" });
  if (!res.ok) return { ok:false, reason:`HTTP ${res.status}` };
  const text = (await res.text()).toLowerCase();

  const notFoundHints = [
    "page not found", "not found", "doesn't exist", "does not exist", "sorry", "error 404", "404"
  ];
  const found = !notFoundHints.some(h => text.includes(h));
  return { ok:true, found };
}

async function runChecks() {
  const rows = Array.from(document.querySelectorAll(".trow")).slice(1); // skip header
  for (const row of rows) {
    const url = row.getAttribute("data-url");
    const canCheck = row.getAttribute("data-check") === "true";
    const statusCell = row.children[2];
    if (!canCheck) {
      statusCell.innerHTML = `<span class="badge warn">Open manually</span>`;
      continue;
    }
    statusCell.innerHTML = `<span class="badge warn">Checking…</span>`;
    try {
      const r = await tryCheck(url);
      if (!r.ok) {
        statusCell.innerHTML = `<span class="badge warn">Can’t verify</span>`;
      } else {
        statusCell.innerHTML = r.found
          ? `<span class="badge ok">Likely exists</span>`
          : `<span class="badge bad">Likely not found</span>`;
      }
    } catch {
      statusCell.innerHTML = `<span class="badge warn">Can’t verify</span>`;
    }
  }
}

function go() {
  const u = normalizeUsername(el("u").value);
  if (!u) return setMsg("Type a username first.");
  setMsg("");
  renderEngines(u);
  renderTable(u);
}

el("go").addEventListener("click", go);
el("u").addEventListener("keydown", (e)=>{ if (e.key === "Enter") go(); });

el("clear").addEventListener("click", ()=>{
  el("u").value = "";
  setMsg("");
  el("engines").innerHTML = "";
  el("results").innerHTML = "";
});

el("checkAll").addEventListener("click", async ()=>{
  const u = normalizeUsername(el("u").value);
  if (!u) return setMsg("Type a username first.");
  setMsg("");
  renderEngines(u);
  renderTable(u);
  await runChecks();
});
