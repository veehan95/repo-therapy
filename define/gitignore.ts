import { join } from 'path'
import { defineRepoTherapyImport } from './import'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { writeFileSync } from 'fs'

const baseGitignore = {
  'OS Generated': [
    '.DS_Store',
    '.DS_Store?',
    '._*',
    '.Spotlight-V100',
    '.Trashes',
    'ehthumbs.db',
    'Thumbs.db'
  ],
  'Ide & Editor': [
    '.vscode',
    '.idea',
    '*.swp',
    '*.swo',
    '*~',
    '.workspace'
  ],
  'Temporary Files': [
    'tmp',
    'temp',
    '*.tmp',
    '*.temp'
  ],
  Misc: [
    '*.tgz',
    '*.tar.gz',
    '*.zip',
    '*.rar',
    '*.7z'
  ],
  Dependencies: [
    'node_modules',
    // todo filter yarn
    '.npm',
    '.yarn',
    '.yarn/cache',
    '.yarn/unplugged',
    '.yarn/build-state.yml',
    '.yarn/install-state.gz',
    '.pnp.*'
  ],
  'Runtime & Environment': [
    '.env',
    '.env.local',
    '.env.*.local',
    '.husky/_'
  ],
  Logs: [
    'logs',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'lerna-debug.log*'
  ],
  'Coverage & Testing': [
    'coverage',
    '.nyc_output',
    '*.lcov',
    '.jest',
    'vitest-report.html'
  ],
  'Build Tools': [
    '.cache',
    '.parcel-cache',
    '.eslintcache',
    '.stylelintcache',
    '.rpt2_cache',
    '.rts2_cache_cjs',
    '.rts2_cache_es',
    '.rts2_cache_umd'
  ],
  esLint: [
    '.eslintcache'
  ],
  'Typescript Specific': [
    'dist',
    'bin',
    'build',
    'out',
    '*.tsbuildinfo',
    '*.js.map',
    '*.d.ts.map'
  ]
}

const frameworkGitignore: Record<RepoTherapy.Framework, Array<string>> = {
  'knexpresso': ['.knexpresso', 'uploads', 'credentials', 'docker-compose.yml'],
  'next.js': ['.next', 'out'],
  'vue.js': ['node_modules', 'dist', 'dist-ssr', '*.local'],
  'nuxt.js': ['.nuxt', '.nuxt-prod'],
  'nuxt-monorepo': ['.nuxt', '.nuxt-prod', 'nuxt-monorepo'],
  'angular': ['.aot', '.ng'],
  'svelte': ['.svelte-kit'],
  'serverless': ['.serverless'],
  'dynamodb': ['.dynamodb']
}

export const f: typeof defineRepoTherapyGitignore = (
  options = {}
) => wrapper('define-gitignore', async ({ rootPath }) => {
  const path = options.path || '.gitignore'

  const currentConfig = await defineRepoTherapyImport<string>({
    encoding: 'utf-8'
  })().importScript(path).then(x => x.import || '')

  const baseConfig = [
    ...Object.entries(baseGitignore).map(([k, v]) => [k, v]),
    ...Object.entries(frameworkGitignore)
      .filter(([k]) => options.framework?.includes(k as RepoTherapy.Framework))
      .map(([k, v]) => [`Framework: ${k}`, v])
  ] as Array<[string, Array<string>]>
  const defaultGitignore = Object.values(baseConfig)
    .flatMap(([, x]) => x.map(y => y.trim()))
    .filter(x => x && !/^#/.test(x))
  const existingCustomGitignore = currentConfig
    .split(/\n/g)
    .filter(x => x.trim() && !/^#/.test(x) && !defaultGitignore.includes(x.trim()))
  const customGitignore = options.custom
    ? options.custom(existingCustomGitignore)
    : existingCustomGitignore

  const config = [
    ...baseConfig,
    ['Custom Ignores', customGitignore]
  ] as Array<[string, Array<string>]>

  return {
    config: Object.fromEntries(config),
    path,
    write: () => {
      writeFileSync(
        join(rootPath, path),
        config.map(([k, v]) => [k, v.map(x => x.trim())])
          .filter(([, v]) => v.length > 0)
          .map(([k, v]) => [
            '# ================================',
            `# ${k}`,
            '# ================================',
            ...v
          ].join('\n'))
          .join('\n\n') + '\n'
      )
    }
  }
})

export { f as defineRepoTherapyGitignore }
