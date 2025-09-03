function broadcastOptionsUpdate(theme, popup, bgColor, textColor, textColorAlt, linkColor) {
  chrome.tabs.query({ url: "https://teamdynamix.umich.edu/*" }, function(tabs) {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'settings-update', 
          theme, 
          popup, 
          bgColor, 
          textColor, 
          textColorAlt, 
          linkColor
        });
      }
    }
  });
}

function updatePrefTheme() {
  const theme = document.getElementById('theme').value;
  toggleCustomColors();

  chrome.storage.sync.set({ prefTheme: theme }, () => {
    chrome.storage.sync.get({ 
      prefPopup: false, 
      customBgColor: '#232323',
      customTextColor: '#ffffff',
      customTextColorAlt: '#ffff00',
      customLinkColor: '#ffac66'
    }, (items) => {
      broadcastOptionsUpdate(
        theme, 
        items.prefPopup, 
        items.customBgColor,
        items.customTextColor,
        items.customTextColorAlt,
        items.customLinkColor
      );
    });
  });
}

function updatePrefPopup() {
  const popup = document.getElementById('popup').checked;
  chrome.storage.sync.set({ prefPopup: popup }, () => {
    chrome.storage.sync.get({ 
      prefTheme: 'default',
      customBgColor: '#232323',
      customTextColor: '#ffffff',
      customTextColorAlt: '#ffff00',
      customLinkColor: '#ffac66'
    }, (items) => {
      broadcastOptionsUpdate(
        items.prefTheme, 
        popup, 
        items.customBgColor,
        items.customTextColor,
        items.customTextColorAlt,
        items.customLinkColor
      );
    });
  });
}

function restoreOptions() {
  chrome.storage.sync.get(
    { 
      prefTheme: 'default', 
      prefPopup: false, 
      customBgColor: '#232323',
      customTextColor: '#ffffff',
      customTextColorAlt: '#ffff00',
      customLinkColor: '#ffac66'
    },
    (items) => {
      document.getElementById('theme').value = items.prefTheme;
      document.getElementById('popup').checked = items.prefPopup;
      document.getElementById('bgColor').value = items.customBgColor;
      document.getElementById('textColor').value = items.customTextColor;
      document.getElementById('textColorAlt').value = items.customTextColorAlt;
      document.getElementById('linkColor').value = items.customLinkColor;

      toggleCustomColors();
    }
  );
}

function updateBgColor() {
  const bgColor = document.getElementById('bgColor').value;
  chrome.storage.sync.set({ customBgColor: bgColor }, () => {
    chrome.storage.sync.get({ 
      prefTheme: 'default', 
      prefPopup: false,
      customTextColor: '#ffffff',
      customTextColorAlt: '#ffff00',
      customLinkColor: '#ffac66'
    }, (items) => {
      broadcastOptionsUpdate(
        items.prefTheme, 
        items.prefPopup, 
        bgColor,
        items.customTextColor,
        items.customTextColorAlt,
        items.customLinkColor
      );
    });
  });
}

function updateTextColor() {
  const textColor = document.getElementById('textColor').value;
  chrome.storage.sync.set({ customTextColor: textColor }, () => {
    chrome.storage.sync.get({ 
      prefTheme: 'default', 
      prefPopup: false,
      customBgColor: '#232323',
      customTextColorAlt: '#ffff00',
      customLinkColor: '#ffac66'
    }, (items) => {
      broadcastOptionsUpdate(
        items.prefTheme, 
        items.prefPopup, 
        items.customBgColor,
        textColor,
        items.customTextColorAlt,
        items.customLinkColor
      );
    });
  });
}

function updateTextColorAlt() {
  const textColorAlt = document.getElementById('textColorAlt').value;
  chrome.storage.sync.set({ customTextColorAlt: textColorAlt }, () => {
    chrome.storage.sync.get({ 
      prefTheme: 'default', 
      prefPopup: false,
      customBgColor: '#232323',
      customTextColor: '#ffffff',
      customLinkColor: '#ffac66'
    }, (items) => {
      broadcastOptionsUpdate(
        items.prefTheme, 
        items.prefPopup, 
        items.customBgColor,
        items.customTextColor,
        textColorAlt,
        items.customLinkColor
      );
    });
  });
}

function updateLinkColor() {
  const linkColor = document.getElementById('linkColor').value;
  chrome.storage.sync.set({ customLinkColor: linkColor }, () => {
    chrome.storage.sync.get({ 
      prefTheme: 'default', 
      prefPopup: false,
      customBgColor: '#232323',
      customTextColor: '#ffffff',
      customTextColorAlt: '#ffff00'
    }, (items) => {
      broadcastOptionsUpdate(
        items.prefTheme, 
        items.prefPopup, 
        items.customBgColor,
        items.customTextColor,
        items.customTextColorAlt,
        linkColor
      );
    });
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('theme').addEventListener('change', updatePrefTheme);
document.getElementById('popup').addEventListener('change', updatePrefPopup);
document.getElementById('bgColor').addEventListener('change', updateBgColor);
document.getElementById('textColor').addEventListener('change', updateTextColor);
document.getElementById('textColorAlt').addEventListener('change', updateTextColorAlt);
document.getElementById('linkColor').addEventListener('change', updateLinkColor);

function toggleCustomColors() {
  const theme = document.getElementById('theme').value;
  const colorRows = document.querySelectorAll('.color-row');
  
  colorRows.forEach(row => {
    row.style.display = theme === 'custom' ? 'block' : 'none';
  });
}