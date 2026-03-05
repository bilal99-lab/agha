/*
 * AAT Travel Portal - Global Core Engine Loader
 * Centralized Module Controller & Dynamic Routing
 */

window.Portal = {
    navigate: (page) => {
        window.location.href = page;
    },
    loadScript: (src) => {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    },
    init: async () => {
        try {
            // 1. Load Core Dependencies in strict sequence
            await Portal.loadScript('../assets/js/storage.js');
            await Portal.loadScript('../assets/js/ui.js');

            // 2. Identify the page from the DOM
            const page = document.body.dataset.page;

            // Login does not use modules
            if (page && page !== "login") {
                // 3. Load the specific page logic
                await Portal.loadScript(`../assets/js/modules/${page}.js`);

                // 4. Safely execute standard module interface
                if (window.PageModule) {
                    if (typeof window.PageModule.init === 'function') {
                        window.PageModule.init();
                    } else {
                        // Fallback execution
                        if (typeof window.PageModule.render === 'function') window.PageModule.render();
                        if (typeof window.PageModule.bindEvents === 'function') window.PageModule.bindEvents();
                    }
                }
            }
        } catch (error) {
            console.error('Portal Initialization Failure:', error);
            if (window.UI && typeof window.UI.showAlert === 'function') {
                window.UI.showAlert('System Error: Required modules failed to load.', 'danger');
            } else {
                alert('Crucial system files failed to load. Please check your connection or contact IT.');
            }
        }
    }
};

// Bootstrap the Portal Engine
document.addEventListener("DOMContentLoaded", Portal.init);

// Optional: Global Event Delegation Hook
document.addEventListener("click", function (e) {
    // Intercept any app-wide global elements here
});
