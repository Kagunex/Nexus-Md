const fetch = require('node-fetch');

const handler = async (m, { text, client }) => {
    if (!text) {
        return client.sendMessage(
            m.chat,
            { text: 'Masukkan nama kota atau zona waktu untuk mengecek waktu lokalnya!' },
            { quoted: m }
        );
    }

    try {
        const apiKey = process.env.TIMEZONEDB_API_KEY;
        if (!apiKey) return client.sendMessage(
            m.chat,
            { text: 'TimeZoneDB belum dikonfigurasi di environment bot.' },
            { quoted: m }
        );
        const params = new URLSearchParams({ key: apiKey, format: 'json', by: 'zone', zone: text });
        const response = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?${params}`);

        if (!response.ok) throw new Error('Gagal mengambil data waktu.');

        const result = await response.json();

        if (result.status !== 'OK') {
            return client.sendMessage(
                m.chat,
                { text: `Zona waktu "${text}" tidak ditemukan. Coba lagi!` },
                { quoted: m }
            );
        }

        const { formatted, zoneName } = result;
        await client.sendMessage(
            m.chat,
            {
                text: `🕒 *Waktu Lokal*\n\n📍 Zona Waktu: ${zoneName}\n⏰ Waktu: ${formatted}`,
            },
            { quoted: m }
        );
    } catch (error) {
        console.error('TimeZoneDB request failed.');
        client.sendMessage(
            m.chat,
            { text: 'Ups, terjadi kesalahan saat mengambil waktu lokal. Coba lagi nanti!' },
            { quoted: m }
        );
    }
};

handler.help = ['time <zona_waktu>'];
handler.tags = ['utility'];
handler.command = ['time', 'waktu'];

module.exports = handler;