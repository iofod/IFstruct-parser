# IFstruct parser

[![Version](https://img.shields.io/github/package-json/v/iofod/IFstruct-parser)](https://github.com/iofod/IFstruct-parser/)
[![NPM](https://img.shields.io/npm/v/iofod-cli)](https://www.npmjs.com/package/iofod-cli)
[![Build Status](https://img.shields.io/github/workflow/status/iofod/IFstruct-parser/build)](https://github.com/iofod/IFstruct-parser/actions)
[![License](https://img.shields.io/github/license/iofod/IFstruct-parser)](https://github.com/iofod/IFstruct-parser/blob/main/LICENSE.md)

The parser is used to parse IFstruct into executable code. Different parsers generate different code projects for the same IFstruct, and developers can use the generated projects directly or customize them for secondary development.

## Official parser

The official team currently provides three sets of interpreters and basic CLI command-line tools for Web, applets and Flutter, which can be used with the iofod extension **IFstruct Synchronization** to support parsing IFstruct into the source code of corresponding technology stack projects.

## Editor

Editor means the editor of iofod, the official website is [www.iofod.com](https://www.iofod.com) and the editor url is [fx.iofod.com](https://fx.iofod.com), You can get more information from the [official documentation](https://doc.iofod.com/#/en/).

## Using the parser

If you do not need to customize the parsing rules, you can install the packages on npm globally directly:

```bash
npm install iofod-cli -g
```

Otherwise, after downloading or cloning the project from Github, go to the project directory and install the CLI globally by first executing the command:

```bash
npm run cli:install
```

Once the installation is complete, you can execute the `iofod` command from the command line.

**Note: Your version of Node.js needs to be upgraded to v16.15.0 or above.**

### Web Parser

Web parser can be used to parse IFstruct into Web project source code, which officially uses [Vue](https://vuejs.org/) as the Web project framework.

1. Create iofod command to create a Web project template.

```bash
iofod create --temp web --dir MyWebProject
```

2. Go to the project directory and add the IFstruct listener:

```bash
cd MyWebProject && iofod listen --port 3001
```

3. Start iofod extension **IFstruct sync** extension, configure the sync source option to ``ws://127.0.0.1:3001``, then turn on **start sync** to listen to the current project content changes and sync IFstruct incrementally to the listener to generate the project code automatically.

4. Execute the dependency installation in the project directory, and run the npm script to preview the development after the installation is complete.

```bash
npm run dev
```

Preview debugging in the browser: ``bash npm run dev

![](https://doc.iofod.com/public/en/cn-605-3v1.jpg)

### Flutter parser

IFstruct can be parsed into Flutter project source code by Flutter parser, which officially adopts [Flutter](https://flutter.dev/) as the mobile application engineering framework.

1. Create iofod command to create Flutter project template.

```bash
iofod create --temp flutter --dir MyFlutterProject
```

2. Go to the project directory and add the IFstruct listener:

```bash
cd MyFlutterProject && iofod listen --port 3003
```

3. Add ``ws://127.0.0.1:3003`` to the sync source configuration of the **IFstruct sync** extension, and restart sync to sync the listener to generate project code.


4. Execute the dependency installation in the project directory, and after the installation is completed and the environment is configured, click the IDE debug button for development preview:

![](https://doc.iofod.com/public/en/cn-605-4.jpg)

Or execute the flutter command for development preview: !

```bash
flutter run -d <deviceId>
```

To preview debugging under the simulator.

![](https://doc.iofod.com/public/en/cn-605-1v1.jpg)

### Development templates for extension

The iofod SDK provides developers with the ability to interact with the main iofod interface within the Web worker, enabling rapid development of iofod extensions through the SDK. The IFstruct command line tool integrates the iofod extension development template:

```bash
iofod create --temp extension --dir MyExtensionProject
```

For detailed documentation on extension development please read [official documentation](https://doc.iofod.com/#/en/9/01).

### IFstruct Synchronization Extensions

You can refer to: [Interface Guide - Using Extensions](https://doc.iofod.com/#/en/3/24), search **IFstruct Sync** in the Add Extensions panel, click the search result to enter the extension details page, go back to the extension management panel after installing the extension, set **Quick Launch** for the extension and then you can see the extension icon in the After installing the extension, go back to the extension management panel and set **Quick Launch** for the extension.

Click Launch extension, fill in the sync source address (separated by carriage return), and turn on **Start Sync** to push IFstruct to the target address.

![](https://doc.iofod.com/public/en/cn-605-5.jpg)

### Custom parsers

The official parser covers most of the mainstream application development forms, developers only need to fine-tune the parser template to adapt to most of the business needs, if the official parser does not meet the needs, developers can use their own creativity, need to change or rewrite a more appropriate parser.
