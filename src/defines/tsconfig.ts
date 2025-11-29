// import { defineRepoTherapyJson } from './json'
import { rmSync } from 'node:fs'
import { join } from 'node:path'

import { merge } from 'lodash'
import { type TsConfigJson } from 'type-fest'

import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { type Util } from '../../types/repo-therapy'

interface TsConfigOptions {
  tsNode?: boolean | { compilerOptions: TsConfigJson['compilerOptions'] }
  extends?: boolean
  config?: TsConfigJson
}

function fixRelativePath (s: string) {
  return '../' + s.replace(/^\.\//, '')
}

export function defineRepoTherapyTsConfig (
  options: TsConfigOptions = {}
) {
  return wrapper('tsconfig', (libTool) => {
    async function get () {
      const tsNode: {
        files: boolean
        compilerOptions?: TsConfigJson['compilerOptions']
      } | undefined = options.tsNode === false ? undefined : { files: true }
      if (typeof options.tsNode === 'object') {
        tsNode!.compilerOptions = options.tsNode.compilerOptions
      }
      const c = merge(
        {
          ...(tsNode ? { 'ts-node': tsNode } : {}),
          compilerOptions: {
            target: 'es2020',
            module: 'nodenext',
            lib: ['esnext', 'dom'],
            allowJs: true,
            declaration: true,
            declarationMap: true,
            sourceMap: true,
            outDir: `.${libTool.path.build}`,
            rootDir: './',
            removeComments: true,
            strict: true,
            moduleResolution: 'nodenext',
            baseUrl: './',
            typeRoots: ['./types', './node_modules/@types'],
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true
          },
          include: [
            '**/*.ts',
            'types/**/*.d.ts',
            'node_modules/**/types/**/*.d.ts'
          ]
        },
        await libTool.importLib
          .importJson('/tsconfig.json', { soft: true }).then(x => x.import),
        options.config
      ) as {
        'ts-node'?: {
          files: boolean
          compilerOptions?: TsConfigJson['compilerOptions']
        }
      } & TsConfigJson
      if (options.extends) {
        if (c.extends) {
          if (typeof c.extends === 'string') {
            c.extends = fixRelativePath(c.extends)
          } else { c.extends = c.extends.map(fixRelativePath) }
        }
        ;(['files', 'exclude', 'include'] as const).forEach(x => {
          if (!c[x]) { return }
          c[x] = c[x].map(fixRelativePath)
        })
        ;([
          'declarationDir',
          'tsBuildInfoFile',
          'mapRoot',
          'outFile',
          'outDir',
          'rootDir',
          'sourceRoot',
          'baseUrl'
        ] as const).forEach(x => {
          if (!c?.compilerOptions?.[x]) { return }
          c.compilerOptions[x] = fixRelativePath(c.compilerOptions[x])
        })
        if (c?.compilerOptions?.paths) {
          c.compilerOptions.paths = Object.fromEntries(
            Object.entries(c.compilerOptions.paths)
              .map(([k, v]) => [k, v.map(fixRelativePath)])
          )
        }
        ;(['rootDirs', 'typeRoots', 'types'] as const).forEach(x => {
          if (!c?.compilerOptions?.[x]) { return }
          c.compilerOptions[x] = c.compilerOptions[x].map(fixRelativePath)
        })
        ;(['excludeDirectories', 'excludeFiles'] as const).forEach(x => {
          if (!c?.watchOptions?.[x]) { return }
          c.watchOptions[x] = c.watchOptions[x].map(fixRelativePath)
        })
      }
      return c
    }

    async function generate () {
      let path: Util.Path = '/tsconfig.json'
      const config = await get()
      if (options.extends) {
        const extendConfig = {
          extends: '.' + join(libTool.path.buildCache, path) as Util.Path
        }
        await libTool.importLib
          .writeStatic(path, () => JSON.stringify(extendConfig, undefined, 2))
        path = extendConfig.extends
        delete config.extends
      } else {
        try {
          rmSync(join(libTool.absolutePath.buildCache, path))
        } catch {}
      }
      return await libTool.importLib
        .writeStatic(path, async () => JSON.stringify(config, undefined, 2))
    }
    return {
      get,
      generate
    }
  })
}
