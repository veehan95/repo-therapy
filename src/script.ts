// import * as readline from 'node:readline/promises'
// import { stdin, stdout } from 'node:process';
import { getCallSites } from 'node:util'
import { fileURLToPath } from 'node:url'
import type Yargs from 'yargs'
import type { ArgumentsCamelCase, Argv } from 'yargs'
import _ from 'lodash'
import dayjs from 'dayjs'

import type RTLogger from './logger.js'
import { RepoTherapyUtilBase } from './base.js'
import type RepoTherapy from './repo-therapy.js'
import type { ValueTypeDefinition } from '../generated/types/value-types.js'
import type ValueTypeObject from '../config/value-types/object.js'
import type { FilePath, ObjectDefinition } from './types.js'

export type ScriptArgMeta = {
  alias?: string
  hidden?: boolean
  deprecated?: boolean
}

export type Options <
  Args extends Record<string, string | number | boolean | undefined> = {},
  Prompt extends Record<string, string | number | boolean | undefined> = {}
> = {
  description: string
  name: string
  command: string
  delimiter: string
  deprecated?: boolean | string | { customMessage: string }
  args?: (
    valueType: ValueTypeDefinition<ScriptArgMeta>,
    logger: RTLogger,
    repoTherapy: RepoTherapy,
    variant?: string
  ) => ObjectDefinition<Args>
  variants: (repoTherapy: RepoTherapy, logger: RTLogger) => string[]
  params?: (keyof Args & string)[]
  prompts?: (
    valueType: ValueTypeDefinition,
    logger: RTLogger,
    repoTherapy: RepoTherapy,
    variant?: string
  ) => {
    question: string
    key: keyof Prompt & string
    valueDefinition: ReturnType<ValueTypeDefinition[keyof ValueTypeDefinition]>
  }[]
  handler: (
    args: Args & Prompt,
    logger: RTLogger,
    repoTherapy: RepoTherapy,
    scriptClass: RTScript<Args, Prompt>,
    variant?: string
  ) => unknown | Promise<unknown>
}

export default class RTScript <
  Args extends Record<string, string | number | boolean | undefined> = {},
  Prompt extends Record<string, string | number | boolean | undefined> = {}
> extends RepoTherapyUtilBase<
  Omit<Options<Args, Prompt>, 'args'>,
  RTScript<Args, Prompt>
