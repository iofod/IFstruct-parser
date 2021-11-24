import path from 'path'
import { defineConfig } from 'vite'
const { createVuePlugin } = require('vite-plugin-vue2')
import legacy from '@vitejs/plugin-legacy'

const config = defineConfig({
  alias: [
    { find: '~', replacement: path.resolve(__dirname, 'src') },
    { find: 'vue', replacement: 'vue/dist/vue.esm.browser.js' }
  ],
  build: {
    minify: false,
    base: './'
  },
  plugins: [createVuePlugin({ jsx: true }), legacy({
    targets: ["last 20 versions", "Android >= 3.2", "iOS >= 7"]
  })],
  server: {
    //https://cn.vitejs.dev/config/#loglevel
    host: '0.0.0.0'
  }
})

export default config