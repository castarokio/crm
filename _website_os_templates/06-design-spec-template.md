---
name: "Design Specification: [Client Name]"
colors:
  # Base background and surface colors
  background: "#0A0A0A"
  surface: "#121212"
  surface-hover: "#1A1A1A"
  border: "#222222"
  
  # Core Brand Colors
  primary: "#D4AF37"       # e.g., Luxury Gold
  primary-hover: "#B89025"
  secondary: "#1A1C1E"     # Deep Ink
  accent: "#B8422E"        # Active accents/alerts
  
  # Text Colors
  text-primary: "#FFFFFF"
  text-secondary: "#A0A0A0"
  text-muted: "#666666"

typography:
  fontFamily-headings: "Outfit, sans-serif"
  fontFamily-body: "Inter, sans-serif"
  h1:
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: "800"
    lineHeight: "1.1"
    letterSpacing: "-0.03em"
  h2:
    fontSize: "clamp(1.8rem, 4vw, 3rem)"
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
  body-lg:
    fontSize: "1.125rem"
    lineHeight: "1.6"
  body-md:
    fontSize: "1rem"
    lineHeight: "1.5"

rounded:
  button: "9999px"          # Fully rounded pills
  card: "16px"              # Smooth premium rounded corners
  input: "8px"

spacing:
  section-py: "clamp(4rem, 8vw, 8rem)"  # Fluid vertical padding
  container-px: "1.5rem"
---

# Design Rationale & Visual Style Rules

*The values defined in the YAML header above serve as the exact design tokens. Below are instructions explaining how to implement these design choices to create a premium, custom website.*

---

## 1. Visual Concepts & Preset Styles
Choose one of the 5 style presets to fill in the YAML tokens above:

### Style 1: Luxury Dark (Default Placeholders)
* **Background:** Deep black/near-black (`#0A0A0A`).
* **Accents:** Gold/Champagne (`#D4AF37`) or metallic silver (`#E5E5E5`).
* **Art Direction:** Deep shadows, fine gold borders, dark glassmorphism (backdrop-blur), high contrast, macro photography.
* **Animations:** Subtle slow reveals, elegant fade-ins, custom smooth cursor.

### Style 2: Clean Trust
* **Background:** Bright white (`#FFFFFF`) or off-white (`#F8F9FA`).
* **Accents:** Professional Navy (`#0A2540`) and Emerald Green (`#00D4B2`).
* **Art Direction:** Generous white space, clean borders, crisp photography, friendly icons.
* **Animations:** Simple slide-ups, clean hover transitions.

### Style 3: Bold Modern
* **Background:** High-contrast Dark or White.
* **Accents:** Neon Red (`#FF003C`), Electric Orange (`#FF5A00`), or Volt Yellow.
* **Art Direction:** Extremely heavy typography, staggered overlapping elements, dark overlay images, gritty patterns.
* **Animations:** Fast, springy transitions, marquee text loops.

### Style 4: Soft Premium
* **Background:** Cream (`#FAF6F0`) or beige.
* **Accents:** Warm Brown (`#5A3E2B`), Rose Clay, or Soft Olive (`#7B8C7C`).
* **Art Direction:** Soft rounded cards, editorial serif headings, warm photography, muted tone-on-tone color pairings.
* **Animations:** Dissolves, soft slide-ins.

### Style 5: Futuristic Tech
* **Background:** Dark Radial Gradient (`#05050A` center to `#010103` borders).
* **Accents:** Neon Cyan (`#00F0FF`), Purple (`#9D00FF`), and glowing overlays.
* **Art Direction:** Glassmorphism, neon mesh gradients, grid backdrops, tech-borders, code tags.
* **Animations:** Hover glows, floating cards, line drawing animations.

---

## 2. Layout Rules
* **No Generic 3-Card Grids:** When displaying cards, stagger the items vertically or vary their heights (`masonry` layout) or use an asymmetrical layout (e.g., 2/3 wide card on the left, 1/3 card on the right).
* **Negative Space:** Give headings room to breathe. Use the `section-py` spacing token to push sections apart. Avoid crowding elements.
* **Borders:** Instead of heavy black/gray borders, use semi-transparent borders (e.g., `border-white/10` in Tailwind) on dark layouts to keep the design premium and modern.

---

## 3. Micro-Animations & Interactivity
* **CTAs:** Every primary button must have a smooth hover state. If building in Framer Motion, implement a magnetic hover effect where the button moves slightly towards the cursor.
* **Scroll Reveals:** Use a custom wrap component (e.g., `<FadeIn>`) that reveals elements as they enter the browser viewport.
* **Transitions:** Keep all CSS transition durations around `300ms` with `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for a sleek, responsive feel.

---

## 4. Things to Avoid (Design Red Flags)
* [ ] Do not use standard plain blue (`#0000FF`) or plain green (`#00FF00`) colors. Always use curated, tailormade HSL/Hex variants.
* [ ] Do not use generic icons (like basic feather-icons or font-awesome defaults) in colored circles. Custom-drawn icons or styled SVG icons look much more premium.
* [ ] Do not write text without defining proper line heights (`leading-relaxed` or `leading-snug`).
* [ ] Do not use default shadow styles (`shadow-md`, `shadow-lg`) without customizing their opacity and spread to match the page background.
