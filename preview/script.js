/**
 * ControCoro - Main JavaScript File
 * Handles smooth scroll, typewriter animation, and dynamic content loading
 */

// ==========================================================================
// Utility functions
// ==========================================================================

/**
 * Debounce function to limit the rate at which functions can fire
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format date to Italian locale
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// ==========================================================================
// Navigation System
// ==========================================================================

/**
 * Navigation manager with scrollspy and responsive menu handling
 */
class NavigationManager {
    constructor() {
        this.sections = [];
        this.navLinks = {
            sidenav: document.querySelectorAll('.sidenav__link'),
            tablet: document.querySelectorAll('.navbar-tablet__link'),
            mobile: document.querySelectorAll('.mobile-menu__link')
        };
        this.currentActive = null;
        this.headerOffset = this.getHeaderOffset();
        
        this.init();
    }
    
    init() {
        this.setupSections();
        this.setupSmoothScroll();
        this.setupScrollSpy();
        this.setupMobileMenu();
        
        // Update header offset on resize
        window.addEventListener('resize', debounce(() => {
            this.headerOffset = this.getHeaderOffset();
        }, 250));
    }
    
    getHeaderOffset() {
        const header = document.querySelector('.site-header');
        return header ? header.offsetHeight + 20 : 100;
    }
    
    setupSections() {
        const sectionElements = document.querySelectorAll('section[id]');
        this.sections = Array.from(sectionElements).map(section => ({
            id: section.id,
            element: section,
            top: 0 // Will be updated dynamically
        }));
    }
    
    setupSmoothScroll() {
        // Get all navigation links
        const allNavLinks = [
            ...this.navLinks.sidenav,
            ...this.navLinks.tablet,
            ...this.navLinks.mobile
        ];
        
        allNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    const targetTop = targetSection.offsetTop - this.headerOffset;
                    
                    window.scrollTo({
                        top: targetTop,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    this.closeMobileMenu();
                    
                    // Update URL
                    history.pushState(null, null, `#${targetId}`);
                }
            });
        });
    }
    
    setupScrollSpy() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: `-${this.headerOffset}px 0px -50% 0px`
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveSection(entry.target.id);
                }
            });
        }, observerOptions);
        
        this.sections.forEach(section => {
            observer.observe(section.element);
        });
    }
    
    setActiveSection(sectionId) {
        if (this.currentActive === sectionId) return;
        
        this.currentActive = sectionId;
        
        // Update all navigation menus
        Object.values(this.navLinks).forEach(linkSet => {
            linkSet.forEach(link => {
                const linkTarget = link.getAttribute('data-section');
                if (linkTarget === sectionId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        });
    }
    
    setupMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const closeBtn = mobileMenu.querySelector('.mobile-menu__close');
        const overlay = mobileMenu.querySelector('.mobile-menu__overlay');
        
        if (!menuBtn || !mobileMenu) return;
        
        // Open menu
        menuBtn.addEventListener('click', () => this.openMobileMenu());
        
        // Close menu
        closeBtn.addEventListener('click', () => this.closeMobileMenu());
        overlay.addEventListener('click', () => this.closeMobileMenu());
        
        // Keyboard handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
                this.closeMobileMenu();
            }
        });
    }
    
    openMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        mobileMenu.classList.add('is-open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuBtn.setAttribute('aria-expanded', 'true');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus first link
        const firstLink = mobileMenu.querySelector('.mobile-menu__link');
        if (firstLink) {
            setTimeout(() => firstLink.focus(), 100);
        }
    }
    
    closeMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (!mobileMenu.classList.contains('is-open')) return;
        
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuBtn.setAttribute('aria-expanded', 'false');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to menu button
        menuBtn.focus();
    }
}

// Legacy smooth scroll removed - now handled by NavigationManager

// ==========================================================================
// Word Cloud Animation
// ==========================================================================

/**
 * Manage word cloud animation with fade-in/fade-out cycles
 */
class WordCloudManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.words = Array.from(this.container.querySelectorAll('.word-cloud__word'));
        this.randomOrder = [];
        this.currentIndex = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.phase = 'fadein'; // 'fadein' or 'fadeout'
        this.animationId = null;
        this.lastTime = 0;
        this.interval = 1000; // 1 second between words
        this.pauseAfterCycle = 500; // Pause between cycles
        this.colors = ['ink', 'accent', 'accent-2', 'white'];
        
        this.init();
    }
    
    init() {
        if (this.words.length === 0) return;
        
        // Assign random colors to words
        this.assignRandomColors();
        
        // Create random order for animation
        this.createRandomOrder();
        
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.showAllWords();
            return;
        }
        
        // Setup hover/focus pause behavior
        this.setupPauseEvents();
        
        // Start animation
        this.start();
    }
    
    showAllWords() {
        this.words.forEach(word => {
            word.classList.add('visible');
        });
    }
    
    hideAllWords() {
        this.words.forEach(word => {
            word.classList.remove('visible');
        });
    }
    
    assignRandomColors() {
        this.words.forEach(word => {
            // Remove any existing color classes
            this.colors.forEach(color => {
                word.classList.remove(`word-cloud__word--${color}`);
            });
            
            // Assign random color
            const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            word.classList.add(`word-cloud__word--${randomColor}`);
        });
    }
    
    createRandomOrder() {
        // Create array of indices
        this.randomOrder = Array.from({length: this.words.length}, (_, i) => i);
        
        // Shuffle using Fisher-Yates algorithm
        for (let i = this.randomOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.randomOrder[i], this.randomOrder[j]] = [this.randomOrder[j], this.randomOrder[i]];
        }
    }
    
    setupPauseEvents() {
        this.container.addEventListener('mouseenter', () => this.pause());
        this.container.addEventListener('mouseleave', () => this.resume());
        this.container.addEventListener('focusin', () => this.pause());
        this.container.addEventListener('focusout', () => this.resume());
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.currentIndex = 0;
        this.phase = 'fadein';
        this.hideAllWords();
        
        // Create new random order for each cycle
        this.createRandomOrder();
        
        this.lastTime = performance.now();
        this.animate();
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.lastTime = performance.now();
        }
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        if (!this.isPaused && currentTime - this.lastTime >= this.interval) {
            this.processNextWord();
            this.lastTime = currentTime;
        }
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    processNextWord() {
        if (this.phase === 'fadein') {
            // Show current word using random order
            if (this.currentIndex < this.randomOrder.length) {
                const wordIndex = this.randomOrder[this.currentIndex];
                this.words[wordIndex].classList.add('visible');
                this.currentIndex++;
            }
            
            // Check if fade-in phase is complete
            if (this.currentIndex >= this.randomOrder.length) {
                this.phase = 'fadeout';
                this.currentIndex = this.randomOrder.length - 1;
            }
        } else {
            // Hide current word using reverse random order
            if (this.currentIndex >= 0) {
                const wordIndex = this.randomOrder[this.currentIndex];
                this.words[wordIndex].classList.remove('visible');
                this.currentIndex--;
            }
            
            // Check if fade-out phase is complete
            if (this.currentIndex < 0) {
                // Wait before restarting cycle
                setTimeout(() => {
                    if (this.isRunning && !this.isPaused) {
                        this.phase = 'fadein';
                        this.currentIndex = 0;
                        // Create new random order for next cycle
                        this.createRandomOrder();
                    }
                }, this.pauseAfterCycle);
            }
        }
    }
}

// ==========================================================================
// Dynamic Content Loading - Repertorio
// ==========================================================================

/**
 * Load and display repertorio data
 */
