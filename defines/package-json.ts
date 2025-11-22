import { type PackageJson } from 'type-fest'
// import { writeFileSync } from 'node:fs'
import simpleGit from 'simple-git'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
// import { defineRepoTherapyJson } from './json'
// import { config as packageJsonConfig } from '../configs/package-json'
import { merge } from 'lodash'
import { ValueDefination } from './value-parse'

// todo
// 'package-json',
// [],
// Promise<{
//   path: string
//   json: import('type-fest').PackageJson.PackageJsonStandard
//   write: () => void
// }>,
// 'tool'

export function defineRepoTherapyPackageJson (
  config: Partial<PackageJson> = {}
) {
  return wrapper('package-json', (libTool) => {
    async function get () {
      const g = simpleGit(libTool.absolutePath.root)

      const gitUrl = (await g.getRemotes(true))
        .find(x => x.name === 'origin')!.refs
        .fetch
        .replace(/^ssh:\/\//, '')
        .replace(/^git@/, 'https://')
        .replace(/^(https:\/\/[^.]*\.[^:]*):/, '$1/')

      const projectOrLib = libTool.projectType === libTool.enum.ProjectType.npmLib
        ? 'Library'
        : 'project'
      const json: ValueDefination = {
        name: libTool.value(`${projectOrLib} name`).isString(),
        version: libTool.value(`${projectOrLib} version`)
          .isString(/^\d*\.\d*\.\d*$/)
          .defaultTo('0.0.1'),
        description: libTool.value(`${projectOrLib} description`).isString()
      }

      if (libTool.projectType === libTool.enum.ProjectType.npmLib) {
        json.main = libTool.value('Starting file of library')
          .isString()
          .defaultTo('./bin/index.js')
      }

      json.scripts = {}
      json.scripts.start = libTool.value('Starting file of library')
        .isString()
        .defaultTo('node index.js')
      json.scripts.test = libTool.value('Starting file of library')
        .isString()
        .defaultTo('jest')
      json.scripts.build = libTool.value('Starting file of library')
        .isString()
        .defaultTo('webpack --mode production')
      json.scripts.dev = libTool.value('Starting file of library')
        .isString()
        .defaultTo('nodemon index.js')
      // todo
      json.scripts.lint = libTool.value('Project or library name')
        .isString()
        .defaultTo('eslint .')
      // json.scripts.postinstall = libTool.value('Project or library name')
      //   .isString()
      //   .defaultTo('husky')
      // json.scripts.build = libTool.value('Project or library name')
      //   .isString()
      //   .defaultTo('yarn clean && tsc')
      // json.scripts.clean = libTool.value('Project or library name')
      //   .isString()
      //   .defaultTo('rm -rf bin')
      // json.scripts.prepack = libTool.value('Project or library name')
      //   .isString()
      //   .defaultTo('git push && yarn build')

      // todo
      // if (projectType === 'npmLib') {
      //   json.keywords = libTool.value('Starting file of library').isArray()
      //   json.files = ['bin']
      //   json.bin = { 'repo-therapy': './bin/cli.js' }
      // }

      json.author = libTool.value('Starting file of library')
        .isString()
        .defaultTo(`${
          (await g.getConfig('user.name')).value
        } <${(await g.getConfig('user.email')).value}>`)
      json.license = libTool.value('Starting file of library')
        .isString()
        .defaultTo('MIT')
      json.homepage = libTool.value('Starting file of library')
        .isString()
        .defaultTo(gitUrl.replace(/\.git$/, '/#readme'))
      json.repository = {
        type: libTool.value('Repository type').isString().defaultTo('git'),
        url: libTool.value('Repository url').isString().defaultTo(gitUrl)
      }
      //     "bugs": {
      //       "url": "https://github.com/your-username/my-project-name/issues"
      //     },
      //     "dependencies": {
      //     },
      //     "devDependencies": {
      //     },
      //     "peerDependencies": {
      //     },
      //     "optionalDependencies": {
      //     },
      //     "engines": {
      //       "node": ">=18.0.0",
      //       "npm": ">=8.0.0"
      //     },
      //     "os": [
      //       "darwin",
      //       "linux"
      //     ],
      //     "cpu": [
      //       "x64"
      //     ],
      json.private = libTool
        .value('Private or public repository')
        .isBoolean()
        .defaultTo(libTool.projectType !== libTool.enum.ProjectType.npmLib)

      // engines: {
      //   node: '>=v22.18.0',
      //   yarn: '>=1.22.22'
      // },
      // publishConfig: {
      //   registry: 'https://registry.npmjs.org/',
      //   access: 'public',
      //   'strict-ssl': false
      // },

      const configuredJson = await libTool
        .importLib
        .importJson<PackageJson>('/package.json', { soft: true })

      const packageJson = merge(configuredJson.import || {}, config)
      return merge(packageJson, libTool.valueParser(json).get(packageJson))
    }

    return {
      get,
      generate: () => libTool.importLib.writeStatic(
        '/package.json',
        async () => JSON.stringify(await get(), undefined, 2)
      )
    }
  })
}
