/**
 * Módulo de Perfil - EcoSwap
 * Maneja la funcionalidad del perfil de usuario, configuración y gestión de cuenta
 */

const ProfileModule = {
    // Estado del módulo
    state: {
        currentUser: null,
        profileData: null,
        products: [],
        activities: [],
        reviews: [],
        connections: [],
        currentTab: 'overview',
        filters: {
            products: { status: 'all', category: 'all', sort: 'recent' },
            activity: 'all',
            reviews: { rating: 'all', sort: 'recent' }
        },
        pagination: {
            products: { page: 1, hasMore: true },
            activities: { page: 1, hasMore: true },
            reviews: { page: 1, hasMore: true },
            connections: { page: 1, hasMore: true }
        }
    },

    // Inicialización
    init() {
        this.loadSampleData();
        this.bindEvents();
        this.showTab('overview');
        console.log('Módulo de Perfil inicializado');
    },

    loadSampleData() {
        // Usuario actual
        this.state.currentUser = {
            id: 1,
            name: 'Carlos Mendoza',
            username: 'carlos_mendoza',
            email: 'carlos.mendoza@email.com',
            avatar: 'https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=CM',
            coverImage: 'https://via.placeholder.com/800x300/4CAF50/FFFFFF?text=Cover+Image',
            bio: 'Emprendedor sostenible apasionado por la economía circular. Vendo productos de calidad para darles una segunda vida.',
            location: 'Pereira, Risaralda, Colombia',
            coordinates: { lat: 4.8143, lng: -75.6946 },
            phone: '+57 300 123 4567',
            website: 'https://carlosmendoza.co',
            social: {
                facebook: 'carlos.mendoza.eco',
                instagram: 'carlos_mendoza_eco',
                twitter: 'carlos_eco',
                linkedin: 'carlos-mendoza-eco'
            },
            stats: {
                products: 45,
                reviews: 156,
                rating: 4.8,
                connections: 89,
                memberSince: 'Enero 2023',
                lastActive: '2024-01-20T15:30:00Z'
            },
            interests: ['Tecnología', 'Sostenibilidad', 'Emprendimiento', 'Música', 'Deportes', 'Arte'],
            verified: true,
            premium: true
        };

        // Productos del usuario
        this.state.products = [
            {
                id: 1,
                name: 'iPhone 12 Pro',
                description: 'iPhone 12 Pro en excelente estado, solo 6 meses de uso.',
                price: 1500000,
                currency: 'COP',
                originalPrice: 2800000,
                condition: 'excellent',
                category: 'electronics',
                images: ['https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=iPhone+12+Pro'],
                location: 'Pereira, Risaralda, Colombia',
                status: 'available',
                views: 245,
                favorites: 18,
                createdAt: '2024-01-15',
                rating: 5,
                reviews: 3
            },
            {
                id: 2,
                name: 'MacBook Air M1',
                description: 'MacBook Air con chip M1, perfecto para trabajo y estudio.',
                price: 2800000,
                currency: 'COP',
                originalPrice: 4500000,
                condition: 'good',
                category: 'electronics',
                images: ['https://via.placeholder.com/300x200/2196F3/FFFFFF?text=MacBook+Air'],
                location: 'Pereira, Risaralda, Colombia',
                status: 'available',
                views: 189,
                favorites: 25,
                createdAt: '2024-01-10',
                rating: 4,
                reviews: 2
            },
            {
                id: 3,
                name: 'Guitarra Acústica Fender',
                description: 'Guitarra acústica Fender en perfecto estado, incluye funda.',
                price: 450000,
                currency: 'COP',
                originalPrice: 800000,
                condition: 'excellent',
                category: 'music',
                images: ['https://via.placeholder.com/300x200/8BC34A/FFFFFF?text=Guitarra+Fender'],
                location: 'Pereira, Risaralda, Colombia',
                status: 'sold',
                views: 156,
                favorites: 12,
                createdAt: '2024-01-05',
                rating: 5,
                reviews: 1
            }
        ];

        // Actividades del usuario
        this.state.activities = [
            {
                id: 1,
                type: 'product_sold',
                title: 'Vendiste iPhone 12 Pro',
                description: 'Completaste la venta del iPhone 12 Pro por COP$ 1,500,000',
                timestamp: '2024-01-20T10:30:00Z',
                icon: '💰',
                color: 'success'
            },
            {
                id: 2,
                type: 'review_received',
                title: 'Nueva reseña recibida',
                description: 'Ana García te calificó con 5 estrellas por la venta del iPhone',
                timestamp: '2024-01-20T11:15:00Z',
                icon: '⭐',
                color: 'warning'
            },
            {
                id: 3,
                type: 'product_listed',
                title: 'Nuevo producto publicado',
                description: 'Publicaste MacBook Air M1 por COP$ 2,800,000',
                timestamp: '2024-01-19T14:20:00Z',
                icon: '📱',
                color: 'info'
            },
            {
                id: 4,
                type: 'connection_made',
                title: 'Nueva conexión',
                description: 'Te conectaste con Luis Rodríguez de Medellín',
                timestamp: '2024-01-18T16:45:00Z',
                icon: '🤝',
                color: 'primary'
            },
            {
                id: 5,
                type: 'event_attended',
                title: 'Evento asistido',
                description: 'Asististe al Mercado de Segunda Mano Pereira',
                timestamp: '2024-01-15T12:00:00Z',
                icon: '🎉',
                color: 'success'
            }
        ];

        // Reseñas del usuario
        this.state.reviews = [
            {
                id: 1,
                product: {
                    name: 'iPhone 12 Pro',
                    image: 'https://via.placeholder.com/60x60/4CAF50/FFFFFF?text=iPhone'
                },
                reviewer: {
                    name: 'Ana García',
                    avatar: 'https://via.placeholder.com/40x40/2196F3/FFFFFF?text=AG',
                    location: 'Bogotá D.C., Colombia'
                },
                rating: 5,
                title: 'Excelente producto y vendedor',
                comment: 'El iPhone está en perfecto estado, tal como se describió. El vendedor fue muy profesional y la transacción fue rápida y segura.',
                date: '2024-01-20',
                helpful: 8
            },
            {
                id: 2,
                product: {
                    name: 'MacBook Air M1',
                    image: 'https://via.placeholder.com/60x60/2196F3/FFFFFF?text=MacBook'
                },
                reviewer: {
                    name: 'Luis Rodríguez',
                    avatar: 'https://via.placeholder.com/40x40/FF9800/FFFFFF?text=LR',
                    location: 'Medellín, Antioquia, Colombia'
                },
                rating: 4,
                title: 'Buen producto, envío lento',
                comment: 'El MacBook está en buen estado, pero el envío tardó más de lo esperado. El vendedor fue muy comunicativo.',
                date: '2024-01-18',
                helpful: 5
            },
            {
                id: 3,
                product: {
                    name: 'Guitarra Acústica Fender',
                    image: 'https://via.placeholder.com/60x60/8BC34A/FFFFFF?text=Guitarra'
                },
                reviewer: {
                    name: 'Roberto Silva',
                    avatar: 'https://via.placeholder.com/40x40/8BC34A/FFFFFF?text=RS',
                    location: 'Barranquilla, Atlántico, Colombia'
                },
                rating: 5,
                title: 'Guitarra perfecta',
                comment: 'La guitarra superó mis expectativas. Sonido hermoso y en perfecto estado. Muy recomendado.',
                date: '2024-01-12',
                helpful: 12
            }
        ];

        // Conexiones del usuario
        this.state.connections = [
            {
                id: 1,
                name: 'Ana García',
                avatar: 'https://via.placeholder.com/60x60/2196F3/FFFFFF?text=AG',
                location: 'Bogotá D.C., Colombia',
                rating: 4.9,
                reviews: 89,
                products: 32,
                mutualConnections: 12,
                status: 'online',
                lastActive: '2024-01-20T14:30:00Z'
            },
            {
                id: 2,
                name: 'Luis Rodríguez',
                avatar: 'https://via.placeholder.com/60x60/FF9800/FFFFFF?text=LR',
                location: 'Medellín, Antioquia, Colombia',
                rating: 4.7,
                reviews: 203,
                products: 67,
                mutualConnections: 8,
                status: 'online',
                lastActive: '2024-01-20T15:15:00Z'
            },
            {
                id: 3,
                name: 'María López',
                avatar: 'https://via.placeholder.com/60x60/9C27B0/FFFFFF?text=ML',
                location: 'Cali, Valle del Cauca, Colombia',
                rating: 4.6,
                reviews: 67,
                products: 28,
                mutualConnections: 15,
                status: 'away',
                lastActive: '2024-01-20T12:45:00Z'
            },
            {
                id: 4,
                name: 'Roberto Silva',
                avatar: 'https://via.placeholder.com/60x60/8BC34A/FFFFFF?text=RS',
                location: 'Barranquilla, Atlántico, Colombia',
                rating: 4.5,
                reviews: 45,
                products: 23,
                mutualConnections: 6,
                status: 'offline',
                lastActive: '2024-01-19T18:20:00Z'
            }
        ];
    },

    // Vincular eventos
    bindEvents() {
        // Botones de acción del header
        document.querySelector('.edit-profile-btn').addEventListener('click', this.openEditProfileModal.bind(this));
        document.querySelector('.settings-btn').addEventListener('click', this.openSettingsModal.bind(this));

        // Navegación de pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Botones de acción en pestañas
        document.querySelector('.add-product-btn').addEventListener('click', this.openAddProductModal.bind(this));
        document.querySelector('.find-connections-btn').addEventListener('click', this.findConnections.bind(this));

        // Filtros de productos
        document.getElementById('productStatus').addEventListener('change', this.handleProductFilter.bind(this));
        document.getElementById('productCategory').addEventListener('change', this.handleProductFilter.bind(this));
        document.getElementById('productSort').addEventListener('change', this.handleProductFilter.bind(this));

        // Filtros de actividad
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.handleActivityFilter(filter);
            });
        });

        // Formularios
        document.getElementById('editProfileForm').addEventListener('submit', this.handleEditProfile.bind(this));
        document.getElementById('addProductForm').addEventListener('submit', this.handleAddProduct.bind(this));
        document.getElementById('personalInfoForm').addEventListener('click', this.handlePersonalInfoUpdate.bind(this));
        document.getElementById('languageForm').addEventListener('submit', this.handleLanguageUpdate.bind(this));

        // Contador de caracteres para biografía
        document.getElementById('editBio').addEventListener('input', this.updateCharCount.bind(this));

        // Cambio de avatar
        document.getElementById('editAvatar').addEventListener('change', this.handleAvatarChange.bind(this));

        // Gestión de etiquetas
        document.getElementById('editTags').addEventListener('keypress', this.handleTagInput.bind(this));

        // Cerrar modales
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal-close')) {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            }
        });

        // Cerrar modal al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Cambio de portada
        document.querySelector('.edit-cover-btn').addEventListener('click', this.changeCoverImage.bind(this));

        // Cambio de avatar desde el perfil
        document.querySelector('.edit-avatar-btn').addEventListener('click', this.openAvatarUpload.bind(this));
    },

    // ===== NAVEGACIÓN DE PESTAÑAS =====

    // Mostrar pestaña
    showTab(tabName) {
        // Ocultar todas las pestañas
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Desactivar todos los botones de pestaña
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar pestaña seleccionada
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Activar botón de pestaña
        const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        this.state.currentTab = tabName;

        // Cargar contenido específico de la pestaña
        switch (tabName) {
            case 'overview':
                this.renderOverview();
                break;
            case 'products':
                this.renderProducts();
                break;
            case 'activity':
                this.renderActivities();
                break;
            case 'reviews':
                this.renderReviews();
                break;
            case 'connections':
                this.renderConnections();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    },

    // ===== PESTAÑA DE RESUMEN =====

    // Renderizar resumen
    renderOverview() {
        this.updateProfileStats();
        this.renderMonthlyStats();
        this.renderBadges();
        this.renderFeaturedProducts();
    },

    // Actualizar estadísticas del perfil
    updateProfileStats() {
        document.getElementById('productsCount').textContent = this.state.currentUser.stats.products;
        document.getElementById('reviewsCount').textContent = this.state.currentUser.stats.reviews;
        document.getElementById('ratingValue').textContent = this.state.currentUser.stats.rating;
        document.getElementById('connectionsCount').textContent = this.state.currentUser.stats.connections;
    },

    // Renderizar estadísticas mensuales
    renderMonthlyStats() {
        const stats = this.state.profileData.monthlyStats;
        // Los datos ya están en el HTML, solo actualizamos si es necesario
    },

    // Renderizar badges
    renderBadges() {
        const badges = this.state.profileData.badges;
        // Los badges ya están en el HTML
    },

    // Renderizar productos destacados
    renderFeaturedProducts() {
        const products = this.state.profileData.featuredProducts;
        // Los productos ya están en el HTML
    },

    // ===== PESTAÑA DE PRODUCTOS =====

    // Renderizar productos
    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        let filteredProducts = [...this.state.products];

        // Aplicar filtros
        if (this.state.filters.products.status !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.status === this.state.filters.products.status);
        }

        if (this.state.filters.products.category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === this.state.filters.products.category);
        }

        // Aplicar ordenamiento
        switch (this.state.filters.products.sort) {
            case 'recent':
                filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'popular':
                filteredProducts.sort((a, b) => b.views - a.views);
                break;
        }

        productsGrid.innerHTML = '';

        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = '<p class="text-center text-muted">No hay productos para mostrar.</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const productElement = this.createProductElement(product);
            productsGrid.appendChild(productElement);
        });
    },

    // Crear elemento de producto
    createProductElement(product) {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-card';
        productDiv.innerHTML = `
            <div class="product-image">
                <img src="${product.images[0]}" alt="${product.name}">
                <div class="product-status ${product.status}">${this.getStatusLabel(product.status)}</div>
            </div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span class="product-price">${product.currency} ${product.price}</span>
                    <span class="product-condition">${this.getConditionLabel(product.condition)}</span>
                </div>
                <div class="product-stats">
                    <span class="stat">👁️ ${product.views} vistas</span>
                    <span class="stat">❤️ ${product.favorites} favoritos</span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-secondary btn-small" onclick="ProfileModule.editProduct(${product.id})">
                        <i class="icon">✏️</i> Editar
                    </button>
                    <button class="btn btn-danger btn-small" onclick="ProfileModule.deleteProduct(${product.id})">
                        <i class="icon">🗑️</i> Eliminar
                    </button>
                </div>
            </div>
        `;

        return productDiv;
    },

    // Obtener etiqueta de estado
    getStatusLabel(status) {
        const labels = {
            'active': 'Activo',
            'sold': 'Vendido',
            'draft': 'Borrador',
            'available': 'Disponible',
            'sold': 'Vendido'
        };
        return labels[status] || status;
    },

    // Obtener etiqueta de condición
    getConditionLabel(condition) {
        const labels = {
            'new': 'Nuevo',
            'like-new': 'Como Nuevo',
            'good': 'Bueno',
            'fair': 'Aceptable',
            'poor': 'Regular',
            'excellent': 'Excelente'
        };
        return labels[condition] || condition;
    },

    // ===== PESTAÑA DE ACTIVIDAD =====

    // Renderizar actividades
    renderActivities() {
        const timeline = document.getElementById('activityTimeline');
        if (!timeline) return;

        let filteredActivities = [...this.state.activities];

        // Aplicar filtros
        if (this.state.filters.activity !== 'all') {
            filteredActivities = filteredActivities.filter(a => a.type === this.state.filters.activity);
        }

        // Ordenar por fecha
        filteredActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        timeline.innerHTML = '';

        if (filteredActivities.length === 0) {
            timeline.innerHTML = '<p class="text-center text-muted">No hay actividad para mostrar.</p>';
            return;
        }

        filteredActivities.forEach(activity => {
            const activityElement = this.createActivityElement(activity);
            timeline.appendChild(activityElement);
        });
    },

    // Crear elemento de actividad
    createActivityElement(activity) {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'timeline-item';
        activityDiv.innerHTML = `
            <div class="timeline-marker">
                <div class="timeline-icon">${activity.icon}</div>
            </div>
            <div class="timeline-content">
                <h4 class="timeline-title">${activity.title}</h4>
                <p class="timeline-description">${activity.description}</p>
                <span class="timeline-time">${this.formatTimestamp(activity.timestamp)}</span>
            </div>
        `;

        return activityDiv;
    },

    // ===== PESTAÑA DE RESEÑAS =====

    // Renderizar reseñas
    renderReviews() {
        const reviewsList = document.getElementById('reviewsList');
        if (!reviewsList) return;

        let filteredReviews = [...this.state.reviews];

        // Aplicar filtros
        if (this.state.filters.reviews.rating !== 'all') {
            const rating = parseInt(this.state.filters.reviews.rating);
            filteredReviews = filteredReviews.filter(r => r.rating === rating);
        }

        // Ordenar
        if (this.state.filters.reviews.sort === 'recent') {
            filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        reviewsList.innerHTML = '';

        if (filteredReviews.length === 0) {
            reviewsList.innerHTML = '<p class="text-center text-muted">No hay reseñas para mostrar.</p>';
            return;
        }

        filteredReviews.forEach(review => {
            const reviewElement = this.createReviewElement(review);
            reviewsList.appendChild(reviewElement);
        });
    },

    // Crear elemento de reseña
    createReviewElement(review) {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <img src="${review.reviewer.avatar}" alt="${review.reviewer.name}" class="reviewer-avatar">
                    <div class="reviewer-details">
                        <h5 class="reviewer-name">${review.reviewer.name}</h5>
                        <p class="reviewer-location">${review.reviewer.location}</p>
                        <div class="review-rating">
                            ${'⭐'.repeat(review.rating)}
                        </div>
                    </div>
                </div>
                <span class="review-date">${review.date}</span>
            </div>
            <div class="review-content">
                <h4 class="review-title">${review.title}</h4>
                <p class="review-comment">${review.comment}</p>
                <div class="review-product">Sobre: ${review.product.name}</div>
            </div>
            <div class="review-footer">
                <button class="btn btn-sm btn-secondary" onclick="ProfileModule.markReviewHelpful(${review.id})">
                    👍 Útil (${review.helpful})
                </button>
                <button class="btn btn-sm btn-secondary" onclick="ProfileModule.replyToReview(${review.id})">
                    💬 Responder
                </button>
            </div>
        `;

        return reviewDiv;
    },

    // ===== PESTAÑA DE CONEXIONES =====

    // Renderizar conexiones
    renderConnections() {
        const connectionsGrid = document.getElementById('connectionsGrid');
        if (!connectionsGrid) return;

        connectionsGrid.innerHTML = '';

        if (this.state.connections.length === 0) {
            connectionsGrid.innerHTML = '<p class="text-center text-muted">No tienes conexiones aún.</p>';
            return;
        }

        this.state.connections.forEach(connection => {
            const connectionElement = this.createConnectionElement(connection);
            connectionsGrid.appendChild(connectionElement);
        });
    },

    // Crear elemento de conexión
    createConnectionElement(connection) {
        const connectionDiv = document.createElement('div');
        connectionDiv.className = 'connection-card';
        connectionDiv.innerHTML = `
            <div class="connection-header">
                <img src="${connection.avatar}" alt="${connection.name}" class="connection-avatar">
                <div class="connection-status ${connection.status}"></div>
            </div>
            <div class="connection-info">
                <h4 class="connection-name">${connection.name}</h4>
                <div class="connection-rating">
                    ${'⭐'.repeat(Math.floor(connection.rating))}
                    <span class="rating-value">${connection.rating}</span>
                </div>
                <p class="connection-location">${connection.location}</p>
                <div class="connection-stats">
                    <span class="stat">${connection.products} productos</span>
                    <span class="stat">${connection.reviews} reseñas</span>
                </div>
                <div class="connection-actions">
                    <button class="btn btn-primary btn-small" onclick="ProfileModule.viewConnectionProfile(${connection.id})">
                        Ver Perfil
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="ProfileModule.messageConnection(${connection.id})">
                        Mensaje
                    </button>
                </div>
            </div>
        `;

        return connectionDiv;
    },

    // ===== PESTAÑA DE CONFIGURACIÓN =====

    // Renderizar configuración
    renderSettings() {
        // La configuración ya está en el HTML, solo necesitamos actualizar valores
        this.updateSettingsValues();
    },

    // Actualizar valores de configuración
    updateSettingsValues() {
        const user = this.state.currentUser;
        const prefs = user.preferences;

        // Información personal
        document.getElementById('firstName').value = user.firstName;
        document.getElementById('lastName').value = user.lastName;
        document.getElementById('email').value = user.email;
        document.getElementById('phone').value = user.phone;
        document.getElementById('bio').value = user.bio;

        // Idioma y región
        document.getElementById('language').value = prefs.language;
        document.getElementById('timezone').value = prefs.timezone;
        document.getElementById('currency').value = prefs.currency;

        // Switches de privacidad
        document.querySelector('input[type="checkbox"]').checked = prefs.privacy.publicProfile;
        // ... otros switches
    },

    // ===== MANEJO DE FILTROS =====

    // Manejar filtro de productos
    handleProductFilter() {
        this.renderProducts();
    },

    // Manejar filtro de actividad
    handleActivityFilter(filter) {
        this.state.filters.activity = filter;
        this.renderActivities();
    },

    // ===== MODALES =====

    // Abrir modal de editar perfil
    openEditProfileModal() {
        this.showModal(document.getElementById('editProfileModal'));
        this.populateEditProfileForm();
    },

    // Poblar formulario de editar perfil
    populateEditProfileForm() {
        const user = this.state.currentUser;

        document.getElementById('editFirstName').value = user.firstName;
        document.getElementById('editLastName').value = user.lastName;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editBio').value = user.bio;
        document.getElementById('editLocation').value = user.location;

        this.updateCharCount();
        this.renderTags();
    },

    // Abrir modal de configuración
    openSettingsModal() {
        this.showModal(document.getElementById('settingsModal'));
    },

    // Abrir modal de añadir producto
    openAddProductModal() {
        this.showModal(document.getElementById('addProductModal'));
    },

    // Cerrar modal de editar perfil
    closeEditProfileModal() {
        this.closeModal(document.getElementById('editProfileModal'));
    },

    // Cerrar modal de añadir producto
    closeAddProductModal() {
        this.closeModal(document.getElementById('addProductModal'));
    },

    // Mostrar modal
    showModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
        }
    },

    // Cerrar modal
    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    },

    // ===== MANEJO DE FORMULARIOS =====

    // Manejar edición de perfil
    handleEditProfile(e) {
        e.preventDefault();
        const form = e.target;

        const updatedProfile = {
            firstName: form.editFirstName.value,
            lastName: form.editLastName.value,
            username: form.editUsername.value,
            bio: form.editBio.value,
            location: form.editLocation.value,
            tags: this.getTagsFromContainer()
        };

        // En una implementación real, aquí se enviaría a la API
        this.updateProfile(updatedProfile);
        this.showNotification('Perfil actualizado exitosamente', 'success');
        this.closeEditProfileModal();
    },

    // Actualizar perfil
    updateProfile(profileData) {
        Object.assign(this.state.currentUser, profileData);
        this.updateProfileDisplay();
    },

    // Actualizar visualización del perfil
    updateProfileDisplay() {
        document.getElementById('profileName').textContent = this.state.currentUser.username;
        document.getElementById('profileBio').textContent = this.state.currentUser.bio;
        document.getElementById('profileLocation').textContent = this.state.currentUser.location;

        // Actualizar etiquetas
        this.renderProfileTags();
    },

    // Manejar añadir producto
    handleAddProduct(e) {
        e.preventDefault();
        const form = e.target;

        const newProduct = {
            id: this.state.products.length + 1,
            name: form.productName.value,
            description: form.productDescription.value,
            price: parseFloat(form.productPrice.value),
            category: form.productCategory.value,
            condition: form.productCondition.value,
            status: 'active',
            images: [], // En una implementación real, se procesarían las imágenes
            createdAt: new Date().toISOString().split('T')[0],
            views: 0,
            favorites: 0
        };

        this.state.products.unshift(newProduct);
        this.showNotification('Producto añadido exitosamente', 'success');
        this.closeAddProductModal();

        // Si estamos en la pestaña de productos, actualizar la vista
        if (this.state.currentTab === 'products') {
            this.renderProducts();
        }

        // Limpiar formulario
        form.reset();
    },

    // Manejar actualización de información personal
    handlePersonalInfoUpdate(e) {
        e.preventDefault();
        this.showNotification('Información personal actualizada', 'success');
    },

    // Manejar actualización de idioma
    handleLanguageUpdate(e) {
        e.preventDefault();
        this.showNotification('Preferencias de idioma actualizadas', 'success');
    },

    // ===== UTILIDADES =====

    // Actualizar contador de caracteres
    updateCharCount() {
        const textarea = document.getElementById('editBio');
        const charCount = document.getElementById('bioCharCount');
        if (textarea && charCount) {
            charCount.textContent = textarea.value.length;
        }
    },

    // Manejar cambio de avatar
    handleAvatarChange(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('editAvatarPreview').src = e.target.result;
                // En una implementación real, se subiría a la API
            };
            reader.readAsDataURL(file);
        }
    },

    // Manejar entrada de etiquetas
    handleTagInput(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.target;
            const tag = input.value.trim();

            if (tag && !this.state.currentUser.tags.includes(tag)) {
                this.state.currentUser.tags.push(tag);
                this.renderTags();
                input.value = '';
            }
        }
    },

    // Renderizar etiquetas
    renderTags() {
        const container = document.getElementById('tagsContainer');
        if (!container) return;

        container.innerHTML = this.state.currentUser.tags.map(tag =>
            `<span class="tag" onclick="ProfileModule.removeTag('${tag}')">${tag}</span>`
        ).join('');
    },

    // Renderizar etiquetas del perfil
    renderProfileTags() {
        const container = document.querySelector('.profile-tags');
        if (!container) return;

        container.innerHTML = this.state.currentUser.tags.map(tag =>
            `<span class="tag">${tag}</span>`
        ).join('');
    },

    // Obtener etiquetas del contenedor
    getTagsFromContainer() {
        const container = document.getElementById('tagsContainer');
        if (!container) return [];

        return Array.from(container.querySelectorAll('.tag')).map(tag => tag.textContent);
    },

    // Remover etiqueta
    removeTag(tagText) {
        const index = this.state.currentUser.tags.indexOf(tagText);
        if (index > -1) {
            this.state.currentUser.tags.splice(index, 1);
            this.renderTags();
        }
    },

    // Cambiar imagen de portada
    changeCoverImage() {
        // En una implementación real, se abriría un selector de archivos
        this.showNotification('Función de cambio de portada próximamente', 'info');
    },

    // Abrir selector de avatar
    openAvatarUpload() {
        document.getElementById('editAvatar').click();
    },

    // Encontrar conexiones
    findConnections() {
        this.showNotification('Función de búsqueda de conexiones próximamente', 'info');
    },

    // Editar producto
    editProduct(productId) {
        this.showNotification('Función de edición de productos próximamente', 'info');
    },

    // Eliminar producto
    deleteProduct(productId) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            this.state.products = this.state.products.filter(p => p.id !== productId);
            this.showNotification('Producto eliminado exitosamente', 'success');
            this.renderProducts();
        }
    },

    // Marcar reseña como útil
    markReviewHelpful(reviewId) {
        const review = this.state.reviews.find(r => r.id === reviewId);
        if (review) {
            review.helpful++;
            this.renderReviews();
        }
    },

    // Responder a reseña
    replyToReview(reviewId) {
        this.showNotification('Función de respuesta a reseñas próximamente', 'info');
    },

    // Ver perfil de conexión
    viewConnectionProfile(connectionId) {
        this.showNotification('Función de vista de perfil próximamente', 'info');
    },

    // Mensajear conexión
    messageConnection(connectionId) {
        this.showNotification('Función de mensajería próximamente', 'info');
    },

    // Mostrar notificación
    showNotification(message, type = 'info') {
        if (window.EcoSwapApp && window.EcoSwapApp.showNotification) {
            window.EcoSwapApp.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },

    // Formatear timestamp para la actividad
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = (now - date) / 1000;

        if (diffInSeconds < 60) {
            return `${Math.floor(diffInSeconds)} segundos`;
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)} minutos`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)} horas`;
        } else {
            return `${Math.floor(diffInSeconds / 86400)} días`;
        }
    }
};

// Inicializar módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ProfileModule.init();
});
