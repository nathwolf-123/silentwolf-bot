import PrettyError from "pretty-error";
new PrettyError().start();

const signal_noise = /^(Closing session:|Opening session:|Removing old closed session:|Session already (closed|open)|Migrating session to:|V1 session storage migration error)/
const _origInfo = console.info.bind(console)
const _origWarn = console.warn.bind(console)
console.info = (...a) => { if (typeof a[0] === 'string' && signal_noise.test(a[0])) return; _origInfo(...a) }
console.warn = (...a) => { if (typeof a[0] === 'string' && signal_noise.test(a[0])) return; _origWarn(...a) }

import "dotenv/config"
import chalk from "chalk"
import { Boom } from "@hapi/boom"
import { DisconnectReason, jidNormalizedUser } from "baileys"
import { createSocket, bot } from "./system/helpers/createSocket.js"
import { config } from "./system/config.js"
import serialize from "./system/serialize/serialize.js"
import { loadPlugins, watchPlugins } from "./system/helpers/loader.js"
import handler from "./user/handler.js"

let retryCount = 0
const seen = new Set()

async function start() {
  const { sock, saveCreds } = await createSocket()

  sock.ev.process(async (ev) => {
    if (ev["creds.update"]) {
      const bem = ev["creds.update"]
      if (bem.me?.id && bem.me?.lid) {
        bot.pushname = bem.me?.name || config.bot.name
        bot.pn = jidNormalizedUser(bem.me.id)
        bot.lid = jidNormalizedUser(bem.me.lid)
      }
      await saveCreds()
    }

    if (ev["connection.update"]) {
      const { connection, lastDisconnect, receivedPendingNotifications, qr } = ev["connection.update"]

      if (qr) {
        process.stdout.write(chalk.bold.yellow(`\nQR:\n${qr}\n`) + chalk.gray("Scan via WA > Linked Devices\n"))
      }

      if (connection === "open") {
        retryCount = 0
        process.stdout.write(chalk.bold.green("✔ Connected!\n"))
        await loadPlugins()
        watchPlugins()
      }

      if (receivedPendingNotifications) {
        const owner = config.owner.trust[0]
        if (owner) {
          const ownerJid = owner.includes("@") ? owner : `${owner}@s.whatsapp.net`
          await sock.sendMessage(ownerJid, { text: `${config.bot.name} is ready to use` }).catch(() => {})
        }
      }

      if (connection === "close") {
        retryCount++
        const code = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = !(lastDisconnect?.error instanceof Boom && code === DisconnectReason.loggedOut)
        if (retryCount <= 5 && shouldReconnect) {
          process.stdout.write(chalk.yellow(`Connected Again (${retryCount}/5)...\n`))
          await new Promise((r) => setTimeout(r, 3000))
          start()
        } else {
          process.stdout.write(chalk.red("Stop Cek koneksi / sesi\n"))
        }
      }
    }

    if (ev["messages.upsert"]) {
      try {
        const up = ev["messages.upsert"]
        if (up.type !== "notify") return

        const m = serialize(up.messages[0], sock)
        if (!m?.message) return

        if (seen.has(m.key.id)) return
        seen.add(m.key.id)
        setTimeout(() => seen.delete(m.key.id), 10000)

        if (!m.key.fromMe && !m.key.remoteJid.endsWith("@newsletter")) {
          await sock.readMessages([m.key]).catch(() => {})
        }

        await handler(sock, m)
      } catch (e) {
        process.stdout.write(`\n${chalk.red("Crash:")} ${e.message}\n`)
      }
    }
  })

  if (!sock.authState.creds.registered && config.bot.number) {
    const num = config.bot.number.replace(/[^0-9]/g, "")
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(num)
        code = code?.match(/.{1,4}/g)?.join("-") || code
        process.stdout.write(chalk.bold.green(`Pairing Code: ${code}\n`))
      } catch (e) {
        process.stdout.write(chalk.red(`Pairing fail ${e.message}\n`))
      }
    }, 3000)
  }
}

start()
