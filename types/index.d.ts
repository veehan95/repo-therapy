declare global {
  namespace RepoTherapyUtil {
    type DeepPartial<T> = {
      [P in keyof T]?: T[P] extends object ? DeepPartial<Partial<T[P]>> : T[P]
    }

    interface CustomError <T extends object> extends Error {
      name: string
      props: T
      instanceOf (s: string): boolean
    }

    type ServerCodeName = {
      informational: 'continue' | 'switchingProtocols' | 'processing' |
        'earlyHints'
      success: 'ok' | 'created' | 'accepted' | 'nonAuthoritativeInformation' |
        'noContent' | 'resetContent' | 'partialContent' | 'multiStatus' |
        'alreadyReported' | 'imUsed'
      redirection: 'multipleChoices' | 'movedPermanently' | 'found' |
        'seeOther' | 'notModified' | 'useProxy' | 'temporaryRedirect' |
        'permanentRedirect'
      clientError: 'badRequest' | 'unauthorized' | 'paymentRequired' |
        'forbidden' | 'notFound' | 'methodNotAllowed' | 'notAcceptable' |
        'proxyAuthenticationRequired' | 'requestTimeout' | 'conflict' | 'gone' |
        'lengthRequired' | 'preconditionFailed' | 'payloadTooLarge' |
        'uriTooLong' | 'unsupportedMediaType' | 'rangeNotSatisfiable' |
        'expectationFailed' | 'imATeapot' | 'misdirectedRequest' |
        'unprocessableEntity' | 'locked' | 'failedDependency' | 'tooEarly' |
        'upgradeRequired' | 'preconditionRequired' | 'tooManyRequests' |
        'requestHeaderFieldsTooLarge' | 'unavailableForLegalReasons'
      serverError: 'internalServerError' | 'notImplemented' | 'badGateway' |
        'serviceUnavailable' | 'gatewayTimeout' | 'httpVersionNotSupported' |
        'variantAlsoNegotiates' | 'insufficientStorage' | 'loopDetected' |
        'notExtended' | 'networkAuthenticationRequired'
    }

    type ServerCodeInfo = {
      statusCode: number
      defaultMessage?: string
    }

    type ServerCode = Record<
      string,
      Record<string, RepoTherapyUtil.ServerCodeInfo>
    >

    type ServerCodeConfig <T extends object = object> = T & {
      name: string
      isError: boolean
      category: string
      defaultMessage?: string
    }

    interface TypeConversion {
      string: string
      number: number
      boolean: boolean
      object: object
    }

    type JsonDefinationDetail = {
      // force type
      default?: string | number | boolean | object |
        Array<string | number | boolean | object>
      optional?: boolean
      type?: keyof TypeConversion | `Array<${keyof TypeConversion}>`
      sort?: boolean
      merge?: boolean
    } | boolean

    interface JsonDefination {
      [s: string]: JsonDefinationDetail
    }

    interface TsConfigJson {
      extends?: string
      'ts-node': import('ts-node').TsConfigOptions
      compilerOptions: Partial<import('typescript').CompilerOptions>
      files?: Array<string>
      include?: Array<string>
      exclude?: Array<string>
      references?: Array<string>
    }
  }

  namespace RepoTherapyEnv {
    interface AttributeType {
      string: string
      number: number
      boolean: boolean
    }

    type Attribute <T extends keyof AttributeType = string> = {
      type: T
      optional?: boolean
      // todo
      // default: AttributeType[T] | (
      //   (_: RepoTherapyUtil.DeepPartial<RepoTherapyEnv>) => AttributeType[T]
      // )
      generate?: boolean
      alias?: Array<string>
      force?: AttributeType<T>
      default?: AttributeType<T>
    } | T

    interface Detail {
      [key: string]: Detail | Attribute;
    }

    interface Config {
      dir?: string
      list?: Detail
      fileName?: string
      // list?: Array<Mapping | string>
    }

    type PresetBase = Record<
      'project' | 'projectLang' | 'tz' | 'nodeEnv',
      Attribute
    >

    type PresetDatabase = Record<
      'host' | 'name' | 'user' | 'password' | 'port', Attribute
    > & { pool: Record<'min' | 'max', Attribute> }

    type PresetCognito = Record<
      'subDomain' | 'userPoolId' | 'clientId' | 'clientSecret',
        // | 'domain' | 'jwks' | 'id',
      Attribute
    >

    interface PresetAws {
      region: Attribute
      accountId: Attribute
      profile: Attribute
      access: Record<'key' | 'secret', Attribute>
      // todo force correct setting
      cognito?: PresetCognito
    }

    type PresetMailer = Record<
      'client' | 'email' | 'password' | 'host' | 'port',
      Attribute
    >

    type PresetGoogle = Record<'email' | 'pkey', Attribute>

    type PresetBackend = Record<'host' | 'port' | 'cdnURL', Attribute>

    interface AwsOptions {
      cognito?: boolean
    }

    interface Preset {
      aws: <U extends AwsOptions>(option?: U) => PresetAws
      backend: PresetBackend
      base: PresetBase
      database: PresetDatabase
      postgres: PresetDatabase
      google: PresetGoogle
      mailer: PresetMailer
      mailgun: PresetMailer
    }

    type Handler = (_: {
      envPreset: RepoTherapyEnv.Preset
    }) => RepoTherapyUtil.DeepPartial<{
      project: string
      // skip?; boolean
      env?: Record<string, RepoTherapyEnv.Detail>
      paths: {
        configPath: string
        typeDeclarationPath: string
      }
      typeName: string
    }>
  }

  namespace RepoTherapy {
    type ProjectType = 'npm-lib' | 'frontend' | 'backend'

    type Framework = 'next.js' | 'nuxt.js' | 'angular' | 'svelte' | 'vue.js' |
      'serverless' | 'dynamodb' | 'knexpresso' | 'nuxt-monorepo'

    type PackageManager = 'yarn' | 'npm' | 'pnpm'

    type ImportObject <T> = {
      ext: string
      path: string
      fullPath: string
      import?: T
    }

    interface Env {
      nodeEnv: string
      project: string
    }

    interface DefineLibTool {
      rootPath: string
      logger: ReturnType<ReturnType<typeof defineRepoTherapyLogger>>['logger']
      env: Env
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function defineRepoTherapyWrapper <T extends Function> (
    slug: string,
    func: T,
    warpperClient?: string
  ): T & {
    slug: string
    warpperClient: string
    validate: (s: string) => void
  }

  function defineRepoTherapyLint (handler?: Partial<{
    projectType: RepoTherapy.ProjectType
    framework: RepoTherapy.Framework
    vsCode: ReturnType<typeof defineRepoTherapyVsCode>
  }>): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool
  ) => Promise<{ lint: () => void }>>>

  function defineRepoTherapyHusky (
    options: RepoTherapyUtil.DeepPartial<{
      packageManager: RepoTherapy.PackageManager
      // todo
      // precommit: Array<string>
    }>
  ): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool
  ) => {
    path: {
      preCommit: string
    }
    setup: () => void
  }>>

  function defineRepoTherapyLogger (
    options?: RepoTherapyUtil.DeepPartial<{
      service: string
      transportConfig: Array<'file' | 'console' | import('winston').transport>
    }>
  ): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool
  ) => {
    logger: {
      complete: import('winston').LeveledLogMethod
      error: import('winston').LeveledLogMethod
      info: import('winston').LeveledLogMethod
      success: import('winston').LeveledLogMethod
      warn: import('winston').LeveledLogMethod
    },
    printString: (level: string, s: string) => string
  }>>

  function defineRepoTherapyError <T extends object> (
    error: string | {
      name: string
      defaultMessage?: string
      defaultProp?: T
    }
  ): ReturnType<typeof defineRepoTherapyWrapper<
    () => RepoTherapyUtil.CustomError<object>
  >>

  function defineRepoTherapyEnv (
    handler?: RepoTherapyEnv.Handler
  ): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool
  ) => Promise<{
    envSample: () => Record<string, string>
    envType: () => string
    getOriginalEnv: () => Record<string, string>
    generateTypeDeclaration: () => void
    env: RepoTherapy.Env
    config: {
      env: Record<string, RepoTherapyEnv.Detail>
    }
    warning: Array<string>
  }>>>

  // todo better typing
  function defineRepoTherapyCsv <T extends object, U extends object = T> (
    header: Array<string>,
    option?: {
      readParse: (x: U | undefined) => T | undefined
      writeParse: (x: T | undefined) => U | undefined
      autoGenerate: false
    }
  ): ReturnType<typeof defineRepoTherapyWrapper<(path: string) => {
    read: () => Promise<Array<T>>
    write: (data: Array<T>) => Promise<void>
  }>>

  function defineRepoTherapyCli (
    handler?: (
      yargs: yargs.Argv<
        { project: string | undefined } &
        { type: string | undefined }
      >
    ) => void | Promise<void>
  ): ReturnType<typeof defineRepoTherapyWrapper<() => Promise<{
    cli: undefined
  }>>>

  function defineRepoTherapy (options?: Partial<{
    project: string
    projectType: RepoTherapy.ProjectType
    framework: Array<RepoTherapy.Framework>
    logger: ReturnType<typeof defineRepoTherapyLogger>
    env: RepoTherapyEnv.Handler
    serverCode: RepoTherapyUtil.DeepPartial<RepoTherapyUtil.ServerCode>
    error: Record<string, string | {
      defaultMessage: string
      // todo stricter type declaration
      // defaultProp: object
    }>
    // todo move to @types
    manualModuleTyping: Array<string>
  }>): ReturnType<typeof defineRepoTherapyWrapper<() => Promise<{
    init: () => Promise<void>
    rootPath: string
    env: Awaited<ReturnType<ReturnType<typeof defineRepoTherapyEnv>>>['env']
    newError: typeof defineRepoTherapyError
    serverCode: Record<string, RepoTherapyUtil.ServerCodeConfig>
    error: Record<string, RepoTherapyUtil.CustomError<object>>
    logger: ReturnType<ReturnType<typeof defineRepoTherapyLogger>>['logger']
    lint: () => ReturnType<ReturnType<typeof defineRepoTherapyLint>>
    wrapper: typeof defineRepoTherapyWrapper
    import: <T = object, U = string> (
      options: RepoTherapyUtil.DeepPartial<{
        encoding: BufferEncoding
        headers: U extends `${string}.csv` ? Array<string> : undefined
        accept: U extends `${string}.${
          'js' | 'cjs' | 'mjs' | 'jsx' | 'ts' | 'tsx'
        }`
          ? Record<string, keyof T | Array<keyof T>>
          : undefined
      }>
    ) => ReturnType<typeof defineRepoTherapyImport<T, U>>
    script: (
      handler: (libTool: RepoTherapy.DefineLibTool, args: T) => void,
      builder?: (
        libTool: RepoTherapy.DefineLibTool,
        argv: import('yargs').Argv<T>
      ) => void | import('yargs').Argv<T>
    ) => (scriptName: string) => ReturnType<
      ReturnType<typeof defineRepoTherapyScript>
    >
    json: typeof defineRepoTherapyJson
    packageJson: import('type-fest').PackageJson.PackageJsonStandard
  }>>>

  function defineRepoTherapyImport <T = object, U = string> (
    options?: RepoTherapyUtil.DeepPartial<{
      packageJsonPath: string
      encoding: BufferEncoding
      headers: U extends `${string}.csv` ? Array<string> : undefined
      accept: U extends `${string}.${
        'js' | 'cjs' | 'mjs' | 'jsx' | 'ts' | 'tsx'
      }`
        ? Record<string, keyof T | Array<keyof T>>
        : undefined
    }>
  ): ReturnType<typeof defineRepoTherapyWrapper<() => {
    rootPath: Promise<string>
    importScript: (
      path: U,
      options?: RepoTherapyUtil.DeepPartial<{ soft: booleanm}>
    ) => Promise<RepoTherapy.ImportObject<T>>
    importScriptFromDir: (
      path: string,
      options?: RepoTherapyUtil.DeepPartial<{ soft: boolean }>
    ) => Promise<
      Array<{
        dir: string
        relativePath: string,
        validator?: (_: Partial<T>) => void
      } & RepoTherapy.ImportObject<T>>
    >
  }>>

  function defineRepoTherapyScript <T extends object> (
    handler: (libTool: RepoTherapy.DefineLibTool, args: T) => void,
    builder?: (
      libTool: RepoTherapy.DefineLibTool,
      argv: import('yargs').Argv<T>
    ) => void | import('yargs').Argv<T>
  ): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool,
    scriptName: string
  ) => Promise<{
    builder: (argv: import('yargs').Argv<T>) => void | import('yargs').Argv<T>
    handler: (args: T) => void
    scriptName: string
  }>>>

  function defineRepoTherapyPackageJson (
    options?: RepoTherapyUtil.DeepPartial<{
      path: string
      projectType: RepoTherapy.ProjectType
      packageManager: RepoTherapy.PackageManager
    }>
  ): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool
  ) => Promise<{
    path: string
    json: import('type-fest').PackageJson.PackageJsonStandard
    write: () => void
  }>>>

  function defineRepoTherapyJson <T extends object> (
    objDefination: RepoTherapyUtil.JsonDefination
  ): ReturnType<typeof defineRepoTherapyWrapper<(data: T) => {
    json: T
    match: (data: T) => Array<string>
    difference: (data: T) => RepoTherapyUtil.DeepPartial<T>
  }>>

  function defineRepoTherapyTsconfig (
    options?: Partial<{
      path: string
      extends: string
      allowTsNode: boolean
      projectType: RepoTherapy.ProjectType
    }>
  ): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool
  ) => Promise<{
    config: RepoTherapyUtil.DeepPartial<RepoTherapyUtil.TsConfigJson>
    path: string
    write: () => void
  }>>>

  function defineRepoTherapyGitignore (handler?: Partial<{
    path: string
    framework: Array<RepoTherapy.Framework>
    custom: (s: Array<string>) => Array<string>
  }>): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool
  ) => Promise<{
    config: Record<string, Array<string>>
    path: string
    write: () => void
  }>>>

  function defineRepoTherapyVsCode (
    handler?: Partial<{
      path: string
      gitignorePath: string
      framework: Array<RepoTherapy.Framework>
      packageManager: RepoTherapy.PackageManager
      custom: (s: Array<string>) => Array<string>
    }>
  ): ReturnType<typeof defineRepoTherapyWrapper<(
    libTool: RepoTherapy.DefineLibTool
  ) => Promise<{
    config: {
      // todo
      settings: object
      extensions: object
    }
    path: {
      settings: string
      extensions: string
    }
    write: () => void
  }>>>
}

export {}
