/**
 * EcoSwap - Configuración Principal de la Aplicación
 * Archivo de configuración centralizada para toda la aplicación
 */

const EcoSwapConfig = {
    // Información de la aplicación
    app: {
        name: 'EcoSwap Colombia',
        version: '1.0.0',
        build: '2024.1.0',
        environment: 'development',
        debug: false
    },

    // Información de la empresa
    company: {
        name: 'EcoSwap',
        fullName: 'EcoSwap - Plataforma de Intercambio Sostenible',
        description: 'Plataforma líder en intercambio y venta de productos de segunda mano en Colombia',
        founded: '2024',
        founders: 'Tres estudiantes universitarios de Pereira, Colombia',
        location: {
            city: 'Pereira',
            state: 'Risaralda',
            country: 'Colombia',
            address: 'Pereira, Risaralda, Colombia',
            coordinates: {
                lat: 4.8143,
                lng: -75.6946
            }
        },
        contact: {
            email: 'info@ecoswap.co',
            phone: '+57 6 123 4567',
            website: 'https://ecoswap.co',
            social: {
                facebook: 'https://facebook.com/ecoswapco',
                instagram: 'https://instagram.com/ecoswapco',
                twitter: 'https://twitter.com/ecoswapco',
                linkedin: 'https://linkedin.com/company/ecoswapco'
            }
        },
        mission: 'Promover la economía circular y el consumo sostenible en Colombia',
        vision: 'Ser la plataforma líder de intercambio en Latinoamérica'
    },

    // Configuración de la API (COMENTADO - Usando mockup por ahora)
    /*
    api: {
        baseUrl: 'https://api.ecoswap.com',
        version: 'v1',
        timeout: 30000,
        retries: 3,
        endpoints: {
            auth: '/auth',
            users: '/users',
            products: '/products',
            interactions: '/interactions',
            chat: '/chat',
            ratings: '/ratings'
        }
    },
    */

    // Configuración de la base de datos (COMENTADO - Usando localStorage por ahora)
    /*
    database: {
        name: 'ecoswap_db',
        version: '1.0',
        stores: [
            'users',
            'products',
            'interactions',
            'chats',
            'ratings',
            'notifications',
            'settings'
        ],
        indexes: {
            users: ['email', 'username', 'location'],
            products: ['category', 'location', 'status', 'userId'],
            interactions: ['productId', 'userId', 'status', 'createdAt']
        }
    },
    */

    // Configuración de autenticación (COMENTADO - Usando mockup por ahora)
    /*
    auth: {
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
        maxLoginAttempts: 5,
        lockoutTime: 15 * 60 * 1000, // 15 minutos
        passwordMinLength: 6,
        passwordRequirements: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            specialChars: false
        },
        socialProviders: ['google', 'facebook', 'apple'],
        emailVerification: true,
        twoFactorAuth: false
    },
    */

    // Configuración de notificaciones (COMENTADO - Usando mockup por ahora)
    /*
    notifications: {
        enabled: true,
        types: ['push', 'email', 'sms', 'in-app'],
        defaultSettings: {
            push: true,
            email: true,
            sms: false,
            inApp: true
        },
        channels: {
            products: ['push', 'email'],
            interactions: ['push', 'in-app'],
            security: ['email'],
            marketing: ['email']
        }
    },
    */

    // Configuración de productos (COMENTADO - Usando mockup por ahora)
    /*
    products: {
        maxImages: 10,
        maxTitleLength: 100,
        maxDescriptionLength: 1000,
        categories: [
            'electronics',
            'clothing',
            'books',
            'sports',
            'home',
            'garden',
            'tools',
            'music',
            'vehicles',
            'other'
        ],
        statuses: ['available', 'pending', 'exchanged', 'expired'],
        moderation: {
            enabled: true,
            autoModeration: true,
            manualReview: false,
            profanityFilter: true
        }
    },
    */

    // Configuración de interacciones (COMENTADO - Usando mockup por ahora)
    /*
    interactions: {
        maxMessageLength: 500,
        maxAttachments: 5,
        types: ['interest', 'question', 'offer', 'counter-offer'],
        statuses: ['pending', 'accepted', 'rejected', 'cancelled'],
        autoExpire: 30 * 24 * 60 * 60 * 1000 // 30 días
    },
    */

    // Configuración de chat (COMENTADO - Usando mockup por ahora)
    /*
    chat: {
        maxMessageLength: 1000,
        maxParticipants: 2,
        messageRetention: 90 * 24 * 60 * 60 * 1000, // 90 días
        typingIndicator: true,
        readReceipts: true,
        fileSharing: {
            enabled: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image', 'document', 'video']
        }
    },
    */

    // Configuración de calificaciones (COMENTADO - Usando mockup por ahora)
    /*
    ratings: {
        minRating: 1,
        maxRating: 5,
        requiredForExchange: true,
        moderation: {
            enabled: true,
            autoModeration: true,
            profanityFilter: true
        }
    },
    */

    // Configuración de ubicación y regionalización
    location: {
        defaultCountry: 'Colombia',
        defaultCity: 'Pereira',
        defaultState: 'Risaralda',
        defaultTimezone: 'America/Bogota',
        supportedCountries: ['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador'],
        supportedCities: {
            'Colombia': ['Pereira', 'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'],
            'México': ['Ciudad de México', 'Guadalajara', 'Monterrey'],
            'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario'],
            'Chile': ['Santiago', 'Valparaíso', 'Concepción'],
            'Perú': ['Lima', 'Arequipa', 'Trujillo'],
            'Ecuador': ['Quito', 'Guayaquil', 'Cuenca']
        }
    },

    // Configuración de moneda
    currency: {
        default: 'COP',
        supported: ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN', 'ECU'],
        symbols: {
            'COP': 'COP$',
            'USD': '$',
            'EUR': '€',
            'MXN': 'MXN$',
            'ARS': 'ARS$',
            'CLP': 'CLP$',
            'PEN': 'S/',
            'ECU': 'ECU$'
        },
        exchangeRates: {
            'COP': 1,
            'USD': 0.00026,
            'EUR': 0.00024,
            'MXN': 0.0043,
            'ARS': 0.00023,
            'CLP': 0.24,
            'PEN': 0.00096,
            'ECU': 0.00026
        }
    },

    // Configuración de idioma
    language: {
        default: 'es',
        supported: ['es', 'en', 'pt'],
        names: {
            'es': 'Español',
            'en': 'English',
            'pt': 'Português'
        },
        regions: {
            'es': 'CO', // Colombia
            'en': 'US',
            'pt': 'BR'
        }
    },

    // Configuración de paginación (COMENTADO - Usando mockup por ahora)
    /*
    pagination: {
        defaultPageSize: 20,
        maxPageSize: 100,
        pageSizeOptions: [10, 20, 50, 100]
    },
    */

    // Configuración de búsqueda (COMENTADO - Usando mockup por ahora)
    /*
    search: {
        minQueryLength: 2,
        maxResults: 100,
        fuzzySearch: true,
        searchIndexes: ['title', 'description', 'category', 'location'],
        filters: ['category', 'location', 'price', 'condition', 'date']
    },
    */

    // Configuración de caché (COMENTADO - Usando mockup por ahora)
    /*
    cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutos
        maxSize: 100,
        strategies: ['memory', 'localStorage', 'sessionStorage']
    },
    */

    // Configuración de analytics (COMENTADO - Usando mockup por ahora)
    /*
    analytics: {
        enabled: true,
        provider: 'google', // 'google', 'matomo', 'custom'
        trackingId: 'GA-XXXXXXXXX',
        events: [
            'user_registration',
            'user_login',
            'product_view',
            'product_create',
            'interaction_start',
            'exchange_complete'
        ],
        privacy: {
            anonymizeIp: true,
            respectDnt: true,
            cookieConsent: true
        }
    },
    */

    // Configuración de SEO (COMENTADO - Usando mockup por ahora)
    /*
    seo: {
        titleTemplate: '%s | EcoSwap',
        defaultDescription: 'Plataforma de intercambio sostenible donde puedes intercambiar productos en lugar de comprarlos nuevos.',
        defaultKeywords: 'intercambio, sostenible, ecología, segunda mano, reutilización',
        socialSharing: {
            enabled: true,
            platforms: ['facebook', 'twitter', 'linkedin', 'whatsapp']
        }
    },
    */

    // Configuración de accesibilidad (COMENTADO - Usando mockup por ahora)
    /*
    accessibility: {
        enabled: true,
        features: {
            keyboardNavigation: true,
            screenReader: true,
            highContrast: true,
            reducedMotion: true,
            focusIndicators: true
        },
        compliance: {
            wcag: 'AA',
            section508: true
        }
    },
    */

    // Configuración de internacionalización (COMENTADO - Usando mockup por ahora)
    /*
    i18n: {
        defaultLocale: 'es',
        supportedLocales: ['es', 'en', 'ca', 'eu', 'gl'],
        fallbackLocale: 'en',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: 'EUR',
        numberFormat: {
            decimal: ',',
            thousands: '.',
            precision: 2
        }
    },
    */

    // Configuración de seguridad (COMENTADO - Usando mockup por ahora)
    /*
    security: {
        csrfProtection: true,
        xssProtection: true,
        contentSecurityPolicy: true,
        rateLimiting: {
            enabled: true,
            maxRequests: 100,
            windowMs: 15 * 60 * 1000 // 15 minutos
        },
        passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxAge: 90 * 24 * 60 * 60 * 1000 // 90 días
        }
    },
    */

    // Configuración de rendimiento (COMENTADO - Usando mockup por ahora)
    /*
    performance: {
        lazyLoading: true,
        imageOptimization: true,
        codeSplitting: true,
        serviceWorker: true,
        preload: {
            critical: true,
            fonts: true,
            images: false
        },
        compression: {
            gzip: true,
            brotli: true
        }
    },
    */

    // Configuración de desarrollo (COMENTADO - Usando mockup por ahora)
    /*
    development: {
        debug: false,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        hotReload: true,
        sourceMaps: true,
        linting: {
            enabled: true,
            rules: 'strict'
        },
        testing: {
            unit: true,
            integration: true,
            e2e: false
        }
    },
    */

    // Configuración de producción (COMENTADO - Usando mockup por ahora)
    /*
    production: {
        minification: true,
        bundling: true,
        treeShaking: true,
        optimization: {
            images: true,
            fonts: true,
            css: true,
            js: true
        },
        monitoring: {
            errorTracking: true,
            performanceMonitoring: true,
            uptimeMonitoring: true
        }
    },
    */

    // Configuración de respaldo (COMENTADO - Usando mockup por ahora)
    /*
    backup: {
        enabled: true,
        frequency: 'daily',
        retention: 30, // días
        storage: 'cloud', // 'local', 'cloud', 'hybrid'
        encryption: true
    },
    */

    // Configuración de soporte (COMENTADO - Usando mockup por ahora)
    /*
    support: {
        email: 'soporte@ecoswap.com',
        phone: '+34 900 123 456',
        hours: '24/7',
        languages: ['es', 'en'],
        channels: ['email', 'chat', 'phone', 'tickets'],
        responseTime: '2h'
    },
    */

    // Configuración de legal (COMENTADO - Usando mockup por ahora)
    /*
    legal: {
        termsUrl: '/terms',
        privacyUrl: '/privacy',
        cookiesUrl: '/cookies',
        gdpr: {
            enabled: true,
            dataRetention: 2 * 365 * 24 * 60 * 60 * 1000, // 2 años
            rightToBeForgotten: true,
            dataPortability: true
        }
    },
    */

    // Métodos de utilidad
    utils: {
        // Obtener configuración por clave
        get: function (key) {
            return key.split('.').reduce((obj, k) => obj && obj[k], this);
        },

        // Establecer configuración
        set: function (key, value) {
            const keys = key.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((obj, k) => {
                if (!obj[k]) obj[k] = {};
                return obj[k];
            }, this);
            target[lastKey] = value;
        },

        // Verificar si una característica está habilitada
        isEnabled: function (feature) {
            return this.get(feature) === true;
        },

        // Obtener configuración para un entorno específico (COMENTADO - Usando mockup por ahora)
        /*
        getForEnvironment: function (env) {
            const envConfig = this[env] || {};
            return Object.assign({}, this, envConfig);
        },
        */

        // Validar configuración (COMENTADO - Usando mockup por ahora)
        /*
        validate: function () {
            const required = ['app.name', 'app.version', 'api.baseUrl'];
            const missing = required.filter(key => !this.get(key));

            if (missing.length > 0) {
                throw new Error(`Configuración incompleta. Faltan: ${missing.join(', ')}`);
            }

            return true;
        },
        */

        // Exportar configuración
        export: function () {
            return JSON.stringify(this, null, 2);
        },

        // Importar configuración
        import: function (config) {
            try {
                const parsed = typeof config === 'string' ? JSON.parse(config) : config;
                Object.assign(this, parsed);
                return true;
            } catch (error) {
                console.error('Error al importar configuración:', error);
                return false;
            }
        }
    }
};

// Validar configuración al cargar (COMENTADO - Usando mockup por ahora)
/*
try {
    EcoSwapConfig.utils.validate();
} catch (error) {
    console.error('Error en la configuración:', error);
}
*/

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.EcoSwapConfig = EcoSwapConfig;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EcoSwapConfig;
}

// Configuración específica por entorno (COMENTADO - Usando mockup por ahora)
/*
const environment = process.env.NODE_ENV || 'development';
const envConfig = EcoSwapConfig.getForEnvironment(environment);

// Log de configuración cargada
if (EcoSwapConfig.development.debug) {
    console.log(`EcoSwap Config cargado para entorno: ${environment}`, envConfig);
}
*/
