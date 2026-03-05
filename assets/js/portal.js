/*
 * AAT Travel Portal - Global Core Engine
 * Centralized Module Controller & Data Engine
 */

// ----------------------------------------------------
// 1. DATA ENGINE (Storage Management)
// ----------------------------------------------------
const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    add: (key, item) => {
        let data = Storage.get(key);
        data.push(item);
        Storage.save(key, data);
        return data;
    },
    update: (key, predicate, updateFn) => {
        let data = Storage.get(key);
        let index = data.findIndex(predicate);
        if (index !== -1) {
            data[index] = updateFn(data[index]);
            Storage.save(key, data);
        }
        return data;
    },
    remove: (key, predicate) => {
        let data = Storage.get(key);
        let newData = data.filter(item => !predicate(item));
        Storage.save(key, newData);
        return newData;
    }
};

// Formatting utilities
const Format = {
    currency: (amount) => 'Rs ' + (parseFloat(amount) || 0).toLocaleString(),
    date: (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
};

// Global Alert Utility
function showAlert(msg, type = 'success', containerId = 'globalAlert') {
    let alertBox = document.getElementById(containerId);
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = containerId;
        alertBox.className = 'alert';
        alertBox.style.display = 'none';
        const contentArea = document.querySelector('.content-area') || document.body;
        contentArea.insertBefore(alertBox, contentArea.firstChild);
    }
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
}

