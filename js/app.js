// Main Application Entry, Routing, and Global View State Manager
import { initDB, getPostSales } from './db.js';
import { getGoogleConfig } from './googleApi.js';
import { renderDashboard } from './views/dashboardView.js';
import { renderPreSales } from './views/presalesView.js';
import { renderPostSales } from './views/postsalesView.js';
import { renderCalendar } from './views/calendarView.js';
import { renderGoogleSync } from './views/googleSyncView.js';
import { renderCards } from './views/cardsView.js';

let currentActiveView = 'dashboard';

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize local DB
  initDB();

  // 2. Setup theme settings
  initTheme();

  // 3. Setup header clock
  startHeaderClock();

  // 4. Update Google sync status card on sidebar
  updateGoogleConnectionBadge();

  // 5. Update active post-sales indicators
  updatePostSalesSidebarCount();

  // 6. Router navigation listeners
  setupNavigation();

  // 7. Connect modal overlay dismiss listeners
  setupModalDismiss();

  // 8. Bind global header sync button
  document.getElementById('sidebar-sync-btn').addEventListener('click', () => {
    navigateToView('google-sync');
    setTimeout(() => {
      const syncTriggerBtn = document.getElementById('btn-trigger-sync');
      if (syncTriggerBtn) syncTriggerBtn.click();
    }, 150);
  });

  // Render initial dashboard view
  navigateToView('dashboard');
});

// ==========================================
// VIEWS ROUTER
// ==========================================
export function navigateToView(viewName) {
  currentActiveView = viewName;
  
  // Highlight active sidebar navigation tab
  document.querySelectorAll('.menu-item').forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update header title
  const viewTitles = {
    'dashboard': '儀表總覽',
    'presales': '售前開發專案進度',
    'postsales': '售後收款結案追蹤',
    'calendar': '全局日曆足跡與歷史搜尋',
    'cards': '客戶資料管理',
    'google-sync': 'Google 雲端整合中心'
  };
  
  const titleEl = document.getElementById('view-title');
  if (titleEl) titleEl.textContent = viewTitles[viewName] || '業務管理系統';

  // Render view template
  switch (viewName) {
    case 'dashboard':
      renderDashboard('app-view', navigateToView);
      break;
    case 'presales':
      renderPreSales('app-view', navigateToView);
      break;
    case 'postsales':
      renderPostSales('app-view', navigateToView);
      break;
    case 'calendar':
      renderCalendar('app-view', navigateToView);
      break;
    case 'cards':
      renderCards('app-view', navigateToView);
      break;
    case 'google-sync':
      renderGoogleSync('app-view', navigateToView);
      break;
    default:
      console.error(`View ${viewName} not recognized.`);
  }

  // Auto update sidebar indicators dynamically on route switch
  updatePostSalesSidebarCount();
}

function setupNavigation() {
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      if (view) navigateToView(view);
    });
  });
}

// ==========================================
// THEME SWITCHER
// ==========================================
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('bizflow_theme') || 'dark';

  if (savedTheme === 'light') {
    document.body.className = 'light-theme';
    updateThemeIcon('light');
  } else {
    document.body.className = 'dark-theme';
    updateThemeIcon('dark');
  }

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.className = 'light-theme';
      localStorage.setItem('bizflow_theme', 'light');
      updateThemeIcon('light');
      showToast('已切換為明亮主題', 'info');
    } else {
      document.body.className = 'dark-theme';
      localStorage.setItem('bizflow_theme', 'dark');
      updateThemeIcon('dark');
      showToast('已切換為深色玻璃主題', 'info');
    }
  });
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('theme-icon');
  if (theme === 'light') {
    // Sun icon filled path replacement or moon representation
    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
  } else {
    // Moon outline representation
    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
  }
}

// ==========================================
// TOAST SYSTEM
// ==========================================
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'danger') icon = '🚨';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Automatically remove toast element after 4s
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// ==========================================
// MODAL SYSTEM
// ==========================================
export function showModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  
  body.innerHTML = html;
  overlay.classList.add('active');
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
}

function setupModalDismiss() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close-btn');

  closeBtn.addEventListener('click', closeModal);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Support ESC key close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });
}

// ==========================================
// GLOBAL UI METRICS UPDATE HELPERS
// ==========================================
export function updateGoogleConnectionBadge() {
  const config = getGoogleConfig();
  const dot = document.getElementById('google-status-dot');
  const text = document.getElementById('google-status-text');
  const details = document.getElementById('google-status-details');
  const avatarText = document.getElementById('user-name-text');
  const avatarImg = document.getElementById('user-avatar-img');

  if (config.isConnected) {
    dot.className = 'status-dot online';
    text.textContent = '已同步 Google 雲端';
    details.innerHTML = `連線帳戶：<br>${config.userEmail}`;
    avatarText.textContent = config.userEmail.split('@')[0];
    
    // Create an avatar SVG letter from email
    const letter = config.userEmail.charAt(0).toUpperCase();
    avatarImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='32' height='32'%3E%3Crect width='100%25' height='100%25' fill='%2310b981'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='12' font-weight='bold'%3E${letter}%3C/text%3E%3C/svg%3E`;
  } else {
    dot.className = 'status-dot offline';
    text.textContent = '未同步 Google 雲端';
    details.textContent = '本地模擬模式 (Demo Mode) 已啟用';
    avatarText.textContent = '訪客使用者';
    avatarImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='32' height='32'%3E%3Crect width='100%25' height='100%25' fill='%236366f1'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-size='12' font-weight='bold'%3EBIZ%3C/text%3E%3C/svg%3E`;
  }
}

export function updatePostSalesSidebarCount() {
  const postsales = getPostSales();
  // Count how many postsales items have helpNeeded: true OR incomeStatus is not closed
  const activeHelp = postsales.filter(p => p.helpNeeded).length;
  const bubble = document.getElementById('postsales-active-count');
  
  if (activeHelp > 0) {
    bubble.textContent = `${activeHelp}`;
    bubble.style.display = 'inline-block';
    bubble.className = 'badge badge-danger count-bubble'; // red badge since it represents items that need attention!
    bubble.title = `${activeHelp} 個專案目前正處於「困難求助」狀態`;
  } else {
    // Show total active payments
    const activePayments = postsales.filter(p => p.incomeStatus !== 'CLOSED').length;
    if (activePayments > 0) {
      bubble.textContent = `${activePayments}`;
      bubble.style.display = 'inline-block';
      bubble.className = 'badge badge-success count-bubble';
      bubble.title = `${activePayments} 個履約付款中的專案`;
    } else {
      bubble.style.display = 'none';
    }
  }
}

// Clock update logic
function startHeaderClock() {
  const clockEl = document.getElementById('header-date-time');
  const updateClock = () => {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    
    if (clockEl) {
      clockEl.textContent = `${YYYY}-${MM}-${DD} ${hh}:${mm}`;
    }
  };
  
  updateClock();
  setInterval(updateClock, 30000); // refresh every 30s
}
