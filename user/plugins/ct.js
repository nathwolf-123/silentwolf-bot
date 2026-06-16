import { setThumb } from "../../system/helpers/thumb.js"

let handler = async (ctx) => {
  const { sock, args, reply } = ctx
  const url = args[0]
  if (!url || !/^https?:\/\//i.test(url)) {
    return reply("kasih url gambarnya\nexample ct https://files.catbox.moe/xxx.jpg")
  }
  try {
    await setThumb(sock, url)
    await reply("thumbnail menu udah diganti, cobain menu ✓")
  } catch (e) {
    console.log(e)
  }
}

handler.help = ["ct"]
handler.tags = ["owner"]
handler.command = /^(ct)$/i
handler.description = "Ganti thumbnail menu"
handler.config = { protected: true }

export default handler
