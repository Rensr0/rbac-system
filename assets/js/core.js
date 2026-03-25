/**
 * core.js v3.1 - 核心请求库 + 权限工具 + 通用 UI 组件
 * 重构：全局变量迁移到 UI 命名空间
 */
var API = (function () {
  var path = window.location.pathname;
  var BASE = path.indexOf('/pages/') !== -1 ? '../api' : 'api';

  function redirectToLogin() {
    if (window.location.pathname.indexOf('index.html') !== -1 ||
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('/')) {
      return;
    }
    Storage.remove('currentUser');
    var loginUrl = window.location.pathname.indexOf('/pages/') !== -1
      ? '../index.html'
      : 'index.html';
    window.location.href = loginUrl;
  }

  function request(url, options) {
    options = options || {};
    var method = options.method || 'GET';
    var data = options.data || null;
    var params = options.params || {};
    var raw = options.raw || false;

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
        if (res.status === 401) {
          if (!raw) redirectToLogin();
          return { code: 401, msg: '登录已过期', data: null };
        }
        var contentType = res.headers.get('content-type') || '';
        if (contentType.indexOf('application/json') === -1) {
          return res.text().then(function (html) {
            console.error('API 返回非 JSON:', html.substring(0, 200));
            return { code: 500, msg: '服务器返回了异常内容', data: null };
          });
        }
        return res.json().then(function (json) {
          if (json.code === 401 && !raw) {
            redirectToLogin();
          }
          return json;
        });
      })
      .catch(function (err) {
        console.error('API Error:', err);
        var msg = '网络请求失败，请检查网络连接';
        if (!navigator.onLine) {
          msg = '网络已断开，请检查网络连接';
        } else if (err.message && err.message.indexOf('Failed to fetch') !== -1) {
          msg = '无法连接到服务器，请稍后重试';
        }
        if (!raw) {
          UI.toast(msg, 3000);
        }
        return { code: 500, msg: msg, data: null };
      });
  }

  return {
    base: BASE,
    get: function (url, params, opts) {
      var options = { method: 'GET', params: params };
      if (opts) { options.raw = opts.raw; }
      return request(url, options);
    },
    post: function (url, data) { return request(url, { method: 'POST', data: data }); },
    put: function (url, data) { return request(url, { method: 'PUT', data: data }); },
    del: function (url, data) { return request(url, { method: 'DELETE', data: data }); },
    raw: function (url, params) { return request(url, { method: 'GET', params: params, raw: true }); },
  };
})();

var UI = (function () {
  'use strict';

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

  return {
    toast: showToast,
    appToast: appToast,
    showLoading: showLoading,
    hideLoading: hideLoading,
    appShowLoading: appShowLoading,
    appHideLoading: appHideLoading,
    confirm: confirmDialog,
    openModal: openModal,
    closeModal: closeModal
  };
})();

var Utils = (function () {
  'use strict';

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

  function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  return {
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    getInitial: getInitial,
    isMobile: isMobile
  };
})();

