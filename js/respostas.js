/* ==========================================================================
   MÓDULO: RESPONDER FORMULÁRIO (respostas.js)
   Design System: Tech Clean
   ========================================================================== */

// Prevenção contra erros de redeclaração no console usando o escopo global window
window.API_FORMULARIOS_URL = window.API_FORMULARIOS_URL || 'http://localhost:3000/formularios';
window.API_RESPOSTAS_URL = window.API_RESPOSTAS_URL || 'http://localhost:3000/respostas';
window.API_PERGUNTAS_URL = window.API_PERGUNTAS_URL || 'http://localhost:3000/perguntas';

let formularioAtualParaResponder = null;

/**
 * Função Utilitária: Gera o próximo ID numérico sequencial (1, 2, 3...)
 */
function gerarProximoIdRespostas(lista) {
    if (!lista || lista.length === 0) return "1";
    const idsNumericos = lista
        .map(item => parseInt(item.id, 10))
        .filter(num => !isNaN(num));

    if (idsNumericos.length === 0) return "1";
    const maiorId = Math.max(...idsNumericos);
    return String(maiorId + 1);
}

/**
 * Inicializa os ouvintes de evento e popula a lista de formulários
 */
async function initRespostas() {
    const btnCarregar = document.getElementById('btn-carregar-formulario');
    const formSubmeter = document.getElementById('form-submeter-resposta');
    const selectFormularios = document.getElementById('resposta-id-formulario');

    // Popula o select ao inicializar a tela
    await carregarSelectFormularios();

    if (btnCarregar) {
        btnCarregar.onclick = carregarFormularioParaResposta;
    }

    if (selectFormularios) {
        // Dispara o carregamento do questionário automaticamente ao mudar a seleção
        selectFormularios.onchange = carregarFormularioParaResposta;

        // Atualiza as opções sempre que o usuário clica no select para garantir dados novos
        selectFormularios.onfocus = carregarSelectFormularios;
    }

    if (formSubmeter) {
        formSubmeter.removeEventListener('submit', enviarRespostaFormulario);
        formSubmeter.addEventListener('submit', enviarRespostaFormulario);
    }
}

/**
 * Busca os formulários cadastrados e popula o Select formatado como "[ID: X] Título"
 */
async function carregarSelectFormularios() {
    const select = document.getElementById('resposta-id-formulario');
    if (!select) return;

    try {
        let listaFormularios = window.bancoFormularios || JSON.parse(localStorage.getItem('formularios') || '[]');

        // Tenta buscar atualizações direto da API REST
        try {
            const res = await fetch(window.API_FORMULARIOS_URL);
            if (res.ok) {
                const dados = await res.json();
                listaFormularios = dados;
                window.bancoFormularios = dados;
            }
        } catch (e) {
            console.warn("API offline. Carregando formulários do armazenamento local.");
        }

        const apenasPublicados = listaFormularios || [];

        // Guarda a seleção atual para evitar reset acidental
        const valorSelecionadoAnterior = select.value;

        select.innerHTML = '<option value="">-- Selecione um Formulário --</option>';

        if (apenasPublicados.length === 0) {
            select.innerHTML = '<option value="">Nenhum formulário publicado disponível</option>';
            return;
        }

        // Popula as opções formatadas: [ID: 1] - Nome do Formulário
        apenasPublicados.forEach(f => {
            const option = document.createElement('option');
            option.value = String(f.id);
            option.textContent = `[ID: ${f.id}] - ${f.titulo}`;
            select.appendChild(option);
        });

        // Restaura a seleção se o formulário ainda existir no dropdown
        if (valorSelecionadoAnterior) {
            select.value = valorSelecionadoAnterior;
        }

    } catch (err) {
        console.error("Erro ao carregar o select de formulários:", err);
    }
}

/**
 * Busca e valida o formulário pelo ID selecionado no Dropdown
 */
