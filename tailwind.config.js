/** @type {import('tailwindcss').Config} */
const emeraldPalette = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020408', // Fundo preto profundo
          900: '#0a0f14', // Painéis estruturados em cinza-escuro
          800: '#0b2218', // Bordas subtis em tom verde escuro
        },
        zinc: {
          950: '#020408',
          900: '#0a0f14',
          800: '#0b2218',
        },
        neutral: {
          950: '#020408',
          900: '#0a0f14',
          800: '#0b2218',
        },
        blue: {
          400: '#34d399',
          500: '#10b981', // Verde esmeralda nos ícones e links
          600: '#059669', // Verde nos botões
          700: '#047857',
          900: '#064e3b',
          950: '#022c22',
        },
        red: emeraldPalette,
        rose: emeraldPalette,
      },
    },
  },
  plugins: [],
};
