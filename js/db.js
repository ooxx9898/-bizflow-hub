// Local Database Management using localStorage

const DB_KEYS = {
  PRE_SALES: 'bizflow_presales',
  POST_SALES: 'bizflow_postsales',
  CUSTOM_EVENTS: 'bizflow_custom_events',
  LOGS: 'bizflow_activity_logs',
  CARDS: 'bizflow_cards'
};

// Seed initial data if database is empty
const INITIAL_PRE_SALES = [
  {
    id: 'pre-1',
    name: '台積電 智慧物聯網升級專案',
    productInfo: '硬體閘道器 50 台 + MQTT 中介軟體平台 + 10人天顧問諮詢',
    estPoDate: '2026-06-15',
    estAmount: 180,
    description: '客戶評估舊有監控設備升級，預計本季底完成採購決策。利潤率預估 35%。',
    cost: 117,
    riskLevel: 'MEDIUM',
    status: 'NEGOTIATING',
    transferred: false,
    dateCreated: '2026-05-01'
  },
  {
    id: 'pre-2',
    name: '國泰金控 AI 客服客服系統擴充',
    productInfo: 'LLM 整合授權 + 客製化訓練微調模組',
    estPoDate: '2026-07-10',
    estAmount: 250,
    description: '擴展二期對話機器人，技術規格已驗證完畢。競對正強力搶標。',
    cost: 150,
    riskLevel: 'HIGH',
    status: 'QUOTING',
    transferred: false,
    dateCreated: '2026-05-10'
  },
  {
    id: 'pre-3',
    name: '華碩電腦 全球物流追蹤平台',
    productInfo: 'SaaS 訂閱 3 年合約 + API 客製整合服務',
    estPoDate: '2026-05-20',
    estAmount: 95,
    description: '決策鏈已打通，採購單位正進行合約細節審查。利潤高。',
    cost: 40,
    riskLevel: 'NORMAL',
    status: 'WON',
    transferred: true,
    dateCreated: '2026-04-15'
  },
  {
    id: 'pre-4',
    name: '中華電信 5G 切片網管PoC測試',
    productInfo: '驗證伺服器 2 台 + PoC 測試授權',
    estPoDate: '2026-08-30',
    estAmount: 45,
    description: '初期概念驗證專案，金額雖小但後續擴充性大。',
    cost: 30,
    riskLevel: 'NORMAL',
    status: 'PROPOSAL',
    transferred: false,
    dateCreated: '2026-05-20'
  },
  {
    id: 'pre-5',
    name: '統一超商 門市數位看板系統',
    productInfo: 'CMS 系統平台 + 多媒體播放盒',
    estPoDate: '2024-05-12', // 歷史資料
    estAmount: 320,
    description: '2024年指標性開發專案，成功擊敗競爭對手拿下。',
    cost: 210,
    riskLevel: 'NORMAL',
    status: 'WON',
    transferred: true,
    dateCreated: '2024-03-01'
  }
];

