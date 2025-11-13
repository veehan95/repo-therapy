declare global {
  namespace RepoTherapyUtil {
    type Slug = RepoTherapyUtil.Slug

    type GenericType = string | number | boolean | object | undefined |
      Array<GenericType>

    type DeepPartial<T> = {
      [P in keyof T]?: T[P] extends object ? DeepPartial<Partial<T[P]>> : T[P]
    }

    type RootPath <T extends Record<string, string>, U extends string> = {
      [P in keyof T]: `${U}${T[P]}`
    }

    type RawCsvRow <T = object> = {
      [P in keyof T]: string
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
      default?: RepoTherapyUtil.GenericType
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

    type Attribute <T extends keyof AttributeType = keyof AttributeType> = {
      type: T
      optional?: boolean
      generate?: boolean
      alias?: Array<string>
      force?: AttributeType<T>
      default?: AttributeType<T> | (
        () => Optional extends true
          ? undefined | AttributeType<T>
          : AttributeType<T>
      )
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

    type Handler <T extends RepoTherapyEnv.Detail> = (_: {
      envPreset: RepoTherapyEnv.Preset
    }) => RepoTherapyUtil.DeepPartial<{
      project: string
      env?: Record<string, T>
      paths: {
        configPath: string
        typeDeclarationPath: string
      }
      typeName: string
    }>
  }

  function defineRepoTherapyWrapper <
    T extends RepoTherapyUtil.Slug,
    U extends RepoTherapyUtil.GenericType,
    V extends Array<RepoTherapyUtil.GenericType> = []
  > (slug: T, handler: (...argv: V) => U, warpperClient?: string): (
    (...argv: V) => U
  ) & {
    slug: T
    warpperClient: string
    validate: (s: string) => void
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

    type Env <T extends RepoTherapyEnv.Detail> = {
      [P in keyof T]: T[P] extends RepoTherapyEnv.Attribute<infer U>
        ? U
        : Env<T[P]>
    }

    interface DefineLibTool <
      T extends RepoTherapyEnv.Detail,
      U extends Record<string, string>,
      Z1 extends {
        project: string
        build: string
      } & U = {
        project: string
        build: string
      } & U,
      Z2 extends string = string
    > {
      project: string
      path: Z1
      root: { root: Z2 } & RepoTherapyUtil.RootPath<Z1, Z2>
      logger: ReturnType<ReturnType<typeof defineRepoTherapyLogger>>['logger']
      env: Env<T>
      getOriginalEnv: Awaited<
        ReturnType<ReturnType<typeof defineRepoTherapyEnv>>
      >['getOriginalEnv']
      generateTypeDeclaration: Awaited<
        ReturnType<ReturnType<typeof defineRepoTherapyEnv>>
      >['generateTypeDeclaration']
      import: <T = object, U = string> (
        options: Partial<{
          packageJsonPath: string
          encoding: BufferEncoding
          headers: U extends `${string}.csv` ? Array<string> : undefined
          accept: Record<string, string | Array<string>>
          match?: RegExp
        }> = {}
      ) => ReturnType<ReturnType<typeof defineRepoTherapyImport<T, U>>>
    }

    function DefinationFunction <
      T extends RepoTherapyUtil.Slug,
      U extends Array<RepoTherapyUtil.GenericType> = [],
      V extends RepoTherapyUtil.GenericType = object,
      W extends Array<RepoTherapyUtil.GenericType> = []
    >(...args: Partial<U>): ReturnType<typeof defineRepoTherapyWrapper<T, V, W>>

    interface DefinationFunctionParams <
      T extends RepoTherapyEnv.Detail,
      U extends Record<string, string>,
    > {
      none: []
      tool: [RepoTherapy.DefineLibTool<T, U>]
    }

    type DefinationFunctionGeneric <
      T extends RepoTherapyUtil.Slug,
      U extends Array<RepoTherapyUtil.GenericType> = [],
      V extends RepoTherapyUtil.GenericType = object,
      W extends keyof DefinationFunctionParams = 'none',
      X extends Array<RepoTherapyUtil.GenericType> = []
    > = typeof RepoTherapy.DefinationFunction<
      T,
      U,
      V,
      [...DefinationFunctionParams[W], ...X]
    >
  }

  const defineRepoTherapyLint: RepoTherapy.DefinationFunctionGeneric<
    'define-lint',
    [Partial<{
      projectType: RepoTherapy.ProjectType
      framework: RepoTherapy.Framework
      vsCode: ReturnType<typeof defineRepoTherapyVsCode>
    }>],
    Promise<{ lint: () => void }>,
    'tool'
  >

  const defineRepoTherapyHusky: RepoTherapy.DefinationFunctionGeneric<
    'define-husky',
    [Partial<{
      packageManager: RepoTherapy.PackageManager
      // todo
      // precommit: Array<string>
    }>],
    {
      path: { preCommit: string }
      setup: () => void
    },
    'tool'
  >

  const defineRepoTherapyLogger: RepoTherapy.DefinationFunctionGeneric<
    'define-logger',
    [Partial<{
      service: string
      transportConfig: Array<'file' | 'console' | import('winston').transport>
    }>],
    {
      logger: {
        complete: import('winston').LeveledLogMethod
        error: import('winston').LeveledLogMethod
        info: import('winston').LeveledLogMethod
        success: import('winston').LeveledLogMethod
        warn: import('winston').LeveledLogMethod
      },
      printString: (level: string, s: string) => string
    },
    'tool'
  >

  // function defineRepoTherapyEnum <
  //   T extends object = object
  // > (enumObj: T): ReturnType<RepoTherapy.DefinationFunctionGeneric<
  //   'define-enum',
  //   T,
  //   T & {
  //     ValueType: Record<'String' | 'Number' | 'Boolean'>
  //   }
  // >>

  function defineRepoTherapyError <
    T extends object,
    U extends [string | {
      name: string
      defaultMessage?: string
      defaultProp?: T
    }] = [string | {
      name: string
      defaultMessage?: string
      defaultProp?: T
    }]
  > (...args: U): ReturnType<RepoTherapy.DefinationFunctionGeneric<
    'define-error',
    U,
    RepoTherapyUtil.CustomError<object>
  >>

  function defineRepoTherapyEnv <
    T extends RepoTherapyEnv.Detail
  > (
    handler: RepoTherapyEnv.Handler<T>
  ): ReturnType<typeof defineRepoTherapyWrapper<
    'define-env',
    Promise<{
      envSample: () => Record<string, string>
      envType: () => string
      getOriginalEnv: () => Record<string, string>
      generateTypeDeclaration: () => void
      env: RepoTherapy.Env<T>
    }>,
    'tool'
  >>

  // todo better typing
  function defineRepoTherapyCsv <
    RowType extends object,
    RawRowType extends RepoTherapyUtil.RawCsvRow<RowType> =
      RepoTherapyUtil.RawCsvRow<RowType>
  > (
    header: Array<string>,
    option?: {
      readParse: (x: RawRowType | undefined) => RowType | undefined
      writeParse: (x: RowType) => RawRowType
      autoGenerate: false
    }
  ): ReturnType<typeof defineRepoTherapyWrapper<'define-csv', {
    read: () => Promise<Array<RowType>>
    write: (data: Array<RowType>) => Promise<void>
  }, [string]>>

  // const defineRepoTherapyCli: RepoTherapy.DefinationFunctionGeneric<
  //   'define-cli',
  //   [
  //     Partial<Record<'lib' | 'custom', Array<string> | string>>,
  //     ReturnType<typeof defineRepoTherapy>,
  //     string
  //   ],
  //   Promise<void>
  // >

  function defineRepoTherapy <
    T extends RepoTherapyEnv.Detail,
    U extends Record<string, string>,
    Z1 extends {
      project: string
      build: string
    } & U = {
      project: string
      build: string
    } & U,
    Z2 extends string = string
  > (options?: Partial<{
      libName: string
      project: string
      path: U
      projectType: RepoTherapy.ProjectType
      framework: Array<RepoTherapy.Framework>
      logger: ReturnType<typeof defineRepoTherapyLogger>
      env: RepoTherapyEnv.Handler<T>
      serverCode: RepoTherapyUtil.DeepPartial<RepoTherapyUtil.ServerCode>
      error: Record<string, string | {
        defaultMessage: string
        // todo stricter type declaration
        // defaultProp: object
      }>
      silent: boolean
      // todo move to @types
      manualModuleTyping: Array<string>
    }>): ReturnType<RepoTherapy.DefinationFunctionGeneric<
      'define-repo-therapy',
      Partial<{
        libName: string
        project: string
        path: U
        projectType: RepoTherapy.ProjectType
        framework: Array<RepoTherapy.Framework>
        logger: ReturnType<typeof defineRepoTherapyLogger>
        env: RepoTherapyEnv.Handler<T>
        serverCode: RepoTherapyUtil.DeepPartial<RepoTherapyUtil.ServerCode>
        error: Record<string, string | {
          defaultMessage: string
          // todo stricter type declaration
          // defaultProp: object
        }>
        silent: boolean
        // todo move to @types
        manualModuleTyping: Array<string>
      }>,
      Promise<RepoTherapy.DefineLibTool<T, U, Z1, Z2> & {
        init: () => Promise<void>
        serverCode: Record<string, RepoTherapyUtil.ServerCodeConfig>
        error: Record<string, RepoTherapyUtil.CustomError<object>>
        newError: typeof defineRepoTherapyError
        lint: () => ReturnType<ReturnType<typeof defineRepoTherapyLint>>
        json: typeof defineRepoTherapyJson
        packageJson: Awaited<
          ReturnType<ReturnType<typeof defineRepoTherapyPackageJson>>
        >
        isLocal: boolean
        enum: ReturnType<ReturnType<defineRepoTherapyEnum>>
      }>
    >>

  function defineRepoTherapyImport <T = object, U = string> (
    options?: Partial<{
      packageJsonPath: string
      encoding: BufferEncoding
      headers: U extends `${string}.csv` ? Array<string> : undefined
      accept: Record<string, string | Array<string>>
      // todo fix
      // accept: U extends `${string}.${
      //   'js' | 'cjs' | 'mjs' | 'jsx' | 'ts' | 'tsx'
      // }`
      //   ? Record<string, keyof T | Array<keyof T>>
      //   : undefined
      match: RegExp
    }>
  ): ReturnType<typeof defineRepoTherapyWrapper<'define-import', {
    rootPath: Promise<string>
    importScript: (
      path: U,
      options?: RepoTherapyUtil.DeepPartial<{ soft: boolean }>
    ) => Promise<RepoTherapy.ImportObject<T>>
    importScriptFromDir: (
      path: string | Array<string>,
      options?: RepoTherapyUtil.DeepPartial<{ soft: boolean }>
    ) => Promise<
      Array<{
        dir: string
        relativePath: string,
        validator?: (_: Partial<T>) => void
      } & RepoTherapy.ImportObject<T>>
    >
  }>>

  function defineRepoTherapyScript <
    T extends object,
    U extends RepoTherapyEnv.Detail,
    V extends Record<string, string>
  > (
    describe: string,
    handler: (libTool: RepoTherapy.DefineLibTool<U, V>, args: T) => void,
    builder?: (
      libTool: RepoTherapy.DefineLibTool<U, V>,
      argv: import('yargs').Argv<T>
    ) => void | import('yargs').Argv<T>
  ): ReturnType<typeof defineRepoTherapyWrapper<'define-script', Promise<{
    describe: string
    builder: (argv: import('yargs').Argv<T>) => void | import('yargs').Argv<T>
    handler: (args: T) => void
    command: string
  }>, [RepoTherapy.DefineLibTool<U, V>, string, 'lib' | 'custom']>>

  const defineRepoTherapyPackageJson: RepoTherapy.DefinationFunctionGeneric<
    'define-package-json',
    [RepoTherapyUtil.DeepPartial<{
      path: string
      projectType: RepoTherapy.ProjectType
      packageManager: RepoTherapy.PackageManager
    }>],
    Promise<{
      path: string
      json: import('type-fest').PackageJson.PackageJsonStandard
      write: () => void
    }>,
    'tool'
  >

  function defineRepoTherapyJson <T extends object> (
    objDefination: RepoTherapyUtil.JsonDefination
  ): ReturnType<typeof defineRepoTherapyWrapper<'define-json', {
    json: T
    match: (data: T) => Array<string>
    difference: (data: T) => RepoTherapyUtil.DeepPartial<T>
  }>, [T]>

  const defineRepoTherapyTsconfig: RepoTherapy.DefinationFunctionGeneric<
    'define-tsconfig',
    [Partial<{
      path: string
      extends: string
      allowTsNode: boolean
      projectType: RepoTherapy.ProjectType
    }>],
    Promise<{
      config: RepoTherapyUtil.DeepPartial<RepoTherapyUtil.TsConfigJson>
      path: string
      write: () => void
    }>,
    'tool'
  >

  function defineRepoTherapyGitignore <
    T extends RepoTherapyEnv.Detail,
    U extends Record<string, string>
  > (handler?: Partial<{
    path: string
    framework: Array<RepoTherapy.Framework>
    custom: (s: Array<string>) => Array<string>
  }>): ReturnType<typeof defineRepoTherapyWrapper<'define-gitignore', Promise<{
    config: Record<string, Array<string>>
    path: string
    write: () => void
  }>, [RepoTherapy.DefineLibTool<T, U>]>>

  function defineRepoTherapyVsCode <
    T extends RepoTherapyEnv.Detail,
    U extends Record<string, string>
  >(
    handler?: Partial<{
      path: string
      gitignorePath: string
      framework: Array<RepoTherapy.Framework>
      packageManager: RepoTherapy.PackageManager
      custom: (s: Array<string>) => Array<string>
    }>
  ): ReturnType<typeof defineRepoTherapyWrapper<'define-vscode', Promise<{
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
  }>, [RepoTherapy.DefineLibTool<T, U>]>>
}

export {}
