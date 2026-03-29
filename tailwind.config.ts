import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/**/*.{ts,tsx}',
        './analysis.html',
        './popup.html',
    ],
    theme: {
        extend: {
            colors: {
                navy: {
                    950: '#050A14',
                    900: '#0A1428',
                    800: '#0F1E3C',
                    700: '#142850',
                    600: '#1A3264',
                    500: '#203C78',
                },
                cyan: {
                    DEFAULT: '#00F5FF',
                    400: '#33F7FF',
                    500: '#00F5FF',
                    600: '#00D4DD',
                    700: '#00B3BB',
                },
                eval: {
                    brilliant: '#26C6DA',
                    best: '#4CAF50',
                    good: '#96BC4B',
                    inaccuracy: '#F7C631',
                    mistake: '#E58F2A',
                    miss: '#FF5252',
                    blunder: '#CA3431',
                    book: '#B0BEC5'
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-cyan': 'pulseCyan 2s ease-in-out infinite',
                'slide-up': 'slideUp 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
            },
            keyframes: {
                pulseCyan: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 245, 255, 0.4)' },
                    '50%': { boxShadow: '0 0 0 8px rgba(0, 245, 255, 0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
