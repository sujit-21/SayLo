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
        saylo: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          emerald: '#00a884', // Saylo signature teal-green
          teal: '#128c7e',
          darkgreen: '#075e54',
          lightgreen: '#25d366',
          panel: '#111b21',
          panelDarker: '#0c1317',
          headerDark: '#202c33',
          borderDark: '#222d34',
          chatBgDark: '#0b141a',
          incomingDark: '#202c33',
          outgoingDark: '#005c4b',
          mutedTextDark: '#8696a0',
          lightBg: '#f0f2f5',
          lightIncoming: '#ffffff',
          lightOutgoing: '#d9fdd3',
        }
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'Helvetica Neue',
          'Helvetica',
          'Lucida Grande',
          'Arial',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

