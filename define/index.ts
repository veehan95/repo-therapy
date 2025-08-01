const _defineRepoTherapy: typeof defineRepoTherapy = (
  handler
) => () => {
  return defineRepoTherapyEnv(handler)()
}

export { _defineRepoTherapy as defineRepoTherapy }