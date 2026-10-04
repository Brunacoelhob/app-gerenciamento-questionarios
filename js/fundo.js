// Fundo animado (Vanta.js). Se a biblioteca não carregar (offline), a página funciona normalmente sem ele.
document.addEventListener('DOMContentLoaded', () => {
    if (typeof VANTA === 'undefined') return;
    VANTA.NET({
        el: '#vanta-bg',
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x00f0ff,
        backgroundColor: 0x0a0f1d,
        points: 10.0,
        maxDistance: 22.0,
        spacing: 18.0,
    });
});
