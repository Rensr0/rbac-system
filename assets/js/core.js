/**
 * core.js - 核心请求库 + 权限工具 + 通用 UI 组件
 */
const API = (function () {
  // 自动检测 API 基础路径：
  // 根目录(index.html) → 'api'
  // pages/ 子目录(home.html) → '../api'
  var path = window.location.pathname;
  var BASE = path.indexOf('/pages/') !== -1 ? '../api' : 'api';

  function request(url, options) {
    options = options || {};
    var method = options.method || 'GET';
    var data = options.data || null;
    var params = options.params || {};

    // 构建 URL
    let fullUrl = `${BASE}/${url}`;
    const queryStr = Object.entries(params)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (queryStr) fullUrl += `?${queryStr}`;

    const fetchOptions = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    return fetch(fullUrl, fetchOptions)
      .then(function(res) {
        // 先检查响应类型，避免 HTML 错误页污染 JSON 解析
        var contentType = res.headers.get('content-type') || '';
        if (contentType.indexOf('application/json') === -1) {
          return res.text().then(function(html) {
            console.error('API 返回非 JSON:', html.substring(0, 200));
            return { code: 500, msg: '服务器返回了异常内容', data: null };
          });
        }
        return res.json();
      })
      .then(function(json) {
        return json;
      })
      .catch(function(err) {
        console.error('API Error:', err);
        return { code: 500, msg: err.message || '网络请求失败', data: null };
      });
  }

  return {
    get: (url, params) => request(url, { method: 'GET', params }),
    post: (url, data) => request(url, { method: 'POST', data }),
    put: (url, data) => request(url, { method: 'PUT', data }),
    del: (url, data) => request(url, { method: 'DELETE', data }),
  };
})();

// ==================== 本地存储 ====================
const Storage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem(key); },
};

// ==================== Toast ====================
function showToast(msg, duration = 2000) {
  // PC 端
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// 手机端 APP 风格 Toast
function appToast(msg, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'app-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ==================== Loading ====================
function showLoading() {
  let mask = document.querySelector('.loading-mask');
  if (!mask) {
    mask = document.createElement('div');
    mask.className = 'loading-mask';
    mask.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(mask);
  }
  mask.classList.add('show');
}

function hideLoading() {
  const mask = document.querySelector('.loading-mask');
  if (mask) mask.classList.remove('show');
}

function appShowLoading() {
  let el = document.querySelector('.app-loading');
  if (!el) {
    el = document.createElement('div');
    el.className = 'app-loading';
    el.innerHTML = '<div class="app-loading-inner"><div class="loading-spinner"></div></div>';
    document.body.appendChild(el);
  }
  el.classList.add('show');
}

function appHideLoading() {
  const el = document.querySelector('.app-loading');
  if (el) el.classList.remove('show');
}

// ==================== 确认弹窗 ====================
function confirmDialog(title, content) {
  return new Promise((resolve) => {
    const isMobileDevice = window.innerWidth <= 768;
    const overlay = document.createElement('div');
    
    if (isMobileDevice) {
      overlay.className = 'app-dialog-overlay show';
      overlay.innerHTML = `
        <div class="app-dialog">
          <div class="dialog-title">${title}</div>
          <div class="dialog-content">${content}</div>
          <div class="dialog-actions">
            <button class="dialog-btn" id="dlg-cancel">取消</button>
            <button class="dialog-btn primary" id="dlg-ok">确定</button>
          </div>
        </div>
      `;
    } else {
      overlay.className = 'modal-overlay';
      overlay.id = 'confirm-modal';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3>${title}</h3>
          </div>
          <div class="modal-body">
            <p>${content}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="dlg-cancel">取消</button>
            <button class="btn btn-primary" id="dlg-ok">确定</button>
          </div>
        </div>
      `;
    }
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    overlay.querySelector('#dlg-cancel').onclick = () => { 
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 250);
      resolve(false); 
    };
    overlay.querySelector('#dlg-ok').onclick = () => { 
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 250);
      resolve(true); 
    };
  });
}

// ==================== 弹窗（Modal） ====================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'flex'; requestAnimationFrame(() => el.classList.add('show')); }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('show'); setTimeout(() => el.style.display = 'none', 250); }
}

// ==================== 设备检测 ====================
function isMobile() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ==================== 工具函数 ====================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  return date.getFullYear() + '-' +
    String(date.getMonth()+1).padStart(2,'0') + '-' +
    String(date.getDate()).padStart(2,'0') + ' ' +
    String(date.getHours()).padStart(2,'0') + ':' +
    String(date.getMinutes()).padStart(2,'0');
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

// ==================== 手机端 Action Sheet ====================
function showActionSheet(html) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = `<div class="app-action-sheet">${html}</div>`;
    
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    const sheet = overlay.querySelector('.app-action-sheet');
    
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closeActionSheet();
        resolve(null);
      }
    };
    
    function closeActionSheet() {
      sheet.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    }
    
    window.closeActionSheet = closeActionSheet;
  });
}
