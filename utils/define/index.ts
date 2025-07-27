import { writeFileSync } from 'fs'
import envPreset from '../env-preset'
import dotenv from 'dotenv'
import { join } from 'path'

const _defineRepoTherapy: typeof defineRepoTherapy = (
  handler
) => () => {
  dotenv.config()
  const envKey = Object.keys(process.env)

  function recursiveEnv (key: string, value: RepoTherapy.EnvDetail, recuringKey: Array<string> = []): [string, any] {
    if (!value.type) {
      return [
        key,
        Object.fromEntries(
          Object.entries(value).map(([k, v]) => recursiveEnv(k, v, [...recuringKey, key]))
        )
      ]
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
    const currentEnvKey = envKey.find(x => fullKeyRegExp.test(x)) || ''
    if (!currentEnvKey && !value.optional && !value.default) {
      throw new Error(`Env not configured ${currentRecuringKey.join('.')}`)
    }
    // todo default support function (pass in env that is not a function)
    const returnValue = process.env[currentEnvKey] || value.default
    if (returnValue !== undefined && typeof returnValue !== value.type) {
      throw new Error(`Env type for ${currentRecuringKey.join('.')} should be ${value.type}`)
    }
    return [key, returnValue]
  }

  function recursiveEnvSample (key: string, value: RepoTherapy.EnvDetail, recuringKey: Array<string> = []): Array<[string, string]> {
    if (!value.type) {
      return Object.entries(value).flatMap(([k, v]) => recursiveEnvSample(k, v, [...recuringKey, key]))
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

  function recursiveEnvType (key: string, value: RepoTherapy.EnvDetail): string {
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

  const config = handler({ envPreset })
  const configExtends = (config.extends || []).filter(x => x)
  const configEnv = configExtends.reduce((acc, cur) => {
    // todo fix nested object
    if (!cur) { throw new Error('Unknown object is passed as defineRepoTherapy') }
    return Object.assign(acc, cur().config.env)
  }, Object.assign({}, config.env || {}))
  const env = recursiveEnv('env', configEnv)[1]

  const paths = {
    rootPath: config.paths?.rootPath ||__dirname.replace(/\/node_modules\/.*$/, ''),
    configPath: config.paths?.configPath ||'repo-therapy.ts',
    typeDeclarationPath: config.paths?.typeDeclarationPath ||'types.d/_repo-therapy.d.ts'
  }

  function envType () {
    const [, ...str] = recursiveEnvType('env', configEnv).split('\n')
    return `interface ${config.typeName || 'RepoTherapyEnv'} {\n${str.join('\n')}`
  }

  return {
    env,
    envSample: () => Object.fromEntries(recursiveEnvSample('env', configEnv)),
    envType,
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

export { _defineRepoTherapy as defineRepoTherapy }