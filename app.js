const data = window.NARRATIVE_SCOUT;

const heroMetrics = document.getElementById("heroMetrics");
const narrativeGrid = document.getElementById("narrativeGrid");
const ideasGrid = document.getElementById("ideasGrid");
const newsGrid = document.getElementById("newsGrid");
const repoGrid = document.getElementById("repoGrid");
const sourceStack = document.getElementById("sourceStack");
const chainStats = document.getElementById("chainStats");
const sparkline = document.getElementById("sparkline");
const searchInput = document.getElementById("searchInput");
const narrativeCount = document.getElementById("narrativeCount");
const sortButtons = Array.from(document.querySelectorAll(".sort-btn"));

const state = {
  query: "",
  sort: "score",
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value) {
  if (!value) return "just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function joinTags(tags) {
  return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
}

function buildMetric({ value, label }) {
  return `
    <article class="metric">
      <strong class="metric-value">${escapeHtml(value)}</strong>
      <span class="metric-label">${escapeHtml(label)}</span>
    </article>
  `;
}

function renderHeroMetrics() {
  const items = [
    {
      value: data.stats.newsCount,
      label: "News signals",
    },
    {
      value: data.stats.repoCount,
      label: "Recent repos",
    },
    {
      value: `${formatNumber(data.stats.avgTps)} TPS`,
      label: "Average throughput",
    },
    {
      value: data.narratives[0]?.name ?? "N/A",
      label: "Top narrative",
    },
  ];

  heroMetrics.innerHTML = items.map(buildMetric).join("");
}

function renderChainStats() {
  const stats = [
    { value: `${formatNumber(data.stats.avgTps)}`, label: "avg tps" },
    { value: `${formatNumber(data.stats.peakTps)}`, label: "peak tps" },
    { value: `${data.stats.sampleWindow}s`, label: "sample window" },
    { value: `${formatNumber(data.stats.avgSlots)}`, label: "avg slots" },
  ];

  chainStats.innerHTML = stats
    .map(
      ({ value, label }) => `
        <div class="metric">
          <strong class="metric-value">${escapeHtml(value)}</strong>
          <span class="metric-label">${escapeHtml(label)}</span>
        </div>
      `
    )
    .join("");

  sparkline.innerHTML = data.chainSeries
    .map(
      (point, index) => `
        <div
          class="spark-bar"
          title="${escapeHtml(point.label)}"
          style="height:${point.height}%; opacity:${0.62 + index * 0.05};"
        ></div>
      `
    )
    .join("");
}

