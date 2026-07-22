/* ==========================================================================
   MÓDULO: BANCO DE PERGUNTAS
   ========================================================================== */

// Base de dados em memória para as perguntas
const bancoPerguntas = []

/**
 * Inicializa os ouvintes de evento do módulo de Perguntas
 */
function initBancoPerguntas() {
    const formPergunta = document.getElementById('form-pergunta')
    if (formPergunta) {
        formPergunta.addEventListener('submit', salvarPergunta)
    }
}

/**
 * Salva uma nova pergunta no banco de dados local
 */
function salvarPergunta(event) {
    event.preventDefault()

    const enunciadoInput = document.getElementById('pergunta-enunciado')
    const tipoInput = document.getElementById('pergunta-tipo')

    const enunciado = enunciadoInput.value.trim()
    const tipo = tipoInput.value

    // Validação básica
    if (!enunciado) {
        Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Por favor, informe o enunciado da pergunta.',
            confirmColor: '#6366f1'
        })
        return
    }

    // Cria o objeto da pergunta
    const novaPergunta = {
        id: Date.now(),
        enunciado,
        tipo
    }

    bancoPerguntas.push(novaPergunta)

    // Limpa o formulário
    formPergunta.reset()

    // Feedback para o usuário
    Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Pergunta cadastrada com sucesso.',
        timer: 1800,
        showConfirmButton: false
    })

    renderizarTabelaPerguntas()
}

/**
 * Renderiza a lista de perguntas cadastradas na interface
 */
function renderizarTabelaPerguntas() {
    const container = document.getElementById('lista-perguntas')
    if (!container) return

    if (bancoPerguntas.length === 0) {
        container.innerHTML = `<p class="text-muted text-center my-4">Nenhuma pergunta cadastrada até o momento.</p>`
        return
    }

    let html = `
    <div class="table-responsive">
      <table class="table table-dark table-hover align-middle">
        <thead>
          <tr>
            <th>#</th>
            <th>Enunciado</th>
            <th>Tipo</th>
            <th class="text-end">Ações</th>
          </tr>
        </thead>
        <tbody>
  `

    bancoPerguntas.forEach((pergunta, index) => {
        html += `
      <tr>
        <td>${index + 1}</td>
        <td>${pergunta.enunciado}</td>
        <td><span class="badge bg-primary">${pergunta.tipo}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="excluirPergunta(${pergunta.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
    })

    html += `</tbody></table></div>`
    container.innerHTML = html
}

/**
 * Exclui uma pergunta pelo ID
 */
function excluirPergunta(id) {
    const index = bancoPerguntas.findIndex(p => p.id === id)
    if (index !== -1) {
        bancoPerguntas.splice(index, 1)
        renderizarTabelaPerguntas()

        Swal.fire({
            icon: 'info',
            title: 'Removido',
            text: 'Pergunta removida do banco.',
            timer: 1500,
            showConfirmButton: false
        })
    }
}