const INITIAL_POST_SALES = [
  {
    id: 'post-1',
    clientProjectName: '華碩電腦 全球物流追蹤平台',
    poDate: '2026-05-20',
    completionDate: '2026-09-30',
    totalAmount: 95,
    description: 'SaaS 訂閱合約已生效。預計 9 月中旬完成第一階段 API 驗收開票。',
    invoicedAmount: 30,
    uninvoicedAmount: 65, // 95 - 30
    deferredAmount: 0,
    helpNeeded: false,
    helpDescription: '',
    incomeStatus: 'PARTIAL',
    closingDate: '',
    sourcePresalesId: 'pre-3',
    dateCreated: '2026-05-20'
  },
  {
    id: 'post-2',
    clientProjectName: '統一超商 門市數位看板系統',
    poDate: '2024-05-12',
    completionDate: '2024-11-30',
    totalAmount: 320,
    description: '2024年完成驗收。尾款已收齊並完成結案。',
    invoicedAmount: 320,
    uninvoicedAmount: 0,
    deferredAmount: 0,
    helpNeeded: false,
    helpDescription: '',
    incomeStatus: 'CLOSED',
    closingDate: '2024-12-15',
    sourcePresalesId: 'pre-5',
    dateCreated: '2024-05-12'
  },
  {
    id: 'post-3',
    clientProjectName: '遠傳電信 雲端機房搬遷專案',
    poDate: '2026-02-10',
    completionDate: '2026-08-15',
    totalAmount: 480,
    description: '核心伺服器移轉中。目前遭遇客戶配合之協力廠商進度落後，急需跨部門支援協調。',
    invoicedAmount: 200,
    uninvoicedAmount: 280,
    deferredAmount: 80,
    helpNeeded: true,
    helpDescription: '客戶機房電力配置調整延遲，拖累移轉驗收進度，需協調副總級進行溝通。',
    incomeStatus: 'PARTIAL',
    closingDate: '',
    sourcePresalesId: '',
    dateCreated: '2026-02-10'
  },
  {
    id: 'post-4',
    clientProjectName: '玉山銀行 核心資料庫雙活備援',
    poDate: '2025-11-05',
    completionDate: '2026-04-20',
    totalAmount: 600,
    description: '系統已上線運作。4月份已開立全額發票，目前等待銀行財務進行最後撥款。',
    invoicedAmount: 600,
    uninvoicedAmount: 0,
    deferredAmount: 150, // 跨年度認列
    helpNeeded: false,
    helpDescription: '',
    incomeStatus: 'FULLY_INVOED',
    closingDate: '',
    sourcePresalesId: '',
    dateCreated: '2025-11-05'
  }
];

const INITIAL_CUSTOM_EVENTS = [
  {
    id: 'ev-1',
    title: '台積電 專案規格簡報會議',
    date: '2026-05-26',
    type: 'custom-event',
    description: '下午 2:00 於新竹總部與黃處長進行產品規格與導入時程簡報。'
  },
  {
    id: 'ev-2',
    title: '國泰 AI 客服技術展示(PoC)',
    date: '2026-05-28',
    type: 'custom-event',
    description: '線上進行二期功能 Demo，展示精準度比對與自訂流程引擎。'
  },
  {
    id: 'ev-3',
    title: '與華碩採購進行議價合約確認',
    date: '2026-05-18',
    type: 'custom-event',
    description: '確認最終折扣為 95 萬，雙方同意 5/20 簽訂正式 PO。'
  },
  {
    id: 'ev-4',
    title: '拜訪統一超商總部(洽談看板合作)',
    date: '2024-05-08', // 歷史足跡
    type: 'custom-event',
    description: '2024 年拜訪統一，進行門市數位看板規格提案，現場回饋良好。'
  },
  {
    id: 'ev-5',
    title: '統一超商數位看板簽約儀式',
    date: '2024-05-12', // 歷史足跡
    type: 'custom-event',
    description: '正式收到 PO 合約，總計 320 萬，雙方主管合影合意。'
  }
];

const INITIAL_LOGS = [
  {
    id: 'log-1',
    type: 'WON_TRANSFER',
    title: '專案成交拋轉',
    desc: '「華碩電腦 全球物流追蹤平台」成功由售前拋轉至售後收款模組。',
    time: '2026-05-20 10:15:30'
  },
  {
    id: 'log-2',
    type: 'HELP_ALERT',
    title: '困難求助啟動',
    desc: '「遠傳電信 雲端機房搬遷專案」標記困難求助：客戶電力配置調整延遲。',
    time: '2026-05-22 14:30:12'
  },
  {
    id: 'log-3',
    type: 'SYSTEM',
    title: '系統資料初始化',
    desc: '歡迎使用 BizFlow Hub 業務管理系統，本地資料載入完成。',
    time: '2026-05-24 18:00:00'
  }
];

