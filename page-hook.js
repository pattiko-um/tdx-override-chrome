(() => {
  const POPUP_FEATURES = 'width=800,height=800';

  function openTicketPopup(id) {
    const url = `/TDNext/Apps/46/Tickets/TicketDet.aspx?TicketID=${encodeURIComponent(String(id).trim())}`;
    window.open(url, '_blank', POPUP_FEATURES);
  }

  function isTicketId(x) {
    return /^\d+$/.test(String(x).trim());
  }

  // Given an original function, return a wrapped one
  function makeSearchWrapper(original) {
    return function(searchTerm, ...rest) {
      if (isTicketId(searchTerm)) {
        openTicketPopup(searchTerm);
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
