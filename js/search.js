// Search Suggestions functionality
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById('searchInput');
  const suggestionsContainer = document.getElementById('searchSuggestions');

  if (!searchInput || !suggestionsContainer) return;

  function getLetters() {
    const existing = localStorage.getItem("sentLetters");
    if (!existing) return [];
    try {
      const letters = JSON.parse(existing);
      return Array.isArray(letters) ? letters : [];
    } catch {
      return [];
    }
  }

  function findMatches(query) {
    if (!query || query.length < 1) return [];
    const letters = getLetters();
    const matches = [];
    const lowerQuery = query.toLowerCase();

    for (const letter of letters) {
      // Search in name, message, and signature
      const searchableText = [
        letter.name || '',
        letter.message || '',
        letter.signature || ''
      ].join(' ').toLowerCase();

      if (searchableText.includes(lowerQuery)) {
        // Find the matching phrase/context
        const fields = [
          { text: letter.message || '', label: 'Message' },
          { text: letter.name || '', label: 'To' },
          { text: letter.signature || '', label: 'From' }
        ];

        for (const field of fields) {
          const idx = field.text.toLowerCase().indexOf(lowerQuery);
          if (idx !== -1) {
            // Extract a snippet around the match
            const start = Math.max(0, idx - 15);
            const end = Math.min(field.text.length, idx + query.length + 30);
            let snippet = field.text.substring(start, end);
            if (start > 0) snippet = '...' + snippet;
            if (end < field.text.length) snippet = snippet + '...';
            
            matches.push({
              snippet: snippet,
              field: field.label,
              letterIndex: letters.indexOf(letter),
              query: query
            });
            break; // Only one match per letter
          }
        }
      }

      if (matches.length >= 3) break; // Limit to 3 suggestions
    }

    return matches;
  }

  function highlightMatch(text, query) {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }

  function showSuggestions(matches) {
    if (matches.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    suggestionsContainer.innerHTML = matches.map((match, index) => `
      <div class="suggestion-item" role="option" data-index="${match.letterIndex}" tabindex="0">
        <span class="suggestion-field">${match.field}:</span>
        <span class="suggestion-text">${highlightMatch(match.snippet, match.query)}</span>
      </div>
    `).join('');

    suggestionsContainer.style.display = 'block';

    // Add click handlers
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        window.location.href = `letter_view.html?index=${item.dataset.index}`;
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          window.location.href = `letter_view.html?index=${item.dataset.index}`;
        }
      });
    });
  }

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const matches = findMatches(query);
    showSuggestions(matches);
  });

  searchInput.addEventListener('focus', (e) => {
    const query = e.target.value.trim();
    if (query) {
      const matches = findMatches(query);
      showSuggestions(matches);
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      suggestionsContainer.style.display = 'none';
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[0].focus();
    }
  });

  suggestionsContainer.addEventListener('keydown', (e) => {
    const items = Array.from(suggestionsContainer.querySelectorAll('.suggestion-item'));
    const currentIndex = items.indexOf(document.activeElement);

    if (e.key === 'ArrowDown' && currentIndex < items.length - 1) {
      e.preventDefault();
      items[currentIndex + 1].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex > 0) {
        items[currentIndex - 1].focus();
      } else {
        searchInput.focus();
      }
    } else if (e.key === 'Escape') {
      suggestionsContainer.style.display = 'none';
      searchInput.focus();
    }
  });
});
