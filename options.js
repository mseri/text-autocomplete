// options.js
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

function saveOptions() {
  const apiUrl = document.getElementById('apiUrl').value;
  const authKey = document.getElementById('authKey').value;
  const model = document.getElementById('model').value;
  const blacklist = document.getElementById('blacklist').value.split('\n').filter(url => url.trim() !== '');

  chrome.storage.sync.set({
    apiUrl: apiUrl,
    authKey: authKey,
    model: model,
    blacklist: blacklist
  }, function() {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}


function restoreOptions() {
  chrome.storage.sync.get({
    apiUrl: 'https://api.openai.com/v1/completions',
    authKey: '',
    model: 'gpt-3.5-turbo-instruct',
    blacklist: []
  }, function(items) {
    document.getElementById('apiUrl').value = items.apiUrl;
    document.getElementById('authKey').value = items.authKey;
    document.getElementById('model').value = items.model;
    document.getElementById('blacklist').value = items.blacklist.join('\n');
  });
}
