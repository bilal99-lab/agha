window.UI = {
    formatCurrency: (amount) => 'Rs ' + (parseFloat(amount) || 0).toLocaleString(),
    formatDate: (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    showAlert: (msg, type = 'success', containerId = 'globalAlert') => {
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
    },
    renderTable: (containerId, htmlContent, emptyMessage = 'No data available.') => {
        const tableBody = document.getElementById(containerId);
        if (!tableBody) return;
        if (!htmlContent) {
            tableBody.innerHTML = `<tr><td colspan="100%" style="text-align: center; color: var(--text-muted); padding: 32px;">${emptyMessage}</td></tr>`;
        } else {
            tableBody.innerHTML = htmlContent;
        }
    }
};
