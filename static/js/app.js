/**
 * PayPilot AI - Core Global Application Script
 * Theme toggle, LocalStorage syncing, responsive navigation, toast notifications
 */

// Global State & Storage Helpers
const PayPilot = {
  theme: localStorage.getItem('paypilot_theme') || 'light',
  
  init() {
    this.applyTheme(this.theme);
    this.setupThemeToggle();
    this.setupMobileMenu();
    this.setupActiveNav();
    this.setupGlobalSearch();
    this.loadUserSession();
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('paypilot_theme', theme);
    this.theme = theme;
    
    // Update theme toggle icons
    const icons = document.querySelectorAll('.theme-toggle-btn i');
    icons.forEach(icon => {
      if (theme === 'dark') {
        icon.className = 'fa-solid fa-sun';
      } else {
        icon.className = 'fa-solid fa-moon';
      }
    });
  },

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    PayPilot.showToast(`Switched to ${nextTheme} mode`, 'info');
  },

  setupThemeToggle() {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => this.toggleTheme());
    });
  },

  setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open');
        }
      });
    }
  },

  setupActiveNav() {
    const path = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (path === href || (href !== '/' && path.startsWith(href)))) {
        link.classList.add('active');
      } else if (path === '/' && href === '/dashboard') {
        link.classList.add('active');
      }
    });
  },

  setupGlobalSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value.trim();
          if (query) {
            // If on invoices page or transactions page, forward filter
            if (window.location.pathname.includes('invoices')) {
              if (window.loadInvoices) window.loadInvoices(null, query);
            } else if (window.location.pathname.includes('transactions')) {
              if (window.loadTransactions) window.loadTransactions(null, query);
            } else {
              window.location.href = `/invoices?search=${encodeURIComponent(query)}`;
            }
          }
        }
      });
    }
  },

  async loadUserSession() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data && data.user) {
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        const avatarEl = document.querySelector('.user-avatar');
        if (nameEl) nameEl.textContent = data.user.name;
        if (roleEl) roleEl.textContent = data.user.company || data.user.role;
        if (avatarEl && data.user.avatar) avatarEl.src = data.user.avatar;
      }
    } catch (err) {
      console.warn('User session check skipped:', err);
    }
  },

  showToast(message, type = 'info', duration = 3500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}" style="font-size: 1.1rem; color: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'}"></i>
      <div style="flex:1;">${message}</div>
      <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  PayPilot.init();
});
