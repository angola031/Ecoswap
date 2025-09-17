/**
 * Módulo de Interacciones - EcoSwap
 * Maneja la funcionalidad de interacciones sociales, reseñas, eventos y actividad
 */

const InteractionsModule = {
    // Estado del módulo
    state: {
        currentTab: 'activity',
        activities: [],
        reviews: [],
        socialPosts: [],
        events: [],
        currentFilters: {
            activityType: 'all',
            activityTime: 'today',
            reviewRating: 'all',
            reviewSort: 'recent',
            eventCategory: 'all',
            eventLocation: '',
            eventDate: ''
        },
        pagination: {
            activities: { page: 1, hasMore: true },
            reviews: { page: 1, hasMore: true },
            social: { page: 1, hasMore: true },
            events: { page: 1, hasMore: true }
        }
    },

    // Inicialización
    init() {
        this.loadSampleData();
        this.bindEvents();
        this.showTab('activity');
        console.log('Módulo de Interacciones inicializado');
    },

    // Cargar datos de ejemplo
    loadSampleData() {
        // Actividades de ejemplo
        this.state.activities = [
            {
                id: 1,
                type: 'product_sold',
                user: {
                    name: 'Carlos Mendoza',
                    avatar: 'https://via.placeholder.com/40x40/4CAF50/FFFFFF?text=CM',
                    location: 'Pereira, Risaralda, Colombia'
                },
                product: {
                    name: 'iPhone 12 Pro',
                    price: 1500000,
                    currency: 'COP'
                },
                action: 'vendió',
                timestamp: '2024-01-20T10:30:00Z',
                rating: 5,
                comment: 'Excelente comprador, muy recomendado. Transacción rápida y segura.'
            },
            {
                id: 2,
                type: 'product_bought',
                user: {
                    name: 'Ana García',
                    avatar: 'https://via.placeholder.com/40x40/2196F3/FFFFFF?text=AG',
                    location: 'Bogotá D.C., Colombia'
                },
                product: {
                    name: 'Bicicleta Trek Marlin 5',
                    price: 850000,
                    currency: 'COP'
                },
                action: 'compró',
                timestamp: '2024-01-19T15:45:00Z',
                rating: 5,
                comment: 'La bicicleta está perfecta, tal como se describió. Vendedor muy honesto.'
            },
            {
                id: 3,
                type: 'review_received',
                user: {
                    name: 'Luis Rodríguez',
                    avatar: 'https://via.placeholder.com/40x40/FF9800/FFFFFF?text=LR',
                    location: 'Medellín, Antioquia, Colombia'
                },
                product: {
                    name: 'Mesa de Madera Vintage',
                    price: 450000,
                    currency: 'COP'
                },
                action: 'recibió una reseña',
                timestamp: '2024-01-18T12:20:00Z',
                rating: 5,
                comment: 'Producto de excelente calidad, envío rápido y bien empacado.'
            },
            {
                id: 4,
                type: 'product_listed',
                user: {
                    name: 'María López',
                    avatar: 'https://via.placeholder.com/40x40/9C27B0/FFFFFF?text=ML',
                    location: 'Cali, Valle del Cauca, Colombia'
                },
                product: {
                    name: 'Libros Colección Harry Potter',
                    price: 180000,
                    currency: 'COP'
                },
                action: 'publicó',
                timestamp: '2024-01-17T09:15:00Z',
                rating: null,
                comment: 'Nueva colección disponible para los amantes de la fantasía.'
            },
            {
                id: 5,
                type: 'exchange_completed',
                user: {
                    name: 'Roberto Silva',
                    avatar: 'https://via.placeholder.com/40x40/8BC34A/FFFFFF?text=RS',
                    location: 'Barranquilla, Atlántico, Colombia'
                },
                product: {
                    name: 'Guitarra Acústica Yamaha',
                    price: 320000,
                    currency: 'COP'
                },
                action: 'completó un intercambio',
                timestamp: '2024-01-16T16:30:00Z',
                rating: 4,
                comment: 'Intercambio exitoso por una guitarra eléctrica. Ambos quedamos satisfechos.'
            }
        ];

        // Reseñas de ejemplo
        this.state.reviews = [
            {
                id: 1,
                product: {
                    name: 'iPhone 12 Pro',
                    image: 'https://via.placeholder.com/60x60/4CAF50/FFFFFF?text=iPhone'
                },
                reviewer: {
                    name: 'Carlos Mendoza',
                    avatar: 'https://via.placeholder.com/40x40/4CAF50/FFFFFF?text=CM',
                    location: 'Pereira, Risaralda, Colombia'
                },
                rating: 5,
                title: 'Excelente producto y vendedor',
                comment: 'El iPhone está en perfecto estado, tal como se describió. El vendedor fue muy profesional y la transacción fue rápida y segura. Definitivamente lo recomiendo.',
                date: '2024-01-20',
                helpful: 12,
                verified: true
            },
            {
                id: 2,
                product: {
                    name: 'Bicicleta Trek Marlin 5',
                    image: 'https://via.placeholder.com/60x60/4CAF50/FFFFFF?text=Bici'
                },
                reviewer: {
                    name: 'Ana García',
                    avatar: 'https://via.placeholder.com/40x40/2196F3/FFFFFF?text=AG',
                    location: 'Bogotá D.C., Colombia'
                },
                rating: 5,
                title: 'Bicicleta perfecta para senderos',
                comment: 'La bicicleta está en excelente estado, perfecta para mis aventuras en los senderos de Bogotá. El vendedor fue muy honesto sobre el estado real del producto.',
                date: '2024-01-19',
                helpful: 8,
                verified: true
            },
            {
                id: 3,
                product: {
                    name: 'Mesa de Madera Vintage',
                    image: 'https://via.placeholder.com/60x60/8D6E63/FFFFFF?text=Mesa'
                },
                reviewer: {
                    name: 'Luis Rodríguez',
                    avatar: 'https://via.placeholder.com/40x40/FF9800/FFFFFF?text=LR',
                    location: 'Medellín, Antioquia, Colombia'
                },
                rating: 4,
                title: 'Mesa hermosa, envío perfecto',
                comment: 'La mesa es exactamente como se ve en las fotos. El envío desde Medellín fue rápido y el producto llegó perfectamente empacado. Solo le doy 4 estrellas porque tardó un poco más de lo esperado.',
                date: '2024-01-18',
                helpful: 15,
                verified: true
            },
            {
                id: 4,
                product: {
                    name: 'Libros Colección Harry Potter',
                    image: 'https://via.placeholder.com/60x60/FFC107/FFFFFF?text=Libros'
                },
                reviewer: {
                    name: 'María López',
                    avatar: 'https://via.placeholder.com/40x40/9C27B0/FFFFFF?text=ML',
                    location: 'Cali, Valle del Cauca, Colombia'
                },
                rating: 5,
                title: 'Colección perfecta para mi hijo',
                comment: 'Mi hijo está encantado con la colección. Los libros están en perfecto estado y llegaron antes de lo esperado. El vendedor fue muy amable y respondió todas mis preguntas.',
                date: '2024-01-17',
                helpful: 6,
                verified: true
            },
            {
                id: 5,
                product: {
                    name: 'Guitarra Acústica Yamaha',
                    image: 'https://via.placeholder.com/60x60/8BC34A/FFFFFF?text=Guitarra'
                },
                reviewer: {
                    name: 'Roberto Silva',
                    avatar: 'https://via.placeholder.com/40x40/8BC34A/FFFFFF?text=RS',
                    location: 'Barranquilla, Atlántico, Colombia'
                },
                rating: 5,
                title: 'Guitarra perfecta para principiantes',
                comment: 'Como principiante, esta guitarra es ideal para mí. El sonido es hermoso y la calidad es excelente. El vendedor incluyó extras como funda y afinador.',
                date: '2024-01-16',
                helpful: 9,
                verified: true
            }
        ];

        // Publicaciones sociales de ejemplo
        this.state.socialPosts = [
            {
                id: 1,
                user: { name: 'EcoUser123', avatar: 'https://via.placeholder.com/45x45/4CAF50/FFFFFF?text=E' },
                content: '¡Hoy encontré un tesoro en EcoSwap! Una bicicleta vintage en perfecto estado por solo €45. ¡La sostenibilidad nunca fue tan accesible! 🚲♻️',
                time: 'hace 1 hora',
                likes: 23,
                comments: 8,
                shares: 5,
                image: null,
                liked: false,
                commented: false,
                shared: false
            },
            {
                id: 2,
                user: { name: 'VintageCollector', avatar: 'https://via.placeholder.com/45x45/FF9800/FFFFFF?text=V' },
                content: 'Compartiendo mi colección de ropa vintage de los años 80-90. Cada pieza tiene una historia única y contribuye a la moda circular. ¿Alguien más colecciona vintage? 👗✨',
                time: 'hace 3 horas',
                likes: 45,
                comments: 15,
                shares: 12,
                image: 'https://via.placeholder.com/400x300/FF9800/FFFFFF?text=Vintage+Collection',
                liked: true,
                commented: false,
                shared: false
            },
            {
                id: 3,
                user: { name: 'EcoArtisan', avatar: 'https://via.placeholder.com/45x45/2196F3/FFFFFF?text=E' },
                content: 'Taller de reciclaje creativo este sábado en Madrid. Aprenderemos a transformar materiales reciclados en objetos útiles y hermosos. ¡Plazas limitadas! 🎨♻️',
                time: 'hace 6 horas',
                likes: 67,
                comments: 23,
                shares: 18,
                image: null,
                liked: false,
                commented: true,
                shared: false
            }
        ];

        // Eventos de ejemplo
        this.state.events = [
            {
                id: 1,
                title: 'Mercado de Segunda Mano Pereira',
                description: 'Gran mercado de productos de segunda mano en el centro de Pereira. Productos únicos y sostenibles.',
                location: 'Centro Comercial Pereira Plaza, Pereira, Risaralda, Colombia',
                coordinates: { lat: 4.8143, lng: -75.6946 },
                date: '2024-02-15',
                time: '10:00',
                duration: '8 horas',
                organizer: {
                    name: 'EcoSwap Pereira',
                    avatar: 'https://via.placeholder.com/40x40/4CAF50/FFFFFF?text=EP',
                    verified: true
                },
                attendees: 45,
                maxAttendees: 100,
                category: 'market',
                tags: ['Mercado', 'Segunda Mano', 'Sostenible', 'Pereira'],
                price: 0,
                currency: 'COP',
                status: 'upcoming'
            },
            {
                id: 2,
                title: 'Intercambio de Libros Bogotá',
                description: 'Evento para intercambiar libros usados en buen estado. Trae tus libros y encuentra nuevos tesoros literarios.',
                location: 'Biblioteca Pública Virgilio Barco, Bogotá D.C., Colombia',
                coordinates: { lat: 4.7110, lng: -74.0721 },
                date: '2024-02-20',
                time: '14:00',
                duration: '4 horas',
                organizer: {
                    name: 'BookLovers Bogotá',
                    avatar: 'https://via.placeholder.com/40x40/2196F3/FFFFFF?text=BL',
                    verified: true
                },
                attendees: 28,
                maxAttendees: 50,
                category: 'exchange',
                tags: ['Libros', 'Intercambio', 'Literatura', 'Bogotá'],
                price: 0,
                currency: 'COP',
                status: 'upcoming'
            },
            {
                id: 3,
                title: 'Taller de Reparación Medellín',
                description: 'Aprende a reparar y dar nueva vida a productos de segunda mano. Taller práctico y divertido.',
                location: 'Centro de Innovación Ruta N, Medellín, Antioquia, Colombia',
                coordinates: { lat: 6.2442, lng: -75.5812 },
                date: '2024-02-25',
                time: '09:00',
                duration: '6 horas',
                organizer: {
                    name: 'EcoArtisans Medellín',
                    avatar: 'https://via.placeholder.com/40x40/FF9800/FFFFFF?text=EA',
                    verified: true
                },
                attendees: 32,
                maxAttendees: 40,
                category: 'workshop',
                tags: ['Taller', 'Reparación', 'Sostenible', 'Medellín'],
                price: 50000,
                currency: 'COP',
                status: 'upcoming'
            },
            {
                id: 4,
                title: 'Feria de Música Cali',
                description: 'Feria de instrumentos musicales de segunda mano. Encuentra tu próximo instrumento favorito.',
                location: 'Plaza de Cayzedo, Cali, Valle del Cauca, Colombia',
                coordinates: { lat: 3.4516, lng: -76.5320 },
                date: '2024-03-01',
                time: '11:00',
                duration: '10 horas',
                organizer: {
                    name: 'MusicSwap Cali',
                    avatar: 'https://via.placeholder.com/40x40/9C27B0/FFFFFF?text=MC',
                    verified: true
                },
                attendees: 67,
                maxAttendees: 150,
                category: 'fair',
                tags: ['Música', 'Instrumentos', 'Segunda Mano', 'Cali'],
                price: 0,
                currency: 'COP',
                status: 'upcoming'
            },
            {
                id: 5,
                title: 'Networking Sostenible Barranquilla',
                description: 'Evento de networking para emprendedores y empresas sostenibles. Conecta con personas que comparten tu visión.',
                location: 'Centro de Eventos Puerta de Oro, Barranquilla, Atlántico, Colombia',
                coordinates: { lat: 10.9685, lng: -74.7813 },
                date: '2024-03-05',
                time: '18:00',
                duration: '3 horas',
                organizer: {
                    name: 'Green Business Barranquilla',
                    avatar: 'https://via.placeholder.com/40x40/8BC34A/FFFFFF?text=GB',
                    verified: true
                },
                attendees: 89,
                maxAttendees: 120,
                category: 'networking',
                tags: ['Networking', 'Sostenible', 'Emprendimiento', 'Barranquilla'],
                price: 25000,
                currency: 'COP',
                status: 'upcoming'
            }
        ];
    },

    // Vincular eventos
    bindEvents() {
        // Navegación entre pestañas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Filtros de actividad
        document.getElementById('activityType').addEventListener('change', this.handleActivityFilter.bind(this));
        document.getElementById('activityTime').addEventListener('change', this.handleActivityFilter.bind(this));
        document.querySelector('.refresh-activity-btn').addEventListener('click', this.refreshActivity.bind(this));

        // Filtros de reseñas
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', this.handleReviewFilter.bind(this));
        });
        document.getElementById('sortReviews').addEventListener('change', this.handleReviewSort.bind(this));

        // Botones de reseñas
        document.querySelector('.write-review-btn').addEventListener('click', this.openCreateReviewModal.bind(this));
        document.getElementById('createReviewForm').addEventListener('submit', this.handleCreateReview.bind(this));

        // Social
        document.querySelector('.create-post-btn').addEventListener('click', this.toggleCreatePost.bind(this));
        document.getElementById('createPostForm').addEventListener('submit', this.handleCreatePost.bind(this));
        document.getElementById('postContent').addEventListener('input', this.handlePostInput.bind(this));

        // Eventos
        document.querySelector('.create-event-btn').addEventListener('click', this.openCreateEventModal.bind(this));
        document.getElementById('createEventForm').addEventListener('submit', this.handleCreateEvent.bind(this));
        document.getElementById('eventCategory').addEventListener('change', this.handleEventFilter.bind(this));
        document.getElementById('eventLocation').addEventListener('input', this.handleEventFilter.bind(this));
        document.getElementById('eventDate').addEventListener('change', this.handleEventFilter.bind(this));

        // Cargar más contenido
        document.getElementById('loadMoreActivity').addEventListener('click', this.loadMoreActivity.bind(this));

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

        // Contador de caracteres para reseñas
        document.getElementById('reviewText').addEventListener('input', this.updateCharCount.bind(this));
    },

    // Mostrar pestaña específica
    showTab(tabName) {
        // Ocultar todas las pestañas
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Mostrar pestaña seleccionada
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        this.state.currentTab = tabName;

        // Cargar contenido según la pestaña
        switch (tabName) {
            case 'activity':
                this.renderActivities();
                break;
            case 'reviews':
                this.renderReviews();
                break;
            case 'social':
                this.renderSocialPosts();
                break;
            case 'events':
                this.renderEvents();
                break;
        }
    },

    // ===== PESTAÑA DE ACTIVIDAD =====

    // Manejar filtros de actividad
    handleActivityFilter() {
        this.state.currentFilters.activityType = document.getElementById('activityType').value;
        this.state.currentFilters.activityTime = document.getElementById('activityTime').value;
        this.renderActivities();
    },

    // Actualizar actividad
    refreshActivity() {
        this.showNotification('Actividad actualizada', 'success');
        this.renderActivities();
    },

    // Renderizar actividades
    renderActivities() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;

        let activities = [...this.state.activities];

        // Aplicar filtros
        if (this.state.currentFilters.activityType !== 'all') {
            activities = activities.filter(a => a.type === this.state.currentFilters.activityType);
        }

        // Filtrar por tiempo (simulado)
        if (this.state.currentFilters.activityTime !== 'all') {
            // En una implementación real, aquí se filtraría por fecha real
            activities = activities.slice(0, Math.min(activities.length, 3));
        }

        activityFeed.innerHTML = '';

        if (activities.length === 0) {
            activityFeed.innerHTML = '<p class="text-center text-muted">No hay actividades para mostrar con los filtros aplicados.</p>';
            return;
        }

        activities.forEach(activity => {
            const activityElement = this.createActivityElement(activity);
            activityFeed.appendChild(activityElement);
        });
    },

    // Crear elemento de actividad
    createActivityElement(activity) {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'activity-item';
        activityDiv.innerHTML = `
            <img src="${activity.user.avatar}" alt="${activity.user.name}" class="activity-avatar">
            <div class="activity-content">
                <div class="activity-header">
                    <span class="activity-user">${activity.user.name}</span>
                    <span class="activity-action">${activity.action}</span>
                    <span class="activity-time">${activity.time}</span>
                </div>
                <div class="activity-text">${activity.text}</div>
                <div class="activity-meta">
                    <span class="activity-likes" onclick="InteractionsModule.toggleLike(${activity.id})">
                        <i class="icon">👍</i> ${activity.likes}
                    </span>
                    <span class="activity-comments">
                        <i class="icon">💬</i> ${activity.comments}
                    </span>
                    <span class="activity-shares">
                        <i class="icon">📤</i> ${activity.shares}
                    </span>
                </div>
            </div>
        `;
        return activityDiv;
    },

    // Cargar más actividad
    loadMoreActivity() {
        this.state.pagination.activities.page++;
        this.showNotification('Cargando más actividad...', 'info');

        // Simular carga
        setTimeout(() => {
            this.showNotification('Actividad cargada', 'success');
        }, 1000);
    },

    // ===== PESTAÑA DE RESEÑAS =====

    // Manejar filtro de reseñas por rating
    handleReviewFilter(e) {
        document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.state.currentFilters.reviewRating = e.currentTarget.dataset.rating;
        this.renderReviews();
    },

    // Manejar ordenación de reseñas
    handleReviewSort(e) {
        this.state.currentFilters.reviewSort = e.target.value;
        this.renderReviews();
    },

    // Renderizar reseñas
    renderReviews() {
        const reviewsList = document.getElementById('reviewsList');
        if (!reviewsList) return;

        let reviews = [...this.state.reviews];

        // Aplicar filtro de rating
        if (this.state.currentFilters.reviewRating !== 'all') {
            const rating = parseInt(this.state.currentFilters.reviewRating);
            reviews = reviews.filter(r => r.rating === rating);
        }

        // Aplicar ordenación
        switch (this.state.currentFilters.reviewSort) {
            case 'rating':
                reviews.sort((a, b) => b.rating - a.rating);
                break;
            case 'helpful':
                reviews.sort((a, b) => b.helpful - a.helpful);
                break;
            case 'recent':
            default:
                // Mantener orden original (más recientes primero)
                break;
        }

        reviewsList.innerHTML = '';

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p class="text-center text-muted">No hay reseñas para mostrar con los filtros aplicados.</p>';
            return;
        }

        reviews.forEach(review => {
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
                    <img src="${review.user.avatar}" alt="${review.user.name}" class="reviewer-avatar">
                    <div class="reviewer-details">
                        <h4>${review.user.name}</h4>
                        <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                        <span class="review-date">${review.date}</span>
                    </div>
                </div>
            </div>
            <div class="review-content">
                <h5>${review.title}</h5>
                <p class="review-text">${review.text}</p>
            </div>
            <div class="review-product">
                <img src="${review.product.image}" alt="${review.product.name}">
                <div class="review-product-info">
                    <h6>${review.product.name}</h6>
                    <span class="product-price">${review.product.price}</span>
                </div>
            </div>
            <div class="review-actions">
                <button class="btn btn-secondary helpful-btn" onclick="InteractionsModule.markHelpful(${review.id})">
                    <i class="icon">👍</i>
                    Útil (<span>${review.helpful}</span>)
                </button>
                <button class="btn btn-secondary" onclick="InteractionsModule.openReviewDetail(${review.id})">
                    Ver Detalles
                </button>
            </div>
        `;
        return reviewDiv;
    },

    // Abrir modal de crear reseña
    openCreateReviewModal() {
        this.showModal(document.getElementById('createReviewModal'));
        this.populateProductOptions();
    },

    // Poblar opciones de productos
    populateProductOptions() {
        const select = document.getElementById('reviewProduct');
        // En una implementación real, esto vendría de la API de productos
        select.innerHTML = `
            <option value="">Selecciona un producto</option>
            <option value="1">iPhone 12 Pro - €150</option>
            <option value="2">Camiseta Vintage Nike - €25</option>
            <option value="3">Mesa de Madera Reciclada - €80</option>
        `;
    },

    // Manejar creación de reseña
    handleCreateReview(e) {
        e.preventDefault();
        const form = e.target;

        const newReview = {
            id: this.state.reviews.length + 1,
            user: { name: 'Current User', avatar: 'https://via.placeholder.com/50x50/CCCCCC/FFFFFF?text=CU' },
            product: { name: 'Producto Seleccionado', price: '€0', image: 'https://via.placeholder.com/60x60/CCCCCC/FFFFFF?text=P' },
            rating: parseInt(form.querySelector('input[name="rating"]:checked')?.value || 5),
            title: form.reviewTitle.value,
            text: form.reviewText.value,
            date: 'hace un momento',
            helpful: 0,
            images: []
        };

        this.state.reviews.unshift(newReview);
        this.showNotification('Reseña publicada exitosamente', 'success');
        this.closeModal(document.getElementById('createReviewModal'));
        this.renderReviews();
    },

    // Marcar reseña como útil
    markHelpful(reviewId) {
        const review = this.state.reviews.find(r => r.id === reviewId);
        if (review) {
            review.helpful++;
            this.renderReviews();
            this.showNotification('Gracias por tu feedback', 'success');
        }
    },

    // Abrir detalles de reseña
    openReviewDetail(reviewId) {
        const review = this.state.reviews.find(r => r.id === reviewId);
        if (!review) return;

        document.getElementById('reviewDetailAvatar').src = review.user.avatar;
        document.getElementById('reviewDetailName').textContent = review.user.name;
        document.getElementById('reviewDetailRating').innerHTML = '⭐'.repeat(review.rating);
        document.getElementById('reviewDetailDate').textContent = review.date;
        document.getElementById('reviewDetailText').textContent = review.text;
        document.getElementById('helpfulCount').textContent = review.helpful;

        this.showModal(document.getElementById('reviewDetailModal'));
    },

    // ===== PESTAÑA DE SOCIAL =====

    // Alternar creación de publicación
    toggleCreatePost() {
        const section = document.getElementById('createPostSection');
        if (section.style.display === 'none') {
            section.style.display = 'block';
            document.querySelector('.create-post-btn').textContent = 'Cancelar';
        } else {
            section.style.display = 'none';
            document.querySelector('.create-post-btn').textContent = 'Crear Publicación';
            document.getElementById('createPostForm').reset();
        }
    },

    // Manejar entrada de publicación
    handlePostInput(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    },

    // Manejar creación de publicación
    handleCreatePost(e) {
        e.preventDefault();
        const form = e.target;
        const content = form.postContent.value.trim();

        if (!content) {
            this.showNotification('Por favor, escribe algo para publicar', 'error');
            return;
        }

        const newPost = {
            id: this.state.socialPosts.length + 1,
            user: { name: 'Current User', avatar: 'https://via.placeholder.com/45x45/CCCCCC/FFFFFF?text=CU' },
            content: content,
            time: 'hace un momento',
            likes: 0,
            comments: 0,
            shares: 0,
            image: null,
            liked: false,
            commented: false,
            shared: false
        };

        this.state.socialPosts.unshift(newPost);
        this.showNotification('Publicación creada exitosamente', 'success');

        form.reset();
        this.toggleCreatePost();
        this.renderSocialPosts();
    },

    // Renderizar publicaciones sociales
    renderSocialPosts() {
        const socialFeed = document.getElementById('socialFeed');
        if (!socialFeed) return;

        socialFeed.innerHTML = '';

        this.state.socialPosts.forEach(post => {
            const postElement = this.createSocialPostElement(post);
            socialFeed.appendChild(postElement);
        });
    },

    // Crear elemento de publicación social
    createSocialPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'social-post';
        postDiv.innerHTML = `
            <div class="post-header">
                <img src="${post.user.avatar}" alt="${post.user.name}" class="post-author-avatar">
                <div class="post-author-info">
                    <h4>${post.user.name}</h4>
                    <span class="post-time">${post.time}</span>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
            <div class="post-actions-bar">
                <div class="post-actions-left">
                    <button class="post-action-btn ${post.liked ? 'active' : ''}" onclick="InteractionsModule.togglePostLike(${post.id})">
                        <i class="icon">👍</i>
                        ${post.likes > 0 ? post.likes : ''}
                    </button>
                    <button class="post-action-btn ${post.commented ? 'active' : ''}" onclick="InteractionsModule.togglePostComment(${post.id})">
                        <i class="icon">💬</i>
                        ${post.comments > 0 ? post.comments : ''}
                    </button>
                    <button class="post-action-btn ${post.shared ? 'active' : ''}" onclick="InteractionsModule.togglePostShare(${post.id})">
                        <i class="icon">📤</i>
                        ${post.shares > 0 ? post.shares : ''}
                    </button>
                </div>
            </div>
        `;
        return postDiv;
    },

    // Alternar like en publicación
    togglePostLike(postId) {
        const post = this.state.socialPosts.find(p => p.id === postId);
        if (post) {
            post.liked = !post.liked;
            post.likes += post.liked ? 1 : -1;
            this.renderSocialPosts();
        }
    },

    // Alternar comentario en publicación
    togglePostComment(postId) {
        const post = this.state.socialPosts.find(p => p.id === postId);
        if (post) {
            post.commented = !post.commented;
            post.comments += post.commented ? 1 : -1;
            this.renderSocialPosts();
        }
    },

    // Alternar compartir en publicación
    togglePostShare(postId) {
        const post = this.state.socialPosts.find(p => p.id === postId);
        if (post) {
            post.shared = !post.shared;
            post.shares += post.shared ? 1 : -1;
            this.renderSocialPosts();
            if (post.shared) {
                this.showNotification('Publicación compartida', 'success');
            }
        }
    },

    // ===== PESTAÑA DE EVENTOS =====

    // Manejar filtros de eventos
    handleEventFilter() {
        this.state.currentFilters.eventCategory = document.getElementById('eventCategory').value;
        this.state.currentFilters.eventLocation = document.getElementById('eventLocation').value;
        this.state.currentFilters.eventDate = document.getElementById('eventDate').value;
        this.renderEvents();
    },

    // Renderizar eventos
    renderEvents() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        let events = [...this.state.events];

        // Aplicar filtros
        if (this.state.currentFilters.eventCategory !== 'all') {
            events = events.filter(e => e.category === this.state.currentFilters.eventCategory);
        }

        if (this.state.currentFilters.eventLocation) {
            const location = this.state.currentFilters.eventLocation.toLowerCase();
            events = events.filter(e => e.location.toLowerCase().includes(location));
        }

        if (this.state.currentFilters.eventDate) {
            events = events.filter(e => e.date >= this.state.currentFilters.eventDate);
        }

        eventsList.innerHTML = '';

        if (events.length === 0) {
            eventsList.innerHTML = '<p class="text-center text-muted">No hay eventos para mostrar con los filtros aplicados.</p>';
            return;
        }

        events.forEach(event => {
            const eventElement = this.createEventElement(event);
            eventsList.appendChild(eventElement);
        });
    },

    // Crear elemento de evento
    createEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item';
        eventDiv.innerHTML = `
            <img src="${event.image}" alt="${event.name}" class="event-image">
            <div class="event-content">
                <span class="event-category">${this.getEventCategoryLabel(event.category)}</span>
                <h3 class="event-title">${event.name}</h3>
                <p class="event-description">${event.description}</p>
                <div class="event-details">
                    <div class="event-detail">
                        <i class="icon">📅</i>
                        <span>${this.formatEventDate(event.date)} a las ${event.time}</span>
                    </div>
                    <div class="event-detail">
                        <i class="icon">⏱️</i>
                        <span>${event.duration} hora${event.duration > 1 ? 's' : ''}</span>
                    </div>
                    <div class="event-detail">
                        <i class="icon">📍</i>
                        <span>${event.location}</span>
                    </div>
                    <div class="event-detail">
                        <i class="icon">👥</i>
                        <span>${event.currentAttendees}/${event.maxAttendees} asistentes</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="btn btn-primary" onclick="InteractionsModule.joinEvent(${event.id})">
                        Unirse
                    </button>
                    <button class="btn btn-secondary" onclick="InteractionsModule.viewEventDetails(${event.id})">
                        Ver Detalles
                    </button>
                </div>
            </div>
        `;
        return eventDiv;
    },

    // Obtener etiqueta de categoría de evento
    getEventCategoryLabel(category) {
        const labels = {
            'swap': 'Intercambio',
            'workshop': 'Taller',
            'meetup': 'Encuentro',
            'charity': 'Beneficencia'
        };
        return labels[category] || category;
    },

    // Formatear fecha de evento
    formatEventDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Abrir modal de crear evento
    openCreateEventModal() {
        this.showModal(document.getElementById('createEventModal'));
    },

    // Manejar creación de evento
    handleCreateEvent(e) {
        e.preventDefault();
        const form = e.target;

        const newEvent = {
            id: this.state.events.length + 1,
            name: form.eventName.value,
            description: form.eventDescription.value,
            category: form.eventCategory.value,
            date: form.eventDate.value,
            time: form.eventTime.value,
            duration: parseInt(form.eventDuration.value),
            location: form.eventLocation.value,
            maxAttendees: parseInt(form.eventMaxAttendees.value) || 50,
            currentAttendees: 0,
            image: 'https://via.placeholder.com/400x200/4CAF50/FFFFFF?text=New+Event',
            organizer: { name: 'Current User', avatar: 'https://via.placeholder.com/50x50/CCCCCC/FFFFFF?text=CU' }
        };

        this.state.events.unshift(newEvent);
        this.showNotification('Evento creado exitosamente', 'success');
        this.closeModal(document.getElementById('createEventModal'));
        this.renderEvents();
    },

    // Unirse a evento
    joinEvent(eventId) {
        const event = this.state.events.find(e => e.id === eventId);
        if (event && event.currentAttendees < event.maxAttendees) {
            event.currentAttendees++;
            this.renderEvents();
            this.showNotification('¡Te has unido al evento!', 'success');
        } else if (event.currentAttendees >= event.maxAttendees) {
            this.showNotification('El evento está completo', 'error');
        }
    },

    // Ver detalles del evento
    viewEventDetails(eventId) {
        const event = this.state.events.find(e => e.id === eventId);
        if (event) {
            this.showNotification(`Evento: ${event.name}`, 'info');
            // En una implementación real, aquí se abriría un modal con detalles completos
        }
    },

    // ===== UTILIDADES =====

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

    // Actualizar contador de caracteres
    updateCharCount(e) {
        const count = e.target.value.length;
        document.getElementById('charCount').textContent = count;

        if (count > 900) {
            document.getElementById('charCount').style.color = 'var(--danger-color)';
        } else if (count > 800) {
            document.getElementById('charCount').style.color = 'var(--warning-color)';
        } else {
            document.getElementById('charCount').style.color = 'var(--text-muted)';
        }
    },

    // Mostrar notificación
    showNotification(message, type = 'info') {
        if (window.EcoSwapApp && window.EcoSwapApp.showNotification) {
            window.EcoSwapApp.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },

    // Scroll al top
    scrollToTop(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

// Inicializar módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    InteractionsModule.init();
});
