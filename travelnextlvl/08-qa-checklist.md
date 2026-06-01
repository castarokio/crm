# Delivery QA Checklist: travelnextlvl

*Use this checklist to brutally review the website before showing it to the client. Both human testers and review agents (like Claude) should check off these requirements.*

---

## 1. Visual & Design Quality
* [ ] **The "No Generic AI" Rule:** Does anything look like a generic SaaS template? (e.g., standard icons in light-colored circles, repeating 3-card features with boring borders, plain blue/purple gradients).
* [ ] **Typography Hierarchy:** Are heading sizes contrasting enough with body copy? Are line heights correct (`leading-relaxed` for paragraphs, `leading-tight` for headings)?
* [ ] **Color Intentionality:** Are the brand's primary and secondary colors applied systematically? Are neutral shades matching the design direction?
* [ ] **Spacing Consistency:** Is there adequate padding at the top and bottom of each section (`section-py` fluid spacing)?
* [ ] **Images & Media:** Do photos look authentic? Are placeholder SVGs or patterns used instead of generic "smiling office workers" stock photos?
* [ ] **Accessibility (WCAG):** Do all text elements meet contrast requirements against their backgrounds (4.5:1 for body copy)?

---

## 2. Copywriting Polish
* [ ] **No Buzzword Fluff:** Are words like "passionate," "revolutionary," "cutting-edge," or "world-class" eliminated?
* [ ] **Specific & Credible:** Does the text focus on clear benefits and concrete stats rather than empty promises?
* [ ] **Fidelity check:** Does the code use the exact copywriting from `04-copywriting.md` without omitting paragraphs or calls to action?
* [ ] **Proofreading:** Are there any typos, grammar errors, or unfinished template placeholders?

---

## 3. Conversion Mechanics
* [ ] **Primary CTA Placement:** Is the main CTA clearly visible above the fold in the Hero section?
* [ ] **Sticky Action Hook:** Is there a visible CTA in the header navigation that stays active on scroll?
* [ ] **Form Validation:** Do contact forms show clear error states (empty fields, invalid email format) and a success confirmation state upon submission?
* [ ] **Contact Info Accessibility:** Is the phone number, email, or booking link easy to find in the footer and contact page?

---

## 4. Technical Performance
* [ ] **Mobile-First Responsiveness:** Does the site scale down smoothly on mobile screens (test at `320px` width)? Do hover-animations deactivate properly on touch screens?
* [ ] **Performance (Lighthouse):** Do images use next/image optimization? Are scripts loaded asynchronously?
* [ ] **SEO Setup:**
  * [ ] Meta title tag is unique and descriptive.
  * [ ] Meta description tag is compelling.
  * [ ] Canonical tag is set.
  * [ ] Images have descriptive `alt` tags.
  * [ ] Valid HTML semantic layout (one `<h1>`, proper nesting).
* [ ] **Code Hygiene:** Are there any console errors or broken links? Are there unused imports or duplicated style rules?
