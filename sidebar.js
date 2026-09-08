(() => {
  'use strict';

  const currentFile = () => (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem('wmsSession') || sessionStorage.getItem('wmsSession') || 'null');
    } catch {
      return null;
    }
  };

  const initials = (name) => {
    return String(name || 'WM').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'WM';
  };

  const updateSessionUI = (root) => {
    const session = getSession();
    const name = session?.NAME || session?.USER || 'Usuário WMS';
    const level = session?.LEVEL ? `LEVEL ${session.LEVEL}` : 'Operacional';
    const userEl = root.querySelector('[data-wv-user]');
    if (userEl) userEl.textContent = name;
    const levelEl = root.querySelector('[data-wv-level]');
    if (levelEl) levelEl.textContent = level;
    const avatar = root.querySelector('[data-wv-avatar]');
    if (avatar) avatar.textContent = initials(name);
  };

  const setActiveRoute = (root) => {
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
    if (file === 'index.html' && !hash) {
      const homeLink = root.querySelector('[data-route="index.html"]');
      if (homeLink) homeLink.classList.add('active');
    }
    return active;
  };

  const closeMobileMenu = () => {
    document.body.classList.remove('body-wv-sidebar-open');
    const toggle = document.querySelector('[data-wv-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  };

  const toggleCollapsed = (button) => {
    const collapsed = document.body.classList.toggle('wv-sidebar-collapsed');
    if (button) {
      button.setAttribute('aria-pressed', String(collapsed));
      button.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Recolher menu');
    }
    localStorage.setItem('wvSidebarCollapsed', collapsed ? '1' : '0');
  };

  const bindSidebar = (root) => {
    setActiveRoute(root);
    updateSessionUI(root);

    if (localStorage.getItem('wvSidebarCollapsed') === '1' && window.matchMedia('(min-width: 721px)').matches) {
      document.body.classList.add('wv-sidebar-collapsed');
      const collapseBtn = root.querySelector('[data-wv-collapse]');
      if (collapseBtn) collapseBtn.setAttribute('aria-pressed', 'true');
    }

    const toggleBtn = root.querySelector('[data-wv-toggle]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const open = document.body.classList.toggle('body-wv-sidebar-open');
        toggleBtn.setAttribute('aria-expanded', String(open));
      });
    }

    const closeBtn = root.querySelector('[data-wv-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);

    const collapseBtn = root.querySelector('[data-wv-collapse]');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => toggleCollapsed(e.currentTarget));
    }

    root.querySelectorAll('a[href]').forEach(link => {
      link.addEventListener('click', () => {
        setActiveRoute(root);
        if (window.matchMedia('(max-width: 720px)').matches) closeMobileMenu();
      });
    });

    const logoutBtn = root.querySelector('[data-wv-logout]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('wmsSession');
        sessionStorage.removeItem('wmsSession');
        if (typeof window.logoutWms === 'function') {
          window.logoutWms();
        } else {
          location.href = 'index.html';
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileMenu();
      if (event.altKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        if (window.matchMedia('(max-width: 720px)').matches) {
          if (toggleBtn) toggleBtn.click();
        } else {
          if (collapseBtn) collapseBtn.click();
        }
      }
    });
  };

  const loadSidebar = async () => {
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
      container.innerHTML = `<div class="wv-sidebar-error" role="alert">Não foi possível carregar a navegação. Verifique se o projeto está sendo servido por HTTP.</div>`;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar, { once: true });
  } else {
    loadSidebar();
  }
})();
