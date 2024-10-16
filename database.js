const mysql = require('mysql2')

const connection = mysql.createConnection({
  host: 'k9xdebw4k3zynl4u.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  user: 'jdocjo0qr6n7fswm',
  password: 'ot4rv2hrpywqbwvp',
  database: 'y4l7y7v3pdk47h8m'
})

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err)
    return
  }
  console.log('Conectado ao banco de dados MySQL!')

  // Fecha a conexão após a execução
  connection.end()
})
