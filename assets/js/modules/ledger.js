window.PageModule = {
    init: function () {
        this.render();
    },
    bindEvents: function () {
        // No specific events for ledger right now
    },
    render: function () {
        let ledger = Storage.get("aat_ledger");
        let htmlContext = '';
        if (ledger.length > 0) {
            htmlContext = ledger.reverse().map(entry => {
                let badgeClass = (entry.type === "Expense" || entry.type === "ticket_sale_refund") ? "bg-danger-light" : "bg-success-light";
                let clientDisplay = entry.client_name ? `<strong>${entry.client_name}</strong><br>` : '';
                let descDisplay = entry.description || 'No description';
                return `<tr>
                    <td>${entry.entry_id || entry.id || '#---'}</td>
                    <td>${UI.formatDate(entry.date) || '-'}</td>
                    <td>${clientDisplay}<span class="text-muted" style="font-size: 0.8rem;">${descDisplay}</span></td>
                    <td><span class="status-badge ${badgeClass}">${entry.type}</span></td>
                    <td>${UI.formatCurrency(entry.amount)}</td>
                </tr>`;
            }).join('');
        }
        UI.renderTable('ledgerTableBody', htmlContext, 'No transactions recorded yet.');
    }
};
