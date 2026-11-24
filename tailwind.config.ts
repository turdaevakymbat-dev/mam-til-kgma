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
        birch: {
          50: "#FAF9F5",
          100: "#F3F0E8",
          200: "#E6E0D2",
          300: "#D4CBB8",
          700: "#6E5A3E",
          800: "#4E3F2B",
        },
        pine: {
          50: "#EEF6F3",
          100: "#D5EAE2",
          600: "#1F5E4B",
          700: "#1B4D3E",
          800: "#143A2F",
        },
      },
    },
  },
  plugins: [],
};

export default config;
