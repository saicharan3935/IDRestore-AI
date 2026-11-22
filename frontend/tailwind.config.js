/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#050709', // Main background
          900: '#0B1117', // Secondary background
          850: '#101820', // Panel background
          800: '#17232C', // Elevated surface
          700: '#22323D', // Hover / border subtle
          600: '#2E414F', // Borders
        },
        electric: {
          cyan: '#00E5FF',
          hover: '#33EBFF',
          glow: 'rgba(0, 229, 255, 0.25)',
        },
        laser: {
          mint: '#00FFA3',
          glow: 'rgba(0, 255, 163, 0.25)',
        },
        platinum: {
          silver: '#DCE7EC',
          dim: '#A3B4BC',
        },
        warning: {
          amber: '#FFB547',
        },
        danger: {
          red: '#FF5C5C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px -5px rgba(0, 229, 255, 0.2)',
        'cyan-strong': '0 0 35px 0px rgba(0, 229, 255, 0.35)',
        'mint-glow': '0 0 25px -5px rgba(0, 255, 163, 0.2)',
        'glass-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(220, 231, 236, 0.08)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'metallic-grid': 'linear-gradient(to right, #101820 1px, transparent 1px), linear-gradient(to bottom, #101820 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}
