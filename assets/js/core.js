/**
 * core.js v2.0 - 核心请求库 + 权限工具 + 通用 UI 组件
 */
var API = (function () {
  // 自动检测 API 基础路径
  var path = window.location.pathname;
  var BASE = path.indexOf('/pages/') !== -1 ? '../api' : 'api';

  function request(url, options) {
    options = options || {};
    var method = options.method || 'GET';
    var data = options.data || null;
    var params = options.params || {};

    var fullUrl = BASE + '/' + url;
    var queryStr = Object.entries(params)
      .filter(function (pair) { return pair[1] !== null && pair[1] !== undefined && pair[1] !== ''; })
      .map(function (pair) { return encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]); })
      .join('&');
    if (queryStr) fullUrl += '?' + queryStr;

    var fetchOptions = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    return fetch(fullUrl, fetchOptions)
      .then(function (res) {
        var contentType = res.headers.get('content-type') || '';
        if (contentType.indexOf('application/json') === -1) {
          return res.text().then(function (html) {
            console.error('API 返回非 JSON:', html.substring(0, 200));
            return { code: 500, msg: '服务器返回了异常内容', data: null };
          });
        }
        return res.json();
      })
      .catch(function (err) {
        console.error('API Error:', err);
        return { code: 500, msg: err.message || '网络请求失败', data: null };
      });
  }

  return {
    get: function (url, params) { return request(url, { method: 'GET', params: params }); },
    post: function (url, data) { return request(url, { method: 'POST', data: data }); },
    put: function (url, data) { return request(url, { method: 'PUT', data: data }); },
    del: function (url, data) { return request(url, { method: 'DELETE', data: data }); },
  };
})();

// ==================== 本地存储 ====================
var Storage = {
  get: function (key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch (e) { return null; }
  },
  set: function (key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove: function (key) { localStorage.removeItem(key); },
};

// ==================== Toast ====================
function showToast(msg, duration) {
  duration = duration || 2000;
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(function () { toast.remove(); }, duration);
}

function appToast(msg, duration) {
  duration = duration || 2000;
  var toast = document.createElement('div');
  toast.className = 'app-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, duration);
}

// ==================== Loading ====================
function showLoading() {
  var mask = document.querySelector('.loading-mask');
  if (!mask) {
    mask = document.createElement('div');
    mask.className = 'loading-mask';
    mask.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(mask);
  }
  mask.classList.add('show');
}

function hideLoading() {
  var mask = document.querySelector('.loading-mask');
  if (mask) mask.classList.remove('show');
}

function appShowLoading() {
  var el = document.querySelector('.app-loading');
  if (!el) {
    el = document.createElement('div');
    el.className = 'app-loading';
    el.innerHTML = '<div class="app-loading-inner"><div class="loading-spinner"></div></div>';
    document.body.appendChild(el);
  }
  el.classList.add('show');
}

function appHideLoading() {
  var el = document.querySelector('.app-loading');
  if (el) el.classList.remove('show');
}

// ==================== 确认弹窗 ====================
function confirmDialog(title, content) {
  return new Promise(function (resolve) {
    var isMobileDevice = window.innerWidth <= 768;
    var overlay = document.createElement('div');

    if (isMobileDevice) {
      overlay.className = 'app-dialog-overlay show';
      overlay.innerHTML =
        '<div class="app-dialog">'
        + '<div class="dialog-title">' + title + '</div>'
        + '<div class="dialog-content">' + content + '</div>'
        + '<div class="dialog-actions">'
        + '<button class="dialog-btn" id="dlg-cancel">取消</button>'
        + '<button class="dialog-btn primary" id="dlg-ok">确定</button>'
        + '</div></div>';
    } else {
      overlay.className = 'modal-overlay';
      overlay.innerHTML =
        '<div class="modal">'
        + '<div class="modal-header"><h3>' + title + '</h3></div>'
        + '<div class="modal-body"><p>' + content + '</p></div>'
        + '<div class="modal-footer">'
        + '<button class="btn btn-outline" id="dlg-cancel">取消</button>'
        + '<button class="btn btn-primary" id="dlg-ok">确定</button>'
        + '</div></div>';
    }

    document.body.appendChild(overlay);

    // 触发动画：PC 端需要 .show，手机端已在 classList 中
    if (!isMobileDevice) {
      requestAnimationFrame(function () { overlay.classList.add('show'); });
    }

    overlay.querySelector('#dlg-cancel').onclick = function () {
      overlay.classList.remove('show');
      setTimeout(function () { overlay.remove(); }, 250);
      resolve(false);
    };
    overlay.querySelector('#dlg-ok').onclick = function () {
      overlay.classList.remove('show');
      setTimeout(function () { overlay.remove(); }, 250);
      resolve(true);
    };
  });
}

// ==================== 弹窗（Modal） ====================
function openModal(id) {
  var el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex';
    requestAnimationFrame(function () { el.classList.add('show'); });
  }
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) {
    el.classList.remove('show');
    setTimeout(function () { el.style.display = 'none'; }, 250);
  }
}

// ==================== 设备检测 ====================
function isMobile() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ==================== 工具函数 ====================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '-';
  var date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.getFullYear() + '-'
    + String(date.getMonth() + 1).padStart(2, '0') + '-'
    + String(date.getDate()).padStart(2, '0') + ' '
    + String(date.getHours()).padStart(2, '0') + ':'
    + String(date.getMinutes()).padStart(2, '0');
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

// ==================== 手机端 Action Sheet（通用） ====================
function showActionSheet(html) {
  return new Promise(function (resolve) {
    var overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = '<div class="app-action-sheet">' + html + '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('show'); });

    overlay.onclick = function (e) {
      if (e.target === overlay) {
        closeActionSheet();
        resolve(null);
      }
    };

    window.closeActionSheet = function () {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(function () { overlay.remove(); }, 300);
    };
  });
}
