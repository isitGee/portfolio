/* =====================================================================
   GEE — PORTFOLIO SCRIPT
   =====================================================================
   1. DATA LOADING     <-- content now lives in /data/*.json, this
                            section fetches it into the same variable
                            names the renderers already expect
   2. Utilities
   3. Renderers (skills, projects, education, certs, experience, etc.)
   4. Interactions (theme, nav, cursor, canvas, reveal, modals, form)
===================================================================== */

/* =====================================================================
   1. DATA LOADING
   ===================================================================== */

/*
  All portfolio CONTENT lives in JSON files under the `data/` folder.
  To add or edit a project, qualification, certificate, skill, or
  experience entry, edit the matching file inside `data/` — you should
  not need to touch this script at all:

    data/profile.json       -> CONFIG, TECH_BADGES, QUICK_FACTS
    data/skills.json        -> SKILLS
    data/projects.json      -> PROJECTS
    data/education.json     -> EDUCATION
    data/certificates.json  -> CERTIFICATES
    data/experience.json    -> EXPERIENCE
    data/achievements.json  -> ACHIEVEMENTS

  Everything in sections 2-4 (renderers, interactions) is untouched from
  before — it just reads these same variable names, which now get
  filled in by fetch() at startup instead of being hard-coded here.

  NOTE: fetch() of local JSON files does not work when index.html is
  opened directly as a file:// URL. Serve the project locally (e.g. VS
  Code "Live Server") while developing. It works as-is once deployed to
  GitHub Pages.
*/

// Safe defaults so the page never renders "undefined" if a fetch fails
// before the real data arrives / in case a JSON file is unreachable.
let CONFIG = {
  name: "Portfolio",
  fullName: "",
  tagline: "",
  heroDescription: "",
  email: "",
  phone: "",
  location: "",
  cvPath: "",
  githubUsername: "",
  social: {},
};
let TECH_BADGES = [];
let QUICK_FACTS = [];
let SKILLS = [];
let PROJECTS = [];
let EDUCATION = [];
let CERTIFICATES = [];
let EXPERIENCE = [];
let ACHIEVEMENTS = [];

// Filter chips for the Projects section. This is interface configuration
// rather than content that changes with each new project, so it stays
// here — add a name below if projects.json starts using a new category.
const PROJECT_CATEGORIES = [
  "All",
  "Web",
  "Mobile",
  "Networking",
  "UI/UX",
  "Academic",
  "Personal",
  "Other",
];

