/* ==========================================================================
   MÓDULO CENTRAL: APP.JS (ORQUESTRADOR DA APLICAÇÃO SPA)
   Design System: Tech Clean
   ========================================================================== */

// 1. ESTADOS GLOBAIS DA APLICAÇÃO
window.bancoPerguntas = window.bancoPerguntas || [];
window.bancoFormularios = window.bancoFormularios || [];
window.bancoRespostas = window.bancoRespostas || [];

// Chaves padronizadas para persistência no LocalStorage
const STORAGE_KEYS = {
    PERGUNTAS: 'app_banco_perguntas',
    FORMULARIOS: 'app_banco_formularios',
    RESPOSTAS: 'app_banco_respostas'
};

/**
 * Inicialização principal do sistema após o carregamento completo do DOM
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Recarrega backup do LocalStorage para a memória global
    carregarEstadoStorage();

    // 2. Configura os ouvintes dos botões/links de navegação da SPA
    configurarNavegacaoAbas();

    // 3. Inicializa os módulos e carrega os dados iniciais
    await inicializarTodosModulos();

    // 4. Exibe a aba ativa ou a padrão caso nenhuma esteja visível
    const abaAtivaAtual = document.querySelector('.secao-aba:not(.d-none)');
    if (!abaAtivaAtual) {
        alternarAba('aba-banco-perguntas');
    } else {
        executarAcoesDaAba(abaAtivaAtual.id);
    }
});

/**
 * Carrega os dados salvos no LocalStorage para os arrays globais
 */
function carregarEstadoStorage() {
    try {
        const pSalvas = localStorage.getItem(STORAGE_KEYS.PERGUNTAS);
        const fSalvos = localStorage.getItem(STORAGE_KEYS.FORMULARIOS);
        const rSalvas = localStorage.getItem(STORAGE_KEYS.RESPOSTAS);

        if (pSalvas) window.bancoPerguntas = JSON.parse(pSalvas);
        if (fSalvos) window.bancoFormularios = JSON.parse(fSalvos);
        if (rSalvas) window.bancoRespostas = JSON.parse(rSalvas);
    } catch (e) {
        console.error("Erro ao carregar dados do LocalStorage:", e);
    }
}

/**
 * Salva o estado atual das variáveis globais no LocalStorage (utilizado como Fallback)
 */
function salvarEstadoStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.PERGUNTAS, JSON.stringify(window.bancoPerguntas));
        localStorage.setItem(STORAGE_KEYS.FORMULARIOS, JSON.stringify(window.bancoFormularios));
        localStorage.setItem(STORAGE_KEYS.RESPOSTAS, JSON.stringify(window.bancoRespostas));
    } catch (e) {
        console.error("Erro ao salvar dados no LocalStorage:", e);
    }
}

/**
 * Configura o comportamento dos botões da barra de navegação/menu
 */
function configurarNavegacaoAbas() {
    const navLinks = document.querySelectorAll('[data-aba]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetAbaId = link.getAttribute('data-aba');
            if (targetAbaId) {
                alternarAba(targetAbaId);
            }
        });
    });
}

/**
 * Alterna visibilidade entre as seções/abas da SPA e dispara atualizações de dados
 */
function alternarAba(idAba) {
    // Esconde todas as seções de abas
    const secoes = document.querySelectorAll('.secao-aba');
    secoes.forEach(secao => secao.classList.add('d-none'));

    // Remove a classe 'active' de todos os links de navegação
    const navLinks = document.querySelectorAll('[data-aba]');
    navLinks.forEach(link => link.classList.remove('active'));

    // Exibe a aba solicitada
    const abaAlvo = document.getElementById(idAba);
    if (abaAlvo) {
        abaAlvo.classList.remove('d-none');
    }

    // Marca o botão da nav correspondente como ativo
    const linkAtivo = document.querySelector(`[data-aba="${idAba}"]`);
    if (linkAtivo) {
        linkAtivo.classList.add('active');
    }

    // Dispara atualizações específicas dependendo da aba acessada
    executarAcoesDaAba(idAba);
}

/**
 * Atualiza os dados do DOM conforme a aba selecionada pelo usuário
 */
function executarAcoesDaAba(idAba) {
    switch (idAba) {
        case 'aba-banco-perguntas':
            if (typeof renderizarListaPerguntas === 'function') {
                renderizarListaPerguntas();
            }
            break;

        case 'aba-formularios':
            if (typeof renderizarSelecaoPerguntasBanco === 'function') {
                renderizarSelecaoPerguntasBanco();
            }
            if (typeof renderizarListaFormularios === 'function') {
                renderizarListaFormularios();
            }
            break;

        case 'aba-respostas':
            if (typeof carregarSelectFormularios === 'function') {
                carregarSelectFormularios();
            }
            break;

        case 'aba-listar-respostas':
            if (typeof carregarSelectFormulariosFiltro === 'function') {
                carregarSelectFormulariosFiltro();
            }
            if (typeof carregarRespostasAPI === 'function') {
                carregarRespostasAPI();
            }
            break;

        default:
            break;
    }
}

/**
 * Chama as funções de inicialização de cada módulo (se estiverem carregadas no escopo)
 */
async function inicializarTodosModulos() {
    if (typeof initBancoPerguntas === 'function') await initBancoPerguntas();
    if (typeof initFormularios === 'function') await initFormularios();
    if (typeof initRespostas === 'function') await initRespostas();
    if (typeof initListarRespostas === 'function') await initListarRespostas();
}