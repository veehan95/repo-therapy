import { join } from 'path'
import { defineRepoTherapyImport } from './import'
import { defineRepoTherapyJson } from './json'
import { defineRepoTherapyGitignore } from './gitignore'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

export const f: typeof defineRepoTherapyVsCode = (
  {
    path = '.vscode'
  } = {}
) => wrapper('define-gitignore', async (libTool) => {
  const settingsPath = join(path, 'settings.json')
  const extensionsPath = join(path, 'extensions.json')

  const gitignore = await defineRepoTherapyGitignore()(libTool)
    .then(x => Object.values(x.config).flat())

  const currentSettings = await defineRepoTherapyImport()()
    .importScript(settingsPath, { soft: true })
  const vscodeIgnore = [
    '.git',
    '.gitlab',
    '.husky',
    '.npmignore',
    '.vscode',
    'package-lock.json',
    'yarn.lock',
    ...gitignore
  ].map(s => [s.replace(/\./g, '\\\\.'), { default: true, type: 'boolean' }])
  // todo add all config
  const jsonSettings = defineRepoTherapyJson({
    'editor\\\\.tabSize': { default: 2, type: 'number' },
    'editor\\\\.trimAutoWhitespace': { default: true, type: 'boolean' },
    'eslint\\\\.enable': { default: true, type: 'boolean' },
    'eslint\\\\.format\\\\.enable': { default: true, type: 'boolean' },
    'editor\\\\.codeActionsOnSave.source\\\\.fixAll\\\\.eslint': {
      default: 'explicit'
    },
    'editor\\\\.formatOnSave': { default: true, type: 'boolean' },
    'editor\\\\.defaultFormatter': { default: 'esbenp.prettier-vscode' },
    'files\\\\.eol': { default: '\n' },
    ...Object.fromEntries(
      vscodeIgnore.map(([k, v]) => [`files\\\\.exclude.${k}`, v])
    ),
    ...Object.fromEntries(
      vscodeIgnore.map(([k, v]) => [`files\\\\.watcherExclude.${k}`, v])
    ),
    ...Object.fromEntries(
      vscodeIgnore.map(([k, v]) => [`files\\\\.exclude.${k}`, v])
    )
  })(currentSettings.import || {})

  const currentExtensions = await defineRepoTherapyImport()()
    .importScript(extensionsPath, { soft: true })
  const jsonExtensions = defineRepoTherapyJson({
    recommendations: {
      default: ['dbaeumer.vscode-eslint', 'eamodio.gitlens'],
      type: 'Array<string>'
    }
  })(currentExtensions.import || {})

  return {
    config: {
      settings: jsonSettings.json,
      extensions: jsonExtensions.json
    },
    path: {
      settings: currentSettings.fullPath,
      extensions: currentExtensions.fullPath
    },
    write: () => {
      if (!existsSync(path)) { mkdirSync(path, { recursive: true }) }
      writeFileSync(
        currentSettings.fullPath,
        JSON.stringify(jsonSettings.json, undefined, 2)
      )
      writeFileSync(
        currentExtensions.fullPath,
        JSON.stringify(jsonExtensions.json, undefined, 2)
      )
    }
  }
})

export { f as defineRepoTherapyVsCode }
