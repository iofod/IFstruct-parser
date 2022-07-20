# iofod extension

This is a project template for the development of an iofod extension that supports development using TS and is compiled into an iofod extension resource file via Vite.

## Development preparation

We recommend using Node.js v16.15.0 for iofod extension development, which is the version we use for almost all of our current extensions.

## Development mode

Start local development mode and source updates will automatically generate debuggable files.

```bash
npm run dev
```

If you need to load development mode resources in iofod for debugging, you need to start a static server for iofod to request resources from.

```bash
npm run preview
```

The static resource directory needs to contain ``index.js``, ``extension.json`` and ``README.md`` files.

## Production mode

Production mode escapes the source code, compresses it, and generates a publishable iofod extension package.

```bash
npm run build
```

## More

Read the [official documentation](https://doc.iofod.com/#/en/9/01) for more, and the [official open source library](https://github.com/iofod/iofod-extensions) for templates and examples.
