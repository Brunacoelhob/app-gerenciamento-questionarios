'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { esc, idSeguro } = require('../js/utils');

const RAIZ = path.join(__dirname, '..');

test('esc neutraliza HTML, aspas e valores vazios', () => {
    assert.equal(esc('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.equal(esc(`it's & "q"`), 'it&#39;s &amp; &quot;q&quot;');
    assert.equal(esc(null), '');
    assert.equal(esc(undefined), '');
    assert.equal(esc(42), '42');
});

test('esc impede "sair" de um atributo value="..."', () => {
    const html = `<input value="${esc('" onfocus="alert(1)" x="')}">`;
    assert.ok(!/ onfocus=/.test(html.replace(/&quot;/g, '')) || html.includes('&quot; onfocus'), html);
    assert.ok(!html.includes('" onfocus="'));
});

test('idSeguro só aceita ids simples (o escape HTML não protege manipuladores inline)', () => {
    assert.equal(idSeguro('12'), '12');
    assert.equal(idSeguro('a1b2c3'), 'a1b2c3');
    assert.equal(idSeguro("1');alert(1);('"), '');
    assert.equal(idSeguro('<script>'), '');
    assert.equal(idSeguro(''), '');
    assert.equal(idSeguro(null), '');
    assert.equal(idSeguro('x'.repeat(65)), '');
});

// ---------------------------------------------------------------------------------------------
// Guarda: nenhuma interpolação de dado do usuário pode entrar em template HTML sem esc()/idSeguro().
// Se alguém adicionar `${p.enunciado}` novo, este teste falha.
// ---------------------------------------------------------------------------------------------
const SEGURAS = [
    /^esc\(/, /^idSeguro\(/, /^window\.API_/, /^API_/, /^new Date\(/,
    /^(isChecked|iconeTipo|badgeClasse|rotuloTipo|qtdPerguntas|oIdx|altBadges|htmlInputs|valorFormatado|html|dataFormatada|url|formularioId|idAba)$/,
    /^(idx|index) \+ 1$/, /^form\.data(Inicio|Fim) \?/, /^respostas\.length$/, /^p\.alternativas\.map/, /^item\.perguntaId$/, /^objetoFormulario\.id$/, /^ehEdicao/, /^encodeURIComponent\(/, /^window\.API_[A-Z_]+URL\}\/\$/,
];

test('todo ${...} com dado em template HTML dos módulos passa por esc()/idSeguro()', () => {
    const problemas = [];
    for (const nome of ['banco-perguntas.js', 'formularios.js', 'listar-respostas.js', 'respostas.js']) {
        const linhas = fs.readFileSync(path.join(RAIZ, 'js', nome), 'utf8').split('\n');
        linhas.forEach((linha, i) => {
            if (/fetch\(|console\.|querySelector|text:|textContent|\.url\b/.test(linha)) return; // URLs, seletores e texto puro
            for (const m of linha.matchAll(/\$\{([^}]*)\}/g)) {
                const expr = m[1].trim();
                if (!SEGURAS.some((r) => r.test(expr))) problemas.push(`${nome}:${i + 1}  \${${expr}}`);
            }
        });
    }
    assert.deepEqual(problemas, [], `interpolações sem escape:\n${problemas.join('\n')}`);
});

test('os módulos carregam utils.js e config.js antes dos demais; sem script inline; CDNs com versão fixa', () => {
    const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
    const ordem = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
    const pos = (nome) => ordem.findIndex((s) => s.endsWith(nome));
    for (const modulo of ['banco-perguntas.js', 'formularios.js', 'respostas.js', 'listar-respostas.js', 'app.js']) {
        assert.ok(pos('utils.js') >= 0 && pos('utils.js') < pos(modulo), `utils.js deve vir antes de ${modulo}`);
        assert.ok(pos('config.js') >= 0 && pos('config.js') < pos(modulo), `config.js deve vir antes de ${modulo}`);
    }
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), 'script inline encontrado');
    assert.ok(!html.includes('@latest'), 'CDN com @latest');
    assert.ok(!/sweetalert2@11"/.test(html), 'sweetalert2 sem versão exata');
});

test('a URL da API não está mais espalhada pelo código', () => {
    for (const nome of fs.readdirSync(path.join(RAIZ, 'js'))) {
        if (nome === 'config.js') continue;
        assert.ok(!fs.readFileSync(path.join(RAIZ, 'js', nome), 'utf8').includes('localhost:3000'), nome);
    }
});

test('seed: perguntas, formulários e respostas coerentes (referências existem)', () => {
    const seed = JSON.parse(fs.readFileSync(path.join(RAIZ, 'db.seed.json'), 'utf8'));
    const idsPerguntas = new Set((seed.perguntas || []).map((p) => String(p.id)));
    assert.ok(idsPerguntas.size > 0);
    for (const f of seed.formularios || []) {
        for (const pid of f.perguntas || f.perguntasIds || []) assert.ok(idsPerguntas.has(String(pid)), `formulário ${f.id} referencia pergunta inexistente ${pid}`);
    }
    for (const r of seed.respostas || []) {
        assert.ok((seed.formularios || []).some((f) => String(f.id) === String(r.formularioId)), `resposta ${r.id} órfã`);
    }
});
