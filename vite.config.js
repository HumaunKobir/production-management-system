import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8001';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/main.jsx'],
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: true,
        proxy: {
            '/api': {
                target: BACKEND_URL,
                changeOrigin: true,
                secure: false,
            },
            '/sanctum': {
                target: BACKEND_URL,
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
