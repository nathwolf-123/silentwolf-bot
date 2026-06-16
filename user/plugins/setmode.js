import { saveConfig } from "../../system/config.js"

let handler = async (ctx) => {
  const { reply, args, command, config } = ctx
  const opt = (args[0] || "").toLowerCase()

  if (command === "mode") {
    if (opt === "--self" || opt === "--public") {
      config.mode = opt
      saveConfig()
      return reply(`mode diganti ke *${opt}*`)
    }
    return reply(`mode skrg: *${config.mode}*\ncontoh: mode --self / mode --public`)
  }

  if (command === "prefix") {
    if (opt === "--on" || opt === "--off") {
      config.usePrefix = opt === "--on"
      saveConfig()
      return reply(`prefix sekarang *${opt}*`)
    }
    return reply(`prefix skrg: *${config.usePrefix ? "on" : "off"}*\ncontoh: prefix --on / prefix --off`)
  }
}

handler.help = ["mode", "prefix"]
handler.tags = ["owner"]
handler.command = /^(mode|prefix)$/i
handler.description = "Atur mode self/public & prefix on/off"
handler.config = { protected: true }

export default handler
