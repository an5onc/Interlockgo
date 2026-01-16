/**
 * InterlockGo Landing Page Scripts
 * Theme Toggle, Mobile Navigation, Back to Top
 */

(function() {
  'use strict';

  // === THEME TOGGLE ===
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const THEME_KEY = 'theme';

  // Get current theme
  function getTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Set theme
  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update toggle aria-label
    if (themeToggle) {
      themeToggle.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  // Toggle theme
  function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme') || getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  // Initialize theme
  setTheme(getTheme());

  // Theme toggle click handler
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only update if user hasn't manually set a preference
    if (!localStorage.getItem(THEME_KEY)) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });

  // === MOBILE NAVIGATION ===
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');
  const navOverlay = document.getElementById('nav-overlay');
  const body = document.body;

  function openMobileNav() {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    navLinks.classList.add('active');
    navOverlay.classList.add('active');
    navOverlay.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';

    // Focus trap - focus first link
    const firstLink = navLinks.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMobileNav() {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    navOverlay.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';

    // Return focus to hamburger
    hamburger.focus();
  }

  function toggleMobileNav() {
    const isOpen = navLinks.classList.contains('active');
    if (isOpen) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileNav);
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', closeMobileNav);
  }

  // Close mobile nav on link click
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
          closeMobileNav();
        }
      });
    });
  }

  // Close mobile nav on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
      closeMobileNav();
    }
  });

  // Close mobile nav on resize to desktop
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (window.innerWidth >= 1024 && navLinks && navLinks.classList.contains('active')) {
        closeMobileNav();
      }
    }, 100);
  });

  // === SCROLL HANDLING ===
  let lastScrollY = 0;
  let ticking = false;

  function updateOnScroll() {
    const scrollY = window.scrollY;

    // Add scrolled class for back to top button visibility
    if (scrollY > 400) {
      body.classList.add('scrolled');
    } else {
      body.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateOnScroll);
      ticking = true;
    }
  }, { passive: true });

  // === SMOOTH SCROLL FOR ANCHOR LINKS ===
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      // Skip if just "#"
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });

        // Update URL without scrolling
        history.pushState(null, '', href);
      }
    });
  });

  // === INTERSECTION OBSERVER FOR ANIMATIONS ===
  // Only if reduced motion is not preferred
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  }

  // === FOCUS VISIBLE POLYFILL DETECTION ===
  // Add focus-visible class for browsers that don't support :focus-visible
  try {
    document.body.classList.add('js-focus-visible');
    document.querySelector(':focus-visible');
  } catch (e) {
    // :focus-visible not supported
    document.body.classList.remove('js-focus-visible');
  }

  // === ORBIT ANIMATION PAUSE ON HOVER ===
  const orbitNodes = document.querySelector('.orbit__nodes');
  const orbit = document.querySelector('.orbit');

  if (orbit && orbitNodes) {
    orbit.addEventListener('mouseenter', () => {
      orbitNodes.style.animationPlayState = 'paused';
      orbitNodes.querySelectorAll('.orbit__node').forEach(node => {
        node.style.animationPlayState = 'paused';
      });
    });

    orbit.addEventListener('mouseleave', () => {
      orbitNodes.style.animationPlayState = 'running';
      orbitNodes.querySelectorAll('.orbit__node').forEach(node => {
        node.style.animationPlayState = 'running';
      });
    });
  }

  // === KEYBOARD NAVIGATION HELPERS ===
  // Skip link functionality
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      const targetId = skipLink.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.removeAttribute('tabindex');
      }
    });
  }

})();
