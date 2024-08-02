// background.js
let config = {
  apiUrl: 'http://localhost:11434/api/generate',
  authKey: '',
  blacklist: []
};

chrome.storage.sync.get(['apiUrl', 'authKey', 'blacklist'], function(items) {
  config = { ...config, ...items };
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (let key in changes) {
    config[key] = changes[key].newValue;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAutocomplete") {
    const url = new URL(sender.tab.url);
    if (config.blacklist.some(blacklistedUrl => url.href.includes(blacklistedUrl))) {
      sendResponse({error: "URL is blacklisted"});
      return true;
    }

    fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": config.authKey ? `Bearer ${config.authKey}` : ''
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        prompt: request.text,
        max_tokens: 50
      }),
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({suggestion: data.response});
    })
    .catch(error => {
      console.error("Error:", error);
      sendResponse({error: "Failed to get autocomplete suggestion"});
    });
    return true;
  }
});


/*
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAutocomplete") {
    fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        prompt: request.text,
        max_tokens: 50
      }),
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({suggestion: data.response});
    })
    .catch(error => {
      console.error("Error:", error);
      sendResponse({error: "Failed to get autocomplete suggestion"});
    });
    return true; // Keeps the message channel open for async response
  }
});
*/
