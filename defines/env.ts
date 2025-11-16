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
import { lstatSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { NodeEnvOptions } from '../enums'
import { Content } from './script'

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
    nodeEnv,
    interfaceName = startCase(project).replace(/\s/g, ''),
    skip = false
  }: {
    project?: string
    nodeEnv?: NodeEnvOptions,
    interfaceName?: string
    skip?: boolean
  } = {}
) {
  return wrapper('env', async (libTool) => {
    let envValue: Awaited<ReturnType<typeof getEnv>>
    async function getEnv (
      currentProject?: typeof project,
      nodeEnv?: NodeEnvOptions
    ) {
      let fileName: Util.Path = '/.env'
      if (currentProject) {
        fileName += `.${currentProject}`
        if (nodeEnv) { fileName += `.${nodeEnv}` }
      }
      try {
        return await libTool.importLib
          .importStatic(fileName as Util.Path)
          .then(x => {
            const v = dotenvx.parse(x.import)
            if (!v.PROJECT && project) { v.PROJECT = project }
            return { ...x, import: v }
          })
      } catch { /* todo only target file not found */ }
    }

    if (!skip) {
      if (nodeEnv && !project) {
        throw new Error(
          'NodeEnv can only be configured when there is a target project'
        )
      }
      const projectList = project ? [project, undefined] : [undefined]
      for (const i in projectList) {
        envValue = await getEnv(projectList[i], nodeEnv)
        if (envValue) { break }
      }
    }

    type EnvDefinationType = {
      project: ValueCallback
      nodeEnv: ValueCallback
    } & T
    const envParser = defineRepoTherapyValueParse<EnvDefinationType>({
      project: libTool.value('Project name').isString(/^[a-z0-9-]*$/g),
      nodeEnv: libTool.value('Node environment')
        .isOneOf(NodeEnvOptions)
        .defaultTo(NodeEnvOptions.local),
      ...(env ? env(libTool.value) : {})
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
      if (nodeEnv && cacheEnv.nodeEnv !== nodeEnv) {
        throw new Error(`NodeEnv expected ${nodeEnv} instead of ${
          cacheEnv.nodeEnv
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

    async function generateType () {
      return await libTool.importLib.writeStatic(
        join(libTool.path.typeDeclaration, '_env.d.ts') as Util.Path,
        envParser.getType
      )
    }

    return {
      get: () => cacheEnv,
      generate: async (path: Util.Path, { nodeEnv, defaultValues, overwrite }: {
        nodeEnv?: NodeEnvOptions
        defaultValues?: boolean
        overwrite?: boolean
      } = {}) => {
        const projectList = readdirSync(libTool.absolutePath.projectRoot)
        const envCreation: Array<Content> = []
        for (const i in projectList) {
          const absoluteP = join(
            libTool.absolutePath.projectRoot,
            projectList[i]
          )
          if (!lstatSync(absoluteP).isDirectory()) { continue }
          const projectName = kebabCase(projectList[i])
          const envName: Util.Path = `${path}.${projectName}.${
            nodeEnv || NodeEnvOptions.local
          }`
          envCreation.push(
            await libTool.importLib
              .writeStatic(envName, (s) => {
                let str = reverseValue(envParser.generateSample({
                  ...parse(s || ''),
                  PROJECT: projectName,
                  NODE_ENV: nodeEnv
                })).join('\n')
                if (!defaultValues) {
                  str = str.split(/\r|\n/)
                    .filter(s => !/^# /.test(s))
                    .join('\n')
                }
                str += '\n'
                return str
              }, { overwrite })
          )
        }

        return { envCreation, typePath: await generateType() }
      },
      generateType
    }
  })
}
