function broadcastOptionsUpdate(theme, popup, bgColor) {
  chrome.tabs.query({ url: "https://teamdynamix.umich.edu/*" }, function(tabs) {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'settings-update', theme, popup, bgColor
        });
      }
    }
  });
}

function updatePrefTheme() {
  const theme = document.getElementById('theme').value;
  toggleCustomColors();

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
    { prefTheme: 'default', prefPopup: false, customBgColor: '#232323' },
    (items) => {
      document.getElementById('theme').value = items.prefTheme;
      document.getElementById('popup').checked = items.prefPopup;
      document.getElementById('bgColor').value = items.customBgColor;
    }
  );

  toggleCustomColors();
}

function updateBgColor() {
  const bgColor = document.getElementById('bgColor').value;
  chrome.storage.sync.set({ customBgColor: bgColor }, () => {
    chrome.storage.sync.get({ prefTheme: 'default', prefPopup: false }, (items) => {
      broadcastOptionsUpdate(items.prefTheme, items.prefPopup, bgColor);
    });
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('theme').addEventListener('change', updatePrefTheme);
document.getElementById('popup').addEventListener('change', updatePrefPopup);
document.getElementById('bgColor').addEventListener('change', updateBgColor);

function toggleCustomColors() {
  const theme = document.getElementById('theme').value;
  const colorRows = document.querySelectorAll('.color-row');
  
  colorRows.forEach(row => {
    row.style.display = theme === 'custom' ? 'block' : 'none';
  });
}