import { writeFileSync } from 'fs'
import envPreset from '../utils/env-preset'
import dotenv from 'dotenv'
import { join } from 'path'
import { snakeCase } from 'lodash'

const _defineRepoTherapyEnv: typeof defineRepoTherapyEnv = (
  handler
) => () => {
  dotenv.config()
  const envKey = Object.keys(process.env)

  function recursiveEnv (
    key: string,
    value: RepoTherapy.EnvDetail,
    recuringKey: Array<string> = [],
    ogKey = false,
    baseEnv?: object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    if (!value.type) {
      const objVal = Object.fromEntries(
        Object.entries(value).flatMap(([k, v]) => Object.entries(
          recursiveEnv(k, v, [...recuringKey, key], ogKey, baseEnv)
        ))
      )
      return ogKey ? objVal : { [key]: objVal }
    }
    const [, ..._recuringKey] = recuringKey
    const currentRecuringKey = [..._recuringKey, key]
    const fullKeyRegExp = new RegExp(`^${
      currentRecuringKey
        .join(' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(/\s/g)
        .filter(x => x)
        .map(x => x.toLowerCase() === 'default' ? '(_default)?' : `_${x}`)
        .join('')
        .toUpperCase()
        .replace(/^_/, '')
        .replace(/^\(_/, '(')
    }$`)
    let currentEnvKey = envKey.find(x => fullKeyRegExp.test(x)) || ''
    if (!process.env[currentEnvKey] && value.alias?.length > 0) {
      currentEnvKey = (
        value.alias as Array<string>
      ).find(x => process.env[x] !== undefined) || ''
    }
    if (!currentEnvKey && !value.optional && !value.default) {
      throw new Error(`Env not configured ${currentRecuringKey.join('.')}`)
    }
    // todo default support function (pass in env that is not a function)
    let returnValue = process.env[currentEnvKey] || (
      value.default !== undefined
        ? (
            typeof value.default === 'function'
              ? (baseEnv ? value.default(baseEnv) : undefined)
              : value.default
          )
        : undefined
    )
    if (value.type === 'number') { returnValue = Number(returnValue) }
    if (value.type === 'boolean') {
      if (returnValue === 'true') { returnValue = true }
      if (returnValue === 'false') { returnValue = false }
    }
    if (
      returnValue !== undefined && (
        (value.type === 'number' && isNaN(returnValue)) ||
        // eslint-disable-next-line valid-typeof
        typeof returnValue !== value.type
      )
    ) {
      throw new Error(
        `Env type for ${currentRecuringKey.join('.')} should be ${value.type}`
      )
    }
    return {
      [ogKey
        ? (
            currentEnvKey ||
            snakeCase(currentRecuringKey.join('_')).toUpperCase()
          )
        : key
      ]: returnValue
    }
  }

  function recursiveEnvSample (
    key: string,
    value: RepoTherapy.EnvDetail,
    recuringKey: Array<string> = []
  ): Array<[string, string]> {
    if (!value.type) {
      return Object.entries(value).flatMap(
        ([k, v]) => recursiveEnvSample(snakeCase(k), v, [...recuringKey, key])
      )
    }
    const [, ..._recuringKey] = recuringKey
    // todo default support function (pass in env that is not a function)
    return [[
      [..._recuringKey, key]
        .map(x => x.toLowerCase() === 'default' ? '' : x)
        .filter(x => x)
        .join('_')
        .toUpperCase()
        .replace(/^_/, ''),
      value.default || ''
    ]]
  }

  function recursiveEnvType (
    key: string,
    value: RepoTherapy.EnvDetail
  ): string {
    if (!value.type) {
      return `${key}: {\n  ${
        Object.entries(value)
          .flatMap(([k, v]) => recursiveEnvType(k, v).split('\n'))
          .join('\n  ')
      }\n}`
    }
    let r = `  ${key}`
    if (value.optional || value.default) { r += '?' }
    r += `: ${value.type}`
    return r
  }

  const config = handler ? handler({ envPreset }) : {}
  if (config.skip) {
    return {
      env: {},
      envSample: () => ({}),
      envType: () => '',
      getOriginalEnv: () => ({}),
      generateTypeDeclaration: () => {},
      config: { env: {} }
    }
  }
  const configExtends = (config.extends || []).filter(x => x)
  const configEnv = configExtends.reduce((acc, cur) => {
    // todo fix nested object
    if (!cur) {
      throw new Error('Unknown object is passed as defineRepoTherapy')
    }
    return Object.assign(acc, cur().config.env)
  }, Object.assign({}, config.env || {}))
  const rootEnv = recursiveEnv('env', configEnv)
  const env = recursiveEnv(
    'env',
    configEnv,
    undefined,
    false,
    rootEnv
  ).env

  const paths = {
    rootPath: config.paths?.rootPath ||
      __dirname.replace(/\/node_modules\/.*$/, ''),
    configPath: config.paths?.configPath || 'repo-therapy.ts',
    typeDeclarationPath: config.paths?.typeDeclarationPath ||
      'types.d/_repo-therapy.d.ts'
  }

  function envType () {
    const [, ...str] = recursiveEnvType('env', configEnv).split('\n')
    return `interface ${config.typeName || 'RepoTherapyEnv'} {\n${
      str.join('\n')
    }`
  }

  return {
    env,
    envSample: () => Object.fromEntries(recursiveEnvSample('env', configEnv)),
    envType,
    getOriginalEnv: () => recursiveEnv(
      'env',
      configEnv,
      undefined,
      true,
      rootEnv
    ),
    generateTypeDeclaration: () => {
      writeFileSync(
        join(paths.rootPath, paths.typeDeclarationPath),
        // todo fix spacing when have extends
        `declare global {\n  ${envType().replace(/\n/g, '\n  ')}\n}`
      )
    },
    config: {
      env: config.env || {}
    }
  }
}

export { _defineRepoTherapyEnv as defineRepoTherapyEnv }
