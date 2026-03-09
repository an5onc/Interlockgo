/**
 * FAQ Search and Filter Enhancement
 * Provides instant search/filtering of FAQ questions for better UX
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFAQSearch);
  } else {
    initFAQSearch();
  }

  function initFAQSearch() {
    const faqSection = document.querySelector('.faq');
    if (!faqSection) return;

    // Create search UI
    const searchContainer = document.createElement('div');
    searchContainer.className = 'faq-search';
    searchContainer.innerHTML = `
      <div class="faq-search__wrapper">
        <svg class="faq-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          class="faq-search__input"
          placeholder="Search FAQs... (e.g., 'cost', 'fail test', 'calibration')"
          aria-label="Search frequently asked questions"
        >
        <button class="faq-search__clear" aria-label="Clear search" style="display: none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="faq-search__stats" aria-live="polite"></div>
    `;

    // Insert search bar after the section title
    const sectionTitle = faqSection.querySelector('.section-title');
    if (sectionTitle) {
      sectionTitle.parentNode.insertBefore(searchContainer, sectionTitle.nextSibling);
    }

    // Get elements
    const searchInput = searchContainer.querySelector('.faq-search__input');
    const clearBtn = searchContainer.querySelector('.faq-search__clear');
    const statsDiv = searchContainer.querySelector('.faq-search__stats');
    const faqItems = Array.from(faqSection.querySelectorAll('.faq__item'));

    // Create no results message
    const noResultsMsg = document.createElement('div');
    noResultsMsg.className = 'faq-no-results';
    noResultsMsg.style.display = 'none';
    noResultsMsg.innerHTML = `
      <p>No questions found matching your search.</p>
      <p>Need help? <a href="tel:970-515-5740">Call us at 970-515-5740</a> or <a href="../contactus/">send us a message</a>.</p>
    `;

    const faqList = faqSection.querySelector('.faq__list');
    if (faqList) {
      faqList.appendChild(noResultsMsg);
    }

    // Search function
    function performSearch() {
      const searchTerm = searchInput.value.toLowerCase().trim();

      if (!searchTerm) {
        // Reset to show all
        faqItems.forEach(item => {
          item.style.display = '';
          item.classList.remove('faq__item--highlight');
        });
        noResultsMsg.style.display = 'none';
        statsDiv.textContent = '';
        clearBtn.style.display = 'none';
        return;
      }

      clearBtn.style.display = 'block';

      let visibleCount = 0;
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 2);

      faqItems.forEach(item => {
        const question = item.querySelector('.faq__question').textContent.toLowerCase();
        const answer = item.querySelector('.faq__answer').textContent.toLowerCase();
        const fullText = question + ' ' + answer;

        // Check if any search word matches
        const matches = searchWords.length === 0 ||
                       searchWords.some(word => fullText.includes(word));

        if (matches) {
          item.style.display = '';
          item.classList.add('faq__item--highlight');
          visibleCount++;

          // Auto-expand matching items for better UX
          if (searchWords.length > 0) {
            item.setAttribute('open', '');
          }
        } else {
          item.style.display = 'none';
          item.classList.remove('faq__item--highlight');
        }
      });

      // Update stats
      if (visibleCount === 0) {
        noResultsMsg.style.display = 'block';
        statsDiv.textContent = 'No results found';
      } else {
        noResultsMsg.style.display = 'none';
        statsDiv.textContent = `Showing ${visibleCount} of ${faqItems.length} questions`;
      }
    }

    // Clear search
    function clearSearch() {
      searchInput.value = '';
      performSearch();
      searchInput.focus();
    }

    // Event listeners
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(performSearch, 300);
    });

    clearBtn.addEventListener('click', clearSearch);

    // Keyboard shortcuts
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSearch();
      }
    });

    // Add keyboard shortcut hint
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }
})();