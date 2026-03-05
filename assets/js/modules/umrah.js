window.PageModule = {
    init: function () {
        this.bindEvents();
    },
    bindEvents: function () {
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

        document.addEventListener('submit', (e) => {
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
                UI.showAlert("Umrah package recorded successfully.", "success");
            }
        });
    },
    render: function () { }
};
