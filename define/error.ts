import { camelCase, upperFirst } from 'lodash'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'

class RepoTherapyError <T extends object>
  extends Error
  implements RepoTherapyUtil.Error<T>
{
  private _name: string
  public get name () { return this._name }

  private _props: T
  public get props () { return this._props }
  
  constructor(name: string, message: string, props?: T) {
    super(message || 'An unexpected error occurred.')
    this._props = props || {} as T
    this._name = name
    if (upperFirst(camelCase(this._name)) !== this._name) {
      throw new Error(`Error name should be in pascal case ${this._name}`)
    }
  }

  instanceOf (s: string) { return this._name === s }
}

const defaultMessage = 'Some error occoured'

const f: typeof defineRepoTherapyError = <T extends object> (
  error: string | {
    name: string
    defaultMessage?: string
    defaultProp?: T
  }
) => wrapper('define-error', () => {
  let r
  if (typeof error === 'string') {
    r = new RepoTherapyError(error, defaultMessage, {})
  } else {
    r = new RepoTherapyError(
      error.name,
      error.defaultMessage || defaultMessage,
      error.defaultProp || {}
    )
  }
  return r
})

export { f as defineRepoTherapyError }
