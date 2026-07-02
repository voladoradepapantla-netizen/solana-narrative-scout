# Solana Narrative Scout

This prototype turns live Solana ecosystem signals into a ranked narrative board for the Superteam Earn bounty.

## What it does

- Pulls recent headlines from `solana.com/news`
- Searches recent GitHub repos around Solana, Anchor, agents, and security
- Samples Solana mainnet performance data
- Scores the signals into themes such as payments, AI agents, DeFi, infrastructure, consumer, security, and RWA
- Renders a static dashboard with search and sort interactions

## Files

- `index.html` - the dashboard shell
- `styles.css` - the visual system
- `app.js` - renders the data and interactions
- `scripts/generate-data.mjs` - fetches live sources and builds `data/narratives.js`
- `data/narratives.js` - generated payload consumed by the dashboard

## How to refresh data

```bash
npm run generate
```

If you want richer GitHub search results, set `GITHUB_TOKEN` before running the generator.

## Bounty fit

This is tailored to the Superteam Earn bounty focused on a narrative detection and idea generation tool. The dashboard is lightweight enough to iterate quickly, but it already has the live-data plumbing and the ranked theme output the bounty asks for.
