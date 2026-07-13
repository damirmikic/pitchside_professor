import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Multi-page app: each top-level HTML file is its own entry point.
// Images/CSS/JS referenced by plain relative paths (as opposed to JS imports)
// live in public/ so they're served/copied verbatim at the same paths in
// both dev and build, matching how the game worked before this build step.
export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                intro: resolve(__dirname, 'intro.html'),
                introVideo: resolve(__dirname, 'intro-video.html')
            }
        }
    },
    test: {
        environment: 'jsdom',
        globals: false
    }
});
