/**
 * pc-mine.js - PC 端个人中心
 * 从 pc-pages.js 拆分（编辑资料 + 修改密码 + 头像上传）
 * v3.2: 内联样式迁移到 components.css
 */
(function () {
  function loadPCMine(c) {
    var user = Storage.get('currentUser') || {};
    c.innerHTML =
      '<div class="page-header"><h2>个人中心</h2></div>'
      + '<div style="max-width:1000px;margin:0 auto">'
      + '<div class="card mb-24" style="overflow:hidden">'
      + '<div class="mine-hero">'
      + '<div class="mine-hero-circle mine-hero-circle-1"></div>'
      + '<div class="mine-hero-circle mine-hero-circle-2"></div>'
      + '<div class="flex-center gap-24" style="position:relative">'
      + '<div class="avatar-wrap" onclick="document.getElementById(\'pc-avatar-input\').click()" title="点击更换头像">'
      + (user.avatar
        ? '<img src="' + escapeHtml(user.avatar) + '" class="mine-hero-avatar">'
        : '<div class="mine-hero-avatar-placeholder">' + getInitial(user.nickname || user.username) + '</div>')
      + '<div class="avatar-hover-mask"><span class="material-icons fs-24">photo_camera</span></div>'
      + '</div>'
      + '<input type="file" id="pc-avatar-input" accept="image/*" class="hidden" onchange="PCPages.uploadAvatar(this)">'
      + '<div>'
      + '<h3 class="mine-hero-name">' + escapeHtml(user.nickname || user.username) + '</h3>'
      + '<p class="mine-hero-role">' + (user.is_super ? '<span class="mine-role-badge">超级管理员</span>' : '<span class="mine-role-badge">普通用户</span>') + '</p>'
      + '<p class="mine-hero-meta">ID: ' + user.id + ' · 注册于 ' + (user.create_time ? formatDate(user.create_time).split(' ')[0] : '未知') + '</p>'
      + '</div></div></div>'
      + '<div class="p-32">'
      + '<div class="mine-info-grid">'
      + '<div class="mine-info-card">'
      + '<div class="mine-info-icon icon-primary">' + mi('badge', 'mi-lg') + '</div>'
      + '<div class="mine-info-label">账号</div>'
      + '<div class="mine-info-value">' + escapeHtml(user.username) + '</div>'
      + '</div>'
      + '<div class="mine-info-card">'
      + '<div class="mine-info-icon icon-success">' + mi('email', 'mi-lg') + '</div>'
      + '<div class="mine-info-label">邮箱</div>'
      + '<div class="mine-info-value">' + (user.email ? escapeHtml(user.email) : '未设置') + '</div>'
      + '</div>'
      + '<div class="mine-info-card">'
      + '<div class="mine-info-icon icon-warning">' + mi('phone', 'mi-lg') + '</div>'
      + '<div class="mine-info-label">手机</div>'
      + '<div class="mine-info-value">' + (user.phone ? escapeHtml(user.phone) : '未设置') + '</div>'
      + '</div>'
      + '<div class="mine-info-card">'
      + '<div class="mine-info-icon icon-info">' + mi('calendar_today', 'mi-lg') + '</div>'
      + '<div class="mine-info-label">最后登录</div>'
      + '<div class="mine-info-value">' + (user.last_login ? formatDate(user.last_login).split(' ')[0] : '首次') + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="mine-forms-grid">'
      + '<div>'
      + '<h3 class="mine-form-title">' + mi('edit_note') + ' 编辑资料</h3>'
      + '<div class="form-group"><label class="form-label">昵称</label><input class="form-input" id="pc-profile-nickname" value="' + escapeHtml(user.nickname || '') + '" placeholder="请输入昵称"></div>'
      + '<div class="form-group"><label class="form-label">邮箱</label><input class="form-input" type="email" id="pc-profile-email" value="' + escapeHtml(user.email || '') + '" placeholder="请输入邮箱"></div>'
      + '<div class="form-group"><label class="form-label">手机</label><input class="form-input" type="tel" id="pc-profile-phone" value="' + escapeHtml(user.phone || '') + '" placeholder="请输入手机号"></div>'
      + '<button class="btn btn-primary w-100" onclick="PCPages.saveProfile()">' + mi('save', 'mi-18') + ' 保存资料</button>'
      + '</div>'
      + '<div>'
      + '<h3 class="mine-form-title">' + mi('lock') + ' 修改密码</h3>'
      + '<div class="form-group"><label class="form-label">原密码</label><input class="form-input" type="password" id="pc-old-pwd" placeholder="请输入原密码"></div>'
      + '<div class="form-group"><label class="form-label">新密码</label><input class="form-input" type="password" id="pc-new-pwd" placeholder="请输入新密码（6位以上）" oninput="updatePwdStrength(\'pc-new-pwd\')">' + pwdStrengthHtml('pc-new-pwd') + '</div>'
      + '<div class="form-group"><label class="form-label">确认新密码</label><input class="form-input" type="password" id="pc-confirm-pwd" placeholder="再次输入新密码"></div>'
      + '<button class="btn btn-primary w-100" onclick="PCPages.changePwd()">' + mi('lock_reset', 'mi-18') + ' 修改密码</button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div></div>';
  }

  function pcSaveProfile() {
    var nickname = document.getElementById('pc-profile-nickname').value.trim();
    var email    = document.getElementById('pc-profile-email').value.trim();
    var phone    = document.getElementById('pc-profile-phone').value.trim();
    showLoading();
    SharedOps.user.updateProfile({ nickname: nickname, email: email, phone: phone }, function(res) {
      hideLoading();
      showToast(res.msg);
      if (res.code === 200) {
        Storage.set('currentUser', res.data);
        var nickEl = document.getElementById('pc-nickname');
        if (nickEl) nickEl.textContent = res.data.nickname || res.data.username;
        var avatarEl = document.getElementById('pc-avatar');
        if (avatarEl) avatarEl.textContent = getInitial(res.data.nickname || res.data.username);
        loadPCMine(document.getElementById('page-content'));
      }
    });
  }

  function pcChangePwd() {
    var result = SharedUtils.validatePasswordChange('pc-old-pwd', 'pc-new-pwd', 'pc-confirm-pwd', showToast);
    if (!result) return;
    SharedOps.user.changePassword(result.oldPwd, result.newPwd, function(res) {
      if (res.code === 200 && res.data && res.data.require_logout) {
        showToast(res.msg);
        Storage.remove('currentUser');
        setTimeout(function() { window.location.href = '../index.html'; }, 1500);
        return;
      }
      showToast(res.msg);
      if (res.code === 200) {
        document.getElementById('pc-old-pwd').value = '';
        document.getElementById('pc-new-pwd').value = '';
        document.getElementById('pc-confirm-pwd').value = '';
      }
    });
  }

  function uploadAvatar(input) {
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 2 * 1024 * 1024) { showToast('头像不能超过 2MB'); input.value = ''; return; }
    if (!file.type.startsWith('image/')) { showToast('请选择图片文件'); input.value = ''; return; }

    var formData = new FormData();
    formData.append('avatar', file);

    showLoading();
    var xhr = new XMLHttpRequest();
    xhr.open('POST', API.base + 'user/?action=avatar');
    xhr.onload = function () {
      hideLoading();
      input.value = '';
      try {
        var res = JSON.parse(xhr.responseText);
        if (res.code === 200 && res.data) {
          showToast('头像更新成功');
          Storage.set('currentUser', res.data);
          var avatarEl = document.getElementById('pc-avatar');
          if (avatarEl) {
            if (res.data.avatar) {
              avatarEl.innerHTML = '<img src="' + escapeHtml(res.data.avatar) + '" class="avatar-fill">';
            } else {
              avatarEl.textContent = getInitial(res.data.nickname || res.data.username);
            }
          }
          loadPCMine(document.getElementById('page-content'));
        } else {
          showToast(res.msg || '上传失败');
        }
      } catch (e) {
        showToast('上传失败');
      }
    };
    xhr.onerror = function () {
      hideLoading();
      input.value = '';
      showToast('网络错误，上传失败');
    };
    xhr.send(formData);
  }

  PCPages.loadMine = loadPCMine;
  PCPages.saveProfile = pcSaveProfile;
  PCPages.changePwd = pcChangePwd;
  PCPages.uploadAvatar = uploadAvatar;
})();
