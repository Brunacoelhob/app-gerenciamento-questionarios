/* ==========================================================================
   MÓDULO: RESPOSTAS DOS USUÁRIOS
   ========================================================================== */

const bancoRespostas = [];

/**
 * Inicializa os formulários e validações de resposta
 */
function initRespostas() {
    const formResposta = document.getElementById('form-submeter-resposta');
    if (formResposta) {
        formResposta.addEventListener('submit', processarResposta);
    }
}

/**
 * Processa a submissão de respostas garantindo e-mail único por questionário
 */
function processarResposta(event) {
    event.preventDefault();

    const idFormulario = document.getElementById('resposta-id-formulario').value;
    const emailUsuario = document.getElementById('resposta-email').value.trim().toLowerCase();

    // Regra de Negócio: Um usuário só pode responder cada questionário uma única vez
    const jaRespondeu = bancoRespostas.some(
        r => r.idFormulario === idFormulario && r.emailUsuario === emailUsuario
    );

    if (jaRespondeu) {
        Swal.fire({
            icon: 'error',
            title: 'Resposta já enviada',
            text: 'Este e-mail já respondeu a este questionário.',
            confirmColor: '#6366f1'
        });
        return;
    }

    // Registra a resposta
    const novaResposta = {
        id: Date.now(),
        idFormulario,
        emailUsuario,
        dataEnvio: new Date().toLocaleString()
    };

    bancoRespostas.push(novaResposta);

    Swal.fire({
        icon: 'success',
        title: 'Obrigado!',
        text: 'Sua resposta foi gravada com sucesso.',
        timer: 2000,
        showConfirmButton: false
    });

    document.getElementById('form-submeter-resposta').reset();
}