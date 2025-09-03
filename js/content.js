const cssThemeNames = {
  'um': 'tdx-um-override-css',
  'greyscale': 'tdx-greyscale-override-css',
  'dark-greyscale': 'tdx-dark-greyscale-override-css',
  'dark': 'tdx-dark-override-css',
  'custom': 'tdx-custom-override-css'
};

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

// Listen for changes at load - UPDATED to include all custom colors
chrome.storage.sync.get(
  { 
    prefTheme: 'default', 
    prefPopup: false, 
    customBgColor: '#232323',
    customTextColor: '#ffffff',
    customTextColorAlt: '#ffff00',
    customLinkColor: '#ffac66'
  },
  applySettings
);

let popupListenerActive = false;
let pageHookInjected = false; // Track if page-hook.js is injected

function applySettings(settings) {
  //console.log("TDX-Overrides-Log: Attempting to apply theme: " + settings.prefTheme);
  // THEME LOGIC
  // Clear previous CSS Overrides
  // When adding a new theme, add a new line here with the CSS Class to remove

  // Get an array of the object's keys
  const cssKeys = Object.keys(cssThemeNames);

  // Iterate over the keys array to get both key and a numerical index
  cssKeys.forEach((key, index) => {
    const value = cssThemeNames[key];
    removeCss(value);
  });

  cssKeys.forEach((key, index) => {
    const value = cssThemeNames[key];
    // If the current key matches the settings, inject the corresponding CSS
    if (settings.prefTheme === key || settings.theme === key) {
      injectCss(value, `themes/${key}.css`);
      injectCssIntoIframes(`themes/${key}.css`);
    }
  });

  // POPUP LOGIC
  if (settings.prefPopup === true || settings.popup === true) {
    if (!popupListenerActive) {
      initializeJsOverrides();
      popupListenerActive = true;
    }
    // Inject page-hook.js only if not already injected
    if (!pageHookInjected) {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('js/page-hook.js');
      script.onload = () => script.remove();
      (document.documentElement || document.head).appendChild(script);
      pageHookInjected = true;
    }
  } else {
    popupListenerActive = false;
    pageHookInjected = false;
    // Optionally, remove any hooks if needed (not shown here)
  }

  // UPDATED: Apply all custom colors for custom theme
  if (settings.prefTheme === 'custom' || settings.theme === 'custom') {
    const bgColor = settings.bgColor || settings.customBgColor;
    const textColor = settings.textColor || settings.customTextColor;
    const textColorAlt = settings.textColorAlt || settings.customTextColorAlt;
    const linkColor = settings.linkColor || settings.customLinkColor;
    
    console.log("TDX-Overrides-Log: Applying custom colors:", {
      bgColor, textColor, textColorAlt, linkColor
    });
    
    // Remove any existing custom color override
    const existingStyle = document.getElementById('custom-colors-override');
    if (existingStyle) existingStyle.remove();

    // Build CSS with all custom colors
    let customCss = ':root {';
    if (bgColor) customCss += ` --bg-color: ${bgColor} !important;`;
    if (textColor) customCss += ` --text-color: ${textColor} !important;`;
    if (textColorAlt) customCss += ` --text-color-alt: ${textColorAlt} !important;`;
    if (linkColor) customCss += ` --link-color: ${linkColor} !important;`;
    customCss += ' }';

    // Inject new style with all custom colors
    const style = document.createElement('style');
    style.id = 'custom-colors-override';
    style.textContent = customCss;
    document.head.appendChild(style);
  } else {
    // Remove custom color override if not using custom theme
    const existingStyle = document.getElementById('custom-colors-override');
    if (existingStyle) existingStyle.remove();
  }
}

// Essentially a list of elements that have an onclick attribute
// that we want to override to open in a popup window instead of sliding in.
function initializeJsOverrides() {
  const onClickOverrideTargets = [
    { selector: 'a', onclickFunction: 'openWinHref' },
    { selector: 'a', onclickFunction: 'openWorkMgmtModal' },
    { selector: 'li', onclickFunction: 'openWin' },
    { selector: 'li', onclickFunction: 'openWorkMgmtModal' },
    { selector: 'button', onclickFunction: 'openWin' }
  ];

  // Iterate over each target and set up the observer
  // to override the onclick behavior dynamically
  for (const target of onClickOverrideTargets) {
    observeAndOverride(target.selector, target.onclickFunction);
  };
};

// Observe the document for changes and apply overrides dynamically
// for elements that match the given selector and onclick function
function observeAndOverride(selector, onclickFunction) {
  const startObserving = () => {
    const observer = new MutationObserver(() => {
      overrideElementClickBehavior(selector, onclickFunction);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    // Run it once in case elements are already there
    overrideElementClickBehavior(selector, onclickFunction);
  };

  if (document.body) {
    startObserving();
  } else {
    document.addEventListener('DOMContentLoaded', startObserving, { once: true });
  }
}

function overrideElementClickBehavior(selector, onclickFunction) {
  // Find all elements that match the selector and have the onclick function
  const els = document.querySelectorAll(`${selector}[onclick*="${onclickFunction}"]`);

  // Iterate over each element and override the onclick behavior
  els.forEach(el => {
    const url = extractUrlFromEl(el, onclickFunction);
    if (!url) return;

    // Remove original onclick from the <li>
    el.removeAttribute("onclick");

    // Add a new click event listener that opens the URL in a popup
    el.addEventListener("click", (e) => {
      openUrlInPopup(e, url);
    }, true);
  });
};

// Extract the URL from the element based on the onclick function
function extractUrlFromEl(el, onclickFunction) {
    let url;

    // TODO: Make this more generic
    if (onclickFunction == 'openWinHref') {
      url = el.href;
    } else {
      const onclickAttr = el.getAttribute("onclick");
      if (!onclickAttr) return;

      // Generate a regex to extract the URL from the onclick attribute
      const regex = new RegExp(`${onclickFunction}\\('([^']+)'`);
      const match = onclickAttr.match(regex);

      if (!match) return;

      url = match[1];
    }

    return url;
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

function injectCssIntoIframes(cssFile) {
  console.log("TDX-Overrides-Log: Watching for iframes...");

  // Ensure we wait for <body>
  function startObserver() {
    const body = document.body;
    if (!body) {
      return requestAnimationFrame(startObserver);
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'IFRAME') {
            console.log("TDX-Overrides-Log: New iframe found, injecting CSS");
            inject(node, cssFile);
          }
        });
      });
    });

    observer.observe(body, { childList: true, subtree: true });

    // Also handle any iframes already in the DOM
    document.querySelectorAll('iframe').forEach((iframe) => {
      inject(iframe, cssFile);
    });
  }

  startObserver();
}

function inject(iframe, cssFile) {
  function doInject() {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    if (doc.getElementById('tdx-overrides-style')) {
      console.log("TDX-Overrides-Log: Stylesheet already injected in iframe");
      return;
    }

    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.id = 'tdx-overrides-style';
    link.href = chrome.runtime.getURL(cssFile);

    if (doc.head) {
      doc.head.appendChild(link);
      console.log("TDX-Overrides-Log: Stylesheet injected successfully into iframe");
    } else {
      console.warn("TDX-Overrides-Log: Iframe has no <head>, retrying...");
      setTimeout(doInject, 100);
    }
  }

  if (iframe.contentDocument?.readyState === 'complete') {
    doInject();
  } else {
    iframe.addEventListener('load', doInject, { once: true });
  }
}