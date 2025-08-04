// Utility: inject or remove CSS by id and file
function injectCss(id, file) {
  // Remove existing style if present
  const old = document.getElementById(id);
  if (old) old.remove();
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.id = id;
  link.href = chrome.runtime.getURL(file);
  document.head.appendChild(link);
}
function removeCss(id) {
  const old = document.getElementById(id);
  if (old) old.remove();
}

// Listen for option messages from the options page
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'settings-update') {
    applySettings(msg);
  }
});

// Listen for changes at load
chrome.storage.sync.get(
  { prefTheme: 'default', prefPopup: false },
  applySettings
);

let popupListenerActive = false;
function applySettings(settings) {
  // THEME LOGIC
  removeCss('tdx-um-override-css');
  removeCss('tdx-greyscale-override-css');
  if (settings.prefTheme === 'um' || settings.theme === 'um') {
    injectCss('tdx-um-override-css', 'overrides.css');
  } else if (settings.prefTheme === 'greyscale' || settings.theme === 'greyscale') {
    injectCss('tdx-greyscale-override-css', 'greyscale.css');
  }

  // POPUP LOGIC
  // Remove/add click-listener as needed
  if (settings.prefPopup === true || settings.popup === true) {
    if (!popupListenerActive) {
      document.addEventListener('click', popupClickIntercept, true);
      popupListenerActive = true;
    }
  } else if (popupListenerActive) {
    document.removeEventListener('click', popupClickIntercept, true);
    popupListenerActive = false;
  }
}
// Handler must be defined separately for add/remove
function popupClickIntercept(e) {
  const a = e.target.closest('a[onclick^="return openWinHref"]');
  if (!a) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  window.open(a.href, "_blank", "width=800,height=800");
}