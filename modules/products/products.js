/**
 * Módulo de Productos - EcoSwap
 * Maneja la funcionalidad de búsqueda, filtrado y visualización de productos
 */

const ProductsModule = {
    // Estado del módulo
    state: {
        products: [],
        filteredProducts: [],
        currentFilters: {
            categories: [],
            priceRange: { min: 0, max: 1000 },
            condition: [],
            location: '',
            searchQuery: ''
        },
        currentView: 'grid',
        currentSort: 'relevance',
        currentPage: 1,
        productsPerPage: 12,
        favorites: new Set()
    },

    // Inicialización
    init() {
        this.loadProducts();
        this.bindEvents();
        this.loadFavorites();
        this.applyFilters();
        console.log('Módulo de Productos inicializado');
    },

    // Cargar productos de ejemplo
    loadProducts() {
        // Datos de ejemplo de productos
        this.state.products = [
            {
                id: 1,
                name: 'iPhone 12 Pro',
                description: 'iPhone 12 Pro en excelente estado, solo 6 meses de uso. Incluye cargador y funda original.',
                price: 1500000,
                currency: 'COP',
                originalPrice: 2800000,
                condition: 'excellent',
                category: 'electronics',
                subcategory: 'smartphones',
                images: [
                    'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=iPhone+12+Pro',
                    'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=iPhone+12+Pro+2',
                    'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=iPhone+12+Pro+3'
                ],
                location: 'Pereira, Risaralda, Colombia',
                coordinates: { lat: 4.8143, lng: -75.6946 },
                seller: {
                    id: 1,
                    name: 'Carlos Mendoza',
                    rating: 4.8,
                    reviews: 156,
                    verified: true,
                    memberSince: '2023'
                },
                tags: ['Apple', 'iPhone', 'Smartphone', 'Tecnología', 'Electrónicos'],
                features: ['128GB', 'Azul Pacífico', 'iOS 16', 'Cámara Triple'],
                status: 'available',
                views: 245,
                favorites: 18,
                createdAt: '2024-01-15',
                updatedAt: '2024-01-20'
            },
            {
                id: 2,
                name: 'Bicicleta Trek Marlin 5',
                description: 'Bicicleta de montaña Trek Marlin 5, perfecta para senderos y ciudad. Solo 1 año de uso.',
                price: 850000,
                currency: 'COP',
                originalPrice: 1200000,
                condition: 'good',
                category: 'sports',
                subcategory: 'bicycles',
                images: [
                    'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Bicicleta+Trek',
                    'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Bicicleta+Trek+2'
                ],
                location: 'Bogotá D.C., Colombia',
                coordinates: { lat: 4.7110, lng: -74.0721 },
                seller: {
                    id: 2,
                    name: 'Ana García',
                    rating: 4.9,
                    reviews: 89,
                    verified: true,
                    memberSince: '2022'
                },
                tags: ['Bicicleta', 'Montaña', 'Trek', 'Deportes', 'Transporte'],
                features: ['Talla M', '21 Velocidades', 'Frenos de Disco', 'Suspensión Delantera'],
                status: 'available',
                views: 189,
                favorites: 12,
                createdAt: '2024-01-10',
                updatedAt: '2024-01-18'
            },
            {
                id: 3,
                name: 'Mesa de Madera Vintage',
                description: 'Mesa de comedor vintage de madera maciza, perfecta para 6 personas. Estilo rústico elegante.',
                price: 450000,
                currency: 'COP',
                originalPrice: 800000,
                condition: 'excellent',
                category: 'furniture',
                subcategory: 'tables',
                images: [
                    'https://via.placeholder.com/300x200/8D6E63/FFFFFF?text=Mesa+Vintage',
                    'https://via.placeholder.com/300x200/795548/FFFFFF?text=Mesa+Vintage+2'
                ],
                location: 'Medellín, Antioquia, Colombia',
                coordinates: { lat: 6.2442, lng: -75.5812 },
                seller: {
                    id: 3,
                    name: 'Luis Rodríguez',
                    rating: 4.7,
                    reviews: 203,
                    verified: true,
                    memberSince: '2021'
                },
                tags: ['Mesa', 'Madera', 'Vintage', 'Muebles', 'Comedor'],
                features: ['Madera de Roble', '120x80cm', '6 Sillas Incluidas', 'Acabado Natural'],
                status: 'available',
                views: 312,
                favorites: 25,
                createdAt: '2024-01-05',
                updatedAt: '2024-01-19'
            },
            {
                id: 4,
                name: 'Libros Colección Harry Potter',
                description: 'Colección completa de Harry Potter en español, edición especial. Libros en perfecto estado.',
                price: 180000,
                currency: 'COP',
                originalPrice: 350000,
                condition: 'excellent',
                category: 'books',
                subcategory: 'fiction',
                images: [
                    'https://via.placeholder.com/300x200/FFC107/FFFFFF?text=Harry+Potter',
                    'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Harry+Potter+2'
                ],
                location: 'Cali, Valle del Cauca, Colombia',
                coordinates: { lat: 3.4516, lng: -76.5320 },
                seller: {
                    id: 4,
                    name: 'María López',
                    rating: 4.6,
                    reviews: 67,
                    verified: true,
                    memberSince: '2023'
                },
                tags: ['Libros', 'Harry Potter', 'Fantasía', 'Colección', 'Literatura'],
                features: ['7 Libros', 'Edición Especial', 'Tapa Dura', 'Español'],
                status: 'available',
                views: 156,
                favorites: 31,
                createdAt: '2024-01-12',
                updatedAt: '2024-01-20'
            },
            {
                id: 5,
                name: 'Guitarra Acústica Yamaha',
                description: 'Guitarra acústica Yamaha F310, perfecta para principiantes. Incluye funda y afinador.',
                price: 320000,
                currency: 'COP',
                originalPrice: 450000,
                condition: 'good',
                category: 'music',
                subcategory: 'guitars',
                images: [
                    'https://via.placeholder.com/300x200/8BC34A/FFFFFF?text=Guitarra+Yamaha',
                    'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Guitarra+Yamaha+2'
                ],
                location: 'Barranquilla, Atlántico, Colombia',
                coordinates: { lat: 10.9685, lng: -74.7813 },
                seller: {
                    id: 5,
                    name: 'Roberto Silva',
                    rating: 4.5,
                    reviews: 45,
                    verified: true,
                    memberSince: '2022'
                },
                tags: ['Guitarra', 'Acústica', 'Yamaha', 'Música', 'Instrumentos'],
                features: ['Talla 4/4', 'Cuerdas de Nylon', 'Funda Incluida', 'Afinador'],
                status: 'available',
                views: 98,
                favorites: 8,
                createdAt: '2024-01-08',
                updatedAt: '2024-01-17'
            },
            {
                id: 6,
                name: 'Nintendo Switch OLED',
                description: 'Nintendo Switch OLED con 2 juegos incluidos. Consola en perfecto estado.',
                price: 1200000,
                currency: 'COP',
                originalPrice: 1800000,
                condition: 'excellent',
                category: 'electronics',
                subcategory: 'gaming',
                images: [
                    'https://via.placeholder.com/300x200/E91E63/FFFFFF?text=Nintendo+Switch',
                    'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Nintendo+Switch+2'
                ],
                location: 'Cartagena, Bolívar, Colombia',
                coordinates: { lat: 10.3932, lng: -75.4792 },
                seller: {
                    id: 6,
                    name: 'Sofia Martínez',
                    rating: 4.8,
                    reviews: 123,
                    verified: true,
                    memberSince: '2021'
                },
                tags: ['Nintendo', 'Switch', 'OLED', 'Gaming', 'Consola'],
                features: ['32GB', '2 Juegos Incluidos', 'Joy-Cons', 'Dock'],
                status: 'available',
                views: 267,
                favorites: 42,
                createdAt: '2024-01-03',
                updatedAt: '2024-01-16'
            }
        ];
        
        this.state.filteredProducts = [...this.state.products];
    },

    // Vincular eventos
    bindEvents() {
        // Búsqueda
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }

        // Botón de búsqueda
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.handleSearch.bind(this));
        }

        // Filtros rápidos
        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', this.handleQuickFilter.bind(this));
        });

        // Filtros de categoría
        const categoryFilters = document.querySelectorAll('.filter-option input[type="checkbox"]');
        categoryFilters.forEach(filter => {
            filter.addEventListener('change', this.handleCategoryFilter.bind(this));
        });

        // Filtro de precio
        const priceInputs = document.querySelectorAll('.price-input');
        priceInputs.forEach(input => {
            input.addEventListener('input', this.handlePriceFilter.bind(this));
        });

        const rangeSlider = document.querySelector('.range-slider');
        if (rangeSlider) {
            rangeSlider.addEventListener('input', this.handleRangeSlider.bind(this));
        }

        // Filtros de condición
        const conditionFilters = document.querySelectorAll('.filter-option input[type="checkbox"]');
        conditionFilters.forEach(filter => {
            if (filter.value.match(/^(new|like-new|good|fair)$/)) {
                filter.addEventListener('change', this.handleConditionFilter.bind(this));
            }
        });

        // Filtro de ubicación
        const locationInput = document.querySelector('.location-input');
        if (locationInput) {
            locationInput.addEventListener('input', this.debounce(this.handleLocationFilter.bind(this), 300));
        }

        // Botones de filtro
        const applyFiltersBtn = document.querySelector('.apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
        }

        const clearFiltersBtn = document.querySelector('.clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', this.clearFilters.bind(this));
        }

        // Controles de vista
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', this.handleViewChange.bind(this));
        });

        // Ordenamiento
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        }

        // Botones de producto
        this.bindProductEvents();

        // Paginación
        this.bindPaginationEvents();

        // Modales
        this.bindModalEvents();
    },

    // Vincular eventos de productos
    bindProductEvents() {
        // Botones de favoritos
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) {
                const btn = e.target.closest('.favorite-btn');
                const productId = parseInt(btn.dataset.productId);
                this.toggleFavorite(productId, btn);
            }
        });

        // Botones de contactar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.contact-seller')) {
                const btn = e.target.closest('.contact-seller');
                const productCard = btn.closest('.product-card');
                const productId = parseInt(productCard.dataset.productId || productCard.dataset.id);
                this.openContactModal(productId);
            }
        });

        // Botones de ver detalles
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-details')) {
                const btn = e.target.closest('.view-details');
                const productCard = btn.closest('.product-card');
                const productId = parseInt(productCard.dataset.productId || productCard.dataset.id);
                this.openProductModal(productId);
            }
        });
    },

    // Vincular eventos de paginación
    bindPaginationEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pagination-btn')) {
                const btn = e.target.closest('.pagination-btn');
                if (btn.classList.contains('prev')) {
                    this.previousPage();
                } else if (btn.classList.contains('next')) {
                    this.nextPage();
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.pagination-number')) {
                const btn = e.target.closest('.pagination-number');
                const page = parseInt(btn.textContent);
                this.goToPage(page);
            }
        });
    },

    // Vincular eventos de modales
    bindModalEvents() {
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

        // Formulario de contacto
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactSubmit.bind(this));
        }

        // Cancelar contacto
        const cancelContactBtn = document.querySelector('.cancel-contact');
        if (cancelContactBtn) {
            cancelContactBtn.addEventListener('click', () => {
                this.closeModal(document.getElementById('contactModal'));
            });
        }

        // Galería de imágenes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.thumbnail')) {
                const thumbnail = e.target.closest('.thumbnail');
                this.changeMainImage(thumbnail);
            }
        });
    },

    // Manejar búsqueda
    handleSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            this.state.currentFilters.searchQuery = searchInput.value.toLowerCase();
            this.applyFilters();
        }
    },

    // Manejar filtro rápido
    handleQuickFilter(e) {
        const chip = e.target;
        const filter = chip.dataset.filter;

        // Remover activo de todos los chips
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        if (filter === 'all') {
            this.state.currentFilters.categories = [];
        } else {
            this.state.currentFilters.categories = [filter];
        }

        this.applyFilters();
    },

    // Manejar filtro de categoría
    handleCategoryFilter(e) {
        const checkbox = e.target;
        const category = checkbox.value;

        if (checkbox.checked) {
            if (!this.state.currentFilters.categories.includes(category)) {
                this.state.currentFilters.categories.push(category);
            }
        } else {
            this.state.currentFilters.categories = this.state.currentFilters.categories.filter(c => c !== category);
        }
    },

    // Manejar filtro de precio
    handlePriceFilter(e) {
        const input = e.target;
        const value = parseInt(input.value) || 0;

        if (input.placeholder === 'Min') {
            this.state.currentFilters.priceRange.min = value;
        } else {
            this.state.currentFilters.priceRange.max = value;
        }
    },

    // Manejar slider de precio
    handleRangeSlider(e) {
        const value = parseInt(e.target.value);
        this.state.currentFilters.priceRange.max = value;
        
        const maxInput = document.querySelector('.price-input[placeholder="Max"]');
        if (maxInput) {
            maxInput.value = value;
        }
    },

    // Manejar filtro de condición
    handleConditionFilter(e) {
        const checkbox = e.target;
        const condition = checkbox.value;

        if (checkbox.checked) {
            if (!this.state.currentFilters.condition.includes(condition)) {
                this.state.currentFilters.condition.push(condition);
            }
        } else {
            this.state.currentFilters.condition = this.state.currentFilters.condition.filter(c => c !== condition);
        }
    },

    // Manejar filtro de ubicación
    handleLocationFilter(e) {
        this.state.currentFilters.location = e.target.value.toLowerCase();
    },

    // Aplicar filtros
    applyFilters() {
        let filtered = [...this.state.products];

        // Filtro de búsqueda
        if (this.state.currentFilters.searchQuery) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(this.state.currentFilters.searchQuery) ||
                product.description.toLowerCase().includes(this.state.currentFilters.searchQuery)
            );
        }

        // Filtro de categorías
        if (this.state.currentFilters.categories.length > 0) {
            filtered = filtered.filter(product => 
                this.state.currentFilters.categories.includes(product.category)
            );
        }

        // Filtro de precio
        filtered = filtered.filter(product => 
            product.price >= this.state.currentFilters.priceRange.min &&
            product.price <= this.state.currentFilters.priceRange.max
        );

        // Filtro de condición
        if (this.state.currentFilters.condition.length > 0) {
            filtered = filtered.filter(product => 
                this.state.currentFilters.condition.includes(product.condition)
            );
        }

        // Filtro de ubicación
        if (this.state.currentFilters.location) {
            filtered = filtered.filter(product => 
                product.location.toLowerCase().includes(this.state.currentFilters.location)
            );
        }

        this.state.filteredProducts = filtered;
        this.state.currentPage = 1;
        this.renderProducts();
        this.updatePagination();
    },

    // Limpiar filtros
    clearFilters() {
        this.state.currentFilters = {
            categories: [],
            priceRange: { min: 0, max: 1000 },
            condition: [],
            location: '',
            searchQuery: ''
        };

        // Resetear inputs
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.value = '';

        const categoryFilters = document.querySelectorAll('.filter-option input[type="checkbox"]');
        categoryFilters.forEach(filter => filter.checked = false);

        const priceInputs = document.querySelectorAll('.price-input');
        priceInputs.forEach(input => input.value = '');

        const rangeSlider = document.querySelector('.range-slider');
        if (rangeSlider) rangeSlider.value = 500;

        const locationInput = document.querySelector('.location-input');
        if (locationInput) locationInput.value = '';

        // Resetear chips rápidos
        document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
        document.querySelector('.filter-chip[data-filter="all"]').classList.add('active');

        this.applyFilters();
    },

    // Manejar cambio de vista
    handleViewChange(e) {
        const btn = e.target.closest('.view-btn');
        const view = btn.dataset.view;

        // Actualizar botones
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.state.currentView = view;
        this.renderProducts();
    },

    // Manejar cambio de ordenamiento
    handleSortChange(e) {
        this.state.currentSort = e.target.value;
        this.sortProducts();
        this.renderProducts();
    },

    // Ordenar productos
    sortProducts() {
        const { currentSort, filteredProducts } = this.state;

        switch (currentSort) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'date':
                filteredProducts.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'rating':
                filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            default: // relevance
                // Mantener orden original
                break;
        }
    },

    // Renderizar productos
    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        const { filteredProducts, currentPage, productsPerPage, currentView } = this.state;
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsToShow = filteredProducts.slice(startIndex, endIndex);

        if (currentView === 'list') {
            productsGrid.classList.add('list-view');
        } else {
            productsGrid.classList.remove('list-view');
        }

        productsGrid.innerHTML = productsToShow.map(product => this.renderProductCard(product)).join('');
        
        // Actualizar atributos data
        productsToShow.forEach((product, index) => {
            const card = productsGrid.children[index];
            if (card) {
                card.dataset.productId = product.id;
                card.dataset.category = product.category;
                card.dataset.price = product.price;
            }
        });

        // Actualizar contador de resultados
        this.updateResultsCount();
    },

    // Renderizar tarjeta de producto
    renderProductCard(product) {
        const discount = product.originalPrice ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

        return `
            <article class="product-card" data-category="${product.category}" data-price="${product.price}">
                <div class="product-image">
                    <img src="${product.images[0]}" alt="${product.name}">
                    <div class="product-badges">
                        ${product.badges.map(badge => `<span class="badge badge-${badge}">${this.getBadgeText(badge)}</span>`).join('')}
                    </div>
                    <button class="favorite-btn" data-product-id="${product.id}">
                        ${this.state.favorites.has(product.id) ? '❤' : '🤍'}
                    </button>
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    
                    <div class="product-meta">
                        <span class="product-category">${this.getCategoryText(product.category)}</span>
                        <span class="product-location">📍 ${product.location}</span>
                    </div>
                    
                    <div class="product-rating">
                        <div class="stars">${'⭐'.repeat(product.rating)}</div>
                        <span class="rating-count">(${product.ratingCount})</span>
                    </div>
                    
                    <div class="product-price">
                        <span class="price">${product.currency} ${product.price.toLocaleString()}</span>
                        ${product.originalPrice ? `<span class="original-price">${product.currency} ${product.originalPrice.toLocaleString()}</span>` : ''}
                        ${discount > 0 ? `<span class="discount">-${discount}%</span>` : ''}
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn btn-primary contact-seller">Contactar</button>
                        <button class="btn btn-secondary view-details">Ver Detalles</button>
                    </div>
                </div>
            </article>
        `;
    },

    // Obtener texto de badge
    getBadgeText(badge) {
        const badgeTexts = {
            'new': 'Nuevo',
            'verified': 'Verificado',
            'vintage': 'Vintage',
            'eco': 'Eco',
            'good': 'Bueno',
            'like-new': 'Como Nuevo',
            'fair': 'Aceptable'
        };
        return badgeTexts[badge] || badge;
    },

    // Obtener texto de categoría
    getCategoryText(category) {
        const categoryTexts = {
            'electronics': 'Electrónicos',
            'clothing': 'Ropa',
            'home': 'Hogar',
            'books': 'Libros',
            'sports': 'Deportes',
            'toys': 'Juguetes'
        };
        return categoryTexts[category] || category;
    },

    // Actualizar contador de resultados
    updateResultsCount() {
        const { filteredProducts } = this.state;
        const resultsCount = document.querySelector('.results-count');
        
        if (!resultsCount) {
            const viewControls = document.querySelector('.view-controls');
            if (viewControls) {
                const countElement = document.createElement('div');
                countElement.className = 'results-count';
                countElement.innerHTML = `<span>${filteredProducts.length} productos encontrados</span>`;
                viewControls.appendChild(countElement);
            }
        } else {
            resultsCount.innerHTML = `<span>${filteredProducts.length} productos encontrados</span>`;
        }
    },

    // Actualizar paginación
    updatePagination() {
        const { filteredProducts, currentPage, productsPerPage } = this.state;
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        
        const pagination = document.querySelector('.pagination');
        if (!pagination) return;

        // Botón anterior
        const prevBtn = pagination.querySelector('.prev');
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
        }

        // Botón siguiente
        const nextBtn = pagination.querySelector('.next');
        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages;
        }

        // Números de página
        const paginationNumbers = pagination.querySelector('.pagination-numbers');
        if (paginationNumbers) {
            this.renderPaginationNumbers(paginationNumbers, totalPages, currentPage);
        }
    },

    // Renderizar números de paginación
    renderPaginationNumbers(container, totalPages, currentPage) {
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `<button class="pagination-number ${i === currentPage ? 'active' : ''}">${i}</button>`;
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    paginationHTML += `<button class="pagination-number ${i === currentPage ? 'active' : ''}">${i}</button>`;
                }
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
                paginationHTML += `<button class="pagination-number">${totalPages}</button>`;
            } else if (currentPage >= totalPages - 2) {
                paginationHTML += `<button class="pagination-number">1</button>`;
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    paginationHTML += `<button class="pagination-number ${i === currentPage ? 'active' : ''}">${i}</button>`;
                }
            } else {
                paginationHTML += `<button class="pagination-number">1</button>`;
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    paginationHTML += `<button class="pagination-number ${i === currentPage ? 'active' : ''}">${i}</button>`;
                }
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
                paginationHTML += `<button class="pagination-number">${totalPages}</button>`;
            }
        }

        container.innerHTML = paginationHTML;
    },

    // Navegación de páginas
    previousPage() {
        if (this.state.currentPage > 1) {
            this.state.currentPage--;
            this.renderProducts();
            this.updatePagination();
        }
    },

    nextPage() {
        const totalPages = Math.ceil(this.state.filteredProducts.length / this.state.productsPerPage);
        if (this.state.currentPage < totalPages) {
            this.state.currentPage++;
            this.renderProducts();
            this.updatePagination();
        }
    },

    goToPage(page) {
        const totalPages = Math.ceil(this.state.filteredProducts.length / this.state.productsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.state.currentPage = page;
            this.renderProducts();
            this.updatePagination();
        }
    },

    // Favoritos
    toggleFavorite(productId, btn) {
        if (this.state.favorites.has(productId)) {
            this.state.favorites.delete(productId);
            btn.innerHTML = '🤍';
        } else {
            this.state.favorites.add(productId);
            btn.innerHTML = '❤';
        }
        
        this.saveFavorites();
        this.showNotification(
            this.state.favorites.has(productId) ? 'Producto añadido a favoritos' : 'Producto removido de favoritos',
            'success'
        );
    },

    loadFavorites() {
        const saved = localStorage.getItem('ecoswap_favorites');
        if (saved) {
            this.state.favorites = new Set(JSON.parse(saved));
        }
    },

    saveFavorites() {
        localStorage.setItem('ecoswap_favorites', JSON.stringify([...this.state.favorites]));
    },

    // Modales
    openProductModal(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('productModal');
        if (!modal) return;

        // Llenar información del producto
        document.getElementById('modalMainImage').src = product.images[0];
        document.getElementById('modalProductTitle').textContent = product.name;
        document.getElementById('modalPrice').textContent = `$${product.price.toLocaleString()}`;
        document.getElementById('modalOriginalPrice').textContent = product.originalPrice ? `$${product.originalPrice.toLocaleString()}` : '';
        document.getElementById('modalDescription').textContent = product.description;
        document.getElementById('modalCondition').textContent = this.getBadgeText(product.condition);
        document.getElementById('modalCategory').textContent = this.getCategoryText(product.category);
        document.getElementById('modalLocation').textContent = product.location;
        document.getElementById('modalDate').textContent = new Date(product.date).toLocaleDateString('es-ES');

        // Actualizar miniaturas
        const thumbnails = modal.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            if (product.images[index]) {
                thumb.src = product.images[index];
                thumb.style.display = 'block';
            } else {
                thumb.style.display = 'none';
            }
        });

        // Resetear primera miniatura como activa
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        if (thumbnails[0]) thumbnails[0].classList.add('active');

        this.showModal(modal);
    },

    openContactModal(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('contactModal');
        if (!modal) return;

        // Pre-llenar asunto
        const subjectInput = modal.querySelector('#contactSubject');
        if (subjectInput) {
            subjectInput.value = `Consulta sobre: ${product.name}`;
        }

        this.showModal(modal);
    },

    showModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        modal.classList.add('show');
    },

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    },

    // Cambiar imagen principal
    changeMainImage(thumbnail) {
        const modal = thumbnail.closest('.modal');
        const mainImage = modal.querySelector('.main-image img');
        
        if (mainImage && thumbnail.src) {
            mainImage.src = thumbnail.src;
        }

        // Actualizar miniatura activa
        modal.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
        thumbnail.classList.add('active');
    },

    // Manejar envío de formulario de contacto
    handleContactSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const subject = formData.get('contactSubject') || e.target.querySelector('#contactSubject').value;
        const message = formData.get('contactMessage') || e.target.querySelector('#contactMessage').value;
        const offer = formData.get('contactOffer') || e.target.querySelector('#contactOffer').value;

        // Simular envío
        this.showNotification('Mensaje enviado correctamente', 'success');
        
        // Cerrar modal
        this.closeModal(document.getElementById('contactModal'));
        
        // Limpiar formulario
        e.target.reset();
    },

    // Utilidades
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    showNotification(message, type = 'info') {
        if (window.EcoSwapApp && window.EcoSwapApp.showNotification) {
            window.EcoSwapApp.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ProductsModule.init();
});

// Exportar para uso global
window.ProductsModule = ProductsModule;
