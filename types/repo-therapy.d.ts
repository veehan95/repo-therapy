import { defineRepoTherapyWrapper } from 'src'
import { NodeJavaScriptExt, NodeTypeScriptExt } from 'src/statics/enums'

// export namespace Env {
//   export type NodeEnv = 'production' | 'staging' | 'dev'

//   export type Attribute <T extends keyof AttributeType = keyof AttributeType> = {
//     type: T
//     optional?: boolean
//     generate?: boolean
//     alias?: Array<string>
//     force?: AttributeType<T>
//     default?: AttributeType<T> | (
//       () => Optional extends true
//         ? undefined | AttributeType<T>
//         : AttributeType<T>
//     )
//   } | T

//   export interface Detail {
//     [key: string]: Detail | Attribute;
//   }
// }

export namespace Util {
  export type GenericType = string | number | boolean | object | undefined |
    null | Array<GenericType>

  // export type Env <T extends RepoTherapyEnv.Detail> = {
  //   [P in keyof T]: T[P] extends RepoTherapyEnv.Attribute<infer U>
  //     ? U
  //     : Env<T[P]>
  // }

  // export type BaseEnv <T extends RepoTherapyEnv.Detail = object> = Env<{
  //   // to fix
  //   nodeEnv: Env.NodeEnv
  //   project: string
  // } & T>

  export type Path = `/${string}`

  export type ScriptPath = `${Util.Path}${
    NodeJavaScriptExt | NodeTypeScriptExt
  }`

  export type JsonPath = `${Util.Path}.json`

  export type LinkPath = Record<string, Path>

  export type ScriptObj = Record<
    string,
    ReturnType<typeof defineRepoTherapyWrapper>
  >

  export interface ImportScript <T, Soft extends Boolean = false> {
    ext: string
    exist: boolean
    path: Util.Path
    fullPath: Util.Path
    import: Soft extends true ? undefined | Awaited<T> : Awaited<T>
  }

  export interface ImportScriptDir <T> extends ImportScript <T> {
    relativePath: Util.Path
    dir: Util.Path
  }

  export interface DirImport {
    path: Util.Path
    absolute?: boolean
  }
}
