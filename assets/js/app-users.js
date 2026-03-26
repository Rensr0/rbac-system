/**
 * app-users.js v3.2 - 手机端用户管理模块
 * 从 app.js 拆分出来
 * v3.2: 内联样式迁移到 components.css
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

  var _userPage = 1;
  var _userTotalPages = 1;
  var _userKeyword = '';
  var _scrollCtrl = null;

  function renderUserCard(u) {
    var current = Storage.get('currentUser') || {};
    var isSuper = current.is_super == 1;
    var isSelf = current.id === u.id;
    var editBtn = '';
    if (isSuper) {
      editBtn = '<button class="app-btn app-btn-sm app-btn-outline btn-sm-outline" onclick="AppUsers.edit(' + u.id + ')">' + mi('edit', 'mi-14') + ' 编辑</button>';
    } else if (isSelf) {
      editBtn = '<button class="app-btn app-btn-sm app-btn-outline btn-sm-outline" onclick="AppRouter.navigate(\'mine\')">' + mi('edit', 'mi-14') + ' 编辑</button>';
    }
    return '<div class="user-card-app" data-id="' + u.id + '">'
      + '<div class="user-avatar-app">' + getInitial(u.nickname || u.username) + '</div>'
      + '<div class="user-info-app">'
      + '<div class="user-name-app">' + escapeHtml(u.nickname || u.username) + (u.is_super ? '<span class="badge badge-warning fs-10 ml-4">超级</span>' : '') + '</div>'
      + '<div class="user-meta-app">@' + escapeHtml(u.username) + ' · ' + ((u.roles || []).map(function (r) { return r.role_name; }).join(', ') || '无角色') + '</div>'
      + '</div>'
      + '<div class="user-actions-app">'
      + editBtn
      + '</div></div>';
  }

  function loadPage() {
    var content = document.getElementById('page-user');
    if (!content) return;

    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;
    _userPage = 1;
    _userTotalPages = 1;
    _userKeyword = '';

    appShowLoading();
    SharedOps.user.search('', 1, 20, function (res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }

      var data = res.data || {};
      var list = data.list || [];
      var total = data.total || 0;
      _userTotalPages = Math.ceil(total / 20) || 1;

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-search">'
        + '<span class="search-icon">' + mi('search', 'mi-18') + '</span>'
        + '<input type="text" placeholder="搜索用户名或昵称" id="user-search" onkeyup="if(event.key===\'Enter\')AppUsers.search()">'
        + '</div>'
        + '<div id="user-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('inbox', 'mi-xl') + '</div><p>暂无用户数据</p></div>' : '')
        + list.map(renderUserCard).join('')
        + '</div>'
        + (isSuper ? '<div class="p-16-0"><button class="app-btn app-btn-primary" onclick="AppUsers.showAdd()">' + mi('add', 'mi-18') + ' 添加用户</button></div>' : '')
        + '</div>';

      if (_userTotalPages > 1) {
        var listEl = document.getElementById('user-list');
        _scrollCtrl = SharedUtils.setupInfiniteScroll(listEl, function (done) {
          _userPage++;
          SharedOps.user.search(_userKeyword, _userPage, 20, function (r) {
            if (r.code !== 200) { done(false); return; }
            var items = (r.data || {}).list || [];
            if (items.length === 0) { done(false); return; }
            var html = items.map(renderUserCard).join('');
            var sentinel = listEl.querySelector('.scroll-sentinel');
            var tmp = document.createElement('div');
            tmp.innerHTML = html;
            while (tmp.firstChild) {
              listEl.insertBefore(tmp.firstChild, sentinel);
            }
            done(_userPage < _userTotalPages);
          });
        });
      }
    });
  }

  function searchUsers() {
    var kw = document.getElementById('user-search') ? document.getElementById('user-search').value : '';
    _userKeyword = kw;
    appShowLoading();
    SharedOps.user.search(kw, 1, 20, function (res) {
      appHideLoading();
      if (res.code !== 200) return;
      var data = res.data || {};
      var list = data.list || [];
      var total = data.total || 0;
      var container = document.getElementById('user-list');
      if (container) {
        var oldSentinel = container.querySelector('.scroll-sentinel');
        if (oldSentinel) oldSentinel.remove();

        container.innerHTML = list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">' + mi('search_off', 'mi-xl') + '</div><p>未找到用户</p></div>'
          : list.map(renderUserCard).join('');

        var totalPages = Math.ceil(total / 20) || 1;
        if (totalPages > 1) {
          _userPage = 1;
          SharedUtils.setupInfiniteScroll(container, function (done) {
            _userPage++;
            SharedOps.user.search(kw, _userPage, 20, function (r) {
              if (r.code !== 200) { done(false); return; }
              var items = (r.data || {}).list || [];
              if (items.length === 0) { done(false); return; }
              var html = items.map(renderUserCard).join('');
              var sentinel = container.querySelector('.scroll-sentinel');
              var tmp = document.createElement('div');
              tmp.innerHTML = html;
              while (tmp.firstChild) {
                container.insertBefore(tmp.firstChild, sentinel);
              }
              done(_userPage < totalPages);
            });
          });
        }
      }
    });
  }

  function showAddUserSheet() {
    SharedOps.role.list(100, function(res) {
      var roles = (res.data || {}).list || [];
      createActionSheet(
        '<div class="sheet-handle"></div>'
        + '<div class="sheet-title">添加用户</div>'
        + '<div class="modal-body">'
        + '<div class="app-form"><div class="app-form-item"><div class="form-label">账号</div><input class="form-input" id="app-add-username" placeholder="字母数字下划线"></div>'
        + '<div class="app-form-item"><div class="form-label">密码</div><input class="form-input" type="password" id="app-add-password" placeholder="默认123456"></div>'
        + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="app-add-nickname" placeholder="选填"></div>'
        + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" id="app-add-email" placeholder="选填"></div>'
        + '<div class="app-form-item"><div class="form-label">手机</div><input class="form-input" id="app-add-phone" placeholder="选填"></div>'
        + '<div class="app-form-item"><div class="form-label">分配角色</div>'
        + roles.map(function(r) {
          return '<label class="perm-item-row"><input type="checkbox" value="' + r.id + '" class="app-add-role-cb"><span>' + escapeHtml(r.role_name) + '</span></label>';
        }).join('')
        + '</div></div>'
        + '<button class="app-btn app-btn-primary" onclick="AppUsers.submitAdd()">确认添加</button>'
        + '</div>'
        + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
      );
    });
  }

  function submitAddUser() {
    var username = document.getElementById('app-add-username').value.trim();
    var password = document.getElementById('app-add-password').value.trim() || '123456';
    var nickname = document.getElementById('app-add-nickname').value.trim();
    var email = document.getElementById('app-add-email').value.trim();
    var phone = document.getElementById('app-add-phone').value.trim();
    var roleIds = Array.from(document.querySelectorAll('.app-add-role-cb:checked')).map(function(cb) { return parseInt(cb.value); });

    if (!username) { appToast('请输入账号'); return; }

    appShowLoading();
    SharedOps.user.add({ username: username, password: password, nickname: nickname, email: email, phone: phone, role_ids: roleIds }, function(res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        closeActionSheet();
        loadPage();
      }
    });
  }

  function editUserApp(userId) {
    SharedOps.user.detail(userId, function(res) {
      if (res.code !== 200) { appToast(res.msg); return; }
      var u = res.data;
      SharedOps.role.list(100, function(roleRes) {
        var roles = (roleRes.data || {}).list || [];
        var currentUser = Storage.get('currentUser') || {};
        var isSuper = currentUser.is_super == 1;
        var isSelf = currentUser.id === u.id;
        var pwdField = (isSuper && !isSelf) ? '<div class="app-form-item"><div class="form-label">新密码</div><input class="form-input" type="password" id="app-edit-password" placeholder="留空则不修改"></div>' : '';
        createActionSheet(
          '<div class="sheet-handle"></div>'
          + '<div class="sheet-title">编辑用户</div>'
          + '<div class="modal-body">'
          + pwdField + '<div class="app-form"><div class="app-form-item"><div class="form-label">账号</div><input class="form-input" id="app-edit-username" value="' + escapeHtml(u.username) + '" disabled></div>'
          + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="app-edit-nickname" value="' + escapeHtml(u.nickname) + '"></div>'
          + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" id="app-edit-email" value="' + escapeHtml(u.email || '') + '"></div>'
          + '<div class="app-form-item"><div class="form-label">手机</div><input class="form-input" id="app-edit-phone" value="' + escapeHtml(u.phone || '') + '"></div>'
          + '<div class="app-form-item"><div class="form-label">状态</div><select class="form-input" id="app-edit-status"><option value="1" ' + (u.status == 1 ? 'selected' : '') + '>正常</option><option value="0" ' + (u.status == 0 ? 'selected' : '') + '>禁用</option></select></div>'
          + '<div class="app-form-item"><div class="form-label">分配角色</div>'
          + roles.map(function(r) {
            var checked = (u.role_ids || []).indexOf(r.id) !== -1 ? 'checked' : '';
            return '<label class="perm-item-row"><input type="checkbox" value="' + r.id + '" class="app-edit-role-cb" ' + checked + '><span>' + escapeHtml(r.role_name) + '</span></label>';
          }).join('')
          + '</div></div>'
          + '<button class="app-btn app-btn-primary" onclick="AppUsers.submitEdit(' + userId + ')">保存修改</button>'
          + '</div>'
          + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
        );
      });
    });
  }

  function submitEditUser(userId) {
    var nickname = document.getElementById('app-edit-nickname').value.trim();
    var password = document.getElementById('app-edit-password') ? document.getElementById('app-edit-password').value.trim() : '';
    var email = document.getElementById('app-edit-email').value.trim();
    var phone = document.getElementById('app-edit-phone').value.trim();
    var roleIds = Array.from(document.querySelectorAll('.app-edit-role-cb:checked')).map(function(cb) { return parseInt(cb.value); });

    var status = document.getElementById('app-edit-status') ? document.getElementById('app-edit-status').value : undefined;
    // 编辑用户：如果有输入密码则包含在更新数据中
    var updateData = { nickname: nickname, email: email, phone: phone, status: status };
    if (password !== '') { updateData.password = password; }
    appShowLoading();
    SharedOps.user.update(userId, updateData, function(updateRes) {
      if (updateRes.code !== 200) { appHideLoading(); appToast(updateRes.msg || '更新失败'); return; }
      var current = Storage.get('currentUser');
      if (current && current.id === userId && updateRes.data) {
        Storage.set('currentUser', updateRes.data);
      }
      SharedOps.user.updateRoles(userId, roleIds, function(res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) {
          closeActionSheet();
          loadPage();
        }
      });
    });
  }

  function deleteUserApp(userId) {
    confirmDialog('删除用户', '确定要删除此用户吗？此操作不可恢复。').then(function(ok) {
      if (!ok) return;
      appShowLoading();
      SharedOps.user.delete(userId, function(res) {
        appHideLoading();
        appToast(res.msg);
        if (res.code === 200) loadPage();
      });
    });
  }

  window.AppUsers = {
    load: loadPage,
    search: searchUsers,
    showAdd: showAddUserSheet,
    submitAdd: submitAddUser,
    edit: editUserApp,
    submitEdit: submitEditUser,
    delete: deleteUserApp
  };

  if (window.registerPage) {
    window.registerPage('user', loadPage);
  }
})();
