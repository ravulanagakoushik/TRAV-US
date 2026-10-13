/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F3E8D7',        // Warm beige background
          surface: '#FFF9F0',   // Cream surfaces
          primary: '#5B3925',   // Primary brown
          sidebar: '#382416',   // Dark sidebar
          secondary: '#8B6344', // Secondary brown
          border: '#E2D1BC',    // Border
          text: '#382719',      // Deep brown-black text
          muted: '#7A624E',     // Muted text
          accent: '#A66B38',    // Highlight accent
          success: '#2E7D32',   // Muted operational green
          warning: '#C67D0A',   // Muted operational amber
          danger: '#B71C1C',    // Muted operational red
          info: '#1A649C',      // Operational info
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(56, 36, 22, 0.08), 0 1px 2px rgba(56, 36, 22, 0.04)',
        'warm': '0 4px 12px rgba(56, 36, 22, 0.08), 0 2px 4px rgba(56, 36, 22, 0.04)',
        'warm-lg': '0 12px 28px rgba(56, 36, 22, 0.12), 0 4px 8px rgba(56, 36, 22, 0.06)',
      }
    },
  },
  plugins: [],
}
