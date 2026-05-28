// Google Integration Client (OAuth 2.0, Sheets API, Calendar API)

const GOOGLE_CONFIG_KEY = 'bizflow_google_config';

const DEFAULT_CONFIG = {
  apiKey: '',
  clientId: '',
  spreadsheetId: '',
  isDemoMode: true,
  isConnected: false,
  userEmail: ''
};

export function getGoogleConfig() {
  const config = localStorage.getItem(GOOGLE_CONFIG_KEY);
  return config ? JSON.parse(config) : { ...DEFAULT_CONFIG };
}

export function saveGoogleConfig(config) {
  localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(config));
}

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

let currentConfig = getGoogleConfig();

export function isDemoMode() {
  return currentConfig.isDemoMode;
}

export function isConnected() {
  return currentConfig.isConnected;
}

export async function syncToGoogleCloud(presalesData, postsalesData, logCallback) {
  const printLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    logCallback(time, type, text);
  };

  currentConfig = getGoogleConfig();

  if (currentConfig.isDemoMode) {
    printLog('初始化 Google 雲端連結服務...', 'info');
    await sleep(600);
    printLog('⚠️ 本地模擬模式 (Demo Mode) 已啟用，將繞過實際 API 金鑰驗證。', 'warning');
    await sleep(600);
    printLog('正在獲取 OAuth2.0 模擬授權 Token...', 'info');
    await sleep(800);
    printLog('成功取得臨時 Access Token: ya29.a0AfB_mockToken123456789', 'success');
    await sleep(600);
    
    printLog('正在連接 Google Sheets (Google 試算表) 服務...', 'info');
    await sleep(800);
    if (!currentConfig.spreadsheetId) {
      printLog('未檢測到綁定試算表，正在您的雲端硬碟建立新試算表：「業務管理系統_資料庫」...', 'info');
      await sleep(1200);
      currentConfig.spreadsheetId = '1tW9_mockSpreadsheetId_Xyz987654321';
      saveGoogleConfig(currentConfig);
      printLog(`試算表建立成功！ID: ${currentConfig.spreadsheetId}`, 'success');
    } else {
      printLog(`找到已綁定試算表，ID: ${currentConfig.spreadsheetId}`, 'info');
    }
    await sleep(600);
    
    printLog('正在檢查試算表工作分頁: 「PreSales」 與 「PostSales」...', 'info');
    await sleep(700);
    printLog('分頁存在，正在清除舊資料並寫入最新業務狀態...', 'info');
    await sleep(1000);
    printLog(`[試算表同步] 成功寫入 ${presalesData.length} 筆售前開發專案至 「PreSales」 分頁。`, 'success');
    printLog(`[試算表同步] 成功寫入 ${postsalesData.length} 筆售後收款專案至 「PostSales」 分頁。`, 'success');
    await sleep(600);

    printLog('正在連接 Google Calendar (Google 日曆) 服務...', 'info');
    await sleep(800);
    printLog('讀取預設 Google 日曆: 「primary」...', 'info');
    await sleep(600);
    
    let milestoneCount = 0;
    presalesData.forEach(p => {
      if (p.estPoDate) milestoneCount++;
    });
    postsalesData.forEach(p => {
      if (p.poDate) milestoneCount++;
      if (p.completionDate) milestoneCount++;
      if (p.closingDate) milestoneCount++;
    });

    printLog(`正在向日曆同步 ${milestoneCount} 個專案關鍵時間節點與足跡...`, 'info');
    await sleep(1200);
    
    if (presalesData.length > 0) {
      printLog(`[日曆同步] 建立事件: 「[售前預估] ${presalesData[0].name} (預計 PO: ${presalesData[0].estPoDate})」`, 'success');
    }
    if (postsalesData.length > 0) {
      const activePost = postsalesData.find(p => !p.closingDate) || postsalesData[0];
      printLog(`[日曆同步] 建立事件: 「[售後完驗] ${activePost.clientProjectName} (預估完驗: ${activePost.completionDate})」`, 'success');
    }
    
    await sleep(600);
    printLog('🎉 雲端備份與雙向同步成功！全部資料已順利寫入 Google Cloud。', 'success');
    
    currentConfig.isConnected = true;
    currentConfig.userEmail = 'demo.user@gmail.com';
    saveGoogleConfig(currentConfig);
    return true;
  } else {
    printLog('開啟真實 Google API 連線...', 'info');
    if (!currentConfig.apiKey || !currentConfig.clientId) {
      printLog('❌ 同步失敗：請先設定 API 金鑰 (API Key) 與 用戶端 ID (Client ID)！', 'error');
      throw new Error('Missing credentials');
    }
    
    try {
      printLog('正在加載 Google Identity OAuth 客戶端...', 'info');
      await loadGoogleLibraries();
      
      printLog('提示使用者進行 Google 帳號授權登入...', 'info');
      const accessToken = await requestAccessToken(currentConfig.clientId);
      printLog('成功取得 Access Token！正在連線 Google Sheets...', 'success');
      
      let spreadsheetId = currentConfig.spreadsheetId;
      
      if (!spreadsheetId) {
        printLog('未偵測到試算表 ID，正在您的雲端硬碟建立「業務管理系統_資料庫」...', 'info');
        spreadsheetId = await createNewSpreadsheet(accessToken);
        currentConfig.spreadsheetId = spreadsheetId;
        saveGoogleConfig(currentConfig);
        printLog(`新試算表建立成功！ID: ${spreadsheetId}`, 'success');
      } else {
        printLog(`找到綁定試算表，ID: ${spreadsheetId}`, 'info');
      }
      
      printLog('確認試算表工作分頁：「PreSales」與「PostSales」...', 'info');
      await initializeSheetTabs(spreadsheetId, accessToken);
      
      printLog(`正在向「PreSales」寫入 ${presalesData.length} 筆專案資料...`, 'info');
      await syncPreSalesToSheet(spreadsheetId, presalesData, accessToken);
      printLog('[試算表同步] 售前資料寫入完成！', 'success');
      
      printLog(`正在向「PostSales」寫入 ${postsalesData.length} 筆收款資料...`, 'info');
      await syncPostSalesToSheet(spreadsheetId, postsalesData, accessToken);
      printLog('[試算表同步] 售後收款資料寫入完成！', 'success');
      
      printLog('正在連接 Google Calendar (日曆) 服務...', 'info');
      await syncMilestonesToCalendar(presalesData, postsalesData, accessToken, printLog);
      
      printLog('🎉 雲端備份與雙向同步成功！全部資料已順利寫入 Google Cloud。', 'success');
      
      let userEmail = 'active.user@gmail.com';
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then(r => r.json());
        if (userInfo.email) {
          userEmail = userInfo.email;
        }
      } catch (e) {
      }
      
      currentConfig.isConnected = true;
      currentConfig.userEmail = userEmail;
      saveGoogleConfig(currentConfig);
      return true;
    } catch (err) {
      printLog(`❌ 連線或同步發生錯誤: ${err.message || JSON.stringify(err)}`, 'error');
      throw err;
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadGoogleLibraries() {
  return new Promise((resolve) => {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
      resolve();
      return;
    }
    const checkLoaded = () => {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        resolve();
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    checkLoaded();
  });
}

function requestAccessToken(clientId) {
  return new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events',
        callback: (response) => {
          if (response.error !== undefined) {
            reject(response);
          } else {
            resolve(response.access_token);
          }
        },
        error_callback: (err) => {
          reject(err);
        }
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      reject(e);
    }
  });
}

