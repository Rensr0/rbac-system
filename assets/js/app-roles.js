/**
 * app-roles.js v3.2 - 手机端角色管理模块
 * 从 app.js 拆分出来
 * v3.2: 内联样式迁移到 components.css
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

  function renderRoleItem(r, isSuper) {
    var routers = r.routers || [];
    return '<div class="app-card card-padding-sm">'
      + '<div class="item-header">'
      + '<div>'
      + '<div class="item-title-lg">' + escapeHtml(r.role_name) + '</div>'
      + '<div class="item-subtitle">' + escapeHtml(r.remark || '暂无备注') + ' · ' + (r.user_count || 0) + ' 个用户 · ' + routers.length + ' 个权限</div>'
      + '</div>'
      + (isSuper ? '<button class="app-btn app-btn-sm app-btn-outline btn-sm-outline-w12" onclick="AppRoles.edit(' + r.id + ')">' + mi('settings', 'mi-14') + ' 管理</button>' : '')
      + '</div>'
      + (routers.length > 0
        ? '<div class="flex-wrap gap-6 mt-10">'
          + routers.map(function (rt) {
            var perms = rt.perms || [];
            var permStr = '';
            if (perms.indexOf('delete') !== -1) permStr = '全';
            else if (perms.indexOf('edit') !== -1) permStr = '编';
            else permStr = '看';
            var cls = perms.indexOf('delete') !== -1 ? 'perm-badge-delete' : (perms.indexOf('edit') !== -1 ? 'perm-badge-edit' : 'perm-badge-view');
            return '<span class="badge badge-info">' + renderIcon(rt.icon) + ' ' + escapeHtml(rt.router_name) + '<span class="' + cls + ' fs-10 ml-2">' + permStr + '</span></span>';
          }).join('')
          + '</div>'
        : '')
      + '</div>';
  }

  function loadPage() {
    var content = document.getElementById('page-role');
    if (!content) return;

    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;

    appShowLoading();
    SharedOps.role.list(100, function(res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }

      var list = (res.data || {}).list || [];
      content.innerHTML =
        '<div class="app-page-content">'
        + '<div id="role-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('shield', 'mi-xl') + '</div><p>暂无角色数据</p></div>' : '')
        + list.map(function(r) { return renderRoleItem(r, isSuper); }).join('')
        + '</div>'
        + (isSuper ? '<div class="p-16-0"><button class="app-btn app-btn-primary" onclick="AppRoles.showAdd()">' + mi('add', 'mi-18') + ' 创建角色</button></div>' : '')
        + '</div>';
    });
  }

  function renderRouterPermSheetHtml(routers, permMap) {
    return routers.map(function (r) {
      var perms = permMap ? (permMap[r.id] || []) : [];
      var checked = perms.length > 0;
      return '<div class="role-perm-item" data-router-id="' + r.id + '">'
        + '<div class="role-perm-header"><span>' + renderIcon(r.icon) + ' ' + escapeHtml(r.router_name) + '</span>'
        + '<label class="switch"><input type="checkbox" class="role-router-cb-app" value="' + r.id + '" ' + (checked ? 'checked' : '') + ' onchange="AppRoles.toggleAppRoutePerms(this)"><span class="slider"></span></label></div>'
        + '<div class="role-perm-levels">'
        + '<label class="perm-lv"><input type="checkbox" value="view" class="perm-lv-cb" onchange="AppRoles.onAppPermLevelChange(this)" ' + (perms.indexOf('view') !== -1 ? 'checked' : '') + ' ' + (checked ? '' : 'disabled') + '> 看</label>'
        + '<label class="perm-lv"><input type="checkbox" value="edit" class="perm-lv-cb" onchange="AppRoles.onAppPermLevelChange(this)" ' + (perms.indexOf('edit') !== -1 ? 'checked' : '') + ' ' + (checked ? '' : 'disabled') + '> 编</label>'
        + '<label class="perm-lv"><input type="checkbox" value="delete" class="perm-lv-cb" onchange="AppRoles.onAppPermLevelChange(this)" ' + (perms.indexOf('delete') !== -1 ? 'checked' : '') + ' ' + (checked ? '' : 'disabled') + '> 删</label>'
        + '</div></div>';
    }).join('');
  }

  function showAddRoleSheet() {
    appShowLoading();
    SharedOps.router.list(function(res) {
      appHideLoading();
      var routers = res.code === 200 ? res.data || [] : [];
      var routerHtml = renderRouterPermSheetHtml(routers, null);

      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">创建角色</div>'
        + '<div class="modal-body-scroll">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">角色名称</div><input class="form-input" id="add-role-name" placeholder="请输入角色名称"></div>'
        + '<div class="app-form-item"><div class="form-label">备注</div><input class="form-input" id="add-role-remark" placeholder="选填"></div>'
        + '</div>'
        + '<div class="form-section-title">选择权限</div>'
        + '<div class="form-section-card">' + routerHtml + '</div>'
        + '</div>'
        + '<button class="app-btn app-btn-primary mt-12" onclick="AppRoles.submitAdd()">确认创建</button>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>',
        { maxHeight: '85vh' }
      );
    });
  }

  function toggleAppRoutePerms(cb) {
    var row = cb.closest('.role-perm-item');
    if (!row) return;
    var levels = row.querySelectorAll('.perm-lv-cb');
    if (cb.checked) {
      levels.forEach(function(l) { l.disabled = false; });
      var viewCb = row.querySelector('.perm-lv-cb[value="view"]');
      if (viewCb && !viewCb.checked) viewCb.checked = true;
    } else {
      levels.forEach(function(l) { l.checked = false; l.disabled = true; });
    }
  }

  function onAppPermLevelChange(cb) {
    var row = cb.closest('.role-perm-item');
    if (!row) return;
    var viewCb   = row.querySelector('.perm-lv-cb[value="view"]');
    var editCb   = row.querySelector('.perm-lv-cb[value="edit"]');
    var deleteCb = row.querySelector('.perm-lv-cb[value="delete"]');
    if (cb === deleteCb && deleteCb.checked) { editCb.checked = true; viewCb.checked = true; }
    if (cb === editCb && editCb.checked) { viewCb.checked = true; }
    if (cb === editCb && !editCb.checked) { deleteCb.checked = false; }
    if (cb === viewCb && !viewCb.checked) { editCb.checked = false; deleteCb.checked = false; }
  }

  function collectAppRouterPerms() {
    var routerPerms = [];
    document.querySelectorAll('.role-router-cb-app:checked').forEach(function(cb) {
      var routerId = parseInt(cb.value);
      var row = cb.closest('.role-perm-item');
      var perms = [];
      if (row) {
        row.querySelectorAll('.perm-lv-cb:checked').forEach(function(lcb) {
          perms.push(lcb.value);
        });
      }
      if (perms.length === 0) perms = ['view'];
      routerPerms.push({ router_id: routerId, perms: perms });
    });
    return routerPerms;
  }

  function submitAddRole() {
    var roleName = document.getElementById('add-role-name').value.trim();
    var remark = document.getElementById('add-role-remark').value.trim();
    var routerPerms = collectAppRouterPerms();
    if (!roleName) { appToast('请输入角色名称'); return; }
    appShowLoading();
    SharedOps.role.add({ role_name: roleName, remark: remark, router_perms: routerPerms }, function(res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        closeActionSheet();
        loadPage();
      }
    });
  }

  function editRoleApp(roleId) {
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

      // 构建 router_id → permissions 映射
      var permMap = {};
      (role.routers || []).forEach(function(rt) {
        var perms = rt.perms || [];
        if (perms.length === 0 && rt.permissions) {
          var m = rt.permissions;
          perms = [];
          if (m & 1) perms.push('view');
          if (m & 2) perms.push('edit');
          if (m & 4) perms.push('delete');
        }
        permMap[rt.id] = perms;
      });

      var routerHtml = renderRouterPermSheetHtml(routers, permMap);

      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">编辑角色</div>'
        + '<div class="modal-body-scroll">'
        + '<div class="app-form">'
        + '<div class="app-form-item"><div class="form-label">角色名称</div><input class="form-input" id="edit-role-name" value="' + escapeHtml(role.role_name) + '"></div>'
        + '<div class="app-form-item"><div class="form-label">备注</div><input class="form-input" id="edit-role-remark" value="' + escapeHtml(role.remark || '') + '"></div>'
        + '</div>'
        + '<div class="form-section-title">选择权限</div>'
        + '<div class="form-section-card">' + routerHtml + '</div>'
        + '</div>'
        + '<button class="app-btn app-btn-primary mt-12" onclick="AppRoles.submitEdit(' + roleId + ')">保存修改</button>'
        + '<button class="app-btn app-btn-danger mt-8" onclick="AppRoles.deleteRole(' + roleId + ')">删除角色</button>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>',
        { maxHeight: '85vh' }
      );
    });
  }

  function submitEditRole(roleId) {
    var roleName = document.getElementById('edit-role-name').value.trim();
    var remark = document.getElementById('edit-role-remark').value.trim();
    var routerPerms = collectAppRouterPerms();
    if (!roleName) { appToast('请输入角色名称'); return; }
    appShowLoading();
    SharedOps.role.update(roleId, { role_name: roleName, remark: remark }, function (updateRes) {
      if (updateRes.code !== 200) { appHideLoading(); appToast(updateRes.msg); return; }
      SharedOps.role.updateRouters(roleId, routerPerms, function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) { closeActionSheet(); loadPage(); }
      });
    });
  }

  function deleteRoleApp(roleId) {
    confirmDialog('删除角色', '确定要删除该角色吗？此操作不可恢复！').then(function (ok) {
      if (!ok) return;
      appShowLoading();
      SharedOps.role.delete(roleId, function (res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) {
          closeActionSheet();
          loadPage();
        }
      });
    });
  }

  window.AppRoles = {
    load: loadPage,
    showAdd: showAddRoleSheet,
    submitAdd: submitAddRole,
    edit: editRoleApp,
    submitEdit: submitEditRole,
    delete: deleteRoleApp,
    toggleAppRoutePerms: toggleAppRoutePerms,
    onAppPermLevelChange: onAppPermLevelChange
  };

  if (window.registerPage) {
    window.registerPage('role', loadPage);
  }
})();
