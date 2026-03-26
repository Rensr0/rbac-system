/**
 * pc-roles.js - PC 端角色管理
 * 从 pc-pages.js 拆分
 */
(function () {
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
          var permLabels = (r.routers || []).map(function(rt) {
            var perms = rt.perms || [];
            var permStr = '';
            if (perms.indexOf('delete') !== -1) permStr = '全';
            else if (perms.indexOf('edit') !== -1) permStr = '编';
            else permStr = '看';
            var cls = perms.indexOf('delete') !== -1 ? 'perm-badge-delete' : (perms.indexOf('edit') !== -1 ? 'perm-badge-edit' : 'perm-badge-view');
            return '<span class="badge badge-info m-1">' + renderIcon(rt.icon) + ' ' + escapeHtml(rt.router_name) + '<span class="' + cls + ' fs-10 ml-2">' + permStr + '</span></span>';
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
          + '<input type="checkbox" value="' + r.id + '" class="role-router-cb" onchange="SharedUtils.toggleRoutePerms(this, \'pc\')">'
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

      var rolePerms = [];
      (role.routers || []).forEach(function(rt) {
        var perms = rt.perms || [];
        if (perms.length === 0 && rt.permissions) {
          var m = rt.permissions;
          perms = [];
          if (m & 1) perms.push('view');
          if (m & 2) perms.push('edit');
          if (m & 4) perms.push('delete');
        }
        rolePerms.push({ router_id: rt.id, perms: perms });
      });

      document.getElementById('modal-role-title').textContent = '编辑角色';
      document.getElementById('form-role-id').value = role.id;
      var nEl = document.getElementById('form-role-name'); nEl.value = role.role_name; nEl.disabled = (id === 1);
      document.getElementById('form-role-remark').value = role.remark || '';
      document.getElementById('form-role-routers').innerHTML = routers.map(function(r) {
        return SharedUtils.renderRouterPermItemPC(r, rolePerms);
      }).join('');
      openModal('modal-role');
    });
  }

  function saveRole() {
    var id = document.getElementById('form-role-id').value;
    var roleName = document.getElementById('form-role-name').value.trim();
    var remark = document.getElementById('form-role-remark').value.trim();
    if (!roleName) { showToast('请输入角色名称'); return; }

    var routerPerms = [];
    document.querySelectorAll('.pc-router-cb:checked').forEach(function(cb) {
      var routerId = parseInt(cb.value);
      var perms = [];
      var row = cb.closest('.tree-item');
      if (row) {
        row.querySelectorAll('.perm-level-cb:checked').forEach(function(lcb) {
          perms.push(lcb.value);
        });
      }
      if (perms.length === 0) perms = ['view'];
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

  function toggleRoutePerms(cb) {
    SharedUtils.toggleRoutePerms(cb, 'pc');
  }

  function onPermLevelChange(cb) {
    SharedUtils.onPermLevelChange(cb, 'pc');
  }

  PCPages.loadRole = loadPCRole;
  PCPages.addRole = pcAddRole;
  PCPages.editRole = pcEditRole;
  PCPages.deleteRole = pcDeleteRole;
  PCPages.saveRole = saveRole;
  PCPages.toggleRoutePerms = toggleRoutePerms;
  PCPages.onPermLevelChange = onPermLevelChange;
})();
