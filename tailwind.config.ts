import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        // Contentsathi primary brand colours
        primary: {
          50:  "#f0f0ff",
          100: "#e5e5ff",
          200: "#cdcdff",
          300: "#a8a8ff",
          400: "#8080ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b"
        },

        // Platform colours — use for badges
        platform: {
          instagram: "#E1306C",
          linkedin:  "#0A66C2",
          youtube:   "#FF0000",
          whatsapp:  "#25D366",
          x:         "#000000",
          facebook:  "#1877F2",
          website:   "#F97316"
        },

        // Language badge colours
        language: {
          english:   "#3B82F6",
          hindi:     "#EF4444",
          marathi:   "#8B5CF6",
          hinglish:  "#F59E0B"
        },

        // Status colours
        status: {
          draft:      "#94A3B8",
          ready:      "#3B82F6",
          scheduled:  "#F59E0B",
          published:  "#10B981",
          failed:     "#EF4444"
        },

        // Quality score colours
        quality: {
          great:  "#10B981",
          good:   "#F59E0B",
          needs:  "#EF4444"
        },

        // Urgency colours for suggestions
        urgency: {
          high:   "#EF4444",
          medium: "#F59E0B",
          low:    "#10B981"
        },

        // App background and surface
        surface: {
          bg:       "#F8F7FF",
          card:     "#FFFFFF",
          border:   "#E5E7EB",
          muted:    "#F3F4F6",
          dark:     "#1A1A2E"
        }
      },

      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans Devanagari",
          "system-ui",
          "-apple-system",
          "sans-serif"
        ],
        devanagari: [
          "Noto Sans Devanagari",
          "Mukta",
          "sans-serif"
        ]
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }]
      },

      borderRadius: {
        "4xl": "2rem"
      },

      boxShadow: {
        card:   "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        modal:  "0 20px 60px rgba(99,102,241,0.15)",
        toast:  "0 8px 24px rgba(0,0,0,0.12)",
        button: "0 2px 8px rgba(99,102,241,0.30)"
      },

      animation: {
        "fade-in":     "fadeIn 0.2s ease-out",
        "slide-up":    "slideUp 0.3s ease-out",
        "slide-down":  "slideDown 0.3s ease-out",
        "pulse-soft":  "pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":   "spin 3s linear infinite"
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%":   { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)",   opacity: "1" }
        },
        slideDown: {
          "0%":   { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" }
        }
      },

      screens: {
        "xs": "375px",
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px"
      }
    }
  },

  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ]
};

export default config;
