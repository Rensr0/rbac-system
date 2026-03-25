/**
 * app-core.js v3.1 - 手机端核心路由系统
 * 从 app.js 拆分，只保留路由和首页逻辑
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

  var pageLoaders = {};

  window.registerPage = function (path, loader) {
    pageLoaders[path] = loader;
  };

  var AppRouter = {
    currentPage: 'home',
    pageStack: [],
    userRouters: [],

    init: function () {
      this.bindNavbar();
      var self = this;
      this.checkLogin().then(function () {
        self.loadUserRouters().then(function () {
          self.buildUI();
          self.navigate('home');
        });
      });
    },

    checkLogin: function () {
      return API.get('login/').then(function (res) {
        if (res.code !== 200) {
          window.location.href = '../index.html';
          return;
        }
        Storage.set('currentUser', res.data);
      });
    },

    loadUserRouters: function () {
      var self = this;
      return new Promise(function(resolve) {
        SharedOps.router.userRouters(function(res) {
          if (res.code === 200) {
            self.userRouters = res.data || [];
          }
          resolve();
        });
      });
    },

    buildUI: function () {
      this.buildPages();
      this.buildTabBar();
    },

    buildPages: function () {
      var container = document.getElementById('app-pages');
      if (!container) return;
      container.innerHTML = '';

      var paths = ['home'];
      this.userRouters.forEach(function (r) {
        if (r.router_path && paths.indexOf(r.router_path) === -1) {
          paths.push(r.router_path);
        }
      });
      if (paths.indexOf('mine') === -1) paths.push('mine');

      paths.forEach(function (path) {
        var div = document.createElement('div');
        div.className = 'app-page' + (path === 'home' ? ' active' : '');
        div.id = 'page-' + path;
        div.innerHTML = '<div class="app-page-content"></div>';
        container.appendChild(div);
      });
    },

    buildTabBar: function () {
      var tabBar = document.getElementById('app-tabbar');
      if (!tabBar) return;
      tabBar.innerHTML = '';

      var tabDefs = [];
      tabDefs.push({ page: 'home', icon: 'home', label: '首页' });

      // 从 API 返回的 userRouters 动态生成导航（与 PC 端侧边栏保持一致）
      var self = this;
      this.userRouters.forEach(function (r) {
        if (r.router_path && r.router_path !== 'home' && r.router_path !== 'mine') {
          // 去重：同一路径不重复添加
          var exists = tabDefs.some(function(t) { return t.page === r.router_path; });
          if (!exists) {
            tabDefs.push({ page: r.router_path, icon: r.icon || 'description', label: r.router_name });
          }
        }
      });

      tabDefs.push({ page: 'mine', icon: 'account_circle', label: '我的' });

      var overflowTabs = [];
      if (tabDefs.length > 5) {
        var home = tabDefs[0];
        var mine = tabDefs[tabDefs.length - 1];
        var middle = tabDefs.slice(1, tabDefs.length - 1);
        overflowTabs = middle.slice(3);
        var visibleMiddle = middle.slice(0, 3);
        tabDefs = [home].concat(visibleMiddle, [mine]);
      }

      tabDefs.forEach(function (tab, i) {
        var div = document.createElement('div');
        div.className = 'tab-item' + (i === 0 ? ' active' : '');
        div.dataset.page = tab.page;
        div.innerHTML = '<span class="tab-icon">' + renderIcon(tab.icon) + '</span><span class="tab-label">' + escapeHtml(tab.label) + '</span>';
        tabBar.appendChild(div);
      });

      if (overflowTabs.length > 0) {
        var moreBtn = document.createElement('div');
        moreBtn.className = 'tab-item tab-more';
        moreBtn.innerHTML = '<span class="tab-icon">' + mi('more_horiz') + '</span><span class="tab-label">更多</span>';
        moreBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          var existing = document.querySelector('.more-tabs-sheet');
          if (existing) { existing.remove(); return; }

          var sheetHtml = overflowTabs.map(function(t) {
            return '<div class="app-list-item" onclick="AppRouter.navigate(\'' + t.page + '\');this.closest(\'.more-tabs-sheet\').remove()">'
              + '<div class="item-icon">' + renderIcon(t.icon) + '</div>'
              + '<div class="item-content"><div class="item-title">' + escapeHtml(t.label) + '</div></div>'
              + '<div class="item-arrow">' + mi('chevron_right', 'mi-18') + '</div>'
              + '</div>';
          }).join('');

          var sheet = document.createElement('div');
          sheet.className = 'more-tabs-sheet';
          sheet.style.cssText = 'position:fixed;bottom:56px;left:0;right:0;background:var(--bg-card);border-radius:16px 16px 0 0;box-shadow:0 -4px 20px rgba(0,0,0,0.15);z-index:1000;padding:8px 0;max-height:50vh;overflow-y:auto;animation:slideUp 0.2s ease';
          sheet.innerHTML = '<div style="text-align:center;padding:8px 0 4px;font-size:12px;color:var(--text-secondary)">更多功能</div>' + sheetHtml;
          document.body.appendChild(sheet);

          setTimeout(function() {
            document.addEventListener('click', function handler() {
              sheet.remove();
              document.removeEventListener('click', handler);
            }, { once: true });
          }, 10);
        });
        tabBar.appendChild(moreBtn);
      }

      this.bindTabBar();
    },

    bindNavbar: function () {
      var self = this;
      var backBtn = document.getElementById('navbar-back');
      if (backBtn) {
        backBtn.addEventListener('click', function () { self.goBack(); });
      }
    },

    bindTabBar: function () {
      var self = this;
      document.querySelectorAll('.tab-item').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var page = tab.dataset.page;
          if (page === self.currentPage) return;
          self.navigate(page);
        });
      });
    },

    navigate: function (page, params) {
      params = params || {};
      var oldPage = document.querySelector('.app-page.active');
      var newPage = document.getElementById('page-' + page);
      if (!newPage) return;

      document.querySelectorAll('.tab-item').forEach(function (t) {
        t.classList.toggle('active', t.dataset.page === page);
      });

      var title = this.getRouteName(page);
      var navbar = document.querySelector('.app-navbar .navbar-title');
      if (navbar) navbar.textContent = title;

      var backBtn = document.getElementById('navbar-back');
      if (backBtn) {
        backBtn.style.display = page === 'home' ? 'none' : 'block';
      }

      if (oldPage) {
        oldPage.classList.remove('active');
        oldPage.classList.add('slide-out');
        setTimeout(function () { oldPage.classList.remove('slide-out'); }, 300);
      }
      newPage.classList.add('active');
      newPage.scrollTop = 0;

      this.currentPage = page;
      this.pageStack.push(page);
      this.loadPage(page, params);
    },

    goBack: function () {
      if (this.pageStack.length <= 1) return;
      this.pageStack.pop();
      var prevPage = this.pageStack[this.pageStack.length - 1];
      this.navigate(prevPage);
    },

    getRouteName: function (path) {
      if (path === 'home') return '首页';
      if (path === 'mine') return '我的';
      // 从 userRouters 查找路由名称
      var route = this.userRouters.find(function (r) { return r.router_path === path; });
      if (route) return route.router_name;
      // 兜底：常见的内置页面名称
      var builtIn = { user: '用户管理', role: '角色管理', router: '路由管理', log: '日志管理' };
      return builtIn[path] || '管理系统';
    },

    loadPage: function (page, params) {
      if (typeof pageLoaders[page] === 'function') {
        pageLoaders[page](params);
      } else {
        var container = document.getElementById('page-' + page);
        if (container) {
          container.querySelector('.app-page-content').innerHTML =
            '<div class="page-404">'
            + '<div class="code">404</div>'
            + '<div class="title">页面不存在</div>'
            + '<div class="desc">你访问的页面不存在或已被移除。</div>'
            + '<div class="actions">'
            + '<button class="app-btn app-btn-primary" onclick="AppRouter.navigate(\'home\')">' + mi('home', 'mi-18') + ' 返回首页</button>'
            + '</div></div>';
        }
      }
      if (window._checkIconFont) setTimeout(_checkIconFont, 50);
    }
  };

  window.AppRouter = AppRouter;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { AppRouter.init(); });
  } else {
    AppRouter.init();
  }
})();
