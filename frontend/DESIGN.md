---
version: "2.0"
name: "Modern SaaS Minimalism"
description: "Refined, distraction-free minimalist design system for high-performance real-time communication. Clean typography, disciplined palette, and generous whitespace."
colors:
  primary: "#00A67E"
  secondary: "#16191E"
  tertiary: "#0D0F12"
  neutral: "#9CA3AF"
  surface: "#16191E"
  background: "#0D0F12"
  border: "#23272F"
  text-primary: "#F3F4F6"
  text-secondary: "#9CA3AF"
  success: "#10B981"
  error: "#EF4444"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.25
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: 500
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
    fontWeight: 600
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "24px"
---

## Overview

Modern SaaS Minimalism is an ultra-clean, functional, and distraction-free design system crafted for a next-generation WebRTC communication platform. The aesthetic is inspired by the calm precision and understated elegance of modern software (e.g. Linear, Raycast, and Apple interfaces). 

It prioritizes clarity over ornamentation:
- **Density:** 3/10 — Airy, spacious, relaxed rhythm.
- **Variance:** 2/10 — Restrained, highly consistent.
- **Motion:** 3/10 — Subtle, smooth micro-transitions (150–200ms ease-out).
- **Style:** Minimalist, Editorial, Intelligent, Calm.
- **Tone:** Professional, reliable, human-centric. No sci-fi jargon, no faux-telemetry cockpit panels, no neon clutter.

## Colors

- **Background Canvas (`#0D0F12`):** Deep, tranquil charcoal. Not pure pitch black, providing eye comfort.
- **Elevated Surface (`#16191E`):** Distinct layer for cards, sidebars, modal containers, and list items.
- **Surface Hover / Active (`#1E222A`):** Responsive feedback state for clickable containers and list rows.
- **Border / Divider (`#23272F` / `rgba(255, 255, 255, 0.08)`): Crisp, hairline 1px strokes defining components without visual heaviness.
- **Primary Accent (`#00A67E`):** Emerald teal. Used purposefully for primary actions, active indicator dots, focus rings, and unread counts.
- **Primary Text (`#F3F4F6`):** High-contrast, clean off-white for maximum legibility.
- **Secondary / Muted Text (`#9CA3AF`):** Soft neutral gray for labels, timestamps, and supporting microcopy.
- **Success / Online (`#10B981`):** Subdued vibrant emerald for online presence badges and successful operations.
- **Destructive / Error (`#EF4444`):** Refined coral-red for errors, missed calls, and destructive confirmations.

## Typography

The type system relies on **Inter** for all interface copy and headlines to ensure pristine geometric rhythm. **JetBrains Mono** is strictly reserved for technical data points (OTP codes, call duration timers, file sizes).

- **Headline Display:** Inter — 700 bold, -0.02em letter spacing.
- **Section Headers (H2):** Inter — 600 semibold, 1.5rem.
- **Body Regular:** Inter — 400 regular, 1rem (16px), 1.6 line-height.
- **UI Labels & Captions:** Inter — 500 medium, 0.875rem (14px).
- **Code & Numbers:** JetBrains Mono — 500 medium, used only when monospace tabular alignment is needed.

## Layout & Rhythm

- **Base Unit:** 8px (`0.5rem`). All margins and paddings are multiples of 8px (8px, 16px, 24px, 32px, 48px).
- **Container Widths:** 
  - Centered Form/Auth cards: 420px – 460px max width.
  - App Shell / Dashboard: Max 1280px or fluid 100vw, with 320px sidebar and fluid chat stream.
  - Modals & Dialogs: 440px max width.
- **Whitespace:** Generous spacing around text and between form elements to eliminate cognitive overload.

## Components & Visual Treatment

- **Primary Buttons:** Solid `#00A67E` background, white text, 8px corner radius, 10px 18px padding. Hover: subtle brightness lift (no heavy glows). Active: subtle scale press (0.99).
- **Secondary / Ghost Buttons:** Transparent or `#1E222A` background, 1px border in `#23272F`, `#F3F4F6` text.
- **Inputs & Form Controls:** 
  - Label positioned strictly above the input in `#9CA3AF` (13px, font-medium).
  - Background: `#0D0F12` or `#13151A`.
  - Border: 1px `#23272F`.
  - Corner radius: 8px.
  - Focus state: 2px `#00A67E` ring with 1px dark offset.
  - Placeholder: `#6B7280`.
- **Cards & Modals:** `#16191E` solid fill, 1px `#23272F` border, 12px or 16px corner radius, ambient soft shadow (`0 4px 20px rgba(0, 0, 0, 0.3)`).
- **Avatars:** Rounded-full (or 10px rounded squircle), clear high-contrast fallback initials, clean `#10B981` status dot.
- **Empty States:** Subtle line icon in `#9CA3AF`, concise header, 1-line description, and single primary action.

## Do's & Don'ts

- **Do** emphasize whitespace, content readability, and typographic structure.
- **Do** keep form layouts centered, balanced, and straightforward.
- **Do** use subtle 1px borders and gentle contrast differences.
- **Don't** add fake telemetry widgets, sci-fi latency graphs, or complicated cockpit meters.
- **Don't** use neon gradients, high-contrast glow effects, or busy backgrounds.
- **Don't** clone WhatsApp or Telegram layout patterns (e.g. green top banners or standard mobile drawer clones); maintain an original desktop/web product feel.
- **Don't** use emojis in place of clean UI iconography.
