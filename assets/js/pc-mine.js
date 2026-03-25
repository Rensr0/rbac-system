/**
 * pc-mine.js - PC 端个人中心
 * 从 pc-pages.js 拆分（编辑资料 + 修改密码 + 头像上传）
 */
(function () {
  function loadPCMine(c) {
    var user = Storage.get('currentUser') || {};
    c.innerHTML =
      '<div class="page-header"><h2>个人中心</h2></div>'
      + '<div style="max-width:1000px;margin:0 auto">'
      + '<div class="card" style="margin-bottom:24px;overflow:hidden">'
      + '<div style="background:linear-gradient(135deg,var(--primary),#6C63FF);padding:40px 32px;color:#fff;position:relative">'
      + '<div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:rgba(255,255,255,0.1);border-radius:50%"></div>'
      + '<div style="position:absolute;bottom:-30px;right:60px;width:100px;height:100px;background:rgba(255,255,255,0.08);border-radius:50%"></div>'
      + '<div style="display:flex;align-items:center;gap:24px;position:relative">'
      + '<div class="avatar-wrap" style="position:relative;width:100px;height:100px;flex-shrink:0;cursor:pointer" onclick="document.getElementById(\'pc-avatar-input\').click()" title="点击更换头像">'
      + (user.avatar
        ? '<img src="' + escapeHtml(user.avatar) + '" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.3);backdrop-filter:blur(10px)">'
        : '<div style="width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:600;backdrop-filter:blur(10px);border:3px solid rgba(255,255,255,0.3)">' + getInitial(user.nickname || user.username) + '</div>')
      + '<div class="avatar-hover-mask"><span class="material-icons" style="font-size:24px">photo_camera</span></div>'
      + '</div>'
      + '<input type="file" id="pc-avatar-input" accept="image/*" style="display:none" onchange="PCPages.uploadAvatar(this)">'
      + '<div>'
      + '<h3 style="margin:0 0 8px;font-size:26px;font-weight:700">' + escapeHtml(user.nickname || user.username) + '</h3>'
      + '<p style="margin:0;font-size:14px;opacity:0.9">' + (user.is_super ? '<span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:12px">超级管理员</span>' : '<span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:12px">普通用户</span>') + '</p>'
      + '<p style="margin:8px 0 0;font-size:13px;opacity:0.75">ID: ' + user.id + ' · 注册于 ' + (user.create_time ? formatDate(user.create_time).split(' ')[0] : '未知') + '</p>'
      + '</div></div></div>'
      + '<div style="padding:32px">'
      + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px">'
      + '<div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:12px">'
      + '<div style="font-size:24px;font-weight:700;color:var(--primary);margin-bottom:4px">' + mi('badge', 'mi-lg') + '</div>'
      + '<div style="font-size:12px;color:var(--text-secondary)">账号</div>'
      + '<div style="font-size:14px;font-weight:500;margin-top:4px">' + escapeHtml(user.username) + '</div>'
      + '</div>'
      + '<div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:12px">'
      + '<div style="font-size:24px;font-weight:700;color:var(--success);margin-bottom:4px">' + mi('email', 'mi-lg') + '</div>'
      + '<div style="font-size:12px;color:var(--text-secondary)">邮箱</div>'
      + '<div style="font-size:14px;font-weight:500;margin-top:4px">' + (user.email ? escapeHtml(user.email) : '未设置') + '</div>'
      + '</div>'
      + '<div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:12px">'
      + '<div style="font-size:24px;font-weight:700;color:var(--warning);margin-bottom:4px">' + mi('phone', 'mi-lg') + '</div>'
      + '<div style="font-size:12px;color:var(--text-secondary)">手机</div>'
      + '<div style="font-size:14px;font-weight:500;margin-top:4px">' + (user.phone ? escapeHtml(user.phone) : '未设置') + '</div>'
      + '</div>'
      + '<div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:12px">'
      + '<div style="font-size:24px;font-weight:700;color:var(--info);margin-bottom:4px">' + mi('calendar_today', 'mi-lg') + '</div>'
      + '<div style="font-size:12px;color:var(--text-secondary)">最后登录</div>'
      + '<div style="font-size:14px;font-weight:500;margin-top:4px">' + (user.last_login ? formatDate(user.last_login).split(' ')[0] : '首次') + '</div>'
      + '</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">'
      + '<div>'
      + '<h3 style="margin:0 0 20px;font-size:18px;display:flex;align-items:center;gap:8px">' + mi('edit_note') + ' 编辑资料</h3>'
      + '<div class="form-group"><label class="form-label">昵称</label><input class="form-input" id="pc-profile-nickname" value="' + escapeHtml(user.nickname || '') + '" placeholder="请输入昵称"></div>'
      + '<div class="form-group"><label class="form-label">邮箱</label><input class="form-input" type="email" id="pc-profile-email" value="' + escapeHtml(user.email || '') + '" placeholder="请输入邮箱"></div>'
      + '<div class="form-group"><label class="form-label">手机</label><input class="form-input" type="tel" id="pc-profile-phone" value="' + escapeHtml(user.phone || '') + '" placeholder="请输入手机号"></div>'
      + '<button class="btn btn-primary" onclick="PCPages.saveProfile()" style="width:100%">' + mi('save', 'mi-18') + ' 保存资料</button>'
      + '</div>'
      + '<div>'
      + '<h3 style="margin:0 0 20px;font-size:18px;display:flex;align-items:center;gap:8px">' + mi('lock') + ' 修改密码</h3>'
      + '<div class="form-group"><label class="form-label">原密码</label><input class="form-input" type="password" id="pc-old-pwd" placeholder="请输入原密码"></div>'
      + '<div class="form-group"><label class="form-label">新密码</label><input class="form-input" type="password" id="pc-new-pwd" placeholder="请输入新密码（6位以上）" oninput="updatePwdStrength(\'pc-new-pwd\')">' + pwdStrengthHtml('pc-new-pwd') + '</div>'
      + '<div class="form-group"><label class="form-label">确认新密码</label><input class="form-input" type="password" id="pc-confirm-pwd" placeholder="再次输入新密码"></div>'
      + '<button class="btn btn-primary" onclick="PCPages.changePwd()" style="width:100%">' + mi('lock_reset', 'mi-18') + ' 修改密码</button>'
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
              avatarEl.innerHTML = '<img src="' + escapeHtml(res.data.avatar) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';
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
