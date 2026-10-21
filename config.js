require("./LightSecret")
const fs = require('fs')
const { version } = require("./package.json")
//~~~~~~~~~SETTING BOT~~~~~~~~~~//

// Bebas Ubah
global.owner = "Kevin"
global.nobot = "4915510433108"
global.namaowner = "AnnaYamada"
global.namaBot = "AnnaYamada"
global.title = "rizal-dev"

// Jangan Di ubah
global.creator = `${owner}@s.whatsapp.net` 
global.foother = `© ${namaBot}`
global.versi = "New"
global.nama = namaBot 
global.namach = nama 
global.namafile = foother 
global.author = namaowner

// Bebas Ubah
// True = on || False = Off 
global.status = true
global.owneroff = true
global.autoread = true
global.autotyping = true
global.Antilinkgc = true
global.Antilinkch = true
global.antispam = true
global.onlygc = false

// Set Payment
global.qris = "https://files.catbox.moe/iwpd4i.jpg"
global.dana = "088213993436"
global.gopay = "088213993436"

// ===={ Set Link }
global.ch = 'https://whatsapp.com/channel/0029Vaw0AGCEQIarHspllG1i'
global.idch = '120363420619530273@newsletter'
global.linkgc = 'https://chat.whatsapp.com/I0VOoR3wSqzB4v98TR6DtI?mode=hqrt3'
global.yt = 'https://youtube.com/@rizeldev'
global.nekorin = "https://api.nekorinn.my.id"
global.idgc = "12036339920968756764@g.us"
// set prefix
global.setprefix = ".", "/", "#"

// User Sosmed
global.tt = "@rizeldev"
global.yt = "@rizeldev"
global.ig = "@rizel_dev"

// Setting Api cVPS
global.doToken = "APIKEY"
global.linodeToken = "APIKEY"

// Settings Api Panel Pterodactyl
global.egg = "15" // Egg ID
global.nestid = "5" // nest ID
global.loc = "1" // Location ID
global.domain = "https://"
global.apikey = "ptla" //ptla
global.capikey = "ptlc" //ptlc

// [ THEME URL & URL ] ========//
global.thumbnail = 'https://files.catbox.moe/wrn5p0.jpg'

// Settings reply ~~~~~~~~~//
global.mess = {
    owner: "Khusus Owner",
    prem: "Khusus Premium",
    group: "Khusus di Group Chat",
    admin: "Khusus Admin",
    botadmin: "Bot Harus Jadi Admin",
    private: "Khusus di Private Chat",
    done: "Sukses"
}

global.packname = nama
global.author = namaBot

//
global.gamewaktu = 60 // Game waktu
global.suit = {};
global.tictactoe = {};
global.petakbom = {};
global.kuis = {};
global.siapakahaku = {};
global.asahotak = {};
global.susunkata = {};
global.caklontong = {};
global.family100 = {};
global.tebaklirik = {};
global.tebaklagu = {};
global.tebakgambar2 = {};
global.tebakkimia = {};
global.tebakkata = {};
global.tebakkalimat = {};
global.tebakbendera = {};
global.tebakanime = {};
global.kuismath = {};

//~~~~~~~~~~~ DIEMIN ~~~~~~~~~~//

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
