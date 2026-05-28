// Business Cards Hub View Module - Renamed to Customer Directory (客戶資料管理)
import { getCards, saveCard, deleteCard, getPreSales, savePreSale, getPostSales, savePostSale } from '../db.js';
import { showToast, showModal, closeModal } from '../app.js';

export function renderCards(containerId, navigateToView) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cards = getCards();
  const presales = getPreSales();
  const postsales = getPostSales();

  container.innerHTML = `
    <div class="fade-in">
      <div class="panel-header" style="margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div class="view-header-actions" style="flex-wrap: wrap; gap: 10px;">
          <button class="btn btn-primary" id="add-card-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            ➕ 新增客戶資料 (名片掃描)
          </button>
        </div>
        
        <div style="position: relative; width: 280px;">
          <input type="text" class="form-control" id="cards-search" placeholder="搜尋客戶姓名/公司/職稱/電話..." style="padding-left: 36px; height: 38px;">
          <svg style="position: absolute; left: 12px; top: 11px; color: var(--color-text-muted);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
      </div>

      <!-- Cards Grid Wall -->
      <div class="cards-grid" id="cards-content-grid">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;

  // Attach search and add
  document.getElementById('add-card-btn').addEventListener('click', () => {
    openAddCardUploader(() => {
      renderCards(containerId, navigateToView);
    });
  });

  const searchInput = document.getElementById('cards-search');
  searchInput.addEventListener('input', () => {
    renderGrid(searchInput.value.trim().toLowerCase());
  });

  // Initial grid render
  renderGrid();

  // ==========================================
  // RENDER GRID WALL
  // ==========================================
  function renderGrid(filterText = '') {
    const grid = document.getElementById('cards-content-grid');
    const filteredCards = cards.filter(c => {
      return c.name.toLowerCase().includes(filterText) ||
             c.company.toLowerCase().includes(filterText) ||
             c.title.toLowerCase().includes(filterText) ||
             (c.phone && c.phone.toLowerCase().includes(filterText)) ||
             (c.notes && c.notes.toLowerCase().includes(filterText));
    });

    if (filteredCards.length === 0) {
      grid.innerHTML = `
        <div class="glass-panel" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--color-text-muted);">
          目前沒有符合的客戶資料
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredCards.map((c, index) => {
      const theme = index % 2 === 0 ? 'theme-dark' : 'theme-light';
      
      return `
        <div class="business-card-item ${theme}" data-card-id="${c.id}">
          <div class="card-top">
            <span class="card-company">${escapeHtml(c.company)}</span>
            <div class="card-logo-placeholder"></div>
          </div>
          
          <div class="card-middle">
            <span class="card-name">${escapeHtml(c.name)}</span>
            <div class="card-title">${escapeHtml(c.title)}</div>
          </div>
          
          <div class="card-bottom">
            <span>📞 ${escapeHtml(c.phone)}</span>
            <span>✉️ ${escapeHtml(c.email)}</span>
          </div>

          <!-- Card Hover actions overlay -->
          <div class="card-actions-overlay">
            <button class="action-icon-btn delete-card-btn" data-delete-id="${c.id}" title="刪除客戶資料">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach card click details
    grid.querySelectorAll('.business-card-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-card-btn')) return;
        const id = card.dataset.cardId;
        openCardDetails(id);
      });
    });

    // Delete card trigger
    grid.querySelectorAll('.delete-card-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (confirm('確定要刪除這筆客戶聯絡資料嗎？')) {
          deleteCard(id);
          showToast('已刪除客戶資料', 'warning');
          renderCards(containerId, navigateToView);
        }
      });
    });
  }

  // ==========================================
  // VIEW CUSTOMER DETAILS & LINK TO SALES STAGES
  // ==========================================
  function openCardDetails(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    // Get associated projects
    const associatedProj = presales.find(p => p.id === card.associatedProjectId);
    const associatedPost = postsales.find(p => p.clientProjectName.includes(card.company) || p.clientProjectName.includes(card.name) || p.sourcePresalesId === card.associatedProjectId);

    const modalBodyHtml = `
      <h3 class="modal-title">👤 客戶資料詳細資訊</h3>
      
      <!-- Big styled card display inside details -->
      <div class="business-card-item theme-dark" style="width:100%; max-width:400px; margin: 0 auto 24px; cursor:default; hover:none;">
        <div class="card-top">
          <span class="card-company" style="font-size:0.9rem;">${escapeHtml(card.company)}</span>
          <div class="card-logo-placeholder"></div>
        </div>
        <div class="card-middle">
          <span class="card-name" style="font-size:1.4rem;">${escapeHtml(card.name)}</span>
          <div class="card-title" style="font-size:0.85rem;">${escapeHtml(card.title)}</div>
        </div>
        <div class="card-bottom" style="font-size:0.8rem;">
          <span>📞 電話：${escapeHtml(card.phone)}</span>
          <span>✉️ 信箱：${escapeHtml(card.email)}</span>
        </div>
      </div>

      <form id="edit-card-form">
        <div class="form-row">
          <div class="form-group">
            <label for="detail-name">姓名</label>
            <input type="text" class="form-control" id="detail-name" required value="${escapeHtml(card.name)}">
          </div>
          <div class="form-group">
            <label for="detail-title">職稱</label>
            <input type="text" class="form-control" id="detail-title" value="${escapeHtml(card.title)}">
          </div>
        </div>

        <div class="form-group">
          <label for="detail-company">公司名稱</label>
          <input type="text" class="form-control" id="detail-company" required value="${escapeHtml(card.company)}">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="detail-phone">聯絡電話</label>
            <input type="text" class="form-control" id="detail-phone" value="${escapeHtml(card.phone)}">
          </div>
          <div class="form-group">
            <label for="detail-email">電子信箱</label>
            <input type="email" class="form-control" id="detail-email" value="${escapeHtml(card.email)}">
          </div>
        </div>

        <div class="form-group">
          <label for="detail-notes">聯絡備註 / 關係紀錄</label>
          <textarea class="form-control" id="detail-notes" rows="2" placeholder="記下與客戶交流的重要細節...">${escapeHtml(card.notes || '')}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>💼 關聯售前開發專案</label>
            <div style="margin-top: 4px;">
              ${associatedProj ? `
                <div style="font-size:0.85rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                  <span class="badge badge-primary">已連結</span> ${escapeHtml(associatedProj.name)}
                </div>
                <button type="button" class="btn btn-outline-primary btn-sm" id="btn-goto-associated-project" data-proj-id="${associatedProj.id}">
                  🔎 前往售前專案
                </button>
              ` : `
                <span style="font-size:0.8rem; color:var(--color-text-muted); display:block; margin-bottom:8px;">尚未連結售前專案</span>
                <button type="button" class="btn btn-primary btn-sm" id="btn-create-presale-from-card">
                  💼 建立售前專案
                </button>
              `}
            </div>
          </div>
          
          <div class="form-group">
            <label>💸 關聯售後收款合約</label>
            <div style="margin-top: 4px;">
              ${associatedPost ? `
                <div style="font-size:0.85rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                  <span class="badge badge-success">已連結</span> ${escapeHtml(associatedPost.clientProjectName)}
                </div>
                <button type="button" class="btn btn-outline-primary btn-sm" id="btn-goto-associated-post" data-post-id="${associatedPost.id}">
                  🔎 前往收款單
                </button>
              ` : `
                <span style="font-size:0.8rem; color:var(--color-text-muted); display:block; margin-bottom:8px;">尚未連結收款合約</span>
                <button type="button" class="btn btn-success btn-sm" id="btn-create-postsale-from-card" style="background-color: var(--color-success);">
                  💸 建立收款合約
                </button>
              `}
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-top: 10px;">
          <label for="detail-associate">手動綁定現有售前專案</label>
          <select class="form-control" id="detail-associate">
            <option value="">-- 無關聯專案 --</option>
            ${presales.map(p => `
              <option value="${p.id}" ${card.associatedProjectId === p.id ? 'selected' : ''}>
                ${escapeHtml(p.name)} (${p.status === 'WON' ? '已成交' : '開發中'})
              </option>
            `).join('')}
          </select>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px; border-top: 1px solid var(--color-border); padding-top:16px;">
          <button type="button" class="btn btn-outline-primary" id="btn-close-details">關閉</button>
          <button type="submit" class="btn btn-primary">💾 儲存客戶資料</button>
        </div>
      </form>
    `;

    showModal(modalBodyHtml);

    document.getElementById('btn-close-details').addEventListener('click', closeModal);

    // Goto associated Pre-sales project
    const gotoProjBtn = document.getElementById('btn-goto-associated-project');
    if (gotoProjBtn) {
      gotoProjBtn.addEventListener('click', () => {
        closeModal();
        navigateToView('presales');
        setTimeout(() => {
          const search = document.getElementById('presales-search');
          if (search) {
            search.value = associatedProj.name;
            search.dispatchEvent(new Event('input'));
          }
        }, 150);
      });
    }

    // Goto associated Post-sales contract
    const gotoPostBtn = document.getElementById('btn-goto-associated-post');
    if (gotoPostBtn) {
      gotoPostBtn.addEventListener('click', () => {
        closeModal();
        navigateToView('postsales');
        setTimeout(() => {
          const search = document.getElementById('postsales-search');
          if (search) {
            search.value = associatedPost.clientProjectName;
            search.dispatchEvent(new Event('input'));
          }
        }, 150);
      });
    }

    // Create Pre-sales from card
    const createPresaleBtn = document.getElementById('btn-create-presale-from-card');
    if (createPresaleBtn) {
      createPresaleBtn.addEventListener('click', () => {
        closeModal();
        navigateToView('presales');
        setTimeout(() => {
          openAddCardUploaderCallbackPresale(card);
        }, 150);
      });
    }

    // Create Post-sales from card
    const createPostsafeBtn = document.getElementById('btn-create-postsale-from-card');
    if (createPostsafeBtn) {
      createPostsafeBtn.addEventListener('click', () => {
        closeModal();
        navigateToView('postsales');
        setTimeout(() => {
          openAddCardUploaderCallbackPost(card);
        }, 150);
      });
    }

    document.getElementById('edit-card-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const updated = {
        ...card,
        name: document.getElementById('detail-name').value.trim(),
        title: document.getElementById('detail-title').value.trim(),
        company: document.getElementById('detail-company').value.trim(),
        phone: document.getElementById('detail-phone').value.trim(),
        email: document.getElementById('detail-email').value.trim(),
        notes: document.getElementById('detail-notes').value.trim(),
        associatedProjectId: document.getElementById('detail-associate').value
      };

      saveCard(updated);
      
      if (updated.associatedProjectId) {
        const proj = presales.find(p => p.id === updated.associatedProjectId);
        if (proj) {
          if (!proj.description.includes(updated.name)) {
            proj.description = `【聯絡人】${updated.name} (${updated.title}) - 電話: ${updated.phone}\n` + proj.description;
            savePreSale(proj);
          }
        }
      }

      closeModal();
      showToast('客戶資料已成功儲存！', 'success');
      renderCards(containerId, navigateToView);
    });
  }

  // Helpers to trigger populated add forms directly
  function openAddCardUploaderCallbackPresale(clientCard) {
    const addBtn = document.getElementById('add-presale-btn');
    if (addBtn) addBtn.click();
    setTimeout(() => {
      const formName = document.getElementById('form-name');
      const formDesc = document.getElementById('form-desc');
      const formProduct = document.getElementById('form-product');
      const formLinkedCard = document.getElementById('form-linked-card-id');
      
      if (formName) formName.value = `${clientCard.company} - ${clientCard.name}專案`;
      if (formProduct) formProduct.value = `與 ${clientCard.title} ${clientCard.name} 接洽中。電話: ${clientCard.phone}。`;
      if (formDesc) formDesc.value = `【名片聯絡人資訊】\n職稱: ${clientCard.title}\n電話: ${clientCard.phone}\n信箱: ${clientCard.email}\n備註: ${clientCard.notes || ''}`;
      if (formLinkedCard) formLinkedCard.value = clientCard.id;
    }, 300);
  }

  function openAddCardUploaderCallbackPost(clientCard) {
    const addBtn = document.getElementById('add-postsale-btn');
    if (addBtn) addBtn.click();
    setTimeout(() => {
      const formName = document.getElementById('post-form-name');
      const formDesc = document.getElementById('post-form-desc');
      
      if (formName) formName.value = `${clientCard.company} - ${clientCard.name}收款單`;
      if (formDesc) formDesc.value = `【名片聯絡人資訊】\n職稱: ${clientCard.title}\n電話: ${clientCard.phone}\n信箱: ${clientCard.email}\n備註: ${clientCard.notes || ''}`;
    }, 300);
  }
}

// ==========================================
// EXPORTED DROPZONE AND SCANNING ANIMATION (Global reusable uploader flow)
// ==========================================
export function openAddCardUploader(onCompleteCallback = null) {
  const modalBodyHtml = `
    <h3 class="modal-title">🪪 掃描客戶名片建立資料</h3>
    <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:20px;">
      拖放您的客戶名片圖片至下方，或直接點選模擬名片拍攝。系統將自動掃描辨識文字！
    </div>

    <div class="dropzone-container" id="card-dropzone">
      <div class="dropzone-icon">📷</div>
      <div class="dropzone-text">上傳客戶名片圖片 (拖放至此或點擊選取)</div>
      <div class="dropzone-subtext">支援 PNG, JPG 格式</div>
    </div>

    <div style="text-align:center; margin: 16px 0;">
      <span style="font-size:0.8rem; color:var(--color-text-muted);">— 或 —</span>
    </div>

    <div style="display:flex; justify-content:center;">
      <button class="btn btn-outline-primary" id="btn-mock-photo-scan">
        ✨ 模擬隨機相機拍照掃描
      </button>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-top:24px;">
      <button class="btn btn-outline-primary btn-sm" id="btn-cancel-uploader">取消</button>
    </div>
  `;

  showModal(modalBodyHtml);

  document.getElementById('btn-cancel-uploader').addEventListener('click', closeModal);
  
  const dropzone = document.getElementById('card-dropzone');
  dropzone.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        triggerScanningLaserAnimation(onCompleteCallback);
      }
    });
    fileInput.click();
  });

  document.getElementById('btn-mock-photo-scan').addEventListener('click', () => {
    triggerScanningLaserAnimation(onCompleteCallback);
  });
}

function triggerScanningLaserAnimation(onCompleteCallback) {
  const modalBodyHtml = `
    <h3 class="modal-title" style="color: #00e5ff; text-align:center;">🔍 AI 智慧名片辨識中...</h3>
    <div style="font-size:0.85rem; color:var(--color-text-muted); text-align:center; margin-bottom:20px;">
      光學字元辨識 (OCR) 引擎已啟動，正在解析公司商標與聯絡資訊...
    </div>

    <!-- Laser scan image box -->
    <div class="scan-container">
      <div style="padding: 24px; color:#aaa; font-family:sans-serif; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
        <div style="font-size:0.75rem; font-weight:700; border-bottom:1px solid #444; padding-bottom:8px;">
          [SCANNING BRAND LOGO...]
        </div>
        <div style="font-size:1.1rem; font-weight:800; text-align:center; color:#ddd; margin: 15px 0;">
          聯發科技股份有限公司<br>
          <span style="font-size:0.7rem; color:#888; font-weight:400;">MediaTek Inc.</span>
        </div>
        <div style="font-size:0.65rem; text-align:right; font-family:monospace;">
          TEL: 03-567-0708 | EMAIL: contacts@mediatek.com
        </div>
      </div>
      <div class="scan-laser-line"></div>
    </div>

    <div style="text-align:center; margin-top:20px; font-size:0.8rem; color:#00e5ff; font-family:monospace; animation:pulse-text 1s infinite alternate;">
      [DECODING TEXT BLOCKS...]
    </div>
  `;

  showModal(modalBodyHtml);

  setTimeout(() => {
    const mockResult = generateRandomClientCard();
    openAutofilledCardForm(mockResult, onCompleteCallback);
  }, 1800);
}

function openAutofilledCardForm(mockCard, onCompleteCallback) {
  const modalBodyHtml = `
    <h3 class="modal-title" style="color: var(--color-success);">✨ 客戶名片辨識完成！</h3>
    <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:16px;">
      辨識結果已自動代入以下欄位，確認無誤後即可存入您的客戶資料夾。
    </div>

    <form id="save-scanned-card-form">
      <div class="form-row">
        <div class="form-group">
          <label for="scan-name">姓名 <span style="color:var(--color-danger)">*</span></label>
          <input type="text" class="form-control" id="scan-name" required value="${escapeHtml(mockCard.name)}">
        </div>
        <div class="form-group">
          <label for="scan-title">職稱</label>
          <input type="text" class="form-control" id="scan-title" value="${escapeHtml(mockCard.title)}">
        </div>
      </div>

      <div class="form-group">
        <label for="scan-company">公司名稱 <span style="color:var(--color-danger)">*</span></label>
        <input type="text" class="form-control" id="scan-company" required value="${escapeHtml(mockCard.company)}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="scan-phone">聯絡電話</label>
          <input type="text" class="form-control" id="scan-phone" value="${escapeHtml(mockCard.phone)}">
        </div>
        <div class="form-group">
          <label for="scan-email">電子信箱</label>
          <input type="email" class="form-control" id="scan-email" value="${escapeHtml(mockCard.email)}">
        </div>
      </div>

      <div class="form-group">
        <label for="scan-notes">聯絡備註 / 關係紀錄</label>
        <textarea class="form-control" id="scan-notes" rows="2" placeholder="其他客戶背景備註...">${escapeHtml(mockCard.notes)}</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">
        <button type="button" class="btn btn-outline-primary" id="btn-cancel-scan-confirm">重新上傳</button>
        <button type="submit" class="btn btn-success" style="background-color: var(--color-success);">💾 確認儲存客戶資料</button>
      </div>
    </form>
  `;

  showModal(modalBodyHtml);

  document.getElementById('btn-cancel-scan-confirm').addEventListener('click', () => {
    openAddCardUploader(onCompleteCallback);
  });

  document.getElementById('save-scanned-card-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const finalCard = {
      name: document.getElementById('scan-name').value.trim(),
      title: document.getElementById('scan-title').value.trim(),
      company: document.getElementById('scan-company').value.trim(),
      phone: document.getElementById('scan-phone').value.trim(),
      email: document.getElementById('scan-email').value.trim(),
      notes: document.getElementById('scan-notes').value.trim(),
      associatedProjectId: ''
    };

    const saved = saveCard(finalCard);
    closeModal();
    showToast('🎉 客戶資料已成功存入資料夾！', 'success');

    if (onCompleteCallback) {
      onCompleteCallback(saved);
    }
  });
}

function generateRandomClientCard() {
  const companies = [
    '聯發科技股份有限公司',
    '大立光電股份有限公司',
    '台達電子工業股份有限公司',
    '鴻海精密工業股份有限公司',
    '緯創資通股份有限公司',
    '廣達電腦股份有限公司'
  ];

  const names = [
    { name: '陳建宏', title: '採購處 課長', email: 'jh_chen', domain: 'mediatek.com' },
    { name: '林秋雅', title: '研發三部 高級工程師', email: 'qiuy_lin', domain: 'largan.com.tw' },
    { name: '王明仁', title: '資訊處 協理', email: 'mr_wang', domain: 'deltaww.com' },
    { name: '郭家豪', title: '產品研發處 資深經理', email: 'jeff_kuo', domain: 'foxconn.com' },
    { name: '蔡依珊', title: '供應鏈管理部 專員', email: 'yishan_tsai', domain: 'wistron.com' }
  ];

  const selectedComp = companies[Math.floor(Math.random() * companies.length)];
  const selectedUser = names[Math.floor(Math.random() * names.length)];

  const phoneStr = `09${Math.floor(10 + Math.random() * 89)}-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}`;
  const emailStr = `${selectedUser.email}@${selectedUser.domain}`;

  return {
    name: selectedUser.name,
    title: selectedUser.title,
    company: selectedComp,
    phone: phoneStr,
    email: emailStr,
    notes: `由名片掃描解析建立。辨識時間：${new Date().toLocaleString()}`
  };
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
