import dotenvx, { parse } from '@dotenvx/dotenvx'
import { kebabCase, startCase } from 'lodash'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { defineRepoTherapyValue } from './value'
import {
  defineRepoTherapyValueParse,
  ValueCallback,
  ValueDefination
} from './value-parse'
import { Util } from '../types/repo-therapy'
import { lstatSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NodeEnvOptions } from '../enums'

function envKey (k: Array<string>) {
  return k.flatMap(s => s.split(/(?=[A-Z\s])/g))
    .filter(s => s.toLowerCase() !== 'default')
    .join('_')
    .toUpperCase()
}

export type EnvCallback <T extends ValueDefination> = (
  value: (
    s: string | Array<string>
  ) => ReturnType<ReturnType<typeof defineRepoTherapyValue>>
) => T

export function defineRepoTherapyEnv <T extends ValueDefination> (
  env?: EnvCallback<T>,
  {
    project,
    interfaceName = startCase(project).replace(/\s/g, ''),
    skip = false
  }: {
    project?: string
    interfaceName?: string
    skip?: boolean
  } = {}
) {
  return wrapper('define-env', async ({ importLib, absolutePath, value }) => {
    async function getEnv (
      currentProject?: typeof project,
      nodeEnv?: keyof typeof NodeEnvOptions
    ) {
      let fileName: Util.Path = '/.env'
      if (currentProject) { fileName += `.${currentProject}` }
      if (nodeEnv) { fileName += `.${NodeEnvOptions[nodeEnv]}` }
      try {
        return await importLib
          .importScript<string>(fileName as Util.Path)
          .then(x => {
            const v = dotenvx.parse(x.import)
            if (!v.PROJECT && project) { v.PROJECT = project }
            return { ...x, import: v }
          })
      } catch { /* todo only target file not found */ }
    }

    let envValue: Awaited<ReturnType<typeof getEnv>>
    if (!skip) {
      const projectList = project ? [project, undefined] : [project]
      const envPostfix = [
        ...Object.keys(NodeEnvOptions) as Array<keyof typeof NodeEnvOptions>,
        undefined
      ]
      for (const i in projectList) {
        for (const j in envPostfix) {
          envValue = await getEnv(projectList[i], envPostfix[j])
          if (envValue) { break }
        }
        if (envValue) { break }
      }
    }

    type EnvDefinationType = {
      project: ValueCallback
      nodeEnv: ValueCallback
    } & T
    const envParser = defineRepoTherapyValueParse<EnvDefinationType>({
      project: value('Project name').isString(/^[a-z0-9-]*$/g),
      nodeEnv: value('Node environment')
        .isOneOf(NodeEnvOptions)
        .defaultTo(NodeEnvOptions.local),
      ...(env ? env(value) : {})
    } as EnvDefinationType, {
      query: (v, k) => v[envKey(k)],
      interfaceName: `${interfaceName}Env`
    })()

    let cacheEnv: ReturnType<typeof envParser.get>
    if (!skip) {
      if (!envValue?.import) { throw new Error('No env file was configured.') }
      cacheEnv = envParser.get(envValue.import)
      if (project && cacheEnv.project !== project) {
        throw new Error(`Project expected ${project} instead of ${
          cacheEnv.project
        } which is configured in ${envValue.path}`)
      }
    }

    function reverseValue (
      o: object,
      kList: Array<string> = []
    ): Array<string> {
      return Object.entries(o).flatMap(([k, v]) => {
        const newKList = [...kList, k]
        if (typeof v === 'object') { return reverseValue(v, newKList) }
        const isOptional = envParser.isOptional(newKList) &&
          envParser.defaultValue(newKList) === v
        return `${isOptional ? '# ' : ''}${envKey(newKList)}=${v}`
      })
    }

    function generateType () {
      const p = join(absolutePath.typeDeclaration, '_env.d.ts')
      writeFileSync(p, envParser.getType())
      return p
    }

    return {
      get: () => cacheEnv,
      generate: async (path: Util.Path, { nodeEnv, defaultValues, overwrite }: {
        nodeEnv?: keyof typeof NodeEnvOptions
        defaultValues?: boolean
        overwrite?: boolean
      } = {}) => {
        const projectList = readdirSync(absolutePath.projectRoot)
        const envCreation: Array<{
          path: string
          write: boolean
        }> = []
        for (const i in projectList) {
          const absoluteP = join(absolutePath.projectRoot, projectList[i])
          if (!lstatSync(absoluteP).isDirectory()) { continue }
          const projectName = kebabCase(projectList[i])
          const envName: Util.Path = `${path}.${projectName}`
          const targetImport = await importLib
            .importScript<string>(envName, { soft: true })
          envCreation.push({ path: envName, write: false })
          if (targetImport.import && !overwrite) { continue }
          envCreation[envCreation.length - 1].write = true
          let str = reverseValue(envParser.generateSample({
            ...parse(targetImport.import),
            PROJECT: projectName,
            NODE_ENV: nodeEnv && NodeEnvOptions[nodeEnv]
          })).join('\n')
          if (!defaultValues) {
            str = str.split(/\n/).filter(s => !/^# /.test(s)).join('\n')
          }
          str += '\n'
          writeFileSync(join(absolutePath.root, envName), str)
        }

        return { envCreation, typePath: generateType() }
      },
      generateType
      // todo
      // fix: () => {}
    }
  })
}