async function carregarFormularioParaResposta() {
    const idInput = document.getElementById('resposta-id-formulario');
    const container = document.getElementById('container-perguntas-formulario');
    if (!idInput || !container) return;

    const id = idInput.value.trim();
    if (!id) {
        container.innerHTML = '';
        formularioAtualParaResponder = null;
        return;
    }

    try {
        let form = null;
        let todasPerguntas = window.bancoPerguntas || JSON.parse(localStorage.getItem('perguntas') || '[]');

        // 1. Busca na memória/localStorage
        const formulariosLocais = window.bancoFormularios || JSON.parse(localStorage.getItem('formularios') || '[]');
        if (formulariosLocais && formulariosLocais.length > 0) {
            form = formulariosLocais.find(f => String(f.id) === String(id));
        }

        // 2. Se não achar localmente, consulta na API REST
        if (!form) {
            try {
                const res = await fetch(`${window.API_FORMULARIOS_URL}/${id}`);
                if (res.ok) form = await res.json();
            } catch (e) {
                console.warn("API offline. Buscando dados locais.");
            }
        }

        if (!form) {
            Swal.fire({
                icon: 'error',
                title: 'Não encontrado',
                text: 'Formulário não localizado.',
                confirmButtonColor: '#ff2a6d',
                background: '#12151e',
                color: '#ffffff'
            });
            return;
        }

        // Validação de Status
        if (form.status !== 'publicado') {
            Swal.fire({
                icon: 'warning',
                title: 'Indisponível',
                text: 'Este formulário não está aberto para receber respostas.',
                confirmButtonColor: '#ff2a6d',
                background: '#12151e',
                color: '#ffffff'
            });
            return;
        }

        // Validação de Período Vigente
        const agora = new Date();
        if (form.dataInicio && new Date(form.dataInicio) > agora) {
            Swal.fire({
                icon: 'info',
                title: 'Aguarde',
                text: 'O período de respostas para este formulário ainda não iniciou.',
                confirmButtonColor: '#00f0ff',
                background: '#12151e',
                color: '#ffffff'
            });
            return;
        }

        if (form.dataFim && new Date(form.dataFim) < agora) {
            Swal.fire({
                icon: 'error',
                title: 'Encerrado',
                text: 'O prazo de resposta para este formulário já expirou.',
                confirmButtonColor: '#ff2a6d',
                background: '#12151e',
                color: '#ffffff'
            });
            return;
        }

        // Busca a lista completa de perguntas se ainda não estiver carregada
        if (todasPerguntas.length === 0) {
            try {
                const resP = await fetch(window.API_PERGUNTAS_URL);
                if (resP.ok) todasPerguntas = await resP.json();
            } catch (e) { }
        }

        // Mapeia os IDs vinculados (perguntasIds) aos objetos de pergunta correspondentes
        const idsVinc = form.perguntasIds || (form.perguntas ? form.perguntas.map(p => p.perguntaId) : []);
        const perguntasResolvidas = idsVinc
            .map(pId => todasPerguntas.find(p => String(p.id) === String(pId)))
            .filter(Boolean);

        formularioAtualParaResponder = { ...form, perguntasObjetos: perguntasResolvidas };

        renderizarCamposQuestionario(formularioAtualParaResponder, container);

    } catch (error) {
        console.error("Erro ao carregar formulário:", error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar as perguntas do formulário.',
            confirmButtonColor: '#ff2a6d',
            background: '#12151e',
            color: '#ffffff'
        });
    }
}

/**
 * Renderiza dinamicamente as perguntas no HTML
 */
