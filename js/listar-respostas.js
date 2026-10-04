/* ==========================================================================
   MÓDULO: LISTAGEM DE RESPOSTAS (Visão Administrativa)
   Design System: Tech Clean
   ========================================================================== */

// Prevenção contra erros de redeclaração usando o objeto global window
window.API_CONSULTA_URL = window.API_CONSULTA_URL || window.API_BASE;

/**
 * Inicializa os ouvintes da tela de listagem de respostas
 */
async function initListarRespostas() {
    const selectFormularios = document.getElementById('select-filtro-formulario-respostas');

    if (selectFormularios) {
        selectFormularios.removeEventListener('change', carregarRespostasDoFormulario);
        selectFormularios.addEventListener('change', carregarRespostasDoFormulario);

        // Garante a recarga das opções ao focar no select
        selectFormularios.onfocus = carregarOpcoesFormularios;
    }

    await carregarOpcoesFormularios();
}

/**
 * Carrega os formulários disponíveis no select de filtro (API ou Memória Local/LocalStorage)
 */
async function carregarOpcoesFormularios() {
    const select = document.getElementById('select-filtro-formulario-respostas');
    if (!select) return;

    // Busca primeiro do LocalStorage / Banco em Memória
    let formularios = window.bancoFormularios || JSON.parse(localStorage.getItem('formularios') || '[]');

    try {
        const res = await fetch(`${window.API_CONSULTA_URL}/formularios`);
        if (res.ok) {
            formularios = await res.json();
            window.bancoFormularios = formularios;
        }
    } catch (err) {
        console.warn('API indisponível. Carregando lista de formulários do armazenamento local.', err);
    }

    const valorSelecionadoAnterior = select.value;

    if (formularios.length === 0) {
        select.innerHTML = '<option value="" selected disabled>Nenhum formulário disponível para consulta...</option>';
        return;
    }

    let html = '<option value="" selected disabled>Selecione um formulário para ver as respostas...</option>';
    formularios.forEach(f => {
        html += `<option value="${esc(f.id)}">${esc(f.titulo)} (ID: ${esc(f.id)})</option>`;
    });

    select.innerHTML = html;

    if (valorSelecionadoAnterior) {
        select.value = valorSelecionadoAnterior;
    }
}

/**
 * Busca e exibe todas as respostas enviadas para o formulário selecionado
 */
async function carregarRespostasDoFormulario(event) {
    const formularioId = event && event.target ? event.target.value : event;
    const containerTabela = document.getElementById('container-tabela-respostas');
    const badgeTotal = document.getElementById('total-respostas-badge') || document.getElementById('badge-total-respostas');

    if (!formularioId) return;

    let respostas = [];
    let perguntas = window.bancoPerguntas || JSON.parse(localStorage.getItem('perguntas') || '[]');

    try {
        // Tenta buscar via API REST
        const resRespostas = await fetch(`${window.API_CONSULTA_URL}/respostas?formularioId=${formularioId}`);
        const resPerguntas = await fetch(`${window.API_CONSULTA_URL}/perguntas`);

        if (resRespostas.ok && resPerguntas.ok) {
            respostas = await resRespostas.json();
            perguntas = await resPerguntas.json();
            window.bancoPerguntas = perguntas;
        } else {
            throw new Error('Falha HTTP na consulta de dados');
        }
    } catch (err) {
        console.warn('Servidor offline ou sem rota. Filtrando respostas e perguntas do armazenamento local.', err);

        // CORREÇÃO CRÍTICA: Busca garantida no LocalStorage + Memória Local
        const todasRespostas = window.bancoRespostas || JSON.parse(localStorage.getItem('respostas') || '[]');
        respostas = todasRespostas.filter(r => String(r.formularioId) === String(formularioId));
    }

    // Atualiza o badge contador de respostas
    if (badgeTotal) {
        badgeTotal.textContent = `${respostas.length} resposta(s)`;
    }

    if (!containerTabela) return;

    if (respostas.length === 0) {
        containerTabela.innerHTML = `
            <div class="alert alert-dark text-center text-muted border-secondary my-4 rounded-3 p-4">
                <i class="bi bi-inbox fs-2 text-info d-block mb-2"></i>
                Nenhuma resposta registrada para este formulário até o momento.
            </div>
        `;
        return;
    }

    // Monta a tabela no padrão Tech Clean
    let html = `
        <div class="table-responsive rounded border border-secondary mt-3">
            <table class="table table-dark table-hover mb-0 align-middle">
                <thead>
                    <tr class="table-dark text-info border-bottom border-secondary">
                        <th scope="col" class="ps-3">#</th>
                        <th scope="col">Respondente</th>
                        <th scope="col">E-mail</th>
                        <th scope="col">Data de Envio</th>
                        <th scope="col" class="text-center pe-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;

    respostas.forEach((r, index) => {
        const dataFormatada = r.enviadoEm
            ? new Date(r.enviadoEm).toLocaleString('pt-BR')
            : 'N/I';

        html += `
            <tr class="border-bottom border-secondary opacity-90">
                <th scope="row" class="ps-3 text-muted">${index + 1}</th>
                <td class="fw-bold text-white">${esc(r.nome || 'Não informado')}</td>
                <td class="text-info">${esc(r.email || 'Não informado')}</td>
                <td><small class="text-muted"><i class="bi bi-clock me-1"></i>${dataFormatada}</small></td>
                <td class="text-center pe-3">
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-sm btn-outline-info rounded-circle p-2 d-inline-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" onclick="verDetalheResposta('${idSeguro(r.id)}', '${idSeguro(formularioId)}')" title="Ver respostas completas">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger rounded-circle p-2 d-inline-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" onclick="excluirResposta('${idSeguro(r.id)}', '${idSeguro(formularioId)}')" title="Excluir resposta">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    containerTabela.innerHTML = html;
}

