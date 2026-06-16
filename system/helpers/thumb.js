import { prepareWAMessageMedia } from "baileys"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

const dbDir = join(process.cwd(), "database")
const file = join(dbDir, "thumb.json")
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

let cache = null

const enc = (b) => (b ? Buffer.from(b).toString("base64") : null)
const dec = (s) => (s ? Buffer.from(s, "base64") : undefined)

const toDisk = (i, url) => ({
  url,
  directPath: i.directPath,
  fileSha256: enc(i.fileSha256),
  fileEncSha256: enc(i.fileEncSha256),
  mediaKey: enc(i.mediaKey),
  mediaKeyTimestamp: Number(i.mediaKeyTimestamp) || 0,
  height: i.height,
  width: i.width,
  jpegThumbnail: enc(i.jpegThumbnail)
})

const fromDisk = (d) => ({
  directPath: d.directPath,
  fileSha256: dec(d.fileSha256),
  fileEncSha256: dec(d.fileEncSha256),
  mediaKey: dec(d.mediaKey),
  mediaKeyTimestamp: d.mediaKeyTimestamp,
  height: d.height,
  width: d.width,
  jpegThumbnail: dec(d.jpegThumbnail)
})

export async function setThumb(sock, url) {
  const WAMC = await prepareWAMessageMedia(
    { image: { url } },
    { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
  )
  const disk = toDisk(WAMC.imageMessage, url)
  try { writeFileSync(file, JSON.stringify(disk, null, 2)) } catch {}
  cache = fromDisk(disk)
  return cache
}

export async function getThumb(sock, fallbackUrl) {
  if (cache) return cache
  if (existsSync(file)) {
    try {
      cache = fromDisk(JSON.parse(readFileSync(file, "utf8")))
      return cache
    } catch {}
  }
  return setThumb(sock, fallbackUrl)
}
