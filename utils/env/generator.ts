import { cpSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { snakeCase, startCase } from 'lodash'
import { dirname, join } from 'path'
import { getConfig } from './utils'

export const supportedFormat = ['string', 'number', 'boolean']

export function recursiveGenerateType (
  obj: RepoTherapy.EnvDetail = {},
  key = 'env'
) {
  const interfaceName = startCase(key).replace(/\s/g, '')
  const entries = Object.entries(obj)
  const prefix: Array<string> = []
  const interfaceAttribute: Array<string> = []
  for (let i = 0; i < entries.length; i++) {
    let attribute: string = (entries[i][1] as RepoTherapy.EnvAttribute).type
    if (!supportedFormat.includes(attribute)) {
      const { interfaceName: n, str, prefix: _prefix } = recursiveGenerateType(
        entries[i][1] as RepoTherapy.EnvDetail,
        startCase(`${key} ${entries[i][0]}`).replace(/\s/g, '')
      )
      prefix.push(..._prefix)
      prefix.push(str)
      attribute = n
    }
    const keys = entries[i][0]
      .split(/\|/g)
      .map(x => x.replace(/\(|\)/g, '').trim())
    let keyToUse = keys[0]
    const colon = (entries[i][1] as RepoTherapy.EnvAttribute).optional
      ? '?:'
      : ':'
    if (keys.length > 1) {
      keyToUse = `${interfaceName}Key${i}`
      prefix.push(`type ${keyToUse} = '${keys.join('\' | \'')}'`)
      interfaceAttribute.push(`[s: ${keyToUse}]${colon} ${attribute}`)
    } else {
      interfaceAttribute.push(`${keyToUse}${colon} ${attribute}`)
    }
  }
  const str = (`interface ${interfaceName} {` + (
    interfaceAttribute.length > 0
      ? '\n' + interfaceAttribute.map(x => `  ${x}`).join('\n') + '\n'
      : ''
  ) + '}').trim()
  return { interfaceName, str, prefix }
}

export function generateType (
  obj: RepoTherapy.EnvDetail,
  namespace: string,
  saveTo = 'types.d/_env.d.ts'
) {
  const typePath = join(__dirname.replace(/node_modules\/.*$/, ''), saveTo)
  const dir = dirname(typePath)
  if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }) }

  const { prefix, str: _str } = recursiveGenerateType(obj)
  writeFileSync(
    typePath,
    (
      'declare global {\n  namespace ' +
        `${startCase(namespace).replace(/\s/g, '')}Env {\n    ` +
        [...prefix, _str].join('\n\n')
          .replace(/\{(\n|\r|\s)*\}/, '{}')
          .replace(/\n/g, '\n    ') +
        '\n  }\n\n' +
        '  namespace RepoTherapy {\n' +
        `    type Env = ${startCase(namespace).replace(/\s/g, '')}Env.Env\n` +
        '  }\n' +
        '}\n\nexport {}\n'
    ).replace(/\n(\s*)\n/g, '\n\n')
  )
}

export function recursiveAssign (
  obj: RepoTherapy.EnvDetail,
  env: Record<string, string> = {},
  prev = ''
) {
  const checkValue = process.env.ENV_CONTROL_CHECK_SKIP !== 'true'
  const entries = Object.entries(obj) as Array<
    [string, RepoTherapy.EnvDetail[string]]
  >
  const result: Record<string, string | number | boolean | object> = {}
  for (let i = 0; i < entries.length; i++) {
    const attribute: string = (entries[i][1] as RepoTherapy.EnvAttribute).type
    const keys = entries[i][0].split(/\|/g)
    for (let j = 0; j < keys.length; j++) {
      const attrKey = keys[j].replace(/^\(|\)$/g, '')
      if (!supportedFormat.includes(attribute)) {
        result[attrKey] = recursiveAssign(
          entries[i][1] as RepoTherapy.EnvDetail,
          env,
          `${prev} ${keys[j]}`
        )
      } else {
        const envKey = snakeCase(
          `${prev} ${keys[j]}`.replace(/\([^)]*\)/g, '')
            .replace(/\s{2,}/g, ' ')
        ).toUpperCase().trim()
        result[attrKey] = env[envKey] || entries[i][1].default
        if (
          checkValue &&
          !entries[i][1].optional &&
          result[attrKey] === undefined
        ) {
          throw new Error(`Missing env ${envKey}`)
        }
      }
    }
  }
  return result
}

export function recursiveAdjustValue <T extends object> (data: T) {
  const row = Object.entries(data)
  const result: Record<string, string | boolean | number | object> = {}
  for (let i = 0; i < row.length; i++) {
    if (typeof row[i][1] === 'function') {
      result[row[i][0]] = row[i][1](data)
      continue
    }
    if (typeof row[i][1] === 'object') {
      result[row[i][0]] = recursiveAdjustValue(row[i][1])
      continue
    }
    result[row[i][0]] = row[i][1]
  }
  return result as T
}

export function generateEnv (
  obj: RepoTherapy.EnvDetail,
  env: Record<string, string>
): RepoTherapy.Env {
  return recursiveAdjustValue<RepoTherapy.Env>(
    recursiveAssign(obj, env) as RepoTherapy.Env
  )
}

export function generateEnvFile (
  obj: RepoTherapy.EnvDetail,
  prev = ''
) {
  const entries = Object.entries(obj)
  const result: Array<string> = []
  for (let i = 0; i < entries.length; i++) {
    const attribute: string = (entries[i][1] as RepoTherapy.EnvAttribute).type
    const keys = entries[i][0].split(/\|/g)
    for (let j = 0; j < keys.length; j++) {
      const currentKey = /\([^)]*\)/g.test(keys[j]) ? '' : '_' + keys[j]
      if (!supportedFormat.includes(attribute)) {
        result.push(...generateEnvFile(
          entries[i][1] as RepoTherapy.EnvDetail,
          `${prev} ${currentKey}`
        ))
      } else {
        if ((entries[i][1] as RepoTherapy.EnvAttribute).generate !== false) {
          result.push(
            snakeCase(`${prev} ${currentKey}`).toUpperCase() +
            '=' +
            ((entries[i][1] as RepoTherapy.EnvAttribute).default || '')
          )
        }
      }
    }
  }
  return result
}

export function useEnv (project: string, { configPath, defaultConfig }: {
  configPath?: string
  defaultConfig?: (_: RepoTherapy.EnvPreset) => RepoTherapy.EnvDetail
} = {}) {
  const { config, defaultEnv, fileName, root } = getConfig(
    configPath,
    defaultConfig
  )

  const dir = join(root, config.dir || '.env-files')
  const envFile = join(root, fileName)
  const { project: oldProject } = defaultEnv()
  if (existsSync(envFile)) {
    if (!existsSync(dir)) { mkdirSync(dir) }
    if (!oldProject) { throw new Error('PROJECT not defined in env') }
    cpSync(envFile, join(dir, oldProject))
  }
  const targetEnv = join(dir, project)
  if (existsSync(targetEnv)) {
    cpSync(targetEnv, envFile)
    return
  }
  writeFileSync(envFile, generateEnvFile(config.list).join('\n'))
}
