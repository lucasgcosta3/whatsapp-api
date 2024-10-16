const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { sendMessages } = require('./msgHandler')
const { sendConfirmation } = require('./confirmation')

// Configuração do cliente do WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})

// Exibe o QR code
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true })
  console.log('QR RECEIVED', qr)
})

client.on('authenticated', () => {
  console.log('Sessão autenticada!')
})

// Evento quando o cliente está pronto
client.on('ready', () => {
  console.log('Client is ready!')
  sendMessages(client)
  sendConfirmation(client)
})

client.on('auth_failure', () => {
  console.error('Falha na autenticação, sessão inválida')
})

// Inicializa o cliente
client.initialize()
