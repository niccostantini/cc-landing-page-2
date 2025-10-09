# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the official website for **ControCoro** - an amateur choir from Spin Time Labs in Rome, Italy. The site is a static HTML website with modern JavaScript functionality, built with accessibility and performance in mind.

**Key Features:**
- Responsive design with mobile-first approach (mobile, tablet, desktop layouts)
- Smooth scrolling navigation with active section highlighting
- Animated word cloud displaying choir values
- Dynamic content loading from JSON data files
- Modal system for contact information
- Accessibility features (ARIA labels, keyboard navigation, focus management)

## Architecture

### File Structure
```
├── index.html              # Main HTML structure with 6 sections
├── styles.css             # Complete CSS with design tokens and responsive breakpoints
├── script.js              # Modular JavaScript with ES6 classes
├── assets/
│   ├── data/              # JSON data files for dynamic content
│   │   ├── direttivo.json # Board members data
│   │   ├── pezzi.json     # Musical repertoire data  
│   │   └── eventi.json    # Concert events data
│   ├── images/            # Site images and logos
│   │   ├── direttivo/     # Board member photos
│   │   └── chi-siamo.jpg  # About us image
│   └── fonts/             # Custom web fonts (League Spartan, TT Norms)
└── .gitignore             # Standard web project ignore patterns
```

### CSS Architecture
The styles use a **design token system** with CSS custom properties:
- Color tokens: `--ink`, `--accent`, `--accent-2`, `--tint`, etc.
- Spacing scale: `--space-xs` to `--space-4xl`
- Typography: `--font-display` (League Spartan), `--font-body` (TT Norms)
- Responsive breakpoints: Mobile (≤640px), Tablet (641px-1024px), Desktop (≥1025px)

**Key CSS Features:**
- Three navigation systems: desktop sidebar, tablet horizontal nav, mobile popup menu
- Alternating section backgrounds with custom separators
- CSS Grid and Flexbox layouts
- Smooth animations with `prefers-reduced-motion` support

### JavaScript Architecture
The JavaScript uses **ES6 classes and modern APIs**:

**Core Classes:**
- `NavigationManager`: Handles smooth scroll, scrollspy, and responsive menus
- `WordCloudManager`: Animated word cloud with fade-in/fade-out cycles
- `ModalManager`: Accessible modal system with focus trapping

**Content Loading:**
- Dynamic loading from JSON files in `assets/data/`
- Graceful fallbacks if data loading fails
- XSS protection with HTML escaping

**Performance Features:**
- Intersection Observer for scroll animations and lazy loading
- Debounced resize handlers
- Request animation frame for smooth animations

## Common Development Tasks

### Local Development
```bash
# Serve the site locally (Python)
python3 -m http.server 8000

# Serve the site locally (Node.js)
npx http-server

# Open in browser
open http://localhost:8000
```

### Testing Responsive Design
```bash
# Test mobile viewport
open -a "Google Chrome" --args --device-scale-factor=2 --window-size=375,667

# Test tablet viewport  
open -a "Google Chrome" --args --window-size=768,1024
```

### Content Updates

**Update Board Members:**
Edit `assets/data/direttivo.json` with member info:
```json
{
  "nome": "FirstName",
  "cognome": "LastName", 
  "ruolo": "Role description",
  "nome-file-immagine": "filename"
}
```
Add corresponding image to `assets/images/direttivo/filename.jpg`

**Update Musical Repertoire:**
Edit `assets/data/pezzi.json`:
```json
{
  "Titolo": "Song Title",
  "Autore": "Composer/Author", 
  "Tag": "Category"
}
```

**Update Concert Events:**
Edit `assets/data/eventi.json`:
```json
{
  "nome": "Event Name",
  "data": "YYYY-MM-DD",
  "luogo": "Venue Name"
}
```

### Accessibility Testing
```bash
# Install accessibility linting
npm install -g axe-cli

# Test accessibility
axe http://localhost:8000
```

## Code Patterns

### Adding New Sections
1. Add section HTML in `index.html` with proper ARIA labels
2. Add navigation links to all three nav systems (sidenav, tablet, mobile)
3. Update section alternating backgrounds in CSS if needed
4. Add section ID to JavaScript navigation setup

### CSS Modifications
- Use design tokens from `:root` rather than hardcoded values
- Follow mobile-first responsive approach
- Test across all three breakpoints (mobile/tablet/desktop)
- Maintain accessibility contrast ratios

### JavaScript Extensions
- Use ES6+ features (classes, arrow functions, async/await)
- Follow error handling patterns established in existing code
- Use Intersection Observer for performance-sensitive animations
- Implement proper focus management for new interactive elements

## Image Optimization

**Expected Image Formats:**
- Logo: SVG format for scalability
- Photos: JPG format, optimized for web
- Board member photos: 256x256px recommended, square format

**Optimization Commands:**
```bash
# Optimize JPG images
jpegoptim --size=100k assets/images/*.jpg

# Convert to WebP for modern browsers
cwebp -q 80 input.jpg -o output.webp
```

## Browser Support

The site uses modern web APIs with fallbacks:
- Intersection Observer (with legacy fallback)
- CSS Grid (with Flexbox fallback)
- CSS Custom Properties (design tokens)
- ES6+ JavaScript (modern browsers)

**Minimum Browser Support:**
- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

## Italian Language Context

The website is entirely in Italian. Key terms:
- "Chi siamo" = About us
- "I nostri valori" = Our values  
- "Il direttivo" = The board
- "Dove siamo" = Where we are
- "Il repertorio" = The repertoire
- "Concerti" = Concerts
- "Contattaci" = Contact us

## Performance Considerations

- Images should be optimized for web delivery
- JSON data files are small and load quickly
- CSS and JavaScript are concatenated in single files
- Use browser caching for static assets
- Implement proper loading states for dynamic content

## Accessibility Standards

The site follows WCAG 2.1 AA standards:
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels and landmarks
- Keyboard navigation support
- Focus management in modals
- Alternative text for images
- Color contrast compliance
- Screen reader compatibility