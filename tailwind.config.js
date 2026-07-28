/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#060911",
          card: "#0b101c",
          border: "#1b2438",
          hover: "#141c2e",
        },
        brand: {
          blue: "#2563eb",
          cyan: "#38bdf8",
          glow: "#3b82f6",
        }
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, rgba(59, 130, 246, 0.07) 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
};
