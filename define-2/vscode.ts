import { join } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { defineRepoTherapyJson } from './json'
import { defineRepoTherapyGitignore } from './gitignore'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { extension, settingConfig } from '../configs/vscode'

export function defineRepoTherapyVsCode (
  { path = '.vscode' } = {}
) {
  return wrapper('define-vscode', async (libTool) => {
    const settingsPath = join(path, 'settings.json')
    const extensionsPath = join(path, 'extensions.json')

    const gitignore = await defineRepoTherapyGitignore()(libTool)
      .then(x => Object.values(x.config).flat())

    const currentSettings = await libTool.import()
      .importScript(settingsPath, { soft: true })
    // todo add all config
    const jsonSettings = defineRepoTherapyJson(
      settingConfig(gitignore)
    )(currentSettings.import || {})

    const currentExtensions = await libTool.import()
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
}
