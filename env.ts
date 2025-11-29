import { defineRepoTherapyEnv } from './defines/env'

export default defineRepoTherapyEnv(
  (v) => ({
    test: {
      ok: v('test ok').isNumber()
    }
  })
)
