/**
 * app.js v3.0 - 手机端 APP 路由系统
 * Material Icons 替代 emoji
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

  var pageLoaders = {};

  window.registerPage = function (path, loader) {
    pageLoaders[path] = loader;
  };

  // 图标渲染：如果是已知 Material Icon 名称就渲染图标，否则显示文字
  function renderIcon(iconText) {
    var knownIcons = ['home','group','security','route','account_circle','login','logout','search',
      'delete','edit','add','settings','lock','email','phone','calendar_today','arrow_forward',
      'arrow_back','dashboard','menu','close','check','warning','error','info','refresh',
      'person','person_add','lock_reset','visibility','shield','key','link','sort','toggle_on',
      'toggle_off','verified_user','admin_panel_settings','manage_accounts','supervised_user_circle',
      'badge','contact_mail','alternate_email','vpn_key','how_to_reg'];
    if (knownIcons.indexOf(iconText) !== -1) {
      return '<i class="mi">' + iconText + '</i>';
    }
    // 兼容旧 emoji 数据
    return iconText || '<i class="mi">description</i>';
  }

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
      return API.get('router/', { action: 'user' }).then(function (res) {
        if (res.code === 200) {
          self.userRouters = res.data || [];
        }
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

      if (tabDefs.length > 5) {
        var home = tabDefs[0];
        var mine = tabDefs[tabDefs.length - 1];
        var middle = tabDefs.slice(1, tabDefs.length - 1).slice(0, 3);
        tabDefs = [home].concat(middle, [mine]);
      }

      tabDefs.forEach(function (tab, i) {
        var div = document.createElement('div');
        div.className = 'tab-item' + (i === 0 ? ' active' : '');
        div.dataset.page = tab.page;
        div.innerHTML = '<span class="tab-icon">' + renderIcon(tab.icon) + '</span><span class="tab-label">' + escapeHtml(tab.label) + '</span>';
        tabBar.appendChild(div);
      });

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
  });

  // ==================== 用户管理 ====================
  registerPage('user', function () {
    var content = document.getElementById('page-user');
    if (!content) return;

    appShowLoading();
    API.get('user/', { page: 1, limit: 20 }).then(function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }

      var list = (res.data || {}).list || [];
      var total = (res.data || {}).total || 0;

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
        + '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddUserSheet()">' + mi('add', 'mi-18') + ' 添加用户</button></div>'
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
      + '<button class="app-btn app-btn-sm app-btn-outline" onclick="editUserApp(' + u.id + ')" style="padding:0 10px;height:30px;font-size:12px">' + mi('edit', 'mi-14') + ' 编辑</button>'
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
          ? '<div class="empty-state"><div class="empty-icon">' + mi('search_off', 'mi-xl') + '</div><p>未找到用户</p></div>'
          : list.map(function (u) { return renderUserCard(u); }).join('');
      }
    });
  };

  // ==================== 角色管理 ====================
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
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('shield', 'mi-xl') + '</div><p>暂无角色数据</p></div>' : '')
        + list.map(function (r) {
          return '<div class="app-card" style="margin-bottom:10px">'
            + '<div style="display:flex;align-items:center;justify-content:space-between">'
            + '<div>'
            + '<div style="font-size:16px;font-weight:600">' + escapeHtml(r.role_name) + '</div>'
            + '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">' + escapeHtml(r.remark || '暂无备注') + ' · ' + (r.user_count || 0) + ' 个用户 · ' + ((r.routers || []).length) + ' 个权限</div>'
            + '</div>'
            + '<button class="app-btn app-btn-sm app-btn-outline" onclick="editRoleApp(' + r.id + ')" style="padding:0 12px;height:32px;font-size:12px">' + mi('settings', 'mi-14') + ' 管理</button>'
            + '</div>'
            + ((r.routers || []).length > 0
              ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">'
                + r.routers.map(function (rt) { return '<span class="badge badge-info">' + renderIcon(rt.icon) + ' ' + escapeHtml(rt.router_name) + '</span>'; }).join('')
                + '</div>'
              : '')
            + '</div>';
        }).join('')
        + '</div>'
        + '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddRoleSheet()">' + mi('add', 'mi-18') + ' 创建角色</button></div>'
        + '</div>';
    });
  });

  // ==================== 路由管理 ====================
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
            + '<button class="app-btn app-btn-sm app-btn-outline" onclick="editRouterApp(' + r.id + ')" style="padding:0 10px;height:30px;font-size:12px">' + mi('edit', 'mi-14') + '</button>'
            + '</div></div></div>';
        }).join('')
        + '</div>'
        + '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="showAddRouterSheet()">' + mi('add', 'mi-18') + ' 添加路由</button></div>'
        + '</div>';
    });
  });

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
    var overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay show';
    overlay.innerHTML =
      '<div class="app-action-sheet" style="transform:translateY(0)">'
      + '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">编辑资料</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form">'
      + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="profile-nickname" value="' + escapeHtml(user.nickname || '') + '" placeholder="请输入昵称"></div>'
      + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" type="email" id="profile-email" value="' + escapeHtml(user.email || '') + '" placeholder="请输入邮箱"></div>'
      + '<div class="app-form-item"><div class="form-label">手机</div><input class="form-input" type="tel" id="profile-phone" value="' + escapeHtml(user.phone || '') + '" placeholder="请输入手机号"></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitProfile()">保存修改</button>'
      + '</div>'
      + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div></div>';
    document.body.appendChild(overlay);
    window.closeActionSheet = function () {
      overlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
      setTimeout(function () { overlay.remove(); }, 350);
    };
    overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
  };

  window.submitProfile = function () {
    var nickname = document.getElementById('profile-nickname').value.trim();
    var email    = document.getElementById('profile-email').value.trim();
    var phone    = document.getElementById('profile-phone').value.trim();
    appShowLoading();
    API.post('user/', { action: 'profile', nickname: nickname, email: email, phone: phone }).then(function (res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        Storage.set('currentUser', res.data);
        closeActionSheet();
        // 刷新页面数据
        registerPage.mine && registerPage.mine();
        // 重新加载我的页面
        var mineLoader = pageLoaders['mine'];
        if (mineLoader) mineLoader();
      }
    });
  };

  // 修改密码（手机端）
  window.showChangePwdSheet = function () {
    var overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay show';
    overlay.innerHTML =
      '<div class="app-action-sheet" style="transform:translateY(0)">'
      + '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">修改密码</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form">'
      + '<div class="app-form-item"><div class="form-label">原密码</div><input class="form-input" type="password" id="old-pwd" placeholder="请输入原密码"></div>'
      + '<div class="app-form-item"><div class="form-label">新密码</div><input class="form-input" type="password" id="new-pwd" placeholder="请输入新密码"></div>'
      + '<div class="app-form-item"><div class="form-label">确认</div><input class="form-input" type="password" id="confirm-pwd" placeholder="再次输入新密码"></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" style="margin-top:12px" onclick="submitChangePwd()">确认修改</button>'
      + '</div><div class="sheet-cancel" onclick="closeActionSheet()">取消</div></div>';
    document.body.appendChild(overlay);
    window.closeActionSheet = function () {
      overlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
      setTimeout(function () { overlay.remove(); }, 350);
    };
    overlay.onclick = function (e) { if (e.target === overlay) closeActionSheet(); };
  };

  window.submitChangePwd = function () {
    var oldPwd = document.getElementById('old-pwd').value;
    var newPwd = document.getElementById('new-pwd').value;
    var confirmPwd = document.getElementById('confirm-pwd').value;
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
