import { parse } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { extname, join } from 'path'
import { register } from 'ts-node'
import preset from './preset'

export function getConfig (
  configPath = './env-control.ts',
  defaultConfig = (
    _: typeof preset
  ): RepoTherapy.EnvConfig => ({})
) {
  if (extname(__filename) === '.js') { register({ transpileOnly: true }) }

  const root = __dirname.replace(/\/node_modules\/.*$/, '')
  const _configPath = join(root, configPath)

  const dConfig = defaultConfig(preset)

  const _config = (existsSync(_configPath)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ? require(_configPath).default(preset) as RepoTherapy.EnvConfig
    : undefined) || {}
  const config = {
    ...dConfig,
    ..._config,
    list: { ...dConfig.list, ..._config.list }
  }
  if (!config.list) { config.list = {} }

  const fileName = config.fileName || '.env'

  function defaultEnv () {
    const path = join(root, fileName)
    if (!existsSync(path)) { return {} }
    return parse(readFileSync(path, 'utf-8'))
  }
  return {
    root,
    config,
    fileName,
    defaultEnv
  }
}
