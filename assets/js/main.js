/* ===================================
   ARCHIVO PRINCIPAL - ECOSWAP COLOMBIA
   =================================== */

// Aplicación principal de EcoSwap
const EcoSwapApp = {
    // Estado global de la aplicación
    state: {
        isAuthenticated: false,
        currentUser: null,
        currentScreen: 'auth',
        isLoading: false,
        notifications: [],
        theme: 'light',
        language: 'es',
        currency: 'COP'
    },

    // Inicialización de la aplicación
    init() {

        this.setupEventListeners();
        this.loadUserPreferences();
        this.checkAuthenticationStatus();
        this.setupTheme();
        this.setupLanguage();

    },

    // Configurar event listeners globales
    setupEventListeners() {
        // Event listener para cambios de tema del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.state.theme === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Event listener para cambios de idioma del sistema
        window.addEventListener('languagechange', () => {
            this.detectSystemLanguage();
        });

        // Event listener para cambios de moneda
        window.addEventListener('currencychange', () => {
            this.updateCurrencyDisplay();
        });

        // Event listener para notificaciones
        window.addEventListener('notification', (e) => {
            this.showNotification(e.detail.message, e.detail.type);
        });

        // Event listener para errores globales
        window.addEventListener('error', (e) => {
            console.error('Error global detectado:', e.error);
            this.handleGlobalError(e.error);
        });

        // Event listener para errores de promesas no manejadas
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promesa rechazada no manejada:', e.reason);
            this.handleGlobalError(e.reason);
        });
    },

    // Verificar estado de autenticación
    checkAuthenticationStatus() {
        try {
            const authToken = localStorage.getItem('ecoswap_auth_token');
            const userData = localStorage.getItem('ecoswap_user_data');

            if (authToken && userData) {
                this.state.isAuthenticated = true;
                this.state.currentUser = JSON.parse(userData);
                this.state.currentScreen = 'main';

                this.showScreen('main');
            } else {
                this.state.isAuthenticated = false;
                this.state.currentUser = null;
                this.state.currentScreen = 'auth';

                this.showScreen('auth');
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            this.logout();
        }
    },

    // Mostrar pantalla específica
    showScreen(screenName) {

        // Ocultar todas las pantallas
        const screens = document.querySelectorAll('.mockup-screen');
        screens.forEach(screen => {
            screen.style.display = 'none';
        });

        // Mostrar pantalla solicitada
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.style.display = 'block';
            this.state.currentScreen = screenName;

            // Animar entrada de pantalla
            targetScreen.classList.add('fade-in');

            // Cargar contenido específico si es necesario
            this.loadScreenContent(screenName);

            // Actualizar navegación si existe
            this.updateNavigation(screenName);

            // Actualizar título de la página
            this.updatePageTitle(screenName);

        } else {
            console.error(`❌ Pantalla ${screenName} no encontrada`);
        }
    },

    // Cargar contenido específico de pantalla
    loadScreenContent(screenName) {
        switch (screenName) {
            case 'auth':
                this.loadAuthContent();
                break;
            case 'main':
                this.loadMainContent();
                break;
            case 'products':
                this.loadProductsContent();
                break;
            case 'interactions':
                this.loadInteractionsContent();
                break;
            case 'chat':
                this.loadChatContent();
                break;
            case 'profile':
                this.loadProfileContent();
                break;
            default:
        }
    },

    // Cargar contenido de autenticación
    loadAuthContent() {

        // Verificar si AuthModule está disponible
        if (typeof AuthModule !== 'undefined') {
            AuthModule.init();
        } else {
            console.warn('⚠️ AuthModule no está disponible');
        }
    },

    // Cargar contenido principal
    loadMainContent() {

        // Verificar si CoreModule está disponible
        if (typeof CoreModule !== 'undefined') {
            CoreModule.init();
        } else {
            console.warn('⚠️ CoreModule no está disponible');
        }
    },

    // Cargar contenido de productos
    loadProductsContent() {

        // Verificar si ProductsModule está disponible
        if (typeof ProductsModule !== 'undefined') {
            ProductsModule.init();
        } else {
            console.warn('⚠️ ProductsModule no está disponible');
        }
    },

    // Cargar contenido de interacciones
    loadInteractionsContent() {

        // Verificar si InteractionsModule está disponible
        if (typeof InteractionsModule !== 'undefined') {
            InteractionsModule.init();
        } else {
            console.warn('⚠️ InteractionsModule no está disponible');
        }
    },

    // Cargar contenido de chat
    loadChatContent() {

        // Verificar si ChatModule está disponible
        if (typeof ChatModule !== 'undefined') {
            ChatModule.init();
        } else {
            console.warn('⚠️ ChatModule no está disponible');
        }
    },

    // Cargar contenido de perfil
    loadProfileContent() {

        // Verificar si ProfileModule está disponible
        if (typeof ProfileModule !== 'undefined') {
            ProfileModule.init();
        } else {
            console.warn('⚠️ ProfileModule no está disponible');
        }
    },

    // Actualizar navegación
    updateNavigation(screenName) {
        const navLinks = document.querySelectorAll('.nav-link, .nav-tab');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.screen === screenName || link.textContent.toLowerCase().includes(screenName)) {
                link.classList.add('active');
            }
        });
    },

    // Actualizar título de la página
    updatePageTitle(screenName) {
        const titles = {
            'auth': 'EcoSwap Colombia - Autenticación',
            'main': 'EcoSwap Colombia - Inicio',
            'products': 'EcoSwap Colombia - Productos',
            'interactions': 'EcoSwap Colombia - Interacciones',
            'chat': 'EcoSwap Colombia - Chat',
            'profile': 'EcoSwap Colombia - Mi Perfil'
        };

        const title = titles[screenName] || 'EcoSwap Colombia';
        document.title = title;
    },

    // Configurar tema
    setupTheme() {
        const savedTheme = localStorage.getItem('ecoswap_theme') || 'auto';
        this.state.theme = savedTheme;
        this.applyTheme(savedTheme);
    },

    // Aplicar tema
    applyTheme(theme) {
        const root = document.documentElement;

        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
        }

        // Guardar preferencia
        localStorage.setItem('ecoswap_theme', theme);

    },

    // Configurar idioma
    setupLanguage() {
        const savedLanguage = localStorage.getItem('ecoswap_language') || 'es';
        this.state.language = savedLanguage;
        this.applyLanguage(savedLanguage);
    },

    // Aplicar idioma
    applyLanguage(language) {
        // Aquí se implementaría la lógica de internacionalización
        document.documentElement.lang = language;

        // Guardar preferencia
        localStorage.setItem('ecoswap_language', language);

    },

    // Detectar idioma del sistema
    detectSystemLanguage() {
        const systemLang = navigator.language || navigator.userLanguage;
        const primaryLang = systemLang.split('-')[0];

        if (['es', 'en', 'pt'].includes(primaryLang)) {
            this.applyLanguage(primaryLang);
        }
    },

    // Actualizar visualización de moneda
    updateCurrencyDisplay() {
        const currencyElements = document.querySelectorAll('[data-currency]');
        currencyElements.forEach(element => {
            const amount = element.dataset.amount;
            const currency = this.state.currency;

            if (amount && currency) {
                element.textContent = this.formatCurrency(amount, currency);
            }
        });
    },

    // Formatear moneda
    formatCurrency(amount, currency) {
        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        return formatter.format(amount);
    },

    // Cargar preferencias del usuario
    loadUserPreferences() {
        try {
            // Cargar tema
            const theme = localStorage.getItem('ecoswap_theme') || 'auto';
            this.state.theme = theme;

            // Cargar idioma
            const language = localStorage.getItem('ecoswap_language') || 'es';
            this.state.language = language;

            // Cargar moneda
            const currency = localStorage.getItem('ecoswap_currency') || 'COP';
            this.state.currency = currency;

        } catch (error) {
            console.error('Error al cargar preferencias:', error);
        }
    },

    // Mostrar notificación
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        // Estilos según tipo
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    },

    // Manejar errores globales
    handleGlobalError(error) {
        console.error('Error global manejado:', error);

        // Mostrar notificación de error
        this.showNotification('Ha ocurrido un error inesperado', 'error');

        // Registrar error para análisis
        this.logError(error);
    },

    // Registrar error
    logError(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: error.message || 'Error desconocido',
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            screen: this.state.currentScreen
        };

        // Guardar en localStorage para análisis posterior
        try {
            const existingLogs = JSON.parse(localStorage.getItem('ecoswap_error_logs') || '[]');
            existingLogs.push(errorLog);

            // Mantener solo los últimos 50 errores
            if (existingLogs.length > 50) {
                existingLogs.splice(0, existingLogs.length - 50);
            }

            localStorage.setItem('ecoswap_error_logs', JSON.stringify(existingLogs));
        } catch (e) {
            console.error('Error al guardar log de errores:', e);
        }
    },

    // Iniciar sesión
    login(userData, token) {
        try {
            this.state.isAuthenticated = true;
            this.state.currentUser = userData;
            this.state.currentScreen = 'main';

            // Guardar en localStorage
            localStorage.setItem('ecoswap_auth_token', token);
            localStorage.setItem('ecoswap_user_data', JSON.stringify(userData));

            // Mostrar pantalla principal
            this.showScreen('main');

            // Mostrar notificación de bienvenida
            this.showNotification(`¡Bienvenido, ${userData.name}!`, 'success');

        } catch (error) {
            console.error('Error en login:', error);
            this.showNotification('Error al iniciar sesión', 'error');
        }
    },

    // Cerrar sesión
    logout() {
        try {
            this.state.isAuthenticated = false;
            this.state.currentUser = null;
            this.state.currentScreen = 'auth';

            // Limpiar localStorage
            localStorage.removeItem('ecoswap_auth_token');
            localStorage.removeItem('ecoswap_user_data');

            // Mostrar pantalla de autenticación
            this.showScreen('auth');

            // Mostrar notificación
            this.showNotification('Sesión cerrada correctamente', 'info');

        } catch (error) {
            console.error('Error en logout:', error);
        }
    },

    // Verificar si está autenticado
    isAuthenticated() {
        return this.state.isAuthenticated;
    },

    // Obtener usuario actual
    getCurrentUser() {
        return this.state.currentUser;
    },

    // Obtener pantalla actual
    getCurrentScreen() {
        return this.state.currentScreen;
    },

    // Obtener configuración
    getConfig() {
        return {
            theme: this.state.theme,
            language: this.state.language,
            currency: this.state.currency
        };
    },

    // Cambiar tema
    changeTheme(theme) {
        this.state.theme = theme;
        this.applyTheme(theme);
    },

    // Cambiar idioma
    changeLanguage(language) {
        this.state.language = language;
        this.applyLanguage(language);
    },

    // Cambiar moneda
    changeCurrency(currency) {
        this.state.currency = currency;
        localStorage.setItem('ecoswap_currency', currency);
        this.updateCurrencyDisplay();
    },

    // Obtener estadísticas de la aplicación
    getAppStats() {
        return {
            isAuthenticated: this.state.isAuthenticated,
            currentScreen: this.state.currentScreen,
            theme: this.state.theme,
            language: this.state.language,
            currency: this.state.currency,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString()
        };
    },

    // Exportar datos de la aplicación
    exportAppData() {
        const appData = {
            user: this.state.currentUser,
            settings: this.getConfig(),
            stats: this.getAppStats(),
            errorLogs: JSON.parse(localStorage.getItem('ecoswap_error_logs') || '[]')
        };

        const dataStr = JSON.stringify(appData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ecoswap-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    },

    // Limpiar datos de la aplicación
    clearAppData() {
        if (confirm('¿Estás seguro de que quieres limpiar todos los datos de la aplicación? Esta acción no se puede deshacer.')) {
            try {
                // Limpiar localStorage
                localStorage.clear();

                // Limpiar estado
                this.state = {
                    isAuthenticated: false,
                    currentUser: null,
                    currentScreen: 'auth',
                    isLoading: false,
                    notifications: [],
                    theme: 'light',
                    language: 'es',
                    currency: 'COP'
                };

                // Reiniciar aplicación
                this.init();

                this.showNotification('Datos de la aplicación limpiados', 'success');
            } catch (error) {
                console.error('Error al limpiar datos:', error);
                this.showNotification('Error al limpiar datos', 'error');
            }
        }
    }
};

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    EcoSwapApp.init();
});

// Exportar para uso global
window.EcoSwapApp = EcoSwapApp;

// Función de utilidad para mostrar pantallas (compatibilidad)
function showScreen(screenName) {
    if (EcoSwapApp) {
        EcoSwapApp.showScreen(screenName);
    } else {
        console.error('EcoSwapApp no está disponible');
    }
}

// Función de utilidad para mostrar notificaciones (compatibilidad)
function showNotification(message, type) {
    if (EcoSwapApp) {
        EcoSwapApp.showNotification(message, type);
    } else {
        console.error('EcoSwapApp no está disponible');
    }
}

// Función de utilidad para login (compatibilidad)
function login(userData, token) {
    if (EcoSwapApp) {
        EcoSwapApp.login(userData, token);
    } else {
        console.error('EcoSwapApp no está disponible');
    }
}

// Función de utilidad para logout (compatibilidad)
function logout() {
    if (EcoSwapApp) {
        EcoSwapApp.logout();
    } else {
        console.error('EcoSwapApp no está disponible');
    }
}

