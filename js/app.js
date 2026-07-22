/* ==========================================================================
   APLICAÇÃO PRINCIPAL & NAVEGAÇÃO SPA
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initVantaEffect()
    initNavegacaoAbas()

    // Inicializa os módulos específicos
    if (typeof initBancoPerguntas === 'function') initBancoPerguntas()
    if (typeof initFormularios === 'function') initFormularios()
    if (typeof initRespostas === 'function') initRespostas()
})

/**
 * Inicializa o fundo 3D animado com Vanta.js (Net)
 */
function initVantaEffect() {
    if (window.VANTA) {
        VANTA.NET({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x6366f1,
            backgroundColor: 0x0f172a,
            points: 10.00,
            maxDistance: 22.00,
            spacing: 16.00
        })
    }
}

/**
 * Controla a exibição dinâmica das abas (Single Page Application)
 */
function initNavegacaoAbas() {
    const navLinks = document.querySelectorAll('.nav-link[data-aba]')
    const secoes = document.querySelectorAll('.secao-aba')

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault()
            const abaAlvo = link.getAttribute('data-aba')

            // Atualiza os botões ativos do menu
            navLinks.forEach(l => l.classList.remove('active'))
            link.classList.add('active')

            // Exibe a seção correspondente
            secoes.forEach(secao => {
                if (secao.id === `aba-${abaAlvo}`) {
                    secao.classList.remove('d-none')
                    secao.classList.add('animate__animated', 'animate__fadeIn')
                } else {
                    secao.classList.add('d-none')
                }
            })
        })
    })
}