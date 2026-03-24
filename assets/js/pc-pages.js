/**
 * pc-pages.js v3.0 - PC 端页面渲染逻辑
 * Material Icons 替代 emoji
 */
var PCPages = (function () {
  var currentUser = null;
  var userRouters = [];
  var _userPage = 1;

  function init(user, routers) {
    currentUser = user;
    userRouters = routers;
  }

  function miIcon(name, cls) { return '<i class="mi' + (cls ? ' ' + cls : '') + '">' + name + '</i>'; }
  function renderIcon(iconText) {
    var knownIcons = ['home','group','security','route','account_circle','login','logout','search',
      'delete','edit','add','settings','lock','email','phone','calendar_today','arrow_forward',
      'arrow_back','dashboard','menu','close','check','warning','error','info','refresh',
      'person','person_add','lock_reset','visibility','shield','key','link','sort','toggle_on',
      'toggle_off','verified_user','admin_panel_settings','manage_accounts','supervised_user_circle',
      'badge','contact_mail','alternate_email','vpn_key','how_to_reg','rocket_launch','chevron_right',
      'edit_note','logout','inbox','search_off'];
    if (knownIcons.indexOf(iconText) !== -1) {
      return miIcon(iconText);
    }
    return iconText || miIcon('description');
  }

  // ==================== 首页 ====================
  function loadHome(c) {
    Promise.all([
      API.get('user/', { limit: 1 }),
      API.get('role/', { limit: 100 }),
      API.get('router/')
    ]).then(function(results) {
      var uR = results[0], rR = results[1], rtR = results[2];
      var user = Storage.get('currentUser') || {};
      var routers = window._userRouters || [];
      c.innerHTML =
        '<div class="stats-grid">'
        + '<div class="stat-card"><div class="stat-icon">' + miIcon('group', 'mi-lg') + '</div><div class="stat-value">' + (uR.data && uR.data.total || 0) + '</div><div class="stat-label">系统用户</div></div>'
        + '<div class="stat-card"><div class="stat-icon">' + miIcon('shield', 'mi-lg') + '</div><div class="stat-value">' + (rR.data && rR.data.total || 0) + '</div><div class="stat-label">角色数量</div></div>'
        + '<div class="stat-card"><div class="stat-icon">' + miIcon('route', 'mi-lg') + '</div><div class="stat-value">' + ((rtR.data || []).length) + '</div><div class="stat-label">路由权限</div></div>'
        + '<div class="stat-card"><div class="stat-icon">' + miIcon('check_circle', 'mi-lg mi-success') + '</div><div class="stat-value" style="color:var(--success)">正常</div><div class="stat-label">系统状态</div></div>'
        + '</div>'
        + '<div class="card"><div class="card-header">欢迎回来，' + escapeHtml(user.nickname || user.username) + '</div>'
        + '<div class="card-body">'
        + '<p style="color:var(--text-secondary)">RBAC 权限管理系统 v3.0 运行正常。通过左侧菜单管理用户、角色和路由权限。</p>'
        + '<div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">'
        + (hasRoute(routers, 'user') ? '<button class="btn btn-primary" onclick="pcNavigate(\'user\')">' + miIcon('group', 'mi-18') + ' 管理用户</button>' : '')
        + (hasRoute(routers, 'role') ? '<button class="btn btn-outline" onclick="pcNavigate(\'role\')">' + miIcon('shield', 'mi-18') + ' 配置角色</button>' : '')
        + (hasRoute(routers, 'router') ? '<button class="btn btn-outline" onclick="pcNavigate(\'router\')">' + miIcon('route', 'mi-18') + ' 路由权限</button>' : '')
        + '</div></div></div>';
    });
  }

  // ==================== 用户管理 ====================
  function loadPCUser(c, kw) {
    kw = kw || (document.getElementById('pc-user-search') ? document.getElementById('pc-user-search').value : '') || '';
    API.get('user/', { page: _userPage, limit: 10, keyword: kw }).then(function(res) {
      if (res.code !== 200) { showToast(res.msg); return; }
      var list = (res.data || {}).list || [];
      var total = (res.data || {}).total || 0;
      var pages = Math.ceil(total / 10) || 1;

      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>用户管理</h2><div class="subtitle">共 ' + total + ' 个用户</div></div>'
        + '<button class="btn btn-primary" onclick="PCPages.addUser()">' + miIcon('add', 'mi-18') + ' 新增用户</button>'
        + '</div>'
        + '<div class="search-bar">'
        + '<input class="form-input" id="pc-user-search" placeholder="搜索用户名/昵称" value="' + escapeHtml(kw) + '" onkeyup="if(event.key===\'Enter\'){PCPages.userPage=1;PCPages.loadUser(document.getElementById(\'page-content\'))}">'
        + '<button class="btn btn-outline" onclick="PCPages.userPage=1;PCPages.loadUser(document.getElementById(\'page-content\'))">' + miIcon('search', 'mi-18') + ' 搜索</button>'
        + '</div>'
        + '<div class="card"><div class="table-wrap"><table>'
        + '<thead><tr><th>ID</th><th>账号</th><th>昵称</th><th>角色</th><th>状态</th><th>最后登录</th><th>操作</th></tr></thead>'
        + '<tbody>' + (list.length === 0 ? '<tr><td colspan="7" class="text-center text-secondary" style="padding:32px">暂无数据</td></tr>' : '')
        + list.map(function(u) {
          return '<tr>'
            + '<td>' + u.id + '</td>'
            + '<td>' + escapeHtml(u.username) + (u.is_super ? '<span class="badge badge-warning">超级</span>' : '') + '</td>'
            + '<td>' + escapeHtml(u.nickname) + '</td>'
            + '<td>' + ((u.roles || []).map(function(r) { return '<span class="badge badge-info">' + escapeHtml(r.role_name) + '</span>'; }).join(' ') || '<span class="text-secondary">无</span>') + '</td>'
            + '<td>' + (u.status == 1 ? '<span class="badge badge-success">正常</span>' : '<span class="badge badge-danger">禁用</span>') + '</td>'
            + '<td class="text-sm text-secondary">' + (u.last_login ? formatDate(u.last_login) : '从未登录') + '</td>'
            + '<td><div class="action-btns">'
            + '<button class="btn btn-sm btn-outline" onclick="PCPages.editUser(' + u.id + ')">' + miIcon('edit', 'mi-14') + ' 编辑</button>'
            + (!u.is_super ? '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteUser(' + u.id + ')">' + miIcon('delete', 'mi-14') + ' 删除</button>' : '')
            + '</div></td></tr>';
        }).join('')
        + '</tbody></table></div></div>'
        + '<div class="pagination">'
        + '<button ' + (_userPage <= 1 ? 'disabled' : '') + ' onclick="PCPages.userPage--;PCPages.loadUser(document.getElementById(\'page-content\'))">上一页</button>'
        + '<span class="text-sm text-secondary">第 ' + _userPage + '/' + pages + ' 页</span>'
        + '<button ' + (_userPage >= pages ? 'disabled' : '') + ' onclick="PCPages.userPage++;PCPages.loadUser(document.getElementById(\'page-content\'))">下一页</button>'
        + '</div>';
    });
  }

  function pcAddUser() {
    API.get('role/', { limit: 100 }).then(function(res) {
      var roles = (res.data || {}).list || [];
      document.getElementById('modal-user-title').textContent = '新增用户';
      document.getElementById('form-user-id').value = '';
      var uEl = document.getElementById('form-user-username'); uEl.value = ''; uEl.disabled = false;
      document.getElementById('form-user-password').value = '123456';
      document.getElementById('form-user-password').closest('.form-group').style.display = '';
      document.getElementById('form-user-nickname').value = '';
      document.getElementById('form-user-email').value = '';
      document.getElementById('form-user-phone').value = '';
      document.getElementById('form-user-roles').innerHTML = roles.map(function(r) {
        return '<div class="tree-item"><input type="checkbox" value="' + r.id + '" class="user-role-cb"><span>' + escapeHtml(r.role_name) + '</span></div>';
      }).join('');
      openModal('modal-user');
    });
  }

  function pcEditUser(id) {
    API.get('user/', { action: 'detail', id: id }).then(function(res) {
      if (res.code !== 200) { showToast(res.msg); return; }
      var u = res.data;
      API.get('role/', { limit: 100 }).then(function(roleRes) {
        var roles = (roleRes.data || {}).list || [];
        document.getElementById('modal-user-title').textContent = '编辑用户';
        document.getElementById('form-user-id').value = u.id;
        var uEl = document.getElementById('form-user-username'); uEl.value = u.username; uEl.disabled = true;
        document.getElementById('form-user-password').closest('.form-group').style.display = 'none';
        document.getElementById('form-user-nickname').value = u.nickname;
        document.getElementById('form-user-email').value = u.email || '';
        document.getElementById('form-user-phone').value = u.phone || '';
        document.getElementById('form-user-roles').innerHTML = roles.map(function(r) {
          return '<div class="tree-item"><input type="checkbox" value="' + r.id + '" class="user-role-cb" ' + ((u.role_ids || []).indexOf(r.id) !== -1 ? 'checked' : '') + '><span>' + escapeHtml(r.role_name) + '</span></div>';
        }).join('');
        openModal('modal-user');
      });
    });
  }

  function saveUser() {
    var id = document.getElementById('form-user-id').value;
    var username = document.getElementById('form-user-username').value.trim();
    var password = document.getElementById('form-user-password').value.trim();
    var nickname = document.getElementById('form-user-nickname').value.trim();
    var email = document.getElementById('form-user-email').value.trim();
    var phone = document.getElementById('form-user-phone').value.trim();
    var roleIds = Array.from(document.querySelectorAll('.user-role-cb:checked')).map(function(cb) { return parseInt(cb.value); });
    if (!username) { showToast('请输入账号'); return; }

    if (id) {
      API.post('user/', { action: 'update', id: parseInt(id), nickname: nickname, email: email, phone: phone }).then(function(updateRes) {
        if (updateRes.code !== 200) { showToast(updateRes.msg || '更新用户失败'); return; }
        API.post('user/', { action: 'roles', user_id: parseInt(id), role_ids: roleIds }).then(function(res) {
          showToast(res.msg);
          if (res.code === 200) { closeModal('modal-user'); loadPCUser(document.getElementById('page-content')); }
        });
      });
    } else {
      API.post('user/', { username: username, password: password || '123456', nickname: nickname, email: email, phone: phone, role_ids: roleIds }).then(function(res) {
        showToast(res.msg);
        if (res.code === 200) { closeModal('modal-user'); loadPCUser(document.getElementById('page-content')); }
      });
    }
  }

  function pcDeleteUser(id) {
    confirmDialog('删除用户', '确定要删除此用户吗？此操作不可恢复。').then(function(ok) {
      if (!ok) return;
      API.post('user/', { action: 'delete', id: id }).then(function(res) {
        showToast(res.msg);
        if (res.code === 200) loadPCUser(document.getElementById('page-content'));
      });
    });
  }

  // ==================== 角色管理 ====================
  function loadPCRole(c) {
    API.get('role/', { limit: 100 }).then(function(res) {
      var list = (res.data || {}).list || [];
      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>角色管理</h2><div class="subtitle">共 ' + list.length + ' 个角色</div></div>'
        + '<button class="btn btn-primary" onclick="PCPages.addRole()">' + miIcon('add', 'mi-18') + ' 新增角色</button>'
        + '</div>'
        + '<div class="card"><div class="table-wrap"><table>'
        + '<thead><tr><th>ID</th><th>角色名称</th><th>备注</th><th>用户数</th><th>权限列表</th><th>操作</th></tr></thead>'
        + '<tbody>' + list.map(function(r) {
          return '<tr>'
            + '<td>' + r.id + '</td><td><strong>' + escapeHtml(r.role_name) + '</strong></td>'
            + '<td class="text-secondary">' + escapeHtml(r.remark || '-') + '</td>'
            + '<td>' + (r.user_count || 0) + '</td>'
            + '<td>' + ((r.routers || []).map(function(rt) { return '<span class="badge badge-info">' + renderIcon(rt.icon) + ' ' + escapeHtml(rt.router_name) + '</span>'; }).join(' ') || '<span class="text-secondary">无</span>') + '</td>'
            + '<td><div class="action-btns">'
            + '<button class="btn btn-sm btn-outline" onclick="PCPages.editRole(' + r.id + ')">' + miIcon('edit', 'mi-14') + ' 编辑</button>'
            + (r.id !== 1 ? '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteRole(' + r.id + ')">' + miIcon('delete', 'mi-14') + ' 删除</button>' : '')
            + '</div></td></tr>';
        }).join('')
        + '</tbody></table></div></div>';
    });
  }

  function pcAddRole() {
    API.get('router/').then(function(res) {
      var routers = res.data || [];
      document.getElementById('modal-role-title').textContent = '新增角色';
      document.getElementById('form-role-id').value = '';
      var nEl = document.getElementById('form-role-name'); nEl.value = ''; nEl.disabled = false;
      document.getElementById('form-role-remark').value = '';
      document.getElementById('form-role-routers').innerHTML = routers.map(function(r) {
        return '<div class="tree-item"><input type="checkbox" value="' + r.id + '" class="role-router-cb"><span>' + renderIcon(r.icon) + ' ' + escapeHtml(r.router_name) + '</span></div>';
      }).join('');
      openModal('modal-role');
    });
  }

  function pcEditRole(id) {
    Promise.all([API.get('role/', { limit: 100 }), API.get('router/')]).then(function(results) {
      var roleRes = results[0], routerRes = results[1];
      var role = (roleRes.data && roleRes.data.list || []).find(function(r) { return r.id === id; });
      var routers = routerRes.data || [];
      if (!role) { showToast('角色不存在'); return; }
      document.getElementById('modal-role-title').textContent = '编辑角色';
      document.getElementById('form-role-id').value = role.id;
      var nEl = document.getElementById('form-role-name'); nEl.value = role.role_name; nEl.disabled = (id === 1);
      document.getElementById('form-role-remark').value = role.remark || '';
      document.getElementById('form-role-routers').innerHTML = routers.map(function(r) {
        return '<div class="tree-item"><input type="checkbox" value="' + r.id + '" class="role-router-cb" ' + ((role.router_ids || []).indexOf(r.id) !== -1 ? 'checked' : '') + '><span>' + renderIcon(r.icon) + ' ' + escapeHtml(r.router_name) + '</span></div>';
      }).join('');
      openModal('modal-role');
    });
  }

  function saveRole() {
    var id = document.getElementById('form-role-id').value;
    var roleName = document.getElementById('form-role-name').value.trim();
    var remark = document.getElementById('form-role-remark').value.trim();
    var routerIds = Array.from(document.querySelectorAll('.role-router-cb:checked')).map(function(cb) { return parseInt(cb.value); });
    if (!roleName) { showToast('请输入角色名称'); return; }
    if (id) {
      API.post('role/', { action: 'update', id: parseInt(id), role_name: roleName, remark: remark }).then(function(updateRes) {
        if (updateRes.code !== 200) { showToast(updateRes.msg || '更新角色失败'); return; }
        API.post('role/', { action: 'routers', role_id: parseInt(id), router_ids: routerIds }).then(function(res) {
          showToast(res.msg);
          if (res.code === 200) { closeModal('modal-role'); loadPCRole(document.getElementById('page-content')); }
        });
      });
    } else {
      API.post('role/', { role_name: roleName, remark: remark, router_ids: routerIds }).then(function(res) {
        showToast(res.msg);
        if (res.code === 200) { closeModal('modal-role'); loadPCRole(document.getElementById('page-content')); }
      });
    }
  }

  function pcDeleteRole(id) {
    confirmDialog('删除角色', '确定要删除此角色？关联的用户权限将被清除。').then(function(ok) {
      if (!ok) return;
      API.post('role/', { action: 'delete', id: id }).then(function(res) {
        showToast(res.msg);
        if (res.code === 200) loadPCRole(document.getElementById('page-content'));
      });
    });
  }

  // ==================== 路由管理 ====================
  function loadPCRouter(c) {
    API.get('router/').then(function(res) {
      var list = res.data || [];
      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>路由管理</h2><div class="subtitle">共 ' + list.length + ' 条路由</div></div>'
        + '<button class="btn btn-primary" onclick="PCPages.addRouter()">' + miIcon('add', 'mi-18') + ' 新增路由</button>'
        + '</div>'
        + '<div class="card"><div class="table-wrap"><table>'
        + '<thead><tr><th>ID</th><th>图标</th><th>名称</th><th>路径</th><th>排序</th><th>状态</th><th>绑定角色</th><th>操作</th></tr></thead>'
        + '<tbody>' + list.map(function(r) {
          return '<tr>'
            + '<td>' + r.id + '</td><td style="font-size:20px">' + renderIcon(r.icon) + '</td>'
            + '<td><strong>' + escapeHtml(r.router_name) + '</strong></td>'
            + '<td><code>' + escapeHtml(r.router_path) + '</code></td>'
            + '<td>' + r.sort + '</td>'
            + '<td>' + (r.status == 1 ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>') + '</td>'
            + '<td>' + (r.role_count || 0) + ' 个角色</td>'
            + '<td><div class="action-btns">'
            + '<button class="btn btn-sm btn-outline" onclick="PCPages.editRouter(' + r.id + ')">' + miIcon('edit', 'mi-14') + ' 编辑</button>'
            + '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteRouter(' + r.id + ')">' + miIcon('delete', 'mi-14') + ' 删除</button>'
            + '</div></td></tr>';
        }).join('')
        + '</tbody></table></div></div>';
    });
  }

  function pcAddRouter() {
    document.getElementById('modal-router-title').textContent = '新增路由';
    document.getElementById('form-router-id').value = '';
    document.getElementById('form-router-name').value = '';
    document.getElementById('form-router-path').value = '';
    document.getElementById('form-router-icon').value = '';
    document.getElementById('form-router-sort').value = '0';
    openModal('modal-router');
  }

  function pcEditRouter(id) {
    API.get('router/').then(function(res) {
      var r = (res.data || []).find(function(x) { return x.id === id; });
      if (!r) { showToast('路由不存在'); return; }
      document.getElementById('modal-router-title').textContent = '编辑路由';
      document.getElementById('form-router-id').value = r.id;
      document.getElementById('form-router-name').value = r.router_name;
      document.getElementById('form-router-path').value = r.router_path;
      document.getElementById('form-router-icon').value = r.icon || '';
      document.getElementById('form-router-sort').value = r.sort;
      openModal('modal-router');
    });
  }

  function saveRouter() {
    var id = document.getElementById('form-router-id').value;
    var routerName = document.getElementById('form-router-name').value.trim();
    var routerPath = document.getElementById('form-router-path').value.trim();
    var icon = document.getElementById('form-router-icon').value.trim();
    var sort = parseInt(document.getElementById('form-router-sort').value) || 0;
    if (!routerName || !routerPath) { showToast('名称和路径不能为空'); return; }
    var data = { router_name: routerName, router_path: routerPath, icon: icon, sort: sort };
    if (id) {
      data.action = 'update'; data.id = parseInt(id);
    }
    API.post('router/', data).then(function(res) {
      showToast(res.msg);
      if (res.code === 200) { closeModal('modal-router'); loadPCRouter(document.getElementById('page-content')); }
    });
  }

  function pcDeleteRouter(id) {
    confirmDialog('删除路由', '确定要删除此路由？').then(function(ok) {
      if (!ok) return;
      API.post('router/', { action: 'delete', id: id }).then(function(res) {
        showToast(res.msg);
        if (res.code === 200) loadPCRouter(document.getElementById('page-content'));
      });
    });
  }

  // ==================== 个人中心 ====================
  function loadPCMine(c) {
    var user = Storage.get('currentUser') || {};
    c.innerHTML =
      '<div class="page-header"><h2>个人中心</h2></div>'
      + '<div style="display:flex;justify-content:center">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:1200px;width:100%">'
      + '<div class="card"><div class="card-body" style="padding:32px">'
      + '<div style="display:flex;align-items:center;gap:24px;margin-bottom:32px;padding-bottom:32px;border-bottom:1px solid var(--border-light)">'
      + '<div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:600;flex-shrink:0">' + getInitial(user.nickname || user.username) + '</div>'
      + '<div>'
      + '<h3 style="margin:0 0 12px;font-size:28px">' + escapeHtml(user.nickname || user.username) + '</h3>'
      + '<p class="text-secondary" style="margin:0;font-size:16px">' + (user.is_super ? '<span style="color:var(--primary);font-weight:500">超级管理员</span>' : '普通用户') + '</p>'
      + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">'
      + '<div class="form-group"><label class="form-label" style="font-size:15px"><i class="mi mi-16">badge</i> 账号</label><input class="form-input" style="padding:14px 16px;font-size:15px" value="' + escapeHtml(user.username) + '" disabled></div>'
      + '<div class="form-group"><label class="form-label" style="font-size:15px"><i class="mi mi-16">email</i> 邮箱</label><input class="form-input" style="padding:14px 16px;font-size:15px" value="' + escapeHtml(user.email || '未设置') + '" disabled></div>'
      + '<div class="form-group"><label class="form-label" style="font-size:15px"><i class="mi mi-16">phone</i> 手机</label><input class="form-input" style="padding:14px 16px;font-size:15px" value="' + escapeHtml(user.phone || '未设置') + '" disabled></div>'
      + '<div class="form-group"><label class="form-label" style="font-size:15px"><i class="mi mi-16">calendar_today</i> 最后登录</label><input class="form-input" style="padding:14px 16px;font-size:15px" value="' + (user.last_login ? formatDate(user.last_login) : '首次登录') + '" disabled></div>'
      + '</div>'
      // 编辑资料
      + '<div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border-light)">'
      + '<h3 style="margin-bottom:20px;font-size:20px">' + miIcon('edit_note') + ' 编辑资料</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">'
      + '<div class="form-group"><label class="form-label" style="font-size:15px">昵称</label><input class="form-input" id="pc-profile-nickname" style="padding:14px 16px;font-size:15px" value="' + escapeHtml(user.nickname || '') + '" placeholder="请输入昵称"></div>'
      + '<div class="form-group"><label class="form-label" style="font-size:15px">邮箱</label><input class="form-input" type="email" id="pc-profile-email" style="padding:14px 16px;font-size:15px" value="' + escapeHtml(user.email || '') + '" placeholder="请输入邮箱"></div>'
      + '</div>'
      + '<div class="form-group"><label class="form-label" style="font-size:15px">手机</label><input class="form-input" type="tel" id="pc-profile-phone" style="padding:14px 16px;font-size:15px" value="' + escapeHtml(user.phone || '') + '" placeholder="请输入手机号"></div>'
      + '<button class="btn btn-primary" onclick="PCPages.saveProfile()" style="width:100%;padding:14px;font-size:15px">' + miIcon('save', 'mi-18') + ' 保存资料</button>'
      + '</div>'
      + '</div></div>'
      // 修改密码
      + '<div class="card"><div class="card-body" style="padding:32px">'
      + '<h3 style="margin-bottom:24px;font-size:24px">' + miIcon('lock') + ' 修改密码</h3>'
      + '<div class="form-group"><label class="form-label" style="font-size:15px">原密码</label><input class="form-input" style="padding:14px 16px;font-size:15px" type="password" id="pc-old-pwd" placeholder="请输入原密码"></div>'
      + '<div class="form-group"><label class="form-label" style="font-size:15px">新密码</label><input class="form-input" style="padding:14px 16px;font-size:15px" type="password" id="pc-new-pwd" placeholder="请输入新密码（6位以上）"></div>'
      + '<div class="form-group"><label class="form-label" style="font-size:15px">确认新密码</label><input class="form-input" style="padding:14px 16px;font-size:15px" type="password" id="pc-confirm-pwd" placeholder="再次输入新密码"></div>'
      + '<button class="btn btn-primary" onclick="PCPages.changePwd()" style="width:100%;padding:16px;font-size:16px">' + miIcon('lock_reset', 'mi-18') + ' 修改密码</button>'
      + '</div></div></div></div>';
  }

  function pcSaveProfile() {
    var nickname = document.getElementById('pc-profile-nickname').value.trim();
    var email    = document.getElementById('pc-profile-email').value.trim();
    var phone    = document.getElementById('pc-profile-phone').value.trim();
    showLoading();
    API.post('user/', { action: 'profile', nickname: nickname, email: email, phone: phone }).then(function(res) {
      hideLoading();
      showToast(res.msg);
      if (res.code === 200) {
        Storage.set('currentUser', res.data);
        // 更新顶部显示
        var nickEl = document.getElementById('pc-nickname');
        if (nickEl) nickEl.textContent = res.data.nickname || res.data.username;
        var avatarEl = document.getElementById('pc-avatar');
        if (avatarEl) avatarEl.textContent = getInitial(res.data.nickname || res.data.username);
        loadPCMine(document.getElementById('page-content'));
      }
    });
  }

  function pcChangePwd() {
    var oldPwd = document.getElementById('pc-old-pwd').value;
    var newPwd = document.getElementById('pc-new-pwd').value;
    var confirmPwd = document.getElementById('pc-confirm-pwd').value;
    if (!oldPwd || !newPwd) { showToast('请填写完整'); return; }
    if (newPwd.length < 6) { showToast('新密码至少6位'); return; }
    if (newPwd !== confirmPwd) { showToast('两次密码不一致'); return; }
    API.post('user/', { action: 'password', old_password: oldPwd, new_password: newPwd }).then(function(res) {
      showToast(res.msg);
    });
  }

  // ==================== 辅助函数 ====================
  function hasRoute(routers, path) {
    return routers.some(function(r) { return r.router_path === path; });
  }

  // ==================== 导出 ====================
  var exports = {
    init: init,
    loadHome: loadHome,
    loadUser: loadPCUser,
    loadRole: loadPCRole,
    loadRouter: loadPCRouter,
    loadMine: loadPCMine,
    addUser: pcAddUser,
    editUser: pcEditUser,
    deleteUser: pcDeleteUser,
    addRole: pcAddRole,
    editRole: pcEditRole,
    deleteRole: pcDeleteRole,
    addRouter: pcAddRouter,
    editRouter: pcEditRouter,
    deleteRouter: pcDeleteRouter,
    changePwd: pcChangePwd,
    saveProfile: pcSaveProfile,
    saveUser: saveUser,
    saveRole: saveRole,
    saveRouter: saveRouter
  };
  Object.defineProperty(exports, 'userPage', {
    get: function () { return _userPage; },
    set: function (v) { _userPage = v; },
    enumerable: true
  });
  return exports;
})();

window._userRouters = [];
