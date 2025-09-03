const cssThemeNames = {
  'um': 'tdx-um-override-css',
  'greyscale': 'tdx-greyscale-override-css',
  'dark-greyscale': 'tdx-dark-greyscale-override-css',
  'dark': 'tdx-dark-override-css',
  'custom': 'tdx-custom-override-css'
};

const DEFAULT_COLORS = {
  customBgColor: '#232323',
  customTextColor: '#ffffff',
  customTextColorAlt: '#ffff00',
  customLinkColor: '#ffac66'
};

// Store current settings globally for injection functions
let currentSettings = {
  theme: 'default',
  customColors: null
};

// CSS Generation Functions
function generateCustomColorsCss(colors) {
  if (!colors || Object.keys(colors).length === 0) return '';
  
  let customCss = ':root {';
  if (colors.bgColor) customCss += ` --bg-color: ${colors.bgColor} !important;`;
  if (colors.textColor) customCss += ` --text-color: ${colors.textColor} !important;`;
  if (colors.textColorAlt) customCss += ` --text-color-alt: ${colors.textColorAlt} !important;`;
  if (colors.linkColor) customCss += ` --link-color: ${colors.linkColor} !important;`;
  customCss += ' }';
  
  return customCss;
}

function getThemeCssFile(theme) {
  return cssThemeNames[theme] ? `themes/${theme}.css` : null;
}

// Generic CSS Injection Functions
function injectCssFile(doc, id, file) {
  if (!file) return;
  
  const old = doc.getElementById(id);
  if (old) old.remove();
  
  const link = doc.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.id = id;
  link.href = chrome.runtime.getURL(file);
  (doc.head || doc.documentElement).appendChild(link);
}

function injectCssText(doc, id, cssText) {
  if (!cssText) return;
  
  const old = doc.getElementById(id);
  if (old) old.remove();
  
  const style = doc.createElement('style');
  style.id = id;
  style.textContent = cssText;
  (doc.head || doc.documentElement).appendChild(style);
}

function removeCss(doc, id) {
  const old = doc.getElementById(id);
  if (old) old.remove();
}

// Main Document CSS Management
function applyThemeToDocument(theme) {
  // Clear all theme CSS
  Object.values(cssThemeNames).forEach(cssId => {
    removeCss(document, cssId);
  });
  
  // Apply selected theme
  if (theme && cssThemeNames[theme]) {
    const cssId = cssThemeNames[theme];
    const cssFile = getThemeCssFile(theme);
    injectCssFile(document, cssId, cssFile);
  }
}

function applyCustomColorsToDocument(colors) {
  const customCss = generateCustomColorsCss(colors);
  
  if (customCss) {
    injectCssText(document, 'custom-colors-override', customCss);
  } else {
    removeCss(document, 'custom-colors-override');
  }
}

// Iframe CSS Management
function applyAllCssToIframe(iframe) {
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  
  // Apply theme CSS
  if (currentSettings.theme && cssThemeNames[currentSettings.theme]) {
    const cssFile = getThemeCssFile(currentSettings.theme);
    injectCssFile(doc, 'tdx-overrides-style', cssFile);
  }
  
  // Apply custom colors CSS
  if (currentSettings.customColors) {
    const customCss = generateCustomColorsCss(currentSettings.customColors);
    injectCssText(doc, 'custom-colors-override', customCss);
  }
  
  console.log("TDX-Overrides-Log: All CSS applied to iframe");
}

function injectCssIntoIframe(iframe) {
  function doInject() {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Check if already injected to avoid duplicates
    if (doc.getElementById('tdx-overrides-applied')) {
      console.log("TDX-Overrides-Log: CSS already applied to iframe");
      return;
    }
    
    // Mark as processed
    const marker = doc.createElement('meta');
    marker.id = 'tdx-overrides-applied';
    marker.name = 'tdx-overrides';
    marker.content = 'applied';
    (doc.head || doc.documentElement).appendChild(marker);
    
    // Apply all CSS
    applyAllCssToIframe(iframe);
  }
  
  if (iframe.contentDocument?.readyState === 'complete') {
    doInject();
  } else {
    iframe.addEventListener('load', doInject, { once: true });
  }
}

// Settings Application Functions
function applyTheme(settings) {
  const activeTheme = settings.prefTheme || settings.theme || 'default';
  currentSettings.theme = activeTheme;
  
  // Apply to main document
  applyThemeToDocument(activeTheme);
  
  // Apply to all existing iframes
  document.querySelectorAll('iframe').forEach(iframe => {
    applyAllCssToIframe(iframe);
  });
}

