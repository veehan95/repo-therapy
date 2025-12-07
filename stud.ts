import { defineRepoTherapyStud } from './src/defines/stud'

export default defineRepoTherapyStud({
  variables: {
    '/test.ts': {
      variant: ['a', '2b', '3cccccc'],
      values: {
        process_env: 'process.env.PROJECT',
        tableName: 'user'
      }
    },
    '/projects.ts': {
      values: {
        tableName: 'user2'
      }
    },
    '/projects/try.ts': {
      variant: ['app', 'joanne'],
      values: {
        tableName: 'user2'
      }
    }
  }
})
