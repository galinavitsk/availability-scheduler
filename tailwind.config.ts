import type { Config } from "tailwindcss";
import daisyui from "daisyui"

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {},
  daisyui: {
    themes: [
      {
        primaryTheme: {
          "primary": "#55ccc9",
          "secondary": "#833500",
          "accent": "#365973",
          "neutral": "#c2baa6",
          "base-100": "#F5ECD7",
          "info": "#abacea",
          "success": "#346145",
          "warning": "#ffc941",
          "error": "#bb2649",
        },
      },
    ],
  },
  plugins: [daisyui],
} satisfies Config;
