/*
 * AAT Travel Portal - Ticket Invoice Module
 * Full ERP-style invoice creation with dynamic passengers, flights, fare breakdown
 */

window.PageModule = {
    init() {
        this.populateDropdowns();
        this.setDefaults();
        this.addPassengerRow();    // Start with 1 passenger row
        this.addFlightRow('outboundBody'); // Start with 1 outbound segment
        this.bindEvents();
        this.recalculate();
    },

    /* ---- Populate Client & Vendor Dropdowns ---- */
    populateDropdowns() {
        const clients = JSON.parse(localStorage.getItem('aat_clients') || '[]');
        const suppliers = JSON.parse(localStorage.getItem('aat_suppliers') || '[]');
        const clientSelect = document.getElementById('invoiceClient');
        const vendorSelect = document.getElementById('invoiceVendor');

        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.client_name || c.name || '';
            opt.textContent = opt.value;
            clientSelect.appendChild(opt);
        });

        suppliers.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.supplier_name || s.name || '';
            opt.textContent = opt.value;
            vendorSelect.appendChild(opt);
        });
    },

    /* ---- Defaults ---- */
    setDefaults() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('issueDate').value = today;

        // Auto-generate invoice number
        const invoices = JSON.parse(localStorage.getItem('aat_invoices') || '[]');
        const num = String(invoices.length + 1).padStart(5, '0');
        document.getElementById('invoiceNumber').value = 'AAT-INV-' + num;
    },

    /* ---- Event Binding (Delegated) ---- */
    bindEvents() {
        const self = this;

        // Toggle: Selling To
        document.getElementById('sellingToToggle').addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            if (!btn) return;
            document.querySelectorAll('#sellingToToggle .toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });

        // Add Passenger
        document.getElementById('btnAddPassenger').addEventListener('click', () => self.addPassengerRow());

        // Add Outbound Segment
        document.getElementById('btnAddOutbound').addEventListener('click', () => self.addFlightRow('outboundBody'));

        // Add Inbound Segment
        document.getElementById('btnAddInbound').addEventListener('click', () => {
            const empty = document.getElementById('inboundEmpty');
            if (empty) empty.remove();
            self.addFlightRow('inboundBody');
        });

        // Delete row delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-row')) {
                e.target.closest('tr').remove();
            }
        });

        // Fare input live calculation
        document.querySelectorAll('.fare-input').forEach(input => {
            input.addEventListener('input', () => self.recalculate());
        });

        // Form submit
        document.getElementById('ticketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            self.saveInvoice();
        });

        // Generate PDF
        document.getElementById('btnGeneratePdf').addEventListener('click', () => self.generatePdf());

        // WhatsApp
        document.getElementById('btnWhatsapp').addEventListener('click', () => self.sendWhatsApp());
    },

    /* ---- Dynamic Passenger Row ---- */
    addPassengerRow() {
        const tbody = document.getElementById('passengerBody');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><select class="form-control pax-title" style="width:65px;padding:6px 4px;font-size:0.75rem;">
                <option>Mr</option><option>Mrs</option><option>Ms</option><option>Mstr</option><option>Miss</option>
            </select></td>
            <td><input type="text" class="form-control pax-given" placeholder="Given Name" style="width:110px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="text" class="form-control pax-surname" placeholder="Surname" style="width:100px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><select class="form-control pax-type" style="width:80px;padding:6px 4px;font-size:0.75rem;">
                <option>Adult</option><option>Child</option><option>Infant</option>
            </select></td>
            <td><input type="text" class="form-control pax-passport" placeholder="Passport" style="width:100px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="date" class="form-control pax-expiry" style="width:120px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="date" class="form-control pax-dob" style="width:120px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="text" class="form-control pax-pnr" placeholder="PNR" style="width:80px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="text" class="form-control pax-ticket" placeholder="Ticket #" style="width:100px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><button type="button" class="btn-delete-row" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.9rem;padding:4px;"><i class="fas fa-trash-alt"></i></button></td>
        `;
        tbody.appendChild(tr);
    },

    /* ---- Dynamic Flight Row ---- */
    addFlightRow(tbodyId) {
        const tbody = document.getElementById(tbodyId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="form-control seg-airline" placeholder="e.g. PIA" style="width:80px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="text" class="form-control seg-flight" placeholder="PK-300" style="width:80px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="text" class="form-control seg-sector" placeholder="KHI-DXB" style="width:90px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="datetime-local" class="form-control seg-dep" style="width:160px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="datetime-local" class="form-control seg-arr" style="width:160px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><input type="text" class="form-control seg-baggage" placeholder="30kg" style="width:70px;padding:6px 8px;font-size:0.75rem;"></td>
            <td><button type="button" class="btn-delete-row" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.9rem;padding:4px;"><i class="fas fa-trash-alt"></i></button></td>
        `;
        tbody.appendChild(tr);
    },

    /* ---- Live Fare Calculations ---- */
    recalculate() {
        const v = (id) => parseFloat(document.getElementById(id).value) || 0;

        // Per-type totals
        const adultTotalRate = v('adultQty') * v('adultRate');
        const adultTotalCost = v('adultQty') * v('adultCost');
        const childTotalRate = v('childQty') * v('childRate');
        const childTotalCost = v('childQty') * v('childCost');
        const infantTotalRate = v('infantQty') * v('infantRate');
        const infantTotalCost = v('infantQty') * v('infantCost');

        document.getElementById('adultTotalRate').textContent = 'Rs ' + adultTotalRate.toLocaleString();
        document.getElementById('adultTotalCost').textContent = 'Rs ' + adultTotalCost.toLocaleString();
        document.getElementById('childTotalRate').textContent = 'Rs ' + childTotalRate.toLocaleString();
        document.getElementById('childTotalCost').textContent = 'Rs ' + childTotalCost.toLocaleString();
        document.getElementById('infantTotalRate').textContent = 'Rs ' + infantTotalRate.toLocaleString();
        document.getElementById('infantTotalCost').textContent = 'Rs ' + infantTotalCost.toLocaleString();

        // Summary
        const totalFare = adultTotalRate + childTotalRate + infantTotalRate;
        const totalCost = adultTotalCost + childTotalCost + infantTotalCost;
        const serviceFee = v('serviceFee');
        const discount = v('discountAmount');
        const grandTotal = totalFare + serviceFee - discount;
        const netProfit = grandTotal - totalCost;

        document.getElementById('sumTotalFare').textContent = 'Rs ' + totalFare.toLocaleString();
        document.getElementById('sumServiceFee').textContent = 'Rs ' + serviceFee.toLocaleString();
        document.getElementById('sumDiscount').textContent = '- Rs ' + discount.toLocaleString();
        document.getElementById('sumGrandTotal').textContent = 'Rs ' + grandTotal.toLocaleString();
        document.getElementById('sumTotalCost').textContent = 'Rs ' + totalCost.toLocaleString();
        document.getElementById('sumNetProfit').textContent = 'Rs ' + netProfit.toLocaleString();

        // Profit row color
        const profitRow = document.getElementById('profitRow');
        if (netProfit > 0) {
            profitRow.style.background = 'rgba(46,160,67,0.12)';
            document.getElementById('sumNetProfit').style.color = '#3fb950';
        } else if (netProfit < 0) {
            profitRow.style.background = 'rgba(248,81,73,0.12)';
            document.getElementById('sumNetProfit').style.color = '#f85149';
        } else {
            profitRow.style.background = 'rgba(255,255,255,0.03)';
            document.getElementById('sumNetProfit').style.color = 'var(--text-primary)';
        }
    },

    /* ---- Collect Passenger Data ---- */
    getPassengers() {
        const rows = document.querySelectorAll('#passengerBody tr');
        return Array.from(rows).map(row => ({
            title: row.querySelector('.pax-title')?.value || '',
            given_name: row.querySelector('.pax-given')?.value || '',
            surname: row.querySelector('.pax-surname')?.value || '',
            type: row.querySelector('.pax-type')?.value || '',
            passport: row.querySelector('.pax-passport')?.value || '',
            expiry: row.querySelector('.pax-expiry')?.value || '',
            dob: row.querySelector('.pax-dob')?.value || '',
            pnr: row.querySelector('.pax-pnr')?.value || '',
            ticket_number: row.querySelector('.pax-ticket')?.value || ''
        }));
    },

    /* ---- Collect Flight Data ---- */
    getFlights(tbodyId) {
        const rows = document.querySelectorAll(`#${tbodyId} tr:not(#inboundEmpty)`);
        return Array.from(rows).map(row => ({
            airline: row.querySelector('.seg-airline')?.value || '',
            flight: row.querySelector('.seg-flight')?.value || '',
            sector: row.querySelector('.seg-sector')?.value || '',
            departure: row.querySelector('.seg-dep')?.value || '',
            arrival: row.querySelector('.seg-arr')?.value || '',
            baggage: row.querySelector('.seg-baggage')?.value || ''
        }));
    },

    /* ---- Save Invoice ---- */
    saveInvoice() {
        const v = (id) => parseFloat(document.getElementById(id).value) || 0;
        const t = (id) => (document.getElementById(id).value || '').trim();

        const client = t('invoiceClient');
        if (!client) {
            if (window.UI) UI.showAlert('Please select a customer.', 'danger');
            return;
        }

        const adultTotalRate = v('adultQty') * v('adultRate');
        const childTotalRate = v('childQty') * v('childRate');
        const infantTotalRate = v('infantQty') * v('infantRate');
        const adultTotalCost = v('adultQty') * v('adultCost');
        const childTotalCost = v('childQty') * v('childCost');
        const infantTotalCost = v('infantQty') * v('infantCost');

        const totalFare = adultTotalRate + childTotalRate + infantTotalRate;
        const totalCost = adultTotalCost + childTotalCost + infantTotalCost;
        const serviceFee = v('serviceFee');
        const discount = v('discountAmount');
        const grandTotal = totalFare + serviceFee - discount;
        const netProfit = grandTotal - totalCost;

        const sellingTo = document.querySelector('#sellingToToggle .toggle-btn.active')?.dataset.value || 'agency';

        const invoice = {
            invoice_id: t('invoiceNumber') || ('AAT-INV-' + Date.now()),
            selling_to: sellingTo,
            client: client,
            vendor: t('invoiceVendor'),
            date: t('issueDate'),
            due_date: t('dueDate'),
            status: t('invoiceStatus'),
            meal_included: t('mealIncluded'),
            passengers: this.getPassengers(),
            outbound_flights: this.getFlights('outboundBody'),
            inbound_flights: this.getFlights('inboundBody'),
            fare: {
                adults: { qty: v('adultQty'), rate: v('adultRate'), cost: v('adultCost') },
                children: { qty: v('childQty'), rate: v('childRate'), cost: v('childCost') },
                infants: { qty: v('infantQty'), rate: v('infantRate'), cost: v('infantCost') },
                service_fee: serviceFee,
                discount: discount
            },
            total_fare: totalFare,
            total_cost: totalCost,
            grand_total: grandTotal,
            profit: netProfit,
            created_at: new Date().toISOString()
        };

        // Save to aat_invoices
        const invoices = JSON.parse(localStorage.getItem('aat_invoices') || '[]');
        invoices.push(invoice);
        localStorage.setItem('aat_invoices', JSON.stringify(invoices));

        // Also save as a ticket record for aat_tickets
        const tickets = JSON.parse(localStorage.getItem('aat_tickets') || '[]');
        const paxList = invoice.passengers;
        const route = invoice.outbound_flights.length > 0 ? invoice.outbound_flights[0].sector : '';

        tickets.push({
            ticket_id: 'TKT-' + Date.now(),
            invoice_id: invoice.invoice_id,
            pnr: paxList.length > 0 ? paxList[0].pnr : '',
            client_name: client,
            airline: invoice.outbound_flights.length > 0 ? invoice.outbound_flights[0].airline : '',
            route: route,
            travel_date: invoice.date,
            selling_price: grandTotal,
            cost_price: totalCost,
            profit: netProfit,
            status: invoice.status,
            created_at: invoice.created_at
        });
        localStorage.setItem('aat_tickets', JSON.stringify(tickets));

        // Update client record
        this.updateClientHistory(client, grandTotal, netProfit);

        // Add to ledger
        const ledger = JSON.parse(localStorage.getItem('aat_ledger') || '[]');
        ledger.push({
            id: 'LED-' + Date.now(),
            date: invoice.date,
            type: 'Income',
            description: 'Ticket Invoice ' + invoice.invoice_id + ' — ' + client,
            amount: grandTotal,
            reference: invoice.invoice_id
        });
        localStorage.setItem('aat_ledger', JSON.stringify(ledger));

        if (window.UI) UI.showAlert('Invoice saved successfully! (' + invoice.invoice_id + ')', 'success');

        // Reset invoice number for next entry
        const newNum = String(invoices.length + 1).padStart(5, '0');
        document.getElementById('invoiceNumber').value = 'AAT-INV-' + newNum;
    },

    /* ---- Update Client History ---- */
    updateClientHistory(clientName, amount, profit) {
        const clients = JSON.parse(localStorage.getItem('aat_clients') || '[]');
        const idx = clients.findIndex(c => (c.client_name || c.name) === clientName);
        if (idx !== -1) {
            clients[idx].total_tickets = (clients[idx].total_tickets || 0) + 1;
            clients[idx].total_spent = (clients[idx].total_spent || 0) + amount;
            clients[idx].total_profit_generated = (clients[idx].total_profit_generated || 0) + profit;
            clients[idx].last_travel_date = new Date().toISOString().split('T')[0];
            localStorage.setItem('aat_clients', JSON.stringify(clients));
        }
    },

    /* ---- PDF Generation ---- */
    generatePdf() {
        const client = document.getElementById('invoiceClient').value;
        const invNum = document.getElementById('invoiceNumber').value;
        if (!client) { alert('Please select a customer first.'); return; }

        const pax = this.getPassengers();
        const flights = this.getFlights('outboundBody');

        let html = `<html><head><title>Invoice ${invNum}</title>
        <style>
            body{font-family:Arial,sans-serif;padding:40px;color:#222;}
            h1{color:#1a1d26;margin-bottom:4px;}
            .sub{color:#666;font-size:13px;margin-bottom:24px;}
            table{width:100%;border-collapse:collapse;margin:16px 0;}
            th,td{border:1px solid #ddd;padding:8px 10px;text-align:left;font-size:12px;}
            th{background:#f4f4f4;font-weight:600;}
            .total-row{font-weight:700;background:#e8f5e9;}
            .footer{margin-top:30px;text-align:center;color:#888;font-size:11px;}
        </style></head><body>
        <h1>Agha Air Travel</h1>
        <p class="sub">Invoice: ${invNum} | Date: ${document.getElementById('issueDate').value} | Customer: ${client}</p>
        <table><thead><tr><th>Title</th><th>Name</th><th>Type</th><th>Passport</th><th>PNR</th><th>Ticket #</th></tr></thead><tbody>`;

        pax.forEach(p => {
            html += `<tr><td>${p.title}</td><td>${p.given_name} ${p.surname}</td><td>${p.type}</td><td>${p.passport}</td><td>${p.pnr}</td><td>${p.ticket_number}</td></tr>`;
        });

        html += `</tbody></table>`;
        html += `<table><thead><tr><th>Airline</th><th>Flight</th><th>Sector</th><th>Departure</th><th>Arrival</th><th>Baggage</th></tr></thead><tbody>`;

        flights.forEach(f => {
            html += `<tr><td>${f.airline}</td><td>${f.flight}</td><td>${f.sector}</td><td>${f.departure}</td><td>${f.arrival}</td><td>${f.baggage}</td></tr>`;
        });

        html += `</tbody></table>`;
        html += `<table>
            <tr><td>Total Fare</td><td>${document.getElementById('sumTotalFare').textContent}</td></tr>
            <tr><td>Service Fee</td><td>${document.getElementById('sumServiceFee').textContent}</td></tr>
            <tr><td>Discount</td><td>${document.getElementById('sumDiscount').textContent}</td></tr>
            <tr class="total-row"><td>Grand Total</td><td>${document.getElementById('sumGrandTotal').textContent}</td></tr>
        </table>`;
        html += `<div class="footer">Thank you for choosing Agha Air Travel</div></body></html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
    },

    /* ---- WhatsApp ---- */
    sendWhatsApp() {
        const client = document.getElementById('invoiceClient').value;
        const invNum = document.getElementById('invoiceNumber').value;
        const grand = document.getElementById('sumGrandTotal').textContent;
        const msg = `Hi, your ticket invoice ${invNum} has been created.\nGrand Total: ${grand}\n\nThank you for choosing Agha Air Travel.`;
        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    }
};
