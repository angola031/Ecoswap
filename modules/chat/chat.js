/**
 * Módulo de Chat - EcoSwap
 * Maneja la funcionalidad de chat en tiempo real, conversaciones y mensajería
 */

const ChatModule = {
    // Estado del módulo
    state: {
        currentConversation: null,
        conversations: [],
        messages: {},
        users: [],
        currentUser: null,
        typingUsers: {},
        filters: {
            conversationType: 'all',
            searchQuery: ''
        },
        pagination: {
            conversations: { page: 1, hasMore: true },
            messages: { page: 1, hasMore: true }
        }
    },

    // Inicialización
    init() {
        this.loadSampleData();
        this.bindEvents();
        this.renderConversations();
        console.log('Módulo de Chat inicializado');
    },

    // Cargar datos de ejemplo
    loadSampleData() {
        // Conversaciones de ejemplo
        this.state.conversations = [
            {
                id: 1,
                user: {
                    id: 1,
                    name: 'Carlos Mendoza',
                    avatar: 'https://via.placeholder.com/50x50/4CAF50/FFFFFF?text=CM',
                    status: 'online',
                    location: 'Pereira, Risaralda, Colombia',
                    rating: 4.8,
                    reviews: 156,
                    verified: true
                },
                product: {
                    id: 1,
                    name: 'iPhone 12 Pro',
                    price: 1500000,
                    currency: 'COP',
                    image: 'https://via.placeholder.com/60x60/4CAF50/FFFFFF?text=iPhone'
                },
                lastMessage: {
                    text: 'Hola, ¿el iPhone sigue disponible?',
                    sender: 'user',
                    timestamp: '2024-01-20T14:30:00Z',
                    unread: true
                },
                unreadCount: 2,
                createdAt: '2024-01-20T10:00:00Z',
                updatedAt: '2024-01-20T14:30:00Z',
                status: 'active'
            },
            {
                id: 2,
                user: {
                    id: 2,
                    name: 'Ana García',
                    avatar: 'https://via.placeholder.com/50x50/2196F3/FFFFFF?text=AG',
                    status: 'offline',
                    location: 'Bogotá D.C., Colombia',
                    rating: 4.9,
                    reviews: 89,
                    verified: true
                },
                product: {
                    id: 2,
                    name: 'Bicicleta Trek Marlin 5',
                    price: 850000,
                    currency: 'COP',
                    image: 'https://via.placeholder.com/60x60/4CAF50/FFFFFF?text=Bici'
                },
                lastMessage: {
                    text: 'Perfecto, ¿cuándo podemos quedar?',
                    sender: 'user',
                    timestamp: '2024-01-20T12:45:00Z',
                    unread: false
                },
                unreadCount: 0,
                createdAt: '2024-01-19T15:00:00Z',
                updatedAt: '2024-01-20T12:45:00Z',
                status: 'active'
            },
            {
                id: 3,
                user: {
                    id: 3,
                    name: 'Luis Rodríguez',
                    avatar: 'https://via.placeholder.com/50x50/FF9800/FFFFFF?text=LR',
                    status: 'online',
                    location: 'Medellín, Antioquia, Colombia',
                    rating: 4.7,
                    reviews: 203,
                    verified: true
                },
                product: {
                    id: 3,
                    name: 'Mesa de Madera Vintage',
                    price: 450000,
                    currency: 'COP',
                    image: 'https://via.placeholder.com/60x60/8D6E63/FFFFFF?text=Mesa'
                },
                lastMessage: {
                    text: 'La mesa está en perfecto estado',
                    sender: 'user',
                    timestamp: '2024-01-20T11:20:00Z',
                    unread: false
                },
                unreadCount: 0,
                createdAt: '2024-01-18T14:00:00Z',
                updatedAt: '2024-01-20T11:20:00Z',
                status: 'active'
            },
            {
                id: 4,
                user: {
                    id: 4,
                    name: 'María López',
                    avatar: 'https://via.placeholder.com/50x50/9C27B0/FFFFFF?text=ML',
                    status: 'away',
                    location: 'Cali, Valle del Cauca, Colombia',
                    rating: 4.6,
                    reviews: 67,
                    verified: true
                },
                product: {
                    id: 4,
                    name: 'Libros Colección Harry Potter',
                    price: 180000,
                    currency: 'COP',
                    image: 'https://via.placeholder.com/60x60/FFC107/FFFFFF?text=Libros'
                },
                lastMessage: {
                    text: '¿Tienes más libros de fantasía?',
                    sender: 'user',
                    timestamp: '2024-01-20T09:15:00Z',
                    unread: false
                },
                unreadCount: 0,
                createdAt: '2024-01-17T16:00:00Z',
                updatedAt: '2024-01-20T09:15:00Z',
                status: 'active'
            },
            {
                id: 5,
                user: {
                    id: 5,
                    name: 'Roberto Silva',
                    avatar: 'https://via.placeholder.com/50x50/8BC34A/FFFFFF?text=RS',
                    status: 'online',
                    location: 'Barranquilla, Atlántico, Colombia',
                    rating: 4.5,
                    reviews: 45,
                    verified: true
                },
                product: {
                    id: 5,
                    name: 'Guitarra Acústica Yamaha',
                    price: 320000,
                    currency: 'COP',
                    image: 'https://via.placeholder.com/60x60/8BC34A/FFFFFF?text=Guitarra'
                },
                lastMessage: {
                    text: 'La guitarra está como nueva',
                    sender: 'user',
                    timestamp: '2024-01-20T08:30:00Z',
                    unread: false
                },
                unreadCount: 0,
                createdAt: '2024-01-16T12:00:00Z',
                updatedAt: '2024-01-20T08:30:00Z',
                status: 'active'
            }
        ];

        // Mensajes de ejemplo para la primera conversación
        this.state.messages = {
            1: [
                {
                    id: 1,
                    text: 'Hola, ¿el iPhone 12 Pro sigue disponible?',
                    sender: 'user',
                    timestamp: '2024-01-20T14:30:00Z',
                    type: 'text'
                },
                {
                    id: 2,
                    text: '¡Hola! Sí, sigue disponible. Está en perfecto estado, solo 6 meses de uso.',
                    sender: 'me',
                    timestamp: '2024-01-20T14:32:00Z',
                    type: 'text'
                },
                {
                    id: 3,
                    text: 'Perfecto, ¿incluye cargador y funda?',
                    sender: 'user',
                    timestamp: '2024-01-20T14:33:00Z',
                    type: 'text'
                },
                {
                    id: 4,
                    text: 'Sí, incluye cargador original y funda de silicona. También tengo la caja original si la quieres.',
                    sender: 'me',
                    timestamp: '2024-01-20T14:35:00Z',
                    type: 'text'
                },
                {
                    id: 5,
                    text: '¡Genial! ¿Podríamos quedar mañana para verlo? ¿Qué zona de Pereira?',
                    sender: 'user',
                    timestamp: '2024-01-20T14:36:00Z',
                    type: 'text'
                }
            ]
        };

        // Usuarios de ejemplo
        this.state.users = [
            {
                id: 1,
                name: 'Carlos Mendoza',
                avatar: 'https://via.placeholder.com/50x50/4CAF50/FFFFFF?text=CM',
                status: 'online',
                rating: 4.8,
                reviews: 127,
                productsSold: 45,
                memberSince: 'Enero 2023',
                responseTime: '2 horas',
                location: 'Pereira, Risaralda, Colombia'
            },
            {
                id: 2,
                name: 'Ana García',
                avatar: 'https://via.placeholder.com/50x50/2196F3/FFFFFF?text=AG',
                status: 'offline',
                rating: 4.6,
                reviews: 89,
                productsSold: 32,
                memberSince: 'Marzo 2023',
                responseTime: '4 horas',
                location: 'Bogotá D.C., Colombia'
            },
            {
                id: 3,
                name: 'Luis Rodríguez',
                avatar: 'https://via.placeholder.com/50x50/FF9800/FFFFFF?text=LR',
                status: 'online',
                rating: 4.9,
                reviews: 156,
                productsSold: 67,
                memberSince: 'Noviembre 2022',
                responseTime: '1 hora',
                location: 'Medellín, Antioquia, Colombia'
            },
            {
                id: 4,
                name: 'María López',
                avatar: 'https://via.placeholder.com/50x50/9C27B0/FFFFFF?text=ML',
                status: 'away',
                rating: 4.7,
                reviews: 73,
                productsSold: 28,
                memberSince: 'Febrero 2023',
                responseTime: '3 horas',
                location: 'Cali, Valle del Cauca, Colombia'
            }
        ];

        // Usuario actual (simulado)
        this.state.currentUser = {
            id: 'current',
            name: 'Tú',
            avatar: 'https://via.placeholder.com/35x35/CCCCCC/FFFFFF?text=T'
        };
    },

    // Vincular eventos
    bindEvents() {
        // Botones de acción
        document.querySelector('.new-conversation-btn').addEventListener('click', this.openNewConversationModal.bind(this));
        document.querySelector('.search-conversations-btn').addEventListener('click', this.toggleSearchConversations.bind(this));
        document.querySelector('.start-chat-btn').addEventListener('click', this.openNewConversationModal.bind(this));

        // Filtros de conversaciones
        document.getElementById('conversationFilter').addEventListener('change', this.handleConversationFilter.bind(this));

        // Formulario de nueva conversación
        document.getElementById('newConversationForm').addEventListener('submit', this.handleNewConversation.bind(this));
        document.getElementById('conversationType').addEventListener('change', this.handleConversationTypeChange.bind(this));
        document.getElementById('conversationUser').addEventListener('input', this.handleUserSearch.bind(this));

        // Formulario de mensajes
        document.getElementById('messageForm').addEventListener('submit', this.handleSendMessage.bind(this));
        document.getElementById('messageInput').addEventListener('input', this.handleMessageInput.bind(this));

        // Botones de chat
        document.querySelector('.attachment-btn').addEventListener('click', this.openAttachmentModal.bind(this));
        document.querySelector('.emoji-btn').addEventListener('click', this.openEmojiModal.bind(this));
        document.querySelector('.location-btn').addEventListener('click', this.shareLocation.bind(this));

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

        // Emojis
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-btn')) {
                const emoji = e.target.textContent;
                this.insertEmoji(emoji);
            }
        });

        // Categorías de emojis
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-category')) {
                this.switchEmojiCategory(e.target.dataset.category);
            }
        });

        // Adjuntar archivos
        document.getElementById('imageAttachment').addEventListener('change', this.handleImageAttachment.bind(this));
        document.getElementById('documentAttachment').addEventListener('change', this.handleDocumentAttachment.bind(this));
    },

    // ===== CONVERSACIONES =====

    // Renderizar conversaciones
    renderConversations() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) return;

        let conversations = [...this.state.conversations];

        // Aplicar filtros
        if (this.state.filters.conversationType !== 'all') {
            conversations = conversations.filter(c => c.type === this.state.filters.conversationType);
        }

        if (this.state.filters.searchQuery) {
            const query = this.state.filters.searchQuery.toLowerCase();
            conversations = conversations.filter(c =>
                c.user.name.toLowerCase().includes(query) ||
                c.subject.toLowerCase().includes(query) ||
                c.lastMessage.toLowerCase().includes(query)
            );
        }

        // Ordenar por fecha de último mensaje
        conversations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        conversationsList.innerHTML = '';

        if (conversations.length === 0) {
            conversationsList.innerHTML = '<p class="text-center text-muted">No hay conversaciones para mostrar.</p>';
            return;
        }

        conversations.forEach(conversation => {
            const conversationElement = this.createConversationElement(conversation);
            conversationsList.appendChild(conversationElement);
        });
    },

    // Crear elemento de conversación
    createConversationElement(conversation) {
        const conversationDiv = document.createElement('div');
        conversationDiv.className = 'conversation-item';
        conversationDiv.dataset.conversationId = conversation.id;

        if (this.state.currentConversation && this.state.currentConversation.id === conversation.id) {
            conversationDiv.classList.add('active');
        }

        conversationDiv.innerHTML = `
            <div class="conversation-avatar">
                <img src="${conversation.user.avatar}" alt="${conversation.user.name}">
                <span class="status-indicator ${conversation.user.status}"></span>
            </div>
            <div class="conversation-info">
                <div class="conversation-header">
                    <h4 class="conversation-name">${conversation.user.name}</h4>
                    <span class="conversation-time">${conversation.lastMessageTime}</span>
                </div>
                <p class="conversation-preview">${conversation.lastMessage}</p>
                <div class="conversation-meta">
                    ${conversation.unreadCount > 0 ? `<span class="unread-count">${conversation.unreadCount}</span>` : ''}
                    ${conversation.product ? `<span class="conversation-product">${this.getProductIcon(conversation.type)} ${conversation.product.name}</span>` : ''}
                </div>
            </div>
            <button class="conversation-actions">
                <i class="icon">⋮</i>
            </button>
        `;

        // Evento para seleccionar conversación
        conversationDiv.addEventListener('click', () => {
            this.selectConversation(conversation.id);
        });

        return conversationDiv;
    },

    // Obtener icono del producto según el tipo
    getProductIcon(type) {
        const icons = {
            'product': '📱',
            'trade': '🔄',
            'general': '💬',
            'support': '🆘'
        };
        return icons[type] || '💬';
    },

    // Seleccionar conversación
    selectConversation(conversationId) {
        const conversation = this.state.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.state.currentConversation = conversation;
        this.showChatActive();
        this.renderMessages();
        this.markConversationAsRead(conversationId);
        this.updateConversationUI();
    },

    // Mostrar chat activo
    showChatActive() {
        document.getElementById('chatWelcome').style.display = 'none';
        document.getElementById('chatActive').style.display = 'flex';

        // Actualizar información del usuario en el chat
        const conversation = this.state.currentConversation;
        document.getElementById('chatUserAvatar').src = conversation.user.avatar;
        document.getElementById('chatUserName').textContent = conversation.user.name;
        document.getElementById('chatUserStatus').textContent = this.getStatusText(conversation.user.status);
    },

    // Obtener texto del estado
    getStatusText(status) {
        const statusTexts = {
            'online': 'En línea',
            'offline': 'Desconectado',
            'away': 'Ausente'
        };
        return statusTexts[status] || 'Desconocido';
    },

    // Marcar conversación como leída
    markConversationAsRead(conversationId) {
        const conversation = this.state.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.unreadCount = 0;
            this.renderConversations();
        }
    },

    // Actualizar UI de conversaciones
    updateConversationUI() {
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });

        if (this.state.currentConversation) {
            const activeItem = document.querySelector(`[data-conversation-id="${this.state.currentConversation.id}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    },

    // ===== MENSAJES =====

    // Renderizar mensajes
    renderMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const conversationId = this.state.currentConversation.id;
        const messages = this.state.messages[conversationId] || [];

        messagesContainer.innerHTML = '';

        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="message system">
                    <div class="message-bubble">
                        <p>Esta es una nueva conversación. ¡Comienza a chatear!</p>
                    </div>
                </div>
            `;
            return;
        }

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        // Scroll al final
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    // Crear elemento de mensaje
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.senderId === 'current' ? 'sent' : 'received'}`;

        if (message.type === 'system') {
            messageDiv.classList.add('system');
        }

        let content = '';

        switch (message.type) {
            case 'text':
                content = `<p>${message.content}</p>`;
                break;
            case 'image':
                content = `
                    <div class="message-attachment">
                        <div class="attachment-preview">
                            <img src="${message.content}" alt="Imagen">
                        </div>
                        <div class="attachment-info">Imagen</div>
                    </div>
                `;
                break;
            case 'document':
                content = `
                    <div class="message-attachment">
                        <div class="attachment-info">
                            <i class="icon">📄</i> ${message.content}
                        </div>
                    </div>
                `;
                break;
            case 'location':
                content = `
                    <div class="message-attachment">
                        <div class="attachment-info">
                            <i class="icon">📍</i> Ubicación compartida
                        </div>
                    </div>
                `;
                break;
            case 'product':
                content = `
                    <div class="message-attachment">
                        <div class="attachment-info">
                            <i class="icon">🛍️</i> ${message.content}
                        </div>
                    </div>
                `;
                break;
        }

        messageDiv.innerHTML = `
            ${message.senderId !== 'current' ? `
                <div class="message-avatar">
                    <img src="${message.senderAvatar}" alt="${message.senderName}">
                </div>
            ` : ''}
            <div class="message-content">
                <div class="message-bubble">
                    ${content}
                </div>
                <div class="message-time">${message.timestamp}</div>
            </div>
        `;

        return messageDiv;
    },

    // Manejar envío de mensaje
    handleSendMessage(e) {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        const content = input.value.trim();

        if (!content || !this.state.currentConversation) return;

        const newMessage = {
            id: Date.now(),
            senderId: 'current',
            senderName: 'Tú',
            senderAvatar: this.state.currentUser.avatar,
            content: content,
            timestamp: this.getCurrentTime(),
            type: 'text',
            isRead: false
        };

        this.addMessageToConversation(this.state.currentConversation.id, newMessage);
        this.updateConversationLastMessage(this.state.currentConversation.id, content);

        input.value = '';
        this.adjustTextareaHeight(input);

        // Simular respuesta del otro usuario
        this.simulateUserResponse();
    },

    // Agregar mensaje a la conversación
    addMessageToConversation(conversationId, message) {
        if (!this.state.messages[conversationId]) {
            this.state.messages[conversationId] = [];
        }

        this.state.messages[conversationId].push(message);
        this.renderMessages();
    },

    // Actualizar último mensaje de la conversación
    updateConversationLastMessage(conversationId, message) {
        const conversation = this.state.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.lastMessage = message;
            conversation.lastMessageTime = 'Ahora';
            this.renderConversations();
        }
    },

    // Simular respuesta del usuario
    simulateUserResponse() {
        if (!this.state.currentConversation) return;

        const responses = [
            'Perfecto, gracias por la información',
            '¿Podríamos quedar mañana?',
            'Me interesa mucho, ¿está disponible?',
            '¿Podrías enviarme más fotos?',
            'Excelente, ¿cuál es tu precio final?'
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        setTimeout(() => {
            const responseMessage = {
                id: Date.now() + 1,
                senderId: this.state.currentConversation.user.id,
                senderName: this.state.currentConversation.user.name,
                senderAvatar: this.state.currentConversation.user.avatar,
                content: randomResponse,
                timestamp: this.getCurrentTime(),
                type: 'text',
                isRead: true
            };

            this.addMessageToConversation(this.state.currentConversation.id, responseMessage);
            this.updateConversationLastMessage(this.state.currentConversation.id, randomResponse);
        }, 2000 + Math.random() * 3000);
    },

    // Obtener hora actual
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Manejar entrada de mensaje
    handleMessageInput(e) {
        this.adjustTextareaHeight(e.target);
    },

    // Ajustar altura del textarea
    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    },

    // ===== NUEVA CONVERSACIÓN =====

    // Abrir modal de nueva conversación
    openNewConversationModal() {
        this.showModal(document.getElementById('newConversationModal'));
        this.populateProductOptions();
    },

    // Manejar cambio de tipo de conversación
    handleConversationTypeChange(e) {
        const productGroup = document.getElementById('productSelectionGroup');
        if (e.target.value === 'product') {
            productGroup.style.display = 'block';
        } else {
            productGroup.style.display = 'none';
        }
    },

    // Poblar opciones de productos
    populateProductOptions() {
        const select = document.getElementById('conversationProduct');
        // En una implementación real, esto vendría de la API de productos
        select.innerHTML = `
            <option value="">Selecciona un producto</option>
            <option value="1">iPhone 12 Pro - €150</option>
            <option value="2">Camiseta Vintage Nike - €25</option>
            <option value="3">Mesa de Madera Reciclada - €80</option>
        `;
    },

    // Manejar búsqueda de usuarios
    handleUserSearch(e) {
        const query = e.target.value.trim();
        const resultsContainer = document.getElementById('userSearchResults');

        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        const results = this.state.users.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displayUserSearchResults(results);
    },

    // Mostrar resultados de búsqueda de usuarios
    displayUserSearchResults(users) {
        const resultsContainer = document.getElementById('userSearchResults');

        if (users.length === 0) {
            resultsContainer.innerHTML = '<p class="text-center text-muted">No se encontraron usuarios</p>';
        } else {
            resultsContainer.innerHTML = users.map(user => `
                <div class="user-search-result" data-user-id="${user.id}">
                    <img src="${user.avatar}" alt="${user.name}">
                    <div class="user-search-result-info">
                        <h5>${user.name}</h5>
                        <p>${user.location}</p>
                    </div>
                </div>
            `).join('');
        }

        resultsContainer.style.display = 'block';

        // Eventos para seleccionar usuario
        resultsContainer.querySelectorAll('.user-search-result').forEach(result => {
            result.addEventListener('click', () => {
                const userId = result.dataset.userId;
                const user = this.state.users.find(u => u.id == userId);
                if (user) {
                    document.getElementById('conversationUser').value = user.name;
                    resultsContainer.style.display = 'none';
                }
            });
        });
    },

    // Manejar nueva conversación
    handleNewConversation(e) {
        e.preventDefault();
        const form = e.target;

        const newConversation = {
            id: this.state.conversations.length + 1,
            user: this.state.users[0], // Usuario por defecto para demo
            type: form.conversationType.value,
            subject: form.conversationSubject.value,
            product: form.conversationType.value === 'product' ?
                { name: 'Producto Seleccionado', price: '€0' } : null,
            lastMessage: form.conversationMessage.value,
            lastMessageTime: 'Ahora',
            unreadCount: 0,
            isFavorite: false,
            createdAt: new Date()
        };

        this.state.conversations.unshift(newConversation);
        this.state.messages[newConversation.id] = [
            {
                id: 1,
                senderId: 'current',
                senderName: 'Tú',
                senderAvatar: this.state.currentUser.avatar,
                content: form.conversationMessage.value,
                timestamp: this.getCurrentTime(),
                type: 'text',
                isRead: true
            }
        ];

        this.showNotification('Conversación iniciada exitosamente', 'success');
        this.closeModal(document.getElementById('newConversationModal'));
        this.renderConversations();
        this.selectConversation(newConversation.id);
    },

    // ===== FILTROS Y BÚSQUEDA =====

    // Manejar filtro de conversaciones
    handleConversationFilter(e) {
        this.state.filters.conversationType = e.target.value;
        this.renderConversations();
    },

    // Alternar búsqueda de conversaciones
    toggleSearchConversations() {
        // En una implementación real, aquí se mostraría un campo de búsqueda
        this.showNotification('Función de búsqueda próximamente', 'info');
    },

    // ===== ADJUNTAR ARCHIVOS =====

    // Abrir modal de adjuntar archivo
    openAttachmentModal() {
        this.showModal(document.getElementById('attachmentModal'));
    },

    // Manejar adjuntar imagen
    handleImageAttachment(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageMessage = {
                    id: Date.now(),
                    senderId: 'current',
                    senderName: 'Tú',
                    senderAvatar: this.state.currentUser.avatar,
                    content: e.target.result,
                    timestamp: this.getCurrentTime(),
                    type: 'image',
                    isRead: false
                };

                this.addMessageToConversation(this.state.currentConversation.id, imageMessage);
                this.updateConversationLastMessage(this.state.currentConversation.id, 'Imagen');
                this.closeModal(document.getElementById('attachmentModal'));
            };
            reader.readAsDataURL(file);
        }
    },

    // Manejar adjuntar documento
    handleDocumentAttachment(e) {
        const file = e.target.files[0];
        if (file) {
            const documentMessage = {
                id: Date.now(),
                senderId: 'current',
                senderName: 'Tú',
                senderAvatar: this.state.currentUser.avatar,
                content: file.name,
                timestamp: this.getCurrentTime(),
                type: 'document',
                isRead: false
            };

            this.addMessageToConversation(this.state.currentConversation.id, documentMessage);
            this.updateConversationLastMessage(this.state.currentConversation.id, 'Documento');
            this.closeModal(document.getElementById('attachmentModal'));
        }
    },

    // Compartir ubicación
    shareLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const locationMessage = {
                    id: Date.now(),
                    senderId: 'current',
                    senderName: 'Tú',
                    senderAvatar: this.state.currentUser.avatar,
                    content: `Ubicación: ${position.coords.latitude}, ${position.coords.longitude}`,
                    timestamp: this.getCurrentTime(),
                    type: 'location',
                    isRead: false
                };

                this.addMessageToConversation(this.state.currentConversation.id, locationMessage);
                this.updateConversationLastMessage(this.state.currentConversation.id, 'Ubicación');
                this.closeModal(document.getElementById('attachmentModal'));
            }, () => {
                this.showNotification('No se pudo obtener la ubicación', 'error');
            });
        } else {
            this.showNotification('Geolocalización no soportada', 'error');
        }
    },

    // Compartir producto
    shareProduct() {
        if (this.state.currentConversation && this.state.currentConversation.product) {
            const productMessage = {
                id: Date.now(),
                senderId: 'current',
                senderName: 'Tú',
                senderAvatar: this.state.currentUser.avatar,
                content: `${this.state.currentConversation.product.name} - ${this.state.currentConversation.product.price}`,
                timestamp: this.getCurrentTime(),
                type: 'product',
                isRead: false
            };

            this.addMessageToConversation(this.state.currentConversation.id, productMessage);
            this.updateConversationLastMessage(this.state.currentConversation.id, 'Producto');
            this.closeModal(document.getElementById('attachmentModal'));
        } else {
            this.showNotification('No hay producto asociado a esta conversación', 'info');
        }
    },

    // ===== EMOJIS =====

    // Abrir modal de emojis
    openEmojiModal() {
        this.showModal(document.getElementById('emojiModal'));
        this.loadEmojis('recent');
    },

    // Cargar emojis por categoría
    loadEmojis(category) {
        const emojiGrid = document.getElementById('emojiGrid');
        const emojis = this.getEmojisByCategory(category);

        emojiGrid.innerHTML = emojis.map(emoji =>
            `<button class="emoji-btn">${emoji}</button>`
        ).join('');
    },

    // Obtener emojis por categoría
    getEmojisByCategory(category) {
        const emojiCategories = {
            'recent': ['😊', '👍', '❤️', '🎉', '🔥', '✨', '💯', '🌟'],
            'smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰'],
            'animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
            'food': ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥨', '🥖', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓'],
            'activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏'],
            'objects': ['💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📱', '📲', '📟', '📠'],
            'symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗']
        };

        return emojiCategories[category] || emojiCategories['recent'];
    },

    // Cambiar categoría de emojis
    switchEmojiCategory(category) {
        document.querySelectorAll('.emoji-category').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        this.loadEmojis(category);
    },

    // Insertar emoji en el mensaje
    insertEmoji(emoji) {
        const input = document.getElementById('messageInput');
        const cursorPos = input.selectionStart;
        const textBefore = input.value.substring(0, cursorPos);
        const textAfter = input.value.substring(cursorPos);

        input.value = textBefore + emoji + textAfter;
        input.selectionStart = input.selectionEnd = cursorPos + emoji.length;
        input.focus();

        this.closeModal(document.getElementById('emojiModal'));
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

    // Mostrar notificación
    showNotification(message, type = 'info') {
        if (window.EcoSwapApp && window.EcoSwapApp.showNotification) {
            window.EcoSwapApp.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },

    // Ver perfil del usuario
    viewUserProfile() {
        this.showNotification('Función de perfil próximamente', 'info');
    },

    // Bloquear usuario
    blockUser() {
        if (this.state.currentConversation) {
            this.showNotification('Usuario bloqueado', 'success');
            this.closeModal(document.getElementById('userInfoModal'));
        }
    },

    // Reportar usuario
    reportUser() {
        this.showNotification('Función de reporte próximamente', 'info');
    }
};

// Inicializar módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ChatModule.init();
});