// Tracks which JSON files loaded successfully so a failed fetch can show
// a friendly message in its section instead of silently staying empty.
const dataLoadStatus = {
  profile: true,
  skills: true,
  projects: true,
  education: true,
  certificates: true,
  experience: true,
  achievements: true,
};

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} responded with ${res.status}`);
  return res.json();
}

async function loadPortfolioData() {
  const [
    profileResult,
    skillsResult,
    projectsResult,
    educationResult,
    certificatesResult,
    experienceResult,
    achievementsResult,
  ] = await Promise.allSettled([
    fetchJSON("data/profile.json"),
    fetchJSON("data/skills.json"),
    fetchJSON("data/projects.json"),
    fetchJSON("data/education.json"),
    fetchJSON("data/certificates.json"),
    fetchJSON("data/experience.json"),
    fetchJSON("data/achievements.json"),
  ]);

  if (profileResult.status === "fulfilled") {
    const profile = profileResult.value || {};
    CONFIG = { ...CONFIG, ...(profile.config || {}) };
    TECH_BADGES = profile.techBadges || [];
    QUICK_FACTS = profile.quickFacts || [];
  } else {
    dataLoadStatus.profile = false;
    console.error("Error loading profile data:", profileResult.reason);
  }

  if (skillsResult.status === "fulfilled") {
    SKILLS = skillsResult.value || [];
  } else {
    dataLoadStatus.skills = false;
    console.error("Error loading skills data:", skillsResult.reason);
  }

  if (projectsResult.status === "fulfilled") {
    PROJECTS = projectsResult.value || [];
  } else {
    dataLoadStatus.projects = false;
    console.error("Error loading project data:", projectsResult.reason);
  }

  if (educationResult.status === "fulfilled") {
    EDUCATION = educationResult.value || [];
  } else {
    dataLoadStatus.education = false;
    console.error("Error loading education data:", educationResult.reason);
  }

  if (certificatesResult.status === "fulfilled") {
    CERTIFICATES = certificatesResult.value || [];
  } else {
    dataLoadStatus.certificates = false;
    console.error("Error loading certificate data:", certificatesResult.reason);
  }

  if (experienceResult.status === "fulfilled") {
    EXPERIENCE = experienceResult.value || [];
  } else {
    dataLoadStatus.experience = false;
    console.error("Error loading experience data:", experienceResult.reason);
  }

  if (achievementsResult.status === "fulfilled") {
    ACHIEVEMENTS = achievementsResult.value || [];
  } else {
    dataLoadStatus.achievements = false;
    console.error(
      "Error loading achievements data:",
      achievementsResult.reason,
    );
  }
}

// Swaps a section's container for a short, visitor-friendly note when its
// JSON file couldn't be loaded (bad path, JSON typo, offline, etc.),
// instead of leaving the page looking silently broken.
function showDataLoadErrors() {
  const errorTargets = [
    {
      key: "skills",
      selector: "#skillsPanels",
      message: "Skills could not be loaded.",
    },
    {
      key: "projects",
      selector: "#projectsGrid",
      message: "Projects could not be loaded.",
    },
    {
      key: "education",
      selector: "#educationTimeline",
      message: "Education history could not be loaded.",
    },
    {
      key: "certificates",
      selector: "#certsGrid",
      message: "Certificates could not be loaded.",
    },
    {
      key: "experience",
      selector: "#experienceTimeline",
      message: "Experience could not be loaded.",
    },
    {
      key: "achievements",
      selector: "#achieveGrid",
      message: "Achievements could not be loaded.",
    },
  ];
  errorTargets.forEach(({ key, selector, message }) => {
    if (dataLoadStatus[key]) return;
    const el = $(selector);
    if (el) el.innerHTML = `<p class="empty-note">${esc(message)}</p>`;
  });
}

/* =====================================================================
   2. UTILITIES
   ===================================================================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const esc = (str) =>
  String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const isPlaceholder = (val) =>
  typeof val === "string" && (val.trim() === "" || /^\[ADD/i.test(val.trim()));
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function safeLink(url, fallbackText) {
  if (isPlaceholder(url))
    return { href: "#", disabled: true, text: fallbackText };
  return { href: url, disabled: false, text: fallbackText };
}

/* =====================================================================
   3. RENDERERS
   ===================================================================== */

function renderHeroBasics() {
  $("#brandName").textContent = CONFIG.name;
  $("#heroFullName").textContent = CONFIG.tagline;
  $("#heroDesc").textContent = CONFIG.heroDescription;
  $("#footerTagline").textContent =
    "Computer Science Student • Developer • Tech Enthusiast";
  $("#footerYear").textContent = new Date().getFullYear();

  const cv = $("#downloadCvBtn");
  cv.setAttribute("href", CONFIG.cvPath || "/assets/George_Mwanga_CV.pdf");
  cv.setAttribute("download", "George_Mwanga_CV.pdf");
  if (CONFIG.cvPath && CONFIG.cvPath.includes("cv.pdf")) {
    cv.title =
      "Placeholder path — replace CONFIG.cvPath with your real CV file";
  }

  $("#statProjects").textContent = PROJECTS.length;
  $("#statSkills").textContent = SKILLS.reduce(
    (n, cat) => n + cat.items.length,
    0,
  );
}

function renderTechBadges() {
  const wrap = $("#techBadges");
  const n = TECH_BADGES.length;
  // Distribute badges evenly around an ellipse centered on the avatar using a
  // FIXED PIXEL radius (not a percentage of the container). The hero-visual
  // container is single-column from mobile all the way up to 980px, so its
  // width varies hugely (e.g. ~340px on phones vs ~900px on tablets) — a
  // percentage-based radius overshoots badly on wider single-column layouts.
  // A fixed pixel radius tied to viewport tiers stays safe at every width.
  const w = window.innerWidth;
  let radiusX, radiusY;
  if (w <= 480) {
    radiusX = 95;
    radiusY = 88;
  } else if (w <= 980) {
    radiusX = 170;
    radiusY = 155;
  } else if (w <= 1200) {
    radiusX = 145;
    radiusY = 130;
  } else {
    radiusX = 190;
    radiusY = 165;
  }

  wrap.innerHTML = TECH_BADGES.map((b, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const top = (radiusY * Math.sin(angle)).toFixed(1);
    const left = (radiusX * Math.cos(angle)).toFixed(1);
    const delay = (i * (5 / n)).toFixed(2);
    return `
      <span class="badge glass" style="top:calc(50% + ${top}px); left:calc(50% + ${left}px); animation-delay:${delay}s">
        <span class="badge-dot" style="background:${b.color}"></span>${esc(b.label)}
      </span>
    `;
  }).join("");
}

function renderQuickFacts() {
  $("#quickFacts").innerHTML = QUICK_FACTS.map(
    (f) => `
    <div class="fact">
      <span class="fact-label">${esc(f.label)}</span>
      <span class="fact-value">${esc(f.value)}</span>
    </div>
  `,
  ).join("");
}

function renderSkills() {
  const tabs = $("#skillsTabs");
  const panels = $("#skillsPanels");

  tabs.innerHTML = SKILLS.map(
    (cat, i) => `
    <button class="skills-tab${i === 0 ? " is-active" : ""}" data-tab="${cat.id}">
      <svg aria-hidden="true"><use href="#${cat.icon}"/></svg> ${esc(cat.label)}
    </button>
  `,
  ).join("");

  panels.innerHTML = SKILLS.map(
    (cat, i) => `
    <div class="skills-panel${i === 0 ? " is-active" : ""}" data-panel="${cat.id}">
      ${cat.items
        .map(
          (item) => `
        <div class="skill-card glass tilt">
          <div class="skill-top">
            <span class="skill-icon"><svg aria-hidden="true"><use href="#${item.icon}"/></svg></span>
            <span class="skill-name">${esc(item.name)}</span>
          </div>
          <p class="skill-desc">${esc(item.desc)}</p>
        </div>
      `,
        )
        .join("")}
    </div>
  `,
  ).join("");

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".skills-tab");
    if (!btn) return;
    $$(".skills-tab", tabs).forEach((t) =>
      t.classList.toggle("is-active", t === btn),
    );
    $$(".skills-panel", panels).forEach((p) =>
      p.classList.toggle("is-active", p.dataset.panel === btn.dataset.tab),
    );
  });
}

function projectMediaHtml(p) {
  if (!isPlaceholder(p.image) && p.image) {
    return `<img src="${esc(p.image)}" alt="${esc(p.title)} preview" loading="lazy">`;
  }
  return `<div class="project-media-fallback">${esc(p.category)} · ${esc(p.title.replace(/^\[.*?\]\s*/, ""))}</div>`;
}

function projectCardHtml(p) {
  return `
    <article class="project-card glass tilt" data-id="${esc(p.id)}" data-category="${esc(p.category)}" tabindex="0" role="button" aria-label="View details for ${esc(p.title)}">
      <div class="project-media">
        ${projectMediaHtml(p)}
        <span class="project-status">${esc(p.status)}</span>
        <span class="project-year">${esc(p.year)}</span>
      </div>
      <div class="project-body">
        <span class="project-cat">${esc(p.category)}</span>
        <h3 class="project-title">${esc(p.title)}</h3>
        <p class="project-desc">${esc(p.description)}</p>
        <div class="project-tech">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        <div class="project-links">
          ${!isPlaceholder(p.github) ? `<a href="${esc(p.github)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg aria-hidden="true"><use href="#ic-external"/></svg> Code</a>` : `<span style="opacity:.5"><svg aria-hidden="true"><use href="#ic-external"/></svg> Code</span>`}
          ${!isPlaceholder(p.demo) ? `<a href="${esc(p.demo)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg aria-hidden="true"><use href="#ic-arrow"/></svg> Live</a>` : `<span style="opacity:.5"><svg aria-hidden="true"><use href="#ic-arrow"/></svg> Live</span>`}
        </div>
      </div>
    </article>
  `;
}

function renderProjects() {
  const filtersEl = $("#projectFilters");
  const gridEl = $("#projectsGrid");
  const featuredEl = $("#featuredStrip");

  filtersEl.innerHTML = PROJECT_CATEGORIES.map(
    (c, i) => `
    <button class="filter-btn${i === 0 ? " is-active" : ""}" data-filter="${esc(c)}">${esc(c)}</button>
  `,
  ).join("");

  gridEl.innerHTML = PROJECTS.length
    ? PROJECTS.map(projectCardHtml).join("")
    : `<p class="empty-note">No projects yet — add your first one to data/projects.json.</p>`;

  const featured = PROJECTS.filter((p) => p.featured);
  featuredEl.innerHTML = featured.length
    ? `
    <div class="strip-label"><svg aria-hidden="true"><use href="#ic-star"/></svg> Featured</div>
    <div class="projects-grid">${featured.map(projectCardHtml).join("")}</div>
  `
    : "";

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    $$(".filter-btn", filtersEl).forEach((b) =>
      b.classList.toggle("is-active", b === btn),
    );
    const filter = btn.dataset.filter;
    $$(".project-card", gridEl).forEach((card) => {
      const match = filter === "All" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !match);
    });
  });

  const openHandler = (e) => {
    const card = e.target.closest(".project-card");
    if (!card) return;
    openProjectModal(card.dataset.id);
  };
  gridEl.addEventListener("click", openHandler);
  featuredEl.addEventListener("click", openHandler);
  [gridEl, featuredEl].forEach((el) =>
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".project-card");
      if (!card) return;
      e.preventDefault();
      openProjectModal(card.dataset.id);
    }),
  );
}

function openProjectModal(id) {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return;
  const box = $("#pmBox");
  const d = p.details || {};
  box.innerHTML = `
    <div class="modal-media">
      ${projectMediaHtml(p)}
      <button class="modal-close" data-close aria-label="Close"><svg aria-hidden="true"><use href="#ic-close"/></svg></button>
    </div>
    <div class="modal-body">
      <h3 id="pmTitle">${esc(p.title)}</h3>
      <span class="modal-tagline">${esc(p.category)} · ${esc(p.year)} · ${esc(p.status)}</span>
      <div class="modal-section"><h4>Problem</h4><p>${esc(d.problem)}</p></div>
      <div class="modal-section"><h4>Solution</h4><p>${esc(d.solution)}</p></div>
      ${d.features && d.features.length ? `<div class="modal-section"><h4>Features</h4><ul>${d.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>` : ""}
      <div class="modal-section"><h4>Technologies</h4><div class="project-tech">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div></div>
      <div class="modal-section"><h4>What I learned</h4><p>${esc(d.learned)}</p></div>
      <div class="modal-section"><h4>Challenges</h4><p>${esc(d.challenges)}</p></div>
      <div class="modal-actions">
        ${!isPlaceholder(p.github) ? `<a href="${esc(p.github)}" target="_blank" rel="noopener" class="btn btn-glass"><svg aria-hidden="true"><use href="#ic-external"/></svg> View Code</a>` : `<button class="btn btn-glass" disabled title="Add your GitHub link in data/projects.json">Code link pending</button>`}
        ${!isPlaceholder(p.demo) ? `<a href="${esc(p.demo)}" target="_blank" rel="noopener" class="btn btn-primary"><svg aria-hidden="true"><use href="#ic-arrow"/></svg> Live Demo</a>` : `<button class="btn btn-primary" disabled title="Add your demo link in data/projects.json">Demo link pending</button>`}
      </div>
    </div>
  `;
  openModal("#projectModal");
}

function renderEducation() {
  const el = $("#educationTimeline");
  el.innerHTML = EDUCATION.map(
    (ed) => `
    <div class="timeline-item">
      <span class="timeline-dot"></span>
      <div class="timeline-card glass">
        <span class="timeline-period"><svg aria-hidden="true" style="width:12px;height:12px;display:inline;vertical-align:-2px;margin-right:4px"><use href="#ic-calendar"/></svg>${esc(ed.start)} — ${esc(ed.end)}</span>
        <h3 class="timeline-title">${esc(ed.qualification)}</h3>
        <p class="timeline-org">${esc(ed.institution)}</p>
        <p class="timeline-loc">${esc(ed.location)}</p>
        <p class="timeline-desc">${esc(ed.description)}</p>
        ${ed.coursework && ed.coursework.length ? `<div class="timeline-list">${ed.coursework.map((c) => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
      </div>
    </div>
  `,
  ).join("");
}

