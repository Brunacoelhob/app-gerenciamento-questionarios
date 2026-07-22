/* ==========================================================================
   MÓDULO: QUESTIONÁRIOS / FORMULÁRIOS
   ========================================================================== */

const listaFormularios = []

/**
 * Inicializa o módulo de Formulários
 */
function initFormularios() {
    const formQuestionario = document.getElementById('form-questionario')
    if (formQuestionario) {
        formQuestionario.addEventListener('submit', salvarFormulario)
    }
}

/**
 * Valida datas e cadastra um novo questionário
 */
function salvarFormulario(event) {
    event.preventDefault()

    const titulo = document.getElementById('form-titulo').value.trim()
    const dataInicio = document.getElementById('form-data-inicio').value
    const dataFim = document.getElementById('form-data-fim').value

    if (!titulo || !dataInicio || !dataFim) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos Incompletos',
            text: 'Preencha todos os campos obrigatórios do formulário.',
            confirmColor: '#6366f1'
        })
        return
    }

    // Validação das datas de vigência
    if (new Date(dataInicio) > new Date(dataFim)) {
        Swal.fire({
            icon: 'error',
            title: 'Período Inválido',
            text: 'A data de início não pode ser maior que a data de término.',
            confirmColor: '#6366f1'
        })
        return
    }

    const novoFormulario = {
        id: Date.now(),
        titulo,
        dataInicio,
        dataFim,
        perguntas: [], // IDs ou objetos das perguntas vinculadas
        status: calcularStatus(dataInicio, dataFim)
    }

    listaFormularios.push(novoFormulario)

    document.getElementById('form-questionario').reset()

    Swal.fire({
        icon: 'success',
        title: 'Formulário Criado!',
        text: 'O questionário foi registrado com sucesso.',
        timer: 1800,
        showConfirmButton: false
    })

    renderizarTabelaFormularios()
}

/**
 * Determina o status com base na data atual
 */
function calcularStatus(inicio, fim) {
    const hoje = new Date().toISOString().split('T')[0]
    if (hoje < inicio) return 'Agendado'
    if (hoje > fim) return 'Encerrado'
    return 'Ativo'
}

/**
 * Renderiza a lista de questionários
 */
function renderizarTabelaFormularios() {
    const container = document.getElementById('lista-formularios')
    if (!container) return

    if (listaFormularios.length === 0) {
        container.innerHTML = `<p class="text-muted text-center my-4">Nenhum questionário cadastrado.</p>`
        return
    }

    let html = `
    <div class="table-responsive">
      <table class="table table-dark table-hover align-middle">
        <thead>
          <tr>
            <th>Título</th>
            <th>Período</th>
            <th>Status</th>
            <th class="text-end">Ações</th>
          </tr>
        </thead>
        <tbody>
  `

    listaFormularios.forEach(f => {
        let badgeClass = 'bg-success'
        if (f.status === 'Agendado') badgeClass = 'bg-warning text-dark'
        if (f.status === 'Encerrado') badgeClass = 'bg-secondary'

        html += `
      <tr>
        <td><strong>${f.titulo}</strong></td>
        <td>${f.dataInicio} até ${f.dataFim}</td>
        <td><span class="badge ${badgeClass}">${f.status}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="excluirFormulario(${f.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
    })

    html += `</tbody></table></div>`
    container.innerHTML = html
}

function excluirFormulario(id) {
    const index = listaFormularios.findIndex(f => f.id === id)
    if (index !== -1) {
        listaFormularios.splice(index, 1)
        renderizarTabelaFormularios()
    }
}