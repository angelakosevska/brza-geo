export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%, 25%": { opacity: 0 },
          "35%, 65%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        fadeOut: {
          "0%, 25%": { opacity: 1 },
          "35%, 65%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        fadeIn: "fadeIn 6s ease-in-out infinite",
        fadeOut: "fadeOut 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
