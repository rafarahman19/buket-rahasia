import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FFFBF7",
          warm: "#FBF4EC",
          card: "#FFFDF9",
          border: "#EFE2D5",
        },
        blush: {
          50: "#FFF5F7",
          100: "#FFE8ED",
          200: "#FCD2DC",
          300: "#F7AEC0",
          400: "#EE829D",
          500: "#DF5B7D",
          600: "#C43E63",
          700: "#A12D4E",
        },
        sage: {
          50: "#F4F8F4",
          100: "#E5EFE6",
          200: "#CCE0CE",
          300: "#A8C8AC",
          400: "#82AC87",
          500: "#5F8D65",
          600: "#49714E",
        },
        lavender: {
          50: "#F8F6FC",
          100: "#EFEBF9",
          200: "#DFD7F3",
          300: "#C5B6E8",
          400: "#A790DA",
          500: "#886CC6",
        },
        ink: {
          DEFAULT: "#3B2E2A",
          soft: "#665550",
          muted: "#8C7A74",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        script: ["var(--font-caveat)", "cursive"],
      },
      boxShadow: {
        cozy: "0 10px 30px -10px rgba(139, 95, 95, 0.14)",
        petal: "0 4px 16px -4px rgba(223, 91, 125, 0.22)",
        card: "0 6px 24px -8px rgba(74, 53, 47, 0.1)",
      },
      keyframes: {
        "float-petal": {
          "0%, 100%": {
            transform: "translateY(0px) translateX(0px) rotate(0deg)",
          },
          "50%": {
            transform: "translateY(-14px) translateX(8px) rotate(8deg)",
          },
        },
        "pop-spring": {
          "0%": {
            opacity: "0",
            transform: "scale(0.55) translateY(10px)",
          },
          "70%": {
            opacity: "1",
            transform: "scale(1.06) translateY(-2px)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
      },
      animation: {
        "float-petal": "float-petal 7s ease-in-out infinite",
        "pop-spring": "pop-spring 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
