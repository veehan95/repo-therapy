declare global {
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
      T extends keyof EnvAttributeType = 'string'
    > {
      type: T
      optional?: boolean
      // todo
      default: EnvAttributeType[T] | ((_: object) => EnvAttributeType[T])
      generate?: boolean
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

    interface EnvPresetAws {
      region: EnvDetail
      access: Record<'key' | 'secret', EnvDetail>
    }

    type EnvPresetBase = Record<
      'project' | 'projectLang' | 'tz' | 'nodeEnv',
      EnvDetail
    >

    type EnvPresetDatabase = Record<
      'host' | 'name' | 'user' | 'password' | 'sslRejectUnauthorized' | 'port',
      EnvDetail
    > & { pool: Record<'min' | 'max', EnvDetail> }

    type EnvPresetCognito = Record<
      'region' | 'domain' | 'clientId' | 'clientSecret',
      EnvDetail
    >

    type EnvPresetMailer = Record<
      'client' | 'name' | 'email' | 'password' | 'host' | 'port',
      EnvDetail
    >

    type EnvPresetGoogle = Record<'email' | 'pkey', EnvDetail>

    type EnvPresetBackend = Record<'host' | 'port' | 'cdnURL', EnvDetail>

    interface EnvPreset {
      aws: EnvPresetAws
      backend: EnvPresetBackend
      base: EnvPresetBase
      cognito: EnvPresetCognito
      database: EnvPresetDatabase
      postgres: EnvPresetDatabase
      google: EnvPresetGoogle
      mailer: EnvPresetMailer
      mailgun: EnvPresetMailer
    }

    type Env = object
  }
}

export {}
