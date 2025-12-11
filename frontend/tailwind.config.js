/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                terminal: {
                    bg: '#0d1117',
                    surface: '#161b22',
                    elevated: '#1c2128',
                    border: '#30363d',
                    text: '#c9d1d9',
                    muted: '#8b949e',
                    dim: '#6e7681',
                },
                accent: {
                    green: '#4ade80',
                    amber: '#fbbf24',
                    red: '#f87171',
                    cyan: '#22d3ee',
                    purple: '#a78bfa',
                },
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
            },
            animation: {
                'cursor-blink': 'blink 1s step-end infinite',
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                blink: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
