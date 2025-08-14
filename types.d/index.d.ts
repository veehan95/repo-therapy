declare global {
  type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<Partial<T[P]>> : T[P]
  }

  namespace RepoTherapy {
    type ProjectType = 'npm-lib' | 'backend'

    interface EnvAttributeType {
      string: string
      number: number
      boolean: boolean
    }

    // type DeepLoose<U, T> = {
    //   [K in keyof T]: T[K] extends object
    //     ? DeepLoose<U, T[K]>
    //     : (_: U) => T[K]
    // }

    interface EnvAttribute <
      T extends keyof EnvAttributeType
    > {
      type: T
      optional?: boolean
      // todo
      default: EnvAttributeType[T] | (
        (_: DeepPartial<RepoTherapyEnv>) => EnvAttributeType[T]
      )
      generate?: boolean
      alias?: Array<string>
    }

    interface EnvDetail {
      [key: string]: EnvDetail | EnvAttribute;
    }

    interface EnvConfig {
      dir?: string
      list?: EnvDetail
      fileName?: string
      // list?: Array<Mapping | string>
    }

    type EnvPresetBase = Record<
      'project' | 'projectLang' | 'tz' | 'nodeEnv',
      EnvDetail
    >

    type EnvPresetDatabase = Record<
      'host' | 'name' | 'user' | 'password' | 'port', EnvDetail
    > & { pool: Record<'min' | 'max', EnvDetail> }

    type EnvPresetCognito = Record<
      'subDomain' | 'userPoolId' | 'clientId' | 'clientSecret',
      EnvDetail
    >

    interface EnvPresetAws {
      region: EnvDetail
      accountId: EnvDetail
      profile: EnvDetail
      access: Record<'key' | 'secret', EnvDetail>
      // todo force correct setting
      cognito?: EnvPresetCognito
    }

    type EnvPresetMailer = Record<
      'client' | 'name' | 'email' | 'password' | 'host' | 'port',
      EnvDetail
    >

    type EnvPresetGoogle = Record<'email' | 'pkey', EnvDetail>

    type EnvPresetBackend = Record<'host' | 'port' | 'cdnURL', EnvDetail>

    interface AwsOptions {
      cognito?: boolean
    }

    interface EnvPreset {
      aws: <U extends AwsOptions>(option?: U) => EnvPresetAws
      backend: EnvPresetBackend
      base: EnvPresetBase
      database: EnvPresetDatabase
      postgres: EnvPresetDatabase
      google: EnvPresetGoogle
      mailer: EnvPresetMailer
      mailgun: EnvPresetMailer
    }

    // eslint-disable-next-line
    interface Env {}

    type ImportObject <T> = {
      ext: string
      path: string
      fullPath: string
      import: () => Partial<T>
    }
  }

  function EnvHandler (_: {
    envPreset: RepoTherapy.EnvPreset
  }): DeepPartial<{
    skip?; boolean
    extends: Array<ReturnType<typeof defineRepoTherapy>>
    // todo use generic type
    projectType: 'backend' | 'npm'
    // todo remove ?
    env?: Record<string, RepoTherapy.EnvDetail>
    paths: {
      rootPath: string
      configPath: string
      typeDeclarationPath: string
    }
    typeName: string
  }>

  function defineRepoTherapyEnv (handler?: typeof EnvHandler): () => {
    envSample: () => Record<string, string>
    envType: () => string
    getOriginalEnv: () => Record<string, string>
    generateTypeDeclaration: () => void
    env: RepoTherapyEnv
    config: {
      env: Record<string, RepoTherapy.EnvDetail>
    }
  }

  function defineRepoTherapyCsv <T extends object, U extends object = T> (
    header: Array<string>,
    _?: {
      readParse?: (_: U) => T | undefined
      writeParse?: (_: T) => U | undefined
    }
  ): (path: string) => {
    read: () => Promise<Array<T>>
    write: (data: Array<T>) => Promise<void>
  }

  function defineRepoTherapy (
    handler?: typeof EnvHandler
  ): ReturnType<typeof defineRepoTherapyEnv>

  function defineRepoTherapyImport (
    handler?: () => DeepPartial<{ rootPath: string }>
  ): {
    importScript: <T extends object> (
      path: string,
      validator?: (_: Partial<T>) => void
    ) => RepoTherapy.ImportObject<T>
    // todo fix object
    importScriptFromDir: <T extends object> (path: string) => Array<{
      dir: string
      relativePath: string,
      validator?: (_: Partial<T>) => void
    } & RepoTherapy.ImportObject<T>>
  }

  function defineRepoTherapyTsconfig (
    handler: () => Partial<{
      rootPath: string
      path: string
      extends: string
      allowTsNode: string
      projectType: 'backend' | 'npm'
    }>
  ): () => {
    config: {
      compilerOptions: import('typescript').CompilerOptions
    }
  }
}

export {}
