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
        background: "#0D0F12",
        surface: "#16191E",
        "surface-hover": "#1E222A",
        "surface-container": "#192029",
        "surface-container-high": "#232a34",
        "surface-container-low": "#151c25",
        "surface-container-lowest": "#080f17",
        border: "#23272F",
        primary: {
          DEFAULT: "#00A67E",
          hover: "#008f6c",
          light: "#5bdcb0",
          fixed: "#7af9cc",
        },
        "text-primary": "#F3F4F6",
        "text-secondary": "#9CA3AF",
        success: "#10B981",
        error: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;