function applyCustomColors(settings) {
  const isCustomTheme = currentSettings.theme === 'custom';
  
  if (isCustomTheme) {
    const colors = {
      bgColor: settings.bgColor || settings.customBgColor,
      textColor: settings.textColor || settings.customTextColor,
      textColorAlt: settings.textColorAlt || settings.customTextColorAlt,
      linkColor: settings.linkColor || settings.customLinkColor
    };
    
    // Filter out undefined/null values
    const validColors = Object.fromEntries(
      Object.entries(colors).filter(([key, value]) => value)
    );
    
    console.log("TDX-Overrides-Log: Applying custom colors:", validColors);
    currentSettings.customColors = validColors;
    
    // Apply to main document
    applyCustomColorsToDocument(validColors);
    
    // Apply to all existing iframes
    document.querySelectorAll('iframe').forEach(iframe => {
      applyAllCssToIframe(iframe);
    });
    
  } else {
    // Remove custom colors
    currentSettings.customColors = null;
    
    // Remove from main document
    removeCss(document, 'custom-colors-override');
    
    // Remove from all iframes
    document.querySelectorAll('iframe').forEach(iframe => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        removeCss(doc, 'custom-colors-override');
      }
    });
  }
}

function applyPopupSettings(settings) {
  const shouldEnablePopups = settings.prefPopup === true || settings.popup === true;
  
  if (shouldEnablePopups) {
    if (!popupListenerActive) {
      initializeJsOverrides();
      popupListenerActive = true;
    }
    
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
  }
}

function applySettings(settings) {
  console.log("TDX-Overrides-Log: Applying settings:", settings);
  
  // Apply in order: theme first, then colors, then popups
  applyTheme(settings);
  applyCustomColors(settings);
  applyPopupSettings(settings);
}

// Enhanced iframe observer that applies all current CSS
function startIframeObserver() {
  function observeIframes() {
    const body = document.body;
    if (!body) {
      return requestAnimationFrame(observeIframes);
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'IFRAME') {
            console.log("TDX-Overrides-Log: New iframe detected, applying all CSS");
            injectCssIntoIframe(node);
          }
        });
      });
    });

    observer.observe(body, { childList: true, subtree: true });

    // Handle existing iframes
    document.querySelectorAll('iframe').forEach(injectCssIntoIframe);
  }

  observeIframes();
}

// Event Listeners and Initialization
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'settings-update') {
    applySettings(msg);
  }
});

chrome.storage.sync.get(
  { 
    prefTheme: 'default', 
    prefPopup: false, 
    ...DEFAULT_COLORS
  },
  (settings) => {
    applySettings(settings);
    startIframeObserver();
  }
);

let popupListenerActive = false;
let pageHookInjected = false;

// Popup/modal override functionality (unchanged)
function initializeJsOverrides() {
  const onClickOverrideTargets = [
    { selector: 'a', onclickFunction: 'openWinHref' },
    { selector: 'a', onclickFunction: 'openWorkMgmtModal' },
    { selector: 'li', onclickFunction: 'openWin' },
    { selector: 'li', onclickFunction: 'openWorkMgmtModal' },
    { selector: 'button', onclickFunction: 'openWin' }
  ];

  onClickOverrideTargets.forEach(target => {
    observeAndOverride(target.selector, target.onclickFunction);
  });
}

function observeAndOverride(selector, onclickFunction) {
  const startObserving = () => {
    const observer = new MutationObserver(() => {
      overrideElementClickBehavior(selector, onclickFunction);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    overrideElementClickBehavior(selector, onclickFunction);
  };

  if (document.body) {
    startObserving();
  } else {
    document.addEventListener('DOMContentLoaded', startObserving, { once: true });
  }
}

function overrideElementClickBehavior(selector, onclickFunction) {
  const els = document.querySelectorAll(`${selector}[onclick*="${onclickFunction}"]`);

  els.forEach(el => {
    const url = extractUrlFromEl(el, onclickFunction);
    if (!url) return;

    el.removeAttribute("onclick");
    el.addEventListener("click", (e) => {
      openUrlInPopup(e, url);
    }, true);
  });
}

function extractUrlFromEl(el, onclickFunction) {
  if (onclickFunction === 'openWinHref') {
    return el.href;
  }
  
  const onclickAttr = el.getAttribute("onclick");
  if (!onclickAttr) return null;

  const regex = new RegExp(`${onclickFunction}\\('([^']+)'`);
  const match = onclickAttr.match(regex);
  return match ? match[1] : null;
}

function openUrlInPopup(e, url) {
  const popupWidth = 800;
  const popupHeight = 800;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  window.open(url, "_blank", `width=${popupWidth},height=${popupHeight}`);
}