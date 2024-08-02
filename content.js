let currentSuggestion = '';

let isBlacklisted = false;

chrome.runtime.sendMessage({
    action: "checkBlacklist",
    url: window.location.href
  }, response => {
    isBlacklisted = response.isBlacklisted;
});

document.addEventListener('input', (e) => {
  if (isBlacklisted) return;

  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    const inputElement = e.target;
    const cursorPosition = inputElement.selectionStart;
    const inputValue = inputElement.value;

    chrome.runtime.sendMessage({
      action: "getAutocomplete",
      text: inputValue.substring(0, cursorPosition)
    }, response => {
      if (response.suggestion) {
        currentSuggestion = response.suggestion;
        showSuggestion(inputElement, cursorPosition, currentSuggestion);
      }
    });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && currentSuggestion) {
    e.preventDefault();
    const inputElement = e.target;
    const cursorPosition = inputElement.selectionStart;
    inputElement.value = inputElement.value.substring(0, cursorPosition) + 
                         currentSuggestion + 
                         inputElement.value.substring(cursorPosition);
    inputElement.setSelectionRange(cursorPosition + currentSuggestion.length, cursorPosition + currentSuggestion.length);
    currentSuggestion = '';
    removeSuggestionElement();
  }
});

function showSuggestion(inputElement, cursorPosition, suggestion) {
  removeSuggestionElement();

  const suggestionElement = document.createElement('div');
  suggestionElement.textContent = suggestion;
  suggestionElement.style.cssText = `
    position: absolute;
    color: #999;
    pointer-events: none;
    white-space: pre;
    overflow: hidden;
  `;

  const inputRect = inputElement.getBoundingClientRect();
  const inputStyle = window.getComputedStyle(inputElement);
  const lineHeight = parseInt(inputStyle.lineHeight);
  const paddingTop = parseInt(inputStyle.paddingTop);
  const paddingLeft = parseInt(inputStyle.paddingLeft);

  suggestionElement.style.font = inputStyle.font;
  suggestionElement.style.top = `${inputRect.top + window.scrollY + paddingTop}px`;
  suggestionElement.style.left = `${inputRect.left + window.scrollX + paddingLeft}px`;
  suggestionElement.style.width = `${inputRect.width - paddingLeft}px`;
  suggestionElement.style.height = `${lineHeight}px`;

  const textBeforeCursor = inputElement.value.substring(0, cursorPosition);
  const dummyElement = document.createElement('span');
  dummyElement.textContent = textBeforeCursor;
  dummyElement.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre;
    font: ${inputStyle.font};
  `;
  document.body.appendChild(dummyElement);
  
  const textWidth = dummyElement.getBoundingClientRect().width;
  document.body.removeChild(dummyElement);

  suggestionElement.style.paddingLeft = `${textWidth}px`;
  
  suggestionElement.id = 'autocomplete-suggestion';
  document.body.appendChild(suggestionElement);
}

function removeSuggestionElement() {
  const existingSuggestion = document.getElementById('autocomplete-suggestion');
  if (existingSuggestion) {
    existingSuggestion.remove();
  }
}

// Clean up suggestion when input loses focus
document.addEventListener('blur', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    removeSuggestionElement();
    currentSuggestion = '';
  }
}, true);
