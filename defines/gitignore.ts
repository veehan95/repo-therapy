import { startCase } from 'lodash'

import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

type Config = Record<string, Record<string, Record<string, boolean>>>
export interface GitignoreOptions {
  config?: Config
}

export function defineRepoTherapyGitIgnore (
  {
    config = {}
  }: GitignoreOptions = {}
) {
  return wrapper('gitignore', (libTool) => {
    const listing: Config = {
      General: {
        OSGenerated: {
          '.DS_Store': true,
          '.DS_Store?': true,
          '._*': true,
          '.Spotlight-V100': true,
          '.Trashes': true,
          'ehthumbs.db': true,
          'Thumbs.db': true
        },
        IdeNEditor: {
          '.idea': true,
          '*.swp': true,
          '*.swo': true,
          '*~': true,
          '.workspace': true
        },
        TemporaryFiles: {
          tmp: true,
          temp: true,
          '*.tmp': true,
          '*.temp': true
        },
        Misc: {
          '*.tgz': true,
          '*.tar.gz': true,
          '*.zip': true,
          '*.rar': true,
          '*.7z': true
        },
        Dependencies: {
          node_modules: true,
          '.npm': true,
          '.npmignore': true
        },
        RuntimNEnvironment: {
          '.env': true,
          '.env.*': true,
          '.env.*.*': true,
          '.husky': true,
          '.vscode': true
        },
        Logs: {
          logs: true,
          '*.log': true,
          '*.log*': true,
          'lerna-debug.log*': true
        },
        CoverageNTesting: {
          coverage: true,
          '.nyc_output': true,
          '*.lcov': true,
          '.jest': true,
          'vitest-report.html': true
        },
        BuildTools: {
          '.cache': true,
          '.parcel-cache': true,
          '.stylelintcache': true,
          '.rpt2_cache': true,
          '.rts2_cache_cjs': true,
          '.rts2_cache_es': true,
          '.rts2_cache_umd': true
        },
        EsLint: {
          '.eslintcache': true
        },
        TypescriptSpecific: {
          dist: true,
          bin: true,
          build: true,
          out: true,
          '*.tsbuildinfo': true,
          '*.js.map': true,
          '*.d.ts.map': true
        }
      },
      PackageManager: {
        [libTool.packageManager]: {
          NPM: {
            'package-lock.json': true,
            'npm-debug.log*': true,
            '.npm': true
          },
          Yarn: {
            '.yarn': true,
            '.yarn/cache': true,
            '.yarn/unplugged': true,
            '.yarn/build-state.yml': true,
            '.yarn/install-state.gz': true,
            '.pnp.*': true,
            'yarn-debug.log*': true,
            'yarn-error.log*': true
          },
          PNPM: {
            'pnpm-lock.yaml': true,
            '.pnpm-store/': true,
            '.pnpm-debug*': true
          },
          Bun: {
            'bun.lockb': true,
            'bun.lock': true,
            '.bun/': true
          }
        }[libTool.packageManager]
      },
      Framework: {
        [libTool.libName]: {
          'types/_*': true,
          [libTool.path.build.replace(/^\//, '')]: true,
          [libTool.path.buildCache.replace(/^\//, '')]: true
        }
      }
    }

    async function get () {
      const categoryList = [...new Set([
        ...Object.keys(listing),
        ...Object.keys(config)
      ])]
      const processedFiles: Array<string> = []
      const r: Config = {}
      for (const categoryIndex in categoryList) {
        const curCategory = categoryList[categoryIndex]
        const sectionList = [...new Set([
          ...Object.keys(listing[curCategory] || []),
          ...Object.keys(config[curCategory] || [])
        ])]
        r[curCategory] = {}
        for (const sectionKey in sectionList) {
          const curSection = sectionList[sectionKey]
          const fileList = [...new Set([
            ...Object.keys(listing[curCategory]?.[curSection] || []),
            ...Object.keys(config[curCategory]?.[curSection] || [])
          ])]
          r[curCategory][curSection] = {}
          for (const fileKey in fileList) {
            const curFile = fileList[fileKey]
            if (processedFiles.includes(curFile)) { continue }
            const configFlag = config[curCategory]?.[curSection]?.[curFile]
            r[curCategory][curSection][curFile] = configFlag !== undefined
              ? configFlag
              : listing[curCategory]?.[curSection]?.[curFile]
            processedFiles.push(curFile)
          }
        }
      }
      const currentConfigImport = await await libTool
        .importLib
        .importStatic('/.gitignore', { soft: true })
      r.Custom = {
        NotConfigured: Object.fromEntries((
          currentConfigImport.import?.split(/\n/).map(x => x.trim()).filter(x => x && !/^#/.test(x)) || []
        ).filter(x => !processedFiles.includes(x)).map(x => [x, true]))
      }
      return {
        path: currentConfigImport.path,
        toOverwrite: !!currentConfigImport.import,
        config: r
      }
    }

    async function generate ({ clean }: { clean?: boolean} = {}) {
      const c = await get()
      return await libTool.importLib.writeStatic(
        c.path,
        () => Object.entries(c.config).flatMap(([categoryKey, section]) =>
          Object.entries(section).flatMap(([sectionKey, f]) => {
            const fileNames = Object.entries(f)
              .filter(([, v]) => v).map(([k]) => k)
            if (fileNames.length === 0) { return [] }
            return [
              ...(clean === true
                ? []
                : [
                    '# ================================',
              `# ${`${startCase(categoryKey)}: ${
                startCase(sectionKey)}`.replace(/ N /g, ' & ')
              }`,
              '# ================================']),
              ...fileNames,
              ''
            ]
          })
        ).join('\n')
      )
    }

    return {
      get,
      generate
    }
  })
}
