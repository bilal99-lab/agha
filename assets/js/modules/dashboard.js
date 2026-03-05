window.PageModule = {
    init: function () {
        this.render();
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#createTicketBtn')) {
                Portal.navigate('new-ticket.html');
            }
        });
    },
    render: function () {
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
            htmlContext = tickets.slice(-5).reverse().map(t => `<tr><td style="font-weight: 500;">` + t.ticket_id + `</td><td>` + t.client_name + `</td><td><span class="status-badge bg-primary-light">Issue</span></td><td>` + UI.formatDate(t.date) + `</td><td style="font-weight: 600;">` + UI.formatCurrency(t.selling_price) + `</td><td style="text-align: right;"><button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;">View</button></td></tr>`).join("");
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
                new Chart(ctxProfit.getContext('2d'), { type: 'line', data: { labels: months, datasets: [{ label: 'Gross Profit', data: [150000, 180000, 140000, 220000, 250000, 210000, currentProfit > 0 ? currentProfit : 280000], borderColor: '#10b981', backgroundColor: '#10b98115', borderWidth: 3, fill: true, tension: 0.4 }, { label: 'Net Profit', data: [100000, 120000, 90000, 160000, 180000, 150000, currentNetProfit > 0 ? currentNetProfit : 200000], borderColor: '#8b5cf6', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 5], tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end' }, title: { display: true, text: 'Gross vs Net Profit Trend', align: 'start', padding: 20 } }, scales: { y: { beginAtZero: true, border: { dash: [4, 4] }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } } });
            }
        };
        initCharts(totalProfit + umrahProfit, totalProfit + umrahProfit - expenses);
    }
};