/**
 * Exibe um modal (SweetAlert2) com o detalhamento das respostas do usuário
 */
async function verDetalheResposta(respostaId, formularioId) {
    let resposta = null;
    let todasPerguntas = window.bancoPerguntas || JSON.parse(localStorage.getItem('perguntas') || '[]');

    try {
        const resResposta = await fetch(`${window.API_CONSULTA_URL}/respostas/${respostaId}`);
        const resPerguntas = await fetch(`${window.API_CONSULTA_URL}/perguntas`);

        if (resResposta.ok && resPerguntas.ok) {
            resposta = await resResposta.json();
            todasPerguntas = await resPerguntas.json();
        } else {
            throw new Error();
        }
    } catch (err) {
        // Fallback local garantido
        const todasRespostas = window.bancoRespostas || JSON.parse(localStorage.getItem('respostas') || '[]');
        resposta = todasRespostas.find(r => String(r.id) === String(respostaId));
    }

    if (!resposta) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Resposta não encontrada.',
            confirmButtonColor: '#ff2a6d',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    let htmlDetalhes = `<div class="text-start">`;
    htmlDetalhes += `<p class="mb-1"><strong>Respondente:</strong> <span class="text-info">${esc(resposta.nome || 'Não informado')}</span></p>`;
    htmlDetalhes += `<p class="mb-2"><strong>E-mail:</strong> ${esc(resposta.email || 'Não informado')}</p>`;
    htmlDetalhes += `<p class="border-bottom border-secondary pb-2 mb-3 text-muted small"><strong>Data de Envio:</strong> ${new Date(resposta.enviadoEm).toLocaleString('pt-BR')}</p>`;
    htmlDetalhes += `<h6 class="mt-3 text-info fw-bold"><i class="bi bi-card-checklist me-1"></i> Respostas Fornecidas:</h6>`;

    if (resposta.respostas && resposta.respostas.length > 0) {
        resposta.respostas.forEach(item => {
            const perguntaObj = todasPerguntas.find(p => String(p.id) === String(item.perguntaId));
            const enunciado = perguntaObj ? perguntaObj.enunciado : `Pergunta ID: ${item.perguntaId}`; // escapado ao montar o HTML

            let valorFormatado = typeof item.valor === 'string' ? esc(item.valor) : item.valor;
            if (Array.isArray(item.valor)) {
                valorFormatado = item.valor.map(v => `<span class="badge bg-dark border border-secondary text-info me-1">${esc(v)}</span>`).join(' ');
            } else if (!valorFormatado) {
                valorFormatado = '<em class="text-muted">Sem resposta</em>';
            }

            htmlDetalhes += `
                <div class="mb-3 p-3 rounded" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
                    <div class="fw-bold text-white mb-1 fs-6">${esc(enunciado)}</div>
                    <div class="text-light opacity-90">${valorFormatado}</div>
                </div>
            `;
        });
    } else {
        htmlDetalhes += `<p class="text-muted">Nenhuma resposta gravada neste registro.</p>`;
    }

    htmlDetalhes += `</div>`;

    Swal.fire({
        title: 'Detalhamento da Resposta',
        html: htmlDetalhes,
        width: '650px',
        background: '#12151e',
        color: '#ffffff',
        confirmButtonColor: '#00f0ff',
        confirmButtonText: 'Fechar'
    });
}

/**
 * Exclui um registro de resposta (API REST + Fallback Local)
 */
async function excluirResposta(respostaId, formularioId) {
    const confirmacao = await Swal.fire({
        title: 'Remover Resposta?',
        text: "Essa ação excluirá este envio do histórico de auditoria.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff2a6d',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        background: '#12151e',
        color: '#ffffff'
    });

    if (!confirmacao.isConfirmed) return;

    try {
        await fetch(`${window.API_CONSULTA_URL}/respostas/${respostaId}`, { method: 'DELETE' });
    } catch (err) {
        console.warn("Exclusão realizada localmente.");
    }

    // Atualiza estado local em memória e LocalStorage
    let todasRespostas = window.bancoRespostas || JSON.parse(localStorage.getItem('respostas') || '[]');
    todasRespostas = todasRespostas.filter(r => String(r.id) !== String(respostaId));

    window.bancoRespostas = todasRespostas;
    localStorage.setItem('respostas', JSON.stringify(todasRespostas));

    if (typeof window.salvarEstadoStorage === 'function') window.salvarEstadoStorage();

    // Recarrega a tabela preservando o filtro ativo
    carregarRespostasDoFormulario(formularioId);

    Swal.fire({
        icon: 'success',
        title: 'Excluída!',
        text: 'A resposta foi removida do sistema.',
        timer: 1500,
        showConfirmButton: false,
        background: '#12151e',
        color: '#ffffff'
    });
}

// Expõe ao escopo global
window.initListarRespostas = initListarRespostas;
window.carregarOpcoesFormularios = carregarOpcoesFormularios;
window.carregarRespostasDoFormulario = carregarRespostasDoFormulario;
window.verDetalheResposta = verDetalheResposta;
window.excluirResposta = excluirResposta;

// Auto-inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initListarRespostas);
} else {
    initListarRespostas();
}