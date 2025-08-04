function broadcastOptionsUpdate(theme, popup) {
  chrome.tabs.query({ url: "https://teamdynamix.umich.edu/*" }, function(tabs) {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'settings-update', theme, popup });
      }
    }
  });
}

function updatePrefTheme() {
  const theme = document.getElementById('theme').value;
  chrome.storage.sync.set({ prefTheme: theme }, () => {
    chrome.storage.sync.get({ prefPopup: false }, (items) => {
      broadcastOptionsUpdate(theme, items.prefPopup);
    });
  });
}

function updatePrefPopup() {
  const popup = document.getElementById('popup').checked;
  chrome.storage.sync.set({ prefPopup: popup }, () => {
    chrome.storage.sync.get({ prefTheme: 'default' }, (items) => {
      broadcastOptionsUpdate(items.prefTheme, popup);
    });
  });
}

function restoreOptions() {
  chrome.storage.sync.get(
    { prefTheme: 'default', prefPopup: false },
    (items) => {
      document.getElementById('theme').value = items.prefTheme;
      document.getElementById('popup').checked = items.prefPopup;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('theme').addEventListener('change', updatePrefTheme);
document.getElementById('popup').addEventListener('change', updatePrefPopup);