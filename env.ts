import { defineRepoTherapyEnv } from './src/defines/env'

export default defineRepoTherapyEnv(
  (v) => ({
    test: {
      ok: v('test ok').isNumber()
    }
  })
)
