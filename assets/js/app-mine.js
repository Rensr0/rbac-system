/**
 * app-mine.js v3.1 - 手机端个人中心模块
 * 从 app.js 拆分出来
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

  function loadPage() {
    var content = document.getElementById('page-mine');
    if (!content) return;

    var currentUser = Storage.get('currentUser') || {};

    appShowLoading();
    Promise.all([
      SharedOps.log.myLogs(1, 5),
      API.get('user/', { action: 'detail', id: currentUser.id })
    ]).then(function(results) {
      appHideLoading();
      var logRes = results[0];
      var userRes = results[1];

      var logs = (logRes.code === 200) ? ((logRes.data || {}).list || []) : [];
      var user = (userRes.code === 200) ? userRes.data : currentUser;

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-card" style="text-align:center;padding:24px 16px">'
        + '<div class="user-avatar-lg" style="width:80px;height:80px;font-size:32px;margin:0 auto 12px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center">'
        + getInitial(user.nickname || user.username)
        + '</div>'
        + '<h2 style="margin:0 0 4px">' + escapeHtml(user.nickname || user.username) + '</h2>'
        + '<div style="color:var(--text-secondary);font-size:13px">@' + escapeHtml(user.username) + (user.is_super ? ' · <span class="badge badge-warning">超级管理员</span>' : '') + '</div>'
        + '<div style="margin-top:16px;display:flex;gap:8px;justify-content:center">'
        + '<button class="app-btn app-btn-sm app-btn-outline" onclick="AppMine.showEditProfile()">' + mi('edit', 'mi-14') + ' 编辑资料</button>'
        + '<button class="app-btn app-btn-sm app-btn-outline" onclick="AppMine.showChangePwd()">' + mi('lock', 'mi-14') + ' 修改密码</button>'
        + '</div>'
        + '</div>'
        + '<div class="app-card">'
        + '<div class="app-card-header"><h3>' + mi('person', 'mi-18') + ' 个人信息</h3></div>'
        + '<div class="app-list">'
        + '<div class="app-list-item"><div class="item-label">邮箱</div><div class="item-value">' + escapeHtml(user.email || '未设置') + '</div></div>'
        + '<div class="app-list-item"><div class="item-label">手机</div><div class="item-value">' + escapeHtml(user.phone || '未设置') + '</div></div>'
        + '<div class="app-list-item"><div class="item-label">创建时间</div><div class="item-value">' + formatDate(user.create_time) + '</div></div>'
        + '<div class="app-list-item"><div class="item-label">最后登录</div><div class="item-value">' + formatDate(user.last_login) + '</div></div>'
        + '</div>'
        + '</div>'
        + '<div class="app-card">'
        + '<div class="app-card-header"><h3>' + mi('history', 'mi-18') + ' 最近登录日志</h3></div>'
        + '<div class="app-list">'
        + (logs.length === 0 ? '<div style="padding:16px;text-align:center;color:var(--text-secondary)">暂无登录记录</div>' : '')
        + logs.map(function(l) {
          return '<div class="app-list-item">'
            + '<div class="item-label">' + escapeHtml(l.action) + '</div>'
            + '<div class="item-value" style="font-size:12px;color:var(--text-secondary)">' + formatDate(l.create_time) + '</div>'
            + '</div>';
        }).join('')
        + '</div>'
        + '</div>'
        + '<div style="padding:16px 0"><button class="app-btn app-btn-danger" onclick="AppMine.logout()" style="width:100%">' + mi('logout', 'mi-18') + ' 退出登录</button></div>'
        + '</div>';
    });
  }

  function showEditProfileSheet() {
    var currentUser = Storage.get('currentUser') || {};
    createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">编辑资料</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form"><div class="app-form-item"><div class="form-label">头像</div>'
      + '<div style="display:flex;align-items:center;gap:12px">'
      + '<div class="user-avatar-lg" style="width:60px;height:60px;font-size:24px;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center" id="app-avatar-preview">'
      + getInitial(currentUser.nickname || currentUser.username)
      + '</div>'
      + '<label class="app-btn app-btn-sm app-btn-outline" style="margin:0;cursor:pointer">' + mi('upload', 'mi-14') + ' 上传头像<input type="file" accept="image/*" id="app-avatar-input" onchange="AppMine.uploadAvatar(this)" style="display:none"></label>'
      + '</div></div>'
      + '<div class="app-form-item"><div class="form-label">昵称</div><input class="form-input" id="app-edit-nickname" value="' + escapeHtml(currentUser.nickname || '') + '"></div>'
      + '<div class="app-form-item"><div class="form-label">邮箱</div><input class="form-input" id="app-edit-email" value="' + escapeHtml(currentUser.email || '') + '"></div>'
      + '<div class="app-form-item"><div class="form-label">手机</div><input class="form-input" id="app-edit-phone" value="' + escapeHtml(currentUser.phone || '') + '"></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" onclick="AppMine.submitProfile()">保存修改</button>'
      + '</div>'
      + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
    );
  }

  function submitProfile() {
    var nickname = document.getElementById('app-edit-nickname').value.trim();
    var email = document.getElementById('app-edit-email').value.trim();
    var phone = document.getElementById('app-edit-phone').value.trim();

    appShowLoading();
    SharedOps.user.updateProfile({ nickname: nickname, email: email, phone: phone }, function(res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        closeActionSheet();
        loadPage();
      }
    });
  }

  function uploadAppAvatar(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    if (!file.type.match(/image\/.*/)) { appToast('请选择图片文件'); return; }
    if (file.size > 2 * 1024 * 1024) { appToast('图片大小不能超过2MB'); return; }

    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var size = Math.min(img.width, img.height, 200);
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        var dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        var preview = document.getElementById('app-avatar-preview');
        if (preview) {
          preview.innerHTML = '<img src="' + dataUrl + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';
        }

        appShowLoading();
        API.post('user/', { action: 'avatar', avatar: dataUrl }).then(function(res) {
          appHideLoading();
          appToast(res.msg);
          if (res.code === 200) {
            var currentUser = Storage.get('currentUser') || {};
            if (res.data) {
              Storage.set('currentUser', res.data);
            }
          }
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function showChangePwdSheet() {
    createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">修改密码</div>'
      + '<div style="padding:0 16px 16px">'
      + '<div class="app-form"><div class="app-form-item"><div class="form-label">旧密码</div><input class="form-input" type="password" id="app-old-password" placeholder="请输入旧密码"></div>'
      + '<div class="app-form-item"><div class="form-label">新密码</div><input class="form-input" type="password" id="app-new-password" placeholder="至少6位" oninput="AppMine.checkPwdStrength(this.value)"></div>'
      + '<div id="app-pwd-strength"></div>'
      + '<div class="app-form-item"><div class="form-label">确认密码</div><input class="form-input" type="password" id="app-confirm-password" placeholder="再次输入新密码"></div>'
      + '</div>'
      + '<button class="app-btn app-btn-primary" onclick="AppMine.submitChangePwd()">确认修改</button>'
      + '</div>'
      + '<div class="sheet-cancel" onclick="closeActionSheet()">取消</div>'
    );
  }

  function checkPwdStrength(pwd) {
    var container = document.getElementById('app-pwd-strength');
    if (!container) return;
    var result = checkPwdStrengthCore(pwd);
    container.innerHTML = pwdStrengthHtml('app-new-password');
    bindPwdStrength('app-new-password');
  }

  function submitChangePwd() {
    var oldPwd = document.getElementById('app-old-password').value.trim();
    var newPwd = document.getElementById('app-new-password').value.trim();
    var confirmPwd = document.getElementById('app-confirm-password').value.trim();

    if (!oldPwd) { appToast('请输入旧密码'); return; }
    if (!newPwd || newPwd.length < 6) { appToast('新密码至少6位'); return; }
    if (newPwd !== confirmPwd) { appToast('两次密码不一致'); return; }

    appShowLoading();
    SharedOps.user.changePassword(oldPwd, newPwd, function(res) {
      appHideLoading();
      appToast(res.msg);
      if (res.code === 200) {
        closeActionSheet();
      }
    });
  }

  function logoutApp() {
    confirmDialog('退出登录', '确定要退出登录吗？').then(function(ok) {
      if (!ok) return;
      API.post('login/', { action: 'logout' }).then(function() {
        Storage.remove('currentUser');
        window.location.href = '../index.html';
      });
    });
  }

  window.AppMine = {
    load: loadPage,
    showEditProfile: showEditProfileSheet,
    submitProfile: submitProfile,
    uploadAvatar: uploadAppAvatar,
    showChangePwd: showChangePwdSheet,
    checkPwdStrength: checkPwdStrength,
    submitChangePwd: submitChangePwd,
    logout: logoutApp
  };

  if (window.registerPage) {
    window.registerPage('mine', loadPage);
  }
})();
