/* ==========================================================================
   MÓDULO: BANCO DE PERGUNTAS (API REST + Fallback LocalStorage)
   Design System: Tech Clean
   ========================================================================== */

// Prevenção contra erros de redeclaração usando o escopo global window
window.API_PERGUNTAS_URL = window.API_PERGUNTAS_URL || window.API_BASE + '/perguntas';

/**
 * Inicializa ouvintes de eventos e carrega a lista inicial da API ou LocalStorage
 */
async function initBancoPerguntas() {
    const formPergunta = document.getElementById('form-pergunta');
    const selectTipo = document.getElementById('tipo-pergunta');
    const btnAddAlt = document.getElementById('btn-add-alternativa');
    const btnCancelar = document.getElementById('btn-cancelar-edicao');

    if (formPergunta) {
        formPergunta.removeEventListener('submit', salvarPergunta);
        formPergunta.addEventListener('submit', salvarPergunta);
    }

    if (selectTipo) {
        selectTipo.removeEventListener('change', gerenciarCamposAlternativas);
        selectTipo.addEventListener('change', gerenciarCamposAlternativas);
    }

    if (btnAddAlt) {
        btnAddAlt.onclick = () => adicionarCampoAlternativa();
    }

    if (btnCancelar) {
        btnCancelar.onclick = () => cancelarEdicaoPergunta();
    }

    await carregarPerguntasAPI();
}

/**
 * Exibe ou esconde a seção de alternativas conforme o tipo de pergunta selecionado
 */
function gerenciarCamposAlternativas() {
    const selectTipo = document.getElementById('tipo-pergunta');
    if (!selectTipo) return;

    const tipo = selectTipo.value;
    const containerAlternativas = document.getElementById('container-alternativas');
    const lista = document.getElementById('lista-inputs-alternativas');
    const labelTipo = document.getElementById('label-tipo-alternativa');

    if (!containerAlternativas) return;

    if (tipo === 'multipla_escolha' || tipo === 'checkbox') {
        containerAlternativas.classList.remove('d-none');

        // Legenda instrutiva com cores e ícones coerentes
        if (labelTipo) {
            labelTipo.innerHTML = tipo === 'multipla_escolha'
                ? '<i class="bi bi-record-circle me-1 text-info"></i> Alternativas de Múltipla Escolha (Mínimo 2, Máximo 10 - Seleção Única)'
                : '<i class="bi bi-check-square me-1 text-info"></i> Alternativas do Checkbox (Mínimo 3, Máximo 15 - Múltipla Seleção)';
        }

        // Gera os inputs iniciais se a lista estiver vazia
        if (lista && lista.children.length === 0) {
            const qtdInicial = tipo === 'multipla_escolha' ? 2 : 3;
            for (let i = 0; i < qtdInicial; i++) {
                adicionarCampoAlternativa();
            }
        }
    } else {
        containerAlternativas.classList.add('d-none');
        if (lista) lista.innerHTML = '';
    }
}

/**
 * Adiciona um campo de input dinâmico para alternativa
 */
function adicionarCampoAlternativa(valor = '') {
    const lista = document.getElementById('lista-inputs-alternativas');
    if (!lista) return;

    const div = document.createElement('div');
    div.className = 'd-flex gap-2 mb-2 item-alternativa animate__animated animate__fadeIn';
    div.innerHTML = `
        <input type="text" class="form-control bg-dark text-white border-secondary campo-input input-alternativa" placeholder="Digite o texto da alternativa..." value="${esc(valor)}">
        <button class="btn btn-outline-danger btn-excluir-opcao d-inline-flex align-items-center justify-content-center" type="button" onclick="removerCampoAlternativa(this)" title="Remover alternativa" style="width: 38px; height: 38px;">
            <i class="bi bi-x-lg"></i>
        </button>
    `;
    lista.appendChild(div);
}

/**
 * Remove um campo de alternativa específico
 */
