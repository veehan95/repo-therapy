import { defineStud } from 'repo-therapy'

export default defineStud([{
  source: '/script.ts',
  destination: (name) => `/scripts/${name}.ts`
}])
