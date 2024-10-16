const mysql = require('mysql2')

// Conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'k9xdebw4k3zynl4u.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  user: 'jdocjo0qr6n7fswm',
  password: 'ot4rv2hrpywqbwvp',
  database: 'y4l7y7v3pdk47h8m'
})

// Função para enviar mensagens e atualizar o banco
function sendMessages (client) {
  const query = `
    SELECT id, usuario_id, usuario_nome_completo, usuario_telefone, data_do_servico, ultima_mensagem 
    FROM agendamentos 
    WHERE (usuario_id, data_do_servico) IN (
      SELECT usuario_id, MAX(data_do_servico) 
      FROM agendamentos 
      GROUP BY usuario_id
    )
  `

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao recuperar dados:', err)
      return
    }

    // Data atual
    const dataAtual = new Date()
    const promessas = []

    results.forEach(cliente => {
      const dataServico = new Date(cliente.data_do_servico)
      const ultimaMensagem = cliente.ultima_mensagem ? new Date(cliente.ultima_mensagem) : null

      // Verifica se há um agendamento futuro
      const queryFuturo = `
        SELECT COUNT(*) as count 
        FROM agendamentos 
        WHERE usuario_id = ? AND data_do_servico > ?
      `

      connection.query(queryFuturo, [cliente.usuario_id, dataAtual], (err, resultFuturo) => {
        if (err) {
          console.error('Erro ao verificar agendamentos futuros:', err)
          return
        }

        // Se houver agendamentos futuros, não enviar lembrete
        if (resultFuturo[0].count > 0) {
          return // Não envia mensagem
        }

        const diferencaEmDiasServico = Math.floor((dataAtual - dataServico) / (1000 * 60 * 60 * 24))
        const diferencaEmDiasUltimaMensagem = ultimaMensagem ? Math.floor((dataAtual - ultimaMensagem) / (1000 * 60 * 60 * 24)) : null

        // Enviar mensagem se já se passaram 15 dias desde o último serviço e a última mensagem
        if (diferencaEmDiasServico >= 15 && (diferencaEmDiasUltimaMensagem === null || diferencaEmDiasUltimaMensagem >= 15)) {
          const mensagem = `Olá, ${cliente.usuario_nome_completo}! Sentimos sua falta por aqui. Já faz um tempo desde sua última visita à barbearia. Que tal agendar um horário e dar um trato no visual? Estamos esperando por você!`

          const promessa = client.sendMessage(cliente.usuario_telefone + '@c.us', mensagem)
            .then(response => {
              console.log(`Mensagem enviada para ${cliente.usuario_nome_completo}`)

              return new Promise((resolve, reject) => {
                const updateQuery = 'UPDATE agendamentos SET ultima_mensagem = NOW() WHERE id = ?'
                connection.query(updateQuery, [cliente.id], (err, result) => {
                  if (err) {
                    console.error(`Erro ao atualizar data para ${cliente.usuario_nome_completo}:`, err)
                    reject(err)
                  } else {
                    console.log(`Data de última mensagem atualizada para ${cliente.usuario_nome_completo}`)
                    resolve(result)
                  }
                })
              })
            })
            .catch(err => {
              console.error(`Erro ao enviar mensagem para ${cliente.usuario_nome_completo}: ${err}`)
            })

          promessas.push(promessa)
        }
      })
    })

    Promise.all(promessas)
      .then(() => {
        console.log('Mensagens enviadas e datas atualizadas.')
        connection.end()
      })
      .catch(err => {
        console.error('Erro no envio das mensagens:', err)
        connection.end()
      })
  })
}

module.exports = { sendMessages }
