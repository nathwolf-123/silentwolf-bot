# silentwolf 🐺

Bot WhatsApp simple berbasis [Baileys](https://github.com/WhiskeySockets/Baileys).

## Requirements

- Node.js v18+
- npm

## Menu Example 

![menu](https://files.catbox.moe/h4ir4t.jpg)

## Installation

```bash
git clone https://github.com/nathwolf-123/silentwolf-bot
cd silentwolf-bot
npm install
```

## Config

Edit `system/config.js`, isi nomor owner dan nomor bot:

```js
owner: {
  trust: [
    "628xxx@s.whatsapp.net",
  ]
},
bot: {
  number: "628xxx",
}
```

## Run

```bash
npm start
```

Scan QR atau pakai pairing code yang muncul di terminal.

## Plugin

Taruh file `.js` di folder `user/plugins/` — auto-load dan hot-reload tanpa restart.

## Contributors

- [WolfyFlutter](https://github.com/WolfyFlutter)

## License

MIT
