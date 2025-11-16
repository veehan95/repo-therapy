import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { type Transform, type Writable } from 'stream'

export interface StreamSyncOptions {
  end?: string
  error?: string
  data?: string
}

export function defineRepoTherapyStreamSync <T = string> (
  stream: Transform | Writable,
  {
    end = 'end',
    error = 'error',
    data = 'data'
  }: StreamSyncOptions = {}
) {
  function r () {
    return new Promise((resolve, reject) => {
      const d: Array<T> = []
      stream.on(end, () => { resolve(d) })
        .on(error, (e) => { reject(e) })
        .on(data, x => { d.push(x) })
    }) as Promise<Array<T>>
  }
  return wrapper<ReturnType<typeof r>, undefined, false>('stream-sync', r)
}
