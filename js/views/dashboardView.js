// Dashboard View Renderer
import { getPreSales, getPostSales, getLogs } from '../db.js';
import { showToast, showModal, closeModal } from '../app.js';

export function renderDashboard(containerId, navigateToView) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const presales = getPreSales();
  const postsales = getPostSales();
  const logs = getLogs().slice(0, 5); // top 5 activities

  // Calculations
  const totalPresalesEst = presales
    .filter(p => p.status !== 'WON' && p.status !== 'LOST')
    .reduce((sum, p) => sum + Number(p.estAmount || 0), 0);

  const totalWon = postsales.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
  const totalInvoiced = postsales.reduce((sum, p) => sum + Number(p.invoicedAmount || 0), 0);
  const totalDeferred = postsales.reduce((sum, p) => sum + Number(p.deferredAmount || 0), 0);
  const totalUninvoiced = postsales.reduce((sum, p) => sum + Number(p.uninvoicedAmount || 0), 0);
  const totalCashflowTarget = totalUninvoiced + totalDeferred;

  // Render HTML structure
  container.innerHTML = `
    <div class="fade-in">
      <!-- Header actions bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <span style="font-size:0.9rem; color:var(--color-text-muted);">
          歡迎回來！以下為目前售前開發與收款履約即時進度匯總。
        </span>
        <button class="btn btn-primary btn-sm" id="btn-share-performance" style="box-shadow: 0 0 10px var(--color-primary-glow);">
          📤 分享業績給老闆/好友
        </button>
      </div>

      <!-- Top Metrics Dashboard -->
      <section class="stats-grid">
        <!-- Card 1: Pre-sales pipeline -->
        <div class="stat-card glass-panel">
          <div class="stat-info">
            <span class="stat-label">開發中預估金額 (售前)</span>
            <div class="stat-value" id="val-presales">${totalPresalesEst}<span class="stat-unit">萬</span></div>
            <div class="stat-meta text-muted">包含開發中至議約中專案</div>
          </div>
          <div class="stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>

        <!-- Card 2: Total Won -->
        <div class="stat-card success glass-panel">
          <div class="stat-info">
            <span class="stat-label">已成交合約總額 (售後)</span>
            <div class="stat-value" id="val-won">${totalWon}<span class="stat-unit">萬</span></div>
            <div class="stat-meta text-success">合約已生效</div>
          </div>
          <div class="stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
          </div>
        </div>

        <!-- Card 3: Invoiced -->
        <div class="stat-card warning glass-panel">
          <div class="stat-info">
            <span class="stat-label">已開票總金額 (落袋)</span>
            <div class="stat-value" id="val-invoiced">${totalInvoiced}<span class="stat-unit">萬</span></div>
            <div class="stat-meta text-warning">開票比率: ${totalWon > 0 ? Math.round((totalInvoiced / totalWon) * 100) : 0}%</div>
          </div>
          <div class="stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
        </div>

        <!-- Card 4: Uninvoiced & Deferred -->
        <div class="stat-card secondary glass-panel">
          <div class="stat-info">
            <span class="stat-label">未收 / 遞延總金額</span>
            <div class="stat-value" id="val-cashflow">${totalCashflowTarget}<span class="stat-unit">萬</span></div>
            <div class="stat-meta text-danger">未開票 ${totalUninvoiced} 萬 | 遞延 ${totalDeferred} 萬</div>
          </div>
          <div class="stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
        </div>
      </section>

      <!-- Main Dashboard Panels Grid -->
      <div class="dashboard-grid">
        <!-- Left: Financial Analysis & CSS Chart -->
        <div class="dashboard-panel glass-panel">
          <div class="panel-header">
            <h3 class="panel-title">📊 業務財務架構分析</h3>
            <span class="badge badge-primary">現收與遞延比例</span>
          </div>
          
          <div class="chart-container">
            <div class="chart-axis-y">
              <div class="chart-grid-line"></div>
              <div class="chart-grid-line"></div>
              <div class="chart-grid-line"></div>
              <div class="chart-grid-line"></div>
            </div>
            
            <div class="chart-bars">
              <!-- Bar 1: Won -->
              <div class="chart-bar-group">
                <span class="chart-bar-value">${totalWon}萬</span>
                <div class="chart-bar-pillar" id="bar-won" style="height: 0%"></div>
                <span class="chart-bar-label">已成交合約</span>
              </div>
              
              <!-- Bar 2: Invoiced -->
              <div class="chart-bar-group">
                <span class="chart-bar-value">${totalInvoiced}萬</span>
                <div class="chart-bar-pillar" id="bar-invoiced" style="height: 0%"></div>
                <span class="chart-bar-label">已開票金額</span>
              </div>
              
              <!-- Bar 3: Uninvoiced -->
              <div class="chart-bar-group">
                <span class="chart-bar-value">${totalUninvoiced}萬</span>
                <div class="chart-bar-pillar" id="bar-uninvoiced" style="height: 0%"></div>
                <span class="chart-bar-label">未開票待收</span>
              </div>
              
              <!-- Bar 4: Deferred -->
              <div class="chart-bar-group">
                <span class="chart-bar-value">${totalDeferred}萬</span>
                <div class="chart-bar-pillar" id="bar-deferred" style="height: 0%"></div>
                <span class="chart-bar-label">遞延(Y+1)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Quick Actions & Recent Activities -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Quick Action Buttons -->
          <div class="dashboard-panel glass-panel" style="padding: 20px;">
            <div class="panel-header" style="margin-bottom: 12px;">
              <h3 class="panel-title">⚙️ 快捷操作</h3>
            </div>
            <div class="quick-actions-grid">
              <div class="quick-action-btn" id="qa-add-presale">
                <span style="font-size: 1.25rem;">💼</span>
                <span style="font-size: 0.8rem; font-weight:600;">新增售前專案</span>
              </div>
              <div class="quick-action-btn" id="qa-view-calendar">
                <span style="font-size: 1.25rem;">📅</span>
                <span style="font-size: 0.8rem; font-weight:600;">全局日曆查詢</span>
              </div>
              <div class="quick-action-btn" id="qa-view-help">
                <span style="font-size: 1.25rem;">🚨</span>
                <span style="font-size: 0.8rem; font-weight:600;">收款困難專案</span>
              </div>
              <div class="quick-action-btn" id="qa-view-cards">
                <span style="font-size: 1.25rem;">🪪</span>
                <span style="font-size: 0.8rem; font-weight:600;">聯絡名片夾</span>
              </div>
            </div>
          </div>

          <!-- Activity log panel -->
          <div class="dashboard-panel glass-panel" style="flex-grow: 1;">
            <div class="panel-header" style="margin-bottom: 16px;">
              <h3 class="panel-title">🔔 最近動態日誌</h3>
            </div>
            <div class="activity-list" id="dashboard-activity-list">
              ${logs.length > 0 ? logs.map(l => {
                let badgeClass = '';
                let badgeIcon = '📝';
                if (l.type === 'WON_TRANSFER') { badgeClass = 'won'; badgeIcon = '💸'; }
                if (l.type === 'HELP_ALERT') { badgeClass = 'help'; badgeIcon = '⚠️'; }
                
                return `
                  <div class="activity-item">
                    <div class="activity-badge ${badgeClass}">${badgeIcon}</div>
                    <div class="activity-content">
                      <div class="activity-title">${l.title}</div>
                      <div class="activity-desc">${l.desc}</div>
                    </div>
                    <div class="activity-time">${l.time.split(' ')[1]}</div>
                  </div>
                `;
              }).join('') : '<div class="text-muted" style="text-align:center; font-size:0.85rem; padding: 20px 0;">尚無任何動態</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Trigger chart animation in next tick
  setTimeout(() => {
    const maxVal = Math.max(totalWon, totalInvoiced, totalUninvoiced, totalDeferred, 100);
    const setHeight = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.style.height = `${(val / maxVal) * 80 + 10}%`; // leave margin
    };
    setHeight('bar-won', totalWon);
    setHeight('bar-invoiced', totalInvoiced);
    setHeight('bar-uninvoiced', totalUninvoiced);
    setHeight('bar-deferred', totalDeferred);
  }, 100);

  // Hook Share button
  document.getElementById('btn-share-performance').addEventListener('click', () => {
    openSharePerformanceModal();
  });

  // Hook Quick Actions
  document.getElementById('qa-add-presale').addEventListener('click', () => {
    navigateToView('presales');
    setTimeout(() => {
      const addBtn = document.getElementById('add-presale-btn');
      if (addBtn) addBtn.click();
    }, 150);
  });

  document.getElementById('qa-view-calendar').addEventListener('click', () => {
    navigateToView('calendar');
  });

  document.getElementById('qa-view-cards').addEventListener('click', () => {
    navigateToView('cards');
  });

  document.getElementById('qa-view-help').addEventListener('click', () => {
    navigateToView('postsales');
    setTimeout(() => {
      const searchBox = document.getElementById('postsales-search');
      if (searchBox) {
        searchBox.value = '求助';
        searchBox.dispatchEvent(new Event('input'));
      }
    }, 150);
  });

  // ==========================================
  // PERFORMANCE SHARING MODAL
  // ==========================================
  function openSharePerformanceModal() {
    // Generate text report (excluding confidential costs and profits)
    const reportText = `📊 【BizFlow 業績進度報告】
