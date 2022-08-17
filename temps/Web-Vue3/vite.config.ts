/// <reference types="vitest" />

import path from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      'vue': 'vue/dist/vue.esm-bundler.js'
      //vue/dist/vue.esm-bundler.js
      
    },
  },
  plugins: [
    Vue(),
    vueJsx(),
  ],

  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      },
    },
  },

  // https://github.com/vitest-dev/vitest
  test: {
    environment: 'jsdom',
  },

  build: {
    target: 'es2015',
    terserOptions: {
      compress: {
        keep_infinity: true,
        drop_console: true,
      },
    },
    rollupOptions: {
      external: [],
      // https://rollupjs.org/guide/en/#big-list-of-options
    },
    watch: {
      // https://rollupjs.org/guide/en/#watch-options
    },
    // Turning off brotliSize display can slightly reduce packaging time
    brotliSize: false,
    chunkSizeWarningLimit: 2000,
  },
})
