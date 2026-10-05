import { defineStud } from 'repo-therapy'

export default defineStud([{
  source: '/stud.ts',
  destination: (name) => `/config/studs/${name}/index.ts`
}, {
  source: '/stud/stud.md',
  destination: (name) => `/config/studs/${name}/index.md.stud`
}])