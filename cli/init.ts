import { defineRepoTherapyScript } from '../define/script'

export default defineRepoTherapyScript(
  'Initialise project',
  (libTool) => {
    libTool.logger.info('Project initiated')
  }
)
