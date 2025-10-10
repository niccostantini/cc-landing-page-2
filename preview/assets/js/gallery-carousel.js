/**
 * Gallery Carousel JavaScript
 * Minimalist carousel with infinite loop, keyboard, touch, lazy loading
 */

(async function initCarousel() {
    const qs = new URLSearchParams(location.search);
    let baseDir = qs.get('dir') || '';
    const title = qs.get('title') || 'Galleria';
    document.title = title;

    // Normalize directory parameter
    if (baseDir) {
        // Convert absolute paths starting with /assets/ to relative ./assets/
        if (baseDir.startsWith('/assets/')) {
            baseDir = '.' + baseDir;
        }
        // Add ./ prefix if missing for paths starting with assets/
        else if (baseDir.startsWith('assets/')) {
            baseDir = './' + baseDir;
        }
        // Ensure trailing slash
        if (!baseDir.endsWith('/')) {
            baseDir += '/';
        }
    }

    // Security check: validate directory path
    if (!baseDir.startsWith('./assets/events/')) {
        console.error('Invalid directory path:', baseDir);
        document.body.textContent = 'Percorso non valido.';
        return;
    }

    // Fetch media manifest
    let manifestRes;
    try {
        manifestRes = await fetch(`${baseDir}/media.json`);
    } catch (error) {
        document.body.textContent = 'Errore di connessione.';
        return;
    }

    if (!manifestRes.ok) {
        document.body.textContent = 'Nessun media trovato.';
        return;
    }

    let manifest;
    try {
        manifest = await manifestRes.json();
    } catch (error) {
        document.body.textContent = 'Formato media non valido.';
        return;
    }

    const media = manifest.media || [];
    
    // Filter supported formats
    const allowed = (filename) => /\.(jpe?g|webp|mp4)$/i.test(filename);
    const items = media.filter(m => m && m.src && allowed(m.src));

    if (items.length === 0) {
        document.body.textContent = 'Nessun media supportato trovato.';
        return;
    }

    // Initialize carousel state
    const container = document.getElementById('carousel');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    
    // Get initial slide index from hash
    let index = Math.max(0, parseInt((location.hash.match(/slide=(\d+)/) || [])[1] || '0', 10));
    if (index >= items.length) index = 0;

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
        container.innerHTML = '';
        
        if (!items.length) {
            container.textContent = 'Vuoto.';
            return;
        }

        const item = items[slideIndex];
        
        // Construct URL relative to gallery.html location
        // Since baseDir is already normalized to relative form (./assets/events/...)
        // and gallery.html is in /preview/, the paths will resolve correctly
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
    }

    /**
     * Go to next slide (with infinite loop)
     */
    function next() {
        index = (index + 1) % items.length;
        render(index);
    }

    /**
     * Go to previous slide (with infinite loop)
     */
    function prev() {
        index = (index - 1 + items.length) % items.length;
        render(index);
    }

    // Event listeners for navigation buttons
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

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
    let startX = 0;
    let startY = 0;
    let isVerticalScroll = false;

    container.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isVerticalScroll = false;
    });

    container.addEventListener('pointermove', (e) => {
        if (!startX || !startY) return;
        
        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);
        
        // Detect if this is a vertical scroll gesture
        if (deltaY > deltaX && deltaY > 20) {
            isVerticalScroll = true;
        }
    });

    container.addEventListener('pointerup', (e) => {
        if (!startX || isVerticalScroll) {
            startX = 0;
            startY = 0;
            return;
        }

        const deltaX = e.clientX - startX;
        
        // Swipe threshold
        if (Math.abs(deltaX) > 40) {
            if (deltaX < 0) {
                next(); // Swipe left -> next
            } else {
                prev(); // Swipe right -> prev
            }
        }
        
        startX = 0;
        startY = 0;
    });

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
            startX = 0;
            startY = 0;
            return;
        }

        const deltaX = e.changedTouches[0].clientX - startX;
        
        if (Math.abs(deltaX) > 40) {
            if (deltaX < 0) {
                next();
            } else {
                prev();
            }
        }
        
        startX = 0;
        startY = 0;
    }, { passive: true });

    // Initial render
    render(index);

})().catch(error => {
    console.error('Carousel initialization error:', error);
    document.body.textContent = 'Errore di inizializzazione carosello.';
});