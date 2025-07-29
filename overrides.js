// Intercept clicks on specific links and override behavior
document.addEventListener('click', function (e) {
  // Look for the nearest <a> element with the expected onclick attribute
  const a = e.target.closest('a[onclick^="return openWinHref"]');
  if (!a) return;

  // Stop the original handler from running
  e.preventDefault();
  e.stopImmediatePropagation();

  // Open the link in a pop-up window
  const url = a.href;
  console.log("Opening in popup:", url);
  window.open(url, "_blank", "width=800,height=800");
}, true); // 'true' = capture phase, so we run before the original handler