import { defineRepoTherapyImport } from '../defines/import'

export namespace Env {
  type NodeEnv = 'production' | 'staging' | 'dev'

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
}

export namespace Util {
  type GenericType = string | number | boolean | object | undefined |
    null | Array<GenericType>

  type Env <T extends RepoTherapyEnv.Detail> = {
    [P in keyof T]: T[P] extends RepoTherapyEnv.Attribute<infer U>
      ? U
      : Env<T[P]>
  }

  type BaseEnv <T extends RepoTherapyEnv.Detail = object> = Env<{
    // to fix
    nodeEnv: Env.NodeEnv
    project: string
  } & T>

  type Path = `/${string}`

  type ScriptPath = `${Util.Path}${NodeJavaScriptExt | NodeTypeScriptExt}`

  type JsonPath = `${Util.Path}.json`

  type LinkPath = Record<string, Path>

  interface LibTool <
    EnvDetail extends Env.Detail,
    Paths extends Record<string, string> = object,
    PathList extends {
      project: string
      build: string
    } & Paths = {
      project: string
      build: string
    } & Paths,
    RootBase extends string = string
  > {
    project: string
    path: PathList
    root: { root: RootBase } & RepoTherapyUtil.RootPath<PathList, RootBase>
    logger: ReturnType<ReturnType<typeof defineRepoTherapyLogger>>['logger']
    packageJson: Await<
      ReturnType<ReturnType<typeof defineRepoTherapyPackageJson>>
    >
    env: Env<EnvDetail>
    getOriginalEnv: Awaited<
      ReturnType<ReturnType<typeof defineRepoTherapyEnv>>
    >['getOriginalEnv']
    generateTypeDeclaration: Awaited<
      ReturnType<ReturnType<typeof defineRepoTherapyEnv>>
    >['generateTypeDeclaration']
    import: <ImportReturn = object, FilePath = string> (
      options: Partial<{
        packageJsonPath: string
        encoding: BufferEncoding
        headers: FilePath extends `${string}.csv` ? Array<string> : undefined
        accept: Record<string, string | Array<string>>
        match?: RegExp
      }> = {}
    ) => ReturnType<ReturnType<
      typeof defineRepoTherapyImport<ImportReturn, FilePath>
    >>
  }
}
