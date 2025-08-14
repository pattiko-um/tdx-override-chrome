(() => {
  const POPUP_FEATURES = 'width=800,height=800';

  function openTicketPopup(id, searchBarElem) {
    // Default values
    let appId = '46';
    let type = 'Tickets';
    let param = 'TicketID';

    if (searchBarElem) {
      // Try to get appId and type from search-arguments
      const args = searchBarElem.getAttribute('search-arguments');
      if (args) {
        const [maybeAppId, maybeType] = args.split(',');
        if (maybeAppId) appId = maybeAppId.trim();
        if (maybeType && maybeType.toLowerCase().includes('asset')) {
          type = 'Assets';
          param = 'AssetID';
        }
      }
      // Fallback: check id attribute for asset/ticket context
      const idAttr = searchBarElem.getAttribute('id') || '';
      if (idAttr.toLowerCase().includes('asset')) {
        type = 'Assets';
        param = 'AssetID';
      }
    }

    // Build URL based on type
    let url;
    if (type === 'Assets') {
      url = `https://teamdynamix.umich.edu/TDNext/Apps/${appId}/Assets/AssetDet?AssetID=${encodeURIComponent(String(id).trim())}`;
    } else {
      url = `https://teamdynamix.umich.edu/TDNext/Apps/${appId}/Tickets/TicketDet.aspx?TicketID=${encodeURIComponent(String(id).trim())}`;
    }
    window.open(url, '_blank', POPUP_FEATURES);
  }

  function isTicketId(x) {
    return /^\d+$/.test(String(x).trim());
  }

  // Given an original function, return a wrapped one
  function makeSearchWrapper(original) {
    return function(searchTerm, ...rest) {
      // Find the active tdx-search-bar element (assumes only one is focused)
      const searchBars = document.querySelectorAll('tdx-search-bar');
      let activeElem = null;
      searchBars.forEach(elem => {
        if (elem.matches(':focus-within') || document.activeElement === elem) {
          activeElem = elem;
        }
      });
      // Fallback: use first if none focused
      if (!activeElem && searchBars.length === 1) activeElem = searchBars[0];

      if (isTicketId(searchTerm)) {
        openTicketPopup(searchTerm, activeElem);
        return; // prevent slide-out
      }
      return original.apply(this, [searchTerm, ...rest]);
    };
  }

  // Intercept assignment to obj[prop] so we can wrap it as soon as the app defines it
  function interceptMethod(obj, prop, makeWrapper) {
    let current = obj[prop]; // might be undefined now

    Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: true,
      get() { return current; },
      set(v) {
        // Only wrap callable values
        current = (typeof v === 'function') ? makeWrapper(v) : v;
        console.debug(`[tdx-ext] wrapped ${prop}`);
      }
    });

    // If it already existed at the time of interception, trigger the setter once
    if (typeof current === 'function') {
      const tmp = current;
      current = undefined;
      obj[prop] = tmp;
    }
  }

  function hookWhenReady() {
    // If WorkMgmt exists, great — otherwise intercept its creation
    if (window.WorkMgmt) {
      ensureActionMenuHook(window.WorkMgmt);
    } else {
      let _WorkMgmt = undefined;
      Object.defineProperty(window, 'WorkMgmt', {
        configurable: true,
        enumerable: true,
        get() { return _WorkMgmt; },
        set(v) {
          _WorkMgmt = v;
          try { ensureActionMenuHook(v); } catch (_) {}
        }
      });
    }
  }

  function ensureActionMenuHook(WorkMgmt) {
    if (!WorkMgmt) return;
    if (WorkMgmt.ActionMenu) {
      interceptMethod(WorkMgmt.ActionMenu, 'ApplicationSearch', makeSearchWrapper);
    } else {
      let _AM = undefined;
      Object.defineProperty(WorkMgmt, 'ActionMenu', {
        configurable: true,
        enumerable: true,
        get() { return _AM; },
        set(v) {
          _AM = v;
          if (v) interceptMethod(v, 'ApplicationSearch', makeSearchWrapper);
        }
      });
    }
  }

  hookWhenReady();
  console.debug('[tdx-ext] page hook installed (waiting for ApplicationSearch)');
})();
