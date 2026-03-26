/**
 * pc-routers.js - PC 端路由管理
 * 从 pc-pages.js 拆分
 */
(function () {
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
            + '<td>' + r.id + '</td><td class="fs-20">' + renderIcon(r.icon) + '</td>'
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
    var iconWrap = document.getElementById('form-router-icon-wrap');
    if (iconWrap) iconWrap.innerHTML = iconSelectHtml('', 'form-router-icon');
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
      var iconWrap = document.getElementById('form-router-icon-wrap');
      if (iconWrap) iconWrap.innerHTML = iconSelectHtml(r.icon, 'form-router-icon');
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

  PCPages.loadRouter = loadPCRouter;
  PCPages.addRouter = pcAddRouter;
  PCPages.editRouter = pcEditRouter;
  PCPages.deleteRouter = pcDeleteRouter;
  PCPages.saveRouter = saveRouter;
})();