> {
  protected readonly _args?: (variant?: string) => ReturnType<
    ValueTypeObject<Args, ScriptArgMeta>['chainable']
  > | undefined
  protected get _deprecated () {
    if (!this._options.deprecated) { return }
    if (typeof this._options.deprecated === 'object') {
      return this._options.deprecated.customMessage
    } else if (typeof this._options.deprecated === 'string') {
      return `This command is deprecated. Please use '${
        this._options.deprecated
      }' instead.`
    }
    return 'This command is deprecated.'
  }

  constructor (
    repoTherapy: RepoTherapy,
    name: string,
    description: string,
    handler: Options<Args, Prompt>['handler'],
    options?: Partial<Omit<Options<Args, Prompt>, 'description' | 'name'>>
  ) {
    const delimiter = options?.delimiter || ':'
    super(repoTherapy, {
      ...options,
      description,
      name,
      delimiter,
      command: (options?.command || name).split(/:/g)
        .map(x => _.kebabCase(x.trim()))
        .filter(x => x)
        .join(delimiter),
      deprecated: options?.deprecated,
      handler,
      prefix: ['scripts', name],
      variants: options?.variants || (() => [''])
    })

    const valueType = repoTherapy.extendValueType<ScriptArgMeta>({
      alias: undefined,
      hidden: false,
      deprecated: false
    })

    if (options?.args) {
      this._args = (variant?: string) => valueType.object(
        'Script arguements',
        options.args!(valueType, this.logger, this._repoTherapy, variant)
      )
    }
  }

  public async handler (args: ArgumentsCamelCase<Args>, variant?: string) {
    try {
      const start = dayjs()
      this.logger.info(`Executing command at ${
        start.format('YYYY-MM-DD HH:mm:ss')
      }...`)

      const propmptValue: Prompt = this._options.prompts
        ? await this._prompt<Prompt>(this._options.prompts(
          this._repoTherapy.valueType,
          this.logger,
          this._repoTherapy,
          variant
        ))
        : {} as Prompt
      if (this._deprecated) { this.logger.warn(this._deprecated) }
      this.logger.debug(() => ['argument-values', args])
      const r = await this._options.handler({
        ...(args as unknown as { value: Args }).value,
        ...propmptValue
      }, this.logger, this._repoTherapy, this, variant)
      this.logger.debug(() => ['result', r || 'N/A'])
      let diff = dayjs().diff(start, 'milliseconds')
      let unit = 'millisecond'
      if (diff >= 60000) {
        diff /= 60000
        unit = 'minute'
      } else if (diff >= 1000) {
        diff /= 1000
        unit = 'second'
      }

      this.logger.info(`Completed in ${Number(diff.toFixed(2))} ${unit}(s)`)
    } catch (e) {
      this.logger.error(e as Error)
      process.exit(1)
    }
  }

  public async builder (yargs: Argv<{}>, variant?: string) {
    this.logger.debug(() => ['variant', variant || 'N/A'])
    this.logger.debug(() => ['building arguements...'])
    const argsDefinition = this._args?.(variant)
    if (argsDefinition) {
      Object.entries(argsDefinition.getItems()).forEach(([key, config]) => {
        const metadata = (config as ReturnType<
          ValueTypeDefinition<ScriptArgMeta>['string']
        >).metadata()
        if (this._options.params?.includes(key as keyof Args & string)) {
          yargs.positional(key, {
            describe: metadata.description,
            type: metadata.baseType as 'string',
            // choices: meta
          })
          return
        }
        yargs.option(key, {
          alias: metadata.alias,
          type: metadata.baseType as 'string',
          describe: metadata.description,
          // demandOption: !(metadata.default || metadata.optional),
          // choices: An array of allowed values (e.g., ['development', 'production']).
          // coerce: A synchronous function to transform or validate the input value.
          // global: Set to false to prevent this option from propagating down to sub-commands.
          // group: A string name to visually group this option under a header in the help menu.
          hidden: metadata.hidden,
          // nargs: The exact number of arguments this flag must consume following its declaration.
          // requiresArg: Set to true to demand a value whenever the flag is explicitly passed.
          // conflicts: String or array of strings indicating flags that cannot be used alongside this one.
          // implies: String or object indicating flags that must also be set if this flag is set.
          // normalize: Set to true to parse the string value as a valid file path using path.normalize().
          // string / number / boolean / array: Shorthand boolean properties to enforce types directly instead of using type.
          // count: Set to true to increment a counter every time the flag is used (e.g., -vvv becomes 3).
          deprecated: metadata.deprecated
        })
      })
  
      yargs.check((args) => {
        try {
          this.logger.debug(() => ['validating arguements...', args])
          ;(args as unknown as { value: object }).value =
            argsDefinition.soft()(args)
          this.logger.debug(() => [
            'value',
            (args as unknown as { value: object }).value
          ])
          return true
        } catch (e) {
          this.logger.error(e as Error)
          process.exit(1)
        }
      })
    }

    return yargs as Argv<Args>
  }

  public async loadCommand (yargs: ReturnType<typeof Yargs>) {
    this._options.variants(this._repoTherapy, this.logger).forEach((v) => {
      const argsDefinition = this._args?.(v)
      const items = argsDefinition?.getItems() as Record<string, ReturnType<
        ValueTypeDefinition<ScriptArgMeta>['string']
      >> | undefined
      const command = this._options.params
        ? [this._options.command, ...this._options.params.map((key) => {
          const metadata = items?.[key]?.metadata()
          return metadata?.optional || metadata?.default !== undefined
            ? `[${key}]`
            : `<${key}>`
        })].join(' ')
        : this._options.command
      const variant = v.length > 0 ? v : undefined
      const c = variant ? `${command}:${variant}` : command
      this.logger.debug(() => ['loading cli', c])
      yargs.command({
        command: c,
        describe: this._options.description,
        deprecated: this._deprecated,
        handler: (args: ArgumentsCamelCase<Args>) => this.handler
          .bind(this)(args, variant),
        builder: (yargs: Argv<{}>) => this.builder.bind(this)(yargs, variant)
        // middlewares: this._middlewares
      })
    })
    return yargs
  }

  private async _prompt <
    PromptValue extends Record<string, string | number | boolean | undefined> =
      {}
  > (
    prompts: ReturnType<Required<Options<{}, PromptValue>>['prompts']>
  ) {
    this.logger.debug(() => ['Prompting user'])
    const promptValue: PromptValue = {} as PromptValue
    const l = this.logger.prompt()
    for (const q of prompts) {
      const value = q.valueDefinition(
        await l.push(`${q.question}: `)
      ) as PromptValue[typeof q.key]
      this.logger.debug(
        () => ['prompt', q.key, typeof value, value?.toString() || '<undefined>']
      )
      promptValue[q.key] = value
    }
    l.close()
    this.logger.debug(() => [
      `Collected answers for ${prompts.length} question(s)`
    ])
    return promptValue
  }

  public customPrompt <
    PromptValue extends Record<string, string | number | boolean | undefined> =
      {}
  > (
    prompts: (
      valueType: ValueTypeDefinition
    ) => ReturnType<Required<Options<{}, PromptValue>>['prompts']>
  ) { return this._prompt(prompts(this._repoTherapy.valueType))}

  static define <
    T extends Record<string, string | number | boolean | undefined> = {},
    U extends Record<string, string | number | boolean | undefined> = {}
  > (
    description: string,
    options: Partial<Omit<Options<T, U>, 'description' | 'name'>> & {
      handler: Options<T, U>['handler']
    }
  ) {
    const callSitePath = fileURLToPath(
      getCallSites()[1]?.scriptName || ''
    ) as FilePath
    return (repoTherapy: RepoTherapy, name?: string) => {
      const n = name || repoTherapy
        .getScriptNameFromPath('/scripts', callSitePath)
      if (!n) {
        throw new repoTherapy.errorClass('server_unknown', {
          message: 'Misisng script name',
          fields: [callSitePath]
        })
      }
      return new RTScript<
        T,
        U
      >(repoTherapy, n, description, options.handler, options)
    }
  }
}
