/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0A0A0A',
          light: '#262626',
        },
        alabaster: {
          DEFAULT: '#F9F9F9',
          dark: '#F2F2F2',
        },
        gold: {
          DEFAULT: '#B89B72',
          light: '#D4AF8C',
          muted: '#8A7353',
        },
        crimson: {
          DEFAULT: '#991B1B',
          light: '#EF4444',
          bg: '#FEF2F2',
        },
        border: {
          DEFAULT: '#E5E5E5',
          dark: '#D4D4D4',
        }
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        elevated: '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
        modal: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}

