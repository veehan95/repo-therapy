# 🩺 Repo Therapy

*Tired of boilerplate? Heal your repositories with automated, best-practice configurations.*

[![NPM Version](https://img.shields.io/npm/v/repo-therapy.svg)](https://www.npmjs.com/package/repo-therapy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-contributing)
[![Discord](https://img.shields.io/discord/1234567890.svg?label=Discord&logo=discord)](https://discord.gg/yXw94UPT)

---

## Why Repo Therapy?

Setting up a new Node.js project involves tedious, repetitive configuration of tools like TypeScript, ESLint, Husky, and VS Code. Ensuring these configurations are consistent and adhere to best practices across multiple projects is a constant challenge.

**Repo Therapy** is a command-line tool that automates this entire process. With a single command, it initializes your repository with a robust, modern, and consistent set of configurations, letting you focus on writing code instead of wrestling with boilerplate.

## ✨ Features

- **One-Command Setup:** Initialize a fully configured repository with a single command.
- **Extensible Configuration:** While Repo Therapy provides sensible defaults, you can override and customize almost every aspect of the configuration.
- **Smart `package.json` Configuration:** Automatically adds required scripts (`lint`, `postinstall`), dependencies, and even detects and sets your git repository URL.
- **Best-Practice `tsconfig.json`:** Generates a strict, modern TypeScript configuration tailored to your project type.
- **Automatic Tooling Setup:**
  - Configures **ESLint** with a proven ruleset.
  - Sets up **Husky** to run pre-commit hooks, ensuring code quality.
  - Creates **`.gitignore`** and **`.vscode/settings.json`** to ensure a consistent development environment.
- **CSV Processing:** Define and manage CSV files in your project.
- **Environment Variable Management:** Easily manage your environment variables.
- **Error Handling:** A dedicated error handling module.
- **Import Management:** A module for managing imports.
- **JSON file Management:** A module for managing JSON files.
- **Logging:** A dedicated logging module.
- **Scripts:** A module for managing scripts.
- **Wrapper:** A wrapper module for other modules.

## 🚀 Getting Started

### Installation

No installation is needed. The recommended way to use Repo Therapy is with `npx`, which ensures you are always using the latest version.

### Usage

From the root of your new project's directory, run the `init` command:

```bash
npx repo-therapy init
```

This will guide you through the process of setting up your project.

## 🔧 Core Concepts

Repo Therapy is built around a series of modules that each handle a specific aspect of your project's configuration. These modules are available as functions that you can import from the root of the project.

### `defineRepoTherapy`

The main entry point for the library. It composes many of the other `define` modules to provide a high-level interface for scaffolding and managing a project.

**Usage:**

```typescript
import { defineRepoTherapy } from 'repo-therapy';

const repoTherapy = await defineRepoTherapy({
  project: 'my-awesome-project',
  projectType: 'npm-lib',
})();

await repoTherapy.init();
```

**Expected Outcome:**

This will initialize your project with a `package.json`, `.gitignore`, `tsconfig.json`, `.vscode/settings.json`, and Husky pre-commit hooks, all configured with best practices for an NPM library. It also returns an object with the following properties:

- **`init`:** A function that initializes the project.
- **`rootPath`:** The root path of the project.
- **`env`:** The environment variables for the project.
- **`serverCode`:** An object containing a mapping of HTTP status codes to their names and descriptions.
- **`error`:** An object containing a collection of predefined error classes.
- **`newError`:** A function that can be used to create new custom error classes.
- **`logger`:** A logger instance.
- **`lint`:** A function that returns the ESLint configuration.
- **`wrapper`:** A function for wrapping other functions.
- **`import`:** A function for importing files and modules.
- **`script`:** A function for creating and managing scripts.
- **`json`:** A function for creating and managing JSON files.
- **`packageJson`:** The content of the `package.json` file.


### `defineRepoTherapyCli`

The main entry point for the command-line interface. It uses `yargs` to create a powerful and flexible CLI.

**Usage:**

```typescript
import { defineRepoTherapyCli } from 'repo-therapy';

defineRepoTherapyCli();
```

**Expected Outcome:**

This will create a CLI for your project with `init`, `help`, and `version` commands.

### `defineRepoTherapyCsv`

A utility for reading and writing CSV files.

**Usage:**

```typescript
import { defineRepoTherapyCsv } from 'repo-therapy';

const csv = defineRepoTherapyCsv(['name', 'email']);

const data = await csv('my-data.csv').read();

await csv('my-data.csv').write([...data, { name: 'John Doe', email: 'john.doe@example.com' }]);
```

**Expected Outcome:**

This will read the data from `my-data.csv`, and then write the new data back to the file.

**Remark:**

This function uses `defineRepoTherapyImport` internally to read the CSV file.

### `defineRepoTherapyEnv`

A utility for managing environment variables. It can read `.env` files, validate environment variables, and generate type declarations.

**Usage:**

```typescript
import { defineRepoTherapyEnv } from 'repo-therapy';

const { env } = await defineRepoTherapyEnv(({ envPreset }) => ({
  env: {
    ...envPreset.base(),
    ...envPreset.aws(),
  },
}))();
```

**Expected Outcome:**

This will load the environment variables from your `.env` file and validate them against the defined schema.

### `defineRepoTherapyError`

A utility for creating custom error classes.

**Usage:**

```typescript
import { defineRepoTherapyError } from 'repo-therapy';

const MyError = defineRepoTherapyError({
  name: 'MyError',
  defaultMessage: 'Something went wrong',
});

throw MyError;
```

**Expected Outcome:**

This will throw a custom error with the name "MyError" and the default message.

### `defineRepoTherapyGitignore`

A utility for creating and managing `.gitignore` files.

**Usage:**

```typescript
import { defineRepoTherapyGitignore } from 'repo-therapy';

const gitignore = await defineRepoTherapyGitignore({
  framework: ['next.js'],
})();

await gitignore.write();
```

**Expected Outcome:**

This will create a `.gitignore` file with the default ignores for a Next.js project.

**Remark:**

You can also use the `gitignore` function returned by `defineRepoTherapy` to avoid manually passing the `framework` option.

### `defineRepoTherapyHusky`

A utility for setting up Husky pre-commit hooks.

**Usage:**

```typescript
import { defineRepoTherapyHusky } from 'repo-therapy';

const husky = defineRepoTherapyHusky();

husky.setup();
```

**Expected Outcome:**

This will create a `.husky/pre-commit` file that runs `npm run lint` before each commit.

**Remark:**

You can also use the `husky` function returned by `defineRepoTherapy` to avoid manually passing the `packageManager` option.

### `defineRepoTherapyImport`

A utility for importing files and modules. It can import `.js`, `.ts`, `.json`, and `.csv` files.

**Usage:**

```typescript
import { defineRepoTherapyImport } from 'repo-therapy';

const myModule = await defineRepoTherapyImport().importScript('my-module.ts');
```

**Expected Outcome:**

This will import the `my-module.ts` file and return its content.

**Remark:**

You can also use the `import` function returned by `defineRepoTherapy` to avoid manually passing the `rootPath`.

### `defineRepoTherapyJson`

A utility for creating and managing JSON files.

**Usage:**

```typescript
import { defineRepoTherapyJson } from 'repo-therapy';

const myJson = defineRepoTherapyJson({
  'my-key': { default: 'my-value' },
});

const json = myJson({ 'my-key': 'my-new-value' }).json;
```

**Expected Outcome:**

This will create a JSON object with the key "my-key" and the value "my-new-value".

**Remark:**

You can also use the `json` function returned by `defineRepoTherapy` to avoid manually passing the `rootPath`.

### `defineRepoTherapyLint`

A utility for configuring ESLint.

**Usage:**

```typescript
import { defineRepoTherapyLint } from 'repo-therapy';

const lint = await defineRepoTherapyLint({
  projectType: 'backend',
})();

const eslintConfig = lint.lint();
```

**Expected Outcome:**

This will create an ESLint configuration for a backend project.

**Remark:**

You can also use the `lint` function returned by `defineRepoTherapy` to avoid manually passing the `projectType` and `framework` options.

### `defineRepoTherapyLogger`

A utility for creating a logger.

**Usage:**

```typescript
import { defineRepoTherapyLogger } from 'repo-therapy';

const { logger } = defineRepoTherapyLogger({
  service: 'my-service',
})();

logger.info('Hello, world!');
```

**Expected Outcome:**

This will log "Hello, world!" to the console with the service name "my-service".

**Remark:**

You can also use the `logger` object returned by `defineRepoTherapy`.

### `defineRepoTherapyPackageJson`

A utility for creating and managing `package.json` files.

**Usage:**

```typescript
import { defineRepoTherapyPackageJson } from 'repo-therapy';

const packageJson = await defineRepoTherapyPackageJson({
  projectType: 'npm-lib',
})();

await packageJson.write();
```

**Expected Outcome:**

This will create a `package.json` file with the default settings for an NPM library.

**Remark:**

You can also use the `packageJson` function returned by `defineRepoTherapy` to avoid manually passing the `projectType` and `packageManager` options.

### `defineRepoTherapyScript`

A utility for creating and managing scripts.

**Usage:**

```typescript
import { defineRepoTherapyScript } from 'repo-therapy';

const myScript = defineRepoTherapyScript((libTool, args) => {
  libTool.logger.info(`Hello, ${args.name}!`);
});
```

**Expected Outcome:**

This will create a script that logs a greeting to the console.

**Remark:**

You can also use the `script` function returned by `defineRepoTherapy` to avoid manually passing the `libTool`.

### `defineRepoTherapyTsconfig`

A utility for creating and managing `tsconfig.json` files.

**Usage:**

```typescript
import { defineRepoTherapyTsconfig } from 'repo-therapy';

const tsconfig = await defineRepoTherapyTsconfig({
  projectType: 'backend',
})();

await tsconfig.write();
```

**Expected Outcome:**

This will create a `tsconfig.json` file with the default settings for a backend project.

**Remark:**

You can also use the `tsconfig` function returned by `defineRepoTherapy` to avoid manually passing the `projectType` option.

### `defineRepoTherapyVsCode`

A utility for creating and managing VS Code settings.

**Usage:**

```typescript
import { defineRepoTherapyVsCode } from 'repo-therapy';

const vscode = await defineRepoTherapyVsCode()();

await vscode.write();
```

**Expected Outcome:**

This will create a `.vscode/settings.json` and `.vscode/extensions.json` file with the default settings.

**Remark:**

You can also use the `vscode` function returned by `defineRepoTherapy` to avoid manually passing the `packageManager` and `framework` options.

### `defineRepoTherapyWrapper`

A utility for wrapping other functions.

**Usage:**

```typescript
import { defineRepoTherapyWrapper } from 'repo-therapy';

const myWrappedFunction = defineRepoTherapyWrapper('my-function', () => {
  // ...
});
```

**Expected Outcome:**

This will create a wrapped function with a slug and a validation function.

**Remark:**

You can also use the `wrapper` function returned by `defineRepoTherapy` to avoid manually passing the `warpperClient`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/veehan95/repo-therapy/issues).

We have a friendly and welcoming community on Discord. Come and say hi!

[https://discord.gg/yXw94UPT](https://discord.gg/yXw94UPT)

## 📄 License

This project is [MIT licensed](https://opensource.org/licenses/MIT).