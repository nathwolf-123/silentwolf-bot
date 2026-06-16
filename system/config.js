import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

const dbDir = join(process.cwd(), "database")
const settPath = join(dbDir, "settings.json")

const config = {
  owner: {
    trust: [
      "62xxx@s.whatsapp.net", // isi owner utama kamu di sini 
      "52xxx@s.whatsapp.net", // isi owner ke 2 kamu dst nya
      ""
    ]
  },
  bot: {
    name: "silentwolf", // bebas ubah 
    number: "62xxx", // isi nomor bot nya di sini 
    prefix: [".", "!"],
    version: "1.0.0"
  },
  mode: "--self",
  usePrefix: true
}

if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

if (existsSync(settPath)) {
  try {
    const saved = JSON.parse(readFileSync(settPath, "utf8"))
    if (saved.mode) config.mode = saved.mode
    if (typeof saved.usePrefix === "boolean") config.usePrefix = saved.usePrefix
  } catch {}
}

const saveConfig = () => {
  try {
    writeFileSync(settPath, JSON.stringify({ mode: config.mode, usePrefix: config.usePrefix }, null, 2))
  } catch {}
}

if (!existsSync(settPath)) saveConfig()

export { config, saveConfig }
