window.PageModule = {
    init: function () {
        this.render();
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'paymentForm') {
                e.preventDefault();
                let selectedName = document.getElementById('supplierSelect').value;
                let amount = parseFloat(document.getElementById('paymentAmount').value);
                let date = document.getElementById('paymentDate').value;
                let note = document.getElementById('paymentNote').value;

                let suppliers = Storage.get("aat_suppliers");
                let supIndex = suppliers.findIndex(s => s.supplier_name === selectedName);
                if (supIndex !== -1) {
                    let s = suppliers[supIndex];
                    let currentBalance = s.balance_payable || 0;
                    if (amount > currentBalance) {
                        UI.showAlert(`Error: Payment amount (Rs ${amount}) cannot exceed the balance due (Rs ${currentBalance}).`, 'danger');
                        return;
                    }
                    s.balance_payable = currentBalance - amount;
                    s.amount_paid = (s.amount_paid || (s.total_cost - currentBalance)) + amount;
                    Storage.save("aat_suppliers", suppliers);

                    Storage.add("aat_ledger", {
                        entry_id: "PAY-" + Date.now().toString().slice(-4),
                        type: "Supplier Payment",
                        amount: amount,
                        client_name: selectedName,
                        description: note || "Supplier Payment",
                        date: date
                    });

                    e.target.reset();
                    if (document.getElementById('paymentDate')) document.getElementById('paymentDate').valueAsDate = new Date();
                    UI.showAlert(`Payment of Rs ${amount.toLocaleString()} successfully recorded for ${selectedName}.`, 'success');
                    this.render();
                }
            }
        });
    },
    render: function () {
        let suppliers = Storage.get("aat_suppliers");
        let activeSuppliers = suppliers.filter(s => (parseFloat(s.balance_payable) || 0) > 0);
        const sel = document.getElementById("supplierSelect");
        if (sel) {
            if (activeSuppliers.length === 0) sel.innerHTML = '<option value="">No pending payables</option>';
            else sel.innerHTML = activeSuppliers.map(s => `<option value="${s.supplier_name}">${s.supplier_name} - Balance: ${UI.formatCurrency(s.balance_payable)}</option>`).join('');
        }

        let ledger = Storage.get("aat_ledger").filter(l => l.type === "Supplier Payment");
        let htmlContext = '';
        if (ledger.length > 0) {
            htmlContext = ledger.reverse().map(l => `<tr>
                <td>${l.entry_id}</td>
                <td>${UI.formatDate(l.date)}</td>
                <td><strong>${l.client_name}</strong></td>
                <td><span class="status-badge bg-primary-light">${l.type}</span></td>
                <td style="font-weight: 600;">${UI.formatCurrency(l.amount)}</td>
            </tr>`).join('');
        }
        UI.renderTable('paymentHistoryBody', htmlContext, 'No supplier payments recorded yet.');
    }
};