async function loadRepertorio() {
    try {
        const response = await fetch('./assets/data/pezzi.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const pezzi = await response.json();
        renderRepertorio(pezzi);
    } catch (error) {
        console.error('Error loading repertorio:', error);
        showRepertorioFallback();
    }
}

/**
 * Render repertorio cards
 */
function renderRepertorio(pezzi) {
    const container = document.getElementById('repertorio-carousel');
    if (!container) return;
    
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    
    pezzi.forEach(pezzo => {
        const card = createRepertorioCard(pezzo);
        carousel.appendChild(card);
    });
    
    container.appendChild(carousel);
}

/**
 * Create a single repertorio card
 */
function createRepertorioCard(pezzo) {
    const card = document.createElement('div');
    card.className = 'repertorio-card';

    const tags = Array.isArray(pezzo.Tag) ? pezzo.Tag : [pezzo.Tag].filter(Boolean);
    const tagsHtml = tags
        .map(t => `<span class="repertorio-card__tag">${escapeHtml(t)}</span>`)
        .join('');

    card.innerHTML = `
    <h3 class="repertorio-card__title">${escapeHtml(pezzo.Titolo)}</h3>
    <p class="repertorio-card__author">${escapeHtml(pezzo.Autore)}</p>
    <div class="repertorio-card__tags">${tagsHtml}</div>
  `;

    return card;
}

/**
 * Show fallback content if repertorio loading fails
 */
function showRepertorioFallback() {
    const container = document.getElementById('repertorio-carousel');
    if (!container) return;
    
    container.innerHTML = `
        <div class="carousel">
            <div class="repertorio-card">
                <h3 class="repertorio-card__title">Repertorio non disponibile</h3>
                <p class="repertorio-card__author">Riprova più tardi</p>
                <span class="repertorio-card__tag">Info</span>
            </div>
        </div>
    `;
}

// ==========================================================================
// Dynamic Content Loading - Direttivo
// ==========================================================================

/**
 * Load and display direttivo data
 */
async function loadDirettivo() {
    try {
        const response = await fetch('./assets/data/direttivo.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const membri = await response.json();
        renderDirettivo(membri);
    } catch (error) {
        console.error('Error loading direttivo:', error);
        showDirettivoFallback();
    }
}

/**
 * Render direttivo cards
 */
function renderDirettivo(membri) {
    const container = document.getElementById('direttivo-grid');
    if (!container) return;
    
    membri.forEach(membro => {
        const card = createMembroCard(membro);
        container.appendChild(card);
    });
}

/**
 * Create a single membro card
 */
function createMembroCard(membro) {
    const card = document.createElement('article');
    card.className = 'membro';
    
    const nomeCompleto = `${membro.nome} ${membro.cognome}`;
    const imagePath = `./assets/images/direttivo/${membro['nome-file-immagine']}.jpg`;
    const initials = getInitials(membro.nome, membro.cognome);
    
    // Create avatar wrapper
    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'membro__avatar-wrap';
    
    // Try to load image
    const img = document.createElement('img');
    img.className = 'membro__avatar';
    img.src = imagePath;
    img.alt = nomeCompleto;
    
    // Handle image load error
    img.onerror = function() {
        const placeholder = makePlaceholder(initials);
        this.parentNode.replaceChild(placeholder, this);
    };
    
    avatarWrap.appendChild(img);
    
    // Create content
    const title = document.createElement('h3');
    title.textContent = nomeCompleto;
    
    const role = document.createElement('p');
    role.className = 'sub';
    role.textContent = membro.ruolo;
    
    // Assemble card
    card.appendChild(avatarWrap);
    card.appendChild(title);
    card.appendChild(role);
    
    return card;
}

/**
 * Create placeholder avatar with initials
 */
function makePlaceholder(initials) {
    const placeholder = document.createElement('div');
    placeholder.className = 'membro__placeholder';
    placeholder.textContent = initials;
    placeholder.setAttribute('aria-label', `Avatar placeholder con iniziali ${initials}`);
    return placeholder;
}

/**
 * Extract initials from nome and cognome
 */
function getInitials(nome, cognome) {
    const nomeInitial = nome.charAt(0).toUpperCase();
    const cognomeInitial = cognome.charAt(0).toUpperCase();
    return nomeInitial + cognomeInitial;
}

/**
 * Show fallback content if direttivo loading fails
 */
function showDirettivoFallback() {
    const container = document.getElementById('direttivo-grid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="membro">
            <div class="membro__avatar-wrap">
                <div class="membro__placeholder">?</div>
            </div>
            <h3>Direttivo non disponibile</h3>
            <p class="sub">Riprova più tardi</p>
        </div>
    `;
}

// ==========================================================================
// Dynamic Content Loading - Eventi
// ==========================================================================

/**
 * Check if event is visible
 */
function isVisible(visibleValue) {
    if (typeof visibleValue === 'number') {
        return visibleValue === 1;
    }
    if (typeof visibleValue === 'string') {
        return visibleValue === '1';
    }
    return Boolean(visibleValue);
}

/**
 * Load and display eventi data (only visible events for Concerti section)
 */
async function loadEventi() {
    try {
        const response = await fetch('./assets/data/eventi.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const eventi = await response.json();
        // Filter only visible events for Concerti section
        const eventiVisibili = eventi.filter(evento => isVisible(evento.visible));
        renderEventi(eventiVisibili);
    } catch (error) {
        console.error('Error loading eventi:', error);
        showEventiFallback();
    }
}

/**
 * Render eventi cards
 */
function renderEventi(eventi) {
    const container = document.getElementById('concerti-grid');
    if (!container) return;
    
    eventi.forEach(evento => {
        const card = createEventoCard(evento);
        container.appendChild(card);
    });
}

/**
 * Create a single evento card
 */
function createEventoCard(evento) {
    const card = document.createElement('div');
    card.className = 'evento-card';
    
    const formattedDate = formatDate(evento.data);
    
    card.innerHTML = `
        <h3 class="evento-card__nome">${escapeHtml(evento.nome)}</h3>
        <p class="evento-card__data">${formattedDate}</p>
        <p class="evento-card__luogo">${escapeHtml(evento.luogo)}</p>
    `;
    
    return card;
}

/**
 * Show fallback content if eventi loading fails
 */
function showEventiFallback() {
    const container = document.getElementById('concerti-grid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="evento-card">
            <h3 class="evento-card__nome">Prossimi concerti</h3>
            <p class="evento-card__data">Date da definire</p>
            <p class="evento-card__luogo">Segui i nostri canali per aggiornamenti</p>
        </div>
    `;
}

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// ==========================================================================
// Intersection Observer for Animations
// ==========================================================================

/**
 * Initialize intersection observer for scroll animations
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => observer.observe(section));
}

// ==========================================================================
// Modal Management
// ==========================================================================

/**
 * Manage modal functionality with accessibility features
 */
class ModalManager {
    constructor(modalId, triggerBtnId) {
        this.modal = document.getElementById(modalId);
        this.triggerBtn = document.getElementById(triggerBtnId);
        this.closeBtn = this.modal.querySelector('.modal__close');
        this.overlay = this.modal.querySelector('.modal__overlay');
        this.focusableElements = [];
        this.lastFocusedElement = null;
        
        this.init();
    }
    
    init() {
        if (!this.modal || !this.triggerBtn) return;
        
        // Bind events
        this.triggerBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    open() {
        this.lastFocusedElement = document.activeElement;
        this.modal.classList.add('is-open');
        this.modal.setAttribute('aria-hidden', 'false');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Get focusable elements
        this.updateFocusableElements();
        
        // Focus first element or close button
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        } else {
            this.closeBtn.focus();
        }
    }
    
    close() {
        this.modal.classList.remove('is-open');
        this.modal.setAttribute('aria-hidden', 'true');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to trigger element
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
    }
    
    updateFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'a[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        this.focusableElements = Array.from(
            this.modal.querySelectorAll(focusableSelectors.join(', '))
        );
    }
    
    handleKeydown(e) {
        if (!this.modal.classList.contains('is-open')) return;
        
        // Close on Escape
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            return;
        }
        
        // Trap focus with Tab
        if (e.key === 'Tab') {
            this.trapFocus(e);
        }
    }
    
    trapFocus(e) {
        if (this.focusableElements.length === 0) {
            e.preventDefault();
            return;
        }
        
        const firstFocusable = this.focusableElements[0];
        const lastFocusable = this.focusableElements[this.focusableElements.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab (forward)
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
}

// ==========================================================================
// Keyboard Navigation
// ==========================================================================

/**
 * Enhance keyboard navigation accessibility
 */
function initKeyboardNavigation() {
    // Enhanced focus indicators are handled in CSS
    // Modal keyboard interaction is handled by ModalManager class
}

// ==========================================================================
// Performance Optimizations
// ==========================================================================

/**
 * Lazy load images when they come into view
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

// ==========================================================================
// Error Handling
// ==========================================================================

/**
 * Global error handler for uncaught errors
 */
function initErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        // In production, you might want to send this to an error reporting service
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        // In production, you might want to send this to an error reporting service
    });
}

