/**
 * InterlockGo Mobile Navigation
 * Handles hamburger menu toggle and mobile dropdowns
 */
(function() {
  'use strict';

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var nav = document.querySelector('nav');
    if (!nav) return;

    // Find or create the menu list
    var menuList = nav.querySelector('ul');
    if (!menuList) return;

    // Check if hamburger already exists
    var toggle = nav.querySelector('.nav-toggle');
    var overlay = nav.querySelector('.nav-overlay');

    // Create hamburger button if it doesn't exist
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label', 'Toggle menu');
      toggle.setAttribute('aria-expanded', 'false');

      // Create hamburger spans using DOM methods (safe)
      var span1 = document.createElement('span');
      var span2 = document.createElement('span');
      var span3 = document.createElement('span');
      toggle.appendChild(span1);
      toggle.appendChild(span2);
      toggle.appendChild(span3);

      // Insert toggle at the start of nav
      nav.insertBefore(toggle, nav.firstChild);
    }

    // Create overlay if it doesn't exist
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      nav.appendChild(overlay);
    }

    // Mark items with dropdowns
    var dropdownParents = menuList.querySelectorAll('li > ul');
    dropdownParents.forEach(function(submenu) {
      var parent = submenu.parentElement;
      if (parent) {
        parent.classList.add('has-dropdown');
      }
    });

    // Toggle menu
    function toggleMenu(forceClose) {
      var isOpen = forceClose === true ? true : menuList.classList.contains('active');

      if (isOpen) {
        menuList.classList.remove('active');
        toggle.classList.remove('active');
        overlay.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');

        // Close all dropdowns
        menuList.querySelectorAll('li.open').forEach(function(item) {
          item.classList.remove('open');
        });
      } else {
        menuList.classList.add('active');
        toggle.classList.add('active');
        overlay.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-open');
      }
    }

    // Toggle button click
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Overlay click closes menu
    overlay.addEventListener('click', function() {
      toggleMenu(true);
    });

    // Handle dropdown toggles on mobile
    menuList.querySelectorAll('li.has-dropdown > a').forEach(function(link) {
      link.addEventListener('click', function(e) {
        // Only handle on mobile
        if (window.innerWidth <= 768) {
          var href = link.getAttribute('href');
          // If it's a dummy link, toggle dropdown
          if (!href || href === '#' || href === 'javascript:void(0)') {
            e.preventDefault();
            var parent = link.parentElement;
            var wasOpen = parent.classList.contains('open');

            // Close other dropdowns
            menuList.querySelectorAll('li.has-dropdown.open').forEach(function(item) {
              if (item !== parent) {
                item.classList.remove('open');
              }
            });

            // Toggle this dropdown
            if (wasOpen) {
              parent.classList.remove('open');
            } else {
              parent.classList.add('open');
            }
          }
        }
      });
    });

    // Close menu when clicking a real link
    menuList.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        var href = link.getAttribute('href');
        if (href && href !== '#' && href !== 'javascript:void(0)') {
          // Small delay to allow navigation
          setTimeout(function() {
            toggleMenu(true);
          }, 100);
        }
      });
    });

    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && menuList.classList.contains('active')) {
        toggleMenu(true);
      }
    });

    // Handle resize - close menu if resizing to desktop
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth > 768 && menuList.classList.contains('active')) {
          toggleMenu(true);
        }
      }, 100);
    });

    // Prevent scroll when menu is open
    menuList.addEventListener('touchmove', function(e) {
      if (menuList.classList.contains('active')) {
        e.stopPropagation();
      }
    }, { passive: true });
  }
})();
