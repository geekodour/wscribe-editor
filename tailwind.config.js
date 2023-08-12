/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "sans-serif"],
        mono: ["SourceCodePro", "sans-serif"],
      },
    },
  },
  plugins: [],
};
