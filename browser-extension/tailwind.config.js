/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.tsx"],
  theme: {
    fontFamily: {
      'sans': ['Inter', 'sans-serif'],
    },
    extend: {
      spacing: {
        '94': '22rem',
        '100': '25rem',
        '114': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '6': '6px',
      },
      colors: {
        'light-green': '#C8ECDF',
        'light-green-30': '#43695C4D',
        'light-green-60': '#2b463d99',
        'green': '#57BB97',
        'dark-green': '#2B463D',
        'red': '#c07676',
        'yellow': '#dfca7e',
      }
    },
  },
  plugins: [],
}

