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
        green: "hsl(var(--green) 42% 54%)",
        red: "hsl(var(--red) 42% 54%)",
        yellow: "hsl(var(--yellow) 52% 64%)",

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
