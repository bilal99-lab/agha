window.PageModule = {
    init: function () {
        this.render();
    },
    bindEvents: function () {
        // No specific events in portal.js
    },
    render: function () {
        let suppliers = Storage.get("aat_suppliers");
        let htmlContext = '';
        if (suppliers.length > 0) {
            htmlContext = suppliers.map(s => {
                let due = parseFloat(s.balance_payable) || 0;
                let statClass = due > 0 ? 'bg-danger-light' : 'bg-success-light';
                let statText = due > 0 ? 'Balance Due' : 'Settled';
                return `<tr>
                    <td><strong>${s.supplier_name}</strong></td>
                    <td>${s.airline || '-'}</td>
                    <td>${s.total_tickets || 0}</td>
                    <td>${UI.formatCurrency(s.total_cost)}</td>
                    <td style="font-weight: 600; color: ${due > 0 ? 'var(--danger)' : 'var(--text-dark)'};">${UI.formatCurrency(due)}</td>
                    <td><span class="status-badge ${statClass}">${statText}</span></td>
                </tr>`;
            }).join('');
        }
        UI.renderTable('suppliersTableBody', htmlContext, 'No supplier data available.');
    }
};
