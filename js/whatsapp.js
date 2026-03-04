document.addEventListener('DOMContentLoaded', () => {

    // Phone Number Config
    const whatsappNumber = "923058107136"; // Format without '+' or '00'

    const containerHTML = `
    <div class="whatsapp-float-container">
        <div class="whatsapp-prompt" id="waPrompt">
            <span>Need assistance? Chat with us on WhatsApp.</span>
            <button class="whatsapp-prompt-close" id="closeWaPrompt" aria-label="Close prompt">&times;</button>
        </div>
        <a href="#" class="whatsapp-btn" id="waBtn" target="_blank" aria-label="Chat on WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </a>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', containerHTML);

    const waBtn = document.getElementById('waBtn');
    const waPrompt = document.getElementById('waPrompt');
    const closePromptBtn = document.getElementById('closeWaPrompt');

    // --- Smart Pre-fill Logic ---
    function getPreFillMessage() {
        const path = window.location.pathname.toLowerCase();

        if (path.includes('air-ticket.html')) {
            return "Hello Agha Air Travel, I would like to inquire about flight booking.";
        } else if (path.includes('umrah.html')) {
            return "Hello Agha Air Travel, I would like details about Umrah packages.";
        } else {
            return "Hello, I need travel assistance.";
        }
    }

    // Set Dynamic Href
    const encodedMessage = encodeURIComponent(getPreFillMessage());
    waBtn.href = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // --- Elegant Prompt Bubble Logic ---
    let promptTimeout;

    // Check session storage so it only shows once per user session
    if (!sessionStorage.getItem('waPromptShown')) {
        promptTimeout = setTimeout(() => {
            waPrompt.classList.add('show');
            sessionStorage.setItem('waPromptShown', 'true');

            // Auto hide after 8 seconds if ignored
            setTimeout(() => {
                waPrompt.classList.remove('show');
            }, 8000);

        }, 6000); // 6 seconds delay after page load
    }

    // Close Button Event
    closePromptBtn.addEventListener('click', () => {
        waPrompt.classList.remove('show');
        clearTimeout(promptTimeout);
    });

});
