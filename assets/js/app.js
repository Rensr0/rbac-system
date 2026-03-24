/**
 * app.js v3.0 - 手机端 APP 路由系统
 * 业务操作通过 SharedOps 共享
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
        if (paths.indexOf(r.router_path) === -1) {
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

      var self = this;
      this.userRouters.forEach(function (r) {
        if (r.router_path !== 'home' && r.router_path !== 'mine') {
          tabDefs.push({ page: r.router_path, icon: r.icon || 'description', label: r.router_name });
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

      // 如果有溢出的 Tab，添加"更多"按钮
      if (overflowTabs.length > 0) {
        var moreBtn = document.createElement('div');
        moreBtn.className = 'tab-item tab-more';
        moreBtn.innerHTML = '<span class="tab-icon">' + mi('more_horiz') + '</span><span class="tab-label">更多</span>';
        moreBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          var self = this;
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

          // 点击外部关闭
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
      var route = this.userRouters.find(function (r) { return r.router_path === path; });
      return route ? route.router_name : '管理系统';
    },

    loadPage: function (page, params) {
      if (typeof pageLoaders[page] === 'function') {
        pageLoaders[page](params);
      } else {
        var container = document.getElementById('page-' + page);
        if (container) {
          container.querySelector('.app-page-content').innerHTML =
            '<div class="empty-state"><div class="empty-icon">' + mi('warning', 'mi-xl') + '</div><p>页面加载器未注册</p></div>';
        }
      }
    }
  };

  // ==================== 首页 ====================
  registerPage('home', function () {
    var content = document.getElementById('page-home');
    if (!content) return;

    var currentUser = Storage.get('currentUser') || {};
    var isSuper = currentUser.is_super == 1;
    var routerCount = AppRouter.userRouters.length;

    var quickActions = '';
    AppRouter.userRouters.forEach(function (r) {
      if (r.router_path === 'home' || r.router_path === 'mine') return;
      quickActions +=
        '<div class="app-list-item" onclick="AppRouter.navigate(\'' + r.router_path + '\')">'
        + '<div class="item-icon">' + renderIcon(r.icon) + '</div>'
        + '<div class="item-content">'
        + '<div class="item-title">' + escapeHtml(r.router_name) + '</div>'
        + '<div class="item-desc">点击进入' + escapeHtml(r.router_name) + '</div>'
        + '</div>'
        + '<div class="item-arrow">' + mi('chevron_right', 'mi-18') + '</div>'
        + '</div>';
    });

    quickActions +=
      '<div class="app-list-item" onclick="AppRouter.navigate(\'mine\')">'
      + '<div class="item-icon">' + mi('account_circle') + '</div>'
      + '<div class="item-content">'
      + '<div class="item-title">个人中心</div>'
      + '<div class="item-desc">查看个人信息、修改密码</div>'
      + '</div>'
      + '<div class="item-arrow">' + mi('chevron_right', 'mi-18') + '</div>'
      + '</div>';

    if (isSuper) {
      appShowLoading();
      Promise.all([
        API.get('user/', { limit: 1 }),
        API.get('role/', { limit: 100 })
      ]).then(function (results) {
        appHideLoading();
        var userRes = results[0], roleRes = results[1];
        var userTotal = userRes.code === 200 ? (userRes.data && userRes.data.total || 0) : 0;
        var roleTotal = roleRes.code === 200 ? (roleRes.data && roleRes.data.total || 0) : 0;

        content.innerHTML =
          '<div class="app-page-content">'
          + '<div class="app-stats">'
          + '<div class="app-stat-card"><div class="stat-num">' + userTotal + '</div><div class="stat-name">系统用户</div></div>'
          + '<div class="app-stat-card"><div class="stat-num">' + roleTotal + '</div><div class="stat-name">角色数量</div></div>'
          + '<div class="app-stat-card"><div class="stat-num">' + routerCount + '</div><div class="stat-name">可用功能</div></div>'
          + '<div class="app-stat-card"><div class="stat-num">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-name">系统状态</div></div>'
          + '</div>'
          + '<div class="app-card">'
          + '<div class="app-card-header"><h3>' + mi('rocket_launch') + ' 快捷操作</h3></div>'
          + '<div class="app-list">' + quickActions + '</div>'
          + '</div></div>';
      });
    } else {
      // 普通用户 - 不暴露敏感统计数据
      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-stats">'
        + '<div class="app-stat-card"><div class="stat-num">' + routerCount + '</div><div class="stat-name">可用功能</div></div>'
        + '<div class="app-stat-card"><div class="stat-num">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-name">系统状态</div></div>'
        + '</div>'
        + '<div class="app-card">'
        + '<div class="app-card-header"><h3>' + mi('rocket_launch') + ' 快捷操作</h3></div>'
        + '<div class="app-list">' + quickActions + '</div>'
        + '</div></div>';
    }
  });

  // ==================== 用户管理 ====================
  registerPage('user', function () {
    var content = document.getElementById('page-user');
    if (!content) return;

    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;

    appShowLoading();
    SharedOps.user.search('', 1, 20, function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }

      var list = (res.data || {}).list || [];

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-search">'
        + '<span class="search-icon">' + mi('search', 'mi-18') + '</span>'
        + '<input type="text" placeholder="搜索用户名或昵称" id="user-search" onkeyup="if(event.key===\'Enter\')searchUsers()">'
        + '</div>'
        + '<div id="user-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('inbox', 'mi-xl') + '</div><p>暂无用户数据</p></div>' : '')
        + list.map(function (u) { return renderUserCard(u); }).join('')
        + '</div>'
        + (isSuper ? '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddUserSheet()">' + mi('add', 'mi-18') + ' 添加用户</button></div>' : '')
        + '</div>';
    });
  });

  function renderUserCard(u) {
    var current = Storage.get('currentUser') || {};
    var isSuper = current.is_super == 1;
    var isSelf = current.id === u.id;
    var editBtn = '';
    if (isSuper) {
      editBtn = '<button class="app-btn app-btn-sm app-btn-outline" onclick="editUserApp(' + u.id + ')" style="padding:0 10px;height:30px;font-size:12px">' + mi('edit', 'mi-14') + ' 编辑</button>';
    } else if (isSelf) {
      editBtn = '<button class="app-btn app-btn-sm app-btn-outline" onclick="AppRouter.navigate(\'mine\')" style="padding:0 10px;height:30px;font-size:12px">' + mi('edit', 'mi-14') + ' 编辑</button>';
    }
    return '<div class="user-card-app" data-id="' + u.id + '">'
      + '<div class="user-avatar-app">' + getInitial(u.nickname || u.username) + '</div>'
      + '<div class="user-info-app">'
      + '<div class="user-name-app">' + escapeHtml(u.nickname || u.username) + (u.is_super ? '<span class="badge badge-warning" style="font-size:10px;margin-left:4px">超级</span>' : '') + '</div>'
      + '<div class="user-meta-app">@' + escapeHtml(u.username) + ' · ' + ((u.roles || []).map(function (r) { return r.role_name; }).join(', ') || '无角色') + '</div>'
      + '</div>'
      + '<div class="user-actions-app">'
      + editBtn
      + '</div></div>';
  }

  window.searchUsers = function () {
    var kw = document.getElementById('user-search') ? document.getElementById('user-search').value : '';
    appShowLoading();
    SharedOps.user.search(kw, 1, 20, function (res) {
      appHideLoading();
      if (res.code !== 200) return;
      var list = (res.data || {}).list || [];
      var container = document.getElementById('user-list');
      if (container) {
        container.innerHTML = list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">' + mi('search_off', 'mi-xl') + '</div><p>未找到用户</p></div>'
          : list.map(function (u) { return renderUserCard(u); }).join('');
      }
    });
  };

  // ==================== 角色管理 ====================
  registerPage('role', function () {
    var content = document.getElementById('page-role');
    if (!content) return;

    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;

    appShowLoading();
    SharedOps.role.list(100, function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }
      var list = (res.data || {}).list || [];

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div id="role-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('shield', 'mi-xl') + '</div><p>暂无角色数据</p></div>' : '')
        + list.map(function (r) {
          return '<div class="app-card" style="margin-bottom:10px">'
            + '<div style="display:flex;align-items:center;justify-content:space-between">'
            + '<div>'
            + '<div style="font-size:16px;font-weight:600">' + escapeHtml(r.role_name) + '</div>'
            + '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">' + escapeHtml(r.remark || '暂无备注') + ' · ' + (r.user_count || 0) + ' 个用户 · ' + ((r.routers || []).length) + ' 个权限</div>'
            + '</div>'
            + (isSuper ? '<button class="app-btn app-btn-sm app-btn-outline" onclick="editRoleApp(' + r.id + ')" style="padding:0 12px;height:32px;font-size:12px">' + mi('settings', 'mi-14') + ' 管理</button>' : '')
            + '</div>'
            + ((r.routers || []).length > 0
              ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">'
                + r.routers.map(function (rt) { return '<span class="badge badge-info">' + renderIcon(rt.icon) + ' ' + escapeHtml(rt.router_name) + '</span>'; }).join('')
                + '</div>'
              : '')
            + '</div>';
        }).join('')
        + '</div>'
        + (isSuper ? '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddRoleSheet()">' + mi('add', 'mi-18') + ' 创建角色</button></div>' : '')
        + '</div>';
    });
  });

  // ==================== 路由管理 ====================
  registerPage('router', function () {
    var content = document.getElementById('page-router');
    if (!content) return;

    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;

    appShowLoading();
    SharedOps.router.list(function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }
      var list = res.data || [];

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div id="router-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('route', 'mi-xl') + '</div><p>暂无路由数据</p></div>' : '')
        + list.map(function (r) {
          return '<div class="app-card" style="margin-bottom:10px">'
            + '<div style="display:flex;align-items:center;justify-content:space-between">'
            + '<div style="display:flex;align-items:center;gap:10px">'
            + '<span style="font-size:24px">' + renderIcon(r.icon) + '</span>'
            + '<div>'
            + '<div style="font-size:15px;font-weight:600">' + escapeHtml(r.router_name) + '</div>'
            + '<div style="font-size:12px;color:var(--text-secondary)"><code>' + escapeHtml(r.router_path) + '</code> · 排序 ' + r.sort + ' · ' + (r.role_count || 0) + ' 个角色绑定</div>'
            + '</div></div>'
            + '<div style="display:flex;align-items:center;gap:8px">'
            + '<span class="badge ' + (r.status == 1 ? 'badge-success' : 'badge-danger') + '">' + (r.status == 1 ? '启用' : '禁用') + '</span>'
            + (isSuper ? '<button class="app-btn app-btn-sm app-btn-outline" onclick="editRouterApp(' + r.id + ')" style="padding:0 10px;height:30px;font-size:12px">' + mi('edit', 'mi-14') + '</button>' : '')
            + '</div></div></div>';
        }).join('')
        + '</div>'
        + (isSuper ? '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddRouterSheet()">' + mi('add', 'mi-18') + ' 添加路由</button></div>' : '')
        + '</div>';
    });
  });

  // ==================== 操作日志 ====================
  registerPage('log', function () {
    var content = document.getElementById('page-log');
    if (!content) return;

    appShowLoading();
    SharedOps.log.search('', 1, 20, '', function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }

      var list = (res.data || {}).list || [];
      var total = (res.data || {}).total || 0;
      var actionMap = {
        'login': '登录', 'logout': '退出', 'register': '注册', 'user_create': '创建用户',
        'user_update': '更新用户', 'user_delete': '删除用户', 'user_assign_role': '分配角色',
        'profile_update': '更新资料', 'password_change': '修改密码',
        'role_create': '创建角色', 'role_update': '更新角色', 'role_delete': '删除角色',
        'router_create': '创建路由', 'router_update': '更新路由', 'router_delete': '删除路由',
        'forgot': '找回密码'
      };

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-search">'
        + '<span class="search-icon">' + mi('search', 'mi-18') + '</span>'
        + '<input type="text" placeholder="搜索用户名或详情" id="log-search" onkeyup="if(event.key===\'Enter\')searchLogs()">'
        + '</div>'
        + '<div style="font-size:12px;color:var(--text-secondary);padding:0 0 8px">共 ' + total + ' 条日志</div>'
        + '<div id="log-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('inbox', 'mi-xl') + '</div><p>暂无日志</p></div>' : '')
        + list.map(function (l) {
          return '<div class="app-card" style="margin-bottom:8px;padding:12px">'
            + '<div style="display:flex;justify-content:space-between;align-items:center">'
            + '<div style="font-size:14px;font-weight:500">' + escapeHtml(l.username) + '</div>'
            + '<span class="badge badge-info" style="font-size:10px">' + (actionMap[l.action] || l.action) + '</span>'
            + '</div>'
            + '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">' + escapeHtml(l.detail) + '</div>'
            + '<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;display:flex;justify-content:space-between">'
            + '<span>' + escapeHtml(l.ip) + '</span>'
            + '<span>' + formatDate(l.create_time) + '</span>'
            + '</div></div>';
        }).join('')
        + '</div></div>';
    });
  });

  window.searchLogs = function () {
    var kw = document.getElementById('log-search') ? document.getElementById('log-search').value : '';
    appShowLoading();
    SharedOps.log.search(kw, 1, 20, '', function (res) {
      appHideLoading();
      if (res.code !== 200) return;
      var list = (res.data || {}).list || [];
      var actionMap = {
        'login': '登录', 'logout': '退出', 'register': '注册', 'user_create': '创建用户',
        'user_update': '更新用户', 'user_delete': '删除用户', 'user_assign_role': '分配角色',
        'profile_update': '更新资料', 'password_change': '修改密码',
        'role_create': '创建角色', 'role_update': '更新角色', 'role_delete': '删除角色',
        'router_create': '创建路由', 'router_update': '更新路由', 'router_delete': '删除路由'
      };
      var container = document.getElementById('log-list');
      if (container) {
        container.innerHTML = list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">' + mi('search_off', 'mi-xl') + '</div><p>未找到日志</p></div>'
          : list.map(function (l) {
            return '<div class="app-card" style="margin-bottom:8px;padding:12px">'
              + '<div style="display:flex;justify-content:space-between;align-items:center">'
              + '<div style="font-size:14px;font-weight:500">' + escapeHtml(l.username) + '</div>'
              + '<span class="badge badge-info" style="font-size:10px">' + (actionMap[l.action] || l.action) + '</span>'
              + '</div>'
              + '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">' + escapeHtml(l.detail) + '</div>'
              + '<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;display:flex;justify-content:space-between">'
              + '<span>' + escapeHtml(l.ip) + '</span>'
              + '<span>' + formatDate(l.create_time) + '</span>'
              + '</div></div>';
          }).join('');
      }
    });
  };

  // ==================== 我的页面 ====================
  registerPage('mine', function () {
    var content = document.getElementById('page-mine');
    if (!content) return;

    var user = Storage.get('currentUser');
    if (!user) return;

    content.innerHTML =
      '<div class="app-page-content">'
      + '<div class="mine-header">'
      + '<div class="mine-avatar">' + getInitial(user.nickname || user.username) + '</div>'
      + '<div class="mine-name">' + escapeHtml(user.nickname || user.username) + '</div>'
      + '<div class="mine-role">' + (user.is_super ? '超级管理员' : '普通用户') + '</div>'
      + '</div>'
      + '<div class="app-list">'
      + '<div class="app-list-item"><div class="item-icon">' + mi('badge') + '</div><div class="item-content"><div class="item-title">账号</div><div class="item-desc">' + escapeHtml(user.username) + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">' + mi('email') + '</div><div class="item-content"><div class="item-title">邮箱</div><div class="item-desc">' + escapeHtml(user.email || '未设置') + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">' + mi('phone') + '</div><div class="item-content"><div class="item-title">手机</div><div class="item-desc">' + escapeHtml(user.phone || '未设置') + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">' + mi('calendar_today') + '</div><div class="item-content"><div class="item-title">注册时间</div><div class="item-desc">' + formatDate(user.create_time) + '</div></div></div>'
      + '</div>'
      + '<div class="app-list">'
      + '<div class="app-list-item" onclick="showEditProfileSheet()">'
      + '<div class="item-icon">' + mi('edit_note') + '</div><div class="item-content"><div class="item-title">编辑资料</div><div class="item-desc">修改昵称、邮箱、手机</div></div><div class="item-arrow">' + mi('chevron_right', 'mi-18') + '</div>'
      + '</div>'
      + '<div class="app-list-item" onclick="showChangePwdSheet()">'
      + '<div class="item-icon">' + mi('lock') + '</div><div class="item-content"><div class="item-title">修改密码</div></div><div class="item-arrow">' + mi('chevron_right', 'mi-18') + '</div>'
      + '</div></div>'
      + '<div style="padding:24px 0"><button class="app-btn app-btn-danger" onclick="logoutApp()">' + mi('logout', 'mi-18') + ' 退出登录</button></div>'
      + '</div>';
  });

  // 编辑个人资料（手机端）
  window.showEditProfileSheet = function () {
    var user = Storage.get('currentUser') || {};
    createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">编辑资料</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form">'
      + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="profile-nickname" value="' + escapeHtml(user.nickname || '') + '" placeholder="请输入昵称"></div>'
      + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" type="email" id="profile-email" value="' + escapeHtml(user.email || '') + '" placeholder="请输入邮箱"></div>'
      + '<div class="app-form-item"><div class="form-label">手机</div><input class="form-input" type="tel" id="profile-phone" value="' + escapeHtml(user.phone || '') + '" placeholder="请输入手机号"></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitProfile()">保存修改</button>'
      + '</div>'
      + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
    );
  };

  window.submitProfile = function () {
    var nickname = document.getElementById('profile-nickname').value.trim();
    var email    = document.getElementById('profile-email').value.trim();
    var phone    = document.getElementById('profile-phone').value.trim();
    appShowLoading();
    SharedOps.user.updateProfile({ nickname: nickname, email: email, phone: phone }, function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        Storage.set('currentUser', res.data);
        closeActionSheet();
        var mineLoader = pageLoaders['mine'];
        if (mineLoader) mineLoader();
      }
    });
  };

  // 修改密码（手机端）
  window.showChangePwdSheet = function () {
    createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">修改密码</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form">'
      + '<div class="app-form-item"><div class="form-label">原密码</div><input class="form-input" type="password" id="old-pwd" placeholder="请输入原密码"></div>'
      + '<div class="app-form-item"><div class="form-label">新密码</div><input class="form-input" type="password" id="new-pwd" placeholder="请输入新密码" oninput="bindPwdStrength(\'new-pwd\')">' + pwdStrengthHtml('new-pwd') + '</div>'
      + '<div class="app-form-item"><div class="form-label">确认</div><input class="form-input" type="password" id="confirm-pwd" placeholder="再次输入新密码"></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitChangePwd()">确认修改</button>'
      + '</div><div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
    );
  };

  window.submitChangePwd = function () {
    var oldPwd = document.getElementById('old-pwd').value;
    var newPwd = document.getElementById('new-pwd').value;
    var confirmPwd = document.getElementById('confirm-pwd').value;
    if (!oldPwd || !newPwd) { appToast('请填写完整'); return; }
    if (newPwd !== confirmPwd) { appToast('两次密码不一致'); return; }
    appShowLoading();
    SharedOps.user.changePassword(oldPwd, newPwd, function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) closeActionSheet();
    });
  };

  // 退出登录
  window.logoutApp = function () {
    confirmDialog('退出登录', '确定要退出当前账号吗？').then(function (ok) {
      if (!ok) return;
      API.post('login/?action=logout').then(function () {}).catch(function () {});
      Storage.remove('currentUser');
      window.location.href = '../index.html';
    });
  };

  // ==================== 用户操作 ====================
  window.showAddUserSheet = function () {
    appShowLoading();
    SharedOps.role.list(100, function (res) {
      appHideLoading();
      var roles = res.code === 200 ? (res.data || {}).list || [] : [];
      var roleOptions = roles.map(function (r) {
        return '<option value="' + r.id + '">' + escapeHtml(r.role_name) + '</option>';
      }).join('');

      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">添加用户</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">账号</div><input class="form-input" id="add-username" placeholder="字母数字下划线"></div>'
        + '<div class="app-form-item"><div class="form-label">密码</div><input class="form-input" type="password" id="add-password" placeholder="至少6位"></div>'
        + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="add-nickname" placeholder="选填"></div>'
        + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" type="email" id="add-email" placeholder="选填"></div>'
        + '<div class="app-form-item"><div class="form-label">角色</div><select class="form-select" id="add-role">' + roleOptions + '</select></div>'
        + '</div>'
        + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitAddUser()">确认添加</button>'
        + '</div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
      );
    });
  };

  window.submitAddUser = function () {
    var username = document.getElementById('add-username').value.trim();
    var password = document.getElementById('add-password').value.trim();
    var nickname = document.getElementById('add-nickname').value.trim();
    var email = document.getElementById('add-email').value.trim();
    var roleId = document.getElementById('add-role').value;
    if (!username || !password) { appToast('请输入账号和密码'); return; }
    appShowLoading();
    SharedOps.user.add({ username: username, password: password, nickname: nickname, email: email, role_ids: [roleId] }, function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) { closeActionSheet(); AppRouter.navigate('user'); }
    });
  };

  window.editUserApp = function (userId) {
    appShowLoading();
    Promise.all([
      new Promise(function(resolve) { SharedOps.user.detail(userId, resolve); }),
      new Promise(function(resolve) { SharedOps.role.list(100, resolve); })
    ]).then(function (results) {
      appHideLoading();
      var userRes = results[0], roleRes = results[1];
      if (userRes.code !== 200) { appToast(userRes.msg); return; }
      var user = userRes.data;

      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">编辑用户</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="edit-nickname" value="' + escapeHtml(user.nickname || '') + '"></div>'
        + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" type="email" id="edit-email" value="' + escapeHtml(user.email || '') + '"></div>'
        + '<div class="app-form-item"><div class="form-label">手机</div><input class="form-input" type="tel" id="edit-phone" value="' + escapeHtml(user.phone || '') + '"></div>'
        + '<div class="app-form-item"><div class="form-label">状态</div><select class="form-select" id="edit-status"><option value="1" ' + (user.status == 1 ? 'selected' : '') + '>正常</option><option value="0" ' + (user.status == 0 ? 'selected' : '') + '>禁用</option></select></div>'
        + '</div>'
        + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitEditUser(' + userId + ')">保存修改</button>'
        + '<button class="app-btn app-btn-danger" style="margin-top:8px" onclick="deleteUserApp(' + userId + ')">删除用户</button>'
        + '</div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
      );
    });
  };

  window.submitEditUser = function (userId) {
    var nickname = document.getElementById('edit-nickname').value.trim();
    var email = document.getElementById('edit-email').value.trim();
    var phone = document.getElementById('edit-phone').value.trim();
    var status = document.getElementById('edit-status').value;
    appShowLoading();
    SharedOps.user.update(userId, { nickname: nickname, email: email, phone: phone, status: status }, function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        // 如果编辑的是当前登录用户，同步更新 localStorage
        var current = Storage.get('currentUser');
        if (current && current.id === userId && res.data) {
          Storage.set('currentUser', res.data);
        }
        closeActionSheet();
        AppRouter.navigate('user');
      }
    });
  };

  window.deleteUserApp = function (userId) {
    confirmDialog('删除用户', '确定要删除该用户吗？此操作不可恢复！').then(function (ok) {
      if (!ok) return;
      appShowLoading();
      SharedOps.user.delete(userId, function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) { closeActionSheet(); AppRouter.navigate('user'); }
      });
    });
  };

  // ==================== 角色操作 ====================
  window.showAddRoleSheet = function () {
    appShowLoading();
    SharedOps.router.list(function (res) {
      appHideLoading();
      var routers = res.code === 200 ? res.data || [] : [];

      var routerHtml = routers.map(function (r) {
        return '<div class="role-switch-item"><span>' + renderIcon(r.icon) + ' ' + escapeHtml(r.router_name) + '</span><label class="switch"><input type="checkbox" value="' + r.id + '"><span class="slider"></span></label></div>';
      }).join('');

      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">创建角色</div>'
        + '<div style="padding:0 16px 16px;max-height:60vh;overflow-y:auto">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">角色名称</div><input class="form-input" id="add-role-name" placeholder="请输入角色名称"></div>'
        + '<div class="app-form-item"><div class="form-label">备注</div><input class="form-input" id="add-role-remark" placeholder="选填"></div>'
        + '</div>'
        + '<div style="margin-top:16px;font-size:14px;font-weight:600;color:var(--text-primary)">选择权限</div>'
        + '<div style="background:var(--bg-card);border-radius:10px;margin-top:8px;overflow:hidden">' + routerHtml + '</div>'
        + '</div>'
        + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitAddRole()">确认创建</button>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>',
        { maxHeight: '85vh' }
      );
    });
  };

  window.submitAddRole = function () {
    var roleName = document.getElementById('add-role-name').value.trim();
    var remark = document.getElementById('add-role-remark').value.trim();
    var routerIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(function (cb) { return cb.value; });
    if (!roleName) { appToast('请输入角色名称'); return; }
    appShowLoading();
    SharedOps.role.add({ role_name: roleName, remark: remark, router_ids: routerIds }, function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) { closeActionSheet(); AppRouter.navigate('role'); }
    });
  };

  window.editRoleApp = function (roleId) {
    appShowLoading();
    Promise.all([
      new Promise(function(resolve) { API.get('role/', { action: 'detail', id: roleId }).then(resolve); }),
      new Promise(function(resolve) { SharedOps.router.list(resolve); })
    ]).then(function (results) {
      appHideLoading();
      var roleRes = results[0], routerRes = results[1];
      if (roleRes.code !== 200) { appToast(roleRes.msg); return; }
      var role = roleRes.data;
      var routers = routerRes.code === 200 ? routerRes.data || [] : [];
      var roleRouterIds = (role.routers || []).map(function (r) { return r.id; });

      var routerHtml = routers.map(function (r) {
        var checked = roleRouterIds.indexOf(r.id) !== -1 ? 'checked' : '';
        return '<div class="role-switch-item"><span>' + renderIcon(r.icon) + ' ' + escapeHtml(r.router_name) + '</span><label class="switch"><input type="checkbox" value="' + r.id + '" ' + checked + '><span class="slider"></span></label></div>';
      }).join('');

      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">编辑角色</div>'
        + '<div style="padding:0 16px 16px;max-height:60vh;overflow-y:auto">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">角色名称</div><input class="form-input" id="edit-role-name" value="' + escapeHtml(role.role_name) + '"></div>'
        + '<div class="app-form-item"><div class="form-label">备注</div><input class="form-input" id="edit-role-remark" value="' + escapeHtml(role.remark || '') + '"></div>'
        + '</div>'
        + '<div style="margin-top:16px;font-size:14px;font-weight:600;color:var(--text-primary)">选择权限</div>'
        + '<div style="background:var(--bg-card);border-radius:10px;margin-top:8px;overflow:hidden">' + routerHtml + '</div>'
        + '</div>'
        + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitEditRole(' + roleId + ')">保存修改</button>'
        + '<button class="app-btn app-btn-danger" style="margin-top:8px" onclick="deleteRoleApp(' + roleId + ')">删除角色</button>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>',
        { maxHeight: '85vh' }
      );
    });
  };

  window.submitEditRole = function (roleId) {
    var roleName = document.getElementById('edit-role-name').value.trim();
    var remark = document.getElementById('edit-role-remark').value.trim();
    var routerIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(function (cb) { return cb.value; });
    if (!roleName) { appToast('请输入角色名称'); return; }
    appShowLoading();
    SharedOps.role.update(roleId, { role_name: roleName, remark: remark }, function (updateRes) {
      if (updateRes.code !== 200) { appHideLoading(); appToast(updateRes.msg); return; }
      SharedOps.role.updateRouters(roleId, routerIds, function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) { closeActionSheet(); AppRouter.navigate('role'); }
      });
    });
  };

  window.deleteRoleApp = function (roleId) {
    confirmDialog('删除角色', '确定要删除该角色吗？此操作不可恢复！').then(function (ok) {
      if (!ok) return;
      appShowLoading();
      SharedOps.role.delete(roleId, function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) { closeActionSheet(); AppRouter.navigate('role'); }
      });
    });
  };

  // ==================== 路由操作 ====================
  window.showAddRouterSheet = function () {
    createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">添加路由</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form">'
      + '<div class="app-form-item"><div class="form-label">路由名称</div><input class="form-input" id="add-router-name" placeholder="如：用户管理"></div>'
      + '<div class="app-form-item"><div class="form-label">路由路径</div><input class="form-input" id="add-router-path" placeholder="如：user"></div>'
      + '<div class="app-form-item"><div class="form-label">图标</div><input type="hidden" id="add-router-icon"><div class="icon-pick-trigger" id="add-router-icon-preview" onclick="openIconPicker(\'add-router-icon\',function(ic){document.getElementById(\'add-router-icon-preview\').innerHTML=\'<i class=mi>\'+ic+\'</i> \'+ic})" style="flex:1"><i class="mi">palette</i> 选择图标</div></div>'
      + '<div class="app-form-item"><div class="form-label">排序</div><input class="form-input" type="number" id="add-router-sort" value="10"></div>'
      + '<div class="app-form-item"><div class="form-label">状态</div><select class="form-select" id="add-router-status"><option value="1">启用</option><option value="0">禁用</option></select></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitAddRouter()">确认添加</button>'
      + '</div>'
      + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
    );
  };

  window.submitAddRouter = function () {
    var routerName = document.getElementById('add-router-name').value.trim();
    var routerPath = document.getElementById('add-router-path').value.trim();
    var icon = document.getElementById('add-router-icon').value;
    var sort = document.getElementById('add-router-sort').value;
    var status = document.getElementById('add-router-status').value;
    if (!routerName || !routerPath) { appToast('请输入路由名称和路径'); return; }
    appShowLoading();
    SharedOps.router.add({ router_name: routerName, router_path: routerPath, icon: icon, sort: sort, status: status }, function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) { closeActionSheet(); AppRouter.navigate('router'); }
    });
  };

  window.editRouterApp = function (routerId) {
    appShowLoading();
    SharedOps.router.list(function (res) {
      appHideLoading();
      var router = (res.data || []).find(function(r) { return r.id === routerId; });
      if (!router) { appToast('路由不存在'); return; }

      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">编辑路由</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">路由名称</div><input class="form-input" id="edit-router-name" value="' + escapeHtml(router.router_name) + '"></div>'
        + '<div class="app-form-item"><div class="form-label">路由路径</div><input class="form-input" id="edit-router-path" value="' + escapeHtml(router.router_path) + '"></div>'
        + '<div class="app-form-item"><div class="form-label">图标</div><input type="hidden" id="edit-router-icon" value="' + (router.icon || '') + '"><div class="icon-pick-trigger" id="edit-router-icon-preview" onclick="openIconPicker(\'edit-router-icon\',function(ic){document.getElementById(\'edit-router-icon-preview\').innerHTML=\'<i class=mi>\'+ic+\'</i> \'+ic})" style="flex:1">' + (router.icon ? '<i class="mi">' + router.icon + '</i> ' + router.icon : '<i class="mi">palette</i> 选择图标') + '</div></div>'
        + '<div class="app-form-item"><div class="form-label">排序</div><input class="form-input" type="number" id="edit-router-sort" value="' + router.sort + '"></div>'
        + '<div class="app-form-item"><div class="form-label">状态</div><select class="form-select" id="edit-router-status"><option value="1" ' + (router.status == 1 ? 'selected' : '') + '>启用</option><option value="0" ' + (router.status == 0 ? 'selected' : '') + '>禁用</option></select></div>'
        + '</div>'
        + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitEditRouter(' + routerId + ')">保存修改</button>'
        + '<button class="app-btn app-btn-danger" style="margin-top:8px" onclick="deleteRouterApp(' + routerId + ')">删除路由</button>'
        + '</div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
      );
    });
  };

  window.submitEditRouter = function (routerId) {
    var routerName = document.getElementById('edit-router-name').value.trim();
    var routerPath = document.getElementById('edit-router-path').value.trim();
    var icon = document.getElementById('edit-router-icon').value;
    var sort = document.getElementById('edit-router-sort').value;
    var status = document.getElementById('edit-router-status').value;
    if (!routerName || !routerPath) { appToast('请输入路由名称和路径'); return; }
    appShowLoading();
    SharedOps.router.update(routerId, { router_name: routerName, router_path: routerPath, icon: icon, sort: sort, status: status }, function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) { closeActionSheet(); AppRouter.navigate('router'); }
    });
  };

  window.deleteRouterApp = function (routerId) {
    confirmDialog('删除路由', '确定要删除该路由吗？此操作不可恢复！').then(function (ok) {
      if (!ok) return;
      appShowLoading();
      SharedOps.router.delete(routerId, function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) { closeActionSheet(); AppRouter.navigate('router'); }
      });
    });
  };

  // ==================== 导出 & 初始化 ====================
  window.AppRouter = AppRouter;
  document.addEventListener('DOMContentLoaded', function () { AppRouter.init(); });
})();