function renderizarCamposQuestionario(formulario, container) {
    let html = `
        <div class="card p-4 mb-4 text-white border-secondary bg-dark rounded shadow-sm">
            <h3 class="h4 text-info fw-bold mb-2">${formulario.titulo}</h3>
            <p class="text-muted small mb-0">${formulario.descricao || 'Sem descrição cadastrada.'}</p>
        </div>
    `;

    const perguntas = formulario.perguntasObjetos || [];
    if (perguntas.length === 0) {
        container.innerHTML = html + `<p class="text-muted text-center py-3">Este formulário não possui perguntas vinculadas no momento.</p>`;
        return;
    }

    perguntas.forEach((p, idx) => {
        let htmlInputs = '';
        const opcoes = p.alternativas || p.opcoes || [];

        if (p.tipo === 'texto_curto' || p.tipo === 'texto') {
            htmlInputs = `<input type="text" class="form-control bg-dark text-white border-secondary input-resposta" name="p_${p.id}" maxlength="200" required placeholder="Digite sua resposta (máx. 200 caracteres)...">`;
        } else if (p.tipo === 'texto_longo') {
            htmlInputs = `
                <textarea class="form-control bg-dark text-white border-secondary input-resposta" name="p_${p.id}" rows="4" maxlength="500" required placeholder="Sua resposta detalhada (máx. 500 caracteres)..." oninput="atualizarContadorChar(this, 'cnt_${p.id}')"></textarea>
                <div class="text-end text-muted small mt-1"><span id="cnt_${p.id}">0</span>/500 caracteres</div>
            `;
        } else if (p.tipo === 'multipla_escolha') {
            htmlInputs = opcoes.map((op, oIdx) => `
                <div class="form-check my-2 p-2 rounded option-hover border border-secondary bg-dark">
                    <input class="form-check-input ms-1 me-2 cursor-pointer" type="radio" name="p_${p.id}" id="p_${p.id}_${oIdx}" value="${op}" required style="transform: scale(1.2);">
                    <label class="form-check-label text-white cursor-pointer w-100 ps-1 fw-medium" for="p_${p.id}_${oIdx}">
                        <i class="bi bi-circle me-1 text-info"></i> ${op}
                    </label>
                </div>
            `).join('');
        } else if (p.tipo === 'checkbox') {
            htmlInputs = opcoes.map((op, oIdx) => `
                <div class="form-check my-2 p-2 rounded option-hover border border-secondary bg-dark">
                    <input class="form-check-input check-p-${p.id} ms-1 me-2 cursor-pointer" type="checkbox" value="${op}" id="p_${p.id}_${oIdx}" style="transform: scale(1.2);">
                    <label class="form-check-label text-white cursor-pointer w-100 ps-1 fw-medium" for="p_${p.id}_${oIdx}">
                        <i class="bi bi-square me-1 text-info"></i> ${op}
                    </label>
                </div>
            `).join('');
        }

        html += `
            <div class="card p-3 mb-3 text-white border-secondary bg-dark rounded shadow-sm">
                <label class="form-label fw-bold mb-3 text-white fs-6">
                    <span class="text-info">${idx + 1}.</span> ${p.enunciado} <span class="text-danger">*</span>
                </label>
                <div>${htmlInputs}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Atualiza o contador de caracteres digitados
 */
function atualizarContadorChar(el, idContador) {
    const contador = document.getElementById(idContador);
    if (contador) {
        contador.textContent = el.value.length;
    }
}

/**
 * Coleta os campos, valida duplicidade e salva a submissão gerando ID incremental
 */
async function enviarRespostaFormulario(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (!formularioAtualParaResponder) {
        Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Selecione e carregue um formulário válido primeiro!',
            confirmButtonColor: '#00f0ff',
            background: '#12151e',
            color: '#ffffff'
        });
        return false;
    }

    const inputNome = document.getElementById('resposta-nome');
    const inputEmail = document.getElementById('resposta-email');

    const nome = inputNome ? inputNome.value.trim() : '';
    const email = inputEmail ? inputEmail.value.trim() : '';

    if (nome.length < 2) {
        Swal.fire({
            icon: 'warning',
            title: 'Nome Inválido',
            text: 'O nome deve ter no mínimo 2 caracteres.',
            confirmButtonColor: '#00f0ff',
            background: '#12151e',
            color: '#ffffff'
        });
        return false;
    }

    // Coleta as respostas de cada pergunta do formulário
    const respostasMontadas = [];
    const perguntas = formularioAtualParaResponder.perguntasObjetos || [];

    for (const p of perguntas) {
        let valor = null;

        if (p.tipo === 'texto_curto' || p.tipo === 'texto' || p.tipo === 'texto_longo') {
            const el = document.querySelector(`[name="p_${p.id}"]`);
            valor = el ? el.value.trim() : '';
        } else if (p.tipo === 'multipla_escolha') {
            const el = document.querySelector(`[name="p_${p.id}"]:checked`);
            valor = el ? el.value : '';
        } else if (p.tipo === 'checkbox') {
            const els = document.querySelectorAll(`.check-p-${p.id}:checked`);
            valor = Array.from(els).map(c => c.value);

            if (valor.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Atenção',
                    text: `Selecione ao menos uma opção para a pergunta "${p.enunciado}".`,
                    confirmButtonColor: '#00f0ff',
                    background: '#12151e',
                    color: '#ffffff'
                });
                return false;
            }
        }

        respostasMontadas.push({ perguntaId: String(p.id), valor });
    }

    // Validação de Duplicidade (1 resposta por e-mail por formulário)
    try {
        let jaRespondeu = false;
        let respostasLocais = window.bancoRespostas || JSON.parse(localStorage.getItem('respostas') || '[]');

        // 1. Checagem Local
        jaRespondeu = respostasLocais.some(r =>
            String(r.formularioId) === String(formularioAtualParaResponder.id) &&
            r.email && r.email.toLowerCase() === email.toLowerCase()
        );

        // 2. Checagem via API REST
        if (!jaRespondeu && email) {
            try {
                const resExist = await fetch(`${window.API_RESPOSTAS_URL}?formularioId=${formularioAtualParaResponder.id}&email=${encodeURIComponent(email)}`);
                if (resExist.ok) {
                    const dados = await resExist.json();
                    if (dados.length > 0) jaRespondeu = true;
                }
            } catch (e) { }
        }

        if (jaRespondeu) {
            Swal.fire({
                icon: 'error',
                title: 'Resposta Já Registrada',
                text: 'Este endereço de e-mail já enviou uma resposta para este formulário.',
                confirmButtonColor: '#ff2a6d',
                background: '#12151e',
                color: '#ffffff'
            });
            return false;
        }

        // Tenta obter a lista mais recente do servidor para calcular com precisão o novo ID
        try {
            const resG = await fetch(window.API_RESPOSTAS_URL);
            if (resG.ok) respostasLocais = await resG.json();
        } catch (e) { }

        // Gera o ID Sequencial (1, 2, 3...)
        const novoId = gerarProximoIdRespostas(respostasLocais);

        // Objeto Padronizado para Envio
        const novaSubmissao = {
            id: novoId,
            formularioId: String(formularioAtualParaResponder.id),
            nome,
            email,
            enviadoEm: new Date().toISOString(),
            respostas: respostasMontadas
        };

        // Envia para a API REST (se disponível)
        try {
            await fetch(window.API_RESPOSTAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaSubmissao)
            });
        } catch (apiErr) {
            console.warn("API indisponível. Salvando apenas no navegador.");
        }

        // Atualiza a memória local e garante salvamento no LocalStorage
        if (!window.bancoRespostas) window.bancoRespostas = [];
        window.bancoRespostas.push(novaSubmissao);

        localStorage.setItem('respostas', JSON.stringify(window.bancoRespostas));

        if (typeof window.salvarEstadoStorage === 'function') {
            window.salvarEstadoStorage();
        }

        // Exibe o alerta de Sucesso que permanece na tela
        Swal.fire({
            icon: 'success',
            title: 'Resposta Enviada!',
            text: 'Suas respostas foram salvas com sucesso. Obrigado!',
            confirmButtonColor: '#00f0ff',
            background: '#12151e',
            color: '#ffffff'
        }).then(() => {
            // Limpa os campos após o usuário fechar o alerta
            const formObj = document.getElementById('form-submeter-resposta');
            if (formObj) formObj.reset();

            const containerPerguntas = document.getElementById('container-perguntas-formulario');
            if (containerPerguntas) containerPerguntas.innerHTML = '';

            const selectForm = document.getElementById('resposta-id-formulario');
            if (selectForm) selectForm.value = '';

            formularioAtualParaResponder = null;
        });

    } catch (err) {
        console.error("Erro ao enviar submissão:", err);
        Swal.fire({
            icon: 'error',
            title: 'Erro de Envio',
            text: 'Ocorreu uma falha ao salvar sua resposta.',
            confirmButtonColor: '#ff2a6d',
            background: '#12151e',
            color: '#ffffff'
        });
    }

    return false;
}

// Expõe funções ao objeto global Window
window.initRespostas = initRespostas;
window.carregarSelectFormularios = carregarSelectFormularios;
window.carregarFormularioParaResposta = carregarFormularioParaResposta;
window.enviarRespostaFormulario = enviarRespostaFormulario;
window.atualizarContadorChar = atualizarContadorChar;

// Inicialização Automática ao carregar o DOM ou de imediato se já carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRespostas);
} else {
    initRespostas();
}