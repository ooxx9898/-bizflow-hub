// Post-sales Payment Tracking View
import { getPostSales, savePostSale, deletePostSale, getCards } from '../db.js';
import { showToast, showModal, closeModal } from '../app.js';
import { openAddCardUploader } from './cardsView.js';

export function renderPostSales(containerId, navigateToView) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const projects = getPostSales();

  // Calculations for the Post-Sales top dashboard stats
  const totalWon = projects.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
  const totalInvoiced = projects.reduce((sum, p) => sum + Number(p.invoicedAmount || 0), 0);
  const totalDeferred = projects.reduce((sum, p) => sum + Number(p.deferredAmount || 0), 0);
  const totalUninvoiced = projects.reduce((sum, p) => sum + Number(p.uninvoicedAmount || 0), 0);
  const totalUninvoicedAndDeferred = totalUninvoiced + totalDeferred;

  // Render view layout with stats card and main table container
  container.innerHTML = `
    <div class="fade-in">
      <!-- Top KPI Cards -->
      <section class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card success glass-panel" style="padding: 16px 20px;">
          <div class="stat-info">
            <span class="stat-label" style="font-size:0.8rem;">已成交合約總額 (PO)</span>
            <div class="stat-value" style="font-size:1.6rem;">${totalWon}<span class="stat-unit">萬</span></div>
          </div>
        </div>
        
        <div class="stat-card warning glass-panel" style="padding: 16px 20px;">
          <div class="stat-info">
            <span class="stat-label" style="font-size:0.8rem;">已開票進帳金額</span>
            <div class="stat-value" style="font-size:1.6rem;">${totalInvoiced}<span class="stat-unit">萬</span></div>
          </div>
        </div>

        <div class="stat-card secondary glass-panel" style="padding: 16px 20px;">
          <div class="stat-info">
            <span class="stat-label" style="font-size:0.8rem;">未開票 / 遞延總金額 (流速指標)</span>
            <div class="stat-value" style="font-size:1.6rem;">${totalUninvoicedAndDeferred}<span class="stat-unit">萬</span></div>
            <div class="stat-meta text-danger" style="font-size:0.65rem;">未開票 ${totalUninvoiced}萬 | 遞延 ${totalDeferred}萬</div>
          </div>
        </div>
      </section>

      <!-- Table Filters Header -->
      <div class="panel-header" style="margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div class="view-header-actions" style="flex-wrap: wrap; gap: 10px;">
          <button class="btn btn-success" id="add-postsale-btn" style="background-color: var(--color-success);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            手動新增收款合約
          </button>
          
          <button class="btn btn-outline-primary" id="postsales-add-card-btn" style="height: 42px; border-color: var(--color-primary); color: var(--color-primary); font-weight:700;">
            🪪 快速掃描名片
          </button>

          <button class="btn btn-outline-primary" id="postsales-share-btn" style="height: 42px; border-color: var(--color-primary); color: var(--color-primary); font-weight:700;">
            📤 分享收款進度
          </button>

          <button class="btn btn-outline-primary" id="postsales-filter-help-btn" style="height: 42px;">
            ⚠️ 篩選困難求助
          </button>
        </div>
        
        <div style="position: relative; width: 300px;">
          <input type="text" class="form-control" id="postsales-search" placeholder="搜尋項目名稱/開票狀態/求助..." style="padding-left: 36px; height: 38px;">
          <svg style="position: absolute; left: 12px; top: 11px; color: var(--color-text-muted);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
      </div>

      <!-- Main Post-sales table -->
      <div class="table-container postsales-table-wrapper">
        <table class="data-table" id="postsales-table">
          <thead>
            <tr>
              <th>項目名稱 (PO)</th>
              <th>PO 日期</th>
              <th>預計完驗</th>
              <th>總金額 ($萬)</th>
              <th>已開票 ($萬)</th>
              <th>未開票 ($萬)</th>
              <th>遞延金額 ($萬)</th>
              <th>開票進度</th>
              <th>求助標記</th>
              <th>收款狀態</th>
              <th style="width: 100px; text-align: center;">操作</th>
            </tr>
          </thead>
          <tbody id="postsales-table-body">
            <!-- Rendered dynamically -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach actions
  document.getElementById('add-postsale-btn').addEventListener('click', () => {
    openPostSalesForm();
  });

  // Rapid business card scan from Post-sales page
  document.getElementById('postsales-add-card-btn').addEventListener('click', () => {
    openAddCardUploader((savedCard) => {
      openPostSalesForm(null, savedCard);
    });
  });

  // Post-sales share button
  document.getElementById('postsales-share-btn').addEventListener('click', () => {
    openPostsalesShareModal(projects);
  });

  const searchInput = document.getElementById('postsales-search');
  searchInput.addEventListener('input', () => {
    filterTable(searchInput.value.trim().toLowerCase());
  });

  let filterHelpActive = false;
  document.getElementById('postsales-filter-help-btn').addEventListener('click', () => {
    filterHelpActive = !filterHelpActive;
    const btn = document.getElementById('postsales-filter-help-btn');
    if (filterHelpActive) {
      btn.classList.add('btn-danger');
      btn.classList.remove('btn-outline-primary');
      btn.style.color = '#ffffff';
      filterTable('求助');
    } else {
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-outline-primary');
      btn.style.color = '';
      filterTable('');
    }
  });

  // Render initial table contents
  renderTableRows(projects);

  // ==========================================
  // TABLE ROW RENDERER
  // ==========================================
  function renderTableRows(items) {
    const tbody = document.getElementById('postsales-table-body');
    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; color: var(--color-text-muted); padding: 40px 0;">
            目前無符合條件的收款追蹤合約
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(p => {
      // Calculate progress %
      const percent = p.totalAmount > 0 ? Math.round((p.invoicedAmount / p.totalAmount) * 100) : 0;
      
      // Check if difficulty flagged
      const flaggedClass = p.helpNeeded ? 'difficulty-flagged' : '';
      
      // Inline status mappings
      let statusOptionText = translateIncomeStatus(p.incomeStatus);
      
      return `
        <tr class="postsale-row ${flaggedClass}" data-id="${p.id}">
          <td class="table-project-name">${escapeHtml(p.clientProjectName)}</td>
          <td style="font-family: monospace;">${p.poDate}</td>
          <td style="font-family: monospace;">${p.completionDate}</td>
          <td style="font-weight: 700;">${p.totalAmount} 萬</td>
          <td style="font-weight: 600; color: var(--color-success);">${p.invoicedAmount} 萬</td>
          <!-- Auto-calculated: uninvoicedAmount -->
          <td style="font-weight: 600; color: var(--color-text-muted);">${p.uninvoicedAmount} 萬</td>
          <td style="font-weight: 500; color: var(--color-secondary);">${p.deferredAmount} 萬</td>
          <td>
            <div class="invoice-progress-container">
              <div class="progress-track">
                <div class="progress-bar-fill" style="width: ${percent}%;"></div>
              </div>
              <span class="progress-percent">${percent}%</span>
            </div>
          </td>
          <td>
            ${p.helpNeeded ? `
              <div class="difficulty-indicator">
                <span class="difficulty-indicator-dot"></span>
                <span>⚠️ 求助中</span>
                <div class="difficulty-tooltip">
                  <strong>求助事項描述：</strong><br>
                  ${escapeHtml(p.helpDescription || '未填寫描述')}
                </div>
              </div>
            ` : `<span style="color:var(--color-text-muted); font-size:0.8rem;">無</span>`}
          </td>
          <td>
            <span class="badge ${getStatusBadgeClass(p.incomeStatus)}">${statusOptionText}</span>
          </td>
          <td align="center" style="display: flex; gap: 8px; justify-content: center; align-items: center; height:100%;">
            <button class="action-icon-btn edit-btn" data-edit-id="${p.id}" title="編輯合約資訊">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-icon-btn delete delete-btn" data-delete-id="${p.id}" title="刪除合約">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    tbody.querySelectorAll('.postsale-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.action-icon-btn')) return;
        const id = row.dataset.id;
        openPostSalesForm(id);
      });
    });

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPostSalesForm(btn.dataset.editId);
      });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (confirm('確定要刪除此售後收款合約嗎？此動作將無法還原。')) {
          deletePostSale(id);
          showToast('已刪除收款追蹤合約', 'warning');
          renderPostSales(containerId, navigateToView);
        }
      });
    });
  }

  // ==========================================
  // TABLE FILTER SEARCH LOGIC
  // ==========================================
  function filterTable(queryText) {
    if (!queryText) {
      renderTableRows(projects);
      return;
    }

    const filtered = projects.filter(p => {
      if (queryText === '求助') {
        return p.helpNeeded === true;
      }
      return p.clientProjectName.toLowerCase().includes(queryText) ||
             (p.description && p.description.toLowerCase().includes(queryText)) ||
             translateIncomeStatus(p.incomeStatus).includes(queryText);
    });

    renderTableRows(filtered);
  }

  // ==========================================
  // ADD / EDIT DETAILED MODAL FORM
  // ==========================================
  function openPostSalesForm(id = null, prefilledCard = null) {
    const isEdit = id !== null;
    const cards = getCards();

    const project = isEdit ? projects.find(p => p.id === id) : {
      clientProjectName: prefilledCard ? `${prefilledCard.company} - ${prefilledCard.name}收款單` : '',
      poDate: new Date().toISOString().split('T')[0],
      completionDate: '',
      totalAmount: '',
      description: prefilledCard ? `【名片聯絡人資訊】\n職稱: ${prefilledCard.title}\n電話: ${prefilledCard.phone}\n信箱: ${prefilledCard.email}\n備註: ${prefilledCard.notes || ''}` : '',
      invoicedAmount: 0,
      deferredAmount: 0,
      helpNeeded: false,
      helpDescription: '',
      incomeStatus: 'UNINVOICED',
      closingDate: ''
    };

    const modalBodyHtml = `
      <h3 class="modal-title" style="color: var(--color-success);">${isEdit ? '📝 編輯收款合約資訊' : '💸 新增收款追蹤合約'}</h3>
      
      <!-- Card Selector dropdown to autofill fields (Insert from card holder) -->
      ${!isEdit && !prefilledCard ? `
        <div class="form-group" style="background-color:rgba(16,185,129,0.06); padding:12px; border-radius:var(--border-radius-md); border:1px dashed var(--color-success); margin-bottom: 20px;">
          <label style="font-weight:700; font-size:0.8rem; display:flex; align-items:center; gap:6px;">
            <span>🪪</span> 匯入聯絡人名片資料（快速帶入專案與客戶資訊）
          </label>
          <select class="form-control" id="post-form-import-card" style="margin-top:8px; font-size:0.8rem; height:34px; padding:4px 8px;">
            <option value="">-- 點選名片載入資訊 --</option>
            ${cards.map(c => `<option value="${c.id}">${escapeHtml(c.company)} - ${escapeHtml(c.name)} (${escapeHtml(c.title)})</option>`).join('')}
          </select>
        </div>
      ` : ''}

      <form id="postsale-form">
        <div class="form-group">
          <label for="post-form-name">已簽約項目 (客戶項目名稱 PO) <span style="color:var(--color-danger)">*</span></label>
          <input type="text" class="form-control" id="post-form-name" required value="${escapeHtml(project.clientProjectName)}" placeholder="請輸入合約項目名稱">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="post-form-po-date">PO 簽約日期 <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-control" id="post-form-po-date" required value="${project.poDate}">
          </div>
          <div class="form-group">
            <label for="post-form-comp-date">預計完驗日期 <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-control" id="post-form-comp-date" required value="${project.completionDate}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="post-form-total">合約總金額 (萬元) <span style="color:var(--color-danger)">*</span></label>
            <input type="number" step="0.1" class="form-control" id="post-form-total" required value="${project.totalAmount}" placeholder="合約總額">
          </div>
          <div class="form-group">
            <label for="post-form-invoiced">已開票金額 (萬元) <span style="color:var(--color-danger)">*</span></label>
            <input type="number" step="0.1" class="form-control" id="post-form-invoiced" required value="${project.invoicedAmount || 0}" placeholder="已開立發票總額">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="post-form-uninvoiced">未開票金額 (萬元) — 系統全自動計算</label>
            <input type="text" class="form-control" id="post-form-uninvoiced" disabled value="${project.uninvoicedAmount || 0}">
          </div>
          <div class="form-group">
            <label for="post-form-deferred">遞延金額 (Y+1 萬元)</label>
            <input type="number" step="0.1" class="form-control" id="post-form-deferred" value="${project.deferredAmount || 0}" placeholder="跨年度認列款">
          </div>
        </div>

        <div class="form-group">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight:700;">
            <input type="checkbox" id="post-form-help" style="width:16px; height:16px;" ${project.helpNeeded ? 'checked' : ''}>
            ⚠️ 標記為「困難求助」（收款或履約受阻專案）
          </label>
        </div>

        <div class="form-group" id="help-desc-container" style="display: ${project.helpNeeded ? 'block' : 'none'};">
          <label for="post-form-help-desc" style="color: var(--color-danger);">求助原因說明</label>
          <textarea class="form-control" id="post-form-help-desc" rows="2" placeholder="例如：客戶窗口離職，目前驗收文件待簽收，需要長官支援溝通...">${escapeHtml(project.helpDescription || '')}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="post-form-status">收款完成狀態</label>
            <select class="form-control" id="post-form-status">
              <option value="UNINVOICED" ${project.incomeStatus === 'UNINVOICED' ? 'selected' : ''}>未開票 (Uninvoiced)</option>
              <option value="PARTIAL" ${project.incomeStatus === 'PARTIAL' ? 'selected' : ''}>部分收款 (Partial)</option>
              <option value="FULLY_INVOED" ${project.incomeStatus === 'FULLY_INVOED' ? 'selected' : ''}>已全開票 (Fully Invoiced)</option>
              <option value="FULLY_PAID" ${project.incomeStatus === 'FULLY_PAID' ? 'selected' : ''}>已全收款 (Fully Paid)</option>
              <option value="CLOSED" ${project.incomeStatus === 'CLOSED' ? 'selected' : ''}>已結案 (Closed)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="post-form-close-date">結案日期 (若已結案)</label>
            <input type="date" class="form-control" id="post-form-close-date" value="${project.closingDate || ''}">
          </div>
        </div>

        <div class="form-group">
          <label for="post-form-desc">合約執行備註</label>
          <textarea class="form-control" id="post-form-desc" rows="2" placeholder="詳細履約進度與收款歷程備註...">${escapeHtml(project.description || '')}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" class="btn btn-outline-primary" id="post-btn-cancel">取消</button>
          <button type="submit" class="btn btn-success" style="background-color: var(--color-success);">儲存合約資訊</button>
        </div>
      </form>
    `;

    showModal(modalBodyHtml);

    // Bind existing card selector autofill
    if (!isEdit && !prefilledCard) {
      const cardSelect = document.getElementById('post-form-import-card');
      cardSelect.addEventListener('change', () => {
        const cardId = cardSelect.value;
        if (!cardId) return;
        const selectedCard = cards.find(c => c.id === cardId);
        if (selectedCard) {
          document.getElementById('post-form-name').value = `${selectedCard.company} - ${selectedCard.name}收款單`;
          document.getElementById('post-form-desc').value = `【名片聯絡人資訊】\n職稱: ${selectedCard.title}\n電話: ${selectedCard.phone}\n信箱: ${selectedCard.email}\n備註: ${selectedCard.notes || ''}`;
          showToast(`已成功載入聯絡人 「${selectedCard.name}」 的客戶資訊！`, 'success');
        }
      });
    }

    // Toggle help description textarea
    const helpCheckbox = document.getElementById('post-form-help');
    helpCheckbox.addEventListener('change', () => {
      const container = document.getElementById('help-desc-container');
      container.style.display = helpCheckbox.checked ? 'block' : 'none';
      if (helpCheckbox.checked) {
        document.getElementById('post-form-help-desc').focus();
      }
    });

    const totalInput = document.getElementById('post-form-total');
    const invoicedInput = document.getElementById('post-form-invoiced');
    const uninvoicedInput = document.getElementById('post-form-uninvoiced');

    const updateUninvoicedVal = () => {
      const tot = Number(totalInput.value || 0);
      const inv = Number(invoicedInput.value || 0);
      uninvoicedInput.value = `${Math.max(0, tot - inv)}`;
    };

    totalInput.addEventListener('input', updateUninvoicedVal);
    invoicedInput.addEventListener('input', updateUninvoicedVal);

    document.getElementById('post-btn-cancel').addEventListener('click', closeModal);

    document.getElementById('postsale-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const updated = {
        ...project,
        clientProjectName: document.getElementById('post-form-name').value.trim(),
        poDate: document.getElementById('post-form-po-date').value,
        completionDate: document.getElementById('post-form-comp-date').value,
        totalAmount: Number(totalInput.value),
        invoicedAmount: Number(invoicedInput.value),
        deferredAmount: Number(document.getElementById('post-form-deferred').value || 0),
        helpNeeded: helpCheckbox.checked,
        helpDescription: helpCheckbox.checked ? document.getElementById('post-form-help-desc').value.trim() : '',
        incomeStatus: document.getElementById('post-form-status').value,
        closingDate: document.getElementById('post-form-close-date').value,
        description: document.getElementById('post-form-desc').value.trim()
      };

      savePostSale(updated);
      closeModal();
      showToast('已儲存售後收款合約', 'success');

      renderPostSales(containerId, navigateToView);
    });
  }

  // ==========================================
  // SHARE POST-SALES REVENUE MODAL
  // ==========================================
  function openPostsalesShareModal(allProjects) {
    const reportText = `📊 【BizFlow 售後收款履約進度報告】
報告時間：${new Date().toLocaleString()}

📈 收款進帳財務摘要：
• 已成交合約總額 (PO)：NT$ ${totalWon} 萬元
• 已開票進帳金額：NT$ ${totalInvoiced} 萬元
• 未開票待收帳款：NT$ ${totalUninvoiced} 萬元
• 跨年度遞延認列金額 (Y+1)：NT$ ${totalDeferred} 萬元
• 收款開票完成率：${totalWon > 0 ? Math.round((totalInvoiced / totalWon) * 100) : 0}%

💼 執行中收款與合約明細：
${allProjects.map((p, i) => `${i + 1}. [${translateIncomeStatus(p.incomeStatus)}] ${p.clientProjectName}\n   合約總額: NT$ ${p.totalAmount} 萬元 | 已開票: NT$ ${p.invoicedAmount} 萬元 | 未開票: NT$ ${p.uninvoicedAmount} 萬元`).join('\n')}

---
報告由 BizFlow Hub 業務管理系統自動生成，機密資料已自動遮蔽。`;

    const modalBodyHtml = `
      <h3 class="modal-title" style="color:var(--color-success);">📤 分享售後收款進度</h3>
      <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:20px; line-height:1.5;">
        匯總售後收款數據（合約總額、已開票、未開票與遞延金額），並<strong>自動遮蔽成本資料</strong>，方便呈報給老闆。
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="glass-panel" style="padding: 16px; border-radius: var(--border-radius-md);">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <span>📋</span> LINE / 郵件文字報告
          </h4>
          <textarea class="form-control" rows="5" readonly style="font-family:monospace; font-size:0.8rem; background-color:#020617; border-color:#334155; margin-bottom:12px;">${reportText}</textarea>
          <button class="btn btn-success btn-sm" id="btn-copy-postsales-text" style="width:100%; background-color:var(--color-success);">
            複製收款報告文字
          </button>
        </div>

        <div class="glass-panel" style="padding: 16px; border-radius: var(--border-radius-md);">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <span>🖼️</span> 產生 A4 收款分析圖卡 (PDF)
          </h4>
          <button class="btn btn-primary btn-sm" id="btn-print-postsales-card" style="width:100%;">
            開啟列印/另存 PDF 頁面
          </button>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:24px;">
        <button class="btn btn-outline-primary btn-sm" id="btn-close-share-modal">關閉</button>
      </div>

      <!-- Hidden Print Container -->
      <div id="print-postsales-card" style="display:none;">
        <div style="padding: 40px; font-family: 'Noto Sans TC', sans-serif; color: #000; background: #fff; width: 210mm; min-height: 297mm; box-sizing: border-box;">
          <div style="border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
              <h1 style="margin:0; font-size: 2.2rem; font-weight:900; color: #059669;">BIZFLOW HUB 售後收款合約報告</h1>
              <p style="margin: 5px 0 0; font-size: 0.9rem; color: #666;">收款執行明細 • 已排除內部預算與成本</p>
            </div>
            <div style="text-align:right; font-size:0.85rem; color:#666;">
              匯出日期：${new Date().toLocaleDateString()}<br>
              報告狀態：收款進度分析
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

          <h3 style="border-bottom: 2px solid #059669; padding-bottom: 8px; color: #065f46; font-size: 1.25rem;">💸 合約開票與收款進度明細</h3>
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
              ${allProjects.map(p => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 10px; font-weight:700;">${p.clientProjectName}</td>
                  <td style="padding: 12px 10px;">${p.poDate}</td>
                  <td style="padding: 12px 10px; font-weight:700;">${p.totalAmount} 萬</td>
                  <td style="padding: 12px 10px; color:#059669;">${p.invoicedAmount} 萬</td>
                  <td style="padding: 12px 10px; color:#4b5563;">${p.uninvoicedAmount} 萬</td>
                  <td style="padding: 12px 10px; font-weight:600;">${translateIncomeStatus(p.incomeStatus)}</td>
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

    document.getElementById('btn-copy-postsales-text').addEventListener('click', () => {
      navigator.clipboard.writeText(reportText).then(() => {
        showToast('已複製收款報告文字！', 'success');
      });
    });

    document.getElementById('btn-print-postsales-card').addEventListener('click', () => {
      const printContents = document.getElementById('print-postsales-card').innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>BizFlow Hub 售後收款報告</title>
            <style>
              body { margin: 0; padding: 0; background: #fff; }
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
}

function translateIncomeStatus(status) {
  const mapping = {
    'UNINVOICED': '未開票',
    'PARTIAL': '部分收款',
    'FULLY_INVOED': '已全開票',
    'FULLY_PAID': '已全收款',
    'CLOSED': '已結案'
  };
  return mapping[status] || status;
}

function getStatusBadgeClass(status) {
  const mapping = {
    'UNINVOICED': 'badge-danger',
    'PARTIAL': 'badge-warning',
    'FULLY_INVOED': 'badge-info',
    'FULLY_PAID': 'badge-success',
    'CLOSED': 'badge-primary'
  };
  return mapping[status] || 'badge-primary';
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
