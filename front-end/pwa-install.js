// FlavorVault - shared "Install App" button + service worker registration.
// Include this on every page: <script src="pwa-install.js"></script>
(function () {
  // ---- Service worker registration (safe no-op if unsupported / on file://) ----
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        // Silent - app still works fully without offline caching.
      });
    });
  }

  // ---- Install button ----
  let deferredPrompt = null;
  let btn = null;

  function createButton() {
    if (btn) return btn;
    btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.type = 'button';
    btn.innerHTML = '<i class="fas fa-download" style="margin-right:6px;"></i>Install App';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '2000',
      background: '#f97316',
      color: '#fff',
      border: 'none',
      borderRadius: '999px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'inherit',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      cursor: 'pointer',
      display: 'none',
      alignItems: 'center',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
    });
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-2px)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'translateY(0)'; });
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      btn.disabled = true;
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } finally {
        deferredPrompt = null;
        hideButton();
        btn.disabled = false;
      }
    });
    document.body.appendChild(btn);
    return btn;
  }

  function showButton() {
    createButton();
    btn.style.display = 'flex';
  }

  function hideButton() {
    if (btn) btn.style.display = 'none';
  }

  // Fired by the browser when the current page qualifies as installable
  // (valid manifest + service worker + served over https/localhost).
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideButton();
  });

  // If it's already installed/running standalone, never show the button.
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }
  if (isStandalone()) hideButton();
})();
