/**
 * pc-core.js - PC 端核心状态与导航
 * 从 pc-pages.js 拆分，包含共享状态和页面路由
 */
var PCPages = window.PCPages || {};

(function () {
  var _userPage = 1;
  var _logPage = 1;

  function init(user, routers) {
    // 保留兼容（已不使用，初始化由 home.html 中的 IIFE 处理）
  }

  // 导航到指定页面
  PCPages.init = init;

  Object.defineProperty(PCPages, 'userPage', {
    get: function () { return _userPage; },
    set: function (v) { _userPage = v; },
    enumerable: true
  });
  Object.defineProperty(PCPages, 'logPage', {
    get: function () { return _logPage; },
    set: function (v) { _logPage = v; },
    enumerable: true
  });

  window._userRouters = window._userRouters || [];
})();
