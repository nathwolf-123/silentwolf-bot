import { plugins } from "../../system/helpers/loader.js"
import { getThumb } from "../../system/helpers/thumb.js"

const thumb = "https://files.catbox.moe/e38mfy.jpg"

let handler = async (ctx) => {
  const { jid, sock, m, senderPn, senderLid, config, reply } = ctx

  const grup = {}
  for (const [, p] of plugins) {
    if (!p?.help) continue
    for (const t of (p.tags?.length ? p.tags : ["lain"])) {
      grup[t] ??= []
      grup[t].push(...p.help)
    }
  }
  grup.owner ??= []
  grup.owner.push("x>", ">>")
  grup.owner.push("rt")

  const pfx = config.usePrefix ? config.bot.prefix[1] : ""
  const tag = (senderPn || senderLid || '').replace(/@.+/, '')

  let teks = `Hai @${tag}\n`
  teks += `${config.bot.name} · mode ${config.mode} · prefix ${config.usePrefix ? "on" : "off"}\n`
  for (const [t, cmds] of Object.entries(grup)) {
    teks += `\n*${t.toUpperCase()}*\n`
    teks += [...new Set(cmds)].map(c => `› ${pfx}${c}`).join("\n") + "\n"
  }

  try {
    const i = await getThumb(sock, thumb)

    const content = {
      extendedTextMessage: {
        text: "https://github.com\n" + teks,
        matchedText: "https://github.com",
        description: `${config.bot.name} is here`,
        title: config.bot.name + " 1.0.0 beta",
        inviteLinkGroupTypeV2: "DEFAULT",
        contextInfo: {
          mentionedJid: [senderPn || senderLid],
          stanzaId: m.key.id,
          participant: m.key.participant || m.key.remoteJid,
          quotedMessage: m.message
        },
        thumbnailDirectPath: i.directPath,
        thumbnailSha256: i.fileSha256,
        thumbnailEncSha256: i.fileEncSha256,
        mediaKey: i.mediaKey,
        mediaKeyTimestamp: i.mediaKeyTimestamp,
        thumbnailHeight: i.height,
        thumbnailWidth: i.width,
        jpegThumbnail: i.jpegThumbnail
      }
    }

    await sock.relayMessage(jid, content, {})
  } catch (e) {
    console.log(e)
    await reply(teks.trim())
  }
}

handler.help = ["menu", "help"]
handler.tags = ["main"]
handler.command = /^(menu)$/i
handler.description = "Nampilin daftar command silentwolf"
handler.config = { protected: false }

export default handler
