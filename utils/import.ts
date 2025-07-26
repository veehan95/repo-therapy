import { existsSync, lstatSync, readdirSync } from "fs"
import { extname, join } from "path"
import { register } from "ts-node"

let tsImported = false

export function importScript <T> (
  rootPath: string,
  path: string
): RepoTherapy.ImportObject<T> | undefined {
  const fPath = join(rootPath, path)
  if (lstatSync(fPath).isDirectory() || /\.d\.ts/.test(fPath)) { return }
  if (!tsImported && extname(__filename) === '.js' && extname(fPath) === '.ts') {
    register({ transpileOnly: true })
    tsImported = true
  }
  const ext = extname(fPath)
  const o: RepoTherapy.ImportObject<T> = {
    ext,
    path: `/${path}`.replace(/^\/\//, '/'),
    fullPath: fPath
  }
  if (['.js', '.ts', '.json'].includes(ext)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    o.import = () => (existsSync(fPath) && require(fPath)) || {}
  }
  return o
}

export function importScriptFromDir <T extends Record<string, object>> (path: keyof T & string) {
  if (!existsSync(path)) { return [] }
  return readdirSync(path, { recursive: true, encoding: 'utf-8' })
    .map(x => {
      return importScript<T>(path, x)
    })
    .filter(x => x)
}
