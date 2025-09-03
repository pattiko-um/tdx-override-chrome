// Configuration constants
const STORAGE_KEYS = {
  THEME: 'prefTheme',
  POPUP: 'prefPopup',
  BG_COLOR: 'customBgColor',
  TEXT_COLOR: 'customTextColor',
  TEXT_COLOR_ALT: 'customTextColorAlt',
  LINK_COLOR: 'customLinkColor'
};

const DEFAULT_VALUES = {
  [STORAGE_KEYS.THEME]: 'default',
  [STORAGE_KEYS.POPUP]: false,
  [STORAGE_KEYS.BG_COLOR]: '#232323',
  [STORAGE_KEYS.TEXT_COLOR]: '#ffffff',
  [STORAGE_KEYS.TEXT_COLOR_ALT]: '#ffff00',
  [STORAGE_KEYS.LINK_COLOR]: '#ffac66'
};

const COLOR_INPUTS = [
  { id: 'bgColor', storageKey: STORAGE_KEYS.BG_COLOR },
  { id: 'textColor', storageKey: STORAGE_KEYS.TEXT_COLOR },
  { id: 'textColorAlt', storageKey: STORAGE_KEYS.TEXT_COLOR_ALT },
  { id: 'linkColor', storageKey: STORAGE_KEYS.LINK_COLOR }
];

// Utility functions
function getAllStorageValues(callback) {
  chrome.storage.sync.get(DEFAULT_VALUES, callback);
}

function broadcastSettingsUpdate() {
  getAllStorageValues((items) => {
    chrome.tabs.query({ url: "https://teamdynamix.umich.edu/*" }, function(tabs) {
      const message = {
        type: 'settings-update',
        theme: items[STORAGE_KEYS.THEME],
        popup: items[STORAGE_KEYS.POPUP],
        bgColor: items[STORAGE_KEYS.BG_COLOR],
        textColor: items[STORAGE_KEYS.TEXT_COLOR],
        textColorAlt: items[STORAGE_KEYS.TEXT_COLOR_ALT],
        linkColor: items[STORAGE_KEYS.LINK_COLOR]
      };
      
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message);
        }
      });
    });
  });
}

function updateStorageAndBroadcast(updates) {
  chrome.storage.sync.set(updates, () => {
    broadcastSettingsUpdate();
  });
}

// Event handlers
function updatePrefTheme() {
  const theme = document.getElementById('theme').value;
  toggleCustomColors();
  updateStorageAndBroadcast({ [STORAGE_KEYS.THEME]: theme });
}

function updatePrefPopup() {
  const popup = document.getElementById('popup').checked;
  updateStorageAndBroadcast({ [STORAGE_KEYS.POPUP]: popup });
}

// Generic color update function
function createColorUpdateHandler(storageKey) {
  return function() {
    const elementId = COLOR_INPUTS.find(input => input.storageKey === storageKey).id;
    const color = document.getElementById(elementId).value;
    updateStorageAndBroadcast({ [storageKey]: color });
  };
}

// Create specific color update functions
const updateBgColor = createColorUpdateHandler(STORAGE_KEYS.BG_COLOR);
const updateTextColor = createColorUpdateHandler(STORAGE_KEYS.TEXT_COLOR);
const updateTextColorAlt = createColorUpdateHandler(STORAGE_KEYS.TEXT_COLOR_ALT);
const updateLinkColor = createColorUpdateHandler(STORAGE_KEYS.LINK_COLOR);

function restoreOptions() {
  getAllStorageValues((items) => {
    // Restore basic settings
    document.getElementById('theme').value = items[STORAGE_KEYS.THEME];
    document.getElementById('popup').checked = items[STORAGE_KEYS.POPUP];
    
    // Restore color settings
    COLOR_INPUTS.forEach(({ id, storageKey }) => {
      document.getElementById(id).value = items[storageKey];
    });
    toggleCustomColors();
  });
}

function toggleCustomColors() {
  const theme = document.getElementById('theme').value;
  const colorRows = document.querySelectorAll('.color-row');
  
  colorRows.forEach(row => {
    row.style.display = theme === 'custom' ? 'block' : 'none';
  });
}

// Event listeners setup
function setupEventListeners() {
  // Basic settings
  document.getElementById('theme').addEventListener('change', updatePrefTheme);
  document.getElementById('popup').addEventListener('change', updatePrefPopup);
  
  // Color inputs
  document.getElementById('bgColor').addEventListener('change', updateBgColor);
  document.getElementById('textColor').addEventListener('change', updateTextColor);
  document.getElementById('textColorAlt').addEventListener('change', updateTextColorAlt);
  document.getElementById('linkColor').addEventListener('change', updateLinkColor);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  setupEventListeners();
});