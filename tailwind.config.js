// tailwind.config.js
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'media', // For system-based dark mode
    theme: {
      extend: {
        colors: {
          background: 'var(--background)',
          foreground: 'var(--foreground)'
        }
      },
    },
    plugins: [],
  }