#!/usr/bin/env node

const { cpSync, existsSync, mkdirSync, rmSync } = require('node:fs')
const { join, resolve } = require('node:path')

const root = resolve(__dirname, '..')
const webRoot = join(root, 'web')
const standaloneRoot = join(webRoot, '.next', 'standalone')
const standaloneAppRoot = join(standaloneRoot, 'web')
const standaloneNodeModulesRoot = join(standaloneRoot, 'node_modules')
const staticRoot = join(webRoot, '.next', 'static')
const publicRoot = join(webRoot, 'public')
const distWebRoot = join(root, 'dist', 'web')
const distStandaloneRoot = join(distWebRoot, 'standalone')

if (!existsSync(standaloneAppRoot)) {
  console.error('[gsd] Web standalone build not found at web/.next/standalone/web. Run `npm --prefix web run build` first.')
  process.exit(1)
}

rmSync(distWebRoot, { recursive: true, force: true })
mkdirSync(distStandaloneRoot, { recursive: true })

cpSync(standaloneAppRoot, distStandaloneRoot, { recursive: true, force: true })

if (existsSync(standaloneNodeModulesRoot)) {
  cpSync(standaloneNodeModulesRoot, join(distStandaloneRoot, 'node_modules'), { recursive: true, force: true })
}

if (existsSync(staticRoot)) {
  mkdirSync(join(distStandaloneRoot, '.next'), { recursive: true })
  cpSync(staticRoot, join(distStandaloneRoot, '.next', 'static'), { recursive: true, force: true })
}

if (existsSync(publicRoot)) {
  cpSync(publicRoot, join(distStandaloneRoot, 'public'), { recursive: true, force: true })
}

console.log(`[gsd] Staged web standalone host at ${distStandaloneRoot}`)
