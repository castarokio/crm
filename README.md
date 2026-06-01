# Website Creation OS

This workspace is powered by the **Website Creation OS** system. It provides structured templates and automation scripts to guide you from client onboarding to market research, copywriting, design specs, and final QA validation.

## Directory Structure

```text
.
├── _website_os_templates/     # Core markdown templates for site building stages
│   ├── 01-client-brief-template.md       # Onboarding questionnaire & project info
│   ├── 02-market-research-template.md    # Competitor auditing & research logs
│   ├── 03-brand-direction-template.md    # HSL design tokens, themes, & aesthetics
│   ├── 03a-visual-identity-template.md   # Logos, HSL color palettes, & type styling
│   ├── 04-copywriting-template.md         # Final client copy structure (no placeholders)
│   ├── 05-website-structure-template.md   # Site maps, sections, and navigation grids
│   ├── 06-design-spec-template.md         # Layout specs & Tailwind variables
│   ├── 07-build-prompt-template.md        # Optimized builder prompts
│   ├── 08-qa-checklist-template.md        # Contrast, mobile responsiveness, & SEO QA
│   └── 09-client-presentation-template.md # Final client review notes
│
├── scripts/                   # Workspace automation shell scripts
│   ├── new-client.js                     # Generates new client folders from templates
│   └── scrape-competitor.js              # Fetches competitor markdown via Jina Reader
│
├── ANTIGRAVITY.md             # Custom agent guidelines for senior frontend developers
├── .cursorrules               # Workspace helper configs for IDE interactions
└── README.md                  # Workspace documentation (this file)
```

## Running OS Scripts

### 1. Initialize a New Client Workspace
To set up a fresh workspace for a client (which copies all templates and configures placeholders), run:
```bash
node scripts/new-client.js "Client Name"
```
This creates a new folder (e.g. `./client-name/`) with custom markdown files.

### 2. Scrape Competitor Reference Sites
To scrape copy and research references from a competitor's website and append the markdown to the client's market research log, run:
```bash
node scripts/scrape-competitor.js "client-folder-name" "https://competitor.com"
```
For example:
```bash
node scripts/scrape-competitor.js "tesla-detailing" "https://competitor-detailer.com"
```
This queries Jina Reader and writes the raw text results directly into `./tesla-detailing/02-market-research.md`.
