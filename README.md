# IFstruct parser

The parser is used to parse IFstruct into executable code. Different parsers generate different code projects for the same IFstruct, and developers can use the generated projects directly or customize them for secondary development.

## Official parser

The official team currently provides three sets of interpreters and basic CLI command-line tools for Web, applets and Flutter, which can be used with the iofod extension **IFstruct Synchronization** to support parsing IFstruct into the source code of corresponding technology stack projects.

## Editor

Editor means the editor of iofod, the official website is [www.iofod.com](https://www.iofod.com) and the editor url is [fx.iofod.com](https://fx.iofod.com)

## Using the parser

After downloading or cloning a project from Github and entering the project directory, first execute the command to install the CLI globally.

```bash
npm run cli:install
```

Once the installation is complete, you can execute the `iofod` command from the command line.

### Web Parser

Web parser can be used to parse IFstruct into Web project source code, which officially uses [Vue](https://vuejs.org/) as the Web project framework.

1. Create iofod command to create a Web project template.

```bash
iofod create --target web --dir MyWebProject
``` 

2. Go to the project directory and add the IFstruct listener:

```bash
cd MyWebProject && iofod listen --target web --port 3001
```

3. Start iofod extension **IFstruct sync** extension, configure the sync source option to ``ws://127.0.0.1:3001``, then turn on **start sync** to listen to the current project content changes and sync IFstruct incrementally to the listener to generate the project code automatically.

4. Execute the dependency installation in the project directory, and run the npm script to preview the development after the installation is complete.

```bash
npm run dev
```

Preview debugging in the browser: ``bash npm run dev

![](https://doc.iofod.com/public/en/cn-605-3.jpg)

### mini-app parser

IFstruct can be parsed into mini-app project source code by mini-app parser, which officially uses [Taro](https://taro.jd.com/) as mini-app project framework. (Support WeChat mini-app, Jingdong mini-app, Baidu mini-app, Alipay mini-app, Byte Jump mini-app, QQ light mini-app and fast mini-app)


1. create iofod command to create mini-app project template.

```bash
iofod create --target mp --dir MyMpProject
```

2. Go to the project directory and add the IFstruct listener: ```bash iofod --target mp --dir

```bash
cd MyMpProject && iofod listen --target mp --port 3002
```

3. Add ``ws://127.0.0.1:3002`` to the sync source configuration of the **IFstruct sync** expansion, and restart the sync to synchronize the listener to generate the project code.

4. Execute the dependency installation in the project directory, and run the npm script for development preview after the installation is complete: ``bash

```bash
npm run dev:weapp
```

Preview debugging under WeChat developer tools: ``bash npm run dev:weapp

![](https://doc.iofod.com/public/en/cn-605-2.jpg)

### Flutter parser

IFstruct can be parsed into Flutter project source code by Flutter parser, which officially adopts [Flutter](https://flutter.dev/) as the mobile application engineering framework.

1. Create iofod command to create Flutter project template.

```bash
iofod create --target flutter --dir MyFlutterProject
```

2. Go to the project directory and add the IFstruct listener: 

```bash
cd MyFlutterProject && iofod listen --target mp --port 3003
```

3. Add ``ws://127.0.0.1:3003`` to the sync source configuration of the **IFstruct sync** extension, and restart sync to sync the listener to generate project code.


4. Execute the dependency installation in the project directory, and after the installation is completed and the environment is configured, click the IDE debug button for development preview:

![](https://doc.iofod.com/public/en/cn-605-4.jpg)

Or execute the flutter command for development preview: !

```bash
flutter run -d <deviceId>
```

To preview debugging under the simulator.

![](https://doc.iofod.com/public/en/cn-605-1.jpg)

### IFstruct Synchronization Extensions

You can refer to: [Interface Guide - Using Extensions](https://doc.iofod.com/#/en/3/24), search **IFstruct Sync** in the Add Extensions panel, click the search result to enter the extension details page, go back to the extension management panel after installing the extension, set **Quick Launch** for the extension and then you can see the extension icon in the After installing the extension, go back to the extension management panel and set **Quick Launch** for the extension.

Click Launch extension, fill in the sync source address (separated by carriage return), and turn on **Start Sync** to push IFstruct to the target address.

![](https://doc.iofod.com/public/en/cn-605-5.jpg)

### Custom parsers

The official parser covers most of the mainstream application development forms, developers only need to fine-tune the parser template to adapt to most of the business needs, if the official parser does not meet the needs, developers can use their own creativity, need to change or rewrite a more appropriate parser.

