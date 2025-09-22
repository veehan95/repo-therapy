import { writeFileSync } from 'fs'
import { cloneDeep, merge } from 'lodash'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { defineRepoTherapyJson } from './json'
import { config as tsConfigConfig } from '../config/tsconfig'

export const f: typeof defineRepoTherapyTsconfig = (
  options = {}
) => wrapper('define-tsconfig', async (libTool) => {
  const path = options.path || 'tsconfig.json'

  const x = await libTool.import().importScript(path, { soft: true })
  const config: RepoTherapyUtil.DeepPartial<
    RepoTherapyUtil.TsConfigJson
  > = x.import || {}

  const extendConfig = config.extends
    ? await f({ path: config.extends })(libTool).then(x => x.config)
    : {}

  const c: RepoTherapyUtil.JsonDefination = tsConfigConfig(options.projectType)

  if (options.allowTsNode !== false) {
    c['ts-node.files'] = { default: true, type: 'boolean' }
  }
  const json = defineRepoTherapyJson<RepoTherapyUtil.TsConfigJson>(c)(
    merge(cloneDeep(extendConfig), config) as RepoTherapyUtil.TsConfigJson
  )

  return {
    config,
    path: x.fullPath,
    write: () => {
      writeFileSync(x.fullPath, JSON.stringify(
        json.difference(extendConfig as RepoTherapyUtil.TsConfigJson),
        undefined,
        2
      ))
    }
  }
})

export { f as defineRepoTherapyTsconfig }
