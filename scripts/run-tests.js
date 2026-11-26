import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const result = spawnSync(process.execPath, ['ace', 'test', ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: {
    ...process.env,
    SWC_NATIVE_BINDING_CACHE: resolve(projectRoot, 'tmp', 'swc-native-cache'),
  },
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
