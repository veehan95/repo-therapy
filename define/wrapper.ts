const f: typeof defineRepoTherapyWrapper = <T extends Function> (
  slug: string,
  handler: T,
  warpperClient = 'repo-therapy'
) => {
  const h = handler as ReturnType<typeof defineRepoTherapyWrapper<T>>
  h.warpperClient = warpperClient
  h.slug = slug
  h.validate = (s: string) => {
    if (s === slug) { return }
    throw new Error(`Defination for ${slug} is required but received ${s}`)
  }
  return h
}

export { f as defineRepoTherapyWrapper }
