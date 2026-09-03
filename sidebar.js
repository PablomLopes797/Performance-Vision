(() => {
  'use strict';

  const currentFile = () => (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const getSession = () => {
    try { return JSON.parse(localStorage.getItem('wmsSession') || sessionStorage.getItem('wmsSession') || 'null'); }
    catch { return null; }
  };

  function initials(name) {
    return String(name || 'WM').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'WM';
  }

  function updateSessionUI(root) {
    const session = getSession();
    const name = session?.NAME || session?.USER || 'Usuário WMS';
    const level = session?.LEVEL ? `LEVEL ${session.LEVEL}` : 'Operacional';
    root.querySelector('[data-wv-user]')?.replaceChildren(document.createTextNode(name));
    root.querySelector('[data-wv-level]')?.replaceChildren(document.createTextNode(level));
    const avatar = root.querySelector('[data-wv-avatar]');
    if (avatar) avatar.textContent = initials(name);
  }

  function setActiveRoute(root) {
    const file = currentFile();
    const hash = location.hash.toLowerCase();
    let active = false;
    root.querySelectorAll('[data-route]').forEach(link => {
      const route = (link.dataset.route || '').toLowerCase();
      const [routeFile, routeHash] = route.split('#');
      const matches = routeFile === file && (routeHash ? hash === `#${routeHash}` : !hash);
      link.classList.toggle('active', matches);
      if (matches) active = true;
    });
    root.querySelectorAll('[data-nav-group]').forEach(group => {
      const hasActive = !!group.querySelector('a.active');
      group.classList.toggle('has-active', hasActive);
      if (hasActive) group.open = true;
    });
    if (file === 'index.html' && !hash) root.querySelector('[data-route="index.html"]')?.classList.add('active');
    return active;
  }

  function closeMobileMenu() {
    document.body.classList.remove('body-wv-sidebar-open');
    document.querySelector('[data-wv-toggle]')?.setAttribute('aria-expanded', 'false');
  }

  function toggleCollapsed(button) {
    const collapsed = document.body.classList.toggle('wv-sidebar-collapsed');
    button?.setAttribute('aria-pressed', String(collapsed));
    button?.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Recolher menu');
    localStorage.setItem('wvSidebarCollapsed', collapsed ? '1' : '0');
  }

  function bindSidebar(root) {
    setActiveRoute(root);
    updateSessionUI(root);

    if (localStorage.getItem('wvSidebarCollapsed') === '1' && window.matchMedia('(min-width: 721px)').matches) {
      document.body.classList.add('wv-sidebar-collapsed');
      root.querySelector('[data-wv-collapse]')?.setAttribute('aria-pressed', 'true');
    }

    root.querySelector('[data-wv-toggle]')?.addEventListener('click', () => {
      const open = document.body.classList.toggle('body-wv-sidebar-open');
      root.querySelector('[data-wv-toggle]')?.setAttribute('aria-expanded', String(open));
    });
    root.querySelector('[data-wv-close]')?.addEventListener('click', closeMobileMenu);
    root.querySelector('[data-wv-collapse]')?.addEventListener('click', event => toggleCollapsed(event.currentTarget));

    root.querySelectorAll('a[href]').forEach(link => {
      link.addEventListener('click', () => {
        setActiveRoute(root);
        if (window.matchMedia('(max-width: 720px)').matches) closeMobileMenu();
      });
    });

    root.querySelector('[data-wv-logout]')?.addEventListener('click', () => {
      localStorage.removeItem('wmsSession');
      sessionStorage.removeItem('wmsSession');
      if (typeof window.logoutWms === 'function') window.logoutWms();
      else location.href = 'index.html';
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMobileMenu();
      if (event.altKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        if (window.matchMedia('(max-width: 720px)').matches) root.querySelector('[data-wv-toggle]')?.click();
        else root.querySelector('[data-wv-collapse]')?.click();
      }
    });
  }

  async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
      const response = await fetch('sidebar.html', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      container.innerHTML = await response.text();
      bindSidebar(container);
      window.dispatchEvent(new CustomEvent('wv:sidebar-ready', { detail: { root: container } }));
    } catch (error) {
      console.error('Não foi possível carregar o sidebar.html:', error);
      container.innerHTML = '<div class="wv-sidebar-error" role="alert">Não foi possível carregar a navegação. Verifique se o projeto está sendo servido por HTTP.</div>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSidebar, { once: true });
  else loadSidebar();
})();
