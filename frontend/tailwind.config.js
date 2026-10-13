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
        sans: ['Inter', 'Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(56, 36, 22, 0.08), 0 1px 2px rgba(56, 36, 22, 0.04)',
        'warm': '0 4px 12px rgba(56, 36, 22, 0.08), 0 2px 4px rgba(56, 36, 22, 0.04)',
        'warm-md': '0 8px 20px rgba(56, 36, 22, 0.10), 0 3px 6px rgba(56, 36, 22, 0.05)',
        'warm-lg': '0 12px 28px rgba(56, 36, 22, 0.12), 0 4px 8px rgba(56, 36, 22, 0.06)',
        'warm-xl': '0 20px 38px rgba(56, 36, 22, 0.16), 0 8px 16px rgba(56, 36, 22, 0.08)',
        'warm-2xl': '0 25px 50px -12px rgba(56, 36, 22, 0.22)',
        'warm-glow': '0 0 25px rgba(166, 107, 56, 0.25)',
        'accent-glow': '0 8px 25px rgba(166, 107, 56, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.04)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite linear',
        fadeIn: 'fadeIn 0.25s ease-out forwards',
      }
    },
  },
  plugins: [],
}
