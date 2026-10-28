# Anthropic (ANT) tracker

A self-hosted copy of a personal dashboard that tracks Anthropic, PBC's IPO: thesis scorecard with history, quarterly results, balance sheet and cash flow, compute commitments, valuation scenarios, lock-up schedule and pending events. English / 한국어.

**Live page:** https://namugaji.github.io/ant-tracker/

## How it works

- `index.html` is the page. `assets/dash-shim.js` loads the files in `data/`, runs the page's calculations in the browser and draws the charts with d3.
- `data/*.json` holds every input. A weekly scheduled task updates these files from SEC filings (EDGAR, CIK 2130357), the share price once ANT trades, and news on pending events.
- History files (quarterly, annual, balance_sheet, kpis, price_history, commit_schedule) are append-only.

## Embed

```html
<iframe src="https://namugaji.github.io/ant-tracker/" style="width:100%;height:1200px;border:0" loading="lazy" title="Anthropic (ANT) tracker"></iframe>
```

## Caveats

Figures come from Anthropic's SEC filings unless labelled otherwise. The market cap is a placeholder until ANT trades, the diluted share count is an estimate, and the valuation scenarios and payments-by-year chart are illustrations. For tracking a thesis, not investment advice.
