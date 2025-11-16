import { type LibTool } from '../types/lib-tool'
import { type Util } from '../types/repo-therapy'

type CallbackReturn = Util.GenericType
type HandlerArgs = Array<Util.GenericType> | undefined

type CallbackReturnValue <
  T extends CallbackReturn,
  U extends HandlerArgs = undefined
> = U extends Array<Util.GenericType> ? (...args: U) => T : T

type UseLibTool <T, U> = T extends true ? (libTool: LibTool) => U : () => U

export function defineRepoTherapyWrapper <
  T extends CallbackReturn,
  U extends HandlerArgs = undefined,
  V extends boolean = true
> (
  slug: string,
  warpperClient: string,
  handler: UseLibTool<V, CallbackReturnValue<T, U>>
) {
  return Object.assign(handler, {
    warpperClient,
    slug,
    validate: (s: Array<string>) => {
      if (s.includes(slug)) { return }
      throw new Error(`Defination for ${slug} is required but received ${s}`)
    }
  })
}

export function defineRepoTherapyInternalWrapper <
  T extends CallbackReturn,
  U extends HandlerArgs = undefined,
  V extends boolean = true
> (
  slug: string,
  handler: UseLibTool<V, CallbackReturnValue<T, U>>
) {
  return defineRepoTherapyWrapper<T, U, V>(
    slug ? `define-repo-therapy-${slug}` : 'define-repo-therapy',
    'repo-therapy',
    handler
  )
}
