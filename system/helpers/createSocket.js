import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } from "baileys"
import pino from "pino"

const bot = { pushname: null, pn: null, lid: null }

async function createSocket() {
  const { state, saveCreds } = await useMultiFileAuthState("./database/auth")
  const logger = pino({ level: "fatal" })

  const sock = makeWASocket({
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    emitOwnEvents: false,
    printQRInTerminal: false,
    browser: ["Linux", "Chrome", "20.0.04"],
    markOnlineOnConnect: true,
    syncFullHistory: true,
    fireInitQueries: true,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: 30000,
    getMessage: async () => ({ conversation: "" }),
    cachedGroupMetadata: async () => undefined
  })

  return { sock, saveCreds }
}

export { createSocket, bot }
