/**
 * pc-logs.js - PC 端操作日志
 * 从 pc-pages.js 拆分
 */
(function () {
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

  PCPages.loadLog = loadPCLog;

  Object.defineProperty(PCPages, 'logPage', {
    get: function () { return _logPage; },
    set: function (v) { _logPage = v; },
    enumerable: true
  });
})();
