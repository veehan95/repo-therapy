import { type LibTool } from '../types/lib-tool'
import { type GenericType } from '../types/repo-therapy'

export function defineRepoTherapyWrapper <
  HandlerReturn extends GenericType | void = void,
  HandlerArgs extends Array<GenericType> = []
> (
  slug: string,
  warpperClient: string,
  handler: (...argv: HandlerArgs) => HandlerReturn
) {
  return Object.assign(handler, {
    warpperClient,
    slug,
    validate: (s: string) => {
      if (s === slug) { return }
      throw new Error(`Defination for ${slug} is required but received ${s}`)
    }
  })
}

export function defineRepoTherapyInternalWrapper <
  HandlerArgs extends Array<object> | undefined = Array<object>,
  CallbackReturn extends GenericType | void = void,
  ActualHandlerArgs extends Array<GenericType> = HandlerArgs extends false
    ? []
    : [LibTool] & HandlerArgs
> (slug: string, handler: (...argv: ActualHandlerArgs) => CallbackReturn) {
  return defineRepoTherapyWrapper<
    CallbackReturn,
    ActualHandlerArgs
  >(slug, 'repo-therapy', handler)
}
