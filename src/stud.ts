import { dirname, join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { RepoTherapyUtilBase } from './base.js'
import type RepoTherapy from './repo-therapy.js'
import type { FilePath, ObjectDefinition } from './types.js'
import type { ValueTypeDefinition } from '../generated/types/value-types.js'

export type Options <
  Variables extends Record<string, string | boolean | number | undefined> = {},
  StaticName extends boolean = false
> = {
  staticName?: StaticName
  variableDefinitions?: (
    valueType: ValueTypeDefinition
  ) => ObjectDefinition<Variables>
}

export type StudFile <StaticName extends boolean = false> = {
  source: FilePath
  destination: StaticName extends true
    ? FilePath
    : (name: string) => FilePath
}

export default class RTStud <
  Variables extends Record<string, string | boolean | number | undefined> = {},
  StaticName extends boolean = false,
  CustomOptions extends object = object
> extends RepoTherapyUtilBase<
  Options<Variables, StaticName> & CustomOptions & {
    files: StudFile<StaticName>[]
  }
> {
  public get staticName () {
    return !!this._options.staticName
  }

  public get files () {
    return this._options.files.map((x) => {
      const relativePath = `/config/studs${x.source}.stud` as FilePath
      const source = this._repoTherapy
        .findFile(['stud'], relativePath, true)
      if (!source) {
        throw new this.errorClass('server_resource_not_found', {
          fields: [relativePath]
        })
      }
      return {
        ...x,
        source: `${x.source}.stud`,
        content: readFileSync(source, 'utf8')
      }
    })
  }

  constructor (
    repoTherapy: RepoTherapy,
    files: StudFile<StaticName>[],
    options: Options<Variables, StaticName> & CustomOptions
  ) {
    super(repoTherapy, {
      ...options,
      staticName: !!options.staticName,
      files
    })
  }

  protected _getPath (path: FilePath) {
    for (const dir of this._repoTherapy.directories) {
      const fullPath = (join(dir, path) + '.stud') as FilePath
      if (existsSync(fullPath)) { return fullPath }
    }
    return
  }

  public getSections () {
    return [...new Set(this.files
      .reduce((acc, cur) => acc + '\n/* ------ */\n' + cur.content, '')
      .match(/\/\* section (\S*) start \*\//g)
      ?.map(x => x.replace(/(^\/\* section )|( start \*\/$)/g, '').trim()) || []
    )]
  }

  public getVariables (): ObjectDefinition<Variables> {
    if (this._options.variableDefinitions) {
      return this._options.variableDefinitions(this._repoTherapy.valueType)
    }
    const variables = this.files
      .reduce((acc, cur) => acc + '\n/* ------ */\n' + cur.content, '')
      .match(/\{\{([^}]*)\}\}/g)
      ?.map(x => x.replace(/(^\{\{)|(\}\}$)/g, '').trim()) || []
    return Object.fromEntries([...new Set(variables)].map(
      key => [key, this._repoTherapy.valueType.string(key)]
    )) as unknown as ObjectDefinition<Variables>
  }

  private parseContent (
    template: string,
    variables: Variables,
    removeSection: string[]
  ) {
    let content = Object.entries(variables).reduce((acc, [k, v]) => {
      return v !== undefined
        ? acc.replace(new RegExp(`\\{\\{(\\s|\\t)*${k}(\\s|\\t)*\\}\\}`), v.toString())
        : acc
    }, template)
    if (removeSection.length > 0) {
      const regexp = new RegExp(`^(\\t|\\s)*/\\*\\s*section\\s*(${
        removeSection.join('|')
      })\\s*start\\s*\\*/(?:(?!/\\*\\s*section\\s*\\2\\s*end\\s*\\*/)[\\s\\S])*/\\*\\s*section\\s*\\2\\s*end\\s*\\*/(\\t|\\s)*?$`, 'gm')
      content = content.replace(regexp, '')
    }
    return decodeURIComponent(content.replace(
      /^(\t|\s)*\/\* section (\S*) (start|end) \*\/(\t|\s|\n|\r)*$/gm,
      ''
    ))
  }

  public writeFiles (
    name: string,
    variables: Variables,
    removeSection: string[]
  ) {
    const func: (() => void)[] = []
    this.files.forEach(({ destination, content }) => {
      if (!this.staticName && typeof destination !== 'function') {
        throw new this.errorClass('server_configuration_unknown', {
          message: 'destination setter is not a function',
          fields: [name]
        })
      }
      const d = this.staticName
        ? destination as string
        : (destination as (s: string) => string)(name)
      const dest = join(this._repoTherapy.repoRoot, d)
      if (typeof dest !== 'string') {
        throw new this.errorClass('server_configuration_unknown', {
          message: 'destination is not a path',
          fields: [name]
        })
      }
      const c = this.parseContent(content, variables, removeSection)
      if (existsSync(dest)) {
        throw new this.errorClass('resource_conflict', { fields: [d] })
      }
      const dir = dirname(dest)
      if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }) }
      func.push(() => {
        this.logger
          .debug(() => ['writing to...', dest, `${c.length} characters`])
        writeFileSync(dest, c)
      })
    })
    func.forEach(x => x())
  }

  static define <
    T extends Record<string, string | boolean | number | undefined> = {},
    U extends boolean = false,
    V extends object = object
  >(
    files: StudFile<U>[],
    options: Options<T, U> & V = {} as V
  ): (repoTherapy: RepoTherapy) => RTStud<T, U, V> {
    return (repoTherapy: RepoTherapy) => {
      return new RTStud<T, U, V>(repoTherapy, files, options)
    }
  }
}
