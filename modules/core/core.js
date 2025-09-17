/* ===================================
   MÓDULO PRINCIPAL - ECOSWAP COLOMBIA
   =================================== */

const CoreModule = {
    // Estado del módulo
    state: {
        currentScreen: 'home',
        userMenuOpen: false,
        searchQuery: '',
        notifications: [],
        settings: {
            theme: 'auto',
            language: 'es',
            currency: 'COP',
            timezone: 'America/Bogota',
            notifications: {
                email: true,
                push: true,
                sms: false
            }
        }
    },

    // Inicialización
    init() {
        this.bindEvents();
        this.loadSettings();
        this.setupTheme();
        console.log('Módulo Principal inicializado');
    },

    // Vincular eventos
    bindEvents() {
        // Navegación principal
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = link.dataset.screen;
                this.showScreen(screen);
                this.updateActiveNav(link);
            });
        });

        // Búsqueda
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value;
                this.handleSearch();
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // Cerrar menú de usuario al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                this.closeUserMenu();
            }
        });

        // Navegación por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUserMenu();
            }
        });
    },

    // Mostrar pantalla
    showScreen(screenName) {
        // Ocultar todas las pantallas
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Mostrar pantalla solicitada
        const targetScreen = document.getElementById(screenName + 'Screen');
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.state.currentScreen = screenName;

            // Actualizar navegación
            this.updateActiveNav(screenName);

            // Cargar contenido específico si es necesario
            this.loadScreenContent(screenName);

            // Animar entrada
            targetScreen.style.animation = 'none';
            targetScreen.offsetHeight; // Trigger reflow
            targetScreen.style.animation = 'fadeInUp 0.6s ease-out';

            console.log(`Pantalla ${screenName} mostrada`);
        } else {
            console.error(`Pantalla ${screenName} no encontrada`);
        }
    },

    // Actualizar navegación activa
    updateActiveNav(screenName) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.screen === screenName) {
                link.classList.add('active');
            }
        });
    },

    // Cargar contenido específico de pantalla
    loadScreenContent(screenName) {
        switch (screenName) {
            case 'home':
                this.loadHomeContent();
                break;
            case 'settings':
                this.loadSettingsContent();
                break;
            case 'help':
                this.loadHelpContent();
                break;
            case 'about':
                this.loadAboutContent();
                break;
            default:
                // Para otras pantallas, el contenido ya está en el HTML
                break;
        }
    },

    // Cargar contenido de inicio
    loadHomeContent() {
        // Actualizar estadísticas en tiempo real
        this.updateStats();

        // Cargar actividad reciente
        this.loadRecentActivity();

        // Configurar auto-refresh
        this.setupAutoRefresh();
    },

    // Cargar contenido de configuración
    loadSettingsContent() {
        // Aplicar valores actuales a los campos
        this.applyCurrentSettings();

        // Vincular eventos de configuración
        this.bindSettingsEvents();
    },

    // Cargar contenido de ayuda
    loadHelpContent() {
        // Configurar búsqueda de ayuda
        this.setupHelpSearch();

        // Cargar categorías de ayuda
        this.loadHelpCategories();
    },

    // Cargar contenido acerca de
    loadAboutContent() {
        // Cargar información del equipo
        this.loadTeamInfo();

        // Configurar enlaces de contacto
        this.setupContactLinks();
    },

    // Actualizar estadísticas
    updateStats() {
        // Simular actualización de estadísticas
        const stats = [
            { id: 'products', value: '1,247', icon: '📱' },
            { id: 'users', value: '5,893', icon: '👥' },
            { id: 'exchanges', value: '892', icon: '🔄' },
            { id: 'rating', value: '4.8', icon: '⭐' }
        ];

        stats.forEach(stat => {
            const element = document.querySelector(`[data-stat="${stat.id}"]`);
            if (element) {
                element.textContent = stat.value;
            }
        });
    },

    // Cargar actividad reciente
    loadRecentActivity() {
        // Simular carga de actividad
        const activities = [
            {
                user: 'Carlos Mendoza',
                action: 'vendió un iPhone 12 Pro',
                time: 'Hace 2 horas',
                avatar: 'https://via.placeholder.com/50x50/4CAF50/FFFFFF?text=CM'
            },
            {
                user: 'Ana García',
                action: 'compró una bicicleta Trek',
                time: 'Hace 4 horas',
                avatar: 'https://via.placeholder.com/50x50/2196F3/FFFFFF?text=AG'
            },
            {
                user: 'Luis Rodríguez',
                action: 'publicó una mesa vintage',
                time: 'Hace 6 horas',
                avatar: 'https://via.placeholder.com/50x50/FF9800/FFFFFF?text=LR'
            }
        ];

        this.renderActivities(activities);
    },

    // Renderizar actividades
    renderActivities(activities) {
        const container = document.querySelector('.activity-grid');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-card">
                <div class="activity-avatar">
                    <img src="${activity.avatar}" alt="${activity.user}">
                </div>
                <div class="activity-content">
                    <p><strong>${activity.user}</strong> ${activity.action}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    },

    // Configurar auto-refresh
    setupAutoRefresh() {
        // Actualizar cada 5 minutos
        setInterval(() => {
            this.updateStats();
            this.loadRecentActivity();
        }, 5 * 60 * 1000);
    },

    // Aplicar configuración actual
    applyCurrentSettings() {
        const settings = this.state.settings;

        // Aplicar tema
        const themeSelect = document.querySelector('select[value="theme"]');
        if (themeSelect) {
            themeSelect.value = settings.theme;
        }

        // Aplicar idioma
        const languageSelect = document.querySelector('select[value="language"]');
        if (languageSelect) {
            languageSelect.value = settings.language;
        }

        // Aplicar moneda
        const currencySelect = document.querySelector('select[value="currency"]');
        if (currencySelect) {
            currencySelect.value = settings.currency;
        }

        // Aplicar zona horaria
        const timezoneSelect = document.querySelector('select[value="timezone"]');
        if (timezoneSelect) {
            timezoneSelect.value = settings.timezone;
        }

        // Aplicar notificaciones
        const emailNotif = document.getElementById('emailNotif');
        if (emailNotif) {
            emailNotif.checked = settings.notifications.email;
        }

        const pushNotif = document.getElementById('pushNotif');
        if (pushNotif) {
            pushNotif.checked = settings.notifications.push;
        }

        const smsNotif = document.getElementById('smsNotif');
        if (smsNotif) {
            smsNotif.checked = settings.notifications.sms;
        }
    },

    // Vincular eventos de configuración
    bindSettingsEvents() {
        // Cambios en tiempo real
        const formControls = document.querySelectorAll('.settings-section .form-control, .settings-section input[type="checkbox"]');
        formControls.forEach(control => {
            control.addEventListener('change', () => {
                this.handleSettingChange(control);
            });
        });
    },

    // Manejar cambio de configuración
    handleSettingChange(control) {
        const settingName = control.name || control.id;
        const value = control.type === 'checkbox' ? control.checked : control.value;

        // Actualizar estado
        if (settingName === 'theme') {
            this.state.settings.theme = value;
            this.applyTheme(value);
        } else if (settingName === 'language') {
            this.state.settings.language = value;
            this.applyLanguage(value);
        } else if (settingName === 'currency') {
            this.state.settings.currency = value;
            this.applyCurrency(value);
        } else if (settingName === 'timezone') {
            this.state.settings.timezone = value;
            this.applyTimezone(value);
        } else if (settingName === 'emailNotif') {
            this.state.settings.notifications.email = value;
        } else if (settingName === 'pushNotif') {
            this.state.settings.notifications.push = value;
        } else if (settingName === 'smsNotif') {
            this.state.settings.notifications.sms = value;
        }

        // Guardar configuración
        this.saveSettings();
    },

    // Configurar búsqueda de ayuda
    setupHelpSearch() {
        const helpSearch = document.querySelector('.help-search .search-input');
        if (helpSearch) {
            helpSearch.addEventListener('input', (e) => {
                this.searchHelp(e.target.value);
            });
        }
    },

    // Buscar en ayuda
    searchHelp(query) {
        if (!query.trim()) {
            this.showAllHelpCategories();
            return;
        }

        // Simular búsqueda
        const results = this.searchHelpContent(query);
        this.displayHelpResults(results);
    },

    // Buscar contenido de ayuda
    searchHelpContent(query) {
        const helpItems = document.querySelectorAll('.help-item');
        const results = [];

        helpItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                results.push({
                    element: item,
                    relevance: this.calculateRelevance(text, query)
                });
            }
        });

        return results.sort((a, b) => b.relevance - a.relevance);
    },

    // Calcular relevancia de búsqueda
    calculateRelevance(text, query) {
        const queryWords = query.toLowerCase().split(' ');
        let relevance = 0;

        queryWords.forEach(word => {
            if (text.includes(word)) {
                relevance += 1;
                if (text.startsWith(word)) {
                    relevance += 0.5;
                }
            }
        });

        return relevance;
    },

    // Mostrar resultados de búsqueda
    displayHelpResults(results) {
        const helpItems = document.querySelectorAll('.help-item');

        helpItems.forEach(item => {
            item.style.display = 'none';
        });

        results.forEach(result => {
            result.element.style.display = 'block';
            result.element.style.background = 'rgba(46, 204, 113, 0.1)';
        });
    },

    // Mostrar todas las categorías de ayuda
    showAllHelpCategories() {
        const helpItems = document.querySelectorAll('.help-item');
        helpItems.forEach(item => {
            item.style.display = 'block';
            item.style.background = '';
        });
    },

    // Cargar categorías de ayuda
    loadHelpCategories() {
        // Las categorías ya están en el HTML
        // Aquí se podrían cargar dinámicamente desde una API
        console.log('Categorías de ayuda cargadas');
    },

    // Cargar información del equipo
    loadTeamInfo() {
        // La información del equipo ya está en el HTML
        // Aquí se podrían cargar dinámicamente desde una API
        console.log('Información del equipo cargada');
    },

    // Configurar enlaces de contacto
    setupContactLinks() {
        const contactButtons = document.querySelectorAll('.contact-options .btn');
        contactButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.textContent.toLowerCase();
                this.handleContactAction(action);
            });
        });
    },

    // Manejar acción de contacto
    handleContactAction(action) {
        switch (action) {
            case 'contactar soporte':
                this.contactSupport();
                break;
            case 'chat en vivo':
                this.openLiveChat();
                break;
            default:
                console.log(`Acción de contacto: ${action}`);
        }
    },

    // Manejar búsqueda
    handleSearch() {
        // Implementar búsqueda en tiempo real
        if (this.state.searchQuery.length >= 2) {
            this.showSearchSuggestions();
        } else {
            this.hideSearchSuggestions();
        }
    },

    // Realizar búsqueda
    performSearch() {
        const query = this.state.searchQuery.trim();
        if (!query) return;

        console.log(`Buscando: ${query}`);

        // Aquí se implementaría la lógica de búsqueda real
        // Por ahora, solo mostramos un mensaje
        this.showNotification(`Búsqueda realizada: ${query}`, 'info');

        // Limpiar búsqueda
        this.clearSearch();
    },

    // Mostrar sugerencias de búsqueda
    showSearchSuggestions() {
        // Implementar sugerencias de búsqueda
        console.log('Mostrando sugerencias de búsqueda');
    },

    // Ocultar sugerencias de búsqueda
    hideSearchSuggestions() {
        // Implementar ocultar sugerencias
        console.log('Ocultando sugerencias de búsqueda');
    },

    // Limpiar búsqueda
    clearSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = '';
            this.state.searchQuery = '';
        }
    },

    // Alternar menú de usuario
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            if (this.state.userMenuOpen) {
                this.closeUserMenu();
            } else {
                this.openUserMenu();
            }
        }
    },

    // Abrir menú de usuario
    openUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.add('active');
            this.state.userMenuOpen = true;
        }
    },

    // Cerrar menú de usuario
    closeUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
            this.state.userMenuOpen = false;
        }
    },

    // Guardar configuración
    saveSettings() {
        try {
            localStorage.setItem('ecoswap_settings', JSON.stringify(this.state.settings));
            this.showNotification('Configuración guardada', 'success');
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            this.showNotification('Error al guardar configuración', 'error');
        }
    },

    // Restablecer configuración
    resetSettings() {
        if (confirm('¿Estás seguro de que quieres restablecer toda la configuración?')) {
            this.state.settings = {
                theme: 'auto',
                language: 'es',
                currency: 'COP',
                timezone: 'America/Bogota',
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                }
            };

            this.applyCurrentSettings();
            this.saveSettings();
            this.showNotification('Configuración restablecida', 'success');
        }
    },

    // Cargar configuración
    loadSettings() {
        try {
            const saved = localStorage.getItem('ecoswap_settings');
            if (saved) {
                this.state.settings = { ...this.state.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error al cargar configuración:', error);
        }
    },

    // Configurar tema
    setupTheme() {
        const theme = this.state.settings.theme;
        this.applyTheme(theme);
    },

    // Aplicar tema
    applyTheme(theme) {
        const root = document.documentElement;

        if (theme === 'auto') {
            // Usar preferencia del sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
        }
    },

    // Aplicar idioma
    applyLanguage(language) {
        // Implementar cambio de idioma
        console.log(`Idioma cambiado a: ${language}`);
    },

    // Aplicar moneda
    applyCurrency(currency) {
        // Implementar cambio de moneda
        console.log(`Moneda cambiada a: ${currency}`);
    },

    // Aplicar zona horaria
    applyTimezone(timezone) {
        // Implementar cambio de zona horaria
        console.log(`Zona horaria cambiada a: ${timezone}`);
    },

    // Contactar soporte
    contactSupport() {
        const email = 'soporte@ecoswap.co';
        const subject = 'Soporte EcoSwap Colombia';
        const body = 'Hola, necesito ayuda con EcoSwap Colombia.';

        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
    },

    // Abrir chat en vivo
    openLiveChat() {
        // Implementar chat en vivo
        this.showNotification('Chat en vivo no disponible en esta versión', 'info');
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
        `;

        // Estilos según tipo
        switch (type) {
            case 'success':
                notification.style.background = 'var(--success-color)';
                break;
            case 'error':
                notification.style.background = 'var(--danger-color)';
                break;
            case 'warning':
                notification.style.background = 'var(--warning-color)';
                break;
            default:
                notification.style.background = 'var(--info-color)';
        }

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

    // Cerrar sesión
    logout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            // Limpiar estado local
            this.state.userMenuOpen = false;
            this.closeUserMenu();

            // Redirigir a autenticación
            if (typeof AuthModule !== 'undefined') {
                AuthModule.logout();
            } else {
                // Fallback si AuthModule no está disponible
                window.location.reload();
            }
        }
    },

    // Obtener configuración actual
    getSettings() {
        return this.state.settings;
    },

    // Obtener pantalla actual
    getCurrentScreen() {
        return this.state.currentScreen;
    },

    // Verificar si el menú de usuario está abierto
    isUserMenuOpen() {
        return this.state.userMenuOpen;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    CoreModule.init();
});

// Exportar para uso global
window.CoreModule = CoreModule;
