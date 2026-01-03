import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
    // can provide additional config here
    printQRInTerminal: false //need to be false
})

if (!sock.authState.creds.registered) {
    let number
    console.log()
    const code = await sock.requestPairingCode(number)
    console.log(code)
}