const INITIAL_CARDS = [
  {
    id: 'card-1',
    name: '張家豪',
    title: '智慧製造處 處長',
    company: '台灣積體電路製造股份有限公司',
    phone: '0912-345-678',
    email: 'ch.chang@tsmc.com',
    notes: '台積電智慧物聯網升級案的關鍵決策人，偏好高穩定度產品。',
    cardImage: '',
    associatedProjectId: 'pre-1',
    dateCreated: '2026-05-01'
  },
  {
    id: 'card-2',
    name: '林美玲',
    title: '採購部 協理',
    company: '華碩電腦股份有限公司',
    phone: '02-2894-3447 #5566',
    email: 'meiling_lin@asus.com',
    notes: '對合約細節把關嚴格，重視售後服務水準合約 (SLA)。',
    cardImage: '',
    associatedProjectId: 'pre-3',
    dateCreated: '2026-04-15'
  }
];

// Database Initialization helper
export function initDB() {
  if (!localStorage.getItem(DB_KEYS.PRE_SALES)) {
    localStorage.setItem(DB_KEYS.PRE_SALES, JSON.stringify(INITIAL_PRE_SALES));
  }
  if (!localStorage.getItem(DB_KEYS.POST_SALES)) {
    localStorage.setItem(DB_KEYS.POST_SALES, JSON.stringify(INITIAL_POST_SALES));
  }
  if (!localStorage.getItem(DB_KEYS.CUSTOM_EVENTS)) {
    localStorage.setItem(DB_KEYS.CUSTOM_EVENTS, JSON.stringify(INITIAL_CUSTOM_EVENTS));
  }
  if (!localStorage.getItem(DB_KEYS.LOGS)) {
    localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  }
  if (!localStorage.getItem(DB_KEYS.CARDS)) {
    localStorage.setItem(DB_KEYS.CARDS, JSON.stringify(INITIAL_CARDS));
  }
}

// Write system logs
export function addLog(type, title, desc) {
  const logs = JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || '[]');
  const now = new Date();
  const formatTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  logs.unshift({
    id: `log-${Date.now()}`,
    type,
    title,
    desc,
    time: formatTime
  });
  
  // Cap logs at 50 entries
  if (logs.length > 50) logs.pop();
  localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));
}

// ==========================================================================
// Pre-Sales CRUD
// ==========================================================================
export function getPreSales() {
  return JSON.parse(localStorage.getItem(DB_KEYS.PRE_SALES) || '[]');
}

export function savePreSale(project) {
  const data = getPreSales();
  if (project.id) {
    const idx = data.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...project };
      addLog('UPDATE', '售前專案更新', `更新專案：${project.name}`);
    }
  } else {
    project.id = `pre-${Date.now()}`;
    project.transferred = false;
    project.dateCreated = new Date().toISOString().split('T')[0];
    data.push(project);
    addLog('CREATE', '新增售前專案', `新增專案：${project.name}`);
  }
  localStorage.setItem(DB_KEYS.PRE_SALES, JSON.stringify(data));
  return project;
}

export function deletePreSale(id) {
  const data = getPreSales();
  const project = data.find(p => p.id === id);
  const filtered = data.filter(p => p.id !== id);
  localStorage.setItem(DB_KEYS.PRE_SALES, JSON.stringify(filtered));
  if (project) {
    addLog('DELETE', '刪除售前專案', `刪除專案：${project.name}`);
  }
}

// ==========================================================================
// Post-Sales CRUD
// ==========================================================================
export function getPostSales() {
  const data = JSON.parse(localStorage.getItem(DB_KEYS.POST_SALES) || '[]');
  // Always auto-compute uninvoicedAmount = totalAmount - invoicedAmount
  return data.map(p => {
    p.uninvoicedAmount = Math.max(0, p.totalAmount - p.invoicedAmount);
    return p;
  });
}

