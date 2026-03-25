/**
 * pc-users.js - PC 端用户管理 + 批量操作 + CSV 导入导出
 * 从 pc-pages.js 拆分
 */
(function () {
  function loadPCUser(c, kw) {
    kw = kw || (document.getElementById('pc-user-search') ? document.getElementById('pc-user-search').value : '') || '';
    SharedOps.user.search(kw, PCPages.userPage, 10, function(res) {
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
        + '<button class="btn btn-sm btn-danger" onclick="PCPages.batchDelete()">' + mi('delete', 'mi-14') + ' 批量删除</button>'
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
        + '<button ' + (PCPages.userPage <= 1 ? 'disabled' : '') + ' onclick="PCPages.userPage--;PCPages.loadUser(document.getElementById(\'page-content\'))">上一页</button>'
        + '<span class="text-sm text-secondary">第 ' + PCPages.userPage + '/' + pages + ' 页</span>'
        + '<button ' + (PCPages.userPage >= pages ? 'disabled' : '') + ' onclick="PCPages.userPage++;PCPages.loadUser(document.getElementById(\'page-content\'))">下一页</button>'
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

  // 批量操作
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

  function batchDelete() {
    var ids = getSelectedUserIds();
    if (ids.length === 0) { showToast('请先选择用户'); return; }
    confirmDialog('批量删除', '确定要删除选中的 ' + ids.length + ' 个用户吗？此操作不可恢复！').then(function(ok) {
      if (!ok) return;
      showLoading();
      var completed = 0;
      var failed = 0;
      function checkDone() {
        completed++;
        if (completed === ids.length) {
          hideLoading();
          showToast('删除完成，成功 ' + (completed - failed) + ' 个' + (failed > 0 ? '，失败 ' + failed + ' 个' : ''));
          loadPCUser(document.getElementById('page-content'));
        }
      }
      ids.forEach(function(id) {
        SharedOps.user.delete(id, function(res) {
          if (res.code !== 200) failed++;
          checkDone();
        });
      });
    });
  }

  // CSV 导入导出
  function exportUsersCSV() {
    showLoading();
    SharedOps.user.search('', 1, 1000, function(res) {
      hideLoading();
      if (res.code !== 200) { showToast(res.msg || '导出失败'); return; }
      var list = (res.data || {}).list || [];
      if (list.length === 0) { showToast('暂无用户数据'); return; }

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
    if (!file.name.endsWith('.csv')) { showToast('请选择CSV文件'); input.value = ''; return; }

    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      var lines = text.split('\n').filter(function(l) { return l.trim(); });
      if (lines.length <= 1) { showToast('CSV文件为空或只有表头'); return; }

      var rows = [];
      for (var i = 1; i < lines.length; i++) {
        var cols = SharedUtils.parseCSVLine(lines[i]);
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
        API.post('user/', { action: 'batch_import', users: rows, default_password: '123456' }).then(function(res) {
          hideLoading();
          if (res.code === 200) {
            var d = res.data || {};
            var msg = '导入完成：成功 ' + d.success_count + ' 个';
            if (d.fail_count > 0) { msg += '，失败 ' + d.fail_count + ' 个'; if (d.errors && d.errors.length > 0) msg += '\n' + d.errors.join('\n'); }
            showToast(msg, 5000);
            if (d.success_count > 0) loadPCUser(document.getElementById('page-content'));
          } else { showToast(res.msg || '导入失败'); }
          input.value = '';
        }).catch(function() { hideLoading(); showToast('导入请求失败'); input.value = ''; });
      });
    };
    reader.readAsText(file);
  }


  PCPages.loadUser = loadPCUser;
  PCPages.addUser = pcAddUser;
  PCPages.editUser = pcEditUser;
  PCPages.deleteUser = pcDeleteUser;
  PCPages.saveUser = saveUser;
  PCPages.updateBatchBar = updateBatchBar;
  PCPages.toggleAll = toggleAll;
  PCPages.clearSelection = clearSelection;
  PCPages.batchEnable = batchEnable;
  PCPages.batchDisable = batchDisable;
  PCPages.batchDelete = batchDelete;
  PCPages.exportUsers = exportUsersCSV;
  PCPages.importUsers = importUsersCSV;
})();
