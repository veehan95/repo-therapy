import type RTValueTypeBase from "./value-type.js"

export type Primitive = string | number | boolean | undefined | null

export type FilePath = `/${string}`

export type EventCallbackMeta = Record<string, unknown>

export type EventCallbacks<T extends EventCallbackMeta> = {
  [K in keyof T]: (
    data: T[K],
    // logger: Logger
  ) => void
}

export type ErrorMeta = {
  name?: string
  statusCode: number
  internalStatusCode: number
  message: string
}

export type CustomKeyFormat <
  Value extends string = string,
  StringOption extends string = string
> = Value extends ''
  ? Value extends `${StringOption}${infer A}`
    ? CustomKeyFormat<A, StringOption> : never
  : never

export type ErrorCodeChar =
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | '/' | '_'

export type ErrorCode<
  S extends string = string
> = CustomKeyFormat<S, ErrorCodeChar>

export type CustomErrorCode = Record<string, ErrorMeta>

export type Excluded =
  | Function | readonly unknown[] | Date | RegExp | Map<any, any> | Set<any>

export type NestedPath<T extends object, U extends string[] = []> = {
  [K in keyof T & string]: T[K] extends infer A extends object
    ? A extends Excluded
      ? [...U, K]
      : NestedPath<A, [...U, K]>
    : [...U, K]
}[keyof T & string]

export type NestedValue<T extends object, U extends NestedPath<T>> =
  U extends [infer A extends keyof T, ...infer Rest extends string[]]
    ? Rest extends []
      ? T[A]
      : T[A] extends infer V extends object
        ? V extends Excluded
          ? never
          : NestedValue<V, Rest & NestedPath<V>>
        : never
    : never

export type ObjectDefinition <T extends object> = {
  [K in keyof T]: ReturnType<
    RTValueTypeBase<T[K]>['chainable']
  >
}