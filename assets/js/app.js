/**
 * app.js v2.0 - 手机端 APP 路由系统
 * 完全动态：TabBar、页面容器、页面标题均从 API 路由数据生成
 * 新增路由自动加载，无需改前端代码
 */
(function () {
  'use strict';

  // 非手机端不执行
  if (window.innerWidth > 768) return;

  // ==================== 页面加载器注册表 ====================
  // 各页面的加载函数在此注册，key = router_path
  var pageLoaders = {};

  /**
   * 注册页面加载器
   * @param {string} path - 路由路径，如 'home', 'user'
   * @param {Function} loader - 加载函数，接收 (container, params)
   */
  window.registerPage = function (path, loader) {
    pageLoaders[path] = loader;
  };

  // ==================== APP 路由管理 ====================
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

    // ---------- 登录检查 ----------
    checkLogin: function () {
      return API.get('login/').then(function (res) {
        if (res.code !== 200) {
          window.location.href = '../index.html';
          return;
        }
        Storage.set('currentUser', res.data);
      });
    },

    // ---------- 加载用户路由 ----------
    loadUserRouters: function () {
      var self = this;
      return API.get('router/', { action: 'user' }).then(function (res) {
        if (res.code === 200) {
          self.userRouters = res.data || [];
        }
      });
    },

    // ---------- 动态构建 UI ----------
    buildUI: function () {
      this.buildPages();
      this.buildTabBar();
      this.updateMinePage();
    },

    /**
     * 动态生成页面容器
     * 为每个可用路由创建一个 .app-page 容器
     */
    buildPages: function () {
      var container = document.getElementById('app-pages');
      if (!container) return;
      container.innerHTML = '';

      // 确保 home 和 mine 始终存在
      var paths = ['home'];
      this.userRouters.forEach(function (r) {
        if (paths.indexOf(r.router_path) === -1) {
          paths.push(r.router_path);
        }
      });
      if (paths.indexOf('mine') === -1) paths.push('mine');

      var self = this;
      paths.forEach(function (path) {
        var div = document.createElement('div');
        div.className = 'app-page' + (path === 'home' ? ' active' : '');
        div.id = 'page-' + path;
        div.innerHTML = '<div class="app-page-content"></div>';
        container.appendChild(div);
      });
    },

    /**
     * 动态生成底部 TabBar
     * 首页和"我的"始终显示，中间的 tab 根据用户权限动态生成
     */
    buildTabBar: function () {
      var tabBar = document.getElementById('app-tabbar');
      if (!tabBar) return;
      tabBar.innerHTML = '';

      // Tab 定义：从路由数据中获取
      var tabDefs = [];

      // 首页始终第一个
      tabDefs.push({ page: 'home', icon: '🏠', label: '首页' });

      // 动态添加有权限的路由（排除 home 和 mine）
      var self = this;
      this.userRouters.forEach(function (r) {
        if (r.router_path !== 'home' && r.router_path !== 'mine') {
          tabDefs.push({ page: r.router_path, icon: r.icon || '📄', label: r.router_name });
        }
      });

      // "我的"始终最后一个
      tabDefs.push({ page: 'mine', icon: '👤', label: '我的' });

      // 最多显示 5 个 tab
      if (tabDefs.length > 5) {
        var home = tabDefs[0];
        var mine = tabDefs[tabDefs.length - 1];
        var middle = tabDefs.slice(1, tabDefs.length - 1);
        middle = middle.slice(0, 3);
        tabDefs = [home].concat(middle, [mine]);
      }

      tabDefs.forEach(function (tab, i) {
        var div = document.createElement('div');
        div.className = 'tab-item' + (i === 0 ? ' active' : '');
        div.dataset.page = tab.page;
        div.innerHTML = '<span class="tab-icon">' + tab.icon + '</span><span class="tab-label">' + escapeHtml(tab.label) + '</span>';
        tabBar.appendChild(div);
      });

      this.bindTabBar();
    },

    // ---------- 事件绑定 ----------
    bindNavbar: function () {
      var self = this;
      var backBtn = document.getElementById('navbar-back');
      if (backBtn) {
        backBtn.addEventListener('click', function () {
          self.goBack();
        });
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

    // ---------- 导航 ----------
    navigate: function (page, params) {
      params = params || {};

      var oldPage = document.querySelector('.app-page.active');
      var newPage = document.getElementById('page-' + page);
      if (!newPage) return;

      // 更新 TabBar 高亮
      document.querySelectorAll('.tab-item').forEach(function (t) {
        t.classList.toggle('active', t.dataset.page === page);
      });

      // 更新导航标题
      var title = this.getRouteName(page);
      var navbar = document.querySelector('.app-navbar .navbar-title');
      if (navbar) navbar.textContent = title;

      // 返回按钮
      var backBtn = document.getElementById('navbar-back');
      if (backBtn) {
        backBtn.style.display = page === 'home' ? 'none' : 'block';
      }

      // 页面切换动画
      if (oldPage) {
        oldPage.classList.remove('active');
        oldPage.classList.add('slide-out');
        setTimeout(function () { oldPage.classList.remove('slide-out'); }, 300);
      }
      newPage.classList.add('active');
      newPage.scrollTop = 0;

      this.currentPage = page;
      this.pageStack.push(page);

      // 触发页面加载
      this.loadPage(page, params);
    },

    goBack: function () {
      if (this.pageStack.length <= 1) return;
      this.pageStack.pop();
      var prevPage = this.pageStack[this.pageStack.length - 1];
      this.navigate(prevPage);
    },

    /**
     * 获取路由名称（动态）
     */
    getRouteName: function (path) {
      if (path === 'home') return '首页';
      if (path === 'mine') return '我的';
      var route = this.userRouters.find(function (r) { return r.router_path === path; });
      return route ? route.router_name : '管理系统';
    },

    /**
     * 加载页面内容
     * 优先使用注册的 loader，否则显示默认占位
     */
    loadPage: function (page, params) {
      if (typeof pageLoaders[page] === 'function') {
        pageLoaders[page](params);
      } else {
        var container = document.getElementById('page-' + page);
        if (container) {
          container.querySelector('.app-page-content').innerHTML =
            '<div class="empty-state"><div class="empty-icon">🚧</div><p>页面加载器未注册</p></div>';
        }
      }
    },

    // ---------- 更新"我的"页面用户信息 ----------
    updateMinePage: function () {
      var user = Storage.get('currentUser');
      if (!user) return;
      // 延迟执行，等页面内容渲染完
      setTimeout(function () {
        var nameEl = document.querySelector('.mine-name');
        var roleEl = document.querySelector('.mine-role');
        var avatarEl = document.querySelector('.mine-avatar');
        if (nameEl) nameEl.textContent = user.nickname || user.username;
        if (roleEl) roleEl.textContent = user.is_super ? '超级管理员' : '普通用户';
        if (avatarEl) avatarEl.textContent = getInitial(user.nickname || user.username);
      }, 100);
    }
  };

  // ==================== 注册内置页面加载器 ====================

  // ---------- 首页 ----------
  registerPage('home', function () {
    var content = document.getElementById('page-home');
    if (!content) return;

    appShowLoading();
    Promise.all([
      API.get('user/', { limit: 1 }),
      API.get('role/', { limit: 100 })
    ]).then(function (results) {
      appHideLoading();
      var userRes = results[0], roleRes = results[1];
      var userTotal = userRes.code === 200 ? (userRes.data && userRes.data.total || 0) : 0;
      var roleTotal = roleRes.code === 200 ? (roleRes.data && roleRes.data.total || 0) : 0;
      var routerCount = AppRouter.userRouters.length;

      // 动态生成快捷操作列表
      var quickActions = '';
      AppRouter.userRouters.forEach(function (r) {
        if (r.router_path === 'home' || r.router_path === 'mine') return;
        quickActions +=
          '<div class="app-list-item" onclick="AppRouter.navigate(\'' + r.router_path + '\')">'
          + '<div class="item-icon">' + (r.icon || '📄') + '</div>'
          + '<div class="item-content">'
          + '<div class="item-title">' + escapeHtml(r.router_name) + '</div>'
          + '<div class="item-desc">点击进入' + escapeHtml(r.router_name) + '</div>'
          + '</div>'
          + '<div class="item-arrow">›</div>'
          + '</div>';
      });

      // "我的" 始终显示
      quickActions +=
        '<div class="app-list-item" onclick="AppRouter.navigate(\'mine\')">'
        + '<div class="item-icon">👤</div>'
        + '<div class="item-content">'
        + '<div class="item-title">个人中心</div>'
        + '<div class="item-desc">查看个人信息、修改密码</div>'
        + '</div>'
        + '<div class="item-arrow">›</div>'
        + '</div>';

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-stats">'
        + '<div class="app-stat-card"><div class="stat-num">' + userTotal + '</div><div class="stat-name">系统用户</div></div>'
        + '<div class="app-stat-card"><div class="stat-num">' + roleTotal + '</div><div class="stat-name">角色数量</div></div>'
        + '<div class="app-stat-card"><div class="stat-num">' + routerCount + '</div><div class="stat-name">可用功能</div></div>'
        + '<div class="app-stat-card"><div class="stat-num">✓</div><div class="stat-name">系统状态</div></div>'
        + '</div>'
        + '<div class="app-card">'
        + '<div class="app-card-header"><h3>🚀 快捷操作</h3></div>'
        + '<div class="app-list">' + quickActions + '</div>'
        + '</div></div>';
    });
  });

  // ---------- 用户管理 ----------
  registerPage('user', function () {
    var content = document.getElementById('page-user');
    if (!content) return;

    appShowLoading();
    API.get('user/', { page: 1, limit: 20 }).then(function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }

      var list = (res.data || {}).list || [];
      var total = (res.data || {}).total || 0;
      var hasMore = list.length < total;

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-search">'
        + '<span class="search-icon">🔍</span>'
        + '<input type="text" placeholder="搜索用户名或昵称" id="user-search" onkeyup="if(event.key===\'Enter\')searchUsers()">'
        + '</div>'
        + '<div id="user-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>暂无用户数据</p></div>' : '')
        + list.map(function (u) { return renderUserCard(u); }).join('')
        + '</div>'
        + (hasMore ? '<div style="text-align:center;padding:16px"><button class="app-btn app-btn-sm app-btn-outline" onclick="loadMoreUsers()">加载更多</button></div>' : '')
        + '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddUserSheet()">＋ 添加用户</button></div>'
        + '</div>';
    });
  });

  function renderUserCard(u) {
    return '<div class="user-card-app" data-id="' + u.id + '">'
      + '<div class="user-avatar-app">' + getInitial(u.nickname || u.username) + '</div>'
      + '<div class="user-info-app">'
      + '<div class="user-name-app">' + escapeHtml(u.nickname || u.username) + (u.is_super ? '<span class="badge badge-warning" style="font-size:10px;margin-left:4px">超级</span>' : '') + '</div>'
      + '<div class="user-meta-app">@' + escapeHtml(u.username) + ' · ' + ((u.roles || []).map(function (r) { return r.role_name; }).join(', ') || '无角色') + '</div>'
      + '</div>'
      + '<div class="user-actions-app">'
      + '<button class="app-btn app-btn-sm app-btn-outline" onclick="editUserApp(' + u.id + ')" style="padding:0 10px;height:30px;font-size:12px">编辑</button>'
      + '</div></div>';
  }

  window.searchUsers = function () {
    var kw = document.getElementById('user-search') ? document.getElementById('user-search').value : '';
    appShowLoading();
    API.get('user/', { keyword: kw, page: 1, limit: 20 }).then(function (res) {
      appHideLoading();
      if (res.code !== 200) return;
      var list = (res.data || {}).list || [];
      var container = document.getElementById('user-list');
      if (container) {
        container.innerHTML = list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">📭</div><p>未找到用户</p></div>'
          : list.map(function (u) { return renderUserCard(u); }).join('');
      }
    });
  };

  window.loadMoreUsers = function () {
    // 简化版：重新加载（实际可做分页追加）
    pageLoaders.user();
  };

  // 添加用户 Sheet
  window.showAddUserSheet = function () {
    API.get('role/', { limit: 100 }).then(function (roleRes) {
      var roles = roleRes.code === 200 ? (roleRes.data && roleRes.data.list || []) : [];

      var overlay = document.createElement('div');
      overlay.className = 'app-action-sheet-overlay';
      overlay.innerHTML =
        '<div class="app-action-sheet">'
        + '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">添加用户</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">账号</div><input class="form-input" id="new-username" placeholder="请输入账号"></div>'
        + '<div class="app-form-item"><div class="form-label">密码</div><input class="form-input" type="password" id="new-password" value="123456" placeholder="默认 123456"></div>'
        + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="new-nickname" placeholder="请输入昵称"></div>'
        + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" id="new-email" placeholder="选填"></div>'
        + '<div class="app-form-item"><div class="form-label">手机</div><input class="form-input" id="new-phone" placeholder="选填"></div>'
        + '</div>'
        + '<div style="margin-bottom:12px;font-size:14px;font-weight:600;padding:0 4px">分配角色</div>'
        + '<div class="app-list" style="max-height:150px;overflow-y:auto">'
        + roles.map(function (r) {
          return '<div class="role-switch-item"><span style="font-size:14px">' + escapeHtml(r.role_name) + '</span>'
            + '<label class="switch"><input type="checkbox" value="' + r.id + '" class="new-role-cb"><span class="slider"></span></label></div>';
        }).join('')
        + '</div>'
        + '<button class="app-btn app-btn-primary" style="margin-top:16px" onclick="submitAddUser()">确认添加</button>'
        + '</div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
        + '</div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('show'); });
      overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
      window.closeActionSheet = function () {
        overlay.querySelector('.app-action-sheet').classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 300);
      };
    });
  };

  window.submitAddUser = function () {
    var username = document.getElementById('new-username') ? document.getElementById('new-username').value.trim() : '';
    var password = (document.getElementById('new-password') ? document.getElementById('new-password').value.trim() : '') || '123456';
    var nickname = document.getElementById('new-nickname') ? document.getElementById('new-nickname').value.trim() : '';
    var email = document.getElementById('new-email') ? document.getElementById('new-email').value.trim() : '';
    var phone = document.getElementById('new-phone') ? document.getElementById('new-phone').value.trim() : '';
    var roleIds = Array.from(document.querySelectorAll('.new-role-cb:checked')).map(function (cb) { return parseInt(cb.value); });

    if (!username) { appToast('请输入账号'); return; }
    appShowLoading();
    API.post('user/', { username: username, password: password, nickname: nickname, email: email, phone: phone, role_ids: roleIds }).then(function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) { closeActionSheet(); pageLoaders.user(); }
    });
  };

  // 编辑用户
  window.editUserApp = function (id) {
    appShowLoading();
    Promise.all([
      API.get('user/', { action: 'detail', id: id }),
      API.get('role/', { limit: 100 })
    ]).then(function (results) {
      appHideLoading();
      var res = results[0], roleRes = results[1];
      if (res.code !== 200) { appToast(res.msg); return; }
      var u = res.data;
      var roles = roleRes.code === 200 ? (roleRes.data && roleRes.data.list || []) : [];

      var overlay = document.createElement('div');
      overlay.className = 'app-action-sheet-overlay';
      overlay.innerHTML =
        '<div class="app-action-sheet">'
        + '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">编辑用户</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">账号</div><input class="form-input" value="' + escapeHtml(u.username) + '" disabled style="opacity:0.5"></div>'
        + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="edit-nickname" value="' + escapeHtml(u.nickname) + '"></div>'
        + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" id="edit-email" value="' + escapeHtml(u.email || '') + '"></div>'
        + '<div class="app-form-item"><div class="form-label">手机</div><input class="form-input" id="edit-phone" value="' + escapeHtml(u.phone || '') + '"></div>'
        + '<div class="app-form-item"><div class="form-label">状态</div><label class="switch"><input type="checkbox" id="edit-status" ' + (u.status == 1 ? 'checked' : '') + '><span class="slider"></span></label></div>'
        + '</div>'
        + '<div style="margin-bottom:12px;font-size:14px;font-weight:600;padding:0 4px">角色分配</div>'
        + '<div class="app-list" style="max-height:150px;overflow-y:auto">'
        + roles.map(function (r) {
          return '<div class="role-switch-item"><span style="font-size:14px">' + escapeHtml(r.role_name) + '</span>'
            + '<label class="switch"><input type="checkbox" value="' + r.id + '" class="edit-role-cb" ' + ((u.role_ids || []).indexOf(r.id) !== -1 ? 'checked' : '') + '><span class="slider"></span></label></div>';
        }).join('')
        + '</div>'
        + '<div style="display:flex;gap:10px;margin-top:16px">'
        + '<button class="app-btn app-btn-primary" style="flex:1" onclick="submitEditUser(' + u.id + ')">保存</button>'
        + (!u.is_super ? '<button class="app-btn app-btn-danger" style="flex:1" onclick="deleteUserApp(' + u.id + ')">删除</button>' : '')
        + '</div></div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div></div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('show'); });
      overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
      window.closeActionSheet = function () {
        overlay.querySelector('.app-action-sheet').classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 300);
      };
    });
  };

  window.submitEditUser = function (id) {
    var nickname = document.getElementById('edit-nickname') ? document.getElementById('edit-nickname').value.trim() : '';
    var email = document.getElementById('edit-email') ? document.getElementById('edit-email').value.trim() : '';
    var phone = document.getElementById('edit-phone') ? document.getElementById('edit-phone').value.trim() : '';
    var status = document.getElementById('edit-status') && document.getElementById('edit-status').checked ? 1 : 0;
    var roleIds = Array.from(document.querySelectorAll('.edit-role-cb:checked')).map(function (cb) { return parseInt(cb.value); });

    appShowLoading();
    Promise.all([
      API.post('user/', { action: 'update', id: id, nickname: nickname, email: email, phone: phone, status: status }),
      API.post('user/', { action: 'roles', user_id: id, role_ids: roleIds })
    ]).then(function (results) {
      appHideLoading();
      var res1 = results[0], res2 = results[1];
      appToast(res1.code === 200 && res2.code === 200 ? '保存成功' : (res1.msg || res2.msg));
      if (res1.code === 200 && res2.code === 200) { closeActionSheet(); pageLoaders.user(); }
    });
  };

  window.deleteUserApp = function (id) {
    confirmDialog('删除用户', '确定要删除此用户吗？此操作不可恢复。').then(function (ok) {
      if (!ok) return;
      appShowLoading();
      API.post('user/', { action: 'delete', id: id }).then(function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) { closeActionSheet(); pageLoaders.user(); }
      });
    });
  };

  // ---------- 角色管理 ----------
  registerPage('role', function () {
    var content = document.getElementById('page-role');
    if (!content) return;

    appShowLoading();
    API.get('role/', { limit: 100 }).then(function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }
      var list = (res.data || {}).list || [];

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div id="role-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">🎭</div><p>暂无角色数据</p></div>' : '')
        + list.map(function (r) {
          return '<div class="app-card" style="margin-bottom:10px">'
            + '<div style="display:flex;align-items:center;justify-content:space-between">'
            + '<div>'
            + '<div style="font-size:16px;font-weight:600">' + escapeHtml(r.role_name) + '</div>'
            + '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">' + escapeHtml(r.remark || '暂无备注') + ' · ' + (r.user_count || 0) + ' 个用户 · ' + ((r.routers || []).length) + ' 个权限</div>'
            + '</div>'
            + '<button class="app-btn app-btn-sm app-btn-outline" onclick="editRoleApp(' + r.id + ')" style="padding:0 12px;height:32px;font-size:12px">管理</button>'
            + '</div>'
            + ((r.routers || []).length > 0
              ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">'
                + r.routers.map(function (rt) { return '<span class="badge badge-info">' + escapeHtml(rt.icon) + ' ' + escapeHtml(rt.router_name) + '</span>'; }).join('')
                + '</div>'
              : '')
            + '</div>';
        }).join('')
        + '</div>'
        + '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddRoleSheet()">＋ 创建角色</button></div>'
        + '</div>';
    });
  });

  window.showAddRoleSheet = function () {
    API.get('router/').then(function (routerRes) {
      var routers = routerRes.code === 200 ? (routerRes.data || []) : [];

      var overlay = document.createElement('div');
      overlay.className = 'app-action-sheet-overlay';
      overlay.innerHTML =
        '<div class="app-action-sheet">'
        + '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">创建角色</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">名称</div><input class="form-input" id="new-role-name" placeholder="请输入角色名称"></div>'
        + '<div class="app-form-item"><div class="form-label">备注</div><input class="form-input" id="new-role-remark" placeholder="选填"></div>'
        + '</div>'
        + '<div style="margin-bottom:12px;font-size:14px;font-weight:600;padding:0 4px">权限配置</div>'
        + '<div class="app-list" style="max-height:200px;overflow-y:auto">'
        + routers.map(function (r) {
          return '<div class="role-switch-item"><span style="font-size:14px">' + escapeHtml(r.icon) + ' ' + escapeHtml(r.router_name) + '</span>'
            + '<label class="switch"><input type="checkbox" value="' + r.id + '" class="new-role-router-cb"><span class="slider"></span></label></div>';
        }).join('')
        + '</div>'
        + '<button class="app-btn app-btn-primary" style="margin-top:16px" onclick="submitAddRole()">确认创建</button>'
        + '</div><div class="sheet-cancel" onclick="closeActionSheet()">取消</div></div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('show'); });
      overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
      window.closeActionSheet = function () {
        overlay.querySelector('.app-action-sheet').classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 300);
      };
    });
  };

  window.submitAddRole = function () {
    var roleName = document.getElementById('new-role-name') ? document.getElementById('new-role-name').value.trim() : '';
    var remark = document.getElementById('new-role-remark') ? document.getElementById('new-role-remark').value.trim() : '';
    var routerIds = Array.from(document.querySelectorAll('.new-role-router-cb:checked')).map(function (cb) { return parseInt(cb.value); });
    if (!roleName) { appToast('请输入角色名称'); return; }
    appShowLoading();
    API.post('role/', { role_name: roleName, remark: remark, router_ids: routerIds }).then(function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) { closeActionSheet(); pageLoaders.role(); }
    });
  };

  window.editRoleApp = function (id) {
    appShowLoading();
    Promise.all([
      API.get('role/', { limit: 100 }),
      API.get('router/')
    ]).then(function (results) {
      appHideLoading();
      var roleRes = results[0], routerRes = results[1];
      var role = (roleRes.data && roleRes.data.list || []).find(function (r) { return r.id === id; });
      var routers = routerRes.code === 200 ? (routerRes.data || []) : [];
      if (!role) { appToast('角色不存在'); return; }

      var overlay = document.createElement('div');
      overlay.className = 'app-action-sheet-overlay';
      overlay.innerHTML =
        '<div class="app-action-sheet">'
        + '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">编辑角色</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">名称</div><input class="form-input" id="edit-role-name" value="' + escapeHtml(role.role_name) + '" ' + (id === 1 ? 'disabled style="opacity:0.5"' : '') + '></div>'
        + '<div class="app-form-item"><div class="form-label">备注</div><input class="form-input" id="edit-role-remark" value="' + escapeHtml(role.remark || '') + '"></div>'
        + '</div>'
        + '<div style="margin-bottom:12px;font-size:14px;font-weight:600;padding:0 4px">权限配置</div>'
        + '<div class="app-list" style="max-height:200px;overflow-y:auto">'
        + routers.map(function (r) {
          return '<div class="role-switch-item"><span style="font-size:14px">' + escapeHtml(r.icon) + ' ' + escapeHtml(r.router_name) + '</span>'
            + '<label class="switch"><input type="checkbox" value="' + r.id + '" class="edit-role-router-cb" ' + ((role.router_ids || []).indexOf(r.id) !== -1 ? 'checked' : '') + '><span class="slider"></span></label></div>';
        }).join('')
        + '</div>'
        + '<div style="display:flex;gap:10px;margin-top:16px">'
        + '<button class="app-btn app-btn-primary" style="flex:1" onclick="submitEditRole(' + id + ')">保存</button>'
        + (id !== 1 ? '<button class="app-btn app-btn-danger" style="flex:1" onclick="deleteRoleApp(' + id + ')">删除</button>' : '')
        + '</div></div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div></div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('show'); });
      overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
      window.closeActionSheet = function () {
        overlay.querySelector('.app-action-sheet').classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 300);
      };
    });
  };

  window.submitEditRole = function (id) {
    var roleName = document.getElementById('edit-role-name') ? document.getElementById('edit-role-name').value.trim() : '';
    var remark = document.getElementById('edit-role-remark') ? document.getElementById('edit-role-remark').value.trim() : '';
    var routerIds = Array.from(document.querySelectorAll('.edit-role-router-cb:checked')).map(function (cb) { return parseInt(cb.value); });

    appShowLoading();
    Promise.all([
      API.post('role/', { action: 'update', id: id, role_name: roleName, remark: remark }),
      API.post('role/', { action: 'routers', role_id: id, router_ids: routerIds })
    ]).then(function (results) {
      appHideLoading();
      var res1 = results[0], res2 = results[1];
      appToast(res1.code === 200 && res2.code === 200 ? '保存成功' : (res1.msg || res2.msg));
      if (res1.code === 200 && res2.code === 200) { closeActionSheet(); pageLoaders.role(); }
    });
  };

  window.deleteRoleApp = function (id) {
    confirmDialog('删除角色', '确定要删除此角色吗？').then(function (ok) {
      if (!ok) return;
      appShowLoading();
      API.post('role/', { action: 'delete', id: id }).then(function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) { closeActionSheet(); pageLoaders.role(); }
      });
    });
  };

  // ---------- 路由管理 ----------
  registerPage('router', function () {
    var content = document.getElementById('page-router');
    if (!content) return;

    appShowLoading();
    API.get('router/').then(function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }
      var list = res.data || [];

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div id="router-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">🧭</div><p>暂无路由数据</p></div>' : '')
        + list.map(function (r) {
          return '<div class="app-card" style="margin-bottom:10px">'
            + '<div style="display:flex;align-items:center;justify-content:space-between">'
            + '<div style="display:flex;align-items:center;gap:10px">'
            + '<span style="font-size:24px">' + (r.icon || '📄') + '</span>'
            + '<div>'
            + '<div style="font-size:15px;font-weight:600">' + escapeHtml(r.router_name) + '</div>'
            + '<div style="font-size:12px;color:var(--text-secondary)"><code>' + escapeHtml(r.router_path) + '</code> · 排序 ' + r.sort + ' · ' + (r.role_count || 0) + ' 个角色绑定</div>'
            + '</div></div>'
            + '<div style="display:flex;align-items:center;gap:8px">'
            + '<span class="badge ' + (r.status == 1 ? 'badge-success' : 'badge-danger') + '">' + (r.status == 1 ? '启用' : '禁用') + '</span>'
            + '<button class="app-btn app-btn-sm app-btn-outline" onclick="editRouterApp(' + r.id + ')" style="padding:0 10px;height:30px;font-size:12px">编辑</button>'
            + '</div></div></div>';
        }).join('')
        + '</div>'
        + '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddRouterSheet()">＋ 添加路由</button></div>'
        + '</div>';
    });
  });

  window.showAddRouterSheet = function () {
    var overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML =
      '<div class="app-action-sheet">'
      + '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">添加路由</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form">'
      + '<div class="app-form-item"><div class="form-label">名称</div><input class="form-input" id="new-router-name" placeholder="如：用户管理"></div>'
      + '<div class="app-form-item"><div class="form-label">路径</div><input class="form-input" id="new-router-path" placeholder="如：user"></div>'
      + '<div class="app-form-item"><div class="form-label">图标</div><input class="form-input" id="new-router-icon" placeholder="Emoji 图标"></div>'
      + '<div class="app-form-item"><div class="form-label">排序</div><input class="form-input" type="number" id="new-router-sort" value="0" min="0"></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" style="margin-top:16px" onclick="submitAddRouter()">确认添加</button>'
      + '</div><div class="sheet-cancel" onclick="closeActionSheet()">取消</div></div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('show'); });
    overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
    window.closeActionSheet = function () {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(function () { overlay.remove(); }, 300);
    };
  };

  window.submitAddRouter = function () {
    var name = document.getElementById('new-router-name') ? document.getElementById('new-router-name').value.trim() : '';
    var path = document.getElementById('new-router-path') ? document.getElementById('new-router-path').value.trim() : '';
    var icon = document.getElementById('new-router-icon') ? document.getElementById('new-router-icon').value.trim() : '';
    var sort = parseInt(document.getElementById('new-router-sort') ? document.getElementById('new-router-sort').value : 0) || 0;
    if (!name || !path) { appToast('名称和路径不能为空'); return; }
    appShowLoading();
    API.post('router/', { router_name: name, router_path: path, icon: icon, sort: sort }).then(function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) { closeActionSheet(); pageLoaders.router(); }
    });
  };

  window.editRouterApp = function (id) {
    API.get('router/').then(function (res) {
      var r = (res.data || []).find(function (x) { return x.id === id; });
      if (!r) { appToast('路由不存在'); return; }

      var overlay = document.createElement('div');
      overlay.className = 'app-action-sheet-overlay';
      overlay.innerHTML =
        '<div class="app-action-sheet">'
        + '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">编辑路由</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">名称</div><input class="form-input" id="edit-router-name" value="' + escapeHtml(r.router_name) + '"></div>'
        + '<div class="app-form-item"><div class="form-label">路径</div><input class="form-input" id="edit-router-path" value="' + escapeHtml(r.router_path) + '"></div>'
        + '<div class="app-form-item"><div class="form-label">图标</div><input class="form-input" id="edit-router-icon" value="' + escapeHtml(r.icon || '') + '"></div>'
        + '<div class="app-form-item"><div class="form-label">排序</div><input class="form-input" type="number" id="edit-router-sort" value="' + r.sort + '" min="0"></div>'
        + '<div class="app-form-item"><div class="form-label">状态</div><label class="switch"><input type="checkbox" id="edit-router-status" ' + (r.status == 1 ? 'checked' : '') + '><span class="slider"></span></label></div>'
        + '</div>'
        + '<div style="display:flex;gap:10px;margin-top:16px">'
        + '<button class="app-btn app-btn-primary" style="flex:1" onclick="submitEditRouter(' + r.id + ')">保存</button>'
        + '<button class="app-btn app-btn-danger" style="flex:1" onclick="deleteRouterApp(' + r.id + ')">删除</button>'
        + '</div></div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div></div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('show'); });
      overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
      window.closeActionSheet = function () {
        overlay.querySelector('.app-action-sheet').classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 300);
      };
    });
  };

  window.submitEditRouter = function (id) {
    var name = document.getElementById('edit-router-name') ? document.getElementById('edit-router-name').value.trim() : '';
    var path = document.getElementById('edit-router-path') ? document.getElementById('edit-router-path').value.trim() : '';
    var icon = document.getElementById('edit-router-icon') ? document.getElementById('edit-router-icon').value.trim() : '';
    var sort = parseInt(document.getElementById('edit-router-sort') ? document.getElementById('edit-router-sort').value : 0) || 0;
    var status = document.getElementById('edit-router-status') && document.getElementById('edit-router-status').checked ? 1 : 0;
    if (!name || !path) { appToast('名称和路径不能为空'); return; }
    appShowLoading();
    API.post('router/', { action: 'update', id: id, router_name: name, router_path: path, icon: icon, sort: sort, status: status }).then(function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) { closeActionSheet(); pageLoaders.router(); }
    });
  };

  window.deleteRouterApp = function (id) {
    confirmDialog('删除路由', '确定要删除此路由？关联的角色权限将被清除。').then(function (ok) {
      if (!ok) return;
      appShowLoading();
      API.post('router/', { action: 'delete', id: id }).then(function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) { closeActionSheet(); pageLoaders.router(); }
      });
    });
  };

  // ---------- 我的页面 ----------
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
      + '<div class="app-list-item"><div class="item-icon">🆔</div><div class="item-content"><div class="item-title">账号</div><div class="item-desc">' + escapeHtml(user.username) + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">📧</div><div class="item-content"><div class="item-title">邮箱</div><div class="item-desc">' + escapeHtml(user.email || '未设置') + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">📱</div><div class="item-content"><div class="item-title">手机</div><div class="item-desc">' + escapeHtml(user.phone || '未设置') + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">📅</div><div class="item-content"><div class="item-title">注册时间</div><div class="item-desc">' + formatDate(user.create_time) + '</div></div></div>'
      + '</div>'
      + '<div class="app-list">'
      + '<div class="app-list-item" onclick="window.ThemeSwitcher&&ThemeSwitcher.showMobileSheet()">'
      + '<div class="item-icon">🎨</div><div class="item-content"><div class="item-title">切换主题</div><div class="item-desc" id="current-theme-name"></div></div><div class="item-arrow">›</div>'
      + '</div>'
      + '<div class="app-list-item" onclick="showChangePwdSheet()">'
      + '<div class="item-icon">🔒</div><div class="item-content"><div class="item-title">修改密码</div></div><div class="item-arrow">›</div>'
      + '</div></div>'
      + '<div style="padding:24px 0"><button class="app-btn app-btn-danger" onclick="logoutApp()">退出登录</button></div>'
      + '</div>';

    // 更新当前主题名称
    if (window.ThemeSwitcher) {
      var cur = ThemeSwitcher.get();
      var t = ThemeSwitcher.themes.filter(function (x) { return x.id === cur; });
      var nameEl = document.getElementById('current-theme-name');
      if (nameEl && t.length) nameEl.textContent = t[0].name;
    }
  });

  // 修改密码
  window.showChangePwdSheet = function () {
    var overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML =
      '<div class="app-action-sheet">'
      + '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">修改密码</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form">'
      + '<div class="app-form-item"><div class="form-label">原密码</div><input class="form-input" type="password" id="old-pwd" placeholder="请输入原密码"></div>'
      + '<div class="app-form-item"><div class="form-label">新密码</div><input class="form-input" type="password" id="new-pwd" placeholder="请输入新密码"></div>'
      + '<div class="app-form-item"><div class="form-label">确认</div><input class="form-input" type="password" id="confirm-pwd" placeholder="再次输入新密码"></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" style="margin-top:16px" onclick="submitChangePwd()">确认修改</button>'
      + '</div><div class="sheet-cancel" onclick="closeActionSheet()">取消</div></div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('show'); });
    overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
    window.closeActionSheet = function () {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(function () { overlay.remove(); }, 300);
    };
  };

  window.submitChangePwd = function () {
    var oldPwd = document.getElementById('old-pwd') ? document.getElementById('old-pwd').value : '';
    var newPwd = document.getElementById('new-pwd') ? document.getElementById('new-pwd').value : '';
    var confirmPwd = document.getElementById('confirm-pwd') ? document.getElementById('confirm-pwd').value : '';
    if (!oldPwd || !newPwd) { appToast('请填写完整'); return; }
    if (newPwd !== confirmPwd) { appToast('两次密码不一致'); return; }
    appShowLoading();
    API.post('user/', { action: 'password', old_password: oldPwd, new_password: newPwd }).then(function (res) {
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

  // ==================== 导出 & 初始化 ====================
  window.AppRouter = AppRouter;
  document.addEventListener('DOMContentLoaded', function () { AppRouter.init(); });
})();
