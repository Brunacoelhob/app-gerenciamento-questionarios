/* ==========================================================================
   MÓDULO: GESTÃO DE FORMULÁRIOS / QUESTIONÁRIOS
   Design System: Tech Clean
   ========================================================================== */

// Prevenção contra erros de redeclaração usando o escopo global window
window.API_FORMULARIOS_URL = window.API_FORMULARIOS_URL || 'http://localhost:3000/formularios';

/**
 * Função Utilitária: Gera o próximo ID numérico sequencial (1, 2, 3, 4...)
 */
function gerarProximoIdFormulario(lista) {
    if (!lista || lista.length === 0) return "1";

    const idsNumericos = lista
        .map(item => parseInt(item.id, 10))
        .filter(num => !isNaN(num));

    if (idsNumericos.length === 0) return "1";

    const maiorId = Math.max(...idsNumericos);
    return String(maiorId + 1);
}

/**
 * Inicializa os eventos da aba de Gestão de Formulários
 */
async function initFormularios() {
    const formCriar = document.getElementById('form-criar-formulario');
    if (formCriar) {
        // Remove ouvintes antigos para evitar submissões duplicadas
        formCriar.removeEventListener('submit', salvarFormulario);
        formCriar.addEventListener('submit', salvarFormulario);
    }

    await carregarFormulariosAPI();
    renderizarSelecaoPerguntasBanco();
}

/**
 * Renderiza as perguntas cadastradas no banco em formato de lista com checkbox
 * para inclusão no formulário.
 */
