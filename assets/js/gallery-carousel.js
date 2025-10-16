/**
 * Gallery Carousel JavaScript
 * Minimalist carousel with infinite loop, keyboard, touch, lazy loading
 */

(async function initCarousel() {
    console.log('[MOBILE DEBUG] Starting carousel initialization');
    console.log('[MOBILE DEBUG] User agent:', navigator.userAgent);
    console.log('[MOBILE DEBUG] Window size:', window.innerWidth, 'x', window.innerHeight);
    
    // Check browser API compatibility
    console.log('[MOBILE DEBUG] API Support:', {
        URLSearchParams: typeof URLSearchParams !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        IntersectionObserver: typeof IntersectionObserver !== 'undefined',
        requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
        addEventListener: typeof document.addEventListener === 'function',
        getElementById: typeof document.getElementById === 'function',
        createElement: typeof document.createElement === 'function',
        vibrate: typeof navigator.vibrate === 'function',
        Promise: typeof Promise !== 'undefined'
    });
    
    const qs = new URLSearchParams(location.search);
    let baseDir = qs.get('dir') || '';
    const title = qs.get('title') || 'Galleria';
    document.title = title;
    
    console.log('[MOBILE DEBUG] URL params - dir:', baseDir, 'title:', title);

    // Normalize directory parameter
    if (baseDir) {
        // Convert absolute paths starting with /assets/ to relative assets/
        if (baseDir.startsWith('/assets/')) {
            baseDir = baseDir.substring(1);
        }
        // Paths starting with assets/ are already correct
        // Ensure trailing slash
        if (!baseDir.endsWith('/')) {
            baseDir += '/';
        }
    }

    // Security check: validate directory path
    console.log('[MOBILE DEBUG] Validating baseDir:', baseDir);
    if (!baseDir.startsWith('assets/events/')) {
        console.error('[MOBILE DEBUG] Invalid directory path:', baseDir);
        document.body.textContent = 'Percorso non valido.';
        return;
    }
    console.log('[MOBILE DEBUG] Directory path is valid');

    // Fetch media manifest
    console.log('[MOBILE DEBUG] Fetching manifest from:', `${baseDir}/media.json`);
    let manifestRes;
    try {
        manifestRes = await fetch(`${baseDir}/media.json`);
        console.log('[MOBILE DEBUG] Manifest fetch successful:', manifestRes.status, manifestRes.statusText);
    } catch (error) {
        console.error('[MOBILE DEBUG] Manifest fetch failed:', error);
        document.body.textContent = 'Errore di connessione.';
        return;
    }

    if (!manifestRes.ok) {
        console.error('[MOBILE DEBUG] Manifest not ok:', manifestRes.status, manifestRes.statusText);
        document.body.textContent = 'Nessun media trovato.';
        return;
    }

    let manifest;
    try {
        manifest = await manifestRes.json();
        console.log('[MOBILE DEBUG] Manifest parsed successfully:', manifest);
    } catch (error) {
        console.error('[MOBILE DEBUG] Manifest JSON parse failed:', error);
        document.body.textContent = 'Formato media non valido.';
        return;
    }

    const media = manifest.media || [];
    console.log('[MOBILE DEBUG] Media items found:', media.length);
    
    // Filter supported formats
    const allowed = (filename) => /\.(jpe?g|webp|mp4)$/i.test(filename);
    const items = media.filter(m => m && m.src && allowed(m.src));
    console.log('[MOBILE DEBUG] Filtered media items:', items.length);

    if (items.length === 0) {
        console.error('[MOBILE DEBUG] No supported media found');
        document.body.textContent = 'Nessun media supportato trovato.';
        return;
    }

    // Initialize carousel state
    console.log('[MOBILE DEBUG] Getting DOM elements');
    const container = document.getElementById('carousel');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const closeBtn = document.getElementById('close');
    
    console.log('[MOBILE DEBUG] DOM elements found:', {
        container: !!container,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn,
        closeBtn: !!closeBtn
    });
    
    // Create mobile edge zones
    const edgePrev = document.createElement('div');
    edgePrev.className = 'nav-edge nav-edge--prev';
    edgePrev.setAttribute('aria-label', 'Area navigazione precedente');
    document.body.appendChild(edgePrev);
    
    const edgeNext = document.createElement('div');
    edgeNext.className = 'nav-edge nav-edge--next';
    edgeNext.setAttribute('aria-label', 'Area navigazione successiva');
    document.body.appendChild(edgeNext);
    
    // Create no-touch belt for video controls
    const noTouchBelt = document.createElement('div');
    noTouchBelt.className = 'no-touch-belt';
    document.body.appendChild(noTouchBelt);
    
    // Create indicators
    const indicators = document.createElement('div');
    indicators.className = 'carousel__indicators';
    indicators.setAttribute('role', 'status');
    indicators.setAttribute('aria-live', 'polite');
    indicators.innerHTML = `
        <div class="carousel__counter" aria-label="Contatore slide"></div>
        <div class="carousel__title" aria-label="Titolo corrente"></div>
    `;
    document.body.appendChild(indicators);
    
    const counterEl = indicators.querySelector('.carousel__counter');
    const titleEl = indicators.querySelector('.carousel__title');
    
    // Improve button accessibility
    prevBtn.setAttribute('aria-keyshortcuts', 'ArrowLeft');
    nextBtn.setAttribute('aria-keyshortcuts', 'ArrowRight');
    closeBtn.setAttribute('aria-keyshortcuts', 'Escape');
    
    // Set initial ARIA labels for carousel
    container.setAttribute('aria-label', `Galleria ${title}`);
    container.setAttribute('role', 'img');
    
    // Get initial slide index from hash
    let index = 0;
    try {
        const hashMatch = location.hash.match(/slide=(\d+)/);
        if (hashMatch && hashMatch[1]) {
            index = Math.max(0, parseInt(hashMatch[1], 10));
            if (index >= items.length) index = 0;
        }
        console.log('[MOBILE DEBUG] Initial slide index:', index);
    } catch (error) {
        console.warn('[MOBILE DEBUG] Hash parsing error:', error);
        index = 0;
    }

    /**
     * Escape HTML to prevent XSS
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

    /**
     * Render current slide
     */
    function render(slideIndex) {
        console.log('[MOBILE DEBUG] Rendering slide:', slideIndex, 'of', items.length);
        try {
            container.innerHTML = '';
        
        if (!items.length) {
            container.textContent = 'Vuoto.';
            return;
        }

        const item = items[slideIndex];
        
        // Construct URL relative to gallery.html location
        // Since baseDir is already normalized to relative form (assets/events/...)
        // the paths will resolve correctly
        const src = baseDir + item.src;
        
        let element;
        
        // Create video or image element
        if (item.type === 'video' || /\.mp4$/i.test(src)) {
            element = document.createElement('video');
            element.src = src;
            element.controls = true;
            element.preload = 'metadata';
            element.playsInline = true;
            element.muted = true;
        } else {
            element = document.createElement('img');
            element.src = src;
            element.loading = 'lazy';
            element.alt = escapeHtml(title);
        }
        
        element.className = 'carousel__media';
        container.appendChild(element);
        
        // Update URL hash
        location.hash = `slide=${slideIndex}`;
        
        // Update indicators
        counterEl.textContent = `${slideIndex + 1} / ${items.length}`;
        titleEl.textContent = title;
        console.log('[MOBILE DEBUG] Slide rendered successfully');
        } catch (error) {
            console.error('[MOBILE DEBUG] Render error:', error);
            throw error;
        }
    }

    /**
     * Haptic feedback for mobile devices
     */
    function hapticFeedback() {
        try {
            if (navigator.vibrate && window.innerWidth <= 640) {
                navigator.vibrate(50); // Light vibration
            }
        } catch (error) {
            console.warn('[MOBILE DEBUG] Haptic feedback error:', error);
        }
    }

    /**
     * Go to next slide (with infinite loop)
     */
    function next() {
        index = (index + 1) % items.length;
        render(index);
        hapticFeedback();
    }

    /**
     * Go to previous slide (with infinite loop)
     */
    function prev() {
        index = (index - 1 + items.length) % items.length;
        render(index);
        hapticFeedback();
    }

    // Event listeners for navigation buttons
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    
    // Event listeners for mobile navigation
    closeBtn.addEventListener('click', () => {
        try {
            window.close();
        } catch (error) {
            // Fallback: go back in history
            window.history.back();
        }
    });
    
    edgePrev.addEventListener('click', (e) => {
        e.preventDefault();
        prev();
    });
    
    edgeNext.addEventListener('click', (e) => {
        e.preventDefault();
        next();
    });
    
    let swipeThreshold = 50; // Adaptive threshold

    // Enhanced swipe detection for mobile
    function enhanceSwipeDetection() {
        if (window.innerWidth <= 640) {
            swipeThreshold = Math.min(50, window.innerWidth * 0.15);
        }
    }
    
    // Update swipe threshold on resize
    window.addEventListener('resize', enhanceSwipeDetection);
    enhanceSwipeDetection();

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                next();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prev();
                break;
            case 'Escape':
                e.preventDefault();
                window.close();
                break;
        }
    });

    // Touch/pointer events for swipe  
    console.log('[MOBILE DEBUG] Setting up touch/pointer events');
    console.log('[MOBILE DEBUG] Touch API support:', {
        touchEvents: 'ontouchstart' in window,
        pointerEvents: 'onpointerdown' in window,
        TouchEvent: typeof TouchEvent !== 'undefined',
        PointerEvent: typeof PointerEvent !== 'undefined'
    });
    
    let startX = 0;
    let startY = 0;
    let isVerticalScroll = false;
    let isSwipeInProgress = false;

    // Add pointer events with error handling
    try {
        container.addEventListener('pointerdown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            isVerticalScroll = false;
            isSwipeInProgress = true;
            
            // Visual feedback
            container.style.cursor = 'grabbing';
        });
        console.log('[MOBILE DEBUG] pointerdown listener added');
    } catch (error) {
        console.error('[MOBILE DEBUG] Failed to add pointerdown listener:', error);
    }

    try {
        container.addEventListener('pointermove', (e) => {
            if (!startX || !startY) return;
            
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            // Detect if this is a vertical scroll gesture
            if (deltaY > deltaX && deltaY > 20) {
                isVerticalScroll = true;
            }
        });
        console.log('[MOBILE DEBUG] pointermove listener added');
    } catch (error) {
        console.error('[MOBILE DEBUG] Failed to add pointermove listener:', error);
    }

    try {
        container.addEventListener('pointerup', (e) => {
            if (!startX || isVerticalScroll) {
                resetSwipeState();
                return;
            }

            const deltaX = e.clientX - startX;
            
            // Adaptive threshold based on screen size
            const screenWidth = window.innerWidth;
            swipeThreshold = screenWidth < 640 ? 30 : 40;
            
            // Swipe detection
            if (Math.abs(deltaX) > swipeThreshold) {
                if (deltaX < 0) {
                    next(); // Swipe left -> next
                } else {
                    prev(); // Swipe right -> prev
                }
            }
            
            resetSwipeState();
        });
        console.log('[MOBILE DEBUG] pointerup listener added');
    } catch (error) {
        console.error('[MOBILE DEBUG] Failed to add pointerup listener:', error);
    }
    
    function resetSwipeState() {
        startX = 0;
        startY = 0;
        isSwipeInProgress = false;
        container.style.cursor = 'grab';
    }

    // Handle touch events to prevent default scroll behavior during horizontal swipes
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isVerticalScroll = false;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!startX || !startY) return;
        
        const deltaX = Math.abs(e.touches[0].clientX - startX);
        const deltaY = Math.abs(e.touches[0].clientY - startY);
        
        // Detect vertical vs horizontal gesture
        if (deltaY > deltaX && deltaY > 20) {
            isVerticalScroll = true;
        } else if (deltaX > 20 && !isVerticalScroll) {
            // Prevent vertical scrolling for horizontal swipes
            e.preventDefault();
        }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
        if (!startX || isVerticalScroll) {
            resetSwipeState();
            return;
        }

        const deltaX = e.changedTouches[0].clientX - startX;
        
        // Use same adaptive threshold
        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX < 0) {
                next();
            } else {
                prev();
            }
        }
        
        resetSwipeState();
    }, { passive: true });

    console.log('[MOBILE DEBUG] About to render initial slide:', index);
    // Initial render
    render(index);
    console.log('[MOBILE DEBUG] Carousel initialization completed successfully');

})().catch(error => {
    console.error('[MOBILE DEBUG] Carousel initialization error:', error);
    console.error('[MOBILE DEBUG] Error name:', error.name);
    console.error('[MOBILE DEBUG] Error message:', error.message);
    console.error('[MOBILE DEBUG] Error stack:', error.stack);
    console.error('[MOBILE DEBUG] Current URL:', location.href);
    console.error('[MOBILE DEBUG] Current params:', location.search);
    document.body.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; color: white; background: #111;">
            <h2>Errore di inizializzazione carosello</h2>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Type:</strong> ${error.name}</p>
            <details>
                <summary>Debug Info</summary>
                <pre style="background: #222; padding: 10px; white-space: pre-wrap;">${error.stack || 'No stack trace available'}</pre>
            </details>
        </div>
    `;
});
