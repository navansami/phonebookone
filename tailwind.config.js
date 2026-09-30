/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./ui/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#d4af37',
          light: '#e6c55e',
          dark: '#b8992f',
          50: '#fdfbf5',
          100: '#faf6e8',
          200: '#f4eac7',
          300: '#eddda6',
          400: '#e6c55e',
          500: '#d4af37',
          600: '#b8992f',
          700: '#9a7f26',
          800: '#7c651e',
          900: '#5e4d17',
        },
        dark: {
          bg: '#0f172a',
          bg2: '#1e293b',
          card: '#1e293b',
          side: '#020617',
          border: '#334155',
        },
        light: {
          bg: '#f8fafc',
          bg2: '#ffffff',
          card: '#ffffff',
          side: '#1e293b',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(212, 175, 55, 0.3)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