function renderSourceStack() {
  const sourceCards = [
    {
      title: `${data.sources.news[0]?.title ?? "No news"} `,
      meta: ["solana.com/news", `${data.sources.news.length} articles`],
    },
    {
      title: `${data.sources.repos[0]?.full_name ?? "No repo"} `,
      meta: ["GitHub search", `${data.sources.repos.length} repos`],
    },
    {
      title: "Onchain performance samples",
      meta: [`${data.stats.sampleWindow}s window`, `${formatNumber(data.stats.avgTps)} avg TPS`],
    },
  ];

  sourceStack.innerHTML = sourceCards
    .map(
      (card) => `
        <article class="source-card">
          <h3 class="source-title">${escapeHtml(card.title)}</h3>
          <div class="source-meta">
            ${card.meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function matchesQuery(item) {
  if (!state.query) return true;
  const haystack = [
    item.name,
    item.summary,
    item.keywords.join(" "),
    ...(item.signals ?? []).map((signal) => signal.title),
    ...(item.evidence ?? []).map((signal) => signal.text),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.query.toLowerCase());
}

function sortNarratives(items) {
  const narr = [...items];

  if (state.sort === "recent") {
    return narr.sort((a, b) => b.recency - a.recency || b.score - a.score);
  }

  if (state.sort === "alpha") {
    return narr.sort((a, b) => a.name.localeCompare(b.name));
  }

  return narr.sort((a, b) => b.score - a.score || b.recency - a.recency);
}

function renderNarratives() {
  const filtered = sortNarratives(data.narratives.filter(matchesQuery));
  narrativeCount.textContent = `${filtered.length} theme${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    narrativeGrid.innerHTML = `
      <div class="empty-state">No themes match that search. Try a broader term like "agent", "payment", or "security".</div>
    `;
    return;
  }

  narrativeGrid.innerHTML = filtered
    .map(
      (item, index) => `
        <article class="narrative-card" style="--accent:${item.accent}; --delay:${index * 90}ms;">
          <div class="narrative-head">
            <div>
              <div class="card-meta">${escapeHtml(item.radarLabel)}</div>
              <h3>${escapeHtml(item.name)}</h3>
              <p class="narrative-summary">${escapeHtml(item.summary)}</p>
            </div>
            <div class="score-badge">
              <strong>${formatNumber(item.score)}</strong>
              <span>score</span>
            </div>
          </div>

          <div class="narrative-tags">
            ${joinTags(item.keywords)}
            <span class="tag">${escapeHtml(item.trend)}</span>
          </div>

          <ul class="evidence-list">
            ${item.evidence
              .slice(0, 3)
              .map(
                (evidence) => `
                  <li class="evidence-item">
                    <strong>${escapeHtml(evidence.source)}</strong> ${escapeHtml(evidence.text)}
                  </li>
                `
              )
              .join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderIdeas() {
  const ideas = data.recommendations;
  ideasGrid.innerHTML = ideas
    .map(
      (idea) => `
        <article class="idea-card">
          <div class="idea-meta">${escapeHtml(idea.category)}</div>
          <h3 class="idea-title">${escapeHtml(idea.title)}</h3>
          <p class="idea-copy">${escapeHtml(idea.description)}</p>
          <div class="idea-tags">
            ${idea.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderNews() {
  newsGrid.innerHTML = data.sources.news
    .map(
      (item) => `
        <article class="feed-card">
          <h3 class="feed-title">
            <a class="feed-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>
          </h3>
          <p class="feed-copy">${escapeHtml(item.summary)}</p>
          <div class="feed-meta">
            <span>${escapeHtml(item.signal)}</span>
            <span>${escapeHtml(item.published)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderRepos() {
  repoGrid.innerHTML = data.sources.repos
    .map(
      (item) => `
        <article class="feed-card">
          <h3 class="feed-title">
            <a class="feed-link" href="${escapeHtml(item.html_url)}" target="_blank" rel="noreferrer">${escapeHtml(item.full_name)}</a>
          </h3>
          <p class="feed-copy">${escapeHtml(item.description || "No description was provided by GitHub.")}</p>
          <div class="feed-meta">
            <span>${escapeHtml(item.language || "mixed")}</span>
            <span>${formatNumber(item.stars)} stars</span>
            <span>updated ${escapeHtml(formatDate(item.pushed_at))}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function bindInteractions() {
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderNarratives();
  });

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sortButtons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");
      state.sort = button.dataset.sort;
      renderNarratives();
    });
  });
}

function renderFallback() {
  heroMetrics.innerHTML = `
    <div class="empty-state">No narrative data found. Run <code>npm run generate</code> to fetch live sources.</div>
  `;
  narrativeGrid.innerHTML = `<div class="empty-state">No data loaded yet.</div>`;
  ideasGrid.innerHTML = `<div class="empty-state">No ideas yet.</div>`;
  newsGrid.innerHTML = `<div class="empty-state">No news yet.</div>`;
  repoGrid.innerHTML = `<div class="empty-state">No repos yet.</div>`;
  chainStats.innerHTML = `<div class="empty-state">No chain stats yet.</div>`;
  sourceStack.innerHTML = `<div class="empty-state">No source data loaded yet.</div>`;
}

if (!data) {
  renderFallback();
} else {
  renderHeroMetrics();
  renderChainStats();
  renderSourceStack();
  renderNarratives();
  renderIdeas();
  renderNews();
  renderRepos();
  bindInteractions();
}
