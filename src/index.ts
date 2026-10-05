import RTLogger from './logger.js'
import RTDocumentedError from './error.js'
import RTValueTypeBase from './value-type.js'
import RepoTherapy from './repo-therapy.js'
import Env from './env.js'
import RTScript from './script.js'
import { RepoTherapyBase, RepoTherapyUtilBase } from './base.js'
import RTStud from './stud.js'
import RTObjectUtil from './object-util.js'
import type { ErrorCode, ErrorMeta } from './types.js'
import { RTValueTypePattern } from './value-type-definitions.js'

export function defineErrorCode <
  T extends Record<ErrorCode, ErrorMeta>
> (errorCode: T) { return () => errorCode }

export const defineObjectMap = RTObjectUtil.define

export const defineEnv = Env.define

export const defineScript = RTScript.define

export const defineStud = RTStud.define

export const definePattern = RTValueTypePattern.define

export {
  RTLogger,
  RTDocumentedError,
  RTValueTypeBase,
  RepoTherapy,
  RepoTherapyBase,
  RepoTherapyUtilBase
}