function removerCampoAlternativa(btn) {
    const item = btn.closest('.item-alternativa');
    if (item) item.remove();
}

/**
 * Carrega as perguntas cadastradas da API ou mantém a lista salva em memória
 */
async function carregarPerguntasAPI() {
    try {
        const res = await fetch(window.API_PERGUNTAS_URL);
        if (res.ok) {
            const dados = await res.json();
            if (window.bancoPerguntas) {
                window.bancoPerguntas.length = 0; // Limpa para evitar duplicidade
                window.bancoPerguntas.push(...dados);
            }
        }
    } catch (err) {
        console.warn("Servidor offline. Exibindo dados locais do Banco de Perguntas.", err);
    } finally {
        renderizarListaPerguntas();
    }
}

/**
 * Valida regras de negócio e salva/atualiza a pergunta
 */
async function salvarPergunta(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const idEdicao = document.getElementById('pergunta-id-edicao')?.value;
    const enunciadoInput = document.getElementById('enunciado');
    const tipoSelect = document.getElementById('tipo-pergunta');

    const enunciado = enunciadoInput ? enunciadoInput.value.trim() : '';
    const tipo = tipoSelect ? tipoSelect.value : '';

    // Validações principais
    if (!enunciado) {
        Swal.fire({
            icon: 'warning',
            title: 'Validação',
            text: 'O enunciado da pergunta não pode estar vazio.',
            confirmButtonColor: '#00f0ff',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    if (enunciado.length > 200) {
        Swal.fire({
            icon: 'warning',
            title: 'Limite Excedido',
            text: 'O enunciado deve ter no máximo 200 caracteres.',
            confirmButtonColor: '#00f0ff',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    const tiposValidos = ['multipla_escolha', 'texto_curto', 'texto_longo', 'checkbox'];
    if (!tiposValidos.includes(tipo)) {
        Swal.fire({
            icon: 'warning',
            title: 'Validação',
            text: 'Selecione um tipo válido de pergunta.',
            confirmButtonColor: '#00f0ff',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    let alternativas = [];

    // Validações de alternativas para Múltipla Escolha e Checkbox
    if (tipo === 'multipla_escolha' || tipo === 'checkbox') {
        const inputs = document.querySelectorAll('.input-alternativa');
        alternativas = Array.from(inputs)
            .map(input => input.value.trim())
            .filter(val => val !== '');

        const altsUnicas = new Set(alternativas.map(a => a.toLowerCase()));
        if (altsUnicas.size !== alternativas.length) {
            Swal.fire({
                icon: 'error',
                title: 'Alternativas Repetidas',
                text: 'Não são permitidas alternativas duplicadas.',
                confirmButtonColor: '#ff2a6d',
                background: '#12151e',
                color: '#ffffff'
            });
            return;
        }

        if (tipo === 'multipla_escolha' && (alternativas.length < 2 || alternativas.length > 10)) {
            Swal.fire({
                icon: 'error',
                title: 'Regra de Alternativas',
                text: 'Perguntas de múltipla escolha precisam de 2 a 10 alternativas válidas.',
                confirmButtonColor: '#ff2a6d',
                background: '#12151e',
                color: '#ffffff'
            });
            return;
        }

        if (tipo === 'checkbox' && (alternativas.length < 3 || alternativas.length > 15)) {
            Swal.fire({
                icon: 'error',
                title: 'Regra de Alternativas',
                text: 'Perguntas de checkbox precisam de 3 a 15 alternativas válidas.',
                confirmButtonColor: '#ff2a6d',
                background: '#12151e',
                color: '#ffffff'
            });
            return;
        }
    }

    const ehEdicao = Boolean(idEdicao);
    const objetoPergunta = {
        id: idEdicao || Date.now().toString(),
        enunciado,
        tipo,
        alternativas,
        criadaEm: ehEdicao
            ? (window.bancoPerguntas.find(p => String(p.id) === String(idEdicao))?.criadaEm || new Date().toISOString())
            : new Date().toISOString()
    };

    const url = ehEdicao ? `${window.API_PERGUNTAS_URL}/${encodeURIComponent(idEdicao)}` : window.API_PERGUNTAS_URL;
    const metodo = ehEdicao ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objetoPergunta)
        });

        if (res.ok) {
            const PerguntaResp = await res.json();
            if (ehEdicao) {
                const idx = window.bancoPerguntas.findIndex(p => String(p.id) === String(idEdicao));
                if (idx !== -1) window.bancoPerguntas[idx] = PerguntaResp;
            } else {
                window.bancoPerguntas.push(PerguntaResp);
            }
        } else {
            throw new Error('Falha no servidor');
        }
    } catch (err) {
        // Fallback local
        if (ehEdicao) {
            const idx = window.bancoPerguntas.findIndex(p => String(p.id) === String(idEdicao));
            if (idx !== -1) window.bancoPerguntas[idx] = objetoPergunta;
        } else {
            window.bancoPerguntas.push(objetoPergunta);
        }
    }

    if (typeof salvarEstadoStorage === 'function') {
        salvarEstadoStorage();
    }

    cancelarEdicaoPergunta();
    renderizarListaPerguntas();

    Swal.fire({
        icon: 'success',
        title: ehEdicao ? 'Pergunta Atualizada!' : 'Pergunta Cadastrada!',
        text: ehEdicao ? 'As alterações foram salvas com sucesso.' : 'Pergunta gravada no banco.',
        timer: 1800,
        showConfirmButton: false,
        background: '#12151e',
        color: '#ffffff'
    });
}

/**
 * Prepara o formulário para edição de uma pergunta
 */
function editarPergunta(id) {
    const pergunta = window.bancoPerguntas.find(p => String(p.id) === String(id));
    if (!pergunta) return;

    let idHidden = document.getElementById('pergunta-id-edicao');
    if (!idHidden) {
        idHidden = document.createElement('input');
        idHidden.type = 'hidden';
        idHidden.id = 'pergunta-id-edicao';
        document.getElementById('form-pergunta').appendChild(idHidden);
    }
    idHidden.value = pergunta.id;

    document.getElementById('enunciado').value = pergunta.enunciado || '';

    const selectTipo = document.getElementById('tipo-pergunta');
    if (selectTipo) selectTipo.value = pergunta.tipo;

    gerenciarCamposAlternativas();

    if (pergunta.tipo === 'multipla_escolha' || pergunta.tipo === 'checkbox') {
        const lista = document.getElementById('lista-inputs-alternativas');
        if (lista) lista.innerHTML = '';
        (pergunta.alternativas || []).forEach(alt => adicionarCampoAlternativa(alt));
    }

    // Altera rótulos de botões da interface
    const btnSalvar = document.getElementById('btn-salvar-pergunta');
    const btnCancelar = document.getElementById('btn-cancelar-edicao');

    if (btnSalvar) btnSalvar.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Atualizar Pergunta';
    if (btnCancelar) btnCancelar.classList.remove('d-none');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Restaura o formulário para o estado inicial de inclusão
 */
function cancelarEdicaoPergunta() {
    const idHidden = document.getElementById('pergunta-id-edicao');
    if (idHidden) idHidden.value = '';

    const form = document.getElementById('form-pergunta');
    if (form) form.reset();

    const btnSalvar = document.getElementById('btn-salvar-pergunta');
    const btnCancelar = document.getElementById('btn-cancelar-edicao');

    if (btnSalvar) btnSalvar.innerHTML = '<i class="bi bi-floppy me-1"></i> Salvar Pergunta';
    if (btnCancelar) btnCancelar.classList.add('d-none');

    gerenciarCamposAlternativas();
}

/**
 * Renderiza a lista de perguntas cadastradas no banco
 */
function renderizarListaPerguntas() {
    const container = document.getElementById('lista-banco-perguntas');
    if (!container) return;

    if (!window.bancoPerguntas || window.bancoPerguntas.length === 0) {
        container.innerHTML = `
            <div class="alert alert-dark text-center text-muted border-secondary my-4 rounded-3 p-4">
                <i class="bi bi-question-circle fs-2 text-info d-block mb-2"></i>
                Nenhuma pergunta cadastrada até o momento.
            </div>
        `;
        return;
    }

    let html = '<ul class="list-unstyled mb-0">';
    window.bancoPerguntas.forEach((p) => {
        let altBadges = (p.alternativas && p.alternativas.length > 0)
            ? `<div class="mt-2 d-flex flex-wrap gap-1">
                ${p.alternativas.map(a => `<span class="badge bg-dark border border-secondary text-info">${esc(a)}</span>`).join('')}
               </div>`
            : '';

        const rotuloTipo = {
            'texto_curto': 'Texto Curto',
            'texto_longo': 'Texto Longo',
            'multipla_escolha': 'Múltipla Escolha',
            'checkbox': 'Checkbox'
        }[p.tipo] || p.tipo;

        html += `
            <li class="item-lista d-flex justify-content-between align-items-center mb-3 p-3 rounded" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
                <div class="flex-grow-1 me-3">
                    <div class="fw-bold text-white fs-5 mb-1">${esc(p.enunciado)}</div>
                    <small class="text-info fw-semibold"><i class="bi bi-tag-fill me-1"></i>Tipo: ${rotuloTipo}</small>
                    ${altBadges}
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-outline-warning btn-sm rounded-circle p-2 d-inline-flex align-items-center justify-content-center" style="width: 34px; height: 34px;" onclick="editarPergunta('${idSeguro(p.id)}')" title="Editar Pergunta">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-circle p-2 d-inline-flex align-items-center justify-content-center" style="width: 34px; height: 34px;" onclick="excluirPergunta('${idSeguro(p.id)}')" title="Excluir Pergunta">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </li>
        `;
    });
    html += '</ul>';

    container.innerHTML = html;
}

/**
 * Exclui uma pergunta verificando se ela já possui respostas associadas
 */
async function excluirPergunta(id) {
    const respostasLocais = window.bancoRespostas || [];
    let temRespostaVinculada = respostasLocais.some(r =>
        r.respostas && r.respostas.some(item => String(item.perguntaId) === String(id))
    );

    if (!temRespostaVinculada) {
        try {
            const resRespostas = await fetch(`${window.API_BASE}/respostas`);
            if (resRespostas.ok) {
                const respostasServidor = await resRespostas.json();
                temRespostaVinculada = respostasServidor.some(r =>
                    r.respostas && r.respostas.some(item => String(item.perguntaId) === String(id))
                );
            }
        } catch (e) { }
    }

    if (temRespostaVinculada) {
        Swal.fire({
            icon: 'error',
            title: 'Exclusão Bloqueada',
            text: 'Esta pergunta possui respostas registradas e não pode ser excluída.',
            confirmButtonColor: '#ff2a6d',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    const confirmacao = await Swal.fire({
        title: 'Remover Pergunta?',
        text: "Esta ação não poderá ser desfeita.",
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
        await fetch(`${window.API_PERGUNTAS_URL}/${id}`, { method: 'DELETE' });
    } catch (err) {
        console.warn("Exclusão concluída em memória local.");
    }

    window.bancoPerguntas = window.bancoPerguntas.filter(p => String(p.id) !== String(id));

    if (typeof salvarEstadoStorage === 'function') {
        salvarEstadoStorage();
    }

    renderizarListaPerguntas();

    Swal.fire({
        icon: 'success',
        title: 'Pergunta Removida!',
        timer: 1500,
        showConfirmButton: false,
        background: '#12151e',
        color: '#ffffff'
    });
}