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
			initializeJsOverrides();
      popupListenerActive = true;
    }
  } else if (popupListenerActive) {
    popupListenerActive = false;
  }
}

function initializeJsOverrides() {
  // Check if this is a popup window
  const isPopup = window.opener && !window.opener.closed;

  isPopup ? initializePopup() : initializeDashboard();
};

// Generic check that a given element has loaded
function waitForElement(selector, callback, timeout = 10000) {
  const start = Date.now();
  const check = () => {
    const el = document.querySelector(selector);
    if (el) {
      callback(el);
    } else if (Date.now() - start < timeout) {
      requestAnimationFrame(check);
    } else {
      console.warn("Timeout waiting for element:", selector);
    }
  };
  check();
}

// Override link elements (open in new popup instead of slide-in)
function overrideLinks() {
  document.addEventListener(
    "click",
    function (e) {
      if (!document.contains(e.target)) return;

      const link = e.target.closest('a[onclick^="return openWinHref"]');
      if (!link) return;

      openUrlInPopup(e, link.href);
    },
    true
  );
};

// Open a URL in a new popup window
function openUrlInPopup(e, url) {
  const popupWidth = 800;
  const popupHeight = 800;

  // Prevent default link behavior
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  window.open(url, "_blank", `width=${popupWidth},height=${popupHeight}`);
};

function initializeDashboard() {
  // Override ticket links when .tdx-dashboard element is available
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      waitForElement('.tdx-dashboard', overrideLinks);
    });
  } else {
    waitForElement('.tdx-dashboard', overrideLinks);
  }
};

function initializePopup() {
  // Override Update button when #divUpdateFromActions element is available
  overrideUpdateButton();
  overrideLinks();
};

function overrideUpdateButton() {
  const el = document.querySelector('#divUpdateFromActions');
  if (!el) return;

  const onclickCode = el.getAttribute("onclick");
  if (!onclickCode) return;

  // Extract the URL from the onclick code
  const match = onclickCode.match(/openWin\('([^']+)'/);
  if (!match) return;

  const url = match[1];

  // Remove original onclick from the <li>
  el.removeAttribute("onclick");

  // Also make the <a> completely inert
  const link = el.querySelector('a');
  if (link) {
    link.setAttribute("href", "#");
    link.addEventListener("click", (e) => {
      openUrlInPopup(e, url);
      return false;
    });
  }
};