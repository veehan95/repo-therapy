import { defineScript } from 'repo-therapy';
import type RTStud from '../src/stud.js';
import { join } from 'node:path';
import type { FilePath } from '../src/types.js';
import { existsSync, readdirSync } from 'node:fs';
import _ from 'lodash';

const studDir = '/config/studs'

export default defineScript('create file from stud', {
  handler: async (__, logger, repoTherapy, scriptClass, variant) => {
    const path = join(studDir, `${variant}.ts`) as `${FilePath}.ts`
    const script = await repoTherapy.importScript<{
      default: ReturnType<typeof RTStud.define>
    }>(['stud'], path)
    if (!script || !script.import.default) {
      throw new repoTherapy.errorClass('server_resource_not_found', {
        fields: [path]
      })
    }
    const stud = script.import.default(repoTherapy)

    const variablesKeys = stud.getVariables()
    logger.debug(() => ['variables-keys', variablesKeys])

    const dynamicSection = stud.getSections()
    logger.debug(() => ['dynamic section', dynamicSection])

    const promptResponse = await scriptClass
      .customPrompt<Record<string, string>>(() => [
        ...(
          stud.staticName
            ? []
            : [{
              question: 'name',
              valueDefinition: repoTherapy.valueType
                .string('targeted file name without extention'),
              key: 'fileName'
            }]
        ),
        ...Object.entries(variablesKeys)
          .filter(([question]) => question !== 'fileName')
          .map(([question, valueDefinition]) => ({
            question,
            valueDefinition: valueDefinition as any,
            key: question
          })),
        ...dynamicSection.map(x => ({
          question: `keep dynamic content [${x}]`,
          valueDefinition: repoTherapy.valueType
            .boolean(`dynamic content [${x}]`)
            .default(true),
          key: '_' + _.camelCase(`r-t-dynamic-content-${x}`)
        }))
      ])
    logger.debug(() => ['prompt response', promptResponse])

    const {
      removeSection,
      variables
    } = Object.entries(promptResponse).reduce((acc, cur) => {
      if (/^_rTDynamicContent/.test(cur[0])) {
        if (!cur[1]) {
          acc.removeSection.push(_.kebabCase(
            cur[0].replace(/^_rTDynamicContent/, '')
          ))
        }
      } else { acc.variables[cur[0]] = cur[1] }
      return acc
    }, { removeSection: [], variables: {} } as {
      removeSection: string[],
      variables: Record<string, string | boolean | number | undefined>
    })
    logger.debug(() => ['remove-section', removeSection])
    logger.debug(() => ['variables', variables])

    stud.writeFiles(
      promptResponse['fileName'] || '',
      variables,
      removeSection
    )
  },
  variants: (repoTherapy) => {
    const studNames: string[] = []
    for (const dir of repoTherapy.directories) {
      const fullPath = join(dir, studDir)
      if (existsSync(fullPath)) {
        const dirFiles = readdirSync(
          fullPath,
          { recursive: true, encoding: 'utf-8' }
        ).filter(x => !/\.stud/.test(x))
        for (const path of dirFiles) {
          const name = path.replace(/(\/index)?\.ts$/, '')
            .split(/\//g)
            .map(x => _.kebabCase(x.trim()))
            .join(':')
          if (!studNames.includes(name)) { studNames.push(name) }
        }
      }
    }
    return studNames
  }
})