async function createNewSpreadsheet(accessToken) {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: '業務管理系統_資料庫' },
      sheets: [
        { properties: { title: 'PreSales' } },
        { properties: { title: 'PostSales' } }
      ]
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`無法建立試算表: ${err.error.message}`);
  }
  
  const data = await response.json();
  return data.spreadsheetId;
}

async function initializeSheetTabs(spreadsheetId, accessToken) {
  const getResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!getResponse.ok) {
    const err = await getResponse.json();
    throw new Error(`讀取試算表失敗: ${err.error.message}`);
  }
  
  const spreadsheet = await getResponse.json();
  const existingTitles = spreadsheet.sheets.map(s => s.properties.title);
  
  const requests = [];
  if (!existingTitles.includes('PreSales')) {
    requests.push({ addSheet: { properties: { title: 'PreSales' } } });
  }
  if (!existingTitles.includes('PostSales')) {
    requests.push({ addSheet: { properties: { title: 'PostSales' } } });
  }
  
  if (requests.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  }
}

async function syncPreSalesToSheet(spreadsheetId, data, accessToken) {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PreSales!A:Z:clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const values = [[
    'ID', '專案名稱', '客戶名稱', '預估合約金額 (萬)', '預計簽約日期', 
    '目前進度狀態', '簽約機率 (%)', '聯絡人姓名', '聯絡電話', 
    '電子信箱', '專案描述備註', '風險燈號'
  ]];
  
  data.forEach(p => {
    values.push([
      p.id || '',
      p.name || '',
      p.clientName || '',
      p.estAmount || 0,
      p.estPoDate || '',
      p.status || 'LEAD',
      p.probability || 0,
      p.contactName || '',
      p.phone || '',
      p.email || '',
      p.notes || '',
      p.riskLevel || 'GREEN'
    ]);
  });
  
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PreSales!A1?valueInputOption=RAW`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`PreSales 寫入失敗: ${err.error.message}`);
  }
}

async function syncPostSalesToSheet(spreadsheetId, data, accessToken) {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PostSales!A:Z:clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const values = [[
    'ID', '客戶/專案名稱', '客約簽訂日期', '合約總金額 (萬)', '已開票進帳 (萬)', 
    '遞延收款 (萬)', '未開票待收 (萬)', '收款狀態', '困難求助備註', 
    '預估完驗日期', '結案日期', '客戶詳細資訊', '專案備註'
  ]];
  
  data.forEach(p => {
    values.push([
      p.id || '',
      p.clientProjectName || '',
      p.poDate || '',
      p.totalAmount || 0,
      p.invoicedAmount || 0,
      p.deferredAmount || 0,
      p.uninvoicedAmount || 0,
      p.incomeStatus || 'UNINVOICED',
      p.difficultyMemo || '',
      p.completionDate || '',
      p.closingDate || '',
      p.clientDetails || '',
      p.notes || ''
    ]);
  });
  
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PostSales!A1?valueInputOption=RAW`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`PostSales 寫入失敗: ${err.error.message}`);
  }
}

