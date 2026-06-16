import util from "util"
import { fileTypeFromBuffer } from "file-type"
import chalk from "chalk"
import { bot } from "../system/helpers/createSocket.js"
import { config } from '../system/config.js'
import { plugins } from "../system/helpers/loader.js"
import { jidNormalizedUser } from "baileys"

const namaCmd = (re) => {
  const s = re.toString()
  const m = s.match(/\((.*?)\)/)
  return (m ? m[1].split("|") : [s.replace(/[\/^$]/g, "").replace(/i$/, "")]).map(x => x.replace(/\\/g, ""))
}

const resolve_pn = (j = '') => {
  if (!j) return ''
  try {
    const norm = jidNormalizedUser(j)
    const num = norm.replace(/@.+/, '')
    if (/^521\d{10}$/.test(num)) return '52' + num.slice(3)
    if (/^1\d{10}$/.test(num)) return num.slice(1)
    return num
  } catch {
    return j.replace(/@.+/, '')
  }
}

const isOwnerPn = (j) => {
  if (!j) return false
  const num = resolve_pn(j)
  return config.owner.trust.filter(Boolean).some(o => resolve_pn(o) === num)
}

export default async function handler(sock, m) {
  try {
    if (!m.message) return
    if (m.type === "reactionMessage" || m.type === "protocolMessage") return

    const jid = m.key.remoteJid

    const reply = async (isi, opt = {}) => {
      let data
      if (Buffer.isBuffer(isi)) {
        const { mime } = (await fileTypeFromBuffer(isi)) || { mime: "application/octet-stream" }
        const jenis = mime.split("/")[0]
        if (jenis === "image" && mime === "image/webp") data = { sticker: isi }
        else if (jenis === "image") data = { image: isi, caption: opt.caption || "" }
        else if (jenis === "video") data = { video: isi, caption: opt.caption || "" }
        else if (jenis === "audio") data = { audio: isi, mimetype: mime, ptt: opt.ptt || false }
        else data = { document: isi, mimetype: mime, fileName: opt.filename || "file" }
      } else {
        data = { text: String(isi) }
      }
      return sock.sendMessage(jid, data, { quoted: m, ...opt })
    }

    const senderLid = m.key.fromMe ? bot.lid : (m.senderId || null)
    const senderPn = m.senderPn || null

    const isOwner = m.key.fromMe || isOwnerPn(senderPn) || isOwnerPn(senderLid)

    if (config.mode === "--self" && !isOwner) return

    const body = typeof m.text === "string" ? m.text : ""
    if (!body) return

    const daftar = ["x>", ">>"]
    for (const [, p] of plugins) if (p?.command) daftar.push(...namaCmd(p.command))

    let command, args, text
    if (config.usePrefix) {
      const pfxRe = new RegExp(`^[${config.bot.prefix.map(p => "\\" + p).join("")}]`)
      if (!pfxRe.test(body)) return
      args = body.replace(pfxRe, "").trim().split(/ +/)
      command = (args.shift() || "").toLowerCase()
      text = args.join(" ")
    } else {
      const low = body.trim().toLowerCase()
      if (!daftar.some(c => low === c || low.startsWith(c + " "))) return
      args = body.trim().split(/ +/)
      command = (args.shift() || "").toLowerCase()
      text = args.join(" ")
    }

    const quoted = m.q
    const q = m.q

    process.stdout.write(
      `\n${chalk.hex("#9b59b6").bold("[silentwolf]")} ${chalk.cyan(command)} ${chalk.gray("·")} ${chalk.yellow(m.pushName || "?")} ${chalk.gray("·")} ${isOwner ? chalk.green("owner") : chalk.gray("user")}\n`
    )

    const ctx = {
      jid, sock, nath: sock, m, bot,
      body, args, command, text,
      isOwner, senderLid, senderPn, reply, quoted, q, config
    }

    if (command === "x>" || command === ">>") {
      if (!isOwner) return
      if (!text) return reply("mana kodenya bre")
      try {
        let hasil = command === ">>"
          ? await eval(`(async () => { ${text} })()`)
          : await eval(`(async () => { return (${text}) })()`)
        if (typeof hasil !== "string") hasil = util.inspect(hasil, { depth: 4 })
        return reply(hasil)
      } catch (e) {
        return reply(String(e))
      }
    }

    for (const [, plugin] of plugins) {
      if (!plugin?.command || !plugin.command.test(command)) continue
      if (plugin.config?.protected && !isOwner) return reply("khusus owner woi")
      await plugin(ctx)
      break
    }
  } catch (e) {
    console.log(chalk.red("#handler"), e)
  }
}