import { defineScript } from 'repo-therapy';

export default defineScript<{
  app?: string
}>('', {
  handler: (data, logger, rt) => {
    logger.info(data, rt.valueType.email('asdsad')('veehan95@gmail.com'))
  },
  args: ({ string, pattern }) => ({
    app: string('').alias('a').optional(),
    pattern: pattern('', 'asd', /test-.*/).alias('p').optional()
  })
})
