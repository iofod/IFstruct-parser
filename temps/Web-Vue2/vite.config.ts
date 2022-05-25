import path from 'path'
import { defineConfig } from 'vite'
const { createVuePlugin } = require('vite-plugin-vue2')
import legacy from '@vitejs/plugin-legacy'

const config = defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      'vue': 'vue/dist/vue.esm.browser.js'
    },
  },
  base: './',
  build: {
    minify: false,
  },
  plugins: [
    createVuePlugin({ jsx: true }),
    legacy({
      targets: ['last 20 versions', 'Android >= 3.2', 'iOS >= 7'],
    }),
  ],
  server: {
    //https://cn.vitejs.dev/config/#loglevel
    host: '0.0.0.0',
  },
})

export default config
