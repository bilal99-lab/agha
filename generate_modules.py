import os

modules_dir = r"c:\Users\sheik\OneDrive\Desktop\Agha Air Travel\assets\js\modules"
if not os.path.exists(modules_dir):
    os.makedirs(modules_dir)

dashboard_js = """window.PageModule = {
    init: function() {
        this.render();
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#createTicketBtn')) {
                window.location.href = 'new-ticket.html';
            }
        });
    },
    render: function() {
        let totalSales = 0, totalProfit = 0, totalReceivable = 0;
        let expenses = 0, umrahSales = 0, umrahProfit = 0;
        const monthStart = new Date();
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const todayStr = new Date().toISOString().split('T')[0];

        const tickets = Storage.get('aat_tickets');
        const invoices = Storage.get('aat_invoices');
        const umrahList = Storage.get('aat_umrah_entries');
        const expenseList = Storage.get('aat_expenses');
        const supplierList = Storage.get('aat_suppliers');

        tickets.forEach(t => { if (t.date === todayStr) { totalSales += parseFloat(t.selling_price) || 0; } });
        invoices.forEach(inv => {
            if (inv.payment_status?.toLowerCase() === 'pending') totalReceivable += parseFloat(inv.amount || inv.selling_price) || 0;
            if (new Date(inv.date) >= monthStart) totalProfit += parseFloat(inv.profit) || 0;
        });
        expenseList.forEach(exp => { if (new Date(exp.date) >= monthStart) expenses += parseFloat(exp.amount) || 0; });
        umrahList.forEach(u => {
            if (u.travel_date && u.travel_date === todayStr) umrahSales += parseFloat(u.selling_price) || 0;
            if (u.travel_date && new Date(u.travel_date) >= monthStart) umrahProfit += parseFloat(u.profit) || 0;
        });
        let supplierPayables = 0;
        supplierList.forEach(s => { supplierPayables += parseFloat(s.balance_payable || 0); });
        let pendingInvoicesCount = invoices.filter(i => i.payment_status?.toLowerCase() === 'pending').length;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setVal("statTodaySales", UI.formatCurrency(totalSales + umrahSales));
        setVal("statTotalReceivable", UI.formatCurrency(totalReceivable));
        setVal("statMonthProfit", UI.formatCurrency(totalProfit + umrahProfit));
        setVal("statTotalExpenses", UI.formatCurrency(expenses));
        setVal("statNetProfit", UI.formatCurrency(totalProfit + umrahProfit - expenses));
        setVal("statPendingInvoices", pendingInvoicesCount);
        setVal("statSupplierPayables", UI.formatCurrency(supplierPayables));
        setVal("statStaffAccounts", Storage.get('aat_staff').length);

        let htmlContext = '';
        if (tickets.length > 0) {
            htmlContext = tickets.slice(-5).reverse().map(t => <tr><td style="font-weight: 500;">+t.ticket_id+</td><td>+t.client_name+</td><td><span class="status-badge bg-primary-light">Issue</span></td><td>+UI.formatDate(t.date)+</td><td style="font-weight: 600;">+UI.formatCurrency(t.selling_price)+</td><td style="text-align: right;"><button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;">View</button></td></tr>).join("");
        }
        UI.renderTable('recentActivityBody', htmlContext, 'No recent activity.');

        const initCharts = (currentProfit, currentNetProfit) => {
            const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
            const ctxSales = document.getElementById('salesChart');
            if (ctxSales && window.Chart) {
                new Chart(ctxSales.getContext('2d'), { type: 'bar', data: { labels: months, datasets: [{ label: 'Monthly Ticket Sales (PKR)', data: [1200000, 1500000, 1100000, 1800000, 2100000, 1950000, 2400000], backgroundColor: '#2563eb', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: '6-Month Sales Volume', align: 'start', padding: 20 } }, scales: { y: { beginAtZero: true, border: { dash: [4, 4] }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } } });
            }
            const ctxProfit = document.getElementById('profitChart');
            if (ctxProfit && window.Chart) {
                new Chart(ctxProfit.getContext('2d'), { type: 'line', data: { labels: months, datasets: [ { label: 'Gross Profit', data: [150000, 180000, 140000, 220000, 250000, 210000, currentProfit > 0 ? currentProfit : 280000], borderColor: '#10b981', backgroundColor: '#10b98115', borderWidth: 3, fill: true, tension: 0.4 }, { label: 'Net Profit', data: [100000, 120000, 90000, 160000, 180000, 150000, currentNetProfit > 0 ? currentNetProfit : 200000], borderColor: '#8b5cf6', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 5], tension: 0.4 } ] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end' }, title: { display: true, text: 'Gross vs Net Profit Trend', align: 'start', padding: 20 } }, scales: { y: { beginAtZero: true, border: { dash: [4, 4] }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } } });
            }
        };
        initCharts(totalProfit + umrahProfit, totalProfit + umrahProfit - expenses);
    }
};"""

