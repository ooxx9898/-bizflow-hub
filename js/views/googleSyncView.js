// Google Cloud Integration Sync Panel View
import { getGoogleConfig, saveGoogleConfig, syncToGoogleCloud } from '../googleApi.js';
import { getPreSales, getPostSales } from '../db.js';
import { showToast, updateGoogleConnectionBadge } from '../app.js';

export function renderGoogleSync(containerId, navigateToView) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const config = getGoogleConfig();

  container.innerHTML = `
    <div class="fade-in sync-grid">
      <!-- Left: Credentials Config -->
      <section class="sync-panel-section glass-panel">
        <h3 class="panel-title">⚙️ Google Cloud API 認證設定</h3>
        <p style="font-size:0.8rem; color:var(--color-text-muted); line-height:1.5;">
          本系統整合 Google Sheets (試算表) 作為中央雲端資料庫，並可自動同步合約驗收日期至您的 Google Calendar (日曆)。
        </p>

        <!-- Toggle for Demo Mode -->
        <div class="service-row" style="background-color:rgba(99,102,241,0.06); border-color:var(--color-primary-glow);">
          <div class="service-meta">
            <span style="font-size: 1.25rem;">✨</span>
            <div class="service-name">
              <div>使用本地模擬模式 (Demo Mode)</div>
              <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:400; margin-top:2px;">
                無須配置 API 金鑰即可體驗雲端同步動畫與完整功能
              </div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" id="sync-demo-toggle" ${config.isDemoMode ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <form id="google-config-form">
          <div class="form-group credentials-field" style="display: ${config.isDemoMode ? 'none' : 'flex'};">
            <label for="config-api-key">Google API 金鑰 (API Key)</label>
            <input type="password" class="form-control" id="config-api-key" value="${config.apiKey || ''}" placeholder="AIzaSy...">
          </div>

          <div class="form-group credentials-field" style="display: ${config.isDemoMode ? 'none' : 'flex'};">
            <label for="config-client-id">OAuth 用戶端 ID (Client ID)</label>
            <input type="text" class="form-control" id="config-client-id" value="${config.clientId || ''}" placeholder="xxxx.apps.googleusercontent.com">
          </div>

          <div class="form-group">
            <label for="config-sheet-id">已綁定 Google Sheets 試算表 ID</label>
            <input type="text" class="form-control" id="config-sheet-id" value="${config.spreadsheetId || ''}" placeholder="不填則於第一次同步時自動建立新試算表">
          </div>

          <div style="display:flex; gap:12px; margin-top:12px;">
            <button type="submit" class="btn btn-outline-primary" style="flex-grow:1;">儲存設定</button>
            <button type="button" id="btn-sync-disconnect" class="btn btn-danger" style="display: ${config.isConnected ? 'block' : 'none'};">中斷連線</button>
          </div>
        </form>

        <!-- Current Services Synced -->
        <div class="sync-services-status" style="margin-top:10px;">
          <h4 style="font-size:0.85rem; font-weight:700;">📌 雲端整合狀態：</h4>
          
          <div class="service-row">
            <div class="service-meta">
              <span class="service-icon">📊</span>
              <span class="service-name">Google Sheets (資料同步庫)</span>
            </div>
            <span class="badge ${config.isConnected ? 'badge-success' : 'badge-danger'}" id="status-badge-sheets">
              ${config.isConnected ? '已同步' : '未同步'}
            </span>
          </div>

          <div class="service-row">
            <div class="service-meta">
              <span class="service-icon">📅</span>
              <span class="service-name">Google Calendar (日程足跡)</span>
            </div>
            <span class="badge ${config.isConnected ? 'badge-success' : 'badge-danger'}" id="status-badge-calendar">
              ${config.isConnected ? '已同步' : '未同步'}
            </span>
          </div>
        </div>
      </section>

      <!-- Right: Steps guide and Terminal Console -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <section class="sync-panel-section glass-panel" style="flex-grow: 1;">
          <div class="panel-header" style="margin-bottom:0;">
            <h3 class="panel-title">☁️ 雲端同步中心</h3>
            <button class="btn btn-primary btn-sm" id="btn-trigger-sync" style="background-color: var(--color-primary);">
              ⚡ 開始同步資料
            </button>
          </div>

          <!-- Console Terminal Simulator -->
          <div class="terminal-window">
            <div class="terminal-header">
              <div class="terminal-dot-indicators">
                <span class="terminal-dot"></span>
                <span class="terminal-dot"></span>
                <span class="terminal-dot"></span>
              </div>
              <span class="terminal-title">bizflow-sync-engine.log</span>
              <span style="font-size:0.65rem; opacity:0.5;">v1.0.0</span>
            </div>
            <div class="terminal-body" id="sync-terminal-body">
              <div class="log-entry">
                <span class="log-time">[18:00:00]</span>
                <span class="log-info">系統就緒。請點擊「開始同步資料」以啟動備份。</span>
              </div>
            </div>
          </div>

          <!-- Steps guides if not in demo mode -->
          <div class="setup-steps" id="setup-steps-guide" style="display: ${config.isDemoMode ? 'none' : 'flex'}; margin-top: 10px;">
            <h4 style="font-size:0.85rem; font-weight:700;">🔧 整合前置作業三步驟：</h4>
            
            <div class="setup-step">
              <span class="step-number">1</span>
              <div class="step-content">
                <span class="step-title">建立 Google Cloud 專案</span>
                <span class="step-desc">前往 Google Cloud Console 啟用 Google Sheets API 與 Calendar API。</span>
              </div>
            </div>

            <div class="setup-step">
              <span class="step-number">2</span>
              <div class="step-content">
                <span class="step-title">取得 API 金鑰與 Client ID</span>
                <span class="step-desc">建立憑證取得 API Key 與 OAuth 用戶端 ID。設定將目前主機網址加入授權來源。</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  // Attach handlers
  const demoToggle = document.getElementById('sync-demo-toggle');
  demoToggle.addEventListener('change', () => {
    const isChecked = demoToggle.checked;
    
    // Toggle fields visibility
    const credFields = document.querySelectorAll('.credentials-field');
    credFields.forEach(f => f.style.display = isChecked ? 'none' : 'flex');
    
    document.getElementById('setup-steps-guide').style.display = isChecked ? 'none' : 'flex';

    // Save temporary state
    const currentConf = getGoogleConfig();
    currentConf.isDemoMode = isChecked;
    saveGoogleConfig(currentConf);

    writeLogEntry('系統設定異動：已切換為' + (isChecked ? '「模擬模式 (Demo Mode)」' : '「真實 API 連線模式」'), 'warning');
  });

  const configForm = document.getElementById('google-config-form');
  configForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentConf = getGoogleConfig();
    currentConf.apiKey = document.getElementById('config-api-key').value.trim();
    currentConf.clientId = document.getElementById('config-client-id').value.trim();
    currentConf.spreadsheetId = document.getElementById('config-sheet-id').value.trim();
    currentConf.isDemoMode = demoToggle.checked;

    saveGoogleConfig(currentConf);
    showToast('認證與金鑰設定已成功儲存', 'success');
    writeLogEntry('系統認證金鑰配置已更新。', 'success');
  });

  document.getElementById('btn-sync-disconnect').addEventListener('click', () => {
    if (confirm('確定要中斷與 Google 雲端的連結，並回到本地離線狀態嗎？')) {
      const currentConf = getGoogleConfig();
      currentConf.isConnected = false;
      currentConf.userEmail = '';
      saveGoogleConfig(currentConf);
      
      showToast('已斷開 Google 雲端連線', 'warning');
      writeLogEntry('⚠️ 已成功斷開與 Google 帳號的連結。系統回到單機離線運作。', 'warning');

      // Update badges
      document.getElementById('status-badge-sheets').className = 'badge badge-danger';
      document.getElementById('status-badge-sheets').textContent = '未同步';
      document.getElementById('status-badge-calendar').className = 'badge badge-danger';
      document.getElementById('status-badge-calendar').textContent = '未同步';
      document.getElementById('btn-sync-disconnect').style.display = 'none';

      updateGoogleConnectionBadge();
    }
  });

  const syncBtn = document.getElementById('btn-trigger-sync');
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<svg class="spin-icon" style="margin-right:8px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> 雲端同步中...`;
    
    // Clear terminal log for fresh sync
    const termBody = document.getElementById('sync-terminal-body');
    termBody.innerHTML = '';

    const presales = getPreSales();
    const postsales = getPostSales();

    try {
      const result = await syncToGoogleCloud(presales, postsales, (time, type, text) => {
        writeLogEntry(text, type, time);
      });

      if (result) {
        showToast('雲端同步成功！', 'success');
        
        // Update badges
        document.getElementById('status-badge-sheets').className = 'badge badge-success';
        document.getElementById('status-badge-sheets').textContent = '已同步';
        document.getElementById('status-badge-calendar').className = 'badge badge-success';
        document.getElementById('status-badge-calendar').textContent = '已同步';
        document.getElementById('btn-sync-disconnect').style.display = 'block';

        // Update sheet ID if it was newly created
        const latestConfig = getGoogleConfig();
        document.getElementById('config-sheet-id').value = latestConfig.spreadsheetId;

        updateGoogleConnectionBadge();
      }
    } catch (err) {
      showToast('同步失敗，詳情請看日誌', 'danger');
    } finally {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `⚡ 開始同步資料`;
    }
  });

  // Write log entries inside terminal Emulator
  function writeLogEntry(text, type = 'info', time = null) {
    const termBody = document.getElementById('sync-terminal-body');
    if (!termBody) return;

    const timestamp = time || new Date().toLocaleTimeString();
    let typeClass = 'log-info';
    let prefix = '[INFO]';

    if (type === 'success') { typeClass = 'log-success'; prefix = '[SUCCESS]'; }
    if (type === 'warning') { typeClass = 'log-warning'; prefix = '[WARN]'; }
    if (type === 'error') { typeClass = 'log-error'; prefix = '[ERROR]'; }

    termBody.innerHTML += `
      <div class="log-entry">
        <span class="log-time">[${timestamp}]</span>
        <span class="${typeClass}">${prefix} ${escapeHtml(text)}</span>
      </div>
    `;

    // Auto-scroll
    termBody.scrollTop = termBody.scrollHeight;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