function renderizarSelecaoPerguntasBanco(selecionados = []) {
    const container = document.getElementById('selecao-perguntas-banco');
    if (!container) return;

    const perguntas = window.bancoPerguntas || [];

    if (perguntas.length === 0) {
        container.innerHTML = `
            <p class="text-muted mb-0 p-2">
                <i class="bi bi-exclamation-triangle me-1 text-warning"></i>
                Nenhuma pergunta cadastrada no Banco. Cadastre perguntas na primeira aba antes de criar um formulário.
            </p>`;
        return;
    }

    let html = '<div class="d-flex flex-column gap-2 mt-2">';
    perguntas.forEach((p) => {
        let iconeTipo = 'bi-patch-question';
        if (p.tipo === 'texto_curto' || p.tipo === 'texto') iconeTipo = 'bi-input-cursor-text';
        if (p.tipo === 'texto_longo') iconeTipo = 'bi-textarea-resize';
        if (p.tipo === 'multipla_escolha') iconeTipo = 'bi-record-circle';
        if (p.tipo === 'checkbox') iconeTipo = 'bi-check-square';

        const isChecked = selecionados.map(String).includes(String(p.id)) ? 'checked' : '';

        html += `
            <label class="d-flex align-items-center gap-2 p-2 rounded cursor-pointer item-selecao-pergunta option-hover" 
                   style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);">
                <input type="checkbox" class="checkbox-pergunta-form form-check-input mt-0 ms-1" value="${p.id}" ${isChecked} style="transform: scale(1.1);">
                <span class="text-info fs-6 ms-1"><i class="bi ${iconeTipo}"></i></span>
                <span class="text-white flex-grow-1 fw-medium">${p.enunciado}</span>
            </label>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Carrega a lista de formulários da API (ou do LocalStorage como fallback)
 */
async function carregarFormulariosAPI() {
    try {
        const res = await fetch(window.API_FORMULARIOS_URL);
        if (res.ok) {
            const dados = await res.json();
            if (window.bancoFormularios) {
                window.bancoFormularios.length = 0; // Evita duplicação ao recarregar
                window.bancoFormularios.push(...dados);
            }
        }
    } catch (err) {
        console.warn("API de Formulários offline. Carregando dados salvos localmente.", err);
    } finally {
        renderizarListaFormularios();
    }
}

/**
 * Salva um novo formulário ou atualiza um existente (POST / PUT)
 */
async function salvarFormulario(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const idEdicao = document.getElementById('formulario-id-edicao')?.value;
    const titulo = document.getElementById('titulo-form')?.value.trim();
    const descricao = document.getElementById('descricao-form')?.value.trim();
    const dataInicio = document.getElementById('data-inicio')?.value;
    const dataFim = document.getElementById('data-fim')?.value;
    const status = document.getElementById('status-form')?.value;

    // Obtém os IDs das perguntas selecionadas
    const checkboxes = document.querySelectorAll('.checkbox-pergunta-form:checked');
    const perguntasIds = Array.from(checkboxes).map(cb => cb.value);

    // Validações
    if (!titulo) {
        Swal.fire({
            icon: 'warning',
            title: 'Validação',
            text: 'Informe o título do formulário.',
            confirmButtonColor: '#00f0ff',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    if (perguntasIds.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Validação',
            text: 'Selecione pelo menos 1 pergunta para compor o formulário.',
            confirmButtonColor: '#00f0ff',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    if (dataInicio && dataFim && new Date(dataFim) <= new Date(dataInicio)) {
        Swal.fire({
            icon: 'error',
            title: 'Período Inválido',
            text: 'A Data de Fim deve ser posterior à Data de Início.',
            confirmButtonColor: '#ff2a6d',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    const ehEdicao = Boolean(idEdicao);

    // No POST (criação), NÃO mandamos a propriedade 'id' no objeto.
    // O json-server vai ler o db.json (que agora tem IDs numéricos) e criar automaticamente 2, 3, 4...
    const objetoFormulario = {
        ...(ehEdicao && { id: isNaN(Number(idEdicao)) ? idEdicao : Number(idEdicao) }),
        titulo,
        descricao,
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
        status: status || 'rascunho',
        perguntasIds,
        criadoEm: ehEdicao
            ? (window.bancoFormularios.find(f => String(f.id) === String(idEdicao))?.criadoEm || new Date().toISOString())
            : new Date().toISOString()
    };

    const url = ehEdicao ? `${window.API_FORMULARIOS_URL}/${idEdicao}` : window.API_FORMULARIOS_URL;
    const metodo = ehEdicao ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objetoFormulario)
        });

        if (res.ok) {
            let formSalvo = await res.json();

            // Garantia: se a API gerou um ID hash aleatório no POST, nos forçamos o ID sequencial correto!
            if (!ehEdicao && String(formSalvo.id) !== idDesejado) {
                formSalvo.id = idDesejado;
            }

            if (ehEdicao) {
                const idx = window.bancoFormularios.findIndex(f => String(f.id) === String(idEdicao));
                if (idx !== -1) window.bancoFormularios[idx] = formSalvo;
            } else {
                window.bancoFormularios.push(formSalvo);
            }
        } else {
            throw new Error("Erro na requisição à API");
        }
    } catch (e) {
        console.warn("Servidor indisponível. Gravando em memória local/localStorage.", e);
        if (ehEdicao) {
            const idx = window.bancoFormularios.findIndex(f => String(f.id) === String(idEdicao));
            if (idx !== -1) window.bancoFormularios[idx] = objetoFormulario;
        } else {
            window.bancoFormularios.push(objetoFormulario);
        }
    }

    // Persiste no LocalStorage diretamente
    localStorage.setItem('formularios', JSON.stringify(window.bancoFormularios));

    if (typeof window.salvarEstadoStorage === 'function') {
        window.salvarEstadoStorage();
    }

    // Reset do Formulário e Renderização Atualizada
    cancelarEdicaoFormulario();
    renderizarListaFormularios();

    // Atualiza o dropdown da tela de respostas se ela estiver visível
    if (typeof window.carregarSelectFormularios === 'function') {
        window.carregarSelectFormularios();
    }

    Swal.fire({
        icon: 'success',
        title: ehEdicao ? 'Formulário Atualizado!' : 'Formulário Criado!',
        text: ehEdicao ? 'As alterações foram salvas com sucesso.' : `Formulário cadastrado com sucesso. ID: ${objetoFormulario.id}`,
        confirmButtonColor: '#00f0ff',
        background: '#12151e',
        color: '#ffffff'
    });
}

/**
 * Prepara a interface para editar um formulário existente
 */
function editarFormulario(id) {
    const form = window.bancoFormularios.find(f => String(f.id) === String(id));
    if (!form) return;

    // Garante que o input hidden exista
    let idHidden = document.getElementById('formulario-id-edicao');
    if (!idHidden) {
        idHidden = document.createElement('input');
        idHidden.type = 'hidden';
        idHidden.id = 'formulario-id-edicao';
        document.getElementById('form-criar-formulario').appendChild(idHidden);
    }
    idHidden.value = form.id;

    document.getElementById('titulo-form').value = form.titulo || '';
    document.getElementById('descricao-form').value = form.descricao || '';
    document.getElementById('data-inicio').value = form.dataInicio || '';
    document.getElementById('data-fim').value = form.dataFim || '';
    document.getElementById('status-form').value = form.status || 'rascunho';

    renderizarSelecaoPerguntasBanco(form.perguntasIds || []);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Reseta o formulário de gestão ao estado original
 */
function cancelarEdicaoFormulario() {
    const idHidden = document.getElementById('formulario-id-edicao');
    if (idHidden) idHidden.value = '';

    const formCriar = document.getElementById('form-criar-formulario');
    if (formCriar) formCriar.reset();

    renderizarSelecaoPerguntasBanco();
}

/**
 * Renderiza os cards dos formulários cadastrados
 */
function renderizarListaFormularios() {
    const container = document.getElementById('lista-formularios');
    if (!container) return;

    if (!window.bancoFormularios || window.bancoFormularios.length === 0) {
        container.innerHTML = `
            <div class="alert alert-dark text-center text-muted border-secondary my-4 rounded-3 p-4">
                <i class="bi bi-folder-x fs-2 text-info d-block mb-2"></i>
                Nenhum formulário cadastrado até o momento.
            </div>
        `;
        return;
    }

    let html = '';
    window.bancoFormularios.forEach((form) => {
        let badgeClasse = 'bg-secondary';
        if (form.status === 'publicado') badgeClasse = 'bg-success';
        if (form.status === 'encerrado') badgeClasse = 'bg-danger';
        if (form.status === 'rascunho') badgeClasse = 'bg-warning text-dark';

        const qtdPerguntas = form.perguntasIds ? form.perguntasIds.length : 0;

        html += `
            <div class="card bg-dark text-white border-secondary mb-3 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h5 class="card-title text-info mb-1">${form.titulo}</h5>
                            <small class="text-muted">ID: <strong>${form.id}</strong></small>
                        </div>
                        <span class="badge ${badgeClasse} text-uppercase">${form.status}</span>
                    </div>

                    <p class="card-text text-light opacity-75 fs-6">${form.descricao || 'Sem descrição.'}</p>

                    <div class="d-flex flex-wrap gap-3 my-2 text-muted small">
                        <div><i class="bi bi-question-circle me-1"></i>${qtdPerguntas} pergunta(s)</div>
                        ${form.dataInicio ? `<div><i class="bi bi-calendar-event me-1"></i>Início: ${new Date(form.dataInicio).toLocaleString('pt-BR')}</div>` : ''}
                        ${form.dataFim ? `<div><i class="bi bi-calendar-x me-1"></i>Fim: ${new Date(form.dataFim).toLocaleString('pt-BR')}</div>` : ''}
                    </div>

                    <div class="d-flex justify-content-end gap-2 mt-3 pt-2 border-top border-secondary opacity-75">
                        <button type="button" class="btn btn-outline-warning btn-sm" onclick="editarFormulario('${form.id}')" title="Editar Formulário">
                            <i class="bi bi-pencil me-1"></i> Editar
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirFormulario('${form.id}')" title="Excluir Formulário">
                            <i class="bi bi-trash me-1"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Exclui um formulário verificando integridade de dados (respostas associadas)
 */
async function excluirFormulario(id) {
    const respostasLocais = window.bancoRespostas || [];
    const temResposta = respostasLocais.some(r => String(r.formularioId) === String(id));

    if (temResposta) {
        Swal.fire({
            icon: 'error',
            title: 'Exclusão Bloqueada',
            text: 'Este formulário já possui respostas enviadas e não pode ser excluído.',
            confirmButtonColor: '#ff2a6d',
            background: '#12151e',
            color: '#ffffff'
        });
        return;
    }

    const conf = await Swal.fire({
        title: 'Excluir Formulário?',
        text: "Esta ação removerá o formulário do sistema.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff2a6d',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        background: '#12151e',
        color: '#ffffff'
    });

    if (!conf.isConfirmed) return;

    try {
        await fetch(`${window.API_FORMULARIOS_URL}/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.warn("Exclusão realizada localmente.");
    }

    window.bancoFormularios = window.bancoFormularios.filter(f => String(f.id) !== String(id));
    localStorage.setItem('formularios', JSON.stringify(window.bancoFormularios));
    if (typeof salvarEstadoStorage === 'function') salvarEstadoStorage();

    renderizarListaFormularios();
    if (typeof window.carregarSelectFormularios === 'function') {
        window.carregarSelectFormularios();
    }

    Swal.fire({
        icon: 'success',
        title: 'Formulário Excluído!',
        timer: 1500,
        showConfirmButton: false,
        background: '#12151e',
        color: '#ffffff'
    });
}