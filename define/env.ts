import { writeFileSync } from 'fs'
import dotenv from 'dotenv'
import { join } from 'path'
import { kebabCase, snakeCase } from 'lodash'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { defineRepoTherapyImport } from './import'

const path = '.env'
const pathPostfix = '.local'

const f: typeof defineRepoTherapyEnv = (
  handler = () => ({})
) => wrapper('define-env', async (libTool) => {
  function aws (options?: RepoTherapyEnv.AwsOptions) {
    const r: ReturnType<RepoTherapyEnv.Preset['aws']> = {
      region: {
        type: 'string',
        default: process.env.AWS_REGION || 'ap-southeast-1',
        generate: false,
        alias: ['AWS_DEFAULT_REGION', 'AWS_REGION']
      },
      accountId: { type: 'string', default: '000000', generate: false },
      access: {
        key: {
          type: 'string',
          default: process.env.AWS_ACCESS_KEY_ID || '<N/A>',
          alias: ['AWS_ACCESS_KEY_ID']
        },
        secret: {
          type: 'string',
          default: process.env.AWS_SECRET_ACCESS_KEY || '<N/A>',
          alias: ['AWS_SECRET_ACCESS_KEY']
        }
      },
      profile: {
        type: 'string',
        default: process.env.AWS_PROFILE || '<N/A>',
        generate: false
      }
    }
    if (options?.cognito) {
      r.cognito = {
        // id: { type: 'string' },
        userPoolId: {
          type: 'string',
          default: process.env.AWS_COGNITO_USER_POOL_ID
        },
        subDomain: {
          type: 'string',
          default: process.env.AWS_COGNITO_SUB_DOMAIN
        },
        // todo https://<cognito id>.auth.<region>.amazoncognito.com
        // domain: { type: 'string' },
        // todo https://cognito-idp.<region>.amazonaws.com/
        // <userPoolId>/.well-known/jwks.json
        // jwks: { type: 'string' },
        clientId: {
          type: 'string',
          default: process.env.AWS_COGNITO_CLIENT_ID
        },
        clientSecret: {
          type: 'string',
          default: process.env.AWS_COGNITO_CLIENT_SECRET
        }
      }
      // r.cognito.domain.default = (env) => {
      //   console.log(env)
      //   return `https://${env.congitoId}.auth.<region>.amazoncognito.com`
      // }
      // r.cognito.jwks = {
      // type: 'string', default: process.env.AWS_COGNITO_CLIENT_ID }
    }

    return r
  }

  const mailer = {
    client: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' },
    host: { type: 'string' },
    port: { type: 'number' }
  }
  const mailgun = JSON.parse(JSON.stringify(mailer))
  mailgun.host.force = 'mailgun'
  mailgun.host.default = 'smtp.mailgun.org'
  mailgun.port.default = 465

  const google = {
    email: { type: 'string' },
    pkey: { type: 'string' }
  }

  const backend = {
    host: { type: 'string', default: 'http://localhost:3000' },
    port: { type: 'number', default: 3000 },
    cdnURL: {
      type: 'string',
      default: 'http://localhost:3000/images',
      generate: false
    }
  }

  const base = {
    project: { type: 'string', default: '<undefined project>' },
    nodeEnv: { type: 'string', default: 'local' },
    projectLang: { type: 'string', default: 'en' },
    tz: {
      type: 'string',
      default: 'Asia/Kuala_Lumpur',
      generate: false,
      force: process.env.TZ
    },
    isDocker: { type: 'boolean', default: false }
  }

  const database = {
    host: { type: 'string', default: 'localhost' },
    name: { type: 'string' },
    user: { type: 'string' },
    password: { type: 'string' },
    port: { type: 'number', default: 5432, generate: false },
    pool: {
      min: { type: 'number', default: 1, generate: false },
      max: { type: 'number', default: 10, generate: false }
    }
  }

  const postgres = JSON.parse(JSON.stringify(database))
  postgres.port.default = 5432

  // todo object overrides existing env
  function recursiveEnv (
    key: string,
    value: RepoTherapyEnv.Detail,
    recuringKey: Array<string> = [],
    ogKey = false,
    baseEnv?: object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    const _key = key.toLowerCase() === '(default)' ? 'default' : key
    if (!(typeof value === 'string' || typeof value.type === 'string')) {
      const objVal = Object.fromEntries(
        Object.entries(value as Record<string, RepoTherapyEnv.Detail>)
          .flatMap(([k, v]) => Object.entries(
            recursiveEnv(k, v, [...recuringKey, _key], ogKey, baseEnv)
          ))
      )
      return ogKey ? objVal : { [_key]: objVal }
    }
    const _value = typeof value === 'string'
      ? { type: value }
      : value as (RepoTherapyEnv.Attribute & object)
    const [, ..._recuringKey] = recuringKey
    const currentRecuringKey = [..._recuringKey, _key]
    const _primaryKey = kebabCase(currentRecuringKey.join(' ')).toUpperCase()
      .split(/-/g)
      .filter(x => x)
      .reduce((acc, cur) => {
        if (cur === 'DEFAULT' || cur === '(DEFAULT)') {
          acc = [...acc, ...acc.map(x => `${x}_${cur}`)]
        } else { acc = acc.map(x => `${x}_${cur}`) }
        return acc
      }, [''] as Array<string>)
      .map(x => x.trim().replace(/^_/g, ''))
    const primaryKey = Object
      .entries(_primaryKey.reduce((acc, cur) => {
        const len = cur.match(/DEFAULT/g)?.length || 0
        if (!acc[len]) { acc[len] = [] }
        acc[len].push(cur)
        return acc
      }, {} as Record<number, Array<string>>))
      .sort(([a], [b]) => Number(a) - Number(b))
      .flatMap(([, v]) => v.sort())
    const fullKey = [...primaryKey, ...(_value.alias || [])]
    let currentEnvKey: string = primaryKey[0]
    for (let i = 0; i < fullKey.length; i++) {
      if (process.env[fullKey[i]]) {
        currentEnvKey = fullKey[i]
        break
      }
    }
    if (
      !currentEnvKey &&
      !_value.optional &&
      !_value.default &&
      _value.force === undefined
    ) { throw new Error(`Env not configured ${currentRecuringKey.join('.')}`) }
    // todo default support function (pass in env that is not a function)
    let returnValue = _value.force || process.env[currentEnvKey] || (
      _value.default !== undefined
        ? (
            typeof _value.default === 'function'
              ? (baseEnv ? _value.default(baseEnv) : undefined)
              : _value.default
          )
        : undefined
    )
    if (_value.type === 'number') { returnValue = Number(returnValue) }
    if (_value.type === 'boolean') {
      if (returnValue === 'true') { returnValue = true }
      if (returnValue === 'false') { returnValue = false }
    }
    if (
      returnValue !== undefined && (
        (_value.type === 'number' && isNaN(returnValue)) ||
        // eslint-disable-next-line valid-typeof
        typeof returnValue !== _value.type
      )
    ) {
      throw new Error(
        `Env type for ${currentRecuringKey.join('.')} should be ${_value.type}`
      )
    }
    return {
      [ogKey
        ? (
            currentEnvKey ||
            snakeCase(currentRecuringKey.join('_')).toUpperCase()
          )
        : _key
      ]: returnValue
    }
  }

  function recursiveEnvSample (
    key: string,
    value: RepoTherapyEnv.Detail,
    recuringKey: Array<string> = []
  ): Array<[string, { value: string, map: Array<string> }]> {
    if (typeof value.type !== 'string') {
      return Object.entries(value as Record<string, RepoTherapyEnv.Detail>)
        .flatMap(([k, v]) => recursiveEnvSample(k, v, [...recuringKey, key]))
    }
    const _value = typeof value === 'string'
      ? { type: value }
      : value as (RepoTherapyEnv.Attribute & object)
    const [, ..._recuringKey] = recuringKey
    if (_value.generate === false) { return [] }
    // todo default support function (pass in env that is not a function)
    return [[
      kebabCase(
        [..._recuringKey, key]
          .filter(x => x && key !== '(default)' && key !== 'default')
          .join(' ')
      ).toUpperCase().replace(/-/g, '_'),
      { value: _value.default || '', map: [..._recuringKey, key] }
    ]]
  }

  function recursiveEnvType (
    key: string,
    value: RepoTherapyEnv.Detail
  ): string {
    if (!value.type) {
      return `${key}: {\n  ${
        Object.entries(value as Record<string, RepoTherapyEnv.Detail>)
          .flatMap(([k, v]) => recursiveEnvType(k, v).split('\n'))
          .join('\n  ')
      }\n}`
    }
    let r = `  ${key}`
    if (value.optional || value.default) { r += '?' }
    r += `: ${value.type}`
    return r
  }

  const envPreset: RepoTherapyEnv.Preset = {
    aws,
    backend,
    base,
    database,
    google,
    mailer,
    mailgun,
    postgres
  }

  const config = handler({ envPreset })

  let envConfig = config.env || {}
  Object.entries(envPreset.base).reverse().forEach(([k, v]) => {
    const { [k]: x } = envConfig
    envConfig = { [k]: x || v, ...envConfig }
  })
  function envSample (preBuiltEnv?: RepoTherapy.Env) {
    return Object.fromEntries(
      recursiveEnvSample('env', envConfig).map(([k, v]) => {
        let result: string | undefined = preBuiltEnv as unknown as string
        if (preBuiltEnv) {
          for (let i = 0; i < v.map.length; i++) {
            if (typeof result !== 'object') { break }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = (result as any)[v.map[i]]
          }
        }
        if (!result) { result = v.value }
        return [k, result]
      })
    )
  }

  // if (config.skip) {
  //   return {
  //     env: envConfig,
  //     envSample: () => ({}),
  //     envType: () => '',
  //     getOriginalEnv: () => ({}),
  //     generateTypeDeclaration: () => {},
  //     config: { env: {} },
  //     warning
  //   }
  // }

  const defaultEnv = await defineRepoTherapyImport<string>()()
    .importScript('.env', { soft: true })
  const defaultEnvProject = dotenv.parse(defaultEnv.import || '').PROJECT
  if (config.project && defaultEnvProject !== config.project) {
    if (defaultEnv.import) {
      writeFileSync(
        join(libTool.rootPath, `${path}.${defaultEnvProject}${pathPostfix}`),
        defaultEnv.import || ''
      )
    }
    writeFileSync(
      join(libTool.rootPath, path),
      await defineRepoTherapyImport<string>()()
        .importScript(`${path}.${config.project}${pathPostfix}`, { soft: true })
        .then(x => x.import || '')
    )
  }
  const envInit = await defineRepoTherapyImport<string>()()
    .importScript('.env', { soft: true })

  dotenv.config({ path: envInit.fullPath })
  if (!process.env.PROJECT) { process.env.PROJECT = config.project }

  const rootEnv = recursiveEnv('env', envConfig)
  const env = recursiveEnv('env', envConfig, undefined, false, rootEnv).env
  const envSampleObj = envSample(env)
  const envSampleKey = Object.keys(envSampleObj)
    .map(x => new RegExp(`^${x}=`))
  const customEnv = envInit.import?.split(/\n/g).filter(
    x => x && !envSampleKey.find(y => y.test(x)) && !/^# /.test(x)
  ) || []
  const customEnvStr: Array<string> = []
  if (customEnv.length > 0) {
    customEnvStr.push('')
    customEnvStr.push('')
    customEnvStr.push('# ================================')
    customEnvStr.push('# Unconfigured env')
    customEnvStr.push('# ================================')
    customEnvStr.push(...customEnv)
  }
  const str = Object.entries(envSampleObj)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + customEnvStr.join('\n') + '\n'
  writeFileSync(envInit.fullPath, str)

  const paths = {
    configPath: config.paths?.configPath || 'repo-therapy.ts',
    typeDeclarationPath: config.paths?.typeDeclarationPath ||
      'types/_repo-therapy.d.ts'
  }

  function envType () {
    const [, ...str] = recursiveEnvType('env', envConfig).split('\n')
    return `interface ${config.typeName || 'RepoTherapyEnv'} {\n${
      str.join('\n')
    }`
  }

  return {
    env,
    envSample,
    envType,
    getOriginalEnv: () => recursiveEnv(
      'env',
      envConfig,
      undefined,
      true,
      rootEnv
    ),
    generateTypeDeclaration: () => {
      writeFileSync(
        join(libTool.rootPath, paths.typeDeclarationPath),
        // todo fix spacing when have extends
        `declare global {\n  ${envType().replace(/\n/g, '\n  ')}\n}`
      )
    },
    config: { env: envConfig }
  }
})

export { f as defineRepoTherapyEnv }
