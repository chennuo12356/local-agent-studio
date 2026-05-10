/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#f6f7f9",
          panel: "#ffffff",
          line: "#e2e6ee",
          muted: "#7b8493",
          ink: "#171a22",
          accent: "#7c8cff"
        }
      }
    }
  },
  plugins: []
};
