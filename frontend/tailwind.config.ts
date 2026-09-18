import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/screens/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Base canvas ────────────────────────────────────────────────────
        background: "#0C0E11",

        // ─── Surface depth system (4 levels) ────────────────────────────────
        surface: {
          DEFAULT: "#13161A", // surface-1: sidebars, panels, cards
          2: "#191D24",       // surface-2: hover states, active rows, wells
          3: "#1F242D",       // surface-3: composer dock, tooltips, popovers
          hover: "#191D24",   // alias for hover (keeps backward compat)
          container: "#191D24",
          "container-high": "#1F242D",
          "container-low": "#13161A",
          "container-lowest": "#0C0E11",
        },

        // ─── Borders ─────────────────────────────────────────────────────────
        border: "#252B34",

        // ─── Accent (ONE canonical green, resolves dual-token conflict) ───────
        primary: {
          DEFAULT: "#00A67E", // The single true accent — was primary-container
          hover: "#00926E",
          light: "#5ACBA3",   // Muted accent for secondary icon use
          fixed: "#7af9cc",
          subtle: "rgba(0, 166, 126, 0.10)",
        },

        // ─── Text ─────────────────────────────────────────────────────────────
        "text-primary": "#E8EAED",    // Slightly softer than pure white
        "text-secondary": "#8C95A6",  // Muted labels, timestamps, placeholders
        "text-tertiary": "#555F6E",   // Disabled, very faint hints

        // ─── Semantic states ──────────────────────────────────────────────────
        success: "#22C48A",   // Online, successful ops — brighter for dark surfaces
        error: "#E5534B",     // Errors, destructive — desaturated for less aggression
        warning: "#E8A020",   // Away status, reconnecting
        info: "#5B8DEF",      // System messages, informational toasts
      },

      // ─── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "monospace"],
      },

      // ─── Font sizes (design system scale) ────────────────────────────────────
      fontSize: {
        // display: call screen name, auth headlines
        display: ["2rem", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.03em" }],
        // h1: page section titles
        h1: ["1.375rem", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.02em" }],
        // h2: panel headers, modal titles
        h2: ["1.125rem", { lineHeight: "1.35", fontWeight: "600", letterSpacing: "-0.01em" }],
        // body: message text — bumped from 12px to 15px for readability
        body: ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        // ui: labels, nav, buttons, conversation names
        ui: ["0.8125rem", { lineHeight: "1.45", fontWeight: "500" }],
        // caption: timestamps, helper text, metadata
        caption: ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
        // micro: badges, status text
        micro: ["0.6875rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.01em" }],
      },

      // ─── Border radius (single documented schema) ─────────────────────────────
      borderRadius: {
        xs:   "4px",    // badges, inline tags, filter chips
        sm:   "8px",    // inputs, buttons, nav items, small cards
        md:   "12px",   // panels, message bubbles
        lg:   "16px",   // modals, popovers, large cards
        xl:   "20px",   // auth card, call card
        "2xl": "24px",
        full: "9999px", // avatars, pills, status dots
      },

      // ─── Spacing helpers ──────────────────────────────────────────────────────
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },

      // ─── Box shadows (tinted, not pure black) ────────────────────────────────
      boxShadow: {
        // Primary button hover glow
        "accent-sm": "0 4px 12px rgba(0, 166, 126, 0.22)",
        "accent-md": "0 6px 20px rgba(0, 166, 126, 0.28)",
        // Standard elevation shadows (cool-tinted, not pure black)
        "elev-1": "0 2px 8px rgba(0, 0, 0, 0.2)",
        "elev-2": "0 4px 16px rgba(0, 0, 0, 0.25)",
        "elev-3": "0 8px 32px rgba(0, 0, 0, 0.3)",
        // Inset highlight (top-edge glass shimmer)
        "inner-highlight": "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      },

      // ─── Animation / keyframes ────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "dot-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-up": "slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slide-down 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        "dot-bounce": "dot-bounce 1s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;
