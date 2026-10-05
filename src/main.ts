#!/usr/bin/env node
import RepoTherapy from './repo-therapy.js'

export default async function main () {
  const rt = new RepoTherapy()
  await rt.init()

  await rt.loadCli()
}

main()
