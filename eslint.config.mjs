import defination from './bin/define/index.js'

export default await defination.defineRepoTherapy()()
  .then(x => x.lint().then(y => y.lint()))
