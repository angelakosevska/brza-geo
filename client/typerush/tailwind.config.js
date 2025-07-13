// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // LIGHT THEME
        lightTheme: {
          imperial: "#ff4747",       // bright red
          verdigris: "#36bfb6",      // teal green
          gold: "#ffd633",           // yellow-gold
          celestial: "#4e9ad0",      // blue
          isabelline: "#f8f6f2",     // light background
          eerie: "#1f1f1f",          // text black
        },
        // DARK THEME
        darkTheme: {
          imperial: "#ff6b6b",       // slightly brighter red
          verdigris: "#2fa9a1",      // cooler green
          gold: "#ffc400",           // gold in dark
          celestial: "#2c6ca8",      // darker blue
          isabelline: "#1f1f1f",     // dark background
          eerie: "#f8f6f2",          // light text
        },
      },
    },
  },
  plugins: [],
};
