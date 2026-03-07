// Agha Air Travel — Shared Futuristic Scripts
// Particle Grid + Nav + Scroll Reveal

// ---- Particle Grid ----
(function () {
    const c = document.getElementById('particleCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H, particles = [];

    function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    class P {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.s = Math.random() * 1.5 + 0.3;
            this.vy = Math.random() * 0.3 + 0.05;
            this.o = Math.random() * 0.5 + 0.1;
        }
        update() { this.y -= this.vy; if (this.y < -5) { this.y = H + 5; this.x = Math.random() * W; } }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2); ctx.fillStyle = `rgba(0,229,255,${this.o})`; ctx.fill(); }
    }

    for (let i = 0; i < 100; i++) particles.push(new P());

    (function loop() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 110) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(0,229,255,${0.04 * (1 - d / 110)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
            }
        }
        requestAnimationFrame(loop);
    })();
})();

// ---- Nav Scroll ----
window.addEventListener('scroll', () => { document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 60); });

// ---- Mobile Toggle ----
document.getElementById('navToggle')?.addEventListener('click', () => {
    const l = document.getElementById('navLinks');
    l.style.display = l.style.display === 'flex' ? 'none' : 'flex';
});

// ---- Scroll Reveal ----
const ro = new IntersectionObserver(e => e.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
