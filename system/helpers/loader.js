import { join, relative } from "path"
import { readdirSync, statSync, existsSync, mkdirSync } from "fs"
import { pathToFileURL } from "url"
import chokidar from "chokidar"
import chalk from "chalk"

const pluginDir = join(process.cwd(), "user", "plugins")
if (!existsSync(pluginDir)) mkdirSync(pluginDir, { recursive: true })

const plugins = new Map()

const scan = (dir) => {
  const out = []
  for (const f of readdirSync(dir)) {
    const full = join(dir, f)
    if (statSync(full).isDirectory()) out.push(...scan(full))
    else if (f.endsWith(".js")) out.push(full)
  }
  return out
}

const load = async (file) => {
  const key = relative(pluginDir, file)
  try {
    const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
    plugins.set(key, mod.default)
    process.stdout.write(chalk.bgGreen.black(` ↺ ${key} `) + "\n")
  } catch (e) {
    process.stdout.write(chalk.bgRed.white(` ✖ ${key} `) + "\n" + chalk.red(e.message) + "\n")
  }
}

const unload = (file) => {
  const key = relative(pluginDir, file)
  if (plugins.delete(key)) process.stdout.write(chalk.bgYellow.black(` ✖ unload ${key} `) + "\n")
}

const loadPlugins = async () => {
  await Promise.all(scan(pluginDir).map(load))
  process.stdout.write(chalk.bold.green(`✔ ${plugins.size} plugin reload\n`))
}

const watchPlugins = () => {
  chokidar
    .watch(pluginDir, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 } })
    .on("add", (f) => { process.stdout.write(chalk.green(`[watch] add ${relative(pluginDir, f)}\n`)); load(f) })
    .on("change", (f) => { process.stdout.write(chalk.green(`[watch] change ${relative(pluginDir, f)}\n`)); load(f) })
    .on("unlink", (f) => { process.stdout.write(chalk.green(`[watch] unlink ${relative(pluginDir, f)}\n`)); unload(f) })
}

export { plugins, loadPlugins, watchPlugins }