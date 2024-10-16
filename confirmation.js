const mysql = require('mysql2')

// Conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'k9xdebw4k3zynl4u.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  user: 'jdocjo0qr6n7fswm',
  password: 'ot4rv2hrpywqbwvp',
  database: 'y4l7y7v3pdk47h8m'
})

// Função para enviar mensagens de confirmação de agendamento
function sendConfirmation (client) {
  const query = `
    SELECT id, usuario_nome_completo, usuario_telefone, data_do_servico, hora_do_servico, servicos 
    FROM agendamentos
    WHERE data_criacao >= NOW() - INTERVAL 1 DAY 
    AND ultima_mensagem IS NULL
  ` // Busca apenas agendamentos criados nas últimas 24 horas e sem mensagem enviada

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao recuperar dados do agendamento:', err)
      connection.end()
      return
    }

    const promessas = []

    results.forEach(agendamento => {
      // Mesmo código para preparar e enviar as mensagens
      const dataServico = new Date(agendamento.data_do_servico)
      const dataFormatada = dataServico.toLocaleDateString('pt-BR')
      const horaFormatada = agendamento.hora_do_servico.slice(0, 5) // Formato: HH:MM

      let servicos = agendamento.servicos
      try {
        servicos = JSON.parse(servicos)
      } catch (e) {
        console.error(`Erro ao parsear os serviços de ${agendamento.usuario_nome_completo}:`, e)
        servicos = []
      }

      const servicosFormatados = servicos.join(', ')
      const mensagemConfirmacao = `Olá, senhor(a) ${agendamento.usuario_nome_completo}! Você agendou os serviços: ${servicosFormatados}, no dia ${dataFormatada} às ${horaFormatada}h. Estamos te esperando!`

      const promessa = client.sendMessage(agendamento.usuario_telefone + '@c.us', mensagemConfirmacao)
        .then(() => {
          console.log(`Mensagem de confirmação enviada para ${agendamento.usuario_nome_completo}`)

          return new Promise((resolve, reject) => {
            const updateQuery = 'UPDATE agendamentos SET ultima_mensagem = NOW() WHERE id = ?'
            connection.query(updateQuery, [agendamento.id], (err) => {
              if (err) {
                console.error(`Erro ao atualizar data para ${agendamento.usuario_nome_completo}:`, err)
                reject(err)
              } else {
                console.log(`Data de última mensagem atualizada para ${agendamento.usuario_nome_completo}`)
                resolve()
              }
            })
          })
        })
        .catch(err => {
          console.error(`Erro ao enviar mensagem para ${agendamento.usuario_nome_completo}: ${err}`)
        })

      promessas.push(promessa)
    })

    Promise.all(promessas)
      .then(() => {
        connection.end()
      })
      .catch(err => {
        console.error('Erro no envio das confirmações:', err)
        connection.end()
      })
  })
}

module.exports = { sendConfirmation }