function renderExperience() {
  const el = $("#experienceTimeline");
  el.innerHTML = EXPERIENCE.map(
    (ex) => `
    <div class="timeline-item">
      <span class="timeline-dot"></span>
      <div class="timeline-card glass">
        <span class="timeline-period"><svg aria-hidden="true" style="width:12px;height:12px;display:inline;vertical-align:-2px;margin-right:4px"><use href="#ic-briefcase"/></svg>${esc(ex.start)} — ${esc(ex.end)}</span>
        <h3 class="timeline-title">${esc(ex.position)}</h3>
        <p class="timeline-org">${esc(ex.org)}</p>
        <p class="timeline-loc">${esc(ex.location)}</p>
        <p class="timeline-desc">${esc(ex.description)}</p>
        ${ex.responsibilities && ex.responsibilities.length ? `<div class="timeline-list">${ex.responsibilities.map((r) => `<span>${esc(r)}</span>`).join("")}</div>` : ""}
      </div>
    </div>
  `,
  ).join("");
}

function renderCertificates() {
  const el = $("#certsGrid");
  el.innerHTML = CERTIFICATES.map(
    (c, i) => `
    <div class="cert-card glass tilt" data-idx="${i}" tabindex="0" role="button" aria-label="View certificate: ${esc(c.name)}">
      <div class="cert-top">
        <span class="cert-icon"><svg aria-hidden="true"><use href="#ic-award"/></svg></span>
        <span class="cert-date">${esc(c.date)}</span>
      </div>
      <h3 class="cert-name">${esc(c.name)}</h3>
      <p class="cert-org">${esc(c.org)}</p>
      <span class="cert-id">${esc(c.credentialId)}</span>
    </div>
  `,
  ).join("");

  const open = (idx) => {
    const c = CERTIFICATES[idx];
    if (!c) return;
    const box = $("#cmBox");
    box.innerHTML = `
      <div class="modal-media">
        ${!isPlaceholder(c.image) && c.image ? `<img src="${esc(c.image)}" alt="${esc(c.name)}">` : `<div class="project-media-fallback">${esc(c.org)}</div>`}
        <button class="modal-close" data-close aria-label="Close"><svg aria-hidden="true"><use href="#ic-close"/></svg></button>
      </div>
      <div class="modal-body">
        <h3 id="cmTitle">${esc(c.name)}</h3>
        <span class="modal-tagline">${esc(c.org)} · ${esc(c.date)}</span>
        <div class="modal-section"><h4>Description</h4><p>${esc(c.description)}</p></div>
        <div class="modal-section"><h4>Credential ID</h4><p>${esc(c.credentialId)}</p></div>
        <div class="modal-actions">
          ${!isPlaceholder(c.link) ? `<a href="${esc(c.link)}" target="_blank" rel="noopener" class="btn btn-primary"><svg aria-hidden="true"><use href="#ic-external"/></svg> Verify Certificate</a>` : `<button class="btn btn-primary" disabled title="Add a verification link in data/certificates.json">Verification link pending</button>`}
        </div>
      </div>
    `;
    openModal("#certModal");
  };

  el.addEventListener("click", (e) => {
    const c = e.target.closest(".cert-card");
    if (c) open(+c.dataset.idx);
  });
  el.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const c = e.target.closest(".cert-card");
    if (!c) return;
    e.preventDefault();
    open(+c.dataset.idx);
  });
}

