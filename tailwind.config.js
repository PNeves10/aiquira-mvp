export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class', // Alterado para 'class' para suporte ao modo escuro
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Azul primário
        secondary: '#64748b', // Cinza secundário
        danger: '#dc2626', // Vermelho para perigos
      },
      boxShadow: {
        soft: '2px 2px 10px rgba(0, 0, 0, 0.1)', // Sombra suave
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};