/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#050505",
                foreground: "#ffffff",
                accent: {
                    DEFAULT: "#a3e635",
                    foreground: "#000000",
                },
                zinc: {
                    950: "#050505",
                }
            },
        },
    },
    plugins: [],
}
