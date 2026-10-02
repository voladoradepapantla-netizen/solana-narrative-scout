import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const now = new Date();
const lookbackDays = 45;
const since = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
const sinceIso = since.toISOString().slice(0, 10);

const githubToken = process.env.GITHUB_TOKEN || "";
const strictLive = process.env.STRICT_LIVE === "1";
const githubHeaders = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (githubToken) {
  githubHeaders.Authorization = `Bearer ${githubToken}`;
}

const fallbackNews = [
  {
    title: "Introducing Frontier Traders",
    url: "https://solana.com/news/introducing-frontier-traders",
    summary: "A launch-style post that reads like a signal for market infrastructure and early trader tooling.",
    published: "Fallback",
    signal: "News",
  },
  {
    title: "How External Assets Start Trading on Solana From Day One",
    url: "https://solana.com/news/external-assets-trading-solana-day-one",
    summary: "This strongly hints at bridging, listings, and asset onboarding narratives.",
    published: "Fallback",
    signal: "News",
  },
  {
    title: "MoneyGram Joins Solana Developer Platform",
    url: "https://solana.com/news/moneygram-joins-solana-developer-platform",
    summary: "A payments-flavored headline with real-world distribution energy.",
    published: "Fallback",
    signal: "News",
  },
];

const fallbackRepos = [
  {
    full_name: "MikeyPetrillo/Agent402",
    html_url: "https://github.com/MikeyPetrillo/Agent402",
    description: "Agent orchestration work for Solana-adjacent flows.",
    language: "TypeScript",
    stars: 0,
    pushed_at: now.toISOString(),
  },
  {
    full_name: "kaditang/agent-wallet-mcp",
    html_url: "https://github.com/kaditang/agent-wallet-mcp",
    description: "Wallet tooling that connects agents and payments.",
    language: "TypeScript",
    stars: 0,
    pushed_at: now.toISOString(),
  },
  {
    full_name: "IncidentGames/prediction-market",
    html_url: "https://github.com/IncidentGames/prediction-market",
    description: "Prediction market tooling that can map to narrative momentum.",
    language: "Rust",
    stars: 0,
    pushed_at: now.toISOString(),
  },
];

const fallbackSamples = [
  { numTransactions: 178627, samplePeriodSecs: 60, numSlots: 151 },
  { numTransactions: 176480, samplePeriodSecs: 60, numSlots: 149 },
  { numTransactions: 181032, samplePeriodSecs: 60, numSlots: 152 },
  { numTransactions: 177980, samplePeriodSecs: 60, numSlots: 150 },
  { numTransactions: 180411, samplePeriodSecs: 60, numSlots: 151 },
  { numTransactions: 179224, samplePeriodSecs: 60, numSlots: 150 },
];

