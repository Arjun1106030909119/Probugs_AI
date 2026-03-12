/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    light: '#a855f7', // Purple
                    DEFAULT: '#8b5cf6',
                    dark: '#7c3aed',
                },
                background: '#0f172a', // Slate-900
                surface: '#1e293b', // Slate-800
            }
        },
    },
    plugins: [],
}
