/**
 * shared-utils.js v3.1 - PC/移动端共享工具函数
 * 抽取共用的路由编辑、权限处理等逻辑
 */
var SharedUtils = (function () {
  'use strict';

  function collectRouterPerms(prefix) {
    var perms = [];
    var routerCbs = document.querySelectorAll('.' + prefix + '-router-cb:checked');
    routerCbs.forEach(function(cb) {
      var routerId = parseInt(cb.value);
      var permLevel = 0;
      var viewCb = document.querySelector('.' + prefix + '-perm-cb-' + routerId + '[value="view"]:checked');
      var editCb = document.querySelector('.' + prefix + '-perm-cb-' + routerId + '[value="edit"]:checked');
      var deleteCb = document.querySelector('.' + prefix + '-perm-cb-' + routerId + '[value="delete"]:checked');
      if (viewCb) permLevel += 1;
      if (editCb) permLevel += 2;
      if (deleteCb) permLevel += 4;
      if (permLevel === 0) permLevel = 1;
      perms.push({ router_id: routerId, perms: permLevel });
    });
    return perms;
  }

  function toggleRoutePerms(cb, prefix) {
    var routerId = cb.value;
    var permCbs = document.querySelectorAll('.' + prefix + '-perm-cb-' + routerId);
    permCbs.forEach(function(pcb) { pcb.checked = cb.checked; });
    if (prefix === 'pc') {
      var row = cb.closest('.tree-item');
      if (row) {
        var levelCbs = row.querySelectorAll('.perm-level-cb');
        levelCbs.forEach(function(lcb) { lcb.disabled = !cb.checked; });
        if (cb.checked) {
          var viewCb = row.querySelector('.perm-level-cb[data-level="view"]');
          if (viewCb && !viewCb.checked) viewCb.checked = true;
        }
      }
    }
  }

  function onPermLevelChange(cb, prefix) {
    var match = cb.className.match(new RegExp(prefix + '-perm-cb-(\\d+)'));
    if (!match) return;
    var routerId = match[1];
    var routerCb = document.querySelector('.' + prefix + '-router-cb[value="' + routerId + '"]');
    if (routerCb) routerCb.checked = true;

    if (prefix === 'pc') {
      var row = cb.closest('.tree-item');
      if (!row) return;
      var viewCb = row.querySelector('.perm-level-cb[data-level="view"]');
      var editCb = row.querySelector('.perm-level-cb[data-level="edit"]');
      var deleteCb = row.querySelector('.perm-level-cb[data-level="delete"]');
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
  }

  function filterRouterList(keyword, containerId) {
    keyword = (keyword || '').toLowerCase();
    var items = document.querySelectorAll('#' + containerId + ' .tree-item, #' + containerId + ' .app-router-perm-item');
    items.forEach(function(item) {
      var text = item.textContent.toLowerCase();
      item.style.display = keyword === '' || text.indexOf(keyword) !== -1 ? '' : 'none';
    });
  }

  function filterRoleList(keyword, containerId) {
    keyword = (keyword || '').toLowerCase();
    var items = document.querySelectorAll('#' + containerId + ' .tree-item');
    items.forEach(function(item) {
      var text = item.textContent.toLowerCase();
      item.style.display = keyword === '' || text.indexOf(keyword) !== -1 ? '' : 'none';
    });
  }

  function renderRouterPermItem(r, prefix, rolePerms) {
    var rp = rolePerms ? rolePerms.find(function(p) { return p.router_id === r.id; }) : null;
    var permLevel = rp ? rp.perms : 0;
    return '<label class="app-router-perm-item" data-router-id="' + r.id + '" data-router-name="' + escapeHtml(r.router_name) + '">'
      + '<div style="display:flex;align-items:center;gap:8px;padding:8px 0">'
      + '<input type="checkbox" value="' + r.id + '" class="' + prefix + '-router-cb" ' + (permLevel > 0 ? 'checked' : '') + '>'
      + '<span style="flex:1">' + escapeHtml(r.router_name) + '</span>'
      + '</div>'
      + '<div style="display:flex;gap:8px;padding:0 0 8px 24px">'
      + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="view" class="' + prefix + '-perm-cb-' + r.id + '" ' + (permLevel & 1 ? 'checked' : '') + '> 查看</label>'
      + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="edit" class="' + prefix + '-perm-cb-' + r.id + '" ' + (permLevel & 2 ? 'checked' : '') + '> 编辑</label>'
      + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="delete" class="' + prefix + '-perm-cb-' + r.id + '" ' + (permLevel & 4 ? 'checked' : '') + '> 删除</label>'
      + '</div>'
      + '</label>';
  }

  function renderRouterPermItemPC(r, rolePerms) {
    var rp = rolePerms ? rolePerms.find(function(p) { return p.router_id === r.id; }) : null;
    var permLevel = rp ? rp.perms : 0;
    return '<div class="tree-item">'
      + '<label style="display:flex;align-items:center;gap:8px;flex:1">'
      + '<input type="checkbox" value="' + r.id + '" class="pc-router-cb" onchange="SharedUtils.toggleRoutePerms(this, \'pc\')">'
      + '<span style="flex:1">' + escapeHtml(r.router_name) + '</span>'
      + '</label>'
      + '<div style="display:flex;gap:8px;margin-left:8px">'
      + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="view" class="pc-perm-cb-' + r.id + '" onchange="SharedUtils.onPermLevelChange(this, \'pc\')" ' + (permLevel & 1 ? 'checked' : '') + '> 查看</label>'
      + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="edit" class="pc-perm-cb-' + r.id + '" onchange="SharedUtils.onPermLevelChange(this, \'pc\')" ' + (permLevel & 2 ? 'checked' : '') + '> 编辑</label>'
      + '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" value="delete" class="pc-perm-cb-' + r.id + '" onchange="SharedUtils.onPermLevelChange(this, \'pc\')" ' + (permLevel & 4 ? 'checked' : '') + '> 删除</label>'
      + '</div>'
      + '</div>';
  }

  return {
    collectRouterPerms: collectRouterPerms,
    toggleRoutePerms: toggleRoutePerms,
    onPermLevelChange: onPermLevelChange,
    filterRouterList: filterRouterList,
    filterRoleList: filterRoleList,
    renderRouterPermItem: renderRouterPermItem,
    renderRouterPermItemPC: renderRouterPermItemPC
  };
})();
