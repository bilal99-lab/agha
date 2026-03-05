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

    invoices: function () {
        const renderTable = () => {
            const tableBody = document.getElementById("invoiceTableBody");
            if (!tableBody) return;
            let invoices = Storage.get("aat_invoices");
            if (invoices.length > 0) {
                tableBody.innerHTML = invoices.reverse().map(inv => {
                    let statusClass = inv.payment_status?.toLowerCase() === 'paid' ? 'bg-success-light' : 'bg-warning-light';
                    let profitBadge = parseFloat(inv.profit) >= 0 ? "bg-success-light" : "bg-danger-light";
                    return `<tr>
                        <td><strong>${inv.invoice_id}</strong></td>
                        <td>${Format.date(inv.date)}</td>
                        <td>${inv.client_name || '-'}</td>
                        <td>${Format.currency(inv.amount)}</td>
                        <td><span class="status-badge ${profitBadge}">${Format.currency(inv.profit)}</span></td>
                        <td><span class="status-badge ${statusClass}">${inv.payment_status || 'Pending'}</span></td>
                        <td style="text-align: right;">
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size:0.8rem;" data-action="mark-paid-invoice" data-id="${inv.invoice_id}" ${inv.payment_status?.toLowerCase() === 'paid' ? 'disabled' : ''}><i class="fas fa-check"></i></button>
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size:0.8rem;" data-action="print-invoice" data-id="${inv.invoice_id}"><i class="fas fa-print"></i></button>
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size:0.8rem;" data-action="print-ticket" data-id="${inv.ticket_id}"><i class="fas fa-plane"></i></button>
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size:0.8rem; color: #25d366; border-color: #25d366;" data-action="whatsapp-invoice" data-id="${inv.invoice_id}"><i class="fab fa-whatsapp"></i></button>
                            ${inv.payment_status?.toLowerCase() !== 'paid' ? `<button class="btn btn-outline" style="padding: 4px 8px; font-size:0.8rem; color: #f59e0b; border-color: #f59e0b;" data-action="whatsapp-reminder" data-id="${inv.invoice_id}"><i class="fas fa-bell"></i></button>` : ''}
                        </td>
                    </tr>`;
                }).join('');
            } else {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No invoices generated.</td></tr>`;
            }
        };
        renderTable();
        window.moduleRenderers = window.moduleRenderers || {};
        window.moduleRenderers.invoices = renderTable;
    },

    ledger: function () {
        const renderTable = () => {
            const tableBody = document.getElementById("ledgerTableBody");
            if (!tableBody) return;
            let ledger = Storage.get("aat_ledger");
            if (ledger.length > 0) {
                tableBody.innerHTML = ledger.reverse().map(entry => {
                    let badgeClass = (entry.type === "Expense" || entry.type === "ticket_sale_refund") ? "bg-danger-light" : "bg-success-light";
                    let clientDisplay = entry.client_name ? `<strong>${entry.client_name}</strong><br>` : '';
                    let descDisplay = entry.description || 'No description';
                    return `<tr>
                        <td>${entry.entry_id || entry.id || '#---'}</td>
                        <td>${Format.date(entry.date) || '-'}</td>
                        <td>${clientDisplay}<span class="text-muted" style="font-size: 0.8rem;">${descDisplay}</span></td>
                        <td><span class="status-badge ${badgeClass}">${entry.type}</span></td>
                        <td>${Format.currency(entry.amount)}</td>
                    </tr>`;
                }).join('');
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">No transactions recorded yet.</td></tr>`;
            }
        };
        renderTable();
        window.moduleRenderers = window.moduleRenderers || {};
        window.moduleRenderers.ledger = renderTable;
    },

    staff: function () {
        const renderTable = () => {
            const tableBody = document.getElementById("staffTableBody");
            if (!tableBody) return;
            let staff = Storage.get("aat_staff");
            if (!staff.find(s => s.role === 'Admin')) {
                staff.unshift({ staff_id: "STF-0000", name: "Super Admin", email: "admin@aat.com", role: "Admin", status: "Active" });
            }
            tableBody.innerHTML = staff.map(s => {
                let roleBadge = s.role === 'Admin' ? 'bg-primary-light' : (s.role === 'Manager' ? 'bg-warning-light' : 'bg-success-light');
                let statusBadge = s.status === 'Active' ? 'bg-success-light' : 'bg-danger-light';
                let actionHtml = s.email !== 'admin@aat.com' ? `<button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem;" data-action="toggle-staff-status" data-id="${s.staff_id}">${s.status === 'Active' ? 'Disable' : 'Enable'}</button> <button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);" data-action="delete-staff" data-id="${s.staff_id}"><i class="fas fa-trash"></i></button>` : '';
                return `<tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.email}</td>
                    <td><span class="status-badge ${roleBadge}">${s.role}</span></td>
                    <td><span class="status-badge ${statusBadge}">${s.status}</span></td>
                    <td style="text-align: right;">${actionHtml}</td>
                </tr>`;
            }).join('');
        };
        renderTable();
        window.moduleRenderers = window.moduleRenderers || {};
        window.moduleRenderers.staff = renderTable;
    },

    reports: function () {
        const generateReport = () => {
            const monthVal = document.getElementById('reportMonth')?.value;
            if (!monthVal) return;

            const selectedDate = new Date(monthVal + "-01");
            const shortMonth = selectedDate.toLocaleDateString('en-GB', { month: 'short' });
            const yyyy_mm = monthVal;

            let tickets = Storage.get("aat_tickets");
            let invoices = Storage.get("aat_invoices");
            let expenses = Storage.get("aat_expenses");

            let mSales = 0, mProfit = 0, mExpenses = 0;
            let periodTickets = tickets.filter(t => t.date && t.date.includes(shortMonth));

            invoices.forEach(inv => {
                if (inv.date && inv.date.includes(shortMonth)) {
                    mSales += parseFloat(inv.amount || inv.selling_price || 0);
                    mProfit += parseFloat(inv.profit || 0);
                }
            });

            expenses.forEach(exp => {
                if (exp.date && exp.date.startsWith(yyyy_mm)) {
                    mExpenses += parseFloat(exp.amount || 0);
                }
            });

            let netProfit = mProfit - mExpenses;

            if (document.getElementById('repSales')) document.getElementById('repSales').textContent = Format.currency(mSales);
            if (document.getElementById('repProfit')) document.getElementById('repProfit').innerHTML = `<span class="status-badge ${mProfit >= 0 ? 'bg-success-light' : 'bg-danger-light'}" style="font-size: 1.1rem; padding: 4px 12px;">${Format.currency(mProfit)}</span>`;
            if (document.getElementById('repExpenses')) document.getElementById('repExpenses').textContent = Format.currency(mExpenses);
            if (document.getElementById('repNetProfit')) document.getElementById('repNetProfit').innerHTML = `<span class="status-badge ${netProfit >= 0 ? 'bg-success-light' : 'bg-danger-light'}" style="color: ${netProfit >= 0 ? '#8b5cf6' : 'var(--danger)'}; font-size: 1.1rem; padding: 4px 12px;">${Format.currency(netProfit)}</span>`;

            let routeCounts = {};
            periodTickets.forEach(t => {
                let route = t.route || t.outbound || "Unknown Route";
                routeCounts[route] = (routeCounts[route] || 0) + 1;
            });

            let sortedRoutes = Object.keys(routeCounts).map(r => ({ route: r, count: routeCounts[r] })).sort((a, b) => b.count - a.count).slice(0, 5);
            if (document.getElementById('repRoutesList')) document.getElementById('repRoutesList').innerHTML = sortedRoutes.length > 0 ? sortedRoutes.map((r, idx) => `<div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                <div style="font-weight: 500; color: #0f172a;"><span style="color: #94a3b8; margin-right: 8px;">#${idx + 1}</span> ${r.route}</div>
                <div style="font-weight: 600; color: #2563eb;">${r.count} <span style="font-size: 0.8rem; font-weight: 500; color: #64748b;">Sold</span></div>
            </div>`).join('') : `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No routes sold this month.</div>`;

            let clientRevenue = {};
            invoices.forEach(inv => {
                if (inv.date && inv.date.includes(shortMonth)) {
                    let cName = inv.client_name || "Unknown Client";
                    clientRevenue[cName] = (clientRevenue[cName] || 0) + parseFloat(inv.amount || inv.selling_price || 0);
                }
            });

            let sortedClients = Object.keys(clientRevenue).map(c => ({ client: c, revenue: clientRevenue[c] })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
            if (document.getElementById('repClientsList')) document.getElementById('repClientsList').innerHTML = sortedClients.length > 0 ? sortedClients.map((c, idx) => `<div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                <div style="font-weight: 500; color: #0f172a;"><span style="color: #94a3b8; margin-right: 8px;">#${idx + 1}</span> ${c.client}</div>
                <div style="font-weight: 600; color: #16a34a;">${Format.currency(c.revenue)}</div>
            </div>`).join('') : `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No clients served this month.</div>`;

            if (document.getElementById('reportResults')) document.getElementById('reportResults').style.display = 'block';
        };

        if (document.getElementById('reportMonth')) {
            document.getElementById('reportMonth').value = new Date().toISOString().slice(0, 7);
            generateReport();
        }
        window.moduleRenderers = window.moduleRenderers || {};
        window.moduleRenderers.reports = generateReport;
    },

    suppliers: function () {
        const renderTable = () => {
            const tableBody = document.getElementById("suppliersTableBody");
            if (!tableBody) return;
            let suppliers = Storage.get("aat_suppliers");
            if (suppliers.length > 0) {
                tableBody.innerHTML = suppliers.sort((a, b) => (b.balance_payable || 0) - (a.balance_payable || 0)).map(s => `<tr>
                    <td style="font-weight: 600;">${s.supplier_name}</td>
                    <td>${s.airline || '-'}</td>
                    <td>${s.total_tickets || 0} Tickets</td>
                    <td>${Format.currency(s.total_cost)}</td>
                    <td style="color: var(--danger); font-weight: 600;">${Format.currency(s.balance_payable)}</td>
                </tr>`).join('');
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">No suppliers recorded yet.</td></tr>`;
            }
        };
        renderTable();
        window.moduleRenderers = window.moduleRenderers || {};
        window.moduleRenderers.suppliers = renderTable;
    },

    'supplier-payments': function () {
        const renderData = () => {
            const tableBody = document.getElementById("suppliersTableBody");
            const selectDropdown = document.getElementById("supplierSelect");
            if (!tableBody || !selectDropdown) return;

            let suppliers = Storage.get("aat_suppliers");
            tableBody.innerHTML = "";
            selectDropdown.innerHTML = '<option value="" disabled selected>Select Supplier</option>';

            if (suppliers.length > 0) {
                suppliers.sort((a, b) => (b.balance_payable || 0) - (a.balance_payable || 0)).forEach(s => {
                    let totalBilled = s.total_cost || 0;
                    let balanceRemaining = s.balance_payable || 0;
                    let amountPaid = s.amount_paid !== undefined ? s.amount_paid : (totalBilled - balanceRemaining);

                    tableBody.innerHTML += `<tr>
                        <td style="font-weight: 600;">${s.supplier_name}</td>
                        <td>${s.airline || '-'}</td>
                        <td>${Format.currency(totalBilled)}</td>
                        <td style="color: var(--success); font-weight: 600;">${Format.currency(amountPaid)}</td>
                        <td style="color: var(--danger); font-weight: 600;">${Format.currency(balanceRemaining)}</td>
                    </tr>`;

                    if (balanceRemaining > 0) {
                        selectDropdown.innerHTML += `<option value="${s.supplier_name}">${s.supplier_name} (Owes: ${Format.currency(balanceRemaining)})</option>`;
                    }
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">No suppliers recorded yet.</td></tr>`;
                selectDropdown.innerHTML = '<option value="" disabled>No suppliers found</option>';
            }
        };
        if (document.getElementById('paymentDate')) document.getElementById('paymentDate').valueAsDate = new Date();
        renderData();
        window.moduleRenderers = window.moduleRenderers || {};
        window.moduleRenderers['supplier-payments'] = renderData;
    },

    backup: function () {
        const backupInput = document.getElementById('backupFileInput');
        if (backupInput) {
            backupInput.addEventListener('change', function (e) {
                let file = e.target.files[0];
                if (!file) return;
                let reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        let importedData = JSON.parse(e.target.result);
                        if (importedData._metadata) {
                            if (confirm(`This backup is from ${new Date(importedData._metadata.timestamp).toLocaleString()}.\n\nRestoring it will overwrite current portal data completely. Are you absolutely sure you want to proceed?`)) {
                                Object.keys(importedData).forEach(k => {
                                    if (k.startsWith('aat_')) {
                                        localStorage.setItem(k, JSON.stringify(importedData[k]));
                                    }
                                });
                                showAlert('System successfully restored. Reloading page...', 'success');
                                setTimeout(() => { window.location.reload(); }, 1500);
                            }
                        } else {
                            showAlert('Invalid backup file. Missing system metadata.', 'danger');
                        }
                    } catch (err) {
                        showAlert('Failed to parse JSON file.', 'danger');
                    }
                };
                reader.readAsText(file);
                this.value = null;
            });
        }
    }
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

    // ---- NEW TICKET FORM ----
    if (e.target.id === 'ticketForm') {
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

        // Auto Generate Invoice
        let currentYear = new Date().getFullYear();
        let invoices = Storage.get('aat_invoices');
        let yearInvoices = invoices.filter(i => i.invoice_id && i.invoice_id.includes(`INV-${currentYear}-`));
        let lastInvNumber = yearInvoices.length > 0 ? (parseInt(yearInvoices[yearInvoices.length - 1].invoice_id.split('-')[2]) || 0) : 0;

        const newInvoice = {
            invoice_id: `INV-${currentYear}-${String(lastInvNumber + 1).padStart(4, '0')}`,
            ticket_id: newTicket.ticket_id,
            client_name: newTicket.client_name,
            date: newTicket.date,
            amount: newTicket.selling_price,
            cost_price: newTicket.cost_price,
            profit: newTicket.profit,
            payment_status: newTicket.payment_status
        };
        Storage.add('aat_invoices', newInvoice);

        // Update Client Insights
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

        showAlert('Ticket generated and saved successfully!', 'success');
        e.target.reset();

        // Reset read only fields
        if (document.getElementById('profitAmount')) document.getElementById('profitAmount').value = '';
        if (document.getElementById('balanceAmount')) document.getElementById('balanceAmount').value = '';
    }

    // ---- ADD STAFF FORM ----
    if (e.target.id === 'newStaffForm') {
        e.preventDefault();
        const staff = {
            staff_id: 'STF-' + Date.now().toString().slice(-4),
            name: document.getElementById('staffName').value.trim(),
            email: document.getElementById('staffEmail').value.trim(),
            role: document.getElementById('staffRole').value,
            password: document.getElementById('staffPassword').value,
            status: 'Active'
        };
        Storage.add('aat_staff', staff);
        e.target.reset();
        showAlert("Staff account successfully created.", "success");
        if (window.moduleRenderers && window.moduleRenderers.staff) window.moduleRenderers.staff();
    }

    // ---- RECORD SUPPLIER PAYMENT FORM ----
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
                showAlert(`Error: Payment amount (Rs ${amount}) cannot exceed the balance due (Rs ${currentBalance}).`, 'danger');
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
            showAlert(`Payment of Rs ${amount.toLocaleString()} successfully recorded for ${selectedName}.`, 'success');
            if (window.moduleRenderers && window.moduleRenderers['supplier-payments']) window.moduleRenderers['supplier-payments']();
        }
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