function renderAchievements() {
  $("#achieveGrid").innerHTML = ACHIEVEMENTS.map(
    (a) => `
    <div class="achieve-card glass tilt">
      <span class="achieve-icon"><svg aria-hidden="true"><use href="#${a.icon}"/></svg></span>
      <h3 class="achieve-title">${esc(a.title)}</h3>
      <p class="achieve-desc">${esc(a.desc)}</p>
    </div>
  `,
  ).join("");
}

async function renderGithubPlaceholder() {
  const link = $("#ghProfileLink");
  const gh = safeLink(CONFIG.social.github?.url, "View GitHub Profile");
  const username = CONFIG.githubUsername || "";

  link.href = gh.href;
  link.setAttribute("aria-disabled", gh.disabled ? "true" : "false");
  link.classList.toggle("is-disabled", gh.disabled);

  const container = $("#ghRepos");
  if (!container) return;

  if (!username || gh.disabled) {
    container.innerHTML = `<p class="empty-note">GitHub profile not configured yet.</p>`;
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=6`,
      { headers: { Accept: "application/vnd.github+json" } },
    );

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`);
    }

    const repos = await response.json();
    const publicRepos = (Array.isArray(repos) ? repos : []).filter((repo) => !repo.fork);

    if (!publicRepos.length) {
      container.innerHTML = `<p class="empty-note">No public repositories yet.</p>`;
      return;
    }

    container.innerHTML = publicRepos
      .map(
        (repo) => `
          <a class="gh-repo glass" href="${esc(repo.html_url || "#")}" target="_blank" rel="noopener" aria-label="Open ${esc(repo.name)} on GitHub">
            <div class="gh-repo-top">
              <span class="gh-repo-name">${esc(repo.name)}</span>
              <svg aria-hidden="true"><use href="#ic-external"/></svg>
            </div>
            <p>${esc(repo.description || "No description provided.")}</p>
            <div class="gh-repo-meta">
              <span><svg aria-hidden="true"><use href="#ic-code"/></svg>${esc(repo.language || "Unknown")}</span>
              <span><svg aria-hidden="true"><use href="#ic-star"/></svg>${esc(repo.stargazers_count ?? 0)}</span>
              <span><svg aria-hidden="true"><use href="#ic-git-branch"/></svg>${esc(repo.forks_count ?? 0)}</span>
            </div>
          </a>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Could not load GitHub repos:", error);
    container.innerHTML = `<p class="empty-note">GitHub activity could not be loaded right now.</p>`;
  }
}

function renderContactInfo() {
  const rows = [
    {
      icon: "ic-mail",
      label: "Email",
      value: CONFIG.email,
      href: isPlaceholder(CONFIG.email) ? null : `mailto:${CONFIG.email}`,
    },
    {
      icon: "ic-phone",
      label: "Phone",
      value: CONFIG.phone,
      href: isPlaceholder(CONFIG.phone) ? null : `tel:${CONFIG.phone}`,
    },
    {
      icon: "ic-pin",
      label: "Location",
      value: CONFIG.location,
      href: null,
    },
  ];

  const rowsHtml = rows
    .map(
      (r) => `
    <div class="contact-row">
      <span class="ci-icon"><svg aria-hidden="true"><use href="#${r.icon}"/></svg></span>
      <div>
        <div class="ci-label">${esc(r.label)}</div>
        ${r.href ? `<a class="ci-value" href="${esc(r.href)}">${esc(r.value)}</a>` : `<span class="ci-value">${esc(r.value)}</span>`}
      </div>
    </div>
  `,
    )
    .join("");

  const brandIcons = {
    github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.4-5.5-6.1 0-1.3.5-2.5 1.2-3.3-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 3 .1 3.3.8.8 1.2 2 1.2 3.3 0 4.7-2.8 5.8-5.5 6.1.4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.94 8.5A1.56 1.56 0 1 1 6.94 5.38a1.56 1.56 0 0 1 0 3.12ZM5.38 10.53h2.88v8.78H5.38v-8.78Zm4.56 0h2.76v1.2h.04c.38-.72 1.32-1.48 2.72-1.48 2.9 0 3.44 1.91 3.44 4.39v4.67h-2.88v-4.38c0-1.04-.02-2.38-1.45-2.38-1.46 0-1.68 1.14-1.68 2.3v4.46H9.94v-8.78Z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.4" fill="currentColor"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.3 2.2c.3 1.8 1.5 3 3.3 3.3v2.5a6.2 6.2 0 0 1-3.2-.9v6.1c0 2.9-2.3 5.2-5.2 5.2A5.2 5.2 0 0 1 3 13.2a5.2 5.2 0 0 1 5.2-5.2c.3 0 .6 0 .9.1v2.6a2.7 2.7 0 0 0-.9-.2 2.7 2.7 0 0 0 0 5.4 2.7 2.7 0 0 0 2.7-2.7V2.2h2.4Z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.93 9.93 0 0 0-8.54 15.05L2.1 22l5.12-1.45a9.9 9.9 0 1 0 4.82-18.55ZM12 18.5c-1.62 0-3.13-.43-4.47-1.24l-.32-.19-3.03.86.81-2.97-.2-.31A7.94 7.94 0 0 1 12 4.1a7.9 7.9 0 0 1 0 15.8Zm4.45-5.95c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.19-.71-.63-1.18-1.4-1.32-1.63-.14-.24-.02-.37.1-.5.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.29-.74-1.76-.2-.48-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.68 2.57 4.06 3.6.57.25 1.01.4 1.36.52.58.18 1.1.15 1.52.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.21-.16-.46-.28Z"/></svg>`,
  };

  const socials = Object.entries(CONFIG.social || {})
    .map(([key, s]) => {
      const l = safeLink(s.url, s.label);
      const icon = brandIcons[key] || `<span class="social-letter">${esc(s.handle)}</span>`;
      return `<a class="social-btn social-btn--${esc(key)}" href="${esc(l.href)}" ${l.disabled ? 'aria-disabled="true" title="Add your ' + esc(s.label) + ' URL in data/profile.json"' : 'target="_blank" rel="noopener"'}>${icon}<span class="tooltip">${esc(s.label)}</span></a>`;
    })
    .join("");

  $("#contactInfo").innerHTML =
    rowsHtml + `<div class="social-row">${socials}</div>`;
  $("#footerSocial").innerHTML = socials;
}