// ----------------------------------------------------
// 2. MODULE CONTROLLER SYSTEM
// ----------------------------------------------------
const PortalModules = {
    dashboard: function () {
        // Compute dashboard metrics
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

        tickets.forEach(t => {
            if (t.date === todayStr) {
                totalSales += parseFloat(t.selling_price) || 0;
            }
        });

        // Month profits and total receivables from invoices
        invoices.forEach(inv => {
            if (inv.payment_status?.toLowerCase() === 'pending') {
                totalReceivable += parseFloat(inv.amount || inv.selling_price) || 0;
            }
            if (new Date(inv.date) >= monthStart) {
                totalProfit += parseFloat(inv.profit) || 0;
            }
        });

        expenseList.forEach(exp => {
            if (new Date(exp.date) >= monthStart) {
                expenses += parseFloat(exp.amount) || 0;
            }
        });

        umrahList.forEach(u => {
            if (u.travel_date && u.travel_date === todayStr) {
                umrahSales += parseFloat(u.selling_price) || 0;
            }
            if (u.travel_date && new Date(u.travel_date) >= monthStart) {
                umrahProfit += parseFloat(u.profit) || 0;
            }
        });

        let supplierPayables = 0;
        supplierList.forEach(s => {
            supplierPayables += parseFloat(s.balance_payable || 0);
        });

        let pendingInvoicesCount = invoices.filter(i => i.payment_status?.toLowerCase() === 'pending').length;

        // Render Cards safely
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setVal("statTodaySales", Format.currency(totalSales + umrahSales));
        setVal("statTotalReceivable", Format.currency(totalReceivable));
        setVal("statMonthProfit", Format.currency(totalProfit + umrahProfit));
        setVal("statTotalExpenses", Format.currency(expenses));
        setVal("statNetProfit", Format.currency(totalProfit + umrahProfit - expenses));
        setVal("statPendingInvoices", pendingInvoicesCount);
        setVal("statSupplierPayables", Format.currency(supplierPayables));
        setVal("statStaffAccounts", Storage.get('aat_staff').length);

        // Render Recent Activity (using tickets as example)
        const recentBody = document.getElementById("recentActivityBody");
        if (recentBody && tickets.length > 0) {
            recentBody.innerHTML = tickets.slice(-5).reverse().map(t => `
                <tr>
                    <td style="font-weight: 500;">${t.ticket_id}</td>
                    <td>${t.client_name}</td>
                    <td><span class="status-badge bg-primary-light">Issue</span></td>
                    <td>${Format.date(t.date)}</td>
                    <td style="font-weight: 600;">${Format.currency(t.selling_price)}</td>
                    <td style="text-align: right;"><button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;">View</button></td>
                </tr>
            `).join("");
        } else if (recentBody) {
            recentBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No recent activity.</td></tr>`;
        }

        // Initialize Charts
        const initCharts = (currentProfit, currentNetProfit) => {
            const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

            const ctxSales = document.getElementById('salesChart');
            if (!ctxSales) return;

            new Chart(ctxSales.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Monthly Ticket Sales (PKR)',
                        data: [1200000, 1500000, 1100000, 1800000, 2100000, 1950000, 2400000],
                        backgroundColor: '#2563eb',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, title: { display: true, text: '6-Month Sales Volume', align: 'start', padding: 20 } },
                    scales: { y: { beginAtZero: true, border: { dash: [4, 4] }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
                }
            });

            const ctxProfit = document.getElementById('profitChart');
            if (!ctxProfit) return;

            new Chart(ctxProfit.getContext('2d'), {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Gross Profit',
                            data: [150000, 180000, 140000, 220000, 250000, 210000, currentProfit > 0 ? currentProfit : 280000],
                            borderColor: '#10b981', backgroundColor: '#10b98115', borderWidth: 3, fill: true, tension: 0.4
                        },
                        {
                            label: 'Net Profit',
                            data: [100000, 120000, 90000, 160000, 180000, 150000, currentNetProfit > 0 ? currentNetProfit : 200000],
                            borderColor: '#8b5cf6', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 5], tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', align: 'end' }, title: { display: true, text: 'Gross vs Net Profit Trend', align: 'start', padding: 20 } },
                    scales: { y: { beginAtZero: true, border: { dash: [4, 4] }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
                }
            });
        };

        initCharts(totalProfit + umrahProfit, totalProfit + umrahProfit - expenses);
    },

    tickets: function () {
        const calculateProfit = () => {
            let selling = parseFloat(document.getElementById("sellingPrice")?.value) || 0;
            let cost = parseFloat(document.getElementById("costPrice")?.value) || 0;
            let profit = selling - cost;
            const proElem = document.getElementById("profitAmount");
            if (proElem) {
                proElem.value = profit;
                if (profit > 0) proElem.style.color = 'var(--success)';
                else if (profit < 0) proElem.style.color = 'var(--danger)';
                else proElem.style.color = 'var(--text-dark)';
            }

            let received = parseFloat(document.getElementById("amountReceived")?.value) || 0;
            let balance = selling - received;
            const balElem = document.getElementById("balanceAmount");
            if (balElem) {
                balElem.value = balance;
                if (balance > 0) balElem.style.color = 'var(--danger)';
                else balElem.style.color = 'var(--success)';
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
                    if (document.getElementById("clientName")) document.getElementById("clientName").value = ticket.client_name || '';
                    if (document.getElementById("flightRoute")) document.getElementById("flightRoute").value = ticket.route || '';
                    if (document.getElementById("travelDate")) document.getElementById("travelDate").value = ticket.travel_date || '';
                    if (document.getElementById("airlineName")) document.getElementById("airlineName").value = ticket.airline || '';
                    if (document.getElementById("sellingPrice")) document.getElementById("sellingPrice").value = ticket.selling_price || '';
                    if (document.getElementById("costPrice")) document.getElementById("costPrice").value = ticket.cost_price || '';
                    calculateProfit();
                    showAlert("Ticket found and populated.", "success");
                } else {
                    showAlert("PNR not found in system.", "danger");
                }
            });
        }
    },

    clients: function () {
        const renderTable = () => {
            const tbody = document.getElementById("clientsTableBody");
            if (!tbody) return;
            const clients = Storage.get('aat_clients');
            if (clients.length > 0) {
                tbody.innerHTML = clients.map(c => `
                    <tr>
                        <td style="font-weight: 500;">${c.client_name || c.name}</td>
                        <td>${c.phone}</td>
                        <td>${c.total_tickets || 0}</td>
                        <td>${Format.currency(c.total_spent || c.totalPurchases || 0)}</td>
                        <td><span class="status-badge bg-success-light">${c.status || 'Active'}</span></td>
                        <td style="text-align: right;">
                            <a href="client-details.html?phone=${encodeURIComponent(c.phone)}" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;">Profile</a>
                            <button class="btn btn-outline" style="padding: 4px; color: var(--danger); border-color: var(--danger);" data-action="delete-client" data-phone="${c.phone}"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;">No clients found.</td></tr>`;
            }
        };
        renderTable();
        // Expose renderTable so global events can trigger it
        window.moduleRenderers = window.moduleRenderers || {};
        window.moduleRenderers.clients = renderTable;
    },

    expenses: function () {
        const renderTable = () => {
            const tbody = document.getElementById("expenseTableBody");
            if (!tbody) return;
            const exps = Storage.get('aat_expenses');
            if (exps.length > 0) {
                tbody.innerHTML = exps.map(e => `
                    <tr>
                        <td style="font-weight: 500;">${e.expense_id}</td>
                        <td>${e.title}</td>
                        <td>${e.category}</td>
                        <td style="font-weight: 600;">${Format.currency(e.amount)}</td>
                        <td>${Format.date(e.date)}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">No expenses recorded.</td></tr>`;
            }
        };
        renderTable();
        window.moduleRenderers = window.moduleRenderers || {};
        window.moduleRenderers.expenses = renderTable;
    },

    umrah: function () {
        const calcUmrahProfit = () => {
            const cost = parseFloat(document.getElementById('umrahCostPrice')?.value) || 0;
            const sell = parseFloat(document.getElementById('umrahSellPrice')?.value) || 0;
            const profEl = document.getElementById('umrahProfitAmount');
            if (profEl) profEl.value = sell - cost;
        };
        ['umrahCostPrice', 'umrahSellPrice'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calcUmrahProfit);
        });
    },

    invoices: function () { },
    ledger: function () { },
    staff: function () { },
    reports: function () { },
    suppliers: function () { },
    backup: function () { }
};

