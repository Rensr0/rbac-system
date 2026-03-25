/**
 * core.js v3.0 - 核心请求库 + 权限工具 + 通用 UI 组件
 * Material Icons 替代 emoji
 */
var API = (function () {
  var path = window.location.pathname;
  var BASE = path.indexOf('/pages/') !== -1 ? '../api' : 'api';

  function redirectToLogin() {
    // 避免在登录页自身重复重定向（死循环）
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
    var raw = options.raw || false; // raw 模式：不自动处理 401 重定向

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
        // 会话过期拦截 - HTTP 状态码检测
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
          // JSON 层面的 401 检测（兼容未设置 HTTP 状态码的情况）
          if (json.code === 401 && !raw) {
            redirectToLogin();
          }
          return json;
        });
      })
      .catch(function (err) {
        console.error('API Error:', err);
        var msg = '网络请求失败，请检查网络连接';
        // 区分网络断开和服务器错误
        if (!navigator.onLine) {
          msg = '网络已断开，请检查网络连接';
        } else if (err.message && err.message.indexOf('Failed to fetch') !== -1) {
          msg = '无法连接到服务器，请稍后重试';
        }
        // 显示网络错误提示（仅在非 raw 模式下）
        if (!raw) {
          if (typeof showToast === 'function') showToast(msg, 3000);
          else if (typeof appToast === 'function') appToast(msg, 3000);
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

// ==================== Material Icons 辅助 ====================
var KNOWN_ICONS = ['home','group','security','route','account_circle','login','logout','search',
  'delete','edit','add','settings','lock','email','phone','calendar_today','arrow_forward',
  'arrow_back','dashboard','menu','close','check','warning','error','info','refresh',
  'person','person_add','lock_reset','visibility','shield','key','link','sort','toggle_on',
  'toggle_off','verified_user','admin_panel_settings','manage_accounts','supervised_user_circle',
  'badge','contact_mail','alternate_email','vpn_key','how_to_reg','rocket_launch','chevron_right',
  'edit_note','logout','inbox','search_off','description','save','palette','expand_more','block',
  'check_circle','star','folder','analytics','assessment','trending_up','bar_chart','pie_chart',
  'timeline','event','schedule','notifications','favorite','share','download','upload','cloud',
  'storage','backup','privacy_policy','help','support'];

function mi(name, cls) {
  return '<i class="mi' + (cls ? ' ' + cls : '') + '">' + name + '</i>';
}
function miSpan(name, text, cls) {
  return '<span style="display:inline-flex;align-items:center;gap:6px">' + mi(name, cls) + escapeHtml(text) + '</span>';
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

// ===== Material Icons 字体加载失败检测 + 占位符 fallback =====
(function () {
  var FONT_NAME = '1em "Material Icons"';
  var PLACEHOLDER = '\u2662'; // ♢
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
      // 字体加载完成后再检查一次
      document.fonts.ready.then(function () {
        if (!document.fonts.check(FONT_NAME)) {
          applyFallback();
        }
      });
    }
  }

  // DOM ready 后检测
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndApply);
  } else {
    checkAndApply();
  }

  // 暴露方法供动态渲染后调用
  window._checkIconFont = function () {
    if (document.fonts && document.fonts.check && !document.fonts.check(FONT_NAME)) {
      applyFallback();
    }
  };
})();

function iconSelectHtml(selected) {
  return KNOWN_ICONS.map(function (icon) {
    return '<option value="' + icon + '"' + (icon === selected ? ' selected' : '') + '>' + icon + '</option>';
  }).join('');
}

