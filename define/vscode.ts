import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { defineRepoTherapyImport } from './import'
import { defineRepoTherapyJson } from './json'
import { defineRepoTherapyGitignore } from './gitignore'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { extension, settingConfig } from '../config/vscode'

export const f: typeof defineRepoTherapyVsCode = (
  {
    path = '.vscode'
  } = {}
) => wrapper('define-vscode', async (libTool) => {
  const settingsPath = join(path, 'settings.json')
  const extensionsPath = join(path, 'extensions.json')

  const gitignore = await defineRepoTherapyGitignore()(libTool)
    .then(x => Object.values(x.config).flat())

  const currentSettings = await defineRepoTherapyImport()()
    .importScript(settingsPath, { soft: true })
  // todo add all config
  const jsonSettings = defineRepoTherapyJson(
    settingConfig(gitignore)
  )(currentSettings.import || {})

  const currentExtensions = await defineRepoTherapyImport()()
    .importScript(extensionsPath, { soft: true })
  const jsonExtensions = defineRepoTherapyJson(
    extension
  )(currentExtensions.import || {})

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