// ----------------------------------------------------
// 3. GLOBAL EVENT DELEGATION SYSTEM
// ----------------------------------------------------
document.addEventListener('click', function (e) {
    // ---- CLIENT MODULE ACTIONS ----
    if (e.target.closest('#addClientBtn')) {
        document.getElementById('clientModal').style.display = 'flex';
    }
    else if (e.target.closest('#cancelClientBtn')) {
        document.getElementById('clientModal').style.display = 'none';
        document.getElementById('newClientForm')?.reset();
    }
    else if (e.target.closest('[data-action="delete-client"]')) {
        const btn = e.target.closest('[data-action="delete-client"]');
        const phone = btn.getAttribute('data-phone');
        if (confirm('Are you sure you want to delete this client?')) {
            Storage.remove('aat_clients', c => c.phone === phone);
            showAlert('Client deleted successfully', 'success');
            if (window.moduleRenderers.clients) window.moduleRenderers.clients();
        }
    }

    // ---- DASHBOARD ACTIONS ----
    else if (e.target.closest('#createTicketBtn')) {
        window.location.href = 'new-ticket.html';
    }
});

// ----------------------------------------------------
// 4. GLOBAL FORM DELEGATION
// ----------------------------------------------------
document.addEventListener('submit', function (e) {
    // ---- ADD CLIENT FORM ----
    if (e.target.id === 'newClientForm') {
        e.preventDefault();
        const client = {
            client_name: document.getElementById('newClientName').value.trim(),
            phone: document.getElementById('newClientPhone').value.trim(),
            email: document.getElementById('newClientEmail').value.trim() || '',
            total_tickets: 0,
            total_spent: 0,
            status: 'Active'
        };
        Storage.add('aat_clients', client);
        document.getElementById('clientModal').style.display = 'none';
        e.target.reset();
        showAlert('Client successfully added', 'success');
        if (window.moduleRenderers.clients) window.moduleRenderers.clients();
    }

    // ---- ADD EXPENSE FORM ----
    if (e.target.id === 'expenseForm') {
        e.preventDefault();
        const expense = {
            expense_id: 'EXP-' + Date.now().toString().slice(-4),
            title: document.getElementById('expTitle').value.trim(),
            amount: parseFloat(document.getElementById('expAmount').value),
            category: document.getElementById('expCategory').value,
            date: document.getElementById('expDate').value || new Date().toISOString().split('T')[0]
        };
        Storage.add('aat_expenses', expense);
        e.target.reset();
        showAlert("Expense recorded successfully.", "success");
        if (window.moduleRenderers.expenses) window.moduleRenderers.expenses();
    }

    // ---- UMRAH ENTRY FORM ----
    if (e.target.id === 'umrahForm') {
        e.preventDefault();
        const umrahData = {
            entry_id: 'UMR-' + Date.now().toString().slice(-4),
            client_name: document.getElementById('uClientName').value.trim(),
            phone: document.getElementById('uClientPhone').value.trim(),
            package_name: document.getElementById('uPackageName').value,
            travel_date: document.getElementById('uTravelDate').value,
            cost_price: parseFloat(document.getElementById('umrahCostPrice').value),
            selling_price: parseFloat(document.getElementById('umrahSellPrice').value),
            profit: parseFloat(document.getElementById('umrahProfitAmount').value),
            date: new Date().toISOString().split('T')[0]
        };

        Storage.add('aat_umrah_entries', umrahData);
        e.target.reset();
        showAlert("Umrah package recorded successfully.", "success");
    }
});

// ----------------------------------------------------
// 5. PAGE INITIALIZER
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Initialize specific module based on current page
    const page = document.body.dataset.page;
    if (page && typeof PortalModules[page] === 'function') {
        PortalModules[page]();
    }

    // High level styling overrides safely via JS 
    document.querySelectorAll('.wrapper').forEach(el => el.classList.replace('wrapper', 'portal-wrapper'));
    document.querySelectorAll('.main-content').forEach(el => el.classList.replace('main-content', 'main-area'));
});
