// Pre-sales Module View
import { getPreSales, savePreSale, deletePreSale, savePostSale, getCards, saveCard } from '../db.js';
import { showToast, showModal, closeModal } from '../app.js';
import { openAddCardUploader } from './cardsView.js';

let currentLayout = 'board'; // 'board' or 'list'

export function renderPreSales(containerId, navigateToView) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const projects = getPreSales();

  // Render view template
  container.innerHTML = `
    <div class="fade-in">
      <div class="panel-header" style="margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div class="view-header-actions" style="flex-wrap: wrap; gap: 10px;">
          <button class="btn btn-primary" id="add-presale-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            開發專案
          </button>
          
          <button class="btn btn-outline-primary" id="presales-add-card-btn" style="height: 42px; border-color: var(--color-primary); color: var(--color-primary); font-weight:700;">
            🪪 快速掃描名片
          </button>

          <button class="btn btn-outline-primary" id="presales-share-btn" style="height: 42px; border-color: var(--color-primary); color: var(--color-primary); font-weight:700;">
            📤 分享開發進度
          </button>
          
          <div class="view-toggle-bar">
            <div class="toggle-tab ${currentLayout === 'board' ? 'active' : ''}" id="layout-board-tab">看板檢視</div>
            <div class="toggle-tab ${currentLayout === 'list' ? 'active' : ''}" id="layout-list-tab">列表檢視</div>
          </div>
        </div>
        
        <div style="position: relative; width: 260px;">
          <input type="text" class="form-control" id="presales-search" placeholder="搜尋專案名稱/產品..." style="padding-left: 36px; height: 38px;">
          <svg style="position: absolute; left: 12px; top: 11px; color: var(--color-text-muted);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
      </div>

      <!-- Main Contents Container -->
      <div id="presales-content-area"></div>
    </div>
  `;

  // Attach top triggers
  document.getElementById('layout-board-tab').addEventListener('click', () => {
    currentLayout = 'board';
    document.getElementById('layout-board-tab').classList.add('active');
    document.getElementById('layout-list-tab').classList.remove('active');
    renderContents();
  });

  document.getElementById('layout-list-tab').addEventListener('click', () => {
    currentLayout = 'list';
    document.getElementById('layout-list-tab').classList.add('active');
    document.getElementById('layout-board-tab').classList.remove('active');
    renderContents();
  });

  document.getElementById('add-presale-btn').addEventListener('click', () => {
    openPresaleForm();
  });

  // Rapid business card scan from Pre-sales page
  document.getElementById('presales-add-card-btn').addEventListener('click', () => {
    openAddCardUploader((savedCard) => {
      openPresaleForm(null, savedCard);
    });
  });

  // Pre-sales share button
  document.getElementById('presales-share-btn').addEventListener('click', () => {
    openPresalesShareModal(projects);
  });

  const searchInput = document.getElementById('presales-search');
  searchInput.addEventListener('input', () => {
    renderContents(searchInput.value.trim().toLowerCase());
  });

  // Initial Content Render
  renderContents();

  // Internal function to render based on layout & filter
  function renderContents(filterText = '') {
    const contentArea = document.getElementById('presales-content-area');
    const filteredProjects = projects.filter(p => {
      return p.name.toLowerCase().includes(filterText) ||
             p.productInfo.toLowerCase().includes(filterText) ||
             (p.description && p.description.toLowerCase().includes(filterText));
    });

    if (currentLayout === 'board') {
      renderBoard(contentArea, filteredProjects);
    } else {
      renderList(contentArea, filteredProjects);
    }
  }

  // ==========================================
  // RENDER KANBAN BOARD
  // ==========================================
  function renderBoard(element, items) {
    const statuses = [
      { code: 'PROSPECTING', label: '開發中' },
      { code: 'PROPOSAL', label: '提案中' },
      { code: 'QUOTING', label: '報價中' },
      { code: 'NEGOTIATING', label: '議約中' },
      { code: 'WON', label: '已成交 (WON)' },
      { code: 'LOST', label: '未成交 (LOST)' }
    ];

    let html = `<div class="kanban-board">`;
    
    statuses.forEach(status => {
      const statusItems = items.filter(p => p.status === status.code);
      html += `
        <div class="kanban-column" data-status="${status.code}">
          <div class="column-title-bar">
            <span class="column-title">${status.label}</span>
            <span class="column-count">${statusItems.length}</span>
          </div>
          <div class="kanban-cards" id="column-${status.code}">
            ${statusItems.map(p => {
              let riskBadge = '';
              if (p.riskLevel === 'HIGH') riskBadge = `<span class="risk-badge high">高風險</span>`;
              else if (p.riskLevel === 'MEDIUM') riskBadge = `<span class="risk-badge medium">中風險</span>`;
              else riskBadge = `<span class="risk-badge normal">正常</span>`;

              const showWallet = p.status === 'WON' && !p.transferred;

              return `
                <div class="kanban-card glass-panel" data-id="${p.id}">
                  <div class="card-project-name">${escapeHtml(p.name)}</div>
                  <div class="card-product-info">${escapeHtml(p.productInfo)}</div>
                  <div class="card-amount-date">
                    <span class="card-amount">${p.estAmount} 萬</span>
                    <span class="card-date">${p.estPoDate}</span>
                  </div>
                  <div class="card-footer">
                    ${riskBadge}
                    ${showWallet ? `
                      <div class="wallet-transfer-wrapper" title="一鍵拋轉至售後收款系統">
                        <button class="wallet-btn" data-transfer-id="${p.id}">💸</button>
                      </div>
                    ` : p.transferred ? `<span class="badge badge-success">已拋轉</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    element.innerHTML = html;

    // Attach card click for details / edit
    element.querySelectorAll('.kanban-card').forEach(card => {
      if (card.querySelector('.wallet-btn')) return;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.wallet-btn')) return;
        const id = card.dataset.id;
        openPresaleForm(id);
      });
    });

    // Attach wallet button trigger
    element.querySelectorAll('.wallet-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.transferId;
        openTransferModal(id);
      });
    });
  }

  // ==========================================
  // RENDER TABLE LIST
  // ==========================================
  function renderList(element, items) {
    if (items.length === 0) {
      element.innerHTML = `
        <div class="table-container" style="padding: 40px; text-align: center; color: var(--color-text-muted);">
          沒有符合搜尋條件的專案
        </div>
      `;
      return;
    }

    element.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>項目名稱</th>
              <th>產品進度資訊</th>
              <th>預計 PO 日期</th>
              <th>預計金額 ($萬)</th>
              <th>風險標記</th>
              <th>狀態</th>
              <th style="width: 120px; text-align: center;">拋轉 / 操作</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(p => {
              let riskBadge = '';
              if (p.riskLevel === 'HIGH') riskBadge = `<span class="risk-badge high">高風險</span>`;
              else if (p.riskLevel === 'MEDIUM') riskBadge = `<span class="risk-badge medium">中風險</span>`;
              else riskBadge = `<span class="risk-badge normal">正常</span>`;

              let statusBadge = '';
              if (p.status === 'WON') statusBadge = `<span class="badge badge-success">已成交</span>`;
              else if (p.status === 'LOST') statusBadge = `<span class="badge badge-danger">未成交</span>`;
              else if (p.status === 'NEGOTIATING') statusBadge = `<span class="badge badge-warning">議約中</span>`;
              else statusBadge = `<span class="badge badge-primary">${translateStatus(p.status)}</span>`;

              const showWallet = p.status === 'WON' && !p.transferred;

              return `
                <tr style="cursor: pointer;" data-id="${p.id}" class="presale-row">
                  <td class="table-project-name">${escapeHtml(p.name)}</td>
                  <td class="table-product-info" title="${escapeHtml(p.productInfo)}">${escapeHtml(p.productInfo)}</td>
                  <td style="font-family: monospace;">${p.estPoDate}</td>
                  <td style="font-weight: 700;">${p.estAmount} 萬</td>
                  <td>${riskBadge}</td>
                  <td>${statusBadge}</td>
                  <td align="center" style="display: flex; justify-content: center; gap: 12px; height: 100%;">
                    ${showWallet ? `
                      <button class="wallet-btn" data-transfer-id="${p.id}" title="一鍵拋轉至售後收款系統">💸</button>
                    ` : p.transferred ? `<span class="badge badge-success" style="font-size:0.7rem;">已開單</span>` : ''}
                    <button class="action-icon-btn delete" data-delete-id="${p.id}" title="刪除專案" style="margin-left: 6px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Row click for edit
    element.querySelectorAll('.presale-row').forEach(row => {
      if (row.querySelector('.wallet-btn')) return;
      row.addEventListener('click', (e) => {
        if (e.target.closest('.wallet-btn') || e.target.closest('.delete')) return;
        const id = row.dataset.id;
        openPresaleForm(id);
      });
    });

    // Wallet click
    element.querySelectorAll('.wallet-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.transferId;
        openTransferModal(id);
      });
    });

    // Delete click
    element.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (confirm('確定要刪除此售前開發專案嗎？此動作將無法還原。')) {
          deletePreSale(id);
          showToast('已刪除售前開發專案', 'warning');
          renderPreSales(containerId, navigateToView);
        }
      });
    });
  }

  // ==========================================
  // EDIT / ADD MODAL FORM RENDER
  // ==========================================
  function openPresaleForm(id = null, prefilledCard = null) {
    const isEdit = id !== null;
    const cards = getCards();
    
    const project = isEdit ? projects.find(p => p.id === id) : {
      name: prefilledCard ? `${prefilledCard.company} - ${prefilledCard.name}專案` : '',
      productInfo: prefilledCard ? `已取得產品需求，正與 ${prefilledCard.title} ${prefilledCard.name} 洽談中。\n聯絡電話: ${prefilledCard.phone}\n聯絡信箱: ${prefilledCard.email}` : '',
      estPoDate: new Date().toISOString().split('T')[0],
      estAmount: '',
      description: prefilledCard ? `【名片聯絡人資訊】\n職稱: ${prefilledCard.title}\n電話: ${prefilledCard.phone}\n信箱: ${prefilledCard.email}\n備註: ${prefilledCard.notes || ''}` : '',
      cost: '',
      riskLevel: 'NORMAL',
      status: 'PROSPECTING'
    };

    const linkedCard = prefilledCard || (isEdit ? cards.find(c => c.associatedProjectId === project.id) : null);

    const modalBodyHtml = `
      <h3 class="modal-title">${isEdit ? '📝 編輯售前專案' : '💼 新增售前專案'}</h3>
      
      <!-- Card Selector dropdown to autofill fields (Insert from card holder) -->
      ${!isEdit && !prefilledCard ? `
        <div class="form-group" style="background-color:rgba(99,102,241,0.06); padding:12px; border-radius:var(--border-radius-md); border:1px dashed var(--color-primary); margin-bottom: 20px;">
          <label style="font-weight:700; font-size:0.8rem; display:flex; align-items:center; gap:6px;">
            <span>🪪</span> 匯入現有聯絡人名片資料（插入建立客戶訊息）
          </label>
          <select class="form-control" id="form-import-card" style="margin-top:8px; font-size:0.8rem; height:34px; padding:4px 8px;">
            <option value="">-- 點選名片載入資訊 --</option>
            ${cards.map(c => `<option value="${c.id}">${escapeHtml(c.company)} - ${escapeHtml(c.name)} (${escapeHtml(c.title)})</option>`).join('')}
          </select>
        </div>
      ` : ''}

      <form id="presale-form">
        <input type="hidden" id="form-linked-card-id" value="${linkedCard ? linkedCard.id : ''}">
        
        <div class="form-group">
          <label for="form-name">項目名稱 <span style="color:var(--color-danger)">*</span></label>
          <input type="text" class="form-control" id="form-name" required value="${escapeHtml(project.name)}" placeholder="請輸入專案名稱，例如：台積電物聯網案">
        </div>
        
        <div class="form-group">
          <label for="form-product">產品進度資訊 (可自由輸入進度) <span style="color:var(--color-danger)">*</span></label>
          <textarea class="form-control" id="form-product" rows="3" required placeholder="請描述銷售進度與產品細節，如：規格已確認、報價送審中...">${escapeHtml(project.productInfo)}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="form-date">預計 PO 日期 <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-control" id="form-date" required value="${project.estPoDate}">
          </div>
          <div class="form-group">
            <label for="form-amount">預計金額 (萬元) <span style="color:var(--color-danger)">*</span></label>
            <input type="number" step="0.1" class="form-control" id="form-amount" required value="${project.estAmount}" placeholder="請輸入金額，例如：150">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="form-cost">預估成本 (萬元)</label>
            <input type="number" step="0.1" class="form-control" id="form-cost" value="${project.cost || ''}" placeholder="請輸入預估成本">
          </div>
          <div class="form-group">
            <label for="form-risk">風險困難點 (標籤)</label>
            <select class="form-control" id="form-risk">
              <option value="NORMAL" ${project.riskLevel === 'NORMAL' ? 'selected' : ''}>正常 (綠色)</option>
              <option value="MEDIUM" ${project.riskLevel === 'MEDIUM' ? 'selected' : ''}>中風險 (黃色)</option>
              <option value="HIGH" ${project.riskLevel === 'HIGH' ? 'selected' : ''}>高風險 (紅色)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="form-status">專案開發階段</label>
          <select class="form-control" id="form-status">
            <option value="PROSPECTING" ${project.status === 'PROSPECTING' ? 'selected' : ''}>開發中 (Prospecting)</option>
            <option value="PROPOSAL" ${project.status === 'PROPOSAL' ? 'selected' : ''}>提案中 (Proposal)</option>
            <option value="QUOTING" ${project.status === 'QUOTING' ? 'selected' : ''}>報價中 (Quoting)</option>
            <option value="NEGOTIATING" ${project.status === 'NEGOTIATING' ? 'selected' : ''}>議約中 (Negotiating)</option>
            <option value="WON" ${project.status === 'WON' ? 'selected' : ''}>已成交 (WON)</option>
            <option value="LOST" ${project.status === 'LOST' ? 'selected' : ''}>未成交 (LOST)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="form-desc">專案說明 / 利潤評估說明</label>
          <textarea class="form-control" id="form-desc" rows="3" placeholder="其他專案背景資訊與細節...">${escapeHtml(project.description || '')}</textarea>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; flex-wrap:wrap; gap:12px;">
          <div>
            ${isEdit ? `
              <button type="button" class="btn btn-outline-primary btn-sm" id="btn-generate-followup" style="border-color: var(--color-primary); color: var(--color-primary); font-weight:700;">
                💬 建立客戶跟進訊息
              </button>
            ` : ''}
          </div>
          <div style="display: flex; gap: 12px;">
            <button type="button" class="btn btn-outline-primary" id="btn-cancel-modal">取消</button>
            <button type="submit" class="btn btn-primary">儲存專案</button>
          </div>
        </div>
      </form>
    `;

    showModal(modalBodyHtml);

    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
    
    // Bind existing card selector autofill
    if (!isEdit && !prefilledCard) {
      const cardSelect = document.getElementById('form-import-card');
      cardSelect.addEventListener('change', () => {
        const cardId = cardSelect.value;
        if (!cardId) return;
        const selectedCard = cards.find(c => c.id === cardId);
        if (selectedCard) {
          document.getElementById('form-name').value = `${selectedCard.company} - ${selectedCard.name}專案`;
          document.getElementById('form-product').value = `已取得產品需求，正與 ${selectedCard.title} ${selectedCard.name} 洽談中。\n聯絡電話: ${selectedCard.phone}\n聯絡信箱: ${selectedCard.email}`;
          document.getElementById('form-desc').value = `【名片聯絡人資訊】\n職稱: ${selectedCard.title}\n電話: ${selectedCard.phone}\n信箱: ${selectedCard.email}\n備註: ${selectedCard.notes || ''}`;
          document.getElementById('form-linked-card-id').value = selectedCard.id;
          showToast(`已成功插入名片聯絡人 「${selectedCard.name}」 的客戶資訊！`, 'success');
        }
      });
    }

    // Bind custom followup messages creation
    if (isEdit) {
      document.getElementById('btn-generate-followup').addEventListener('click', () => {
        let clientName = '客戶經理';
        let clientTitle = '窗口';
        let clientCompany = '貴公司';
        
        if (linkedCard) {
          clientName = linkedCard.name;
          clientTitle = linkedCard.title;
          clientCompany = linkedCard.company;
        }

        const greetingMsg = `您好，我是 BizFlow Hub 的業務負責人。

感謝您前陣子撥冗就專案細節進行溝通。關於我們正積極配合推進的合作項目「${project.name}」，我們已彙整了相關的服務時程與方案規格。

專案目前進展與產品明細：
${project.productInfo}

我們預計於近期召開一場約 15 分鐘的簡單進度確認通話，以配合貴司預期的簽約時程（簽約目標日期：${project.estPoDate}）。
下週二或下週三下午是否有合適空檔能方便召開線上通話呢？

祝 順心，
業務負責人 敬上`;

        const msgModalHtml = `
          <h3 class="modal-title" style="color:var(--color-primary);">💬 建立客戶跟進/合約確認訊息</h3>
          <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:12px; line-height:1.5;">
            已自動為您匯入名片聯絡人資訊並生成客戶跟進簡報。<strong>成本利潤等內部敏感資訊已自動排除。</strong>
          </div>
          <textarea class="form-control" rows="8" readonly style="font-size:0.85rem; line-height:1.5; background-color:#020617; border-color:#334155; margin-bottom:16px; font-family:monospace;">${greetingMsg}</textarea>
          <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button class="btn btn-outline-primary btn-sm" id="btn-close-msg-modal">返回編輯專案</button>
            <button class="btn btn-success btn-sm" id="btn-copy-msg-text" style="background-color:var(--color-success);">📋 一鍵複製文字</button>
          </div>
        `;

        showModal(msgModalHtml);
        
        document.getElementById('btn-close-msg-modal').addEventListener('click', () => {
          openPresaleForm(project.id);
        });

        document.getElementById('btn-copy-msg-text').addEventListener('click', () => {
          navigator.clipboard.writeText(greetingMsg).then(() => {
            showToast('已成功複製客戶對話訊息！', 'success');
          });
        });
      });
    }

    // Submit handler
    document.getElementById('presale-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const updated = {
        ...project,
        name: document.getElementById('form-name').value.trim(),
        productInfo: document.getElementById('form-product').value.trim(),
        estPoDate: document.getElementById('form-date').value,
        estAmount: Number(document.getElementById('form-amount').value),
        cost: document.getElementById('form-cost').value ? Number(document.getElementById('form-cost').value) : '',
        riskLevel: document.getElementById('form-risk').value,
        status: document.getElementById('form-status').value,
        description: document.getElementById('form-desc').value.trim()
      };

      const isNewWon = updated.status === 'WON' && project.status !== 'WON';

      const savedProj = savePreSale(updated);
      
      const linkedCardId = document.getElementById('form-linked-card-id').value;
      if (linkedCardId) {
        const cardToUpdate = cards.find(c => c.id === linkedCardId);
        if (cardToUpdate) {
          cardToUpdate.associatedProjectId = savedProj.id;
          saveCard(cardToUpdate);
        }
      }

      closeModal();
      
      if (isNewWon) {
        showToast('專案已成交！已為您準備一鍵拋轉按鈕。', 'success');
        setTimeout(() => {
          const latestItems = getPreSales();
          const target = latestItems.find(p => p.name === updated.name && p.status === 'WON');
          if (target) {
            openTransferModal(target.id);
          }
        }, 300);
      } else {
        showToast('售前專案已成功儲存', 'success');
      }

      renderPreSales(containerId, navigateToView);
    });
  }

  // ==========================================
  // SMART WON-TRANSFER MODAL (💸)
  // ==========================================
  function openTransferModal(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const poDateObj = new Date(project.estPoDate);
    poDateObj.setMonth(poDateObj.getMonth() + 3);
    const defaultCompletionDate = poDateObj.toISOString().split('T')[0];

    const modalBodyHtml = `
      <h3 class="modal-title" style="color:var(--color-success);">✨ 智慧一鍵成交拋轉中...</h3>
      <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 20px; line-height:1.5;">
        系統將為您自動將此售前成交的專案建立為**售後收款追蹤單**。資料將跨模組串接，無需重複輸入！
      </div>

      <div class="transfer-preview-box">
        <div class="preview-item">
          <span class="preview-label">已簽約項目 (客戶項目名稱)</span>
          <span class="preview-value">${escapeHtml(project.name)}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">PO 簽約日期</span>
          <span class="preview-value">${project.estPoDate}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">合約總金額</span>
          <span class="preview-value">${project.estAmount} 萬元</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">專案來源代碼</span>
          <span class="preview-value">${project.id}</span>
        </div>
      </div>

      <form id="transfer-confirm-form">
        <div class="form-row">
          <div class="form-group">
            <label for="transfer-comp-date">預計完驗日期 <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-control" id="transfer-comp-date" required value="${defaultCompletionDate}">
          </div>
          <div class="form-group">
            <label for="transfer-deferred">遞延認列金額 (Y+1 $萬)</label>
            <input type="number" step="0.1" class="form-control" id="transfer-deferred" value="0" placeholder="跨年認列，無請填 0">
          </div>
        </div>

        <div class="form-group">
          <label for="transfer-invoiced">首期已開票金額 ($萬)</label>
          <input type="number" step="0.1" class="form-control" id="transfer-invoiced" value="0" placeholder="若尚未開票，請填 0">
          <span style="font-size:0.75rem; color:var(--color-text-muted)">備註：未開票金額將全自動由公式扣減（合約總金額 - 已開票）。</span>
        </div>

        <div class="form-group">
          <label for="transfer-desc">收款說明與合約備註</label>
          <textarea class="form-control" id="transfer-desc" rows="2" placeholder="請填寫此合約的收款備註與拆期開票規則...">${escapeHtml(project.description || '')}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" class="btn btn-outline-primary" id="btn-cancel-transfer">取消拋轉</button>
          <button type="submit" class="btn btn-success" style="box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);">🚀 確認拋轉至收款系統</button>
        </div>
      </form>
    `;

    showModal(modalBodyHtml);

    document.getElementById('btn-cancel-transfer').addEventListener('click', closeModal);

    document.getElementById('transfer-confirm-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const deferred = Number(document.getElementById('transfer-deferred').value || 0);
      const invoiced = Number(document.getElementById('transfer-invoiced').value || 0);
      const compDate = document.getElementById('transfer-comp-date').value;
      const desc = document.getElementById('transfer-desc').value.trim();

      const postsaleItem = {
        clientProjectName: project.name,
        poDate: project.estPoDate,
        completionDate: compDate,
        totalAmount: project.estAmount,
        description: desc,
        invoicedAmount: invoiced,
        deferredAmount: deferred,
        helpNeeded: false,
        helpDescription: '',
        incomeStatus: invoiced > 0 ? (invoiced === project.estAmount ? 'FULLY_INVOED' : 'PARTIAL') : 'UNINVOICED',
        closingDate: '',
        sourcePresalesId: project.id
      };

      savePostSale(postsaleItem);

      project.transferred = true;
      savePreSale(project);

      closeModal();
      showToast('🎉 專案成功拋轉至售後收款系統！', 'success');

      setTimeout(() => {
        navigateToView('postsales');
        setTimeout(() => {
          const rows = document.querySelectorAll('.data-table tbody tr');
          const newRow = Array.from(rows).find(row => row.querySelector('.table-project-name')?.textContent === project.name);
          if (newRow) {
            newRow.classList.add('highlight');
            newRow.style.boxShadow = '0 0 15px var(--color-success)';
            newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              newRow.style.boxShadow = '';
              newRow.classList.remove('highlight');
            }, 2500);
          }
        }, 200);
      }, 500);
    });
  }

  // ==========================================
  // SHARE PRE-SALES PIPELINE MODAL
  // ==========================================
  function openPresalesShareModal(allProjects) {
    const activePresales = allProjects.filter(p => p.status !== 'WON' && p.status !== 'LOST');
    const totalEstAmount = activePresales.reduce((sum, p) => sum + Number(p.estAmount || 0), 0);

    const reportText = `📊 【BizFlow 售前開發進度報告】
報告時間：${new Date().toLocaleString()}

📈 售前開發漏斗摘要：
• 開發中專案總數：${activePresales.length} 筆
• 預估簽約總金額：NT$ ${totalEstAmount} 萬元

💼 開發中專案明細：
${activePresales.map((p, i) => `${i + 1}. [${translateStatus(p.status)}] ${p.name}\n   預估金額: NT$ ${p.estAmount} 萬元 | 預計簽約: ${p.estPoDate}`).join('\n')}

---
報告由 BizFlow Hub 業務管理系統自動生成，機密資料已自動遮蔽。`;

    const modalBodyHtml = `
      <h3 class="modal-title">📤 分享售前開發進度</h3>
      <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:20px; line-height:1.5;">
        匯總售前漏斗數據（開發專案數、預計金額與時間），<strong>自動遮蔽成本資料</strong>，方便呈報給老闆。
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="glass-panel" style="padding: 16px; border-radius: var(--border-radius-md);">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <span>📋</span> LINE / 郵件文字報告
          </h4>
          <textarea class="form-control" rows="5" readonly style="font-family:monospace; font-size:0.8rem; background-color:#020617; border-color:#334155; margin-bottom:12px;">${reportText}</textarea>
          <button class="btn btn-primary btn-sm" id="btn-copy-presales-text" style="width:100%;">
            複製售前報告文字
          </button>
        </div>

        <div class="glass-panel" style="padding: 16px; border-radius: var(--border-radius-md);">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
            <span>🖼️</span> 產生 A4 開發進度圖卡 (PDF)
          </h4>
          <button class="btn btn-success btn-sm" id="btn-print-presales-card" style="width:100%; background-color:var(--color-success);">
            開啟列印/另存 PDF 頁面
          </button>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:24px;">
        <button class="btn btn-outline-primary btn-sm" id="btn-close-share-modal">關閉</button>
      </div>

      <!-- Hidden Print Container -->
      <div id="print-presales-card" style="display:none;">
        <div style="padding: 40px; font-family: 'Noto Sans TC', sans-serif; color: #000; background: #fff; width: 210mm; min-height: 297mm; box-sizing: border-box;">
          <div style="border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
              <h1 style="margin:0; font-size: 2.2rem; font-weight:900; color: #3b82f6;">BIZFLOW HUB 售前開發進度報告</h1>
              <p style="margin: 5px 0 0; font-size: 0.9rem; color: #666;">開發專案漏斗 • 已排除內部預算成本</p>
            </div>
            <div style="text-align:right; font-size:0.85rem; color:#666;">
              匯出日期：${new Date().toLocaleDateString()}<br>
              報告狀態：開發進度匯總
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color:#f8fafc;">
              <span style="font-size: 0.85rem; color:#666; font-weight:700;">開發中專案總數</span>
              <h2 style="margin:10px 0 0; font-size: 2rem; color:#3b82f6; font-weight:900;">${activePresales.length} <span style="font-size:1rem;">筆</span></h2>
            </div>
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color:#f8fafc;">
              <span style="font-size: 0.85rem; color:#666; font-weight:700;">預估簽約總金額</span>
              <h2 style="margin:10px 0 0; font-size: 2rem; color:#8b5cf6; font-weight:900;">${totalEstAmount} <span style="font-size:1rem;">萬元</span></h2>
            </div>
          </div>

          <h3 style="border-bottom: 2px solid #3b82f6; padding-bottom: 8px; color: #1e3b8a; font-size: 1.25rem;">💼 潛在開發專案清單</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size:0.9rem;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align:left;">
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">項目名稱</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">產品進度資訊</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">預估 PO 日期</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">預計金額</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">開發階段</th>
              </tr>
            </thead>
            <tbody>
              ${activePresales.map(p => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 10px; font-weight:700;">${p.name}</td>
                  <td style="padding: 12px 10px; color:#4b5563;">${p.productInfo}</td>
                  <td style="padding: 12px 10px;">${p.estPoDate}</td>
                  <td style="padding: 12px 10px; font-weight:700; color:#8b5cf6;">${p.estAmount} 萬</td>
                  <td style="padding: 12px 10px; font-weight:600;">${translateStatus(p.status)}</td>
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

    document.getElementById('btn-copy-presales-text').addEventListener('click', () => {
      navigator.clipboard.writeText(reportText).then(() => {
        showToast('已複製售前報告文字！', 'success');
      });
    });

    document.getElementById('btn-print-presales-card').addEventListener('click', () => {
      const printContents = document.getElementById('print-presales-card').innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>BizFlow Hub 售前開發報告</title>
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

function translateStatus(status) {
  const mapping = {
    'PROSPECTING': '開發中',
    'PROPOSAL': '提案中',
    'QUOTING': '報價中',
    'NEGOTIATING': '議約中',
    'WON': '已成交 (WON)',
    'LOST': '未成交 (LOST)'
  };
  return mapping[status] || status;
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