// ==================== 本地存储 ====================
var Storage = {
  get: function (key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch (e) { return null; }
  },
  set: function (key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove: function (key) { localStorage.removeItem(key); },
};

// ==================== Cookie 工具 ====================
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
/**
 * 创建并显示一个 Action Sheet，自动处理关闭逻辑。
 * @param {string} innerHtml - sheet 内部 HTML（不含 overlay 包裹）
 * @param {object} [opts] - 可选配置 { maxHeight: '85vh' }
 * @returns {HTMLElement} overlay 元素
 */
function createActionSheet(innerHtml, opts) {
  opts = opts || {};
  var overlay = document.createElement('div');
  overlay.className = 'app-action-sheet-overlay show';
  var sheetStyle = 'transform:translateY(0)';
  if (opts.maxHeight) sheetStyle += ';max-height:' + opts.maxHeight;
  overlay.innerHTML = '<div class="app-action-sheet" style="' + sheetStyle + '">' + innerHtml + '</div>';
  document.body.appendChild(overlay);

  window.closeActionSheet = function () {
    overlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
    setTimeout(function () { overlay.remove(); }, 350);
  };

  overlay.onclick = function (e) {
    if (e.target === overlay) window.closeActionSheet();
  };

  return overlay;
}

function closeActionSheet() {
  if (typeof window.closeActionSheet === 'function') window.closeActionSheet();
}

// ==================== 图标选择器 ====================
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

  if (mobile) {
    createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">选择图标</div>'
      + '<div style="padding:0 12px 16px">'
      + '<div class="icon-pick-grid">' + iconGridHtml + '</div>'
      + '</div>'
      + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>',
      { maxHeight: '70vh' }
    );
  } else {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal" style="max-width:560px">'
      + '<div class="modal-header"><h3>选择图标</h3><button class="modal-close" onclick="this.closest(\'.modal-overlay\').classList.remove(\'show\');setTimeout(function(){event.target.closest(\'.modal-overlay\').remove()},250)">✕</button></div>'
      + '<div class="modal-body" style="max-height:60vh;overflow-y:auto">'
      + '<div class="icon-pick-grid">' + iconGridHtml + '</div>'
      + '</div></div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('show'); });

    overlay.onclick = function (e) {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 250);
      }
    };
  }

  // 绑定点击事件
  document.querySelectorAll('.icon-pick-item').forEach(function (item) {
    item.addEventListener('click', function () {
      var icon = item.dataset.icon;
      if (input) input.value = icon;
      // 更新选中态
      document.querySelectorAll('.icon-pick-item').forEach(function (i) { i.classList.remove('active'); });
      document.querySelectorAll('.icon-pick-item[data-icon="' + icon + '"]').forEach(function (i) { i.classList.add('active'); });
      // 关闭选择器
      if (mobile) {
        closeActionSheet();
      } else {
        var ov = item.closest('.modal-overlay');
        if (ov) { ov.classList.remove('show'); setTimeout(function () { ov.remove(); }, 250); }
      }
      if (typeof onChange === 'function') onChange(icon);
    });
  });
}

function iconSelectHtml(selected, inputId) {
  inputId = inputId || '';
  return '<input type="hidden" id="' + inputId + '" value="' + (selected || '') + '">'
    + '<div class="icon-pick-trigger" onclick="openIconPicker(\'' + inputId + '\')" id="' + (inputId ? inputId + '-preview' : 'icon-pick-preview') + '">'
    + (selected ? '<i class="mi">' + selected + '</i> ' + selected : '<i class="mi">palette</i> 选择图标')
    + '</div>';
}

// ==================== 验证码工具 ====================
function getCaptchaUrl() {
  return API.get('login/', { action: 'captcha' });
}

// ==================== 密码强度检测 ====================
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
    bars.forEach(function(bar, i) {
      bar.style.background = i < result.level ? result.color : 'var(--border)';
    });
    text.textContent = '密码强度：' + result.text;
    text.style.color = result.color;
  });
}

// ==================== 网络状态监听 ====================
(function() {
  var offlineToast = null;
  function showOfflineTip() {
    if (offlineToast) return;
    offlineToast = document.createElement('div');
    offlineToast.className = 'offline-tip';
    offlineToast.innerHTML = '<i class="mi mi-16" style="color:#ff6b6b">wifi_off</i> 网络已断开，请检查网络连接';
    offlineToast.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#1a1a2e;color:#fff;text-align:center;padding:8px;font-size:13px;transition:transform 0.3s;transform:translateY(-100%);display:flex;align-items:center;justify-content:center;gap:6px';
    document.body.appendChild(offlineToast);
    requestAnimationFrame(function() { offlineToast.style.transform = 'translateY(0)'; });
  }
  function hideOfflineTip() {
    if (!offlineToast) return;
    offlineToast.style.transform = 'translateY(-100%)';
    setTimeout(function() { if (offlineToast) { offlineToast.remove(); offlineToast = null; } }, 300);
  }
  window.addEventListener('offline', showOfflineTip);
  window.addEventListener('online', hideOfflineTip);
  if (!navigator.onLine) showOfflineTip();
})();
