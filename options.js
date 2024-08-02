function saveOptions() {
  const apiUrl = document.getElementById("apiUrl").value;
  const authKey = document.getElementById("authKey").value;
  const model = document.getElementById("model").value;
  const blacklist = document
    .getElementById("blacklist")
    .value.split("\n")
    .filter((url) => url.trim() !== "");

  chrome.storage.sync.set(
    {
      apiUrl: apiUrl,
      authKey: authKey,
      model: model,
      blacklist: blacklist,
    },
    function () {
      if (chrome.runtime.lastError) {
        console.error("Error saving options:", chrome.runtime.lastError);
        return;
      }
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(function () {
        status.textContent = "";
      }, 750);
    },
  );
}

function restoreOptions() {
  chrome.storage.sync.get(
    {
      apiUrl: "https://localhost:11434/v1/completions",
      authKey: "",
      model: "phi3",
      blacklist: [],
    },
    function (items) {
      if (chrome.runtime.lastError) {
        console.error("Error restoring options:", chrome.runtime.lastError);
        return;
      }

      console.log("Restored options:", items);

      document.getElementById("apiUrl").value = items.apiUrl || "";
      document.getElementById("authKey").value = items.authKey || "";
      document.getElementById("model").value = items.model || "";
      document.getElementById("blacklist").value = (items.blacklist || []).join(
        "\n",
      );
    },
  );
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);

function resetOptions() {
  chrome.storage.sync.clear(function () {
    if (chrome.runtime.lastError) {
      console.error("Error clearing storage:", chrome.runtime.lastError);
    } else {
      console.log("Storage cleared");
      restoreOptions();
    }
  });
}

// Add this to your options.html and wire it up in options.js
document.getElementById("reset").addEventListener("click", resetOptions);
