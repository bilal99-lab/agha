window.PageModule = {
    init: function () {
        this.render();
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#addClientBtn')) {
                const modal = document.getElementById('clientModal');
                if (modal) modal.style.display = 'flex';
            }
            else if (e.target.closest('#cancelClientBtn')) {
                const modal = document.getElementById('clientModal');
                if (modal) modal.style.display = 'none';
                document.getElementById('newClientForm')?.reset();
            }
            else if (e.target.closest('[data-action="delete-client"]')) {
                const phone = e.target.closest('[data-action="delete-client"]').getAttribute('data-phone');
                if (confirm('Are you sure you want to delete this client?')) {
                    Storage.remove('aat_clients', c => c.phone === phone);
                    UI.showAlert('Client deleted successfully', 'success');
                    this.render();
                }
            }
        });
        const cForm = document.getElementById('newClientForm');
        if (cForm) {
            cForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newClient = {
                    client_name: document.getElementById('newClientName').value.trim(),
                    phone: document.getElementById('newClientPhone').value.trim(),
                    email: document.getElementById('newClientEmail').value.trim(),
                    total_tickets: 0,
                    total_spent: 0,
                    status: 'Active'
                };
                Storage.add('aat_clients', newClient);
                UI.showAlert("Client successfully added.", "success");
                e.target.reset();
                const modal = document.getElementById('clientModal');
                if (modal) modal.style.display = 'none';
                this.render();
            });
        }
    },
    render: function () {
        const clients = Storage.get('aat_clients');
        let htmlContext = '';
        if (clients.length > 0) {
            htmlContext = clients.map(c => `<tr><td style="font-weight: 500;">` + (c.client_name || c.name) + `</td><td>` + c.phone + `</td><td>` + (c.total_tickets || 0) + `</td><td>` + UI.formatCurrency(c.total_spent || c.totalPurchases || 0) + `</td><td><span class="status-badge bg-success-light">` + (c.status || 'Active') + `</span></td><td style="text-align: right;"><a href="client-details.html?phone=` + encodeURIComponent(c.phone) + `" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;">Profile</a> <button class="btn btn-outline" style="padding: 4px; color: var(--danger); border-color: var(--danger);" data-action="delete-client" data-phone="` + c.phone + `"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        }
        UI.renderTable('clientsTableBody', htmlContext, 'No clients found.');
    }
};
