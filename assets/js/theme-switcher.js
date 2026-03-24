/**
 * 主题切换系统
 * 支持 PC 端浮动面板 + 手机端底部弹出
 */
(function () {
  'use strict';

  var THEMES = [
    { id: 'default', name: '星空蓝', dot: 'linear-gradient(135deg, #4F6EF7, #7B95FF)' },
    { id: 'dark',    name: '暗夜黑', dot: 'linear-gradient(135deg, #1C1C1E, #3A3A3C)' },
    { id: 'emerald', name: '翡翠绿', dot: 'linear-gradient(135deg, #059669, #34D399)' },
    { id: 'sunset',  name: '暖阳橙', dot: 'linear-gradient(135deg, #EA580C, #FB923C)' },
    { id: 'rose',    name: '樱粉红', dot: 'linear-gradient(135deg, #DB2777, #F472B6)' },
    { id: 'violet',  name: '薰衣紫', dot: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }
  ];

  // 应用主题
  function applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId || 'default');
    try { localStorage.setItem('rbac-theme', themeId || 'default'); } catch(e) {}
    // 更新所有选中状态
    document.querySelectorAll('.theme-option').forEach(function (el) {
      el.classList.toggle('active', el.dataset.theme === themeId);
    });
  }

  // 获取当前主题
  function getCurrentTheme() {
    try { return localStorage.getItem('rbac-theme') || 'default'; } catch(e) { return 'default'; }
  }

  // 生成主题选项 HTML
  function renderThemeOptions() {
    var current = getCurrentTheme();
    return THEMES.map(function (t) {
      return '<div class="theme-option' + (t.id === current ? ' active' : '') + '" data-theme="' + t.id + '" onclick="ThemeSwitcher.set(\'' + t.id + '\')">'
        + '<div class="theme-dot" style="background:' + t.dot + '"></div>'
        + '<div class="theme-label">' + t.name + '</div>'
        + '</div>';
    }).join('');
  }

  // PC 端：创建浮动面板
  function initPC(container) {
    if (!container) return;
    var html = '<div class="theme-switcher">'
      + '<button class="theme-toggle-btn" onclick="ThemeSwitcher.toggle()" title="切换主题">🎨</button>'
      + '<div class="theme-panel" id="theme-panel">'
      + '<div class="theme-panel-title">选择主题</div>'
      + '<div class="theme-grid">' + renderThemeOptions() + '</div>'
      + '</div>'
      + '</div>';
    container.insertAdjacentHTML('beforeend', html);
  }

  // 手机端：底部 ActionSheet
  function showMobileSheet() {
    createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">切换主题</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="theme-grid">' + renderThemeOptions() + '</div>'
      + '</div>'
      + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
    );
  }

  // 点击外部关闭面板
  document.addEventListener('click', function (e) {
    var panel = document.getElementById('theme-panel');
    var btn = document.querySelector('.theme-toggle-btn');
    if (panel && panel.classList.contains('show')) {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('show');
      }
    }
  });

  // 初始化：应用保存的主题
  applyTheme(getCurrentTheme());

  // 导出全局接口
  window.ThemeSwitcher = {
    set: applyTheme,
    get: getCurrentTheme,
    toggle: function () {
      var panel = document.getElementById('theme-panel');
      if (panel) panel.classList.toggle('show');
    },
    initPC: initPC,
    showMobileSheet: showMobileSheet,
    themes: THEMES
  };
})();