const narrativeLibrary = [
  {
    id: "ai-agents",
    name: "AI Agents",
    radarLabel: "Agent tooling",
    accent: "#7C8CFF",
    trend: "Hot",
    keywords: ["agent", "agents", "mcp", "autonomous", "assistant", "bot", "ai"],
    summary:
      "Agent tooling keeps showing up in repo names and ecosystem language, which makes it a durable early signal.",
    buildIdeas: [
      "Narrative monitor that alerts when Solana agent repos spike.",
      "Agent triage bot that turns news headlines into opportunity notes.",
      "Protocol watchlist for MCP-compatible wallet and transaction tools.",
    ],
  },
  {
    id: "payments",
    name: "Payments",
    radarLabel: "Commercial rails",
    accent: "#F0B84B",
    trend: "Rising",
    keywords: ["payment", "payments", "subscription", "allowance", "merchant", "wallet", "cash"],
    summary:
      "Payments language is moving from abstract crypto talk into product announcements and platform integrations.",
    buildIdeas: [
      "Merchant adoption tracker with new payment-product mentions.",
      "Subscriptions and allowances dashboard for stablecoin flows.",
      "Consumer payment launch feed with one-click summaries.",
    ],
  },
  {
    id: "defi",
    name: "DeFi",
    radarLabel: "Market activity",
    accent: "#27D6C8",
    trend: "Warming",
    keywords: ["swap", "liquidity", "trading", "perp", "prediction", "yield", "dex", "market"],
    summary:
      "Trading, liquidity, and market-structure language still produce some of the clearest cycle-to-cycle signals.",
    buildIdeas: [
      "Dex narrative board that maps launch headlines to venue activity.",
      "Perp and prediction market radar for fast-moving builder attention.",
      "Liquidity lens that compares ecosystem launches with onchain pressure.",
    ],
  },
  {
    id: "infra",
    name: "Infrastructure",
    radarLabel: "Builder stack",
    accent: "#9B7BFF",
    trend: "Steady",
    keywords: ["rpc", "anchor", "program", "indexer", "validator", "sdk", "protocol", "infrastructure"],
    summary:
      "Infrastructure stays relevant because new releases, SDKs, and programs tend to produce repeated technical chatter.",
    buildIdeas: [
      "Repo watchlist for Anchor, SDK, and protocol releases.",
      "Health dashboard for validators, RPC, and developer tooling mentions.",
      "Release note summarizer that converts infra updates into digest cards.",
    ],
  },
  {
    id: "consumer",
    name: "Consumer",
    radarLabel: "Distribution",
    accent: "#FF7A85",
    trend: "Emerging",
    keywords: ["consumer", "social", "game", "mobile", "community", "launch", "app"],
    summary:
      "Consumer products often start as launch headlines before they are obvious from pure onchain data.",
    buildIdeas: [
      "Consumer launch tracker that ranks the loudest new apps.",
      "Community growth radar that highlights social and app-store signals.",
      "Campaign board for products trying to reach non-crypto users.",
    ],
  },
  {
    id: "security",
    name: "Security",
    radarLabel: "Risk surface",
    accent: "#FFB24A",
    trend: "Attention",
    keywords: ["security", "audit", "vulnerability", "exploit", "risk", "bug", "hardening"],
    summary:
      "Security activity is always actionable because it tends to correlate with urgent fixes, audits, and repo triage.",
    buildIdeas: [
      "Security issue monitor that flags vulnerable Solana repos.",
      "Auto-generated audit brief with severity and repo context.",
      "Patch tracker for the fastest-moving public fixes.",
    ],
  },
  {
    id: "rwa",
    name: "RWA",
    radarLabel: "Real assets",
    accent: "#61C4FF",
    trend: "Early",
    keywords: ["asset", "external", "bank", "moneygram", "treasury", "stablecoin", "real world"],
    summary:
      "Asset onboarding and traditional finance headlines are the clearest bridge to real-world adoption stories.",
    buildIdeas: [
      "RWA launch board with bank and asset-onboarding headlines.",
      "Treasury and settlement tracker for stablecoin rails.",
      "Cross-chain asset intake monitor for new market entrances.",
    ],
  },
];

function decodeHtmlEntities(input = "") {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    "#39": "'",
  };

  return input
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity) => {
      if (entity.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      }

      if (entity.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      }

      return named[entity] ?? `&${entity};`;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(input = "") {
  return input.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function cleanText(input = "") {
  return decodeHtmlEntities(stripTags(input)).replace(/\s+/g, " ").trim();
}

function uniqBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function safeFetchText(url, options, fallback) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    if (strictLive) throw error;
    return fallback;
  }
}

async function safeFetchJson(url, options, fallback) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (strictLive) throw error;
    return fallback;
  }
}

function parseNewsArticles(html) {
  const items = [];
  const regex = /<a[^>]+href="(\/news\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = regex.exec(html))) {
    const title = extractAnchorTitle(match[2]);
    if (!title || title.length < 16) continue;
    if (/^(Solana|News|Blog|Learn|Docs)$/i.test(title)) continue;
    if (title.toLowerCase().includes("read more")) continue;

    items.push({
      title,
      url: `https://solana.com${match[1]}`,
    });
  }

  return uniqBy(items, (item) => item.url).slice(0, 8);
}

