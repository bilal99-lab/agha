window.PageModule = {
    init: function () {
        this.render();
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btnGenerate')) {
                this.render();
            }
        });
    },
    render: function () {
        let month = document.getElementById("reportMonth")?.value;
        let year = document.getElementById("reportYear")?.value;
        if (!month || !year) {
            let now = new Date();
            month = String(now.getMonth() + 1).padStart(2, '0');
            year = now.getFullYear();
        }
        const filterRegex = new RegExp(`^${year}-${month}`);

        let rSales = 0, rProfit = 0, rExpenses = 0, rUmrahSales = 0, rUmrahProfit = 0;
        let routeCount = {}, clientCount = {};

        Storage.get('aat_tickets').filter(t => filterRegex.test(t.date)).forEach(t => {
            rSales += parseFloat(t.selling_price) || 0;
            let rt = t.route || t.airline || 'Unknown';
            routeCount[rt] = (routeCount[rt] || 0) + 1;
        });

        Storage.get('aat_invoices').filter(i => filterRegex.test(i.date)).forEach(i => {
            rProfit += parseFloat(i.profit) || 0;
            let cli = i.client_name || 'Walk-in';
            clientCount[cli] = (clientCount[cli] || 0) + (parseFloat(i.amount) || 0);
        });

        Storage.get('aat_expenses').filter(e => filterRegex.test(e.date)).forEach(e => {
            rExpenses += parseFloat(e.amount) || 0;
        });

        Storage.get('aat_umrah_entries').filter(u => filterRegex.test(u.travel_date || u.date)).forEach(u => {
            rUmrahSales += parseFloat(u.selling_price) || 0;
            rUmrahProfit += parseFloat(u.profit) || 0;
        });

        const setVal = (vid, val) => { if (document.getElementById(vid)) document.getElementById(vid).textContent = val; };
        setVal("repSales", UI.formatCurrency(rSales + rUmrahSales));
        setVal("repProfit", UI.formatCurrency(rProfit + rUmrahProfit));
        setVal("repExpenses", UI.formatCurrency(rExpenses));
        setVal("repNet", UI.formatCurrency((rProfit + rUmrahProfit) - rExpenses));

        // Top Content
        let sortedRoutes = Object.entries(routeCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        let routeHtml = sortedRoutes.map(r => `<div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>${r[0]}</span><strong>${r[1]} Tickets</strong></div>`).join('');
        const routeContainer = document.getElementById("repTopRoutes");
        if (routeContainer) routeContainer.innerHTML = routeHtml || '<div class="text-muted">No flight data</div>';

        let sortedClients = Object.entries(clientCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        let clientHtml = sortedClients.map(c => `<div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>${c[0]}</span><strong>${UI.formatCurrency(c[1])}</strong></div>`).join('');
        const clientContainer = document.getElementById("repTopClients");
        if (clientContainer) clientContainer.innerHTML = clientHtml || '<div class="text-muted">No client data</div>';
    }
};