// ==========================================================================
// Galleria Section
// ==========================================================================

/**
 * Load and display all events in galleria section
 */
async function loadGalleria() {
    try {
        const response = await fetch('./assets/data/eventi.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const eventi = await response.json();
        renderGalleria(eventi);
    } catch (error) {
        console.error('Error loading galleria:', error);
        showGalleriaFallback();
    }
}

/**
 * Render galleria folders
 */
function renderGalleria(eventi) {
    const container = document.getElementById('galleria-grid');
    if (!container) return;
    
    // Parse date helper function
    const parseDate = (dateStr) => {
        if (!dateStr || dateStr === '0' || dateStr === 'null' || dateStr === '') {
            return null;
        }
        return new Date(dateStr);
    };
    
    // Sort events: date descending, events without date at end, then by name ascending
    eventi.sort((a, b) => {
        const dateA = parseDate(a.data);
        const dateB = parseDate(b.data);
        
        if (dateA && dateB) {
            return dateB - dateA; // Date descending
        }
        if (dateA && !dateB) {
            return -1; // Events with date come first
        }
        if (!dateA && dateB) {
            return 1; // Events without date come last
        }
        // Both have no date, sort by name ascending
        return (a.nome || '').localeCompare(b.nome || '');
    });
    
    // Clear existing content
    container.innerHTML = '';
    
    eventi.forEach(evento => {
        // Skip events without required fields
        if (!evento || !evento.directory || !evento.nome) {
            return;
        }
        
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'galleria-folder';
        card.innerHTML = `
            <div class="galleria-folder__icon" aria-hidden="true">📁</div>
            <div class="galleria-folder__label">${escapeHtml(evento.nome)}</div>
        `;
        
        card.addEventListener('click', () => {
            const url = `gallery.html?dir=${encodeURIComponent(evento.directory)}&title=${encodeURIComponent(evento.nome)}`;
            window.open(url, 'window', 'toolbar=no,menubar=no,resizable=yes');
        });
        
        container.appendChild(card);
    });
}

/**
 * Show fallback content if galleria loading fails
 */
function showGalleriaFallback() {
    const container = document.getElementById('galleria-grid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="galleria-folder">
            <div class="galleria-folder__icon" aria-hidden="true">📁</div>
            <div class="galleria-folder__label">Galleria non disponibile</div>
        </div>
    `;
}

// ==========================================================================
// Main Initialization
// ==========================================================================

/**
 * Initialize all functionality when DOM is loaded
 */
function init() {
    // Navigation system (includes smooth scroll and scrollspy)
    const navigation = new NavigationManager();
    
    // Word cloud animation
    const wordCloud = new WordCloudManager('word-cloud');
    
    // Core functionality
    initScrollAnimations();
    initKeyboardNavigation();
    
    // Modal functionality
    const contattiModal = new ModalManager('contatti-modal', 'contatti-btn');
    
    // Content loading
    loadDirettivo();
    loadRepertorio();
    loadEventi();
    loadGalleria();
    
    // Performance optimizations
    initLazyLoading();
    
    // Error handling
    initErrorHandling();
    
    console.log('ControCoro website initialized successfully');
}

// ==========================================================================
// Event Listeners
// ==========================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already ready
    init();
}

// Handle resize events (debounced)
const handleResize = debounce(() => {
    // Handle any resize-specific logic here if needed
    console.log('Window resized');
}, 250);

window.addEventListener('resize', handleResize);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - pause any animations if needed
    } else {
        // Page is visible - resume animations if needed
    }
});