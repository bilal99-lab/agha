document.addEventListener('DOMContentLoaded', () => {

    // Check if dismissed in this session
    if (sessionStorage.getItem('announcementDismissed')) {
        return;
    }

    // Determine message based on page
    const path = window.location.pathname.toLowerCase();
    let message = "";
    let accent = "New";

    if (path.includes('air-ticket.html')) {
        accent = "Flash Sale";
        message = "Limited-time competitive fares available on select global routes.";
    } else if (path.includes('umrah.html')) {
        accent = "Notice";
        message = "Upcoming Umrah departures filling fast – Reserve your package early.";
    } else {
        accent = "Update";
        message = "Premium travel management tailored perfectly for you. Request a quote today.";
    }

    const stripHTML = `
    <div class="announcement-strip" id="topAnnouncement">
        <div class="container announcement-container">
            <div class="announcement-content">
                <span class="announcement-accent">${accent}</span>
                <span class="announcement-text">${message}</span>
            </div>
            <button class="announcement-close" id="closeAnnouncement" aria-label="Close Announcement">&times;</button>
        </div>
    </div>
    `;

    // Inject at the very top of the body
    document.body.insertAdjacentHTML('afterbegin', stripHTML);

    const announcement = document.getElementById('topAnnouncement');
    const closeBtn = document.getElementById('closeAnnouncement');

    // Show after a tiny delay for smooth animation
    setTimeout(() => {
        announcement.classList.add('show');
    }, 100);

    closeBtn.addEventListener('click', () => {
        announcement.style.animation = 'slideDown 0.4s ease reverse forwards';
        setTimeout(() => {
            announcement.style.display = 'none';
        }, 400);
        sessionStorage.setItem('announcementDismissed', 'true');
    });

});
