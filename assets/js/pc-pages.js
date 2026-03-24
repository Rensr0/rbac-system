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
    var currentUser = Storage.get('currentUser') || {};
    var isSuper = currentUser.is_super == 1;
    var routers = window._userRouters || [];

    var promises = [API.get('router/')];
    if (isSuper) {
      promises.unshift(API.get('role/', { limit: 100 }));
      promises.unshift(API.get('user/', { limit: 1 }));
    }

    Promise.all(promises).then(function(results) {
      var uR = isSuper ? results[0] : { data: { total: 0 } };
      var rR = isSuper ? results[1] : { data: { total: 0 } };
      var rtR = isSuper ? results[2] : results[0];
      var routerCount = (rtR.data || []).length;

      if (isSuper) {
        c.innerHTML =
          '<div class="stats-grid">'
          + '<div class="stat-card"><div class="stat-icon">' + mi('group', 'mi-lg') + '</div><div class="stat-value">' + (uR.data && uR.data.total || 0) + '</div><div class="stat-label">系统用户</div></div>'
          + '<div class="stat-card"><div class="stat-icon">' + mi('shield', 'mi-lg') + '</div><div class="stat-value">' + (rR.data && rR.data.total || 0) + '</div><div class="stat-label">角色数量</div></div>'
          + '<div class="stat-card"><div class="stat-icon">' + mi('route', 'mi-lg') + '</div><div class="stat-value">' + routerCount + '</div><div class="stat-label">路由权限</div></div>'
          + '<div class="stat-card"><div class="stat-icon">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-value" style="color:var(--success)">正常</div><div class="stat-label">系统状态</div></div>'
          + '</div>'
          + '<div class="card"><div class="card-header">欢迎回来，' + escapeHtml(currentUser.nickname || currentUser.username) + '</div>'
          + '<div class="card-body">'
          + '<p style="color:var(--text-secondary)">RBAC 权限管理系统 v3.0 运行正常。当前系统概况如下：</p>'
          + '</div></div>'
          + '<div class="card" style="margin-top:24px"><div class="card-header">数据概览</div><div class="card-body"><div id="stats-chart" style="height:320px;display:flex;align-items:center;justify-content:center"></div></div></div>';

        if (window.ApexCharts) {
          var totalUsers = uR.data && uR.data.total || 0;
          var totalRoles = rR.data && rR.data.total || 0;
          var chartData = [totalUsers, totalRoles, routerCount];
          var chartLabels = ['系统用户', '角色数量', '路由权限'];
          var chartColors = ['var(--primary)', 'var(--success)', 'var(--warning)'];

          // 如果所有数据都为0，显示占位
          var hasData = chartData.some(function(v) { return v > 0; });

          var options = {
            series: hasData ? chartData : [1],
            chart: {
              type: 'donut',
              height: 320,
              toolbar: { show: false }
            },
            labels: hasData ? chartLabels : ['暂无数据'],
            colors: hasData ? chartColors : ['#E5E5EA'],
            plotOptions: {
              pie: {
                donut: {
                  size: '68%',
                  labels: {
                    show: true,
                    name: { show: true, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' },
                    value: { show: true, fontSize: '28px', fontWeight: 700, color: 'var(--primary)' },
                    total: {
                      show: true,
                      label: '总计',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      formatter: function (w) {
                        return w.globals.seriesTotals.reduce(function(a, b) { return a + b; }, 0);
                      }
                    }
                  }
                }
              }
            },
            dataLabels: { enabled: false },
            legend: {
              position: 'bottom',
              horizontalAlign: 'center',
              fontSize: '13px',
              fontWeight: 500,
              markers: { width: 10, height: 10, radius: 50 },
              itemMargin: { horizontal: 16, vertical: 8 }
            },
            stroke: { width: 0 },
            tooltip: {
              theme: 'light',
              y: { formatter: function(val) { return val; } }
            },
            states: {
              hover: { filter: { type: 'lighten', value: 0.1 } },
              active: { filter: { type: 'darken', value: 0.1 } }
            }
          };
          var chart = new ApexCharts(document.querySelector('#stats-chart'), options);
          chart.render();
        }
      } else {
        // 普通用户仪表盘 - 不暴露敏感统计信息
        c.innerHTML =
          '<div class="stats-grid">'
          + '<div class="stat-card"><div class="stat-icon">' + mi('route', 'mi-lg') + '</div><div class="stat-value">' + routerCount + '</div><div class="stat-label">可用功能</div></div>'
          + '<div class="stat-card"><div class="stat-icon">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-value" style="color:var(--success)">正常</div><div class="stat-label">系统状态</div></div>'
          + '</div>'
          + '<div class="card"><div class="card-header">欢迎回来，' + escapeHtml(currentUser.nickname || currentUser.username) + '</div>'
          + '<div class="card-body">'
          + '<p style="color:var(--text-secondary)">RBAC 权限管理系统 v3.0 运行正常。您可以通过左侧菜单访问已授权的功能模块。</p>'
          + '</div></div>';
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

      var isSuper = (Storage.get('currentUser') || {}).is_super == 1;
      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>用户管理</h2><div class="subtitle">共 ' + total + ' 个用户</div></div>'
        + (isSuper ? '<div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="PCPages.addUser()">' + mi('add', 'mi-18') + ' 新增用户</button>'
        + '<button class="btn btn-outline" onclick="PCPages.exportUsers()">' + mi('download', 'mi-18') + ' 导出CSV</button>'
        + '<label class="btn btn-outline" style="margin:0;cursor:pointer">' + mi('upload', 'mi-18') + ' 导入CSV<input type="file" accept=".csv" id="csv-import-input" onchange="PCPages.importUsers(this)" style="display:none"></label></div>' : '')
        + '</div>'
        + '<div class="search-bar">'
        + '<input class="form-input" id="pc-user-search" placeholder="搜索用户名/昵称" value="' + escapeHtml(kw) + '" onkeyup="if(event.key===\'Enter\'){PCPages.userPage=1;PCPages.loadUser(document.getElementById(\'page-content\'))}">'
        + '<button class="btn btn-outline" onclick="PCPages.userPage=1;PCPages.loadUser(document.getElementById(\'page-content\'))">' + mi('search', 'mi-18') + ' 搜索</button>'
        + '</div>'
        + (isSuper ? '<div id="batch-bar" class="batch-bar hidden">'
        + '<span class="batch-count">已选择 <strong id="batch-selected-count">0</strong> 个用户</span>'
        + '<button class="btn btn-sm btn-success" onclick="PCPages.batchEnable()">' + mi('check_circle', 'mi-14') + ' 批量启用</button>'
        + '<button class="btn btn-sm btn-warning" onclick="PCPages.batchDisable()">' + mi('block', 'mi-14') + ' 批量禁用</button>'
        + '<button class="btn btn-sm btn-outline" onclick="PCPages.clearSelection()">取消选择</button>'
        + '</div>' : '')
        + '<div class="card"><div class="table-wrap"><table>'
        + '<thead><tr>' + (isSuper ? '<th style="width:40px"><input type="checkbox" id="user-check-all" onchange="PCPages.toggleAll(this.checked)"></th>' : '') + '<th>ID</th><th>账号</th><th>昵称</th><th>角色</th><th>状态</th><th>最后登录</th><th>操作</th></tr></thead>'
        + '<tbody>' + (list.length === 0 ? '<tr><td colspan="8" class="text-center text-secondary" style="padding:32px">暂无数据</td></tr>' : '')
        + list.map(function(u) {
          var isSuper = (Storage.get('currentUser') || {}).is_super == 1;
          var isSelf = (Storage.get('currentUser') || {}).id === u.id;
          var isSuperUser = u.is_super == 1;
          return '<tr>'
            + (isSuper ? '<td>' + (isSuperUser ? '' : '<input type="checkbox" class="user-cb" value="' + u.id + '" onchange="PCPages.updateBatchBar()">') + '</td>' : '')
            + '<td>' + u.id + '</td>'
            + '<td>' + escapeHtml(u.username) + (u.is_super ? '<span class="badge badge-warning">超级</span>' : '') + '</td>'
            + '<td>' + escapeHtml(u.nickname) + '</td>'
            + '<td>' + ((u.roles || []).map(function(r) { return '<span class="badge badge-info">' + escapeHtml(r.role_name) + '</span>'; }).join(' ') || '<span class="text-secondary">无</span>') + '</td>'
            + '<td>' + (u.status == 1 ? '<span class="badge badge-success">正常</span>' : '<span class="badge badge-danger">禁用</span>') + '</td>'
            + '<td class="text-sm text-secondary">' + (u.last_login ? formatDate(u.last_login) : '从未登录') + '</td>'
            + '<td><div class="action-btns">'
            + (isSuper ? '<button class="btn btn-sm btn-outline" onclick="PCPages.editUser(' + u.id + ')">' + mi('edit', 'mi-14') + ' 编辑</button>' : (isSelf ? '<button class="btn btn-sm btn-outline" onclick="pcNavigate(\'mine\')">' + mi('edit', 'mi-14') + ' 编辑</button>' : ''))
            + (isSuper && !u.is_super ? '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteUser(' + u.id + ')">' + mi('delete', 'mi-14') + ' 删除</button>' : '')
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

    function doSave() {
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

    if (id) {
      confirmDialog('保存修改', '确定要保存对该用户的修改吗？').then(function(ok) {
        if (!ok) return;
        doSave();
      });
    } else {
      doSave();
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

  // ==================== 批量操作 ====================
  function getSelectedUserIds() {
    return Array.from(document.querySelectorAll('.user-cb:checked')).map(function(cb) { return parseInt(cb.value); });
  }

  function updateBatchBar() {
    var ids = getSelectedUserIds();
    var bar = document.getElementById('batch-bar');
    var countEl = document.getElementById('batch-selected-count');
    if (bar) bar.classList.toggle('hidden', ids.length === 0);
    if (countEl) countEl.textContent = ids.length;
  }

  function toggleAll(checked) {
    document.querySelectorAll('.user-cb').forEach(function(cb) { cb.checked = checked; });
    updateBatchBar();
  }

  function clearSelection() {
    document.querySelectorAll('.user-cb').forEach(function(cb) { cb.checked = false; });
    var checkAll = document.getElementById('user-check-all');
    if (checkAll) checkAll.checked = false;
    updateBatchBar();
  }

  function batchEnable() {
    var ids = getSelectedUserIds();
    if (ids.length === 0) { showToast('请先选择用户'); return; }
    confirmDialog('批量启用', '确定要启用选中的 ' + ids.length + ' 个用户吗？').then(function(ok) {
      if (!ok) return;
      showLoading();
      SharedOps.user.batchUpdateStatus(ids, 1, function(res) {
        hideLoading();
        showToast(res.msg);
        if (res.code === 200) loadPCUser(document.getElementById('page-content'));
      });
    });
  }

  function batchDisable() {
    var ids = getSelectedUserIds();
    if (ids.length === 0) { showToast('请先选择用户'); return; }
    confirmDialog('批量禁用', '确定要禁用选中的 ' + ids.length + ' 个用户吗？').then(function(ok) {
      if (!ok) return;
      showLoading();
      SharedOps.user.batchUpdateStatus(ids, 0, function(res) {
        hideLoading();
        showToast(res.msg);
        if (res.code === 200) loadPCUser(document.getElementById('page-content'));
      });
    });
  }

  // ==================== CSV 导入导出 ====================
  function exportUsersCSV() {
    showLoading();
    // 获取所有用户（最多1000个）
    SharedOps.user.search('', 1, 1000, function(res) {
      hideLoading();
      if (res.code !== 200) { showToast(res.msg || '导出失败'); return; }
      var list = (res.data || {}).list || [];
      if (list.length === 0) { showToast('暂无用户数据'); return; }

      // BOM for Excel Chinese support
      var csv = '\uFEFF';
      csv += 'ID,用户名,昵称,邮箱,手机,状态,角色,创建时间\n';

      list.forEach(function(u) {
        var roles = (u.roles || []).map(function(r) { return r.role_name; }).join(';');
        csv += [
          u.id,
          '"' + (u.username || '').replace(/"/g, '""') + '"',
          '"' + (u.nickname || '').replace(/"/g, '""') + '"',
          '"' + (u.email || '').replace(/"/g, '""') + '"',
          '"' + (u.phone || '').replace(/"/g, '""') + '"',
          u.status == 1 ? '正常' : '禁用',
          '"' + roles.replace(/"/g, '""') + '"',
          '"' + (u.create_time || '') + '"'
        ].join(',') + '\n';
      });

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'users_' + new Date().toISOString().slice(0, 10) + '.csv';
      link.click();
      URL.revokeObjectURL(link.href);
      showToast('导出成功，共 ' + list.length + ' 个用户');
    });
  }

  function importUsersCSV(input) {
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];

    if (!file.name.endsWith('.csv')) {
      showToast('请选择CSV文件');
      input.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

      var lines = text.split('\n').filter(function(l) { return l.trim(); });
      if (lines.length <= 1) { showToast('CSV文件为空或只有表头'); return; }

      // Skip header, parse data rows
      var rows = [];
      for (var i = 1; i < lines.length; i++) {
        var cols = parseCSVLine(lines[i]);
        if (cols.length >= 2 && cols[1].trim()) {
          rows.push({
            username: cols[1].trim(),
            password: (cols[2] && cols[2].trim()) || '123456',
            nickname: (cols[3] && cols[3].trim()) || '',
            email: (cols[4] && cols[4].trim()) || '',
            phone: (cols[5] && cols[5].trim()) || ''
          });
        }
      }

      if (rows.length === 0) { showToast('没有有效的用户数据'); return; }

      confirmDialog('导入用户', '将导入 ' + rows.length + ' 个用户，确定继续？').then(function(ok) {
        if (!ok) { input.value = ''; return; }

        showLoading();
        // 使用批量导入接口
        API.post('user/', {
          action: 'batch_import',
          users: rows,
          default_password: '123456'
        }).then(function(res) {
          hideLoading();
          if (res.code === 200) {
            var d = res.data || {};
            var msg = '导入完成：成功 ' + d.success_count + ' 个';
            if (d.fail_count > 0) {
              msg += '，失败 ' + d.fail_count + ' 个';
              if (d.errors && d.errors.length > 0) {
                msg += '\n' + d.errors.join('\n');
              }
            }
            showToast(msg, 5000);
            if (d.success_count > 0) loadPCUser(document.getElementById('page-content'));
          } else {
            showToast(res.msg || '导入失败');
          }
          input.value = '';
        }).catch(function() {
          hideLoading();
          showToast('导入请求失败');
          input.value = '';
        });
      });
    };
    reader.readAsText(file);
  }

  function parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  // ==================== 角色管理 ====================
  function loadPCRole(c) {
    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;
    SharedOps.role.list(100, function(res) {
      var list = (res.data || {}).list || [];
      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>角色管理</h2><div class="subtitle">共 ' + list.length + ' 个角色</div></div>'
        + (isSuper ? '<button class="btn btn-primary" onclick="PCPages.addRole()">' + mi('add', 'mi-18') + ' 新增角色</button>' : '')
        + '</div>'
        + '<div class="card"><div class="table-wrap"><table>'
        + '<thead><tr><th>ID</th><th>角色名称</th><th>备注</th><th>用户数</th><th>权限列表</th>' + (isSuper ? '<th>操作</th>' : '') + '</tr></thead>'
        + '<tbody>' + list.map(function(r) {
          // 显示权限级别
          var permLabels = (r.routers || []).map(function(rt) {
            var perms = rt.perms || [];
            var permStr = '';
            if (perms.indexOf('edit') !== -1) permStr = '编';
            else if (perms.indexOf('delete') !== -1) permStr = '删';
            else permStr = '看';
            var cls = perms.indexOf('delete') !== -1 ? 'perm-badge-delete' : (perms.indexOf('edit') !== -1 ? 'perm-badge-edit' : 'perm-badge-view');
            return '<span class="badge badge-info" style="margin:1px">' + renderIcon(rt.icon) + ' ' + escapeHtml(rt.router_name) + '<span class="' + cls + '" style="font-size:10px;margin-left:2px">' + permStr + '</span></span>';
          }).join(' ');
          return '<tr>'
            + '<td>' + r.id + '</td><td><strong>' + escapeHtml(r.role_name) + '</strong></td>'
            + '<td class="text-secondary">' + escapeHtml(r.remark || '-') + '</td>'
            + '<td>' + (r.user_count || 0) + '</td>'
            + '<td>' + (permLabels || '<span class="text-secondary">无</span>') + '</td>'
            + (isSuper ? '<td><div class="action-btns">'
            + '<button class="btn btn-sm btn-outline" onclick="PCPages.editRole(' + r.id + ')">' + mi('edit', 'mi-14') + ' 编辑</button>'
            + (r.id !== 1 ? '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteRole(' + r.id + ')">' + mi('delete', 'mi-14') + ' 删除</button>' : '')
            + '</div></td>' : '') + '</tr>';
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
        return '<div class="tree-item perm-row" data-router-id="' + r.id + '">'
          + '<div class="perm-row-header">'
          + '<input type="checkbox" value="' + r.id + '" class="role-router-cb" onchange="PCPages.toggleRoutePerms(this)">'
          + '<span class="perm-router-name">' + renderIcon(r.icon) + ' ' + escapeHtml(r.router_name) + '</span>'
          + '</div>'
          + '<div class="perm-badges">'
          + '<label class="perm-badge perm-view"><input type="checkbox" value="view" class="perm-level-cb" data-level="view" disabled> 查看</label>'
          + '<label class="perm-badge perm-edit"><input type="checkbox" value="edit" class="perm-level-cb" data-level="edit" disabled> 编辑</label>'
          + '<label class="perm-badge perm-delete"><input type="checkbox" value="delete" class="perm-level-cb" data-level="delete" disabled> 删除</label>'
          + '</div></div>';
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

      // 构建 router_id → permissions 映射
      var permMap = {};
      (role.routers || []).forEach(function(rt) {
        var perms = rt.perms || [];
        if (perms.length === 0 && rt.permissions) {
          // 从 bitmask 还原
          var m = rt.permissions;
          perms = [];
          if (m & 1) perms.push('view');
          if (m & 2) perms.push('edit');
          if (m & 4) perms.push('delete');
        }
        permMap[rt.id] = perms;
      });

      document.getElementById('modal-role-title').textContent = '编辑角色';
      document.getElementById('form-role-id').value = role.id;
      var nEl = document.getElementById('form-role-name'); nEl.value = role.role_name; nEl.disabled = (id === 1);
      document.getElementById('form-role-remark').value = role.remark || '';
      document.getElementById('form-role-routers').innerHTML = routers.map(function(r) {
        var perms = permMap[r.id] || [];
        var checked = perms.length > 0;
        return '<div class="tree-item perm-row" data-router-id="' + r.id + '">'
          + '<div class="perm-row-header">'
          + '<input type="checkbox" value="' + r.id + '" class="role-router-cb" ' + (checked ? 'checked' : '') + ' onchange="PCPages.toggleRoutePerms(this)">'
          + '<span class="perm-router-name">' + renderIcon(r.icon) + ' ' + escapeHtml(r.router_name) + '</span>'
          + '</div>'
          + '<div class="perm-badges">'
          + '<label class="perm-badge perm-view"><input type="checkbox" value="view" class="perm-level-cb" data-level="view" ' + (perms.indexOf('view') !== -1 ? 'checked' : '') + ' onchange="PCPages.onPermLevelChange(this)" ' + (checked ? '' : 'disabled') + '> 查看</label>'
          + '<label class="perm-badge perm-edit"><input type="checkbox" value="edit" class="perm-level-cb" data-level="edit" ' + (perms.indexOf('edit') !== -1 ? 'checked' : '') + ' onchange="PCPages.onPermLevelChange(this)" ' + (checked ? '' : 'disabled') + '> 编辑</label>'
          + '<label class="perm-badge perm-delete"><input type="checkbox" value="delete" class="perm-level-cb" data-level="delete" ' + (perms.indexOf('delete') !== -1 ? 'checked' : '') + ' onchange="PCPages.onPermLevelChange(this)" ' + (checked ? '' : 'disabled') + '> 删除</label>'
          + '</div></div>';
      }).join('');
      openModal('modal-role');
    });
  }

  function saveRole() {
    var id = document.getElementById('form-role-id').value;
    var roleName = document.getElementById('form-role-name').value.trim();
    var remark = document.getElementById('form-role-remark').value.trim();
    if (!roleName) { showToast('请输入角色名称'); return; }

    // 收集路由权限数据
    var routerPerms = [];
    document.querySelectorAll('.role-router-cb:checked').forEach(function(cb) {
      var routerId = parseInt(cb.value);
      var row = cb.closest('.perm-row');
      var perms = [];
      if (row) {
        row.querySelectorAll('.perm-level-cb:checked').forEach(function(lcb) {
          perms.push(lcb.value);
        });
      }
      if (perms.length === 0) perms = ['view']; // 至少给予查看权限
      routerPerms.push({ router_id: routerId, perms: perms });
    });

    if (id) {
      SharedOps.role.update(parseInt(id), { role_name: roleName, remark: remark }, function(updateRes) {
        if (updateRes.code !== 200) { showToast(updateRes.msg || '更新角色失败'); return; }
        SharedOps.role.updateRouters(parseInt(id), routerPerms, function(res) {
          showToast(res.msg);
          if (res.code === 200) { closeModal('modal-role'); loadPCRole(document.getElementById('page-content')); }
        });
      });
    } else {
      SharedOps.role.add({ role_name: roleName, remark: remark, router_perms: routerPerms }, function(res) {
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
    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;
    SharedOps.router.list(function(res) {
      var list = res.data || [];
      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>路由管理</h2><div class="subtitle">共 ' + list.length + ' 条路由</div></div>'
        + (isSuper ? '<button class="btn btn-primary" onclick="PCPages.addRouter()">' + mi('add', 'mi-18') + ' 新增路由</button>' : '')
        + '</div>'
        + '<div class="card"><div class="table-wrap"><table>'
        + '<thead><tr><th>ID</th><th>图标</th><th>名称</th><th>路径</th><th>排序</th><th>状态</th><th>绑定角色</th>' + (isSuper ? '<th>操作</th>' : '') + '</tr></thead>'
        + '<tbody>' + list.map(function(r) {
          return '<tr>'
            + '<td>' + r.id + '</td><td style="font-size:20px">' + renderIcon(r.icon) + '</td>'
            + '<td><strong>' + escapeHtml(r.router_name) + '</strong></td>'
            + '<td><code>' + escapeHtml(r.router_path) + '</code></td>'
            + '<td>' + r.sort + '</td>'
            + '<td>' + (r.status == 1 ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>') + '</td>'
            + '<td>' + (r.role_count || 0) + ' 个角色</td>'
            + (isSuper ? '<td><div class="action-btns">'
            + '<button class="btn btn-sm btn-outline" onclick="PCPages.editRouter(' + r.id + ')">' + mi('edit', 'mi-14') + ' 编辑</button>'
            + '<button class="btn btn-sm btn-danger" onclick="PCPages.deleteRouter(' + r.id + ')">' + mi('delete', 'mi-14') + ' 删除</button>'
            + '</div></td>' : '') + '</tr>';
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
      + '<div class="form-group"><label class="form-label">新密码</label><input class="form-input" type="password" id="pc-new-pwd" placeholder="请输入新密码（6位以上）" oninput="updatePwdStrength(\'pc-new-pwd\')">' + pwdStrengthHtml('pc-new-pwd') + '</div>'
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
      if (res.code === 200) {
        document.getElementById('pc-old-pwd').value = '';
        document.getElementById('pc-new-pwd').value = '';
        document.getElementById('pc-confirm-pwd').value = '';
      }
    });
  }

  window.updatePwdStrength = function(inputId) {
    bindPwdStrength(inputId);
    var input = document.getElementById(inputId);
    if (input) input.dispatchEvent(new Event('input'));
  };

  // ==================== 权限级别联动 ====================
  function toggleRoutePerms(cb) {
    var row = cb.closest('.perm-row');
    if (!row) return;
    var levelCbs = row.querySelectorAll('.perm-level-cb');
    if (cb.checked) {
      levelCbs.forEach(function(lcb) { lcb.disabled = false; });
      // 默认勾选查看
      var viewCb = row.querySelector('.perm-level-cb[data-level="view"]');
      if (viewCb && !viewCb.checked) viewCb.checked = true;
    } else {
      levelCbs.forEach(function(lcb) { lcb.checked = false; lcb.disabled = true; });
    }
  }

  function onPermLevelChange(cb) {
    var row = cb.closest('.perm-row');
    if (!row) return;
    var viewCb   = row.querySelector('.perm-level-cb[data-level="view"]');
    var editCb   = row.querySelector('.perm-level-cb[data-level="edit"]');
    var deleteCb = row.querySelector('.perm-level-cb[data-level="delete"]');
    // 级联：编辑需要查看，删除需要编辑
    if (cb === deleteCb && deleteCb.checked) {
      editCb.checked = true;
      viewCb.checked = true;
    }
    if (cb === editCb && editCb.checked) {
      viewCb.checked = true;
    }
    if (cb === editCb && !editCb.checked) {
      deleteCb.checked = false;
    }
    if (cb === viewCb && !viewCb.checked) {
      editCb.checked = false;
      deleteCb.checked = false;
    }
  }

  // ==================== 搜索过滤 ====================
  function hasRoute(routers, path) {
    return routers.some(function(r) { return r.router_path === path; });
  }

  // ==================== 操作日志 ====================
  var _logPage = 1;

  function loadPCLog(c, kw, action) {
    kw = kw || (document.getElementById('pc-log-search') ? document.getElementById('pc-log-search').value : '') || '';
    action = action || (document.getElementById('pc-log-action') ? document.getElementById('pc-log-action').value : '') || '';
    SharedOps.log.search(kw, _logPage, 20, action, function(res) {
      if (res.code !== 200) { showToast(res.msg); return; }
      var list = (res.data || {}).list || [];
      var total = (res.data || {}).total || 0;
      var pages = Math.ceil(total / 20) || 1;
      var actions = (res.data || {}).actions || [];

      var actionMap = {
        'login': '登录', 'logout': '退出', 'register': '注册', 'user_create': '创建用户',
        'user_update': '更新用户', 'user_delete': '删除用户', 'user_assign_role': '分配角色',
        'profile_update': '更新资料', 'password_change': '修改密码',
        'role_create': '创建角色', 'role_update': '更新角色', 'role_delete': '删除角色',
        'router_create': '创建路由', 'router_update': '更新路由', 'router_delete': '删除路由',
        'forgot': '找回密码'
      };

      var actionOptions = actions.map(function(a) {
        return '<option value="' + a + '"' + (a === action ? ' selected' : '') + '>' + (actionMap[a] || a) + '</option>';
      }).join('');

      c.innerHTML =
        '<div class="page-header">'
        + '<div><h2>操作日志</h2><div class="subtitle">共 ' + total + ' 条记录</div></div>'
        + '</div>'
        + '<div class="search-bar" style="display:flex;gap:8px;flex-wrap:wrap">'
        + '<input class="form-input" id="pc-log-search" placeholder="搜索用户名/详情/IP" value="' + escapeHtml(kw) + '" onkeyup="if(event.key===\'Enter\'){PCPages.logPage=1;PCPages.loadLog(document.getElementById(\'page-content\'))}" style="flex:1;min-width:200px">'
        + '<select class="form-input" id="pc-log-action" onchange="PCPages.logPage=1;PCPages.loadLog(document.getElementById(\'page-content\'))" style="width:auto;min-width:120px"><option value="">全部操作</option>' + actionOptions + '</select>'
        + '<button class="btn btn-outline" onclick="PCPages.logPage=1;PCPages.loadLog(document.getElementById(\'page-content\'))">' + mi('search', 'mi-18') + ' 搜索</button>'
        + '</div>'
        + '<div class="card"><div class="table-wrap"><table>'
        + '<thead><tr><th>ID</th><th>操作人</th><th>操作类型</th><th>详情</th><th>IP</th><th>时间</th></tr></thead>'
        + '<tbody>' + (list.length === 0 ? '<tr><td colspan="6" class="text-center text-secondary" style="padding:32px">暂无日志</td></tr>' : '')
        + list.map(function(l) {
          return '<tr>'
            + '<td>' + l.id + '</td>'
            + '<td>' + escapeHtml(l.username) + '</td>'
            + '<td><span class="badge badge-info">' + (actionMap[l.action] || l.action) + '</span></td>'
            + '<td class="text-sm">' + escapeHtml(l.detail) + '</td>'
            + '<td class="text-sm text-secondary">' + escapeHtml(l.ip) + '</td>'
            + '<td class="text-sm text-secondary">' + formatDate(l.create_time) + '</td>'
            + '</tr>';
        }).join('')
        + '</tbody></table></div></div>'
        + '<div class="pagination">'
        + '<button ' + (_logPage <= 1 ? 'disabled' : '') + ' onclick="PCPages.logPage--;PCPages.loadLog(document.getElementById(\'page-content\'))">上一页</button>'
        + '<span class="text-sm text-secondary">第 ' + _logPage + '/' + pages + ' 页</span>'
        + '<button ' + (_logPage >= pages ? 'disabled' : '') + ' onclick="PCPages.logPage++;PCPages.loadLog(document.getElementById(\'page-content\'))">下一页</button>'
        + '</div>';
    });
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
    saveRouter: saveRouter,
    loadLog: loadPCLog,
    toggleRoutePerms: toggleRoutePerms,
    onPermLevelChange: onPermLevelChange,
    updateBatchBar: updateBatchBar,
    toggleAll: toggleAll,
    clearSelection: clearSelection,
    batchEnable: batchEnable,
    batchDisable: batchDisable,
    exportUsers: exportUsersCSV,
    importUsers: importUsersCSV
  };
  Object.defineProperty(exports, 'userPage', {
    get: function () { return _userPage; },
    set: function (v) { _userPage = v; },
    enumerable: true
  });
  Object.defineProperty(exports, 'logPage', {
    get: function () { return _logPage; },
    set: function (v) { _logPage = v; },
    enumerable: true
  });
  return exports;
})();

window._userRouters = [];
