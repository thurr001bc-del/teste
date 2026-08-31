import type { Config } from "tailwindcss";

const withAlpha = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: withAlpha("--background"),
        surface: withAlpha("--surface"),
        "surface-2": withAlpha("--surface-2"),
        "surface-3": withAlpha("--surface-3"),
        border: withAlpha("--border"),
        "border-strong": withAlpha("--border-strong"),
        muted: withAlpha("--muted"),
        foreground: withAlpha("--foreground"),
        "foreground-muted": withAlpha("--foreground-muted"),
        "foreground-subtle": withAlpha("--foreground-subtle"),
        accent: withAlpha("--accent"),
        "accent-soft": withAlpha("--accent-soft"),
        "accent-foreground": withAlpha("--accent-foreground"),
        success: withAlpha("--success"),
        warning: withAlpha("--warning"),
        info: withAlpha("--info"),
        danger: withAlpha("--danger"),
        ring: withAlpha("--ring"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.12)",
        elevated:
          "0 2px 4px rgba(0,0,0,0.04), 0 18px 40px -18px rgba(0,0,0,0.22)",
        glow: "0 0 0 1px hsl(var(--accent) / 0.25), 0 12px 40px -12px hsl(var(--accent) / 0.45)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease forwards",
        "scale-in": "scale-in 0.25s ease forwards",
        shimmer: "shimmer 1.6s infinite",
        "slide-up": "slide-up 0.4s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
