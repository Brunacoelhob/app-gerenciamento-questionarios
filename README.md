# Sistema de Gestão e Aplicação de Questionários

[![CI](https://github.com/Brunacoelhob/app-gerenciamento-questionarios/actions/workflows/ci.yml/badge.svg)](https://github.com/Brunacoelhob/app-gerenciamento-questionarios/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-blue)

Aplicação web para criar um **banco de perguntas reutilizáveis**, montar **formulários** com status e período de vigência e **coletar respostas**, com validações por tipo de pergunta e bloqueio de resposta duplicada por e-mail. Front-end em JavaScript puro (Bootstrap 5, SweetAlert2) e API simulada com `json-server`.

## Funcionalidades

- **Banco de perguntas**: texto curto, texto longo, múltipla escolha (2 a 10 alternativas) e checkbox (3 a 15)
- **Formulários**: título, descrição, status (rascunho/publicado), período de vigência e seleção de perguntas
- **Responder**: apenas formulários publicados e dentro do período; uma resposta por e-mail
- **Respostas**: listagem por formulário, detalhamento e exclusão
- Não permite excluir perguntas já respondidas

## Como executar

Requer Node.js 20+.

```bash
npm install
npm start      # API em http://localhost:3000 · aplicação em http://localhost:8080
```

O banco editável é `db.json`, criado automaticamente a partir de [`db.seed.json`](db.seed.json) (o arquivo versionado nunca é alterado). Para voltar aos dados iniciais, apague `db.json` e rode `npm start` de novo. Para usar outra API, defina `window.API_BASE` antes dos scripts (veja `js/config.js`).

## Segurança: vulnerabilidade corrigida (XSS armazenado)

A versão original montava a tela com `innerHTML` usando textos digitados pelos usuários. Quem cadastrasse uma pergunta, alternativa, título de formulário ou **nome/e-mail ao responder** com HTML (ex.: `<img src=x onerror=...>`) executava código no navegador do **administrador** ao abrir as listas.

Teste de comprovação em Chrome real, com a mesma carga maliciosa injetada pela API:

| Versão | Scripts executados ao navegar pelas 4 abas |
|---|---|
| original | **20** (pergunta, alternativa, formulário e respondente) |
| corrigida | **0**: o texto aparece literalmente na tela |

Correções: função `esc()` em toda interpolação de dado; `idSeguro()` nos ids usados dentro de `onclick` (o escape HTML não protege contexto de JavaScript); `encodeURIComponent` nos ids de URL. Um **teste de guarda** (`npm test`) falha se alguém adicionar uma interpolação de dado sem `esc()`.

## Outras melhorias

| Antes | Agora |
|---|---|
| Sem `package.json` (o README mandava "instalar o json-server" sem versão) | Dependências e scripts (`npm start`) |
| Banco de dados versionado e editado pelo uso | Seed separado do `db.json` local |
| E-mails reais de colegas no banco de exemplo | Dados de exemplo anonimizados e uma resposta órfã removida |
| URL da API repetida em 5 arquivos | `js/config.js` |
| CDNs com `@latest` / versão solta; script inline | Versões fixas; fundo animado em arquivo próprio |
| Sem testes e sem CI | 7 testes (segurança, ordem de scripts, consistência do seed) e CI |

## Testes

```bash
npm test
```

## Estrutura

```
index.html                  aplicação de página única (abas)
js/config.js · utils.js     configuração e funções de segurança (esc, idSeguro)
js/banco-perguntas.js · formularios.js · respostas.js · listar-respostas.js · app.js
css/                        estilos (design system "Tech Clean")
db.seed.json                dados de exemplo
test/                       testes
```

## Limitações

- A API é simulada (`json-server`): sem autenticação nem validação no servidor. As regras de negócio vivem no navegador e **não substituem** um back-end real.

## Licença

[MIT](LICENSE)