/* =====================================================================
   4. INTERACTIONS
   ===================================================================== */

/* --- Theme --- */
function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("gee-theme");
  if (stored) root.setAttribute("data-theme", stored);
  $("#themeToggle").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("gee-theme", next);
  });
}

/* --- Navbar scroll state + active section + smooth scroll --- */
function initNav() {
  const nav = $("#navbar");
  const sections = $$("main section[id]");
  const navLinks = $$("#navLinks a, .mobile-nav-link");

  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
    let current = sections[0]?.id;
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    sections.forEach((sec) => {
      if (sec.offsetTop <= scrollPos) current = sec.id;
    });
    navLinks.forEach((a) => {
      const href = a.getAttribute("href") || a.dataset.target || "";
      a.classList.toggle("is-active", href === `#${current}`);
    });
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navLinks.forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href") || a.dataset.target;
      if (!id || !id.startsWith("#")) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      const y =
        target.getBoundingClientRect().top +
        window.scrollY -
        (window.innerWidth < 720 ? 60 : 76);
      window.scrollTo({
        top: y,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }),
  );
}

/* --- Mobile menu --- */
function closeMobileMenu() {
  $("#mobileMenu").classList.remove("is-open");
  $("#hamburger").classList.remove("is-open");
  $("#hamburger").setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}
