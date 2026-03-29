import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                analysis: resolve(__dirname, 'analysis.html'),
                popup: resolve(__dirname, 'popup.html'),
                'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
                chesscom: resolve(__dirname, 'src/content-scripts/chesscom.ts'),
                lichess: resolve(__dirname, 'src/content-scripts/lichess.ts'),
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'service-worker') return 'service-worker.js';
                    if (chunkInfo.name === 'chesscom') return 'content-scripts/chesscom.js';
                    if (chunkInfo.name === 'lichess') return 'content-scripts/lichess.js';
                    return 'assets/[name]-[hash].js';
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        target: 'esnext',
        minify: false,
    },
    publicDir: 'public',
});
