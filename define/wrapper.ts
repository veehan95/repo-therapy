const f: typeof defineRepoTherapyWrapper = <
  T extends `define-${string}`,
  U,
  V extends Array<RepoTherapyUtil.GenericType> = []
> (slug: T, handler: (...argv: V) => U, warpperClient = 'repo-therapy') => {
  return Object.assign(handler, {
    warpperClient,
    slug,
    validate: (s: string) => {
      if (s === slug) { return }
      throw new Error(`Defination for ${slug} is required but received ${s}`)
    }
  })
}

export { f as defineRepoTherapyWrapper }
