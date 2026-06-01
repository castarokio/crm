# Website Structure: travelnextlvl

*Use this document to map out the pages, directory structure, navigation systems, and visual layouts of the website before drafting the design specification.*

---

## 1. Global Sitemap
Map out all the pages and their URL paths.

```text
/ (Homepage)
├── /services (Services Overview)
│   ├── /services/paint-protection-film (Service Page 1)
│   └── /services/ceramic-coatings (Service Page 2)
├── /about (About the Business & Team)
├── /gallery (Portfolio / Before-After Case Studies)
├── /faq (Frequently Asked Questions)
└── /contact (Quote Request / Scheduling Form)
```

---

## 2. Navigation Architecture

### Main Header Navbar
* **Layout Style:** [e.g., Floating glassmorphism capsule, or full-width clean border]
* **Logo Position:** [e.g., Left / Center]
* **Navigation Links:**
  * Home (`/`)
  * Services dropdown (`/services`)
  * Gallery (`/gallery`)
  * About (`/about`)
* **Primary Header CTA Button:**
  * [e.g., Button on the right: "Request Quote" (`/contact`)]

### Footer Navigation
* **Layout Style:** [e.g., Simple minimal 3-column, or mega-footer with newsletter]
* **Column 1:** Short bio + social media icons
* **Column 2:** Quick Links (Home, About, Services, Contact)
* **Column 3:** Contact details (Phone, Email, Address, Business Hours)
* **Sub-footer:** Copyright, Privacy Policy, Terms of Service

---

## 3. Homepage Section-by-Section Flow
*List the sections in their logical layout order, detailing the purpose and main UI elements.*

1. **Hero Section:** High-impact heading, short value statement, primary CTA, secondary CTA, immersive visual (background video or high-quality image slide).
2. **Social Proof (Trust Bar):** Google review rating + logos of certification bodies.
3. **Problem Statement:** Split screen layout. Left: pain points copy. Right: high-contrast dark image showing paint damage or wear.
4. **Unique Value Proposition (UVP):** Full-screen width with bold typography, introducing the client's signature service.
5. **Services Grid:** Dynamic grid (2x2 or 3-column layout) featuring custom hover cards that reveal details.
6. **Visual Process Timeline:** Staggered vertical timeline with subtle scroll reveals detailing the 3-step execution process.
7. **Interactive Results (Before/After Slider):** A draggable before/after slider showing a paint correction process (uses image generator assets).
8. **Testimonial Slider:** Clean slider containing real quotes, customer avatars, and vehicle details.
9. **FAQ Accordion:** Clean dropdown accordions to address minor objections.
10. **Final CTA Banner:** High-contrast background banner card with lead form.

---

## 4. Mobile Responsive Strategy
* **Nav Menu:** Hamburger menu that slides in from the right with clean overlay animations.
* **Tables/Grids:** Multi-column grids must stack vertically on screens smaller than `768px` (tablet).
* **Before/After Slider:** Must support touch swipe gestures on mobile devices.
* **Font Scaling:** Ensure heading sizes use fluid typography (`clamp` or tailwind responsive text sizes e.g., `text-3xl md:text-5xl`) to prevent overflow.
