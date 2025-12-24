import { existsSync, lstatSync, mkdirSync } from 'node:fs'

import { parse } from '@dotenvx/dotenvx'
import { kebabCase, startCase } from 'lodash'

import { Content } from './script'
import { defineRepoTherapyValue } from './value'
import {
  defineRepoTherapyValueParse,
  ValueCallback,
  ValueDefination
} from './value-parse'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { type Util } from '../../types/repo-therapy'
import { NodeEnvOptions } from '../statics/enums'

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
  env?: EnvCallback<T>
) {
  return wrapper('env', (libTool) => {
    return async ({
      project,
      nodeEnv,
      skip = false
    }: {
      project?: string
      nodeEnv?: NodeEnvOptions,
      skip?: boolean
    } = {}) => {
      const interfaceName = `${startCase(libTool.libName).replace(/\s/g, '')}Env`
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
            .then(x => ({
              ...x,
              import: { ...process.env, ...parse(x.import) }
            }))
        } catch {}
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
          if (envValue) {
            if (envValue.import.project !== project) {
              throw new Error(`Project mismatch: ${envValue.import.project}`)
            }
            break
          }
        }
      }

      type EnvDefinationType = {
        project: ValueCallback
        nodeEnv: ValueCallback
      } & T
      const envParser = defineRepoTherapyValueParse<EnvDefinationType>({
        project: libTool.value('Project name').isSlug(),
        nodeEnv: libTool.value('Node environment')
          .isOneOf(NodeEnvOptions)
          .defaultTo(NodeEnvOptions.local),
        ...(env ? env(libTool.value) : {})
      } as EnvDefinationType, {
        query: (v, k) => v[envKey(k)],
        interfaceName
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
          libTool.getChildPath('typeDeclaration', '_env.d.ts') as Util.Path,
          () => `declare global {\n  ${
            envParser.getType()
              .replace(/\n/g, '\n  ')
              .split(/\n/)
              .map(x => x.length > 2 ? x : x.trim())
              .join('\n')
              .replace(/interface/g, 'export interface')
          }\n}\nexport {}\n`
        )
      }

      return {
        get: () => cacheEnv,
        generate: async (path: Util.Path, {
          nodeEnv,
          defaultValues,
          overwrite,
          project
        }: {
          project?: string
          nodeEnv?: NodeEnvOptions
          defaultValues?: boolean
          overwrite?: boolean
        } = {}) => {
          if (!existsSync(libTool.absolutePath.projectRoot)) {
            mkdirSync(
              libTool.getChildPath('projectRoot', 'app'),
              { recursive: true }
            )
          }
          const envCreation: Array<Content> = []
          for (const i in libTool.possibleProject) {
            if (project && libTool.possibleProject[i] !== project) { continue }
            const absoluteP = libTool.getChildPath(
              'projectRoot',
              libTool.possibleProject[i]
            )
            if (!lstatSync(absoluteP).isDirectory()) { continue }
            const projectName = kebabCase(libTool.possibleProject[i])
            const envName: Util.Path = `${path}.${projectName}.${
              nodeEnv || NodeEnvOptions.local
            }`
            envCreation.push(
              await libTool.importLib
                .writeStatic(envName, async () => {
                  let str = reverseValue(envParser.generateSample({
                    ...await getEnv(libTool.possibleProject[i], nodeEnv)
                      .then(x => x?.import || {}),
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
          if (envCreation.length === 0) {
            throw new Error('No relevant project env was created.')
          }

          return { envCreation, typePath: await generateType() }
        },
        generateType
      }
    }
  })
}