export function savePostSale(project) {
  const data = getPostSales();
  project.uninvoicedAmount = Math.max(0, project.totalAmount - (project.invoicedAmount || 0));
  
  if (project.id) {
    const idx = data.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      // Check if helpNeeded changed to write log
      const oldProject = data[idx];
      if (project.helpNeeded && !oldProject.helpNeeded) {
        addLog('HELP_ALERT', '困難求助啟動', `「${project.clientProjectName}」標記求助：${project.helpDescription}`);
      } else if (!project.helpNeeded && oldProject.helpNeeded) {
        addLog('SYSTEM', '困難求助解除', `「${project.clientProjectName}」已解除困難求助標記。`);
      }
      
      data[idx] = { ...data[idx], ...project };
      addLog('UPDATE', '售後專案更新', `更新專案：${project.clientProjectName}`);
    }
  } else {
    project.id = `post-${Date.now()}`;
    project.dateCreated = new Date().toISOString().split('T')[0];
    data.push(project);
    addLog('CREATE', '新增售後專案', `新增專案：${project.clientProjectName}`);
  }
  localStorage.setItem(DB_KEYS.POST_SALES, JSON.stringify(data));
  return project;
}

export function deletePostSale(id) {
  const data = getPostSales();
  const project = data.find(p => p.id === id);
  const filtered = data.filter(p => p.id !== id);
  localStorage.setItem(DB_KEYS.POST_SALES, JSON.stringify(filtered));
  if (project) {
    addLog('DELETE', '刪除售後專案', `刪除專案：${project.clientProjectName}`);
  }
}

// ==========================================================================
// Custom Events (Calendar footprints)
// ==========================================================================
export function getCustomEvents() {
  return JSON.parse(localStorage.getItem(DB_KEYS.CUSTOM_EVENTS) || '[]');
}

export function saveCustomEvent(ev) {
  const data = getCustomEvents();
  if (ev.id) {
    const idx = data.findIndex(e => e.id === ev.id);
    if (idx !== -1) data[idx] = ev;
  } else {
    ev.id = `ev-${Date.now()}`;
    ev.type = 'custom-event';
    data.push(ev);
  }
  localStorage.setItem(DB_KEYS.CUSTOM_EVENTS, JSON.stringify(data));
  return ev;
}

export function deleteCustomEvent(id) {
  const data = getCustomEvents();
  const filtered = data.filter(e => e.id !== id);
  localStorage.setItem(DB_KEYS.CUSTOM_EVENTS, JSON.stringify(filtered));
}

// ==========================================================================
// Shared Metrics and Activity Timelines
// ==========================================================================
export function getLogs() {
  return JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || '[]');
}

export function clearAllData() {
  localStorage.removeItem(DB_KEYS.PRE_SALES);
  localStorage.removeItem(DB_KEYS.POST_SALES);
  localStorage.removeItem(DB_KEYS.CUSTOM_EVENTS);
  localStorage.removeItem(DB_KEYS.LOGS);
  localStorage.removeItem(DB_KEYS.CARDS);
  initDB();
}

// ==========================================================================
// Business Cards CRUD
// ==========================================================================
export function getCards() {
  return JSON.parse(localStorage.getItem(DB_KEYS.CARDS) || '[]');
}

export function saveCard(card) {
  const data = getCards();
  if (card.id) {
    const idx = data.findIndex(c => c.id === card.id);
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...card };
      addLog('UPDATE', '更新聯絡名片', `更新名片：${card.name} (${card.company})`);
    }
  } else {
    card.id = `card-${Date.now()}`;
    card.dateCreated = new Date().toISOString().split('T')[0];
    data.push(card);
    addLog('CREATE', '新增聯絡名片', `新增名片：${card.name} (${card.company})`);
  }
  localStorage.setItem(DB_KEYS.CARDS, JSON.stringify(data));
  return card;
}

export function deleteCard(id) {
  const data = getCards();
  const card = data.find(c => c.id === id);
  const filtered = data.filter(c => c.id !== id);
  localStorage.setItem(DB_KEYS.CARDS, JSON.stringify(filtered));
  if (card) {
    addLog('DELETE', '刪除聯絡名片', `刪除名片：${card.name} (${card.company})`);
  }
}
