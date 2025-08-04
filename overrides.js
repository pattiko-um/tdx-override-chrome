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
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          waitForElement('.tdx-dashboard', init);
        });
      } else {
        waitForElement('.tdx-dashboard', init);
      }
      popupListenerActive = true;
    }
  } else if (popupListenerActive) {
    document.removeEventListener('click', popupClickIntercept, true);
    popupListenerActive = false;
  }
}

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

// Override ticket links (open in new popup instead of slide-in)
function overrideTicketLinks(container) {
  document.addEventListener(
    "click",
    function (e) {
      if (!container.contains(e.target)) return;

      const link = e.target.closest('a[onclick^="return openWinHref"]');
      if (!link) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      window.open(link.href, "_blank", "width=1000,height=800");
    },
    true
  );
}

function overrideUpdateButton() {
  const el = document.querySelector('#divUpdateFromActions');
  if (!el) return;

  const onclickCode = el.getAttribute("onclick");
  if (!onclickCode) return;

  const match = onclickCode.match(/openWin\('([^']+)',\s*(\d+),\s*(\d+),/);
  if (!match) return;

  const [, url, width, height] = match;

  // Remove original onclick from the <li>
  el.removeAttribute("onclick");

  // Also make the <a> completely inert
  const link = el.querySelector('a');
  if (link) {
    link.setAttribute("href", "#");
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.open(url, "_blank", `width=${width},height=${height}`);
      return false;
    });
  }

  // Attach handler to <li> too, just in case
  el.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    window.open(url, "_blank", `width=${width},height=${height}`);
    return false;
  });
}

function waitForUpdateButton() {
  const observer = new MutationObserver(() => overrideUpdateButton());
  observer.observe(document.body, { childList: true, subtree: true });
  overrideUpdateButton();
}

waitForUpdateButton();

// Initialization
function init(container) {
  overrideTicketLinks(container);
  overrideUpdateButton();
}