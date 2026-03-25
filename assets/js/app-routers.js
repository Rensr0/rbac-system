/**
 * app-routers.js v3.1 - 手机端路由管理模块
 * 从 app.js 拆分出来
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

  function loadPage() {
    var content = document.getElementById('page-router');
    if (!content) return;

    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;

    appShowLoading();
    SharedOps.router.list(function(res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }

      var list = res.data || [];
      content.innerHTML =
        '<div class="app-page-content">'
        + '<div id="router-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('route', 'mi-xl') + '</div><p>暂无路由数据</p></div>' : '')
        + list.map(function(r) {
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
            + (isSuper ? '<button class="app-btn app-btn-sm app-btn-outline" onclick="AppRouters.edit(' + r.id + ')" style="padding:0 10px;height:30px;font-size:12px">' + mi('edit', 'mi-14') + '</button>' : '')
            + '</div></div></div>';
        }).join('')
        + '</div>'
        + (isSuper ? '<div style="padding:16px 0"><button class="app-btn app-btn-primary" onclick="AppRouters.showAdd()">' + mi('add', 'mi-18') + ' 添加路由</button></div>' : '')
        + '</div>';
    });
  }

  function showAddRouterSheet() {
    createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">添加路由</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form"><div class="app-form-item"><div class="form-label">路由名称</div><input class="form-input" id="app-add-router-name" placeholder="如：用户管理"></div>'
      + '<div class="app-form-item"><div class="form-label">路由路径</div><input class="form-input" id="app-add-router-path" placeholder="如：user（字母数字短横线）"></div>'
      + '<div class="app-form-item"><div class="form-label">图标</div><div id="app-add-router-icon"></div></div>'
      + '<div class="app-form-item"><div class="form-label">排序</div><input class="form-input" type="number" id="app-add-router-sort" value="0" min="0"></div>'
      + '<div class="app-form-item"><div class="form-label">状态</div>'
      + '<select class="form-input" id="app-add-router-status"><option value="1">启用</option><option value="0">禁用</option></select>'
      + '</div></div>'
      + '<button class="app-btn app-btn-primary" onclick="AppRouters.submitAdd()">确认添加</button>'
      + '</div>'
      + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
    );

    setTimeout(function() {
      var iconWrap = document.getElementById('app-add-router-icon');
      if (iconWrap) {
        iconWrap.innerHTML = iconSelectHtml('', 'app-add-router-icon-input');
      }
    }, 50);
  }

  function submitAddRouter() {
    var routerName = document.getElementById('app-add-router-name').value.trim();
    var routerPath = document.getElementById('app-add-router-path').value.trim();
    var iconInput = document.getElementById('app-add-router-icon-input');
    var icon = iconInput ? iconInput.value : 'description';
    var sort = parseInt(document.getElementById('app-add-router-sort').value) || 0;
    var status = parseInt(document.getElementById('app-add-router-status').value) || 1;

    if (!routerName) { appToast('请输入路由名称'); return; }
    if (!routerPath) { appToast('请输入路由路径'); return; }

    appShowLoading();
    SharedOps.router.add({ router_name: routerName, router_path: routerPath, icon: icon, sort: sort, status: status }, function(res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        closeActionSheet();
        loadPage();
      }
    });
  }

  function editRouterApp(routerId) {
    SharedOps.router.list(function(res) {
      if (res.code !== 200) { appToast(res.msg); return; }
      var routers = res.data || [];
      var router = routers.find(function(r) { return r.id === routerId; });
      if (!router) { appToast('路由不存在'); return; }

      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">编辑路由</div>'
        + '<div style="padding:0 16px 16px">'
        + '<div class="app-form"><div class="app-form-item"><div class="form-label">路由名称</div><input class="form-input" id="app-edit-router-name" value="' + escapeHtml(router.router_name) + '"></div>'
        + '<div class="app-form-item"><div class="form-label">路由路径</div><input class="form-input" id="app-edit-router-path" value="' + escapeHtml(router.router_path) + '" disabled></div>'
        + '<div class="app-form-item"><div class="form-label">图标</div><div id="app-edit-router-icon"></div></div>'
        + '<div class="app-form-item"><div class="form-label">排序</div><input class="form-input" type="number" id="app-edit-router-sort" value="' + router.sort + '" min="0"></div>'
        + '<div class="app-form-item"><div class="form-label">状态</div>'
        + '<select class="form-input" id="app-edit-router-status"><option value="1" ' + (router.status == 1 ? 'selected' : '') + '>启用</option><option value="0" ' + (router.status == 0 ? 'selected' : '') + '>禁用</option></select>'
        + '</div></div>'
        + '<button class="app-btn app-btn-primary" onclick="AppRouters.submitEdit(' + routerId + ')">保存修改</button>'
        + '</div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
      );

      setTimeout(function() {
        var iconWrap = document.getElementById('app-edit-router-icon');
        if (iconWrap) {
          iconWrap.innerHTML = iconSelectHtml(router.icon || '', 'app-edit-router-icon-input');
        }
      }, 50);
    });
  }

  function submitEditRouter(routerId) {
    var routerName = document.getElementById('app-edit-router-name').value.trim();
    var iconInput = document.getElementById('app-edit-router-icon-input');
    var icon = iconInput ? iconInput.value : 'description';
    var sort = parseInt(document.getElementById('app-edit-router-sort').value) || 0;
    var status = parseInt(document.getElementById('app-edit-router-status').value) || 1;

    if (!routerName) { appToast('请输入路由名称'); return; }

    appShowLoading();
    SharedOps.router.update(routerId, { router_name: routerName, icon: icon, sort: sort, status: status }, function(res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        closeActionSheet();
        loadPage();
      }
    });
  }

  function deleteRouterApp(routerId) {
    confirmDialog('删除路由', '确定要删除此路由吗？此操作不可恢复。').then(function(ok) {
      if (!ok) return;
      appShowLoading();
      SharedOps.router.delete(routerId, function(res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) loadPage();
      });
    });
  }

  window.AppRouters = {
    load: loadPage,
    showAdd: showAddRouterSheet,
    submitAdd: submitAddRouter,
    edit: editRouterApp,
    submitEdit: submitEditRouter,
    delete: deleteRouterApp
  };

  if (window.registerPage) {
    window.registerPage('router', loadPage);
  }
})();
