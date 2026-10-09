/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f4',
          100: '#dbeee5',
          200: '#b8ddcd',
          300: '#8ac4ad',
          400: '#5ba68a',
          500: '#3a8b6e',
          600: '#2a6f56',
          700: '#225946',
          800: '#1d4739',
          900: '#173b30',
          950: '#0b201a',
        },
        terracotta: {
          50: '#fdf6f2',
          100: '#fbe9e0',
          200: '#f6d1c0',
          300: '#efb097',
          400: '#e48566',
          500: '#c85a32',
          600: '#bb4c27',
          700: '#9b3c1e',
          800: '#7d331d',
          900: '#672e1c',
        },
        ivory: {
          50: '#ffffff',
          100: '#fdfcf9',
          200: '#f8f6f0',
          300: '#f2eee3',
          400: '#e5decb',
          500: '#d3c9af',
          600: '#b8ab8d',
        },
        charcoal: {
          50: '#f6f7f8',
          100: '#ebecee',
          200: '#d4d6db',
          300: '#b2b6bf',
          400: '#8b919e',
          500: '#6d7382',
          600: '#565c6c',
          700: '#464a57',
          800: '#3a3e49',
          900: '#1e2127',
          950: '#14161a',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'Manrope', 'sans-serif'],
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
