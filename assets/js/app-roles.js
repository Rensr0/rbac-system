/**
 * app-roles.js v3.1 - 手机端角色管理模块
 * 从 app.js 拆分出来
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

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
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('inbox', 'mi-xl') + '</div><p>暂无角色数据</p></div>' : '')
        + list.map(function(r) {
          return '<div class="app-card" style="margin-bottom:12px">'
            + '<div class="app-card-header" style="display:flex;justify-content:space-between;align-items:center">'
            + '<h3>' + escapeHtml(r.role_name) + '</h3>'
            + (isSuper ? '<button class="app-btn app-btn-sm app-btn-outline" onclick="AppRoles.edit(' + r.id + ')" style="padding:0 10px;height:30px;font-size:12px">' + mi('edit', 'mi-14') + ' 编辑</button>' : '')
            + '</div>'
            + '<div style="font-size:13px;color:var(--text-secondary);padding:0 0 8px">' + escapeHtml(r.remark || '无备注') + '</div>'
            + '<div style="font-size:12px;color:var(--text-tertiary)">权限数: ' + (r.router_count || 0) + '</div>'
            + '</div>';
        }).join('')
        + '</div>'
        + (isSuper ? '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="AppRoles.showAdd()">' + mi('add', 'mi-18') + ' 添加角色</button></div>' : '')
        + '</div>';
    });
  }

  function showAddRoleSheet() {
    SharedOps.router.list(function(res) {
      if (res.code !== 200) { appToast(res.msg); return; }
      var routers = res.data || [];
      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">添加角色</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form"><div class="app-form-item"><div class="form-label">角色名称</div><input class="form-input" id="app-add-role-name" placeholder="如：普通管理员"></div>'
        + '<div class="app-form-item"><div class="form-label">备注</div><input class="form-input" id="app-add-role-remark" placeholder="选填"></div>'
        + '<div class="app-form-item"><div class="form-label">绑定权限</div>'
        + '<div class="app-search" style="margin-bottom:8px"><span class="search-icon">' + mi('search', 'mi-16') + '</span><input type="text" placeholder="搜索权限..." id="app-add-router-search" oninput="AppRoles.filterRouters(this.value)"></div>'
        + '<div id="app-add-router-list">'
        + routers.map(function(r) {
          return '<label class="app-router-perm-item" data-router-id="' + r.id + '" data-router-name="' + escapeHtml(r.router_name) + '">'
            + '<div style="display:flex;align-items:center;gap:8px;padding:8px 0">'
            + '<input type="checkbox" value="' + r.id + '" class="app-add-router-cb">'
            + '<span style="flex:1">' + escapeHtml(r.router_name) + '</span>'
            + '</div>'
            + '<div style="display:flex;gap:8px;padding:0 0 8px 24px">'
            + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="view" class="app-add-perm-cb-' + r.id + '"> 查看</label>'
            + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="edit" class="app-add-perm-cb-' + r.id + '"> 编辑</label>'
            + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="delete" class="app-add-perm-cb-' + r.id + '"> 删除</label>'
            + '</div>'
            + '</label>';
        }).join('')
        + '</div></div></div>'
        + '<button class="app-btn app-btn-primary" onclick="AppRoles.submitAdd()">确认添加</button>'
        + '</div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
      );
    });
  }

  function filterRouters(keyword) {
    SharedUtils.filterRouterList(keyword, 'app-add-router-list');
  }

  function toggleAppRoutePerms(cb) {
    SharedUtils.toggleRoutePerms(cb, 'app-add');
  }

  function onAppPermLevelChange(cb) {
    SharedUtils.onPermLevelChange(cb, 'app-add');
  }

  function collectAppRouterPerms() {
    return SharedUtils.collectRouterPerms('app-add');
  }

  function submitAddRole() {
    var roleName = document.getElementById('app-add-role-name').value.trim();
    var remark = document.getElementById('app-add-role-remark').value.trim();
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
    SharedOps.role.list(100, function(roleRes) {
      if (roleRes.code !== 200) { appToast(roleRes.msg); return; }
      var roles = (roleRes.data || {}).list || [];
      var role = roles.find(function(r) { return r.id === roleId; });
      if (!role) { appToast('角色不存在'); return; }

      SharedOps.router.list(function(res) {
        if (res.code !== 200) { appToast(res.msg); return; }
        var routers = res.data || [];
        var rolePerms = role.router_perms || [];

        createActionSheet(
          '<div class="sheet-handle"></div>'
          + '<div class="sheet-title">编辑角色</div>'
          + '<div style="padding:0 16px 16px">'
          + '<div class="app-form"><div class="app-form-item"><div class="form-label">角色名称</div><input class="form-input" id="app-edit-role-name" value="' + escapeHtml(role.role_name) + '"></div>'
          + '<div class="app-form-item"><div class="form-label">备注</div><input class="form-input" id="app-edit-role-remark" value="' + escapeHtml(role.remark || '') + '"></div>'
          + '<div class="app-form-item"><div class="form-label">绑定权限</div>'
          + '<div class="app-search" style="margin-bottom:8px"><span class="search-icon">' + mi('search', 'mi-16') + '</span><input type="text" placeholder="搜索权限..." id="app-edit-router-search" oninput="AppRoles.filterRouters(this.value)"></div>'
          + '<div id="app-edit-router-list">'
          + routers.map(function(r) {
            var rp = rolePerms.find(function(p) { return p.router_id === r.id; });
            return SharedUtils.renderRouterPermItem(r, 'app-edit', rolePerms);
          }).join('')
          + '</div></div></div>'
          + '<button class="app-btn app-btn-primary" onclick="AppRoles.submitEdit(' + roleId + ')">保存修改</button>'
          + '</div>'
          + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
        );
      });
    });
  }

  function submitEditRole(roleId) {
    var roleName = document.getElementById('app-edit-role-name').value.trim();
    var remark = document.getElementById('app-edit-role-remark').value.trim();
    var routerPerms = SharedUtils.collectRouterPerms('app-edit');

    appShowLoading();
    SharedOps.role.update(roleId, { role_name: roleName, remark: remark }, function(updateRes) {
      if (updateRes.code !== 200) { appHideLoading(); appToast(updateRes.msg || '更新失败'); return; }
      SharedOps.role.updateRouters(roleId, routerPerms, function(res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) {
          closeActionSheet();
          loadPage();
        }
      });
    });
  }

  function deleteRoleApp(roleId) {
    confirmDialog('删除角色', '确定要删除此角色吗？此操作不可恢复。').then(function(ok) {
      if (!ok) return;
      appShowLoading();
      SharedOps.role.delete(roleId, function(res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) loadPage();
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
    filterRouters: filterRouters,
    togglePerms: toggleAppRoutePerms,
    onPermChange: onAppPermLevelChange
  };

  if (window.registerPage) {
    window.registerPage('role', loadPage);
  }
})();
