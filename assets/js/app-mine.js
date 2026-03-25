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

    var user = Storage.get('currentUser');
    if (!user) return;

    content.innerHTML =
      '<div class="app-page-content">'
      + '<div class="mine-header">'
      + '<div class="mine-avatar" onclick="document.getElementById(\'app-avatar-input\').click()">'
      + (user.avatar
        ? '<img src="' + escapeHtml(user.avatar) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">'
        : getInitial(user.nickname || user.username))
      + '<div class="mine-avatar-mask"><span class="material-icons" style="font-size:20px">photo_camera</span></div>'
      + '</div>'
      + '<input type="file" id="app-avatar-input" accept="image/*" style="display:none" onchange="AppMine.uploadAvatar(this)">'
      + '<div class="mine-name">' + escapeHtml(user.nickname || user.username) + '</div>'
      + '<div class="mine-role">' + (user.is_super ? '超级管理员' : '普通用户') + '</div>'
      + '</div>'
      + '<div class="app-list">'
      + '<div class="app-list-item"><div class="item-icon">' + mi('badge') + '</div><div class="item-content"><div class="item-title">账号</div><div class="item-desc">' + escapeHtml(user.username) + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">' + mi('email') + '</div><div class="item-content"><div class="item-title">邮箱</div><div class="item-desc">' + escapeHtml(user.email || '未设置') + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">' + mi('phone') + '</div><div class="item-content"><div class="item-title">手机</div><div class="item-desc">' + escapeHtml(user.phone || '未设置') + '</div></div></div>'
      + '<div class="app-list-item"><div class="item-icon">' + mi('calendar_today') + '</div><div class="item-content"><div class="item-title">注册时间</div><div class="item-desc">' + formatDate(user.create_time) + '</div></div></div>'
      + '</div>'
      + '<div class="app-list">'
      + '<div class="app-list-item" onclick="AppMine.showEditProfile()">'
      + '<div class="item-icon">' + mi('edit_note') + '</div><div class="item-content"><div class="item-title">编辑资料</div><div class="item-desc">修改昵称、邮箱、手机</div></div><div class="item-arrow">' + mi('chevron_right', 'mi-18') + '</div>'
      + '</div>'
      + '<div class="app-list-item" onclick="AppMine.showChangePwd()">'
      + '<div class="item-icon">' + mi('lock') + '</div><div class="item-content"><div class="item-title">修改密码</div></div><div class="item-arrow">' + mi('chevron_right', 'mi-18') + '</div>'
      + '</div></div>'
      + '<div class="app-card" style="margin-bottom:12px">'
      + '<div class="app-card-header"><h3>' + mi('history') + ' 登录记录</h3></div>'
      + '<div id="mine-login-logs"><div class="scroll-loading">' + mi('refresh', 'mi-16 spin') + ' 加载中...</div></div>'
      + '</div>'
      + '<div style="padding:24px 0"><button class="app-btn app-btn-danger" onclick="AppMine.logout()">' + mi('logout', 'mi-18') + ' 退出登录</button></div>'
      + '</div>';

    // 加载登录日志
    var logsContainer = document.getElementById('mine-login-logs');
    if (logsContainer) {
      SharedOps.log.myLogs(1, 10, function(res) {
        if (res.code !== 200) {
          logsContainer.innerHTML = '<div style="padding:12px 16px;font-size:13px;color:var(--text-tertiary)">加载失败</div>';
          return;
        }
        var list = (res.data || {}).list || [];
        if (list.length === 0) {
          logsContainer.innerHTML = '<div style="padding:12px 16px;font-size:13px;color:var(--text-tertiary)">暂无登录记录</div>';
          return;
        }
        var actionMap = { 'login': '登录', 'logout': '退出' };
        logsContainer.innerHTML = list.map(function(l) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:0.5px solid var(--border-light)">'
            + '<div>'
            + '<div style="font-size:13px;font-weight:500">' + (actionMap[l.action] || l.action) + '</div>'
            + '<div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">' + escapeHtml(l.ip) + '</div>'
            + '</div>'
            + '<div style="font-size:11px;color:var(--text-secondary)">' + formatDate(l.create_time) + '</div>'
            + '</div>';
        }).join('');
        if ((res.data || {}).total > 10) {
          logsContainer.innerHTML += '<div style="text-align:center;padding:8px"><span style="font-size:12px;color:var(--text-tertiary)">共 ' + (res.data || {}).total + ' 条记录</span></div>';
        }
      });
    }
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
