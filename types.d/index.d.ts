declare global {
  namespace RepoTherapy {
    type ProjectType = 'npm-lib' | 'backend'

    interface EnvAttributeType {
      string: string
      number: number
      boolean: boolean
    }

    type DeepLoose<U, T> = {
      [K in keyof T]: T[K] extends object
        ? DeepLoose<U, T[K]>
        : (_: U) => T[K]
    }

    interface EnvAttribute <
      T extends keyof EnvAttributeType = 'string'
    > {
      type: T
      optional?: boolean
      default: EnvAttributeType[T] | ((
        _: DeepLoose<Record<string, string | number | boolean | object>>
      ) => EnvAttributeType[T])
      generate?: boolean
    }

    type EnvConfig = Record<string, EnvConfig | EnvAttribute>

    interface EnvConfig {
      dir?: string
      list?: EnvConfig
      fileName?: string
      // list?: Array<Mapping | string>
    }

    type EnvPreset = typeof import('../utils/env/preset').default
  }
}

export {}