tickets_js = """window.PageModule = {
    init: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        const calculateProfit = () => {
            let selling = parseFloat(document.getElementById("sellingPrice")?.value) || 0;
            let cost = parseFloat(document.getElementById("costPrice")?.value) || 0;
            let profit = selling - cost;
            const proElem = document.getElementById("profitAmount");
            if (proElem) {
                proElem.value = profit;
                proElem.style.color = profit > 0 ? 'var(--success)' : (profit < 0 ? 'var(--danger)' : 'var(--text-dark)');
            }
            let received = parseFloat(document.getElementById("amountReceived")?.value) || 0;
            let balance = selling - received;
            const balElem = document.getElementById("balanceAmount");
            if (balElem) {
                balElem.value = balance;
                balElem.style.color = balance > 0 ? 'var(--danger)' : 'var(--success)';
            }
        };

        ['sellingPrice', 'costPrice', 'amountReceived'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateProfit);
        });

        const pnrSearchBtn = document.getElementById("btnSearchPnr");
        if (pnrSearchBtn) {
            pnrSearchBtn.addEventListener("click", () => {
                const searchPnr = document.getElementById("searchPnrInput")?.value.trim().toUpperCase();
                if (!searchPnr) return;
                const ticket = Storage.get('aat_tickets').find(t => t.pnr === searchPnr);
                if (ticket) {
                    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val; }
                    setVal("clientName", ticket.client_name || '');
                    setVal("flightRoute", ticket.route || '');
                    setVal("travelDate", ticket.travel_date || '');
                    setVal("airlineName", ticket.airline || '');
                    setVal("sellingPrice", ticket.selling_price || '');
                    setVal("costPrice", ticket.cost_price || '');
                    calculateProfit();
                    UI.showAlert("Ticket found and populated.", "success");
                } else {
                    UI.showAlert("PNR not found in system.", "danger");
                }
            });
        }

        const ticketForm = document.getElementById('ticketForm');
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let costVal = parseFloat(document.getElementById('costPrice').value) || 0;
                let sellingVal = parseFloat(document.getElementById('sellingPrice').value) || 0;
                let receivedVal = parseFloat(document.getElementById('amountReceived').value) || 0;
                let paymentStatus = document.getElementById('paymentStatus').value;

                const newTicket = {
                    ticket_id: "#TKT-" + Math.floor(1000 + Math.random() * 9000),
                    date: new Date().toISOString().split('T')[0],
                    client_name: document.getElementById('clientName').value.trim(),
                    clientPhone: document.getElementById('clientPhone').value.trim(),
                    clientPassport: document.getElementById('clientPassport').value.trim(),
                    pnr: document.getElementById('pnr').value.trim(),
                    airline: document.getElementById('airlineName').value.trim(),
                    supplier_name: document.getElementById('supplierName')?.value?.trim() || '',
                    outbound: document.getElementById('outboundFlight')?.value?.trim() || '',
                    inbound: document.getElementById('inboundFlight')?.value?.trim() || '',
                    route: document.getElementById('flightRoute').value.trim(),
                    cost_price: costVal,
                    selling_price: sellingVal,
                    profit: parseFloat(document.getElementById('profitAmount')?.value) || (sellingVal - costVal),
                    received: receivedVal,
                    payment_status: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
                    balance: parseFloat(document.getElementById('balanceAmount')?.value) || (sellingVal - receivedVal)
                };

                Storage.add('aat_tickets', newTicket);

                let currentYear = new Date().getFullYear();
                let invoices = Storage.get('aat_invoices');
                let yearInvoices = invoices.filter(i => i.invoice_id && i.invoice_id.includes(INV--));
                let lastInvNumber = yearInvoices.length > 0 ? (parseInt(yearInvoices[yearInvoices.length - 1].invoice_id.split('-')[2]) || 0) : 0;

                const newInvoice = {
                    invoice_id: INV--,
                    ticket_id: newTicket.ticket_id,
                    client_name: newTicket.client_name,
                    date: newTicket.date,
                    amount: newTicket.selling_price,
                    cost_price: newTicket.cost_price,
                    profit: newTicket.profit,
                    payment_status: newTicket.payment_status
                };
                Storage.add('aat_invoices', newInvoice);

                let clients = Storage.get('aat_clients');
                let existingClient = clients.find(c => c.phone === newTicket.clientPhone || c.client_name === newTicket.client_name);
                if (existingClient) {
                    Storage.update('aat_clients', c => c.phone === newTicket.clientPhone || c.client_name === newTicket.client_name, c => {
                        c.total_spent = (parseFloat(c.total_spent) || 0) + newTicket.selling_price;
                        c.total_tickets = (parseInt(c.total_tickets) || 0) + 1;
                        c.total_profit_generated = (parseFloat(c.total_profit_generated) || 0) + newTicket.profit;
                        c.last_travel_date = newTicket.date;
                        return c;
                    });
                } else {
                    Storage.add('aat_clients', {
                        client_name: newTicket.client_name,
                        phone: newTicket.clientPhone,
                        passport: newTicket.clientPassport,
                        total_spent: newTicket.selling_price,
                        total_tickets: 1,
                        total_profit_generated: newTicket.profit,
                        last_travel_date: newTicket.date,
                        status: 'Active'
                    });
                }

                UI.showAlert('Ticket generated and saved successfully!', 'success');
                e.target.reset();
                if (document.getElementById('profitAmount')) document.getElementById('profitAmount').value = '';
                if (document.getElementById('balanceAmount')) document.getElementById('balanceAmount').value = '';
            });
        }
    },
    render: function() {}
};"""

