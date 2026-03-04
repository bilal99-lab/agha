document.addEventListener('DOMContentLoaded', () => {

    // Check if user dismissed it in this session
    if (sessionStorage.getItem('stickyCtaDismissed')) {
        return;
    }

    // Determine message and button text based on page
    const path = window.location.pathname.toLowerCase();
    let message = "";
    let btnText = "";
    let isUmrah = false;

    if (path.includes('air-ticket.html')) {
        message = "Looking for the best fare?";
        btnText = "Get Instant Quote";
    } else if (path.includes('umrah.html')) {
        message = "Secure your Umrah package today.";
        btnText = "Explore Packages";
        isUmrah = true;
    } else {
        message = "Ready to plan your next journey?";
        btnText = "Request Custom Quote";
    }

    const html = `
    <div class="sticky-cta-bar" id="stickyCtaBar">
        <div class="container sticky-cta-container">
            <div class="sticky-cta-content">
                <span class="sticky-cta-text">${message}</span>
                <button class="btn ${isUmrah ? 'btn-gold' : 'btn-primary'} sticky-cta-btn" id="stickyTriggerBtn">
                    ${btnText} <i class="fas fa-arrow-right" style="margin-left: 6px;"></i>
                </button>
            </div>
            <button class="sticky-cta-close" id="closeStickyCta" aria-label="Close message">&times;</button>
        </div>
    </div>
    `;

    // Inject before whatsapp container if it exists, otherwise end of body
    const waContainer = document.querySelector('.whatsapp-float-container');
    if (waContainer) {
        waContainer.insertAdjacentHTML('beforebegin', html);
    } else {
        document.body.insertAdjacentHTML('beforeend', html);
    }

    const stickyBar = document.getElementById('stickyCtaBar');
    const closeBtn = document.getElementById('closeStickyCta');
    const triggerBtn = document.getElementById('stickyTriggerBtn');

    // Calculate document height to trigger at 40%
    let hasShown = false;

    const checkScroll = () => {
        if (hasShown) return;

        // Calculate percentage scrolled
        const scrollTop = window.scrollY;
        const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        const winHeight = window.innerHeight;
        const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;

        if (scrollPercent >= 40) {
            stickyBar.classList.add('show');
            hasShown = true;
            window.removeEventListener('scroll', checkScroll); // Optimization
        }
    };

    window.addEventListener('scroll', checkScroll);

    // Close logic
    closeBtn.addEventListener('click', () => {
        stickyBar.classList.remove('show');
        sessionStorage.setItem('stickyCtaDismissed', 'true');
    });

    // Interaction with the Global Modal
    // Simulate a click on an element that matches the trigger keywords 
    // evaluated in modal.js, or just use the global modal function if exposed.
    // Since modal.js listens to button text, this button's text is specifically formatted
    // to match modal keywords: 'get instant quote' (quote), 'explore packages', 'request custom quote'
    triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Disptach a synthetic event to let modal.js handle it naturally by matching text
        // Or if modal is just relying on text matches from a event delegation, we rely on the click
        // However, modal.js attaches listeners on DOMContentLoaded. Dynamic elements might be missed.

        // Fallback robust logic: since we know modal.js exists, and expects 'openModal(type)', we can 
        // dispatch a custom click event on a hidden dummy anchor that was present on load, or just rely
        // on the fact that we can call the function if it was global. Wait, modal.js functions are scoped.

        // Therefore, we must dispatch a click on an *existing* valid button to trigger the modal correctly.
        const existingTriggers = Array.from(document.querySelectorAll('a, button')).filter(el => {
            const txt = el.innerText.toLowerCase();
            return (txt.includes('quote') || txt.includes('package') || txt.includes('book')) && el.id !== 'stickyTriggerBtn';
        });

        if (existingTriggers.length > 0) {
            existingTriggers[0].click();
        }
    });

});
