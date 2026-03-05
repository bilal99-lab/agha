// Connect this file in all portal HTML templates near the body tag.
document.addEventListener("DOMContentLoaded", function () {
    const topBar = document.querySelector('.topbar');
    if (!topBar) return;

    // 1. Inject Search HTML
    const searchHTML = `
        <div class="global-search" id="globalSearchContainer">
            <i class="fas fa-search"></i>
            <input type="text" id="globalSearchInput" placeholder="Search PNR, Client, Route, Invoice..." autocomplete="off">
            <div class="search-dropdown" id="globalSearchDropdown"></div>
        </div>
    `;

    // Insert between page-title and user-profile
    const pageTitle = topBar.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.insertAdjacentHTML('afterend', searchHTML);
    }

    // 2. Search Logic
    const searchInput = document.getElementById('globalSearchInput');
    const searchDropdown = document.getElementById('globalSearchDropdown');

    if (!searchInput) return;

    let tickets = JSON.parse(localStorage.getItem('aat_tickets')) || [];
    let clients = JSON.parse(localStorage.getItem('aat_clients')) || [];
    let invoices = JSON.parse(localStorage.getItem('aat_invoices')) || [];

    searchInput.addEventListener('input', function (e) {
        let q = e.target.value.toLowerCase().trim();
        searchDropdown.innerHTML = '';

        if (q.length < 2) {
            searchDropdown.classList.remove('active');
            return;
        }

        let results = [];

        // Search Tickets
        tickets.forEach(t => {
            if (
                (t.pnr && t.pnr.toLowerCase().includes(q)) ||
                (t.client_name && t.client_name.toLowerCase().includes(q)) ||
                (t.route && t.route.toLowerCase().includes(q)) ||
                (t.ticket_id && t.ticket_id.toLowerCase().includes(q))
            ) {
                results.push({
                    type: 'Ticket',
                    title: `${t.pnr || t.ticket_id} - ${t.client_name}`,
                    meta: `Route: ${t.route} | Date: ${t.date}`,
                    link: `new-ticket.html` // In completely integrated systems this might pass an ID
                });
            }
        });

        // Search Clients
        clients.forEach(c => {
            if (
                (c.client_name && c.client_name.toLowerCase().includes(q)) ||
                (c.name && c.name.toLowerCase().includes(q)) ||
                (c.phone && c.phone.toLowerCase().includes(q))
            ) {
                let name = c.client_name || c.name;
                results.push({
                    type: 'Client',
                    title: name,
                    meta: `Phone: ${c.phone} | Spent: Rs ${c.total_spent || 0}`,
                    link: `client-details.html?phone=${encodeURIComponent(c.phone)}`
                });
            }
        });

        // Search Invoices
        invoices.forEach(i => {
            if (
                (i.invoice_id && i.invoice_id.toLowerCase().includes(q)) ||
                (i.client_name && i.client_name.toLowerCase().includes(q))
            ) {
                results.push({
                    type: 'Invoice',
                    title: `${i.invoice_id}`,
                    meta: `Client: ${i.client_name} | Amount: Rs ${i.amount}`,
                    link: `invoices.html`
                });
            }
        });

        // Render Results
        if (results.length > 0) {
            // Limit to 8
            results.slice(0, 8).forEach(res => {
                let badgeColor = res.type === 'Ticket' ? '#3b82f6' : (res.type === 'Client' ? '#10b981' : '#8b5cf6');
                searchDropdown.innerHTML += `
                    <div class="search-item" onclick="window.location.href='${res.link}'">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="search-item-title">${res.title}</span>
                            <span class="search-badge" style="background: ${badgeColor}15; color: ${badgeColor};">${res.type}</span>
                        </div>
                        <div class="search-item-meta">${res.meta}</div>
                    </div>
                `;
            });
            searchDropdown.classList.add('active');
        } else {
            searchDropdown.innerHTML = `<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 0.9rem;">No results found for "${q}"</div>`;
            searchDropdown.classList.add('active');
        }
    });

    // Close dropdown on outside click
    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('active');
        }
    });
});
