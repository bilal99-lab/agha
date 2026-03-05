window.PageModule = {
    init: function () {
        this.render();
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'expenseForm') {
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
                if (document.getElementById('expenseDate')) document.getElementById('expenseDate').valueAsDate = new Date();
                this.render();
            }
        });
    },
    render: function () {
        const exps = Storage.get('aat_expenses');
        let htmlContext = '';
        if (exps.length > 0) {
            htmlContext = exps.map(e => `<tr><td style="font-weight: 500;">${e.expense_id}</td><td>${e.title}</td><td>${e.category}</td><td style="font-weight: 600;">${UI.formatCurrency(e.amount)}</td><td>${UI.formatDate(e.date)}</td></tr>`).join('');
        }
        UI.renderTable('expenseTableBody', htmlContext, 'No expenses recorded.');
    }
};
