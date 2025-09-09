const f: typeof defineRepoTherapyWrapper = <
  T extends `define-${string}`,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  U extends Function
> (slug: T, handler: U, warpperClient = 'repo-therapy') => {
  return handler.bind({
    warpperClient,
    slug,
    validate: (s: string) => {
      if (s === slug) { return }
      throw new Error(`Defination for ${slug} is required but received ${s}`)
    }
  })
}

export { f as defineRepoTherapyWrapper }
