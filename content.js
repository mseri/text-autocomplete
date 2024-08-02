let currentSuggestion = "";
let isBlacklisted = false;

chrome.runtime.sendMessage(
  {
    action: "checkBlacklist",
    url: window.location.href,
  },
  (response) => {
    isBlacklisted = response.isBlacklisted;
  },
);

function isSensitiveField(element) {
  const sensitiveTypes = ["password", "credit-card", "tel"];
  const sensitiveNames = [
    "password",
    "passwd",
    "cc",
    "creditcard",
    "credit-card",
    "cardnumber",
    "ccnumber",
    "username",
    "user",
  ];

  // Check input type
  if (sensitiveTypes.includes(element.type)) {
    return true;
  }

  // Check for sensitive names or IDs
  const lowercaseName = (element.name || "").toLowerCase();
  const lowercaseId = (element.id || "").toLowerCase();
  if (
    sensitiveNames.some(
      (name) => lowercaseName.includes(name) || lowercaseId.includes(name),
    )
  ) {
    return true;
  }

  // Check for autocomplete attribute
  const autocomplete = (
    element.getAttribute("autocomplete") || ""
  ).toLowerCase();
  if (
    autocomplete === "cc-number" ||
    autocomplete === "cc-csc" ||
    autocomplete === "cc-exp" ||
    autocomplete === "cc-exp-month" ||
    autocomplete === "cc-exp-year" ||
    autocomplete.includes("credit-card") ||
    autocomplete === "username" ||
    autocomplete === "current-password" ||
    autocomplete === "new-password"
  ) {
    return true;
  }

  return false;
}

document.addEventListener("input", (e) => {
  if (
    isBlacklisted ||
    !e.target ||
    !(e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
  ) {
    return;
  }

  const inputElement = e.target;

  // Check if the field is sensitive
  if (isSensitiveField(inputElement)) {
    removeSuggestionElement();
    return;
  }

  const cursorPosition = inputElement.selectionStart;
  const inputValue = inputElement.value;

  if (inputValue.length % 10 == 0 && inputValue.length > 0) {
    chrome.runtime.sendMessage(
      {
        action: "getAutocomplete",
        text: inputValue.substring(0, cursorPosition),
      },
      (response) => {
        if (response.suggestion) {
          currentSuggestion = response.suggestion;
          showSuggestion(inputElement, cursorPosition, currentSuggestion);
        }
      },
    );
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && currentSuggestion) {
    e.preventDefault();
    const inputElement = e.target;
    const cursorPosition = inputElement.selectionStart;
    inputElement.value =
      inputElement.value.substring(0, cursorPosition) +
      currentSuggestion +
      inputElement.value.substring(cursorPosition);
    inputElement.setSelectionRange(
      cursorPosition + currentSuggestion.length,
      cursorPosition + currentSuggestion.length,
    );
    currentSuggestion = "";
    removeSuggestionElement();
  }
});

function showSuggestion(inputElement, cursorPosition, suggestion) {
  removeSuggestionElement();

  const suggestionElement = document.createElement("div");
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
  const dummyElement = document.createElement("span");
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

  suggestionElement.id = "autocomplete-suggestion";
  document.body.appendChild(suggestionElement);
}

function removeSuggestionElement() {
  const existingSuggestion = document.getElementById("autocomplete-suggestion");
  if (existingSuggestion) {
    existingSuggestion.remove();
  }
}

// Clean up suggestion when input loses focus
document.addEventListener(
  "blur",
  (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      removeSuggestionElement();
      currentSuggestion = "";
    }
  },
  true,
);
