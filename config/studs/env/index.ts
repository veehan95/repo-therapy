import { defineStud } from 'repo-therapy'

export default defineStud([{
  source: '/env.ts',
  destination: '/config/env.ts'
}], {
  staticName: true
})
