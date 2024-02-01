/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.tsx"],
  theme: {
    extend: {
      spacing: {
        '400': '400px',
      },
      borderRadius: {
        '6': '6px',
      },
      colors: {
        'light-green': '#C8ECDF',
        'light-green-30': '#43695C4D',
        'green': '#57BB97',
        'dark-green': '#2B463D',
        'red': '#c07676',
        'yellow': '#dfca7e',
      }
    },
  },
  plugins: [],
}

