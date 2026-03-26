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
    var perms = rp ? rp.perms : [];
    var hasView = perms.indexOf('view') !== -1;
    var hasEdit = perms.indexOf('edit') !== -1;
    var hasDelete = perms.indexOf('delete') !== -1;
    var checked = perms.length > 0;
    return '<label class="app-router-perm-item" data-router-id="' + r.id + '" data-router-name="' + escapeHtml(r.router_name) + '">'
      + '<div class="perm-item-row">'
      + '<input type="checkbox" value="' + r.id + '" class="' + prefix + '-router-cb" ' + (checked ? 'checked' : '') + '>'
      + '<span class="perm-label">' + escapeHtml(r.router_name) + '</span>'
      + '</div>'
      + '<div class="perm-levels p-0-0-8-24">'
      + '<label class="perm-level"><input type="checkbox" value="view" class="' + prefix + '-perm-cb-' + r.id + '" ' + (hasView ? 'checked' : '') + '> 查看</label>'
      + '<label class="perm-level"><input type="checkbox" value="edit" class="' + prefix + '-perm-cb-' + r.id + '" ' + (hasEdit ? 'checked' : '') + '> 编辑</label>'
      + '<label class="perm-level"><input type="checkbox" value="delete" class="' + prefix + '-perm-cb-' + r.id + '" ' + (hasDelete ? 'checked' : '') + '> 删除</label>'
      + '</div>'
      + '</label>';
  }

  function renderRouterPermItemPC(r, rolePerms) {
    var rp = rolePerms ? rolePerms.find(function(p) { return p.router_id === r.id; }) : null;
    var perms = rp ? rp.perms : [];
    var hasView = perms.indexOf('view') !== -1;
    var hasEdit = perms.indexOf('edit') !== -1;
    var hasDelete = perms.indexOf('delete') !== -1;
    return '<div class="tree-item">'
      + '<label class="perm-item-row flex-1">'
      + '<input type="checkbox" value="' + r.id + '" class="pc-router-cb" onchange="SharedUtils.toggleRoutePerms(this, \'pc\')" ' + (rp ? 'checked' : '') + '>'
      + '<span class="perm-label">' + escapeHtml(r.router_name) + '</span>'
      + '</label>'
      + '<div class="perm-levels ml-8">'
      + '<label class="perm-level"><input type="checkbox" value="view" class="pc-perm-cb-' + r.id + '" onchange="SharedUtils.onPermLevelChange(this, \'pc\')" ' + (hasView ? 'checked' : '') + '> 查看</label>'
      + '<label class="perm-level"><input type="checkbox" value="edit" class="pc-perm-cb-' + r.id + '" onchange="SharedUtils.onPermLevelChange(this, \'pc\')" ' + (hasEdit ? 'checked' : '') + '> 编辑</label>'
      + '<label class="perm-level"><input type="checkbox" value="delete" class="pc-perm-cb-' + r.id + '" onchange="SharedUtils.onPermLevelChange(this, \'pc\')" ' + (hasDelete ? 'checked' : '') + '> 删除</label>'
      + '</div>'
      + '</div>';
  }

  // ==================== 无限滚动（移动端复用） ====================
  function setupInfiniteScroll(container, loadMore) {
    var sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    sentinel.innerHTML = '<div class="scroll-loading">' + mi('refresh', 'mi-16 spin') + ' 加载中...</div>';
    container.appendChild(sentinel);

    var loading = false;
    var hasMore = true;

    function onIntersect(entries) {
      if (entries[0].isIntersecting && !loading && hasMore) {
        loading = true;
        sentinel.querySelector('.scroll-loading').style.display = 'flex';
        loadMore(function (more) {
          hasMore = more;
          loading = false;
          sentinel.querySelector('.scroll-loading').style.display = more ? 'flex' : 'none';
          if (!more) sentinel.querySelector('.scroll-loading').textContent = '已加载全部';
        });
      }
    }

    var observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(onIntersect, { rootMargin: '200px' });
      observer.observe(sentinel);
    } else {
      var scrollEl = container.closest('.app-page') || document.querySelector('.app-content');
      if (scrollEl) {
        function onScroll() {
          if (loading || !hasMore) return;
          var rect = scrollEl.getBoundingClientRect();
          if (rect.bottom - window.innerHeight < 300) {
            loading = true;
            loadMore(function (more) {
              hasMore = more;
              loading = false;
              sentinel.querySelector('.scroll-loading').style.display = more ? 'flex' : 'none';
              if (!more) sentinel.querySelector('.scroll-loading').textContent = '已加载全部';
            });
          }
        }
        scrollEl.addEventListener('scroll', onScroll);
      }
    }

    return {
      destroy: function () {
        if (observer) observer.disconnect();
        sentinel.remove();
      }
    };
  }

  // ==================== 操作类型映射（日志页面复用） ====================
  var actionMap = {
    'login': '登录', 'logout': '退出', 'register': '注册',
    'forgot': '找回密码', 'forgot_password': '找回密码',
    'user_create': '创建用户', 'user_update': '更新用户', 'user_delete': '删除用户',
    'user_assign_role': '分配角色', 'profile_update': '更新资料', 'password_change': '修改密码',
    'role_create': '创建角色', 'role_update': '更新角色', 'role_delete': '删除角色',
    'role_assign_router': '分配路由权限',
    'router_create': '创建路由', 'router_update': '更新路由', 'router_delete': '删除路由',
    'settings_update': '更新设置'
  };

  // ==================== 密码修改验证（个人中心复用） ====================
  function validatePasswordChange(oldPwdId, newPwdId, confirmPwdId, toastFn) {
    var oldPwd = document.getElementById(oldPwdId).value.trim();
    var newPwd = document.getElementById(newPwdId).value.trim();
    var confirmPwd = document.getElementById(confirmPwdId).value.trim();
    if (!oldPwd) { toastFn('请输入旧密码'); return null; }
    if (!newPwd || newPwd.length < 6) { toastFn('新密码至少6位'); return null; }
    if (newPwd !== confirmPwd) { toastFn('两次密码不一致'); return null; }
    return { oldPwd: oldPwd, newPwd: newPwd };
  }

  // ==================== CSV 行解析 ====================
  function parseCSVLine(line) {
    var result = [], current = '', inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
          else { inQuotes = false; }
        } else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { result.push(current); current = ''; }
        else { current += ch; }
      }
    }
    result.push(current);
    return result;
  }

  return {
    collectRouterPerms: collectRouterPerms,
    toggleRoutePerms: toggleRoutePerms,
    onPermLevelChange: onPermLevelChange,
    filterRouterList: filterRouterList,
    filterRoleList: filterRoleList,
    renderRouterPermItem: renderRouterPermItem,
    renderRouterPermItemPC: renderRouterPermItemPC,
    setupInfiniteScroll: setupInfiniteScroll,
    actionMap: actionMap,
    validatePasswordChange: validatePasswordChange,
    parseCSVLine: parseCSVLine
  };
})();
