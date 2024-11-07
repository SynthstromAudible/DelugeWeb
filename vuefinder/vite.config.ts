import {defineConfig} from 'vite'
import {resolve} from 'path'
import vue from '@vitejs/plugin-vue'
import copy from 'rollup-plugin-copy'
import svgLoader from 'vite-svg-loader'
import fs from 'fs';

export default defineConfig({
	  server: {
	  port: 8000,
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/certificate.pem'),
    },
  },
  	preview: {
	  port: 8000,
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/certificate.pem'),
    },
  },
    plugins: [
        vue(),
        svgLoader(),
        copy({
            targets: [
                {src: 'src/locales/*', dest: 'dist/locales'},
                {src: 'src/features.js', dest: 'dist'},
            ],
            hook: "writeBundle",
        })
    ],
   css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler', // or 'modern'
            },
        },
    },
    build: {
        rollupOptions: {
            output: {

                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    vue: 'Vue'
                }
            }
        }
    },
});