function extractAnchorTitle(innerHtml) {
  const headingMatch = innerHtml.match(/<(h1|h2|h3|h4|h5|h6)[^>]*>([\s\S]*?)<\/\1>/i);
  if (headingMatch) {
    return cleanText(headingMatch[2]);
  }

  const ariaLabelMatch = innerHtml.match(/aria-label="([^"]+)"/i);
  if (ariaLabelMatch) {
    return cleanText(ariaLabelMatch[1]);
  }

  return cleanText(innerHtml);
}

function summarizeNews(title) {
  const lower = title.toLowerCase();
  if (lower.includes("moneygram") || lower.includes("payment")) {
    return "Payments and real-world settlement are part of the story.";
  }
  if (lower.includes("asset") || lower.includes("trading")) {
    return "This points at market access, listings, or asset onboarding.";
  }
  if (lower.includes("subscription") || lower.includes("allowance")) {
    return "This reads like consumer payments and recurring monetization.";
  }
  if (lower.includes("trader") || lower.includes("market")) {
    return "Trading language usually maps to DeFi and liquidity activity.";
  }
  return "A fresh Solana headline worth folding into the narrative model.";
}

function scoreNarratives(news, repos, samples) {
  const sourceItems = [
    ...news.map((item) => ({
      source: "News",
      title: item.title,
      text: `${item.title} ${item.summary ?? ""}`.toLowerCase(),
    })),
    ...repos.map((item) => ({
      source: "GitHub",
      title: item.full_name,
      text: `${item.full_name} ${item.description ?? ""} ${item.language ?? ""}`.toLowerCase(),
    })),
  ];

  return narrativeLibrary
    .map((theme) => {
      const evidence = [];
      let score = 20;

      for (const source of sourceItems) {
        const matched = theme.keywords.filter((keyword) => source.text.includes(keyword.toLowerCase()));
        if (!matched.length) continue;

        const weight = source.source === "News" ? 6 : 4;
        score += weight + matched.length * 2;
        evidence.push({
          source: source.source,
          text: source.title,
          matched,
        });
      }

      const recency = repos.reduce((total, repo) => {
        const pushed = new Date(repo.pushed_at).getTime();
        if (!Number.isFinite(pushed)) return total;
        const daysOld = Math.max(0, (Date.now() - pushed) / (24 * 60 * 60 * 1000));
        if (daysOld > 45) return total;
        return total + Math.max(0, 8 - daysOld / 6);
      }, 0);

      score += Math.round(recency);

      const sampleBoost = samples.length > 0 ? Math.round(samples[0].numTransactions / samples[0].samplePeriodSecs / 60) : 0;
      if (theme.id === "infra") {
        score += Math.max(0, Math.min(sampleBoost, 10));
      }
      if (theme.id === "payments") {
        score += Math.max(0, Math.min(sampleBoost / 2, 6));
      }

      const sortedEvidence = evidence
        .sort((a, b) => b.matched.length - a.matched.length || a.text.length - b.text.length)
        .slice(0, 4)
        .map((item) => ({
          source: item.source,
          text: item.text,
        }));

      return {
        id: theme.id,
        name: theme.name,
        radarLabel: theme.radarLabel,
        accent: theme.accent,
        trend: theme.trend,
        keywords: theme.keywords,
        summary: theme.summary,
        buildIdeas: theme.buildIdeas,
        score,
        recency: Math.round(recency),
        evidence: sortedEvidence.length ? sortedEvidence : [{ source: "Signal", text: "No direct keyword hit, but the theme remains relevant." }],
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildRecommendations(sortedNarratives) {
  const topThemes = sortedNarratives.slice(0, 4);
  const ideas = [];

  for (const theme of topThemes) {
    const [first, second, third] = theme.buildIdeas;
    ideas.push({
      category: theme.name,
      title: first,
      description: `${theme.summary} ${second} ${third}`,
      tags: [theme.trend, theme.radarLabel, "Ship fast"],
    });
  }

  ideas.push({
    category: "Cross-theme",
    title: "Narrative scorecard",
    description:
      "Combine Solana news, GitHub search, and chain tempo into a single ranked board with saved snapshots and alerting.",
    tags: ["Dashboard", "Alerts", "Signals"],
  });

  return ideas.slice(0, 5);
}

async function fetchNews() {
  const html = await safeFetchText("https://solana.com/news", {}, "");
  const parsed = parseNewsArticles(html);
  if (parsed.length) {
    return parsed.map((item, index) => ({
      title: item.title,
      url: item.url,
      summary: summarizeNews(item.title),
      published: index === 0 ? "Latest" : "Recent",
      signal: "Solana News",
    }));
  }

  if (strictLive) throw new Error("Solana News returned no live articles; refusing fallback data.");
  return fallbackNews;
}

async function fetchRepos() {
  const queries = [
    `topic:solana pushed:>=${sinceIso} archived:false`,
    `topic:anchor pushed:>=${sinceIso} archived:false`,
    `solana agent pushed:>=${sinceIso} archived:false`,
    `solana security pushed:>=${sinceIso} archived:false`,
  ];

  const responses = await Promise.all(
    queries.map((query) =>
      safeFetchJson(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=6`,
        {
          headers: githubHeaders,
        },
        { items: [] }
      )
    )
  );

  const repos = uniqBy(
    responses.flatMap((response) => response.items ?? []),
    (item) => item.full_name
  )
    .filter((item) => item.full_name)
    .map((item) => ({
      full_name: item.full_name,
      html_url: item.html_url,
      description: item.description,
      language: item.language,
      stars: item.stargazers_count ?? 0,
      pushed_at: item.pushed_at ?? now.toISOString(),
    }))
    .slice(0, 8);

  if (repos.length) return repos;
  if (strictLive) throw new Error("GitHub search returned no live repositories; refusing fallback data.");
  return fallbackRepos;
}

async function fetchSamples() {
  const response = await safeFetchJson(
    "https://api.mainnet-beta.solana.com",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getRecentPerformanceSamples",
        params: [6],
      }),
    },
    { result: [] }
  );

  if (response.result?.length) return response.result;
  if (strictLive) throw new Error("Solana RPC returned no live samples; refusing fallback data.");
  return fallbackSamples;
}

function buildChainSeries(samples) {
  const highest = Math.max(...samples.map((sample) => sample.numTransactions / sample.samplePeriodSecs), 1);
  return samples
    .map((sample, index) => {
      const tps = sample.numTransactions / sample.samplePeriodSecs;
      return {
        label: `Sample ${index + 1}: ${Math.round(tps)} TPS`,
        height: Math.max(18, Math.round((tps / highest) * 100)),
      };
    })
    .reverse();
}

async function main() {
  await fs.mkdir(dataDir, { recursive: true });

  const [news, repos, samples] = await Promise.all([fetchNews(), fetchRepos(), fetchSamples()]);
  const narratives = scoreNarratives(news, repos, samples);
  const chainSeries = buildChainSeries(samples);

  const avgTps = samples.reduce((total, sample) => total + sample.numTransactions / sample.samplePeriodSecs, 0) / samples.length;
  const peakTps = Math.max(...samples.map((sample) => sample.numTransactions / sample.samplePeriodSecs));
  const avgSlots = samples.reduce((total, sample) => total + sample.numSlots, 0) / samples.length;

  const payload = {
    generatedAt: now.toISOString(),
    stats: {
      newsCount: news.length,
      repoCount: repos.length,
      sampleWindow: samples[0]?.samplePeriodSecs ?? 0,
      avgTps: Number(avgTps.toFixed(1)),
      peakTps: Number(peakTps.toFixed(1)),
      avgSlots: Number(avgSlots.toFixed(1)),
    },
    sources: {
      news,
      repos,
    },
    chainSeries,
    narratives,
    recommendations: buildRecommendations(narratives),
  };

  const jsContent = `window.NARRATIVE_SCOUT = ${JSON.stringify(payload, null, 2)};\n`;
  const jsonContent = `${JSON.stringify(payload, null, 2)}\n`;

  await Promise.all([
    fs.writeFile(path.join(dataDir, "narratives.js"), jsContent, "utf8"),
    fs.writeFile(path.join(dataDir, "narratives.json"), jsonContent, "utf8"),
  ]);

  console.log(`Generated ${narratives.length} narrative themes from ${news.length} news items and ${repos.length} repos.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
