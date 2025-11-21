/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // GitHub Primer 暗色主题配色
        'gh-canvas-default': '#0d1117',
        'gh-canvas-subtle': '#161b22',
        'gh-border-default': '#30363d',
        'gh-border-muted': '#21262d',
        'gh-fg-default': '#c9d1d9',
        'gh-fg-muted': '#8b949e',
        'gh-fg-subtle': '#6e7681',
        'gh-accent-emphasis': '#1f6feb',
        'gh-accent-fg': '#58a6ff',
        'gh-success-emphasis': '#238636',
        'gh-danger-emphasis': '#da3633',
      },
    },
  },
  plugins: [],
}