var Storage = {
  get: function (key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch (e) { return null; }
  },
  set: function (key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove: function (key) { localStorage.removeItem(key); },
};

function setCookie(name, value, days) {
  var d = new Date();
  d.setTime(d.getTime() + (days || 30) * 24 * 60 * 60 * 1000);
  document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}
function getCookie(name) {
  var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
function deleteCookie(name) {
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
}

var KNOWN_ICONS = ['home','group','security','route','account_circle','login','logout','search',
  'delete','edit','add','settings','lock','email','phone','calendar_today','arrow_forward',
  'arrow_back','dashboard','menu','close','check','warning','error','info','refresh',
  'person','person_add','lock_reset','visibility','shield','key','link','sort','toggle_on',
  'toggle_off','verified_user','admin_panel_settings','manage_accounts','supervised_user_circle',
  'badge','contact_mail','alternate_email','vpn_key','how_to_reg','rocket_launch','chevron_right',
  'edit_note','logout','inbox','search_off','description','save','palette','expand_more','block',
  'check_circle','star','folder','analytics','assessment','trending_up','bar_chart','pie_chart',
  'timeline','event','schedule','notifications','favorite','share','download','upload','cloud',
  'storage','backup','help','support'];

function mi(name, cls) {
  return '<i class="mi' + (cls ? ' ' + cls : '') + '">' + name + '</i>';
}
function miSpan(name, text, cls) {
  return '<span style="display:inline-flex;align-items:center;gap:6px">' + mi(name, cls) + Utils.escapeHtml(text) + '</span>';
}

function renderIcon(iconText) {
  var fontOk = !(document.fonts && document.fonts.check) || document.fonts.check('1em "Material Icons"');
  if (!fontOk) {
    return '<i class="mi mi-fallback">\u2662</i>';
  }
  if (KNOWN_ICONS.indexOf(iconText) !== -1) {
    return '<i class="mi">' + iconText + '</i>';
  }
  return iconText || '<i class="mi">description</i>';
}

(function () {
  var FONT_NAME = '1em "Material Icons"';
  var PLACEHOLDER = '\u2662';
  var checked = false;

  function applyFallback() {
    document.querySelectorAll('.mi').forEach(function (el) {
      if (!el.classList.contains('mi-fallback')) {
        el.textContent = PLACEHOLDER;
        el.classList.add('mi-fallback');
      }
    });
  }

  function checkAndApply() {
    if (checked) return;
    checked = true;
    if (document.fonts && document.fonts.check) {
      if (!document.fonts.check(FONT_NAME)) {
        applyFallback();
      }
      document.fonts.ready.then(function () {
        if (!document.fonts.check(FONT_NAME)) {
          applyFallback();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndApply);
  } else {
    checkAndApply();
  }

  window._checkIconFont = function () {
    if (document.fonts && document.fonts.check && !document.fonts.check(FONT_NAME)) {
      applyFallback();
    }
  };
})();

function iconSelectHtml(selected, inputId) {
  inputId = inputId || '';
  return '<input type="hidden" id="' + inputId + '" value="' + (selected || '') + '">'
    + '<div class="icon-pick-trigger" onclick="openIconPicker(\'' + inputId + '\')" id="' + (inputId ? inputId + '-preview' : 'icon-pick-preview') + '">'
    + (selected ? '<i class="mi">' + selected + '</i> ' + selected : '<i class="mi">palette</i> 选择图标')
    + '</div>';
}

function createActionSheet(innerHtml, opts) {
  opts = opts || {};
  var overlay = document.createElement('div');
  overlay.className = 'app-action-sheet-overlay show';
  var sheetStyle = 'transform:translateY(0)';
  if (opts.maxHeight) sheetStyle += ';max-height:' + opts.maxHeight;
  overlay.innerHTML = '<div class="app-action-sheet" style="' + sheetStyle + '">' + innerHtml + '</div>';
  document.body.appendChild(overlay);

  var prevClose = window.closeActionSheet;

  window.closeActionSheet = function () {
    overlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
    setTimeout(function () { overlay.remove(); }, 350);
    window.closeActionSheet = prevClose;
  };

  overlay.onclick = function (e) {
    if (e.target === overlay) window.closeActionSheet();
  };

  return overlay;
}

function closeActionSheet() {
  if (typeof window.closeActionSheet === 'function') window.closeActionSheet();
}

function openIconPicker(inputId, onChange) {
  var input = document.getElementById(inputId);
  var current = input ? input.value : '';
  var mobile = window.innerWidth <= 768;

  var iconGridHtml = KNOWN_ICONS.map(function (icon) {
    var active = icon === current ? ' active' : '';
    return '<div class="icon-pick-item' + active + '" data-icon="' + icon + '" title="' + icon + '">'
      + '<i class="mi">' + icon + '</i>'
      + '</div>';
  }).join('');

  var pickerOverlay;

  if (mobile) {
    var parentClose = window.closeActionSheet;
    pickerOverlay = createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">选择图标</div>'
      + '<div style="padding:0 12px 8px">'
      + '<div class="app-search" style="margin-bottom:8px"><span class="search-icon">' + mi('search', 'mi-16') + '</span><input type="text" placeholder="搜索图标名称..." id="icon-pick-search" oninput="filterIconPicker(this.value)"></div>'
      + '<div class="icon-pick-grid">' + iconGridHtml + '</div>'
      + '</div>'
      + '<div class="sheet-cancel" id="icon-pick-cancel">取消</div>',
      { maxHeight: '70vh' }
    );
    window.closeActionSheet = parentClose;

    function closePicker() {
      pickerOverlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
      setTimeout(function () { pickerOverlay.remove(); }, 350);
    }
    pickerOverlay.querySelector('#icon-pick-cancel').onclick = closePicker;
    pickerOverlay.onclick = function (e) {
      if (e.target === pickerOverlay) closePicker();
    };
  } else {
    pickerOverlay = document.createElement('div');
    pickerOverlay.className = 'modal-overlay';
    pickerOverlay.innerHTML =
      '<div class="modal" style="max-width:560px">'
      + '<div class="modal-header"><h3>选择图标</h3><button class="modal-close" id="icon-pick-close">✕</button></div>'
      + '<div class="modal-body" style="max-height:60vh;overflow-y:auto">'
      + '<div style="margin-bottom:10px"><input class="form-input" type="text" placeholder="搜索图标名称..." id="icon-pick-search" oninput="filterIconPicker(this.value)"></div>'
      + '<div class="icon-pick-grid">' + iconGridHtml + '</div>'
      + '</div></div>';
    document.body.appendChild(pickerOverlay);
    requestAnimationFrame(function () { pickerOverlay.classList.add('show'); });

    function closePickerModal() {
      pickerOverlay.classList.remove('show');
      setTimeout(function () { pickerOverlay.remove(); }, 250);
    }
    pickerOverlay.querySelector('#icon-pick-close').onclick = closePickerModal;
    pickerOverlay.onclick = function (e) {
      if (e.target === pickerOverlay) closePickerModal();
    };
  }

  var pickerItems = pickerOverlay.querySelectorAll('.icon-pick-item');
  for (var i = 0; i < pickerItems.length; i++) {
    (function (item) {
      item.addEventListener('click', function () {
        var icon = item.dataset.icon;
        if (input) input.value = icon;
        pickerOverlay.querySelectorAll('.icon-pick-item').forEach(function (el) { el.classList.remove('active'); });
        item.classList.add('active');
        if (mobile) {
          pickerOverlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
          setTimeout(function () { pickerOverlay.remove(); }, 350);
        } else {
          pickerOverlay.classList.remove('show');
          setTimeout(function () { pickerOverlay.remove(); }, 250);
        }
        if (typeof onChange === 'function') onChange(icon);
      });
    })(pickerItems[i]);
  }
}

window.filterIconPicker = function(keyword) {
  keyword = (keyword || '').toLowerCase();
  var items = document.querySelectorAll('.icon-pick-item');
  for (var i = 0; i < items.length; i++) {
    var icon = items[i].dataset.icon || '';
    var title = items[i].getAttribute('title') || '';
    var match = keyword === '' || icon.indexOf(keyword) !== -1 || title.indexOf(keyword) !== -1;
    items[i].style.display = match ? '' : 'none';
  }
};

function checkPwdStrength(pwd) {
  if (!pwd) return { level: 0, text: '', color: '' };
  var score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 1) return { level: 1, text: '弱', color: '#ff6b6b' };
  if (score <= 3) return { level: 2, text: '中', color: '#ffa726' };
  return { level: 3, text: '强', color: '#66bb6a' };
}

function pwdStrengthHtml(inputId) {
  return '<div class="pwd-strength" id="' + inputId + '-strength" style="display:none">'
    + '<div style="display:flex;gap:4px;margin-top:6px">'
    + '<div class="str-bar" style="flex:1;height:3px;border-radius:2px;background:var(--border)"></div>'
    + '<div class="str-bar" style="flex:1;height:3px;border-radius:2px;background:var(--border)"></div>'
    + '<div class="str-bar" style="flex:1;height:3px;border-radius:2px;background:var(--border)"></div>'
    + '</div>'
    + '<span class="str-text" style="font-size:11px;margin-top:2px;display:block;color:var(--text-secondary)"></span>'
    + '</div>';
}

function bindPwdStrength(inputId) {
  var input = document.getElementById(inputId);
  var container = document.getElementById(inputId + '-strength');
  if (!input || !container) return;
  input.addEventListener('input', function() {
    var val = input.value;
    if (!val) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    var result = checkPwdStrength(val);
    var bars = container.querySelectorAll('.str-bar');
    var text = container.querySelector('.str-text');
    if (text) text.textContent = result.text;
    for (var i = 0; i < bars.length; i++) {
      if (i < result.level) {
        bars[i].style.background = result.color;
      } else {
        bars[i].style.background = 'var(--border)';
      }
    }
  });
}

function checkPwdStrengthCore(pwd) {
  return checkPwdStrength(pwd);
}

// ==================== 键盘快捷键 ====================
(function() {
  document.addEventListener('keydown', function(e) {
    // Esc: 关闭弹窗/action sheet
    if (e.key === 'Escape') {
      // PC 端关闭 modal
      var openModal = document.querySelector('.modal-overlay.show');
      if (openModal) {
        openModal.classList.remove('show');
        setTimeout(function() { openModal.style.display = 'none'; }, 250);
        return;
      }
      // 移动端关闭 action sheet
      var sheetOverlay = document.querySelector('.app-action-sheet-overlay.show');
      if (sheetOverlay) {
        var sheet = sheetOverlay.querySelector('.app-action-sheet');
        if (sheet) sheet.style.transform = 'translateY(100%)';
        setTimeout(function() { sheetOverlay.remove(); }, 350);
        return;
      }
      // PC 端关闭主题面板
      var themePanel = document.getElementById('theme-panel');
      if (themePanel && themePanel.classList.contains('show')) {
        themePanel.classList.remove('show');
        return;
      }
    }

    // Ctrl+K: 聚焦搜索框（跳过输入框内的情况，除非在搜索框里）
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      var searchInput = document.querySelector('.app-search input, .search-bar input, #user-search, #log-search, #pc-user-search, #pc-log-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });
})();

window.showToast = UI.toast;
window.appToast = UI.appToast;
window.showLoading = UI.showLoading;
window.hideLoading = UI.hideLoading;
window.appShowLoading = UI.appShowLoading;
window.appHideLoading = UI.appHideLoading;
window.confirmDialog = UI.confirm;
window.openModal = UI.openModal;
window.closeModal = UI.closeModal;
window.escapeHtml = Utils.escapeHtml;
window.formatDate = Utils.formatDate;
window.getInitial = Utils.getInitial;
window.isMobile = Utils.isMobile;
