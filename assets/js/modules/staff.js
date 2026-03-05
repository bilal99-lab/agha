window.PageModule = {
    init: function () {
        this.render();
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="toggle-staff-status"]')) {
                const id = e.target.closest('[data-action="toggle-staff-status"]').getAttribute('data-id');
                Storage.update('aat_staff', s => s.staff_id === id, s => {
                    s.status = s.status === 'Active' ? 'Disabled' : 'Active'; return s;
                });
                UI.showAlert('Staff status updated.', 'success');
                this.render();
            } else if (e.target.closest('[data-action="delete-staff"]')) {
                const id = e.target.closest('[data-action="delete-staff"]').getAttribute('data-id');
                if (confirm('Are you sure you want to delete this staff account?')) {
                    Storage.remove('aat_staff', s => s.staff_id === id);
                    UI.showAlert('Staff account deleted.', 'success');
                    this.render();
                }
            }
        });

        document.addEventListener('submit', (e) => {
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
                UI.showAlert("Staff account successfully created.", "success");
                this.render();
            }
        });
    },
    render: function () {
        let staff = Storage.get("aat_staff");
        if (!staff.find(s => s.role === 'Admin')) {
            staff.unshift({ staff_id: "STF-0000", name: "Super Admin", email: "admin@aat.com", role: "Admin", status: "Active" });
        }
        let htmlContext = staff.map(s => {
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
        UI.renderTable('staffTableBody', htmlContext, 'No staff members found.');
    }
};
