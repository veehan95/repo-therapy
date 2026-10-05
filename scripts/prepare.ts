import { defineScript } from 'repo-therapy';

export default defineScript<{
  app?: string
}>('Preprae repository', {
  handler: async (_data, _logger, repoTherapy) => {
    await repoTherapy.generateTypeDefinition()
  }
})
