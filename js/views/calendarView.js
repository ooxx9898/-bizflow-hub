// Global Calendar and Historical Footprint Search View
import { getPreSales, getPostSales, getCustomEvents, saveCustomEvent, deleteCustomEvent } from '../db.js';
import { showToast, showModal, closeModal } from '../app.js';

let currentYear = 2026;
let currentMonth = 4; // 0-indexed, so 4 is May

export function renderCalendar(containerId, navigateToView) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render view template
  container.innerHTML = `
    <div class="fade-in calendar-wrapper">
      <!-- Search Panel -->
      <section class="glass-panel" style="padding: 16px; border-radius: var(--border-radius-lg);">
        <div class="calendar-search-bar-container">
          <div class="search-input-wrapper">
            <svg class="search-icon-inside" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="calendar-search-input" id="cal-search-input" placeholder="🔍 輸入「2024-05」跳轉月份，或搜尋「客戶名稱」、「報價、簽約、開票、求助」歷史足跡...">
          </div>
          
          <button class="btn btn-primary" id="cal-add-event-btn" style="flex-shrink: 0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            新增行程足跡
          </button>
          
          <!-- Dropdown Suggestion List -->
          <div class="search-suggestions-dropdown" id="cal-search-suggestions"></div>
        </div>
      </section>

      <!-- Calendar Body Grid -->
      <section class="glass-panel" style="padding: 24px; border-radius: var(--border-radius-lg);">
        <!-- Navigation Header -->
        <div class="calendar-control-header">
          <h3 class="current-month-display" id="cal-month-year-title">2026 年 5 月</h3>
          <div class="calendar-nav-buttons">
            <button class="btn btn-outline-primary btn-sm" id="cal-nav-prev">上個月</button>
            <button class="btn btn-outline-primary btn-sm" id="cal-nav-today">今天</button>
            <button class="btn btn-outline-primary btn-sm" id="cal-nav-next">下個月</button>
          </div>
        </div>

        <!-- Weekly/Daily Grid -->
        <div class="calendar-grid">
          <div class="calendar-weekday-header">
            <div class="weekday-name">週日</div>
            <div class="weekday-name">週一</div>
            <div class="weekday-name">週二</div>
            <div class="weekday-name">週三</div>
            <div class="weekday-name">週四</div>
            <div class="weekday-name">週五</div>
            <div class="weekday-name">週六</div>
          </div>
          <div class="calendar-days-container" id="calendar-days-grid">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </section>
    </div>
  `;

  // Hook global events
  document.getElementById('cal-nav-prev').addEventListener('click', () => navigateMonth(-1));
  document.getElementById('cal-nav-next').addEventListener('click', () => navigateMonth(1));
  document.getElementById('cal-nav-today').addEventListener('click', () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    buildCalendar();
  });

  document.getElementById('cal-add-event-btn').addEventListener('click', () => {
    openAddEventForm();
  });

  const searchInput = document.getElementById('cal-search-input');
  searchInput.addEventListener('input', () => {
    handleSearchInput(searchInput.value.trim());
  });

  // Hide suggestions dropdown when click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.calendar-search-bar-container')) {
      document.getElementById('cal-search-suggestions').style.display = 'none';
    }
  });

  // Initial Calendar Build
  buildCalendar();

  // ==========================================
  // COMPILE EVENT DATA FROM ENTIRE DATABASE
  // ==========================================
  function gatherAllEvents() {
    const presales = getPreSales();
    const postsales = getPostSales();
    const customEvents = getCustomEvents();
    const events = [];

    // Pre-sales estimated PO dates
    presales.forEach(p => {
      if (p.estPoDate) {
        events.push({
          id: `pre-ev-${p.id}`,
          originalId: p.id,
          title: `[售前預估] ${p.name}`,
          date: p.estPoDate,
          type: 'presales',
          description: `預估成交金額：${p.estAmount} 萬元。開發進度：${p.productInfo}`,
          source: 'presales'
        });
      }
    });

    // Post-sales milestones
    postsales.forEach(p => {
      if (p.poDate) {
        events.push({
          id: `post-po-${p.id}`,
          originalId: p.id,
          title: `[正式簽約] ${p.clientProjectName}`,
          date: p.poDate,
          type: 'postsales',
          description: `正式獲取 PO，合約總金額：${p.totalAmount} 萬元。說明：${p.description}`,
          source: 'postsales'
        });
      }
      if (p.completionDate) {
        events.push({
          id: `post-comp-${p.id}`,
          originalId: p.id,
          title: `[預計完驗] ${p.clientProjectName}`,
          date: p.completionDate,
          type: 'postsales',
          description: `履約驗收查核點。已開票進度：${p.invoicedAmount} 萬 / 總額: ${p.totalAmount} 萬。`,
          source: 'postsales'
        });
      }
      if (p.closingDate) {
        events.push({
          id: `post-close-${p.id}`,
          originalId: p.id,
          title: `[已結案] ${p.clientProjectName}`,
          date: p.closingDate,
          type: 'close-date',
          description: `專案結清，結案時間: ${p.closingDate}`,
          source: 'postsales'
        });
      }
    });

    // Custom events
    customEvents.forEach(e => {
      events.push({
        id: `custom-${e.id}`,
        originalId: e.id,
        title: `[足跡] ${e.title}`,
        date: e.date,
        type: 'custom-event',
        description: e.description,
        source: 'custom'
      });
    });

    return events;
  }

  // ==========================================
  // RENDER MONTH GRID
  // ==========================================
  function buildCalendar() {
    const daysGrid = document.getElementById('calendar-days-grid');
    const monthTitle = document.getElementById('cal-month-year-title');
    
    // Update header
    const chnMonths = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    monthTitle.textContent = `${currentYear} 年 ${chnMonths[currentMonth]} 月`;

    // Calculate dates
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    
    const today = new Date();
    const isThisMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

    let dayCells = '';

    // Gather all events
    const allEvents = gatherAllEvents();

    // 1. Prev month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevDateStr = getFormattedDateString(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1, dayNum);
      const dayEvents = allEvents.filter(e => e.date === prevDateStr);
      
      dayCells += renderDayCell(dayNum, true, dayEvents, prevDateStr);
    }

    // 2. Current month days
    for (let day = 1; day <= totalDays; day++) {
      const isToday = isThisMonth && today.getDate() === day;
      const dateStr = getFormattedDateString(currentYear, currentMonth, day);
      const dayEvents = allEvents.filter(e => e.date === dateStr);

      dayCells += renderDayCell(day, false, dayEvents, dateStr, isToday);
    }

    // 3. Next month leading days (fill up the calendar grid row multiple of 7)
    const currentGridCount = firstDayIndex + totalDays;
    const remainingDays = (7 - (currentGridCount % 7)) % 7;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDateStr = getFormattedDateString(currentMonth === 11 ? currentYear + 1 : currentYear, currentMonth === 11 ? 0 : currentMonth + 1, day);
      const dayEvents = allEvents.filter(e => e.date === nextDateStr);

      dayCells += renderDayCell(day, true, dayEvents, nextDateStr);
    }

    daysGrid.innerHTML = dayCells;

    // Attach click events to events pills
    daysGrid.querySelectorAll('.event-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const evId = pill.dataset.eventId;
        const matched = allEvents.find(ev => ev.id === evId);
        if (matched) {
          showEventDetails(matched);
        }
      });
    });

    // Attach double click to day cell to add quick event
    daysGrid.querySelectorAll('.calendar-day-cell').forEach(cell => {
      cell.addEventListener('dblclick', () => {
        const date = cell.dataset.date;
        openAddEventForm(date);
      });
    });
  }

  function renderDayCell(dayNum, isOtherMonth, dayEvents, dateStr, isToday = false) {
    return `
      <div class="calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'current-day' : ''}" data-date="${dateStr}">
        <div class="day-number-wrapper">
          <span class="day-number">${dayNum}</span>
          ${dayEvents.length > 0 ? `<span style="font-size:0.6rem; opacity:0.6;">📌 ${dayEvents.length}</span>` : ''}
        </div>
        <div class="day-events-list">
          ${dayEvents.map(e => `
            <div class="event-pill ${e.type}" data-event-id="${e.id}" title="${escapeHtml(e.title)}">
              ${escapeHtml(e.title.split('] ')[1] || e.title)}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Navigate month
  function navigateMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }
    buildCalendar();
  }

  // ==========================================
  // REAL-TIME SEARCH & BACKTRACKING LOGIC
  // ==========================================
  function handleSearchInput(query) {
    const suggestions = document.getElementById('cal-search-suggestions');
    if (!query) {
      suggestions.style.display = 'none';
      clearCalendarFilters();
      return;
    }

    // 1. Month Backtracking check: "YYYY-MM" (e.g. 2024-05)
    const yearMonthMatch = query.match(/^(\d{4})-(\d{2})$/);
    if (yearMonthMatch) {
      const year = parseInt(yearMonthMatch[1], 10);
      const month = parseInt(yearMonthMatch[2], 10) - 1; // 0-indexed
      if (year >= 2000 && year <= 2090 && month >= 0 && month <= 11) {
        if (currentYear !== year || currentMonth !== month) {
          currentYear = year;
          currentMonth = month;
          buildCalendar();
          showToast(`已跳轉至歷史足跡月份: ${query}`, 'success');
        }
      }
    }

    // 2. Suggestion search database items
    const allEvents = gatherAllEvents();
    const filterLower = query.toLowerCase();
    const matchedSuggestions = allEvents.filter(ev => {
      return ev.title.toLowerCase().includes(filterLower) ||
             (ev.description && ev.description.toLowerCase().includes(filterLower)) ||
             ev.date.includes(filterLower);
    });

    // Render suggestions list
    if (matchedSuggestions.length > 0) {
      suggestions.innerHTML = matchedSuggestions.slice(0, 8).map(ev => {
        let tagClass = 'badge-primary';
        if (ev.type === 'presales') tagClass = 'badge-info';
        if (ev.type === 'postsales') tagClass = 'badge-success';
        if (ev.type === 'close-date') tagClass = 'badge-danger';
        if (ev.type === 'custom-event') tagClass = 'badge-warning';

        return `
          <div class="search-suggestion-item" data-jump-date="${ev.date}" data-ev-id="${ev.id}">
            <div class="suggestion-info">
              <span class="suggestion-title">${escapeHtml(ev.title)}</span>
              <span class="suggestion-date">📅 ${ev.date}</span>
            </div>
            <span class="badge ${tagClass} suggestion-tag">${translateType(ev.type)}</span>
          </div>
        `;
      }).join('');
      suggestions.style.display = 'block';

      // Attach clicks to suggestion jump
      suggestions.querySelectorAll('.search-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const dateStr = item.dataset.jumpDate;
          const evId = item.dataset.evId;
          suggestions.style.display = 'none';
          document.getElementById('cal-search-input').value = item.querySelector('.suggestion-title').textContent;
          jumpToDateAndHighlight(dateStr, evId);
        });
      });
    } else {
      suggestions.style.display = 'none';
    }

    // 3. Live calendar highlight filters (fade out non-matching)
    filterCalendarPills(filterLower);
  }

  // Jump to specific year/month and pulse the event
  function jumpToDateAndHighlight(dateStr, evId) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    
    currentYear = year;
    currentMonth = month;
    buildCalendar();

    // Give browser time to render, then highlight the cell & event pill
    setTimeout(() => {
      const dayCell = document.querySelector(`.calendar-day-cell[data-date="${dateStr}"]`);
      const eventPill = document.querySelector(`.event-pill[data-event-id="${evId}"]`);
      
      if (dayCell) {
        dayCell.classList.add('highlight');
        dayCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      if (eventPill) {
        eventPill.classList.add('highlight');
      }

      // Automatically show details
      const matched = gatherAllEvents().find(ev => ev.id === evId);
      if (matched) {
        showEventDetails(matched);
      }

      // Remove highlight animation after 4s
      setTimeout(() => {
        if (dayCell) dayCell.classList.remove('highlight');
        if (eventPill) eventPill.classList.remove('highlight');
      }, 4000);
    }, 100);
  }

  // Live filter calendar items inside view
  function filterCalendarPills(keyword) {
    const cells = document.querySelectorAll('.calendar-day-cell');
    const pills = document.querySelectorAll('.event-pill');

    cells.forEach(cell => {
      let cellHasMatch = false;
      const cellPills = cell.querySelectorAll('.event-pill');
      
      cellPills.forEach(pill => {
        const title = pill.getAttribute('title').toLowerCase();
        if (title.includes(keyword)) {
          pill.classList.remove('fade-out');
          pill.classList.add('highlight');
          cellHasMatch = true;
        } else {
          pill.classList.add('fade-out');
          pill.classList.remove('highlight');
        }
      });

      if (cellHasMatch || keyword === '') {
        cell.classList.remove('fade-out');
      } else {
        cell.classList.add('fade-out');
      }
    });
  }

  function clearCalendarFilters() {
    document.querySelectorAll('.calendar-day-cell, .event-pill').forEach(el => {
      el.classList.remove('fade-out', 'highlight');
    });
  }

  // Show detailed event card modal
  function showEventDetails(ev) {
    const modalBodyHtml = `
      <h3 class="modal-title" style="color:var(--color-primary);">${escapeHtml(ev.title)}</h3>
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="font-size: 0.9rem; font-family: monospace; display:flex; gap:10px;">
          <strong>📅 事件日期:</strong>
          <span>${ev.date}</span>
        </div>
        
        <div style="font-size: 0.9rem;">
          <strong>📝 事件描述與足跡細節：</strong>
          <p style="margin-top:8px; line-height:1.6; background-color:var(--color-input-bg); padding:16px; border-radius:var(--border-radius-md); font-size:0.875rem;">
            ${escapeHtml(ev.description || '尚無描述。')}
          </p>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
          ${ev.source === 'custom' ? `
            <button class="btn btn-danger btn-sm" id="btn-delete-custom-ev" data-id="${ev.originalId}">刪除足跡</button>
          ` : `
            <span style="font-size:0.75rem; color:var(--color-text-muted);">ℹ️ 此為系統專案連動里程碑，如需編輯請至專案清單。</span>
          `}
          <button class="btn btn-outline-primary btn-sm" id="btn-close-ev-modal">關閉</button>
        </div>
      </div>
    `;

    showModal(modalBodyHtml);

    document.getElementById('btn-close-ev-modal').addEventListener('click', closeModal);
    
    const delBtn = document.getElementById('btn-delete-custom-ev');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        if (confirm('確定要刪除此自訂行程足跡嗎？')) {
          deleteCustomEvent(delBtn.dataset.id);
          closeModal();
          showToast('行程足跡已刪除', 'warning');
          buildCalendar();
        }
      });
    }
  }

  // Create custom calendar event
  function openAddEventForm(defaultDate = '') {
    const targetDate = defaultDate || new Date().toISOString().split('T')[0];
    
    const modalBodyHtml = `
      <h3 class="modal-title">📌 新增自訂行程足跡</h3>
      <form id="add-event-form">
        <div class="form-group">
          <label for="ev-form-title">足跡主旨 <span style="color:var(--color-danger)">*</span></label>
          <input type="text" class="form-control" id="ev-form-title" required placeholder="例如：拜訪客戶、系統規格說明會議">
        </div>
        <div class="form-group">
          <label for="ev-form-date">日期 <span style="color:var(--color-danger)">*</span></label>
          <input type="date" class="form-control" id="ev-form-date" required value="${targetDate}">
        </div>
        <div class="form-group">
          <label for="ev-form-desc">行程備註細節 <span style="color:var(--color-danger)">*</span></label>
          <textarea class="form-control" id="ev-form-desc" rows="3" required placeholder="請描述洽談內容或行程詳細記錄..."></textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">
          <button type="button" class="btn btn-outline-primary" id="btn-cancel-add-ev">取消</button>
          <button type="submit" class="btn btn-primary">儲存足跡</button>
        </div>
      </form>
    `;

    showModal(modalBodyHtml);
    document.getElementById('btn-cancel-add-ev').addEventListener('click', closeModal);

    document.getElementById('add-event-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newEv = {
        title: document.getElementById('ev-form-title').value.trim(),
        date: document.getElementById('ev-form-date').value,
        description: document.getElementById('ev-form-desc').value.trim()
      };

      saveCustomEvent(newEv);
      closeModal();
      showToast('行程足跡已新增！', 'success');
      buildCalendar();
    });
  }
}

// Helpers
function getFormattedDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function translateType(type) {
  const mapping = {
    'presales': '售前預計',
    'postsales': '售後合約',
    'close-date': '收款結案',
    'custom-event': '自訂足跡'
  };
  return mapping[type] || type;
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
