# iofod extension

这是一个开发 iofod 拓展的项目模板，支持使用 TS 开发，通过 Vite 编译为 iofod 的拓展资源文件。

## 开发准备

我们推荐使用 Node.js v16.15.0 版本进行 iofod 拓展开发，我们目前所有的拓展几乎都使用该版本。

## 开发模式

启动本地开发模式，源文件更新会自动生成可调试文件。

```bash
npm run dev
```

假如需要在 iofod 里加载开发模式的资源进行调试，则需要启动可供 iofod 请求资源的静态服务器。

```bash
npm run preview
```

静态资源目录需要包含 `index.js`，`extension.json`，`README.md` 三个文件。

## 生产模式

生产模式会将源码转义后进行压缩处理，并且生成可发布的 iofod 拓展资源包。

```bash
npm run build
```

## 更多

更多内容请阅读[官方文档](https://doc.iofod.cn/#/zh-cn/9/01)获取，模板和案例可以参考[官方开源库](https://github.com/iofod/iofod-extensions)。
