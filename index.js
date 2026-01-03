const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    getContentType
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const handler = require('./oxy'); // Import handler dari oxy.js

// [ DATABASE & CONFIG ]
const configPath = './database/config.json';
let config = JSON.parse(fs.readFileSync(configPath));
const saveConfig = () => fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

// [ ANTISPAM ]
const usedCommandRecently = new Set();
const isFiltered = (from) => !!usedCommandRecently.has(from);
const addFilter = (from) => {
    usedCommandRecently.add(from);
    setTimeout(() => usedCommandRecently.delete(from), 1500); 
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('session_oxylus');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        logger: pino({ level: "fatal" }),
        browser: ["OxyBot", "Chrome", "20.0.04"]
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (u) => {
        if (u.connection === "close") connectToWhatsApp();
        if (u.connection === "open") console.log("\x1b[32m[ ONLINE ]\x1b[0m OxyBot Ready.");
    });

    sock.ev.on("messages.upsert", async (m) => {
        // Panggil handler dari oxy.js
        await handler(sock, m, config, saveConfig, isFiltered, addFilter);
    });
}

connectToWhatsApp();
