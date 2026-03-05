window.PageModule = {
    init: function () {
        this.render();
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="mark-paid-invoice"]')) {
                const id = e.target.closest('[data-action="mark-paid-invoice"]').getAttribute('data-id');
                if (confirm('Mark this invoice as PAID?')) {
                    Storage.update('aat_invoices', i => i.invoice_id === id, i => { i.payment_status = 'Paid'; return i; });
                    let inv = Storage.get('aat_invoices').find(i => i.invoice_id === id);
                    if (inv && inv.ticket_id) {
                        Storage.update('aat_tickets', t => t.ticket_id === inv.ticket_id, t => { t.payment_status = 'Paid'; t.balance = 0; return t; });
                    }
                    UI.showAlert('Invoice marked as paid.', 'success');
                    this.render();
                }
            } else if (e.target.closest('[data-action="print-invoice"]')) {
                const id = e.target.closest('[data-action="print-invoice"]').getAttribute('data-id');
                let inv = Storage.get('aat_invoices').find(i => i.invoice_id === id);
                if (inv) {
                    const setVal = (vid, val) => { if (document.getElementById(vid)) document.getElementById(vid).textContent = val; };
                    setVal('printInvoiceId', inv.invoice_id);
                    setVal('printClientName', inv.client_name);
                    setVal('printDate', UI.formatDate(inv.date));
                    setVal('printAmount', UI.formatCurrency(inv.amount));
                    setVal('printTotalAmount', UI.formatCurrency(inv.amount));
                    let tkt = Storage.get('aat_tickets').find(t => t.ticket_id === inv.ticket_id);
                    setVal('printRoute', tkt ? (tkt.route || tkt.airline) : 'Flight Booking');
                    document.getElementById('printTicketArea').style.display = 'none';
                    document.getElementById('printArea').style.display = 'block';
                    window.print();
                }
            } else if (e.target.closest('[data-action="print-ticket"]')) {
                const tktId = e.target.closest('[data-action="print-ticket"]').getAttribute('data-id');
                let tkt = Storage.get('aat_tickets').find(t => t.ticket_id === tktId);
                let inv = Storage.get('aat_invoices').find(i => i.ticket_id === tktId);
                if (tkt) {
                    const setVal = (vid, val) => { if (document.getElementById(vid)) document.getElementById(vid).textContent = val; };
                    setVal('tktPrintDate', UI.formatDate(tkt.date));
                    setVal('tktPrintName', tkt.client_name);
                    setVal('tktPrintPnr', tkt.pnr);
                    setVal('tktPrintRoute', tkt.route || tkt.airline);
                    setVal('tktPrintAmount', UI.formatCurrency(tkt.selling_price));
                    setVal('tktPrintInv', inv ? inv.invoice_id : 'N/A');
                    document.getElementById('printArea').style.display = 'none';
                    document.getElementById('printTicketArea').style.display = 'block';
                    window.print();
                }
            } else if (e.target.closest('[data-action="whatsapp-invoice"]')) {
                const id = e.target.closest('[data-action="whatsapp-invoice"]').getAttribute('data-id');
                let inv = Storage.get('aat_invoices').find(i => i.invoice_id === id);
                let client = Storage.get('aat_clients').find(c => c.client_name === inv?.client_name);
                if (inv && client && client.phone) {
                    let phone = client.phone.replace(/[^0-9]/g, '');
                    if (!phone.startsWith('92')) phone = '92' + (phone.startsWith('0') ? phone.slice(1) : phone);
                    let text = encodeURIComponent(`Hello ${inv.client_name},\n\nHere are your invoice details from Agha Air Travel.\nInvoice ID: ${inv.invoice_id}\nAmount: Rs ${inv.amount.toLocaleString()}\nStatus: ${inv.payment_status}\n\nThank you for choosing us.`);
                    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                } else UI.showAlert('Client phone number not found.', 'danger');
            } else if (e.target.closest('[data-action="whatsapp-reminder"]')) {
                const id = e.target.closest('[data-action="whatsapp-reminder"]').getAttribute('data-id');
                let inv = Storage.get('aat_invoices').find(i => i.invoice_id === id);
                let client = Storage.get('aat_clients').find(c => c.client_name === inv?.client_name);
                if (inv && client && client.phone) {
                    let phone = client.phone.replace(/[^0-9]/g, '');
                    if (!phone.startsWith('92')) phone = '92' + (phone.startsWith('0') ? phone.slice(1) : phone);
                    let text = encodeURIComponent(`Reminder: Hello ${inv.client_name},\n\nThis is a gentle reminder regarding your pending payment of Rs ${inv.amount.toLocaleString()} for Invoice ${inv.invoice_id}.\n\nPlease arrange payment at your earliest convenience. Thank you. Agha Air Travel.`);
                    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                } else UI.showAlert('Client phone number not found.', 'danger');
            }
        });
    },
    render: function () {
        let invoices = Storage.get("aat_invoices");
        let htmlContext = '';
        if (invoices.length > 0) {
            htmlContext = invoices.reverse().map(inv => {
                let statusClass = inv.payment_status?.toLowerCase() === 'paid' ? 'bg-success-light' : 'bg-warning-light';
                let profitBadge = parseFloat(inv.profit) >= 0 ? "bg-success-light" : "bg-danger-light";
                return `<tr>
                    <td><strong>${inv.invoice_id}</strong></td>
                    <td>${UI.formatDate(inv.date)}</td>
                    <td>${inv.client_name || '-'}</td>
                    <td>${UI.formatCurrency(inv.amount)}</td>
                    <td><span class="status-badge ${profitBadge}">${UI.formatCurrency(inv.profit)}</span></td>
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
        }
        UI.renderTable('invoiceTableBody', htmlContext, 'No invoices generated.');
    }
};
