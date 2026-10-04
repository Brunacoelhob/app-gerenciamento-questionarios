/**
 * Utilidades de segurança usadas por todos os módulos.
 *
 * Funciona no navegador (script comum, funções globais) e em Node (testes).
 */
(function (raiz) {
    'use strict';

    /**
     * Escapa texto para inserção segura em HTML (conteúdo e atributos entre aspas).
     * Use em TODO dado vindo do usuário ou da API que entre em um template de innerHTML:
     * uma pergunta chamada "<img src=x onerror=alert(1)>" aparece como texto e não executa.
     */
    function esc(valor) {
        return String(valor === null || valor === undefined ? '' : valor).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /**
     * Valida um id antes de colocá-lo em um manipulador inline (onclick="excluir('ID')").
     * Dentro de um atributo, o navegador desfaz o escape HTML antes de executar o JavaScript, então
     * escapar não basta: aceitamos apenas letras, números, "_" e "-". Qualquer outra coisa vira texto vazio.
     */
    function idSeguro(id) {
        var texto = String(id === null || id === undefined ? '' : id);
        return /^[A-Za-z0-9_-]{1,64}$/.test(texto) ? texto : '';
    }

    var api = { esc: esc, idSeguro: idSeguro };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        raiz.esc = esc;
        raiz.idSeguro = idSeguro;
    }
})(typeof window !== 'undefined' ? window : globalThis);
