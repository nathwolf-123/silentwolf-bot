import fs from "fs"
import os from "os"

let handler = async (ctx) => {
  const { jid, sock, reply, text, args, isOwner, quoted, command } = ctx
  const str = 'Information System';
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();

  const system = {
   'Information System': {
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    ppid: process.ppid,
    run_in: process.argv.join(""),
    version_node: process.version,
    sourceUrl: process.release.sourceUrl,
    },
    'Memory Usage': {
  rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
  heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
  heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
  external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',
  arrayBuffers: (mem.arrayBuffers / 1024 / 1024).toFixed(2) + ' MB',
},
    'CPU Usage': {
      user: cpu.user + ' μs',
      system: cpu.system + ' μs',
    },
    uptime: Math.floor(process.uptime() / (60 * 60)) + ' jam ' + Math.floor(process.uptime() % 60) + ' menit'
  };

  await sock.sendMessage(jid, {
    text: `\n${JSON.stringify(system, null, 2)}`
  });
}

handler.help = ["sysinfo"]
handler.tags = ['main']
handler.config = { protected: false }
handler.command = /^(sysinfo|rt)$/i
handler.description = 'Cek info system'
handler.owner = true
export default handler