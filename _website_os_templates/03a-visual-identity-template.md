# Visual Identity Specifications: [Client Name]

*Use this document to define and identify the exact graphic, color, and typographical rules that form the brand's unique visual signature. This bridges the gap between Brand Direction and technical coding specifications.*

---

## 1. Logo Specifications & Usage
Identify the exact rules for the company's logos to prevent distortion or low-contrast rendering:
* **Primary Logo:**
  * File location: `[e.g., /assets/logo-primary.svg]`
  * Usage: Main navigation header, invoices, and light/dark contrasting banners.
* **Secondary / Icon-Only Logo:**
  * File location: `[e.g., /assets/logo-mark.svg]`
  * Usage: Favicons, mobile menu footers, profile pictures, and overlay watermarks.
* **Contrast Rules:**
  * Dark backgrounds: Use the white/negative version (`[e.g., logo-white.svg]`).
  * Light backgrounds: Use the full-color/black version (`[e.g., logo-dark.svg]`).
* **Exclusion Zone:**
  * Minimum padding around the logo must equal `20%` of the logo's total width to ensure visibility and prevent crowding by navigation items.

---

## 2. Brand Color Palette (HSL & HEX)
Define the core color tokens with their exact HSL and Hex coordinates:
* **Primary Brand Accent (Brand Identifier):**
  * Hex: `[e.g., #d6b034ff]` | HSL: `hsl(47, 65%, 53%)`
  * Role: Primary buttons, highlighted copy, text anchors, active focus outlines.
* **Secondary Brand Accent (Supporting Brand Tone):**
  * Hex: `[e.g., #1A1C1E]` | HSL: `hsl(210, 8%, 11%)`
  * Role: Subtle backgrounds, category tags, card borders.
* **Neutral Dark (Backgrounds & Text):**
  * Hex: `[e.g., #0A0A0A]` | HSL: `hsl(0, 0%, 4%)`
  * Role: Deep backgrounds, primary dark panels.
* **Neutral Light (Text & Details):**
  * Hex: `[e.g., #FFFFFF]` | HSL: `hsl(0, 0%, 100%)`
  * Role: Primary body copy, icons, light panels.
* **Semantic Colors (Status Indicators):**
  * **Success:** `hsl(142, 70%, 45%)` (Green)
  * **Warning:** `hsl(38, 92%, 50%)` (Orange/Yellow)
  * **Error:** `hsl(0, 84%, 60%)` (Red)

---

## 3. Typography System
Identify the font family stack, sizes, line heights, and weights for headings and body copy:
* **Heading Typography:**
  * Font Family: `[e.g., Outfit, Inter, sans-serif]` (via Google Fonts)
  * Font Weights: `700 (Bold)` or `800 (Extra Bold)`.
  * Letter Spacing: `-0.02em` (headings look more premium when slightly condensed).
* **Body Typography:**
  * Font Family: `[e.g., Inter, sans-serif]`
  * Font Weights: `400 (Regular)` for body, `600 (Semi-Bold)` for emphasized text.
  * Line Heights: `1.6` for long paragraphs, `1.4` for short taglines.
* **Responsive Font Scale:**
  * **Main Title (H1):** `clamp(2.2rem, 5vw, 4rem)` (scales smoothly from mobile to large screens).
  * **Sub-Heading (H2):** `clamp(1.7rem, 4vw, 2.5rem)`.
  * **Paragraph (Body):** `1rem` (default text size).

---

## 4. UI Elements & Graphic Style Rules
Define the exact design rules for building interactive user interface components:
* **Border Radii (Corners):**
  * Buttons: `[e.g., 9999px (Fully Pill-shaped) / 8px (Soft Rectangular)]`
  * Cards: `[e.g., 16px (Premium Smooth Curve)]`
  * Inputs: `[e.g., 6px]`
* **Button Component States:**
  * **Idle:** Background is primary accent color, text is white.
  * **Hover/Focus:** Scale button by `1.03` with a subtle glow shadow (`box-shadow: 0 4px 20px rgba(primary_color, 0.4)`).
  * **Disabled:** Opacity reduced to `50%`, cursor set to `not-allowed`.
* **Card & Container Styling:**
  * Background: `[e.g., Glassmorphism: rgba(255,255,255,0.03) with backdrop-filter: blur(12px)]`.
  * Border: `[e.g., 1px solid rgba(255,255,255,0.08)]`.
  * Shadows: Soft radial dark ambient shadows instead of sharp dark outlines.

---

## 5. Visual Asset Specifications
Define rules for supporting image layouts, icons, and vector details:
* **Icon Set:**
  * Family: `[e.g., Lucide React / FontAwesome 6 / Styled Custom SVGs]`
  * Styling: Stroke width of `1.75px` (clean and readable). Do not mix filled and outlined icons.
* **Photography Style:**
  * Tone: `[e.g., High-contrast dark photography with golden focal points / Muted earthy pastel images]`.
  * Aspect Ratio: Use `16:9` for wide banners, `4:5` (portrait) for team cards.
