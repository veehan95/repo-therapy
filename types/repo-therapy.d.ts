import { defineRepoTherapyWrapper } from 'src'
import { NodeJavaScriptExt, NodeTypeScriptExt } from 'src/statics/enums'

export namespace Util {
  export type GenericType = string | number | boolean | object | undefined |
    null | Array<GenericType>

  // todo
  // export type SlugChar = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' |
  //   'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' |
  //   'v' | 'w' | 'x' | 'y' | 'z' | '0' | '1' | '2' | '3' | '4' | '5' | '6' |
  //   '7' | '8' | '9' | '0'
  // export type SlugSegment <
  //   T extends string = string
  // > = T extends `${SlugChar}${infer U}` ? SlugSegment<U> : T

  export type SlugCase<
    T extends string = string
  > = T extends `${string}-${infer U}` ? SlugCase<U> : T

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
