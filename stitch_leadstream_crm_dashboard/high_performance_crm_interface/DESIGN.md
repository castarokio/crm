---
name: High-Performance CRM Interface
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  touch-target-min: 44px
---

## Brand & Style
The design system is engineered for high-velocity sales environments where cognitive load must be minimized to facilitate rapid decision-making. The brand personality is authoritative, reliable, and frictionless. 

Drawing from **Modern Corporate** aesthetics with a focus on **Functional Minimalism**, the system prioritizes utility and speed. The interface avoids decorative elements, instead using purposeful whitespace and a structured information hierarchy to guide the user’s eye toward active lead data and primary call controls. The emotional response is one of calm control and professional efficiency, ensuring that agents feel equipped rather than overwhelmed during high-stakes calls.

## Colors
The palette is anchored by a deep navy (`#0F172A`) to establish authority and provide high contrast for navigation. Professional blues are used for primary actions and interactive elements, ensuring they are instantly recognizable.

Semantic clarity is non-negotiable for status tracking: 
- **Emerald (#10B981)**: Indicates successful outcomes, saved states, and active connections.
- **Amber (#F59E0B)**: Marks pending tasks or leads requiring follow-up.
- **Slate (#64748B)**: Reserved for secondary information and neutral states.
- **Background (#F8FAFC)**: A cool, off-white gray reduces eye strain during long shifts compared to pure white.

## Typography
The system utilizes **Inter** for its exceptional legibility in data-heavy environments. The typographic scausele is optimized for "scannability"—using tight letter spacing on headlines to maintain a modern feel and generous line heights for body text to ensure readability during live conversations.

On mobile, headline sizes are reduced to prevent awkward text wrapping in narrow lead cards, while body sizes remain at 14-16px to ensure accessibility and touch-target alignment. Label styles use uppercase tracking to distinguish metadata from editable content.

## Layout & Spacing
The layout follows a **Fluid Grid** model with strict 8px/4px increments. For desktop views, a 12-column grid is used to separate the lead list from the active call workspace.

- **Mobile First**: All primary interaction zones (dial buttons, status updates) are strictly optimized for a minimum 44px height.
- **Density**: The interface maintains a "Comfortable-Efficient" balance. Lead cards use 16px internal padding to separate data points, while lists use 8px gutters to maximize the number of visible leads without feeling cluttered.
- **Breakpoints**: 
  - Mobile (< 768px): Single column, full-width cards, bottom-anchored action bars.
  - Tablet (768px - 1024px): Split-view (List/Detail) or 2-column grid.
  - Desktop (> 1024px): 3-column layout (Navigation / Lead List / Active Dashboard).

## Elevation & Depth
Depth is used functionally to indicate interactivity and hierarchy:
- **Level 0 (Background)**: Surface color `#F8FAFC`, used for the main application canvas.
- **Level 1 (Cards)**: White surfaces with a subtle, tight shadow (0px 2px 4px rgba(15, 23, 42, 0.05)) to distinguish individual leads.
- **Level 2 (Active/Hover)**: Elevated cards or floating action buttons use a more pronounced, diffused shadow (0px 10px 15px rgba(15, 23, 42, 0.1)) to suggest they are "lifted" for immediate focus.
- **Outlines**: 1px borders in Slate-200 are used for secondary containers to maintain a flat, fast-feeling UI without the weight of heavy shadows.

## Shapes
A "Rounded" shape language is applied consistently across the system to soften the professional aesthetic and make the interface feel modern.
- **Standard (8px)**: Used for buttons, input fields, and lead cards.
- **Large (16px)**: Used for main dashboard containers and modal windows.
- **Pill**: Reserved exclusively for Status Chips and Notification Badges to differentiate them from actionable buttons.

## Components
- **Lead Cards**: High-contrast headers with primary contact info. Key data points (Last Call, Lead Score) are arranged in a horizontal grid.
- **Quick-Select Status Chips**: High-saturation pill-shaped tags (e.g., "Interested," "No Answer," "Follow Up"). Use background tints with 10% opacity of the semantic color for inactive states, and 100% for the selected state.
- **Action Buttons**: Primary "Call" or "Save" buttons must be min-height 44px. Include a leading icon (e.g., Phone, Check) for instant recognition. 
- **Input Fields**: Labeled clearly with `label-md` style. Focused states use a 2px professional blue border and a soft outer glow.
- **Tab System**: Underlined style for desktop; segmented control style for mobile to ensure easy thumb-taps.
- **Call Timer Bar**: A sticky, high-elevation bar at the bottom (mobile) or top (desktop) providing constant visibility of the current call duration and the "Hang Up" (Red) action.