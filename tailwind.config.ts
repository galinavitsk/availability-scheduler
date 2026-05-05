import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["Cormorant Garamond", "Georgia", "serif"],
        heading: ["Cinzel", "Georgia", "serif"],
      },
      colors: {
        parchment: {
          base: "#f4e8d0",
          light: "#fdf8e9",
          dark: "#e3d5b8",
        },
        burgundy: {
          DEFAULT: "#7a1f1f",
          dark: "#5a1515",
        },
        gold: {
          DEFAULT: "#b8860b",
          light: "#c9a961",
        },
        ink: {
          DEFAULT: "#2c241b",
          light: "#4a3f32",
        },
      },
    },
  },
  
  plugins: [],
} satisfies Config;
