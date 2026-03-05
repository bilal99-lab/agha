// Add this inside the head of HTML templates, right below the basic portal_logged_in check
// It enforces role restrictions and hides admin-only sidebar links for 'Staff' accounts.

document.addEventListener("DOMContentLoaded", function () {
    let currentUserStr = localStorage.getItem("portal_logged_in_user");
    if (!currentUserStr) return;

    let currentUser = JSON.parse(currentUserStr);

    // Update Topbar Profile Name
    const profileName = document.querySelector('.user-profile span:not(.avatar)');
    const avatar = document.querySelector('.user-profile .avatar');
    if (profileName && currentUser.name) {
        profileName.textContent = currentUser.name;
    }
    if (avatar && currentUser.name) {
        avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }

    // Role Enforcement
    const restrictedForStaff = ['dashboard.html', 'ledger.html', 'expenses.html', 'reports.html', 'staff.html', 'supplier-payments.html', 'backup.html', 'suppliers.html'];
    const restrictedForManager = ['ledger.html', 'staff.html', 'reports.html', 'supplier-payments.html', 'backup.html'];

    let restrictedPages = [];
    if (currentUser.role === 'Staff') {
        restrictedPages = restrictedForStaff;
    } else if (currentUser.role === 'Manager') {
        restrictedPages = restrictedForManager;
    }

    if (restrictedPages.length > 0) {
        // 1. Hide Sidebar Links
        const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        navItems.forEach(item => {
            let href = item.getAttribute('href');
            if (href && restrictedPages.includes(href)) {
                item.style.display = 'none';
            }
        });

        // 2. Redirect if already on restricted page
        let currentPage = window.location.pathname.split('/').pop();
        if (restrictedPages.includes(currentPage)) {
            // Block access
            document.body.innerHTML = `<div style="padding: 50px; text-align: center; color: #0f172a; font-family: sans-serif;">
                <h1>Access Denied</h1>
                <p>You do not have permission to view this page. Redirecting...</p>
            </div>`;
            setTimeout(() => {
                window.location.href = currentUser.role === 'Staff' ? "new-ticket.html" : "dashboard.html";
            }, 1000);
        }
    }
});
