/**
 * 💛 For Karly — a secret just for you.
 * Type her name anywhere on the page to reveal a message.
 */

(function () {
  'use strict';

  // Keep the shared mobile navigation as a true full-screen drawer on older static pages.
  function initMobileNav() {
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (!hamburger || !navLinks) return;

    const syncNavState = () => {
      const isOpen = navLinks.classList.contains('open');
      document.body.classList.toggle('nav-menu-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    };

    hamburger.addEventListener('click', syncNavState);
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        syncNavState();
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      syncNavState();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }

  const SECRET = 'karly';

  const messages = [
    "I think about you more than you know. 💛",
    "You're my favorite part of every single day.",
    "No matter where I am, part of me is always with you.",
    "I love you more with every passing day.",
    "You make ordinary moments feel extraordinary.",
    "Just wanted you to know — I'm thinking of you right now.",
    "You are the best thing in my life.",
    "I can't wait to see your face at the end of the day.",
    "You make me want to be a better person, every day.",
    "The world is a little brighter because you're in it.",
    "Distance is nothing when someone means everything.",
    "You're always on my mind. Always.",
    "I love you, Karly. More than words can say.",
    "Working hard so I can come home to you.",
    "You are so deeply loved. Don't ever forget that. 💛"
  ];

  // --- Inject styles ---
  const style = document.createElement('style');
  style.textContent = `
    #karly-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 240, 245, 0.92);
      backdrop-filter: blur(12px);
      opacity: 0;
      transition: opacity 0.6s ease;
      pointer-events: none;
      cursor: pointer;
    }
    #karly-overlay.visible {
      opacity: 1;
      pointer-events: all;
    }
    #karly-card {
      text-align: center;
      padding: 48px 40px;
      max-width: 420px;
      position: relative;
      z-index: 2;
    }
    #karly-heart {
      font-size: 52px;
      display: block;
      margin-bottom: 20px;
      animation: karly-pulse 1.4s ease-in-out infinite;
    }
    #karly-message {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: clamp(1.25rem, 3vw, 1.65rem);
      line-height: 1.5;
      color: #7a2c3e;
      margin: 0 0 24px;
      font-style: italic;
    }
    #karly-dismiss {
      font-family: system-ui, sans-serif;
      font-size: 12px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #b06070;
      opacity: 0.7;
    }
    .karly-petal {
      position: fixed;
      font-size: 20px;
      animation: karly-float linear forwards;
      pointer-events: none;
      z-index: 99998;
      user-select: none;
    }
    @keyframes karly-float {
      0%   { transform: translateY(100vh) rotate(0deg);   opacity: 1; }
      100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
    }
    @keyframes karly-pulse {
      0%, 100% { transform: scale(1);    }
      50%       { transform: scale(1.18); }
    }
  `;
  document.head.appendChild(style);

  // --- Build overlay DOM ---
  const overlay = document.createElement('div');
  overlay.id = 'karly-overlay';
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('role', 'dialog');

  const card = document.createElement('div');
  card.id = 'karly-card';

  const heart = document.createElement('span');
  heart.id = 'karly-heart';
  heart.textContent = '💛';

  const msgEl = document.createElement('p');
  msgEl.id = 'karly-message';

  const dismiss = document.createElement('p');
  dismiss.id = 'karly-dismiss';
  dismiss.textContent = 'tap anywhere to close';

  card.appendChild(heart);
  card.appendChild(msgEl);
  card.appendChild(dismiss);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // --- Floating petals ---
  const PETALS = ['🌸', '💛', '✨', '🌷', '💕', '🍀'];
  let petalCleanup = [];

  function launchPetals() {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 2.5;
      const duration = 3.5 + Math.random() * 3;
      const leftPct = Math.random() * 100;
      const icon = PETALS[Math.floor(Math.random() * PETALS.length)];

      const petal = document.createElement('span');
      petal.className = 'karly-petal';
      petal.textContent = icon;
      petal.style.cssText = `left:${leftPct}%;bottom:-30px;animation-delay:${delay}s;animation-duration:${duration}s;`;
      document.body.appendChild(petal);

      const id = setTimeout(() => petal.remove(), (delay + duration + 0.2) * 1000);
      petalCleanup.push({ el: petal, id });
    }
  }

  function clearPetals() {
    petalCleanup.forEach(({ el, id }) => {
      clearTimeout(id);
      el.remove();
    });
    petalCleanup = [];
  }

  // --- Show / hide logic ---
  let autoDismissTimer = null;
  let shown = false;

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function showOverlay() {
    if (shown) return;
    shown = true;

    msgEl.textContent = pickRandom(messages);
    overlay.classList.add('visible');
    launchPetals();

    // Auto-dismiss after 9 seconds
    autoDismissTimer = setTimeout(hideOverlay, 9000);
  }

  function hideOverlay() {
    if (!shown) return;
    shown = false;

    overlay.classList.remove('visible');
    clearPetals();

    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
    }
  }

  overlay.addEventListener('click', hideOverlay);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shown) hideOverlay();
  });

  // --- Keystroke detection ---
  let buffer = '';
  const maxBuffer = SECRET.length;

  document.addEventListener('keydown', function (e) {
    // Ignore modifier keys and special keys
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;

    // Don't trigger if user is typing in a real input
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    buffer = (buffer + e.key).slice(-maxBuffer).toLowerCase();

    if (buffer === SECRET) {
      buffer = '';
      showOverlay();
    }
  });

})();
