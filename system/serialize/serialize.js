import { getContentType, normalizeMessageContent } from "baileys"
import { bot } from "../helpers/createSocket.js"

const pickLid = (...vals) => vals.find(v => typeof v === "string" && v.endsWith("@lid")) || null
const pickPn = (...vals) => vals.find(v => typeof v === "string" && v.endsWith("@s.whatsapp.net")) || null

export default function serialize(WAMessage, sock) {
  const isi = normalizeMessageContent(WAMessage.message)
  const chatId = WAMessage.key.remoteJid

  const senderId = pickLid(
    WAMessage.key.participant,
    WAMessage.key.participantAlt,
    WAMessage.key.fromMe ? bot.lid : null,
    WAMessage.key.remoteJid
  ) || WAMessage.key.participant || (WAMessage.key.fromMe ? bot.lid : WAMessage.key.remoteJid)

  const senderPn = pickPn(
    WAMessage.key.participantAlt,
    WAMessage.key.remoteJidAlt,
    WAMessage.key.participant,
    WAMessage.key.remoteJid,
    WAMessage.key.fromMe ? bot.pn : null
  ) || null

  const type = getContentType(isi)
  const text =
    isi?.conversation ||
    isi?.[type]?.text ||
    isi?.[type]?.caption ||
    null

  const react = (emoji) =>
    sock.sendMessage(chatId, { react: { text: emoji, key: WAMessage.key } })

  const result = {
    chatId,
    senderId,
    senderPn,
    pushName: WAMessage.pushName,
    type,
    text,
    messageId: WAMessage.key.id,
    timestamp: WAMessage.messageTimestamp,
    isGroup: chatId?.endsWith("@g.us"),
    react
  }

  Object.defineProperty(result, "key", { get: () => WAMessage.key, enumerable: true })
  Object.defineProperty(result, "message", { get: () => isi, enumerable: true })
  Object.defineProperty(result, "msg", { get: () => (type ? isi?.[type] : undefined), enumerable: true })

  Object.defineProperty(result, "q", {
    get() {
      const qctx = isi?.[type]?.contextInfo || isi?.messageContextInfo
      const qisi = normalizeMessageContent(qctx?.quotedMessage)
      if (!qisi) return undefined

      const qtype = getContentType(qisi)
      const qtext =
        qisi?.conversation ||
        qisi?.[qtype]?.text ||
        qisi?.[qtype]?.caption ||
        qisi?.[qtype]?.body?.text ||
        null

      const q = {
        chatId,
        senderId: pickLid(qctx?.participant, qctx?.participantAlt) || qctx?.participant || null,
        senderPn: pickPn(qctx?.participantAlt, qctx?.participant) || null,
        type: qtype,
        text: qtext
      }

      Object.defineProperty(q, "key", {
        get: () => ({
          remoteJid: chatId,
          id: qctx?.stanzaId || null,
          participant: qctx?.participant || null,
          fromMe: bot.lid === qctx?.participant || bot.pn === qctx?.participant
        }),
        enumerable: true
      })
      Object.defineProperty(q, "message", { get: () => qisi, enumerable: true })

      return q
    },
    enumerable: true
  })

  return result
}
