/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          primary: "#252525",
          secondary: "#383838",
          background: "#F3F3F1",
          surface: "#FFFFFF",
          accent: "#F47C20",
          border: "#E2E2DF",
          text: "#1E1E1E",
          muted: "#6B7280"
        },
        status: {
          compliant: "#16A34A",
          warning: "#D97706",
          critical: "#DC2626",
          active: "#EA580C"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
