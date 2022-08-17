import fs from "fs"
import path from "path"
import { defineConfig } from "vite"
import { viteExternalsPlugin } from 'vite-plugin-externals'

const env = process.env.pack_env

function toIofodExtension() {
  return {
    name: 'toIofodExtension',
    closeBundle() {
      let index = fs.readFileSync(path.resolve(__dirname, './dist/index.mjs'))

      fs.writeFileSync(path.resolve(__dirname, './dist/index.js'), index)

      if (env == 'prod') {
        const extension = new (require('adm-zip'))()

        extension.addLocalFile(path.resolve(__dirname, './dist/extension.json'))
        extension.addLocalFile(path.resolve(__dirname, './dist/README.md'))
        extension.addLocalFile(path.resolve(__dirname, './dist/index.js'))

        extension.writeZip(path.resolve(__dirname, `./dist/extension.zip`))
      }
    }
  }
}

module.exports = defineConfig({
  base: "./",
  plugins: [viteExternalsPlugin({
    'iofod-sdk': 'PLUS',
  }), toIofodExtension()],
  build: {
    target: 'modules',
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      name: 'index',
      formats: ["es"],
      fileName: `index`
    },
    // rollupOptions: {
    //   external: ['iofod-sdk'],
    // },
    minify: env == 'prod' ? 'esbuild' : false
  },
})