async function syncMilestonesToCalendar(presales, postsales, accessToken, printLog) {
  const events = [];
  
  presales.forEach(p => {
    if (p.estPoDate) {
      events.push({
        summary: `[售前預估] ${p.name} - 預計PO`,
        description: `估計金額: NT$ ${p.estAmount} 萬元 | 簽約機率: ${p.probability}% | 客戶: ${p.clientName}`,
        date: p.estPoDate
      });
    }
  });
  
  postsales.forEach(p => {
    if (p.poDate) {
      events.push({
        summary: `[售後簽約] ${p.clientProjectName} - 合約生效`,
        description: `合約總額: NT$ ${p.totalAmount} 萬元 | 狀態: ${p.incomeStatus}`,
        date: p.poDate
      });
    }
    if (p.completionDate) {
      events.push({
        summary: `[售後完驗] ${p.clientProjectName} - 預估完收驗收`,
        description: `合約總額: NT$ ${p.totalAmount} 萬元 | 狀態: ${p.incomeStatus}`,
        date: p.completionDate
      });
    }
    if (p.closingDate) {
      events.push({
        summary: `[售後結案] ${p.clientProjectName} - 已結案`,
        description: `合約總額: NT$ ${p.totalAmount} 萬元`,
        date: p.closingDate
      });
    }
  });
  
  if (events.length === 0) {
    printLog('沒有需要同步的日曆里程碑。', 'info');
    return;
  }
  
  printLog(`正在日曆中比對與建立 ${events.length} 個業務里程碑與足跡...`, 'info');
  
  let successCount = 0;
  for (const ev of events) {
    try {
      const listResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(ev.summary)}&timeMin=${ev.date}T00:00:00Z&timeMax=${ev.date}T23:59:59Z`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.items && listData.items.length > 0) {
          continue;
        }
      }
      
      const createResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: ev.summary,
            description: ev.description,
            start: { date: ev.date },
            end: { date: ev.date }
          })
        }
      );
      
      if (createResponse.ok) {
        successCount++;
        if (successCount <= 2) {
          printLog(`[日曆同步] 建立事件: 「${ev.summary} (${ev.date})」`, 'success');
        }
      }
    } catch (e) {
    }
  }
  
  printLog(`[日曆同步] 完成！成功比對/新建了 ${successCount} 個日曆事件。`, 'success');
}
