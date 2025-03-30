import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}

// Get the repository name from package.json for GitHub Pages
const getBase = () => {
    try {
        // For GitHub Pages deployment, read package.json using ES modules
        const packagePath = resolve(__dirname, '../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const homepage = packageJson.homepage;
        
        if (homepage) {
            // Extract the path portion for base
            const url = new URL(homepage);
            // Return the pathname including trailing slash
            return '/' + url.pathname; 
        }
    } catch (e) {
        console.warn('Could not determine base path from package.json:', e);
    }
    
    // Default to relative path if extraction fails
    return '/';
};

export default defineConfig({
    base: getBase(),
    plugins: [
        react(),
        phasermsg()
    ],
    logLevel: 'warning',
    build: {
        // Disable filename hashing to avoid content corruption issues on GitHub Pages
        rollupOptions: {
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]',
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    }
});
