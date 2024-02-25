/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.{ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        94: "22rem",
        104: "26rem",
        112: "28rem",
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      colors: {
        green: "#57BB97",
        red: "#c07676",
        yellow: "#dfca7e",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsla(var(--primary))",
          // foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsla(var(--muted))",
          // foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          // foreground: "hsl(var(--accent-foreground))",
        },
      },
    },
  },
  plugins: [],
};
