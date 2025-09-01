# 🩺 Repo Therapy

*Tired of boilerplate? Heal your repositories with automated, best-practice configurations.*

[![NPM Version](https://img.shields.io/npm/v/repo-therapy.svg)](https://www.npmjs.com/package/repo-therapy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-contributing)

---

## Why Repo Therapy?

Setting up a new Node.js project involves tedious, repetitive configuration of tools like TypeScript, ESLint, Husky, and VS Code. Ensuring these configurations are consistent and adhere to best practices across multiple projects is a constant challenge.

**Repo Therapy** is a command-line tool that automates this entire process. With a single command, it initializes your repository with a robust, modern, and consistent set of configurations, letting you focus on writing code instead of wrestling with boilerplate.

## ✨ Features

- **One-Command Setup:** Initialize a fully configured repository with a single command.
- **Project Templates:** Out-of-the-box support for different project types, starting with `npm-lib` and `backend`.
- **Smart `package.json` Configuration:** Automatically adds required scripts (`lint`, `postinstall`), dependencies, and even detects and sets your git repository URL.
- **Best-Practice `tsconfig.json`:** Generates a strict, modern TypeScript configuration tailored to your project type.
- **Automatic Tooling Setup:**
  - Configures **ESLint** with a proven ruleset.
  - Sets up **Husky** to run pre-commit hooks, ensuring code quality.
  - Creates **`.gitignore`** and **`.vscode/settings.json`** to ensure a consistent development environment.

## 🚀 Getting Started

### Installation

No installation is needed. The recommended way to use Repo Therapy is with `npx`, which ensures you are always using the latest version.

### Usage

From the root of your new project's directory, run the `init` command:

```bash
npx repo-therapy init --type <project-type>
```

#### Example: Initializing a new NPM Library

This will set up a project configured for publishing to NPM, including `type: "module"` and a `bin` entry in `package.json`.

```bash
mkdir my-awesome-lib && cd my-awesome-lib
npx repo-therapy init --type npm-lib
```

#### Example: Initializing a new Backend Service

This configures a standard backend application structure.

```bash
mkdir my-cool-api && cd my-cool-api
npx repo-therapy init --type backend
```

## 🔧 Commands

### `init`

Initializes a new project with the specified type.

**Usage:**

```bash
npx repo-therapy init --type <project-type>
```

**Arguments:**

- `--type`: The type of project to initialize. Available types: `npm-lib`, `backend`.

## 🔧 Advanced Configuration

Repo Therapy is designed to be extensible. In the future, you will be able to create a `repo-therapy.config.ts` file to define custom settings and override the default configurations for even greater control.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://gitlab.com/vh95/repo-therapy/issues).

## 📄 License

This project is [MIT licensed](https://opensource.org/licenses/MIT).