clients_js = """window.PageModule = {
    init: function() {
        this.render();
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#addClientBtn')) {
                const modal = document.getElementById('clientModal');
                if(modal) modal.style.display = 'flex';
            }
            else if (e.target.closest('#cancelClientBtn')) {
                const modal = document.getElementById('clientModal');
                if(modal) modal.style.display = 'none';
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
        if(cForm) {
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
                if(modal) modal.style.display = 'none';
                this.render();
            });
        }
    },
    render: function() {
        const clients = Storage.get('aat_clients');
        let htmlContext = '';
        if (clients.length > 0) {
            htmlContext = clients.map(c => <tr><td style="font-weight: 500;">+(c.client_name || c.name)+</td><td>+c.phone+</td><td>+(c.total_tickets || 0)+</td><td>+UI.formatCurrency(c.total_spent || c.totalPurchases || 0)+</td><td><span class="status-badge bg-success-light">+(c.status || 'Active')+</span></td><td style="text-align: right;"><a href="client-details.html?phone=+encodeURIComponent(c.phone)+" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;">Profile</a> <button class="btn btn-outline" style="padding: 4px; color: var(--danger); border-color: var(--danger);" data-action="delete-client" data-phone="+c.phone+"><i class="fas fa-trash"></i></button></td></tr>).join('');
        }
        UI.renderTable('clientsTableBody', htmlContext, 'No clients found.');
    }
};"""

expenses_js = """window.PageModule = {
    init: function() {
        this.render();
        this.bindEvents();
    },
    bindEvents: function() {
        const eForm = document.getElementById('expenseForm');
        if(eForm) {
            eForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const expense = {
                    expense_id: 'EXP-' + Date.now().toString().slice(-4),
                    title: document.getElementById('expenseTitle').value.trim(),
                    category: document.getElementById('expenseCategory').value,
                    amount: parseFloat(document.getElementById('expenseAmount').value),
                    date: document.getElementById('expenseDate').value
                };
                Storage.add('aat_expenses', expense);
                UI.showAlert("Expense successfully recorded.", "success");
                e.target.reset();
                if(document.getElementById('expenseDate')) document.getElementById('expenseDate').valueAsDate = new Date();
                this.render();
            });
        }
    },
    render: function() {
        const exps = Storage.get('aat_expenses');
        let htmlContext = '';
        if (exps.length > 0) {
            htmlContext = exps.map(e => <tr><td style="font-weight: 500;">+e.expense_id+</td><td>+e.title+</td><td>+e.category+</td><td style="font-weight: 600;">+UI.formatCurrency(e.amount)+</td><td>+UI.formatDate(e.date)+</td></tr>).join('');
        }
        UI.renderTable('expenseTableBody', htmlContext, 'No expenses recorded.');
    }
};"""

with open(os.path.join(modules_dir, 'dashboard.js'), 'w') as f:
    f.write(dashboard_js)

with open(os.path.join(modules_dir, 'tickets.js'), 'w') as f:
    f.write(tickets_js)
    
with open(os.path.join(modules_dir, 'clients.js'), 'w') as f:
    f.write(clients_js)

with open(os.path.join(modules_dir, 'expenses.js'), 'w') as f:
    f.write(expenses_js)
