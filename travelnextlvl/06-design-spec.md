---
version: alpha
name: travelnextlvl.de
description: Dark, cinematic travel landing page with oversized condensed hero typography, airy blue-sky photography, white-on-image text treatment, and minimal card/button chrome.
colors:
  primary: "#f1f1f1"
  secondary: "#121212"
  tertiary: "#374151"
  neutral: "#010101"
  surface: "#121212"
  on-surface: "#f1f1f1"
  background: "#121212"
  accent: "#ffffff"
  error: "#d14343"
typography:
  fontFamily: "Fs R, sans-serif"
  headline-display:
    fontFamily: "Fs R, sans-serif"
    fontSize: 66px
    fontWeight: 400
    lineHeight: 79px
    letterSpacing: 0.0945px
  headline-lg:
    fontFamily: "Fs R, sans-serif"
    fontSize: 46px
    fontWeight: 400
    lineHeight: 72.765px
    letterSpacing: 0.0945px
  headline-md:
    fontFamily: "Fs R, sans-serif"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 38px
    letterSpacing: 0.0945px
  body-lg:
    fontFamily: "Fs R, sans-serif"
    fontSize: 15.12px
    fontWeight: 400
    lineHeight: 23px
    letterSpacing: 0.72576px
  body-md:
    fontFamily: "Fs R, sans-serif"
    fontSize: 15.12px
    fontWeight: 400
    lineHeight: 23px
    letterSpacing: 0.72576px
  body-sm:
    fontFamily: "Fs R, sans-serif"
    fontSize: 9.45px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
  label-lg:
    fontFamily: "Fs R, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
  label-md:
    fontFamily: "Fs R, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
  label-sm:
    fontFamily: "Fs R, sans-serif"
    fontSize: 9.45px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 6px
  sm: 14px
  md: 28px
  lg: 38px
  xl: 52px
components:
  button:
    primary:
      backgroundColor: "{colors.primary}"
      color: "{colors.secondary}"
      borderRadius: "{rounded.sm}"
      borderWidth: 1px
      borderStyle: solid
      borderColor: transparent
      padding: 8px 16px
      minWidth: 120px
      minHeight: 85px
      fontFamily: "{typography.fontFamily}"
      fontSize: 16px
      fontWeight: 400
      textDecoration: none
      boxShadow: none
    secondary:
      backgroundColor: "{colors.primary}"
      color: "{colors.neutral}"
      borderRadius: "{rounded.none}"
      borderWidth: 1px
      borderStyle: solid
      borderColor: "#f1f1f126"
      padding: 8px 16px
      minWidth: 120px
      minHeight: 85px
      fontFamily: "{typography.fontFamily}"
      fontSize: 16px
      fontWeight: 400
      textDecoration: none
      boxShadow: none
    link:
      backgroundColor: transparent
      color: "{colors.primary}"
      borderRadius: "{rounded.none}"
      borderWidth: 0px
      borderStyle: none
      borderColor: transparent
      padding: 0px
      minWidth: 0px
      minHeight: 0px
      fontFamily: "{typography.fontFamily}"
      fontSize: 9.45px
      fontWeight: 400
      textDecoration: underline
      boxShadow: none
  card:
    backgroundColor: "{colors.surface}"
    color: "{colors.on-surface}"
    borderColor: "{colors.tertiary}"
    borderRadius: "{rounded.md}"
    borderWidth: 1px
    borderStyle: solid
    padding: 16px
    boxShadow: none
---

# Design Rationale & Visual Style Rules

## 1. Colors
- **App Canvas:** `secondary` (#121212) or absolute black `neutral` (#010101).
- **Text Layering:** White/near-white `primary` (#f1f1f1) text layered directly over dark photography.
- **Borders:** Subtle, faint outlines using `tertiary` (#374151) or translucent highlights to preserve a clean, premium visual aesthetic.
- **No drop shadows:** Leverage raw outlines and translucent panels instead of elevation blur.

## 2. Typography
- **Heading Family:** Oswald (as Fs R proxy) in an oversized, tall, condensed form.
- **Body Family:** Space Grotesk / Inter with positive letter tracking to create breathing space.
- **Case treatment:** Large display elements should be set in UPPERCASE where appropriate.

## 3. Layout Rules
- **Viewport Coverage:** Full-bleed hero section centered on high-quality blue sky and water imagery.
- **Asymmetric alignment:** Clean left-aligned display headings with elements spaced wide enough to maintain an airy feel.
- **Teaser panels:** Compact content teasers with faint borders and rectilinear geometry.
