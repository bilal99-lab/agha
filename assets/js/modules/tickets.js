window.PageModule = {
    init: function () {
        this.bindEvents();
    },
    bindEvents: function () {
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
                    const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val; }
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
    render: function () { }
};
