// background.js
let config = {
  apiUrl: 'https://api.openai.com/v1/completions',
  authKey: '',
  model: 'gpt-3.5-turbo-instruct',
  blacklist: []
};

chrome.storage.sync.get(['apiUrl', 'authKey', 'model', 'blacklist'], function(items) {
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
        "Authorization": `Bearer ${config.authKey}`
      },
      body: JSON.stringify({
        model: config.model,
        prompt: request.text,
        max_tokens: 50,
        n: 1,
        stop: null,
        temperature: 0.7
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.choices && data.choices.length > 0) {
        sendResponse({suggestion: data.choices[0].text.trim()});
      } else {
        sendResponse({error: "No suggestion received"});
      }
    })
    .catch(error => {
      console.error("Error:", error);
      sendResponse({error: "Failed to get autocomplete suggestion"});
    });
    return true;
  } else if (request.action === "checkBlacklist") {
    const isBlacklisted = config.blacklist.some(blacklistedUrl => request.url.includes(blacklistedUrl));
    sendResponse({isBlacklisted: isBlacklisted});
    return true;
  }
});
