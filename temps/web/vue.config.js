const path = require('path')
// vue.config.js
module.exports = {
  configureWebpack: config =>  {
    config.resolve.alias = {
      ...config.resolve.alias,
      vue$: 'vue/dist/vue.js',
      '~': path.resolve(__dirname, './src')
    }
  },
  publicPath: './'
}