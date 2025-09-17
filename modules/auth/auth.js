/* ===================================
   MÓDULO DE AUTENTICACIÓN - ECOSWAP COLOMBIA
   =================================== */

const AuthModule = {
    // Estado del módulo
    state: {
        currentScreen: 'login',
        isAuthenticated: false,
        currentUser: null,
        isLoading: false,
        errors: {},
        passwordStrength: 'weak'
    },

    // Inicialización
    init() {
        this.bindEvents();
        this.checkAuthStatus();
        console.log('Módulo de Autenticación inicializado');
    },

    // Vincular eventos
    bindEvents() {
        // Formulario de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Formulario de registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Formulario de recuperación de contraseña
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // Validación en tiempo real de contraseña
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }

        // Validación de confirmación de contraseña
        const confirmPasswordInput = document.getElementById('registerConfirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', (e) => this.validatePasswordMatch(e.target.value));
        }
    },

    // Mostrar pantalla de login
    showLogin() {
        this.hideAllScreens();
        document.getElementById('loginScreen').classList.add('active');
        this.state.currentScreen = 'login';
        this.clearErrors();
    },

    // Mostrar pantalla de registro
    showRegister() {
        this.hideAllScreens();
        document.getElementById('registerScreen').classList.add('active');
        this.state.currentScreen = 'register';
        this.clearErrors();
    },

    // Ocultar todas las pantallas
    hideAllScreens() {
        const screens = document.querySelectorAll('.auth-screen');
        screens.forEach(screen => screen.classList.remove('active'));
    },

    // Manejar login
    async handleLogin(e) {
        e.preventDefault();

        if (this.state.isLoading) return;

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validación básica
        if (!this.validateLoginForm(email, password)) {
            return;
        }

        this.setLoading(true);

        try {
            // Simular llamada a API
            const user = await this.simulateLoginAPI(email, password);

            if (user) {
                this.loginSuccess(user, rememberMe);
            } else {
                this.showError('login', 'Credenciales inválidas. Por favor, verifica tu email y contraseña.');
            }
        } catch (error) {
            this.showError('login', 'Error al iniciar sesión. Por favor, intenta nuevamente.');
        } finally {
            this.setLoading(false);
        }
    },

    // Manejar registro
    async handleRegister(e) {
        e.preventDefault();

        if (this.state.isLoading) return;

        const formData = this.getRegisterFormData();

        // Validación del formulario
        if (!this.validateRegisterForm(formData)) {
            return;
        }

        this.setLoading(true);

        try {
            // Simular llamada a API
            const user = await this.simulateRegisterAPI(formData);

            if (user) {
                this.registerSuccess(user);
            } else {
                this.showError('register', 'Error al crear la cuenta. Por favor, intenta nuevamente.');
            }
        } catch (error) {
            this.showError('register', 'Error al crear la cuenta. Por favor, intenta nuevamente.');
        } finally {
            this.setLoading(false);
        }
    },

    // Manejar recuperación de contraseña
    async handleForgotPassword(e) {
        e.preventDefault();

        const email = document.getElementById('forgotEmail').value.trim();

        if (!email) {
            this.showError('forgotPassword', 'Por favor, ingresa tu correo electrónico.');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('forgotPassword', 'Por favor, ingresa un correo electrónico válido.');
            return;
        }

        try {
            // Simular envío de email
            await this.simulateSendResetEmail(email);
            this.showSuccess('forgotPassword', 'Se ha enviado un enlace de recuperación a tu correo electrónico.');
            this.closeModal('forgotPasswordModal');
        } catch (error) {
            this.showError('forgotPassword', 'Error al enviar el email. Por favor, intenta nuevamente.');
        }
    },

    // Obtener datos del formulario de registro
    getRegisterFormData() {
        return {
            firstName: document.getElementById('registerFirstName').value.trim(),
            lastName: document.getElementById('registerLastName').value.trim(),
            email: document.getElementById('registerEmail').value.trim(),
            phone: document.getElementById('registerPhone').value.trim(),
            location: document.getElementById('registerLocation').value,
            password: document.getElementById('registerPassword').value,
            confirmPassword: document.getElementById('registerConfirmPassword').value,
            interests: this.getSelectedInterests(),
            agreeTerms: document.getElementById('agreeTerms').checked,
            agreePrivacy: document.getElementById('agreePrivacy').checked,
            agreeMarketing: document.getElementById('agreeMarketing').checked
        };
    },

    // Obtener intereses seleccionados
    getSelectedInterests() {
        const checkboxes = document.querySelectorAll('.interest-item input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    },

    // Validar formulario de login
    validateLoginForm(email, password) {
        this.clearErrors();

        if (!email) {
            this.showFieldError('loginEmail', 'El correo electrónico es requerido.');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showFieldError('loginEmail', 'Por favor, ingresa un correo electrónico válido.');
            return false;
        }

        if (!password) {
            this.showFieldError('loginPassword', 'La contraseña es requerida.');
            return false;
        }

        return true;
    },

    // Validar formulario de registro
    validateRegisterForm(data) {
        this.clearErrors();

        if (!data.firstName) {
            this.showFieldError('registerFirstName', 'El nombre es requerido.');
            return false;
        }

        if (!data.lastName) {
            this.showFieldError('registerLastName', 'El apellido es requerido.');
            return false;
        }

        if (!data.email) {
            this.showFieldError('registerEmail', 'El correo electrónico es requerido.');
            return false;
        }

        if (!this.isValidEmail(data.email)) {
            this.showFieldError('registerEmail', 'Por favor, ingresa un correo electrónico válido.');
            return false;
        }

        if (!data.phone) {
            this.showFieldError('registerPhone', 'El teléfono es requerido.');
            return false;
        }

        if (!this.isValidPhone(data.phone)) {
            this.showFieldError('registerPhone', 'Por favor, ingresa un teléfono válido.');
            return false;
        }

        if (!data.location) {
            this.showFieldError('registerLocation', 'La ubicación es requerida.');
            return false;
        }

        if (!data.password) {
            this.showFieldError('registerPassword', 'La contraseña es requerida.');
            return false;
        }

        if (data.password.length < 8) {
            this.showFieldError('registerPassword', 'La contraseña debe tener al menos 8 caracteres.');
            return false;
        }

        if (data.password !== data.confirmPassword) {
            this.showFieldError('registerConfirmPassword', 'Las contraseñas no coinciden.');
            return false;
        }

        if (!data.agreeTerms) {
            this.showError('register', 'Debes aceptar los términos y condiciones.');
            return false;
        }

        if (!data.agreePrivacy) {
            this.showError('register', 'Debes aceptar la política de privacidad.');
            return false;
        }

        return true;
    },

    // Validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validar teléfono
    isValidPhone(phone) {
        const phoneRegex = /^\+57\s\d{3}\s\d{3}\s\d{4}$/;
        return phoneRegex.test(phone);
    },

    // Validar coincidencia de contraseñas
    validatePasswordMatch(confirmPassword) {
        const password = document.getElementById('registerPassword').value;
        const confirmField = document.getElementById('registerConfirmPassword');

        if (confirmPassword && password !== confirmPassword) {
            confirmField.style.borderColor = 'var(--danger-color)';
            this.showFieldError('registerConfirmPassword', 'Las contraseñas no coinciden.');
        } else {
            confirmField.style.borderColor = 'var(--success-color)';
            this.clearFieldError('registerConfirmPassword');
        }
    },

    // Verificar fortaleza de contraseña
    checkPasswordStrength(password) {
        let strength = 0;
        let feedback = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');

        if (strength <= 2) {
            this.state.passwordStrength = 'weak';
            strengthFill.className = 'strength-fill weak';
            feedback = 'Débil - Agrega más caracteres y variedad';
        } else if (strength <= 3) {
            this.state.passwordStrength = 'fair';
            strengthFill.className = 'strength-fill fair';
            feedback = 'Aceptable - Puede ser más segura';
        } else if (strength <= 4) {
            this.state.passwordStrength = 'good';
            strengthFill.className = 'strength-fill good';
            feedback = 'Buena - Contraseña segura';
        } else {
            this.state.passwordStrength = 'strong';
            strengthFill.className = 'strength-fill strong';
            feedback = 'Excelente - Contraseña muy segura';
        }

        if (strengthText) {
            strengthText.textContent = feedback;
        }
    },

    // Mostrar modal de recuperación de contraseña
    showForgotPassword() {
        this.showModal('forgotPasswordModal');
    },

    // Mostrar modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    // Cerrar modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Mostrar términos y condiciones
    showTerms() {
        alert('Términos y Condiciones de EcoSwap Colombia\n\n1. Aceptas usar la plataforma de manera responsable\n2. Te comprometes a no vender productos ilegales\n3. Respetarás a otros usuarios\n4. Cumplirás con las leyes colombianas');
    },

    // Mostrar política de privacidad
    showPrivacy() {
        alert('Política de Privacidad de EcoSwap Colombia\n\n1. Tus datos personales están protegidos\n2. No compartimos información con terceros\n3. Puedes solicitar la eliminación de tus datos\n4. Cumplimos con la Ley 1581 de 2012');
    },

    // Login social
    socialLogin(provider) {
        this.setLoading(true);

        // Simular login social
        setTimeout(() => {
            this.setLoading(false);
            alert(`Login con ${provider} no implementado en esta versión de demo.`);
        }, 1000);
    },

    // Reenviar verificación
    resendVerification() {
        alert('Email de verificación reenviado. Revisa tu bandeja de entrada.');
    },

    // Simular API de login
    simulateLoginAPI(email, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Credenciales de demo
                if (email === 'demo@ecoswap.co' && password === 'demo123') {
                    resolve({
                        id: 1,
                        name: 'Carlos Mendoza',
                        email: 'demo@ecoswap.co',
                        location: 'Pereira, Risaralda, Colombia',
                        avatar: 'https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=CM',
                        verified: true
                    });
                } else {
                    resolve(null);
                }
            }, 1000);
        });
    },

    // Simular API de registro
    simulateRegisterAPI(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: Date.now(),
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    location: data.location,
                    avatar: `https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=${data.firstName.charAt(0)}`,
                    verified: false
                });
            }, 1500);
        });
    },

    // Simular envío de email de recuperación
    simulateSendResetEmail(email) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Email de recuperación enviado a: ${email}`);
                resolve(true);
            }, 1000);
        });
    },

    // Login exitoso
    loginSuccess(user, rememberMe) {
        this.state.isAuthenticated = true;
        this.state.currentUser = user;

        if (rememberMe) {
            localStorage.setItem('ecoswap_user', JSON.stringify(user));
        }

        sessionStorage.setItem('ecoswap_auth', 'true');

        this.showSuccess('login', '¡Bienvenido a EcoSwap Colombia!');

        // Redirigir a la aplicación principal
        setTimeout(() => {
            if (typeof EcoSwapApp !== 'undefined') {
                EcoSwapApp.showScreen('main');
            }
        }, 1000);
    },

    // Registro exitoso
    registerSuccess(user) {
        this.showSuccess('register', '¡Cuenta creada exitosamente! Por favor, verifica tu email.');
        this.showModal('emailVerificationModal');

        // Limpiar formulario
        document.getElementById('registerForm').reset();
    },

    // Verificar estado de autenticación
    checkAuthStatus() {
        const sessionAuth = sessionStorage.getItem('ecoswap_auth');
        const storedUser = localStorage.getItem('ecoswap_user');

        if (sessionAuth && storedUser) {
            try {
                const user = JSON.parse(storedUser);
                this.state.isAuthenticated = true;
                this.state.currentUser = user;

                // Redirigir a la aplicación principal
                if (typeof EcoSwapApp !== 'undefined') {
                    EcoSwapApp.showScreen('main');
                }
            } catch (error) {
                console.error('Error al parsear usuario almacenado:', error);
                this.logout();
            }
        }
    },

    // Cerrar sesión
    logout() {
        this.state.isAuthenticated = false;
        this.state.currentUser = null;

        sessionStorage.removeItem('ecoswap_auth');
        localStorage.removeItem('ecoswap_user');

        this.showLogin();
    },

    // Cambiar visibilidad de contraseña
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const toggle = input.nextElementSibling;

        if (input.type === 'password') {
            input.type = 'text';
            toggle.textContent = '🙈';
        } else {
            input.type = 'password';
            toggle.textContent = '👁️';
        }
    },

    // Establecer estado de carga
    setLoading(loading) {
        this.state.isLoading = loading;

        const submitButtons = document.querySelectorAll('.auth-form button[type="submit"]');
        submitButtons.forEach(button => {
            if (loading) {
                button.disabled = true;
                button.textContent = 'Cargando...';
            } else {
                button.disabled = false;
                if (button.closest('#loginForm')) {
                    button.textContent = 'Iniciar Sesión';
                } else if (button.closest('#registerForm')) {
                    button.textContent = 'Crear Cuenta';
                } else {
                    button.textContent = 'Enviar Enlace';
                }
            }
        });
    },

    // Mostrar error de campo
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = 'var(--danger-color)';

            // Crear o actualizar mensaje de error
            let errorElement = field.parentNode.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.style.color = 'var(--danger-color)';
                errorElement.style.fontSize = '12px';
                errorElement.style.marginTop = '4px';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    },

    // Limpiar error de campo
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '';
            const errorElement = field.parentNode.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        }
    },

    // Mostrar error general
    showError(screen, message) {
        this.clearErrors();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.style.cssText = `
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid var(--danger-color);
            color: var(--danger-color);
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
        `;
        errorDiv.textContent = message;

        const form = document.querySelector(`#${screen}Screen .auth-form`);
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
        }
    },

    // Mostrar mensaje de éxito
    showSuccess(screen, message) {
        this.clearErrors();

        const successDiv = document.createElement('div');
        successDiv.className = 'auth-success';
        successDiv.style.cssText = `
            background: rgba(39, 174, 96, 0.1);
            border: 1px solid var(--success-color);
            color: var(--success-color);
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
        `;
        successDiv.textContent = message;

        const form = document.querySelector(`#${screen}Screen .auth-form`);
        if (form) {
            form.insertBefore(successDiv, form.firstChild);
        }
    },

    // Limpiar errores
    clearErrors() {
        const errors = document.querySelectorAll('.auth-error, .auth-success, .field-error');
        errors.forEach(error => error.remove());

        const fields = document.querySelectorAll('.form-control');
        fields.forEach(field => {
            field.style.borderColor = '';
        });
    },

    // Obtener usuario actual
    getCurrentUser() {
        return this.state.currentUser;
    },

    // Verificar si está autenticado
    isAuthenticated() {
        return this.state.isAuthenticated;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    AuthModule.init();
});

// Exportar para uso global
window.AuthModule = AuthModule;
