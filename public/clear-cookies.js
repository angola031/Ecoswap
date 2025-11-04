// Script para limpiar cookies problemáticas de Cloudflare
(function() {
    'use strict';
    
    // Función para eliminar cookies
    function deleteCookie(name, domain) {
        const domains = domain ? [domain, `.${domain}`] : ['', window.location.hostname, `.${window.location.hostname}`];
        
        domains.forEach(d => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${d}`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
    }
    
    // Cookies problemáticas de Cloudflare
    const problematicCookies = [
        '__cf_bm',
        '__cfruid', 
        '__cfduid',
        'cf_clearance'
    ];
    
    // Limpiar cookies problemáticas
    problematicCookies.forEach(cookie => {
        deleteCookie(cookie);
    });
    
    // Interceptar errores de cookies
    const originalConsoleError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('__cf_bm') || message.includes('cookie')) {
            // Limpiar cookies cuando se detecte el error
            problematicCookies.forEach(cookie => {
                deleteCookie(cookie);
            });
        }
        originalConsoleError.apply(console, args);
    };
    
    // Limpiar cookies cada 10 segundos
    setInterval(() => {
        problematicCookies.forEach(cookie => {
            deleteCookie(cookie);
        });
    }, 10000);
    
})();


















