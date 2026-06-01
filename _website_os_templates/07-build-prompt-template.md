# Build Prompt for Coding Agent (Antigravity / Codex)

*Copy the text below and paste it as the initial prompt when you are ready to begin coding the project.*

---

```text
You are a senior frontend engineer and product designer. 

Build a polished, production-ready website using the following stack:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (for premium animations)
- Lucide React (for icons)

I have prepared the strategy and design files in the client folder:
- Client Info & Goals: read /client-folder/01-client-brief.md
- Brand Rationale: read /client-folder/03-brand-direction.md
- Landing Page Copy: read /client-folder/04-copywriting.md
- Layout Structure: read /client-folder/05-website-structure.md
- Design Specification: read /client-folder/06-design-spec.md

Requirements:
1. Parse the YAML front matter in the design spec. Configure these exact colors, fonts, border radii, and spacing tokens in your code (e.g., config tailwind.config.js or css variables).
2. Create reusable, well-commented UI components under `/components`.
3. Follow the sitemap and page layouts exactly. Do not invent generic SaaS template sections.
4. Implement mobile-responsive rules for every section. Desktop layouts must stack nicely on tablet and mobile viewports.
5. Add tasteful animations (scroll reveals, magnetic button hover states, fading transitions) using Framer Motion. 
6. Keep the branding colors consistent across buttons, links, and borders.
7. Use high-quality realistic placeholder images (via URLs or SVGs) where real photos are not provided.
8. Ensure all links work and form inputs are properly structured.

Before writing code:
Provide a 2-paragraph summary explaining the visual concept you will build, how you will structure the components, and how you will configure the design tokens. Then start building the application.
```