function initMobileMenu() {
  const btn = $("#hamburger");
  btn.addEventListener("click", () => {
    const open = !$("#mobileMenu").classList.contains("is-open");
    $("#mobileMenu").classList.toggle("is-open", open);
    btn.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
}

/* --- Scroll progress bar --- */
function initScrollProgress() {
  const bar = $("#scrollProgress");
  const update = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop || document.body.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    bar.style.width = height > 0 ? `${(scrolled / height) * 100}%` : "0%";
  };
  document.addEventListener("scroll", update, { passive: true });
  update();
}

/* --- Reveal on scroll --- */
function initReveal() {
  const items = $$("[data-reveal]");
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
  );
  items.forEach((el) => io.observe(el));
}

/* --- Ambient network-topology canvas (signature background element) --- */
function initNetworkCanvas() {
  const canvas = $("#network-canvas");
  const ctx = canvas.getContext("2d");
  let w,
    h,
    nodes = [];
  const reduced = prefersReducedMotion();
  const isSmall = window.innerWidth < 720;
  const COUNT = reduced ? 0 : isSmall ? 26 : 52;
  const LINK_DIST = isSmall ? 110 : 150;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  function makeNodes() {
    nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));
  }
  function getVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const dotColor = getVar("--accent-secondary-rgb") || "34,211,238";
    const lineColor = getVar("--accent-primary-rgb") || "124,108,240";

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(${lineColor}, ${(1 - d / LINK_DIST) * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    nodes.forEach((n) => {
      ctx.fillStyle = `rgba(${dotColor}, 0.55)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let raf;
  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }

  resize();
  makeNodes();
  if (!reduced && COUNT > 0) {
    loop();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else loop();
    });
  }
  window.addEventListener("resize", () => {
    resize();
    makeNodes();
    if (reduced || COUNT === 0) draw();
  });
}

/* --- Modals --- */
let lastFocused = null;
function openModal(sel) {
  const overlay = $(sel);
  lastFocused = document.activeElement;
  overlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
  const closeBtn = overlay.querySelector("[data-close]");
  if (closeBtn) closeBtn.focus();
}
function closeModal(overlay) {
  overlay.classList.remove("is-open");
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}
function initModals() {
  $$(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-close]"))
        closeModal(overlay);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    $$(".modal-overlay.is-open").forEach((o) => closeModal(o));
    closeMobileMenu();
  });
}

/* =====================================================================
   INIT
   ===================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  await loadPortfolioData();

  renderHeroBasics();
  renderTechBadges();
  renderQuickFacts();
  renderSkills();
  renderProjects();
  renderEducation();
  renderExperience();
  renderCertificates();
  renderAchievements();
  renderGithubPlaceholder();
  renderContactInfo();

  showDataLoadErrors();

  initTheme();
  initNav();
  initMobileMenu();
  initScrollProgress();
  initReveal();
  initNetworkCanvas();
  initModals();

  // Re-layout badges on resize (debounced) so orientation changes / window
  // resizing keep the ring radius appropriate for the new viewport width.
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderTechBadges, 200);
  });
});
