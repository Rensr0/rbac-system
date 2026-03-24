/**
 * pc-pages.js v3.0 - PC 端页面渲染逻辑
 * 业务操作通过 SharedOps 共享
 */
var PCPages = (function () {
  var currentUser = null;
  var userRouters = [];
  var _userPage = 1;

  function init(user, routers) {
    currentUser = user;
    userRouters = routers;
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
        + '<div class="stat-card"><div class="stat-icon">' + mi('group', 'mi-lg') + '</div><div class="stat-value">' + (uR.data && uR.data.total || 0) + '</div><div class="stat-label">系统用户</div></div>'
        + '<div class="stat-card"><div class="stat-icon">' + mi('shield', 'mi-lg') + '</div><div class="stat-value">' + (rR.data && rR.data.total || 0) + '</div><div class="stat-label">角色数量</div></div>'
        + '<div class="stat-card"><div class="stat-icon">' + mi('route', 'mi-lg') + '</div><div class="stat-value">' + ((rtR.data || []).length) + '</div><div class="stat-label">路由权限</div></div>'
        + '<div class="stat-card"><div class="stat-icon">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-value" style="color:var(--success)">正常</div><div class="stat-label">系统状态</div></div>'
        + '</div>'
        + '<div class="card"><div class="card-header">欢迎回来，' + escapeHtml(user.nickname || user.username) + '</div>'
        + '<div class="card-body">'
        + '<p style="color:var(--text-secondary)">RBAC 权限管理系统 v3.0 运行正常。通过左侧菜单管理用户、角色和路由权限。</p>'
        + '<div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">'
        + (hasRoute(routers, 'user') ? '<button class="btn btn-primary" onclick="pcNavigate(\'user\')">' + mi('group', 'mi-18') + ' 管理用户</button>' : '')
        + (hasRoute(routers, 'role') ? '<button class="btn btn-outline" onclick="pcNavigate(\'role\')">' + mi('shield', 'mi-18') + ' 配置角色</button>' : '')
        + (hasRoute(routers, 'router') ? '<button class="btn btn-outline" onclick="pcNavigate(\'router\')">' + mi('route', 'mi-18') + ' 路由权限</button>' : '')
        + '</div></div></div>'
        + '<div class="card" style="margin-top:24px"><div class="card-header">数据概览</div><div class="card-body"><div id="stats-chart" style="height:300px"></div></div></div>';

      if (window.ApexCharts) {
        var options = {
          series: [{
            name: '用户数',
            data: [(uR.data && uR.data.total || 0)]
          }, {
            name: '角色数',
            data: [(rR.data && rR.data.total || 0)]
          }, {
            name: '路由数',
            data: [(rtR.data || []).length]
          }],
          chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: false }
          },
          plotOptions: {
            bar: {
              borderRadius: 8,
              columnWidth: '50%'
            }
          },
          dataLabels: { enabled: false },
          xaxis: {
            categories: ['系统数据'],
            axisBorder: { show: false },
            axisTicks: { show: false }
          },
          yaxis: {
            labels: { style: { colors: 'var(--text-secondary)' } }
          },
          colors: ['var(--primary)', 'var(--success)', 'var(--warning)'],
          legend: {
            position: 'top',
            horizontalAlign: 'right'
          },
          tooltip: {
            theme: 'light'
          }
        };
        var chart = new ApexCharts(document.querySelector('#stats-chart'), options);
        chart.render();
      }
    });
  }

  // ==================== 用户管理 ====================
  function loadPCUser(c, kw) {
    kw = kw || (document.getElementById('pc-user-search') ? document.getElementById('pc-user-search').value : '') || '';
    SharedOps.user.search(kw, _userPage, 10, function(res) {
      if (res.code !== 200) { showToast(res.msg); return; }
      var list = (res.data || {}).list || [];
      var total = (res.data || {}).total || 0;
      var pages = Math.ceil(total / 10) || 1;

      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>用户管理</h2><div class="subtitle">共 ' + total + ' 个用户</div></div>'
        + '<button class="btn btn-primary" onclick="PCPages.addUser()">' + mi('add', 'mi-18') + ' 新增用户</button>'
        + '</div>'
        + '<div class="search-bar">'
        + '<input class="form-input" id="pc-user-search" placeholder="搜索用户名/昵称" value="' + escapeHtml(kw) + '" onkeyup="if(event.key===\'Enter\'){PCPages.userPage=1;PCPages.loadUser(document.getElementById(\'page-content\'))}">'
        + '<button class="btn btn-outline" onclick="PCPages.userPage=1;PCPages.loadUser(document.getElementById(\'page-content\'))">' + mi('search', 'mi-18') + ' 搜索</button>'
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
            + '<button class="btn btn-sm btn-outline" onclick="PCPages.editUser(' + u.id + ')">' + mi('edit', 'mi-14') + ' 编辑</button>'
            + (!u.is_super ? '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteUser(' + u.id + ')">' + mi('delete', 'mi-14') + ' 删除</button>' : '')
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
    SharedOps.role.list(100, function(res) {
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
    SharedOps.user.detail(id, function(res) {
      if (res.code !== 200) { showToast(res.msg); return; }
      var u = res.data;
      SharedOps.role.list(100, function(roleRes) {
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
      SharedOps.user.update(parseInt(id), { nickname: nickname, email: email, phone: phone }, function(updateRes) {
        if (updateRes.code !== 200) { showToast(updateRes.msg || '更新用户失败'); return; }
        // 如果编辑的是当前登录用户，同步更新 localStorage 和顶栏
        var current = Storage.get('currentUser');
        if (current && current.id === parseInt(id) && updateRes.data) {
          Storage.set('currentUser', updateRes.data);
          var nickEl = document.getElementById('pc-nickname');
          if (nickEl) nickEl.textContent = updateRes.data.nickname || updateRes.data.username;
          var avatarEl = document.getElementById('pc-avatar');
          if (avatarEl) avatarEl.textContent = getInitial(updateRes.data.nickname || updateRes.data.username);
        }
        SharedOps.user.updateRoles(parseInt(id), roleIds, function(res) {
          showToast(res.msg);
          if (res.code === 200) { closeModal('modal-user'); loadPCUser(document.getElementById('page-content')); }
        });
      });
    } else {
      SharedOps.user.add({ username: username, password: password || '123456', nickname: nickname, email: email, phone: phone, role_ids: roleIds }, function(res) {
        showToast(res.msg);
        if (res.code === 200) { closeModal('modal-user'); loadPCUser(document.getElementById('page-content')); }
      });
    }
  }

  function pcDeleteUser(id) {
    confirmDialog('删除用户', '确定要删除此用户吗？此操作不可恢复。').then(function(ok) {
      if (!ok) return;
      SharedOps.user.delete(id, function(res) {
        showToast(res.msg);
        if (res.code === 200) loadPCUser(document.getElementById('page-content'));
      });
    });
  }

  // ==================== 角色管理 ====================
  function loadPCRole(c) {
    SharedOps.role.list(100, function(res) {
      var list = (res.data || {}).list || [];
      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>角色管理</h2><div class="subtitle">共 ' + list.length + ' 个角色</div></div>'
        + '<button class="btn btn-primary" onclick="PCPages.addRole()">' + mi('add', 'mi-18') + ' 新增角色</button>'
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
            + '<button class="btn btn-sm btn-outline" onclick="PCPages.editRole(' + r.id + ')">' + mi('edit', 'mi-14') + ' 编辑</button>'
            + (r.id !== 1 ? '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteRole(' + r.id + ')">' + mi('delete', 'mi-14') + ' 删除</button>' : '')
            + '</div></td></tr>';
        }).join('')
        + '</tbody></table></div></div>';
    });
  }

  function pcAddRole() {
    SharedOps.router.list(function(res) {
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
    Promise.all([
      new Promise(function(resolve) { SharedOps.role.list(100, resolve); }),
      new Promise(function(resolve) { SharedOps.router.list(resolve); })
    ]).then(function(results) {
      var roleRes = results[0], routerRes = results[1];
      var role = (roleRes.data && roleRes.data.list || []).find(function(r) { return r.id === id; });
      var routers = routerRes.data || [];
      if (!role) { showToast('角色不存在'); return; }
      // 兼容两种数据格式：router_ids (数组) 或 routers (对象数组)
      var roleRouterIds = role.router_ids || (role.routers || []).map(function(r) { return r.id; });
      document.getElementById('modal-role-title').textContent = '编辑角色';
      document.getElementById('form-role-id').value = role.id;
      var nEl = document.getElementById('form-role-name'); nEl.value = role.role_name; nEl.disabled = (id === 1);
      document.getElementById('form-role-remark').value = role.remark || '';
      document.getElementById('form-role-routers').innerHTML = routers.map(function(r) {
        return '<div class="tree-item"><input type="checkbox" value="' + r.id + '" class="role-router-cb" ' + (roleRouterIds.indexOf(r.id) !== -1 ? 'checked' : '') + '><span>' + renderIcon(r.icon) + ' ' + escapeHtml(r.router_name) + '</span></div>';
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
      SharedOps.role.update(parseInt(id), { role_name: roleName, remark: remark }, function(updateRes) {
        if (updateRes.code !== 200) { showToast(updateRes.msg || '更新角色失败'); return; }
        SharedOps.role.updateRouters(parseInt(id), routerIds, function(res) {
          showToast(res.msg);
          if (res.code === 200) { closeModal('modal-role'); loadPCRole(document.getElementById('page-content')); }
        });
      });
    } else {
      SharedOps.role.add({ role_name: roleName, remark: remark, router_ids: routerIds }, function(res) {
        showToast(res.msg);
        if (res.code === 200) { closeModal('modal-role'); loadPCRole(document.getElementById('page-content')); }
      });
    }
  }

  function pcDeleteRole(id) {
    confirmDialog('删除角色', '确定要删除此角色？关联的用户权限将被清除。').then(function(ok) {
      if (!ok) return;
      SharedOps.role.delete(id, function(res) {
        showToast(res.msg);
        if (res.code === 200) loadPCRole(document.getElementById('page-content'));
      });
    });
  }

  // ==================== 路由管理 ====================
  function loadPCRouter(c) {
    SharedOps.router.list(function(res) {
      var list = res.data || [];
      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>路由管理</h2><div class="subtitle">共 ' + list.length + ' 条路由</div></div>'
        + '<button class="btn btn-primary" onclick="PCPages.addRouter()">' + mi('add', 'mi-18') + ' 新增路由</button>'
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
            + '<button class="btn btn-sm btn-outline" onclick="PCPages.editRouter(' + r.id + ')">' + mi('edit', 'mi-14') + ' 编辑</button>'
            + '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteRouter(' + r.id + ')">' + mi('delete', 'mi-14') + ' 删除</button>'
            + '</div></td></tr>';
        }).join('')
        + '</tbody></table></div></div>';
    });
  }

  function pcAddRouter() {
    var iconSelect = document.getElementById('form-router-icon');
    if (iconSelect) {
      iconSelect.innerHTML = iconSelectHtml();
    }
    document.getElementById('modal-router-title').textContent = '新增路由';
    document.getElementById('form-router-id').value = '';
    document.getElementById('form-router-name').value = '';
    document.getElementById('form-router-path').value = '';
    document.getElementById('form-router-sort').value = '0';
    var statusEl = document.getElementById('form-router-status');
    if (statusEl) statusEl.value = '1';
    openModal('modal-router');
  }

  function pcEditRouter(id) {
    SharedOps.router.list(function(res) {
      var r = (res.data || []).find(function(x) { return x.id === id; });
      if (!r) { showToast('路由不存在'); return; }
      
      var iconSelect = document.getElementById('form-router-icon');
      if (iconSelect) {
        iconSelect.innerHTML = iconSelectHtml(r.icon);
      }
      
      document.getElementById('modal-router-title').textContent = '编辑路由';
      document.getElementById('form-router-id').value = r.id;
      document.getElementById('form-router-name').value = r.router_name;
      document.getElementById('form-router-path').value = r.router_path;
      document.getElementById('form-router-sort').value = r.sort;
      var statusEl = document.getElementById('form-router-status');
      if (statusEl) statusEl.value = r.status;
      openModal('modal-router');
    });
  }

  function saveRouter() {
    var id = document.getElementById('form-router-id').value;
    var routerName = document.getElementById('form-router-name').value.trim();
    var routerPath = document.getElementById('form-router-path').value.trim();
    var icon = document.getElementById('form-router-icon').value.trim();
    var sort = parseInt(document.getElementById('form-router-sort').value) || 0;
    var statusEl = document.getElementById('form-router-status');
    var status = statusEl ? statusEl.value : 1;
    if (!routerName || !routerPath) { showToast('名称和路径不能为空'); return; }
    if (id) {
      SharedOps.router.update(parseInt(id), { router_name: routerName, router_path: routerPath, icon: icon, sort: sort, status: status }, function(res) {
        showToast(res.msg);
        if (res.code === 200) { closeModal('modal-router'); loadPCRouter(document.getElementById('page-content')); }
      });
    } else {
      SharedOps.router.add({ router_name: routerName, router_path: routerPath, icon: icon, sort: sort, status: status }, function(res) {
        showToast(res.msg);
        if (res.code === 200) { closeModal('modal-router'); loadPCRouter(document.getElementById('page-content')); }
      });
    }
  }

  function pcDeleteRouter(id) {
    confirmDialog('删除路由', '确定要删除此路由？').then(function(ok) {
      if (!ok) return;
      SharedOps.router.delete(id, function(res) {
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
      + '<div style="max-width:1000px;margin:0 auto">'
      + '<div class="card" style="margin-bottom:24px;overflow:hidden">'
      + '<div style="background:linear-gradient(135deg,var(--primary),#6C63FF);padding:40px 32px;color:#fff;position:relative">'
      + '<div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:rgba(255,255,255,0.1);border-radius:50%"></div>'
      + '<div style="position:absolute;bottom:-30px;right:60px;width:100px;height:100px;background:rgba(255,255,255,0.08);border-radius:50%"></div>'
      + '<div style="display:flex;align-items:center;gap:24px;position:relative">'
      + '<div style="width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:600;flex-shrink:0;backdrop-filter:blur(10px);border:3px solid rgba(255,255,255,0.3)">' + getInitial(user.nickname || user.username) + '</div>'
      + '<div>'
      + '<h3 style="margin:0 0 8px;font-size:26px;font-weight:700">' + escapeHtml(user.nickname || user.username) + '</h3>'
      + '<p style="margin:0;font-size:14px;opacity:0.9">' + (user.is_super ? '<span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:12px">超级管理员</span>' : '<span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:12px">普通用户</span>') + '</p>'
      + '<p style="margin:8px 0 0;font-size:13px;opacity:0.75">ID: ' + user.id + ' · 注册于 ' + (user.create_time ? formatDate(user.create_time).split(' ')[0] : '未知') + '</p>'
      + '</div></div></div>'
      + '<div style="padding:32px">'
      + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px">'
      + '<div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:12px">'
      + '<div style="font-size:24px;font-weight:700;color:var(--primary);margin-bottom:4px">' + mi('badge', 'mi-lg') + '</div>'
      + '<div style="font-size:12px;color:var(--text-secondary)">账号</div>'
      + '<div style="font-size:14px;font-weight:500;margin-top:4px">' + escapeHtml(user.username) + '</div>'
      + '</div>'
      + '<div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:12px">'
      + '<div style="font-size:24px;font-weight:700;color:var(--success);margin-bottom:4px">' + mi('email', 'mi-lg') + '</div>'
      + '<div style="font-size:12px;color:var(--text-secondary)">邮箱</div>'
      + '<div style="font-size:14px;font-weight:500;margin-top:4px">' + (user.email ? escapeHtml(user.email) : '未设置') + '</div>'
      + '</div>'
      + '<div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:12px">'
      + '<div style="font-size:24px;font-weight:700;color:var(--warning);margin-bottom:4px">' + mi('phone', 'mi-lg') + '</div>'
      + '<div style="font-size:12px;color:var(--text-secondary)">手机</div>'
      + '<div style="font-size:14px;font-weight:500;margin-top:4px">' + (user.phone ? escapeHtml(user.phone) : '未设置') + '</div>'
      + '</div>'
      + '<div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:12px">'
      + '<div style="font-size:24px;font-weight:700;color:var(--info);margin-bottom:4px">' + mi('calendar_today', 'mi-lg') + '</div>'
      + '<div style="font-size:12px;color:var(--text-secondary)">最后登录</div>'
      + '<div style="font-size:14px;font-weight:500;margin-top:4px">' + (user.last_login ? formatDate(user.last_login).split(' ')[0] : '首次') + '</div>'
      + '</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">'
      + '<div>'
      + '<h3 style="margin:0 0 20px;font-size:18px;display:flex;align-items:center;gap:8px">' + mi('edit_note') + ' 编辑资料</h3>'
      + '<div class="form-group"><label class="form-label">昵称</label><input class="form-input" id="pc-profile-nickname" value="' + escapeHtml(user.nickname || '') + '" placeholder="请输入昵称"></div>'
      + '<div class="form-group"><label class="form-label">邮箱</label><input class="form-input" type="email" id="pc-profile-email" value="' + escapeHtml(user.email || '') + '" placeholder="请输入邮箱"></div>'
      + '<div class="form-group"><label class="form-label">手机</label><input class="form-input" type="tel" id="pc-profile-phone" value="' + escapeHtml(user.phone || '') + '" placeholder="请输入手机号"></div>'
      + '<button class="btn btn-primary" onclick="PCPages.saveProfile()" style="width:100%">' + mi('save', 'mi-18') + ' 保存资料</button>'
      + '</div>'
      + '<div>'
      + '<h3 style="margin:0 0 20px;font-size:18px;display:flex;align-items:center;gap:8px">' + mi('lock') + ' 修改密码</h3>'
      + '<div class="form-group"><label class="form-label">原密码</label><input class="form-input" type="password" id="pc-old-pwd" placeholder="请输入原密码"></div>'
      + '<div class="form-group"><label class="form-label">新密码</label><input class="form-input" type="password" id="pc-new-pwd" placeholder="请输入新密码（6位以上）"></div>'
      + '<div class="form-group"><label class="form-label">确认新密码</label><input class="form-input" type="password" id="pc-confirm-pwd" placeholder="再次输入新密码"></div>'
      + '<button class="btn btn-primary" onclick="PCPages.changePwd()" style="width:100%">' + mi('lock_reset', 'mi-18') + ' 修改密码</button>'
      + '</div>'
      + '</div></div></div>';
  }

  function pcSaveProfile() {
    var nickname = document.getElementById('pc-profile-nickname').value.trim();
    var email    = document.getElementById('pc-profile-email').value.trim();
    var phone    = document.getElementById('pc-profile-phone').value.trim();
    showLoading();
    SharedOps.user.updateProfile({ nickname: nickname, email: email, phone: phone }, function(res) {
      hideLoading();
      showToast(res.msg);
      if (res.code === 200) {
        Storage.set('currentUser', res.data);
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
    SharedOps.user.changePassword(oldPwd, newPwd, function(res) {
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
