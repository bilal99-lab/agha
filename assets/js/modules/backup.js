window.PageModule = {
    init: function () {
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#exportDataBtn')) {
                const keys = ['aat_tickets', 'aat_clients', 'aat_invoices', 'aat_ledger', 'aat_expenses', 'aat_suppliers', 'aat_staff', 'aat_umrah_entries'];
                let backupObj = {};
                keys.forEach(k => { backupObj[k] = Storage.get(k); });
                backupObj._metadata = { timestamp: new Date().toISOString(), version: '1.0' };
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", `AAT_Backup_${new Date().toISOString().split('T')[0]}.json`);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
                UI.showAlert('Backup successfully exported to your device.', 'success');
            }
        });

        const fileInput = document.getElementById('importDataFile');
        if (fileInput) {
            fileInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (evt) {
                    try {
                        const importedData = JSON.parse(evt.target.result);
                        if (importedData._metadata) {
                            if (confirm(`This backup is from ${new Date(importedData._metadata.timestamp).toLocaleString()}.\n\nRestoring it will overwrite current portal data completely. Are you absolutely sure you want to proceed?`)) {
                                Object.keys(importedData).forEach(k => {
                                    if (k.startsWith('aat_')) {
                                        localStorage.setItem(k, JSON.stringify(importedData[k]));
                                    }
                                });
                                UI.showAlert('System successfully restored. Reloading page...', 'success');
                                setTimeout(() => { window.location.reload(); }, 1500);
                            }
                        } else {
                            UI.showAlert('Invalid backup file. Missing system metadata.', 'danger');
                        }
                    } catch (err) {
                        UI.showAlert('Failed to parse JSON file.', 'danger');
                    }
                };
                reader.readAsText(file);
                this.value = null;
            });
        }
    },
    render: function () { }
};