報告時間：${new Date().toLocaleString()}

📈 核心財務數據總覽：
1. 已成交合約總額 (PO)：NT$ ${totalWon} 萬元
2. 已開票進帳金額：NT$ ${totalInvoiced} 萬元
3. 未開票待收帳款：NT$ ${totalUninvoiced} 萬元
4. 跨年度遞延認列金額 (Y+1)：NT$ ${totalDeferred} 萬元
5. 收款開票完成率：${totalWon > 0 ? Math.round((totalInvoiced / totalWon) * 100) : 0}%

💼 執行中收款與合約明細：
${postsales.map((p, i) => `${i + 1}. [${translateStatus(p.incomeStatus)}] ${p.clientProjectName}\n   合約總額: NT$ ${p.totalAmount} 萬元 | 已開票: NT$ ${p.invoicedAmount} 萬元`).join('\n')}

---
報告由 BizFlow Hub 業務管理系統自動生成，機密資料已自動遮蔽。`;

    const modalBodyHtml = `
      <h3 class="modal-title">📤 業績分享匯報中心</h3>
      <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:20px; line-height:1.5;">
        此工具會自動彙整您目前的業績數據（已成交額、開票數、待收遞延額），並<strong>自動遮蔽敏感成本利潤資料</strong>，方便您直接向主管或合夥人報告。
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- Option 1: Copy formatted summary -->
        <div class="glass-panel" style="padding: 16px; border-radius: var(--border-radius-md);">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <span>📋</span> LINE / 郵件文字報告
          </h4>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:12px;">
            一鍵複製格式精美的業績文本，適合直接傳送於社群軟體。
          </p>
          <textarea class="form-control" rows="5" readonly style="font-family:monospace; font-size:0.8rem; background-color:#020617; border-color:#334155; margin-bottom:12px;">${reportText}</textarea>
          <button class="btn btn-primary btn-sm" id="btn-copy-report-text" style="width:100%;">
            複製報告文字至剪貼簿
          </button>
        </div>

        <!-- Option 2: Print graphic layout -->
        <div class="glass-panel" style="padding: 16px; border-radius: var(--border-radius-md);">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <span>🖼️</span> 產生 A4 業績簡報圖卡 (PDF)
          </h4>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:12px;">
            開啟排版精美、適合列印的圖卡，您可以將其儲存為 PDF 或列印成紙本。
          </p>
          <button class="btn btn-success btn-sm" id="btn-print-report-card" style="width:100%; background-color:var(--color-success);">
            開啟列印/另存 PDF 頁面
          </button>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:24px;">
        <button class="btn btn-outline-primary btn-sm" id="btn-close-share-modal">關閉</button>
      </div>

      <!-- Hidden Print Container -->
      <div id="print-performance-card" style="display:none;">
        <div style="padding: 40px; font-family: 'Noto Sans TC', sans-serif; color: #000; background: #fff; width: 210mm; min-height: 297mm; box-sizing: border-box;">
          <div style="border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
              <h1 style="margin:0; font-size: 2.2rem; font-weight:900; color: #1e3a8a;">BIZFLOW HUB 業績進度報告</h1>
              <p style="margin: 5px 0 0; font-size: 0.9rem; color: #666;">機密業務資料 • 已排除敏感財務資訊</p>
            </div>
            <div style="text-align:right; font-size:0.85rem; color:#666;">
              匯出日期：${new Date().toLocaleDateString()}<br>
              報告狀態：即時業務摘要
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color:#f8fafc;">
              <span style="font-size: 0.85rem; color:#666; font-weight:700;">已成交合約總額 (PO)</span>
              <h2 style="margin:10px 0 0; font-size: 2rem; color:#059669; font-weight:900;">${totalWon} <span style="font-size:1rem;">萬元</span></h2>
            </div>
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color:#f8fafc;">
              <span style="font-size: 0.85rem; color:#666; font-weight:700;">已開票進帳金額</span>
              <h2 style="margin:10px 0 0; font-size: 2rem; color:#d97706; font-weight:900;">${totalInvoiced} <span style="font-size:1rem;">萬元</span></h2>
            </div>
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color:#f8fafc;">
              <span style="font-size: 0.85rem; color:#666; font-weight:700;">未開票待收帳款</span>
              <h2 style="margin:10px 0 0; font-size: 1.8rem; color:#3b82f6; font-weight:900;">${totalUninvoiced} <span style="font-size:0.9rem;">萬元</span></h2>
            </div>
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color:#f8fafc;">
              <span style="font-size: 0.85rem; color:#666; font-weight:700;">遞延帳款 (Y+1)</span>
              <h2 style="margin:10px 0 0; font-size: 1.8rem; color:#db2777; font-weight:900;">${totalDeferred} <span style="font-size:0.9rem;">萬元</span></h2>
            </div>
          </div>

          <h3 style="border-bottom: 2px solid #2563eb; padding-bottom: 8px; color: #1e3a8a; font-size: 1.25rem;">💼 專案履約與收款明細</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size:0.9rem;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align:left;">
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">專案名稱</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">簽約日期</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">合約總額</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">已開票</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">未開票</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">收款狀態</th>
              </tr>
            </thead>
            <tbody>
              ${postsales.map(p => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 10px; font-weight:700;">${p.clientProjectName}</td>
                  <td style="padding: 12px 10px;">${p.poDate}</td>
                  <td style="padding: 12px 10px; font-weight:700;">${p.totalAmount} 萬</td>
                  <td style="padding: 12px 10px; color:#059669;">${p.invoicedAmount} 萬</td>
                  <td style="padding: 12px 10px; color:#475569;">${p.uninvoicedAmount} 萬</td>
                  <td style="padding: 12px 10px; font-weight:600;">${translateStatus(p.incomeStatus)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 60px; border-top: 1px solid #ddd; padding-top: 20px; font-size:0.8rem; color:#666; display:flex; justify-content:space-between;">
            <span>此報告由 BizFlow Hub 業務雲端整合系統自動匯出</span>
            <span>主管簽核：____________________</span>
          </div>
        </div>
      </div>
    `;

    showModal(modalBodyHtml);

    document.getElementById('btn-close-share-modal').addEventListener('click', closeModal);

    // Click copy report text
    document.getElementById('btn-copy-report-text').addEventListener('click', () => {
      navigator.clipboard.writeText(reportText).then(() => {
        showToast('已複製業績報告至剪貼簿！', 'success');
      }).catch(err => {
        showToast('複製失敗，請手動複製', 'danger');
      });
    });

    // Click print report card
    document.getElementById('btn-print-report-card').addEventListener('click', () => {
      const printContents = document.getElementById('print-performance-card').innerHTML;
      const originalContents = document.body.innerHTML;

      // Create a temporary window or iframe to print clean styles
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>BizFlow Hub 業績報告</title>
            <style>
              body { margin: 0; padding: 0; background: #fff; }
              @media print {
                body { background: #fff; }
              }
            </style>
          </head>
          <body>
            ${printContents}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      showToast('已開啟列印引導頁面', 'success');
    });
  }

  function translateStatus(status) {
    const mapping = {
      'UNINVOICED': '未開票',
      'PARTIAL': '部分收款',
      'FULLY_INVOED': '已全開票',
      'FULLY_PAID': '已全收款',
      'CLOSED': '已結案'
    };
    return mapping[status] || status;
  }
}
