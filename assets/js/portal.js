document.addEventListener("DOMContentLoaded", () => {

    // --- UTILITIES ---
    function showAlert(msg, type = 'success', elId = 'alertMessage') {
        const el = document.getElementById(elId);
        if (el) {
            el.textContent = msg;
            el.className = `alert alert-${type}`;
            el.style.display = 'block';
            setTimeout(() => { el.style.display = 'none'; }, 3000);
        } else {
            alert(msg);
        }
    }

    // --- CLIENTS MODULE ---
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', () => {
            const modal = document.getElementById('clientModal');
            if (modal) modal.style.display = 'flex';
        });
    }

    const cancelClientBtn = document.getElementById('cancelClientBtn');
    if (cancelClientBtn) {
        cancelClientBtn.addEventListener('click', () => {
            const modal = document.getElementById('clientModal');
            if (modal) modal.style.display = 'none';
        });
    }

    const saveClientBtn = document.getElementById('saveClientBtn');
    if (saveClientBtn) {
        saveClientBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = document.getElementById('newClientName').value.trim();
            const phone = document.getElementById('newClientPhone').value.trim();
            const email = document.getElementById('newClientEmail').value.trim();

            if (!name || !phone) {
                showAlert('Name and Phone are required.', 'error', 'clientAlert');
                return;
            }

            let clients = JSON.parse(localStorage.getItem('aat_clients')) || [];
            let existing = clients.find(c => c.phone === phone);
            if (existing) {
                showAlert('Client with this phone already exists.', 'error', 'clientAlert');
                return;
            }

            clients.push({
                client_name: name,
                phone: phone,
                email: email,
                total_tickets: 0,
                total_spent: 0,
                total_profit_generated: 0,
                status: 'Active'
            });

            localStorage.setItem('aat_clients', JSON.stringify(clients));
            document.getElementById('clientModal').style.display = 'none';
            if (typeof renderClientTable === 'function') renderClientTable();
            showAlert('Client saved successfully.');
        });
    }

    function renderClientTable() {
        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) return;
        let clients = JSON.parse(localStorage.getItem('aat_clients')) || [];
        tableBody.innerHTML = '';
        if (clients.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No clients found.</td></tr>`;
            return;
        }

        clients.forEach((c, index) => {
            tableBody.innerHTML += `
                <tr>
                    <td>${c.client_name || c.name}</td>
                    <td>${c.phone}</td>
                    <td>${c.total_tickets || 0} Tickets</td>
                    <td>Rs ${(c.total_spent || c.totalPurchases || 0).toLocaleString()}</td>
                    <td><span class="status-badge bg-success-light">${c.status || 'Active'}</span></td>
                    <td style="text-align: right;">
                        <a href="client-details.html?phone=${encodeURIComponent(c.phone)}" class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem; margin-right: 8px;">Profile</a>
                        <button class="btn btn-danger" style="padding: 4px 12px; font-size: 0.8rem; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="deleteClient(${index})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    window.deleteClient = function (index) {
        if (confirm("Are you sure you want to delete this client?")) {
            let clients = JSON.parse(localStorage.getItem('aat_clients')) || [];
            clients.splice(index, 1);
            localStorage.setItem('aat_clients', JSON.stringify(clients));
            renderClientTable();
        }
    };

    if (document.getElementById('clientsTableBody')) {
        renderClientTable();
    }


    // --- UMRAH ENTRY MODULE ---
    const btnSaveUmrah = document.getElementById('btnSaveUmrah');
    if (btnSaveUmrah) {
        btnSaveUmrah.addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('umrahForm');
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const name = document.getElementById('umrahClient').value.trim();
            const phone = document.getElementById('umrahPhone').value.trim();
            const passport = document.getElementById('umrahPassport').value.trim();
            const pkg = document.getElementById('umrahPackage').value.trim();
            const date = document.getElementById('umrahDate').value;
            const cost = parseFloat(document.getElementById('umrahCost').value) || 0;
            const selling = parseFloat(document.getElementById('umrahSelling').value) || 0;
            const profit = selling - cost;

            const entry = {
                entry_id: "UMR-" + Math.floor(1000 + Math.random() * 9000),
                client_name: name,
                phone: phone,
                passport: passport,
                package_name: pkg,
                travel_date: date,
                cost_price: cost,
                selling_price: selling,
                profit: profit
            };

            let umrahEntries = JSON.parse(localStorage.getItem('aat_umrah_entries')) || [];
            umrahEntries.push(entry);
            localStorage.setItem('aat_umrah_entries', JSON.stringify(umrahEntries));

            // Add to Ledger
            let ledger = JSON.parse(localStorage.getItem('aat_ledger')) || [];
            ledger.push({
                entry_id: "#LDG-" + Math.floor(1000 + Math.random() * 9000),
                type: "umrah_sale",
                amount: selling,
                client_name: name,
                date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                description: pkg + " Package"
            });
            localStorage.setItem('aat_ledger', JSON.stringify(ledger));

            // Sync with clients
            let clients = JSON.parse(localStorage.getItem('aat_clients')) || [];
            let existingClient = clients.find(c => c.phone === phone);
            if (existingClient) {
                existingClient.total_spent += selling;
                existingClient.total_tickets += 1;
                existingClient.total_profit_generated = (existingClient.total_profit_generated || 0) + profit;
            } else {
                clients.push({
                    client_name: name,
                    phone: phone,
                    passport: passport,
                    total_spent: selling,
                    total_tickets: 1,
                    total_profit_generated: profit,
                    status: 'Active'
                });
            }
            localStorage.setItem('aat_clients', JSON.stringify(clients));

            showAlert('Umrah Entry saved successfully!', 'success', 'umrahAlert');
            form.reset();
            document.getElementById('umrahProfit').value = "0";
        });
    }

    const umrahCost = document.getElementById('umrahCost');
    const umrahSelling = document.getElementById('umrahSelling');
    if (umrahCost && umrahSelling) {
        const updateProfit = () => {
            const c = parseFloat(umrahCost.value) || 0;
            const s = parseFloat(umrahSelling.value) || 0;
            document.getElementById('umrahProfit').value = (s - c).toString();
        };
        umrahCost.addEventListener('input', updateProfit);
        umrahSelling.addEventListener('input', updateProfit);
    }


    // --- EXPENSES MODULE ---
    const btnSaveExpense = document.getElementById('btnSaveExpense');
    if (btnSaveExpense && document.getElementById('expenseForm')) {
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('expTitle').value.trim();
            const amount = parseFloat(document.getElementById('expAmount').value) || 0;
            const category = document.getElementById('expCategory').value;
            const date = document.getElementById('expDate').value;

            let expenses = JSON.parse(localStorage.getItem('aat_expenses')) || [];
            expenses.push({
                title: title,
                amount: amount,
                category: category,
                date: date,
                expense_id: "EXP-" + Math.floor(1000 + Math.random() * 9000)
            });
            localStorage.setItem('aat_expenses', JSON.stringify(expenses));

            showAlert('Expense added successfully.');
            if (typeof renderExpenses === 'function') renderExpenses();
            else window.location.reload();
        });
    }

    // --- TICKET MODULE ---
    // Make sure Create Ticket button maps appropriately if found
    const createTicketBtn = document.getElementById('createTicketBtn');
    if (createTicketBtn) {
        createTicketBtn.addEventListener('click', () => { window.location.href = 'new-ticket.html'; });
    }

    const btnSaveForm = document.getElementById('btnSave'); // Found in new-ticket.html
    if (btnSaveForm) {
        // Keep existing inline logic for ticket or override here if requested.
        // User requested "Restore click functionality" to an ID event listener.
        btnSaveForm.addEventListener('click', (e) => {
            e.preventDefault();
            const ticForm = document.getElementById('ticketForm');
            if (ticForm) ticForm.requestSubmit();
        });
    }

    const btnAddPassenger = document.getElementById('btnAddPassenger');
    if (btnAddPassenger) {
        btnAddPassenger.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('Passenger field added (mock).', 'success');
        });
    }

    const btnAddSegment = document.getElementById('btnAddSegment');
    if (btnAddSegment) {
        btnAddSegment.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('Flight segment added (mock).', 'success');
        });
    }


    // --- DASHBOARD MODULE ---
    const statTodaySales = document.getElementById('statTodaySales');
    const statTotalReceivable = document.getElementById('statTotalReceivable');
    const statMonthProfit = document.getElementById('statMonthProfit');
    const statTotalExpenses = document.getElementById('statTotalExpenses');
    const statNetProfit = document.getElementById('statNetProfit');

    if (statTodaySales) { // We are on dashboard
        let tickets = JSON.parse(localStorage.getItem('aat_tickets')) || [];
        let invoices = JSON.parse(localStorage.getItem('aat_invoices')) || [];
        let expenses = JSON.parse(localStorage.getItem('aat_expenses')) || [];
        let umrahs = JSON.parse(localStorage.getItem('aat_umrah_entries')) || [];

        const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const currentMonthNumStr = new Date().toISOString().slice(0, 7); // YYYY-MM
        const currentMonth = new Date().toLocaleDateString('en-GB', { month: 'short' });

        let tSales = 0;
        let tRecv = 0;
        let mProfit = 0;
        let tExp = 0;

        tickets.forEach(t => {
            if (t.date === todayStr) tSales += (t.selling_price || 0);
        });

        umrahs.forEach(u => {
            let uDateStr = new Date(u.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            if (uDateStr === todayStr) tSales += (u.selling_price || 0);
        });

        invoices.forEach(inv => {
            if (inv.payment_status === 'Pending' || inv.payment_status === 'unpaid') {
                tRecv += (inv.amount || inv.selling_price || 0);
            }
            if (inv.date && inv.date.includes(currentMonth)) {
                mProfit += (inv.profit || 0);
            }
        });

        umrahs.forEach(u => {
            if (u.travel_date && u.travel_date.startsWith(currentMonthNumStr)) {
                mProfit += (u.profit || 0);
            }
        });

        expenses.forEach(exp => {
            if (exp.date && exp.date.startsWith(currentMonthNumStr)) {
                tExp += (exp.amount || 0);
            }
        });

        let nProfit = mProfit - tExp;

        statTodaySales.textContent = "Rs " + tSales.toLocaleString();
        statTotalReceivable.textContent = "Rs " + tRecv.toLocaleString();
        statTotalExpenses.textContent = "Rs " + tExp.toLocaleString();

        let profitBadge = mProfit >= 0 ? "bg-success-light" : "bg-danger-light";
        statMonthProfit.innerHTML = `<span class="status-badge ${profitBadge}" style="font-size: 1.1rem; padding: 4px 12px;">Rs ${mProfit.toLocaleString()}</span>`;

        let netProfitBadge = nProfit >= 0 ? "bg-success-light" : "bg-danger-light";
        let netProfitColor = nProfit >= 0 ? "#8b5cf6" : "var(--danger)";
        statNetProfit.innerHTML = `<span class="status-badge ${netProfitBadge}" style="color: ${netProfitColor}; font-size: 1.1rem; padding: 4px 12px;">Rs ${nProfit.toLocaleString()}</span>`;
    }
});
