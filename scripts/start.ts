import { defineScript } from 'repo-therapy';

export default defineScript<{
  app?: string
}>('', {
  handler: (data, logger) => {
    logger.info(data)
  },
  args: ({ string, pattern }) => ({
    app: string('').alias('a').optional(),
    pattern: pattern('', 'asd', /test-.*/).alias('p').optional()
  })
})
