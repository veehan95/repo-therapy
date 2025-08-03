import { existsSync, lstatSync, readdirSync } from 'fs'
import { extname, join } from 'path'
import { register } from 'ts-node'

let tsImported = false

const _defineRepoTherapyImport: typeof defineRepoTherapyImport = (
  handler
) => {
  const h = handler ? handler() : {}
  const rootPath = h.rootPath || __dirname.replace(/\/node_modules\/.*$/, '')
  function importScript <T extends object> (
    path: string,
    validator?: (_: Partial<T>) => void
  ): RepoTherapy.ImportObject<T> {
    const fPath = join(rootPath, path)
    const ext = extname(fPath)
    const o: RepoTherapy.ImportObject<T> = {
      ext,
      path: `/${path}`.replace(/^\/\//, '/'),
      fullPath: fPath,
      import: () => ({})
    }
    if (lstatSync(fPath).isDirectory() || /\.d\.ts/.test(fPath)) { return o }
    if (
      !tsImported &&
      extname(__filename) === '.js' &&
      extname(fPath) === '.ts'
    ) {
      register({ transpileOnly: true })
      tsImported = true
    }
    if (['.js', '.ts', '.json'].includes(ext)) {
      o.import = () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const x = (existsSync(fPath) && require(fPath)) || {}
        if (validator) { validator(o.import()) }
        return x
      }
    }
    return o
  }

  function importScriptFromDir <T extends object> (
    path: string,
    validator?: (_: Partial<T>) => void
  ) {
    const fPath = join(rootPath, path)
    if (!existsSync(fPath)) { return [] }
    return readdirSync(fPath, { recursive: true, encoding: 'utf-8' })
      .map(x => ({
        dir: path,
        relativePath: x,
        ...importScript<T>(join(path, x), validator)
      }))
  }
  return { importScript, importScriptFromDir }
}

export { _defineRepoTherapyImport as defineRepoTherapyImport }
