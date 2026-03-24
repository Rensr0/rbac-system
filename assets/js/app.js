/**
 * app.js - 手机端 APP 路由切换、交互逻辑
 * 底部 TabBar、页面栈、手势模拟
 */
(function () {
  'use strict';

  // 非手机端不执行（避免 API 路径错误导致 404 跳转）
  if (window.innerWidth > 768) return;

  // ==================== APP 路由管理 ====================
  const AppRouter = {
    currentPage: 'home',
    pageStack: [],
    pages: {},
    userRouters: [],

    init() {
      this.bindTabBar();
      this.bindNavbar();
      this.checkLogin().then(() => {
        this.loadUserRouters().then(() => {
          this.navigate('home');
        });
      });
    },

    bindNavbar() {
      const backBtn = document.getElementById('navbar-back');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.goBack();
        });
      }
    },

    async checkLogin() {
      const res = await API.get('login/');
      // 未登录(401)或任何异常，跳回登录页
      if (res.code !== 200) {
        window.location.href = '../index.html';
        return;
      }
      Storage.set('currentUser', res.data);
      this.updateMinePage(res.data);
    },

    async loadUserRouters() {
      const res = await API.get('router/', { action: 'user' });
      if (res.code === 200) {
        this.userRouters = res.data || [];
        this.updateTabBar();
      }
    },

    updateTabBar() {
      // TabBar 由 HTML 定义，这里检查权限
      const tabs = document.querySelectorAll('.tab-item');
      tabs.forEach(tab => {
        const page = tab.dataset.page;
        if (page === 'home' || page === 'mine') return; // 首页和我的始终显示
        const hasPerm = this.userRouters.some(r => r.router_path === page);
        tab.style.display = hasPerm ? '' : 'none';
      });
    },

    bindTabBar() {
      document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
          const page = tab.dataset.page;
          if (page === this.currentPage) return;
          this.navigate(page);
        });
      });
    },

    navigate(page, params = {}) {
      const oldPage = document.querySelector('.app-page.active');
      const newPage = document.getElementById('page-' + page);
      if (!newPage) return;

      // 更新 TabBar
      document.querySelectorAll('.tab-item').forEach(t => {
        t.classList.toggle('active', t.dataset.page === page);
      });

      // 导航标题
      const titles = { home: '首页', user: '用户管理', role: '角色管理', router: '路由管理', mine: '我的' };
      const navbar = document.querySelector('.app-navbar .navbar-title');
      if (navbar) navbar.textContent = titles[page] || '管理系统';

      // 返回按钮显示逻辑
      const backBtn = document.getElementById('navbar-back');
      if (backBtn) {
        if (page === 'home') {
          backBtn.style.display = 'none';
        } else {
          backBtn.style.display = 'block';
        }
      }

      // 页面切换动画
      if (oldPage) {
        oldPage.classList.remove('active');
        oldPage.classList.add('slide-out');
        setTimeout(() => oldPage.classList.remove('slide-out'), 300);
      }
      newPage.classList.add('active');
      newPage.scrollTop = 0;

      this.currentPage = page;
      this.pageStack.push(page);

      // 触发页面加载
      if (typeof window['loadPage_' + page] === 'function') {
        window['loadPage_' + page](params);
      }
    },

    goBack() {
      if (this.pageStack.length <= 1) return;
      this.pageStack.pop();
      const prevPage = this.pageStack[this.pageStack.length - 1];
      this.navigate(prevPage);
    },

    updateMinePage(user) {
      const nameEl = document.querySelector('.mine-name');
      const roleEl = document.querySelector('.mine-role');
      const avatarEl = document.querySelector('.mine-avatar');
      if (nameEl) nameEl.textContent = user.nickname || user.username;
      if (roleEl) roleEl.textContent = user.is_super ? '超级管理员' : '普通用户';
      if (avatarEl) avatarEl.textContent = getInitial(user.nickname || user.username);
    }
  };

  // ==================== 首页 ====================
  window.loadPage_home = async function () {
    const content = document.getElementById('page-home');
    if (!content) return;

    appShowLoading();
    const [userRes, roleRes] = await Promise.all([
      API.get('user/', { limit: 1 }),
      API.get('role/', { limit: 100 }),
    ]);
    appHideLoading();

    const userTotal = userRes.code === 200 ? (userRes.data?.total || 0) : 0;
    const roleTotal = roleRes.code === 200 ? (roleRes.data?.total || 0) : 0;
    const routerCount = AppRouter.userRouters.length;

    content.innerHTML = `
      <div class="app-page-content">
        <div class="app-stats">
          <div class="app-stat-card">
            <div class="stat-num">${userTotal}</div>
            <div class="stat-name">系统用户</div>
          </div>
          <div class="app-stat-card">
            <div class="stat-num">${roleTotal}</div>
            <div class="stat-name">角色数量</div>
          </div>
          <div class="app-stat-card">
            <div class="stat-num">${routerCount}</div>
            <div class="stat-name">可用功能</div>
          </div>
          <div class="app-stat-card">
            <div class="stat-num">✓</div>
            <div class="stat-name">系统状态</div>
          </div>
        </div>

        <div class="app-card">
          <div class="app-card-header">
            <h3>🚀 快捷操作</h3>
          </div>
          <div class="app-list">
            ${AppRouter.userRouters.some(r => r.router_path === 'user') ? `
            <div class="app-list-item" onclick="AppRouter.navigate('user')">
              <div class="item-icon">👥</div>
              <div class="item-content">
                <div class="item-title">用户管理</div>
                <div class="item-desc">查看和管理系统用户</div>
              </div>
              <div class="item-arrow">›</div>
            </div>` : ''}
            ${AppRouter.userRouters.some(r => r.router_path === 'role') ? `
            <div class="app-list-item" onclick="AppRouter.navigate('role')">
              <div class="item-icon">🎭</div>
              <div class="item-content">
                <div class="item-title">角色管理</div>
                <div class="item-desc">配置角色与权限</div>
              </div>
              <div class="item-arrow">›</div>
            </div>` : ''}
            ${AppRouter.userRouters.some(r => r.router_path === 'router') ? `
            <div class="app-list-item" onclick="AppRouter.navigate('router')">
              <div class="item-icon">🧭</div>
              <div class="item-content">
                <div class="item-title">路由管理</div>
                <div class="item-desc">管理系统路由权限</div>
              </div>
              <div class="item-arrow">›</div>
            </div>` : ''}
            <div class="app-list-item" onclick="AppRouter.navigate('mine')">
              <div class="item-icon">👤</div>
              <div class="item-content">
                <div class="item-title">个人中心</div>
                <div class="item-desc">查看个人信息、修改密码</div>
              </div>
              <div class="item-arrow">›</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // ==================== 用户管理 ====================
  let userPage = 1;
  window.loadPage_user = async function () {
    const content = document.getElementById('page-user');
    if (!content) return;

    appShowLoading();
    const res = await API.get('user/', { page: userPage, limit: 20 });
    appHideLoading();

    if (res.code !== 200) { appToast(res.msg); return; }

    const { list = [], total = 0 } = res.data || {};
    const hasMore = list.length < total;

    content.innerHTML = `
      <div class="app-page-content">
        <div class="app-search">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="搜索用户名或昵称" id="user-search" onkeyup="if(event.key==='Enter')searchUsers()">
        </div>

        <div id="user-list">
          ${list.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><p>暂无用户数据</p></div>' : ''}
          ${list.map(u => `
            <div class="user-card-app" data-id="${u.id}">
              <div class="user-avatar-app">${getInitial(u.nickname || u.username)}</div>
              <div class="user-info-app">
                <div class="user-name-app">${escapeHtml(u.nickname || u.username)} ${u.is_super ? '<span class="badge badge-warning" style="font-size:10px;margin-left:4px">超级</span>' : ''}</div>
                <div class="user-meta-app">@${escapeHtml(u.username)} · ${(u.roles||[]).map(r=>r.role_name).join(', ') || '无角色'}</div>
              </div>
              <div class="user-actions-app">
                <button class="app-btn app-btn-sm app-btn-outline" onclick="editUserApp(${u.id})" style="padding:0 10px;height:30px;font-size:12px">编辑</button>
              </div>
            </div>
          `).join('')}
        </div>

        ${hasMore ? `<div style="text-align:center;padding:16px"><button class="app-btn app-btn-sm app-btn-outline" onclick="loadMoreUsers()">加载更多</button></div>` : ''}

        <div style="padding:16px 0">
          <button class="app-btn app-btn-primary" onclick="showAddUserSheet()">＋ 添加用户</button>
        </div>
      </div>
    `;
  };

  window.searchUsers = async function () {
    const kw = document.getElementById('user-search')?.value || '';
    userPage = 1;
    appShowLoading();
    const res = await API.get('user/', { keyword: kw, page: 1, limit: 20 });
    appHideLoading();
    if (res.code !== 200) return;
    const { list = [], total = 0 } = res.data || {};
    const container = document.getElementById('user-list');
    if (container) {
      container.innerHTML = list.length === 0
        ? '<div class="empty-state"><div class="empty-icon">📭</div><p>未找到用户</p></div>'
        : list.map(u => `
          <div class="user-card-app" data-id="${u.id}">
            <div class="user-avatar-app">${getInitial(u.nickname || u.username)}</div>
            <div class="user-info-app">
              <div class="user-name-app">${escapeHtml(u.nickname || u.username)} ${u.is_super ? '<span class="badge badge-warning" style="font-size:10px;margin-left:4px">超级</span>' : ''}</div>
              <div class="user-meta-app">@${escapeHtml(u.username)} · ${(u.roles||[]).map(r=>r.role_name).join(', ') || '无角色'}</div>
            </div>
            <div class="user-actions-app">
              <button class="app-btn app-btn-sm app-btn-outline" onclick="editUserApp(${u.id})" style="padding:0 10px;height:30px;font-size:12px">编辑</button>
            </div>
          </div>
        `).join('');
    }
  };

  window.loadMoreUsers = function () {
    userPage++;
    loadPage_user();
  };

  // 添加用户 - Action Sheet
  window.showAddUserSheet = async function () {
    const roleRes = await API.get('role/', { limit: 100 });
    const roles = roleRes.code === 200 ? (roleRes.data?.list || []) : [];

    const overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = `
      <div class="app-action-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">添加用户</div>
        <div style="padding:0 16px 16px">
          <div class="app-form">
            <div class="app-form-item">
              <div class="form-label">账号</div>
              <input class="form-input" id="new-username" placeholder="请输入账号">
            </div>
            <div class="app-form-item">
              <div class="form-label">密码</div>
              <input class="form-input" type="password" id="new-password" value="123456" placeholder="默认 123456">
            </div>
            <div class="app-form-item">
              <div class="form-label">昵称</div>
              <input class="form-input" id="new-nickname" placeholder="请输入昵称">
            </div>
            <div class="app-form-item">
              <div class="form-label">邮箱</div>
              <input class="form-input" id="new-email" placeholder="选填">
            </div>
            <div class="app-form-item">
              <div class="form-label">手机</div>
              <input class="form-input" id="new-phone" placeholder="选填">
            </div>
          </div>
          <div style="margin-bottom:12px;font-size:14px;font-weight:600;padding:0 4px">分配角色</div>
          <div class="app-list" style="max-height:150px;overflow-y:auto">
            ${roles.map(r => `
              <div class="role-switch-item">
                <span style="font-size:14px">${escapeHtml(r.role_name)}</span>
                <label class="switch">
                  <input type="checkbox" value="${r.id}" class="new-role-cb">
                  <span class="slider"></span>
                </label>
              </div>
            `).join('')}
          </div>
          <button class="app-btn app-btn-primary" style="margin-top:16px" onclick="submitAddUser()">确认添加</button>
        </div>
        <div class="sheet-cancel" onclick="closeActionSheet()">取消</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    overlay.onclick = (e) => {
      if (e.target === overlay) closeActionSheet();
    };
    
    window.closeActionSheet = function() {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };
  };

  window.submitAddUser = async function () {
    const username = document.getElementById('new-username')?.value?.trim();
    const password = document.getElementById('new-password')?.value?.trim() || '123456';
    const nickname = document.getElementById('new-nickname')?.value?.trim();
    const email = document.getElementById('new-email')?.value?.trim();
    const phone = document.getElementById('new-phone')?.value?.trim();
    const roleIds = Array.from(document.querySelectorAll('.new-role-cb:checked')).map(cb => parseInt(cb.value));

    if (!username) { appToast('请输入账号'); return; }

    appShowLoading();
    const res = await API.post('user/', { username, password, nickname, email, phone, role_ids: roleIds });
    appHideLoading();

    appToast(res.msg);
    if (res.code === 200) {
      closeActionSheet();
      loadPage_user();
    }
  };

  // 编辑用户
  window.editUserApp = async function (id) {
    appShowLoading();
    const res = await API.get('user/', { action: 'detail', id });
    appHideLoading();
    if (res.code !== 200) { appToast(res.msg); return; }
    const u = res.data;

    const roleRes = await API.get('role/', { limit: 100 });
    const roles = roleRes.code === 200 ? (roleRes.data?.list || []) : [];

    const overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = `
      <div class="app-action-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">编辑用户</div>
        <div style="padding:0 16px 16px">
          <div class="app-form">
            <div class="app-form-item">
              <div class="form-label">账号</div>
              <input class="form-input" value="${escapeHtml(u.username)}" disabled style="opacity:0.5">
            </div>
            <div class="app-form-item">
              <div class="form-label">昵称</div>
              <input class="form-input" id="edit-nickname" value="${escapeHtml(u.nickname)}">
            </div>
            <div class="app-form-item">
              <div class="form-label">邮箱</div>
              <input class="form-input" id="edit-email" value="${escapeHtml(u.email || '')}">
            </div>
            <div class="app-form-item">
              <div class="form-label">手机</div>
              <input class="form-input" id="edit-phone" value="${escapeHtml(u.phone || '')}">
            </div>
            <div class="app-form-item">
              <div class="form-label">状态</div>
              <label class="switch">
                <input type="checkbox" id="edit-status" ${u.status == 1 ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <div style="margin-bottom:12px;font-size:14px;font-weight:600;padding:0 4px">角色分配</div>
          <div class="app-list" style="max-height:150px;overflow-y:auto">
            ${roles.map(r => `
              <div class="role-switch-item">
                <span style="font-size:14px">${escapeHtml(r.role_name)}</span>
                <label class="switch">
                  <input type="checkbox" value="${r.id}" class="edit-role-cb" ${(u.role_ids||[]).includes(r.id) ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="app-btn app-btn-primary" style="flex:1" onclick="submitEditUser(${u.id})">保存</button>
            ${!u.is_super ? `<button class="app-btn app-btn-danger" style="flex:1" onclick="deleteUserApp(${u.id})">删除</button>` : ''}
          </div>
        </div>
        <div class="sheet-cancel" onclick="closeActionSheet()">取消</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    overlay.onclick = (e) => {
      if (e.target === overlay) closeActionSheet();
    };
    
    window.closeActionSheet = function() {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };
  };

  window.submitEditUser = async function (id) {
    const nickname = document.getElementById('edit-nickname')?.value?.trim();
    const email = document.getElementById('edit-email')?.value?.trim();
    const phone = document.getElementById('edit-phone')?.value?.trim();
    const status = document.getElementById('edit-status')?.checked ? 1 : 0;
    const roleIds = Array.from(document.querySelectorAll('.edit-role-cb:checked')).map(cb => parseInt(cb.value));

    appShowLoading();
    const res1 = await API.post('user/', { action: 'update', id, nickname, email, phone, status });
    const res2 = await API.post('user/', { action: 'roles', user_id: id, role_ids: roleIds });
    appHideLoading();

    appToast(res1.code === 200 && res2.code === 200 ? '保存成功' : (res1.msg || res2.msg));
    if (res1.code === 200 && res2.code === 200) {
      closeActionSheet();
      loadPage_user();
    }
  };

  window.deleteUserApp = async function (id) {
    const ok = await confirmDialog('删除用户', '确定要删除此用户吗？此操作不可恢复。');
    if (!ok) return;

    appShowLoading();
    const res = await API.post('user/', { action:'delete', id });
    appHideLoading();

    appToast(res.msg);
    if (res.code === 200) {
      closeActionSheet();
      loadPage_user();
    }
  };

  // ==================== 角色管理 ====================
  window.loadPage_role = async function () {
    const content = document.getElementById('page-role');
    if (!content) return;

    appShowLoading();
    const res = await API.get('role/', { limit: 100 });
    appHideLoading();

    if (res.code !== 200) { appToast(res.msg); return; }
    const list = res.data?.list || [];

    content.innerHTML = `
      <div class="app-page-content">
        <div id="role-list">
          ${list.length === 0 ? '<div class="empty-state"><div class="empty-icon">🎭</div><p>暂无角色数据</p></div>' : ''}
          ${list.map(r => `
            <div class="app-card" style="margin-bottom:10px">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-size:16px;font-weight:600">${escapeHtml(r.role_name)}</div>
                  <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${escapeHtml(r.remark || '暂无备注')} · ${r.user_count || 0} 个用户 · ${(r.routers||[]).length} 个权限</div>
                </div>
                <button class="app-btn app-btn-sm app-btn-outline" onclick="editRoleApp(${r.id})" style="padding:0 12px;height:32px;font-size:12px">管理</button>
              </div>
              ${(r.routers||[]).length > 0 ? `
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
                ${r.routers.map(rt => `<span class="badge badge-info">${escapeHtml(rt.icon)} ${escapeHtml(rt.router_name)}</span>`).join('')}
              </div>` : ''}
            </div>
          `).join('')}
        </div>
        <div style="padding:16px 0">
          <button class="app-btn app-btn-primary" onclick="showAddRoleSheet()">＋ 创建角色</button>
        </div>
      </div>
    `;
  };

  window.showAddRoleSheet = async function () {
    const routerRes = await API.get('router/');
    const routers = routerRes.code === 200 ? (routerRes.data || []) : [];

    const overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = `
      <div class="app-action-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">创建角色</div>
        <div style="padding:0 16px 16px">
          <div class="app-form">
            <div class="app-form-item">
              <div class="form-label">名称</div>
              <input class="form-input" id="new-role-name" placeholder="请输入角色名称">
            </div>
            <div class="app-form-item">
              <div class="form-label">备注</div>
              <input class="form-input" id="new-role-remark" placeholder="选填">
            </div>
          </div>
          <div style="margin-bottom:12px;font-size:14px;font-weight:600;padding:0 4px">权限配置</div>
          <div class="app-list" style="max-height:200px;overflow-y:auto">
            ${routers.map(r => `
              <div class="role-switch-item">
                <span style="font-size:14px">${escapeHtml(r.icon)} ${escapeHtml(r.router_name)}</span>
                <label class="switch">
                  <input type="checkbox" value="${r.id}" class="new-role-router-cb">
                  <span class="slider"></span>
                </label>
              </div>
            `).join('')}
          </div>
          <button class="app-btn app-btn-primary" style="margin-top:16px" onclick="submitAddRole()">确认创建</button>
        </div>
        <div class="sheet-cancel" onclick="closeActionSheet()">取消</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    overlay.onclick = (e) => {
      if (e.target === overlay) closeActionSheet();
    };
    
    window.closeActionSheet = function() {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };
  };

  window.submitAddRole = async function () {
    const roleName = document.getElementById('new-role-name')?.value?.trim();
    const remark = document.getElementById('new-role-remark')?.value?.trim();
    const routerIds = Array.from(document.querySelectorAll('.new-role-router-cb:checked')).map(cb => parseInt(cb.value));

    if (!roleName) { appToast('请输入角色名称'); return; }

    appShowLoading();
    const res = await API.post('role/', { role_name: roleName, remark, router_ids: routerIds });
    appHideLoading();

    appToast(res.msg);
    if (res.code === 200) {
      closeActionSheet();
      loadPage_role();
    }
  };

  window.editRoleApp = async function (id) {
    appShowLoading();
    const [roleRes, routerRes] = await Promise.all([
      API.get('role/', { limit: 100 }),
      API.get('router/'),
    ]);
    appHideLoading();

    const role = (roleRes.data?.list || []).find(r => r.id === id);
    const routers = routerRes.code === 200 ? (routerRes.data || []) : [];
    if (!role) { appToast('角色不存在'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = `
      <div class="app-action-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">编辑角色</div>
        <div style="padding:0 16px 16px">
          <div class="app-form">
            <div class="app-form-item">
              <div class="form-label">名称</div>
              <input class="form-input" id="edit-role-name" value="${escapeHtml(role.role_name)}" ${id === 1 ? 'disabled style="opacity:0.5"' : ''}>
            </div>
            <div class="app-form-item">
              <div class="form-label">备注</div>
              <input class="form-input" id="edit-role-remark" value="${escapeHtml(role.remark || '')}">
            </div>
          </div>
          <div style="margin-bottom:12px;font-size:14px;font-weight:600;padding:0 4px">权限配置</div>
          <div class="app-list" style="max-height:200px;overflow-y:auto">
            ${routers.map(r => `
              <div class="role-switch-item">
                <span style="font-size:14px">${escapeHtml(r.icon)} ${escapeHtml(r.router_name)}</span>
                <label class="switch">
                  <input type="checkbox" value="${r.id}" class="edit-role-router-cb" ${(role.router_ids||[]).includes(r.id) ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="app-btn app-btn-primary" style="flex:1" onclick="submitEditRole(${id})">保存</button>
            ${id !== 1 ? `<button class="app-btn app-btn-danger" style="flex:1" onclick="deleteRoleApp(${id})">删除</button>` : ''}
          </div>
        </div>
        <div class="sheet-cancel" onclick="closeActionSheet()">取消</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    overlay.onclick = (e) => {
      if (e.target === overlay) closeActionSheet();
    };
    
    window.closeActionSheet = function() {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };
  };

  window.submitEditRole = async function (id) {
    const roleName = document.getElementById('edit-role-name')?.value?.trim();
    const remark = document.getElementById('edit-role-remark')?.value?.trim();
    const routerIds = Array.from(document.querySelectorAll('.edit-role-router-cb:checked')).map(cb => parseInt(cb.value));

    appShowLoading();
    const res1 = await API.post('role/', { action: 'update', id, role_name: roleName, remark });
    const res2 = await API.post('role/', { action: 'routers', role_id: id, router_ids: routerIds });
    appHideLoading();

    appToast(res1.code === 200 && res2.code === 200 ? '保存成功' : (res1.msg || res2.msg));
    if (res1.code === 200 && res2.code === 200) {
      closeActionSheet();
      loadPage_role();
    }
  };

  window.deleteRoleApp = async function (id) {
    const ok = await confirmDialog('删除角色', '确定要删除此角色吗？');
    if (!ok) return;

    appShowLoading();
    const res = await API.post('role/', { action:'delete', id });
    appHideLoading();

    appToast(res.msg);
    if (res.code === 200) {
      closeActionSheet();
      loadPage_role();
    }
  };

  // ==================== 路由管理 ====================
  window.loadPage_router = async function () {
    const content = document.getElementById('page-router');
    if (!content) return;

    appShowLoading();
    const res = await API.get('router/');
    appHideLoading();

    if (res.code !== 200) { appToast(res.msg); return; }
    const list = res.data || [];

    content.innerHTML = `
      <div class="app-page-content">
        <div id="router-list">
          ${list.length === 0 ? '<div class="empty-state"><div class="empty-icon">🧭</div><p>暂无路由数据</p></div>' : ''}
          ${list.map(r => `
            <div class="app-card" style="margin-bottom:10px">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:24px">${r.icon || '📄'}</span>
                  <div>
                    <div style="font-size:15px;font-weight:600">${escapeHtml(r.router_name)}</div>
                    <div style="font-size:12px;color:var(--text-secondary)"><code>${escapeHtml(r.router_path)}</code> · 排序 ${r.sort} · ${r.role_count||0} 个角色绑定</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="badge ${r.status==1?'badge-success':'badge-danger'}">${r.status==1?'启用':'禁用'}</span>
                  <button class="app-btn app-btn-sm app-btn-outline" onclick="editRouterApp(${r.id})" style="padding:0 10px;height:30px;font-size:12px">编辑</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="padding:16px 0">
          <button class="app-btn app-btn-primary" onclick="showAddRouterSheet()">＋ 添加路由</button>
        </div>
      </div>
    `;
  };

  window.showAddRouterSheet = function () {
    const overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = `
      <div class="app-action-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">添加路由</div>
        <div style="padding:0 16px 16px">
          <div class="app-form">
            <div class="app-form-item">
              <div class="form-label">名称</div>
              <input class="form-input" id="new-router-name" placeholder="如：用户管理">
            </div>
            <div class="app-form-item">
              <div class="form-label">路径</div>
              <input class="form-input" id="new-router-path" placeholder="如：user">
            </div>
            <div class="app-form-item">
              <div class="form-label">图标</div>
              <input class="form-input" id="new-router-icon" placeholder="Emoji 图标">
            </div>
            <div class="app-form-item">
              <div class="form-label">排序</div>
              <input class="form-input" type="number" id="new-router-sort" value="0" min="0">
            </div>
          </div>
          <button class="app-btn app-btn-primary" style="margin-top:16px" onclick="submitAddRouter()">确认添加</button>
        </div>
        <div class="sheet-cancel" onclick="closeActionSheet()">取消</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    overlay.onclick = (e) => {
      if (e.target === overlay) closeActionSheet();
    };
    
    window.closeActionSheet = function() {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };
  };

  window.submitAddRouter = async function () {
    const name = document.getElementById('new-router-name')?.value?.trim();
    const path = document.getElementById('new-router-path')?.value?.trim();
    const icon = document.getElementById('new-router-icon')?.value?.trim();
    const sort = parseInt(document.getElementById('new-router-sort')?.value) || 0;

    if (!name || !path) { appToast('名称和路径不能为空'); return; }

    appShowLoading();
    const res = await API.post('router/', { router_name: name, router_path: path, icon, sort });
    appHideLoading();

    appToast(res.msg);
    if (res.code === 200) {
      closeActionSheet();
      loadPage_router();
    }
  };

  window.editRouterApp = async function (id) {
    const res = await API.get('router/');
    const r = (res.data || []).find(x => x.id === id);
    if (!r) { appToast('路由不存在'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = `
      <div class="app-action-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">编辑路由</div>
        <div style="padding:0 16px 16px">
          <div class="app-form">
            <div class="app-form-item">
              <div class="form-label">名称</div>
              <input class="form-input" id="edit-router-name" value="${escapeHtml(r.router_name)}">
            </div>
            <div class="app-form-item">
              <div class="form-label">路径</div>
              <input class="form-input" id="edit-router-path" value="${escapeHtml(r.router_path)}">
            </div>
            <div class="app-form-item">
              <div class="form-label">图标</div>
              <input class="form-input" id="edit-router-icon" value="${escapeHtml(r.icon || '')}">
            </div>
            <div class="app-form-item">
              <div class="form-label">排序</div>
              <input class="form-input" type="number" id="edit-router-sort" value="${r.sort}" min="0">
            </div>
            <div class="app-form-item">
              <div class="form-label">状态</div>
              <label class="switch">
                <input type="checkbox" id="edit-router-status" ${r.status == 1 ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="app-btn app-btn-primary" style="flex:1" onclick="submitEditRouter(${r.id})">保存</button>
            <button class="app-btn app-btn-danger" style="flex:1" onclick="deleteRouterApp(${r.id})">删除</button>
          </div>
        </div>
        <div class="sheet-cancel" onclick="closeActionSheet()">取消</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    overlay.onclick = (e) => {
      if (e.target === overlay) closeActionSheet();
    };
    
    window.closeActionSheet = function() {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };
  };

  window.submitEditRouter = async function (id) {
    const name = document.getElementById('edit-router-name')?.value?.trim();
    const path = document.getElementById('edit-router-path')?.value?.trim();
    const icon = document.getElementById('edit-router-icon')?.value?.trim();
    const sort = parseInt(document.getElementById('edit-router-sort')?.value) || 0;
    const status = document.getElementById('edit-router-status')?.checked ? 1 : 0;

    if (!name || !path) { appToast('名称和路径不能为空'); return; }

    appShowLoading();
    const res = await API.post('router/', { action: 'update', id, router_name: name, router_path: path, icon, sort, status });
    appHideLoading();

    appToast(res.msg);
    if (res.code === 200) {
      closeActionSheet();
      loadPage_router();
    }
  };

  window.deleteRouterApp = async function (id) {
    const ok = await confirmDialog('删除路由', '确定要删除此路由？关联的角色权限将被清除。');
    if (!ok) return;

    appShowLoading();
    const res = await API.post('router/', { action:'delete', id });
    appHideLoading();

    appToast(res.msg);
    if (res.code === 200) {
      closeActionSheet();
      loadPage_router();
    }
  };

  // ==================== 我的页面 ====================
  window.loadPage_mine = function () {
    const user = Storage.get('currentUser');
    if (!user) return;

    const content = document.getElementById('page-mine');
    if (!content) return;

    content.innerHTML = `
      <div class="app-page-content">
        <div class="mine-header">
          <div class="mine-avatar">${getInitial(user.nickname || user.username)}</div>
          <div class="mine-name">${escapeHtml(user.nickname || user.username)}</div>
          <div class="mine-role">${user.is_super ? '超级管理员' : '普通用户'}</div>
        </div>

        <div class="app-list">
          <div class="app-list-item">
            <div class="item-icon">🆔</div>
            <div class="item-content">
              <div class="item-title">账号</div>
              <div class="item-desc">${escapeHtml(user.username)}</div>
            </div>
          </div>
          <div class="app-list-item">
            <div class="item-icon">📧</div>
            <div class="item-content">
              <div class="item-title">邮箱</div>
              <div class="item-desc">${escapeHtml(user.email || '未设置')}</div>
            </div>
          </div>
          <div class="app-list-item">
            <div class="item-icon">📱</div>
            <div class="item-content">
              <div class="item-title">手机</div>
              <div class="item-desc">${escapeHtml(user.phone || '未设置')}</div>
            </div>
          </div>
          <div class="app-list-item">
            <div class="item-icon">📅</div>
            <div class="item-content">
              <div class="item-title">注册时间</div>
              <div class="item-desc">${formatDate(user.create_time)}</div>
            </div>
          </div>
        </div>

        <div class="app-list">
          <div class="app-list-item" onclick="window.ThemeSwitcher&&ThemeSwitcher.showMobileSheet()">
            <div class="item-icon">🎨</div>
            <div class="item-content">
              <div class="item-title">切换主题</div>
              <div class="item-desc" id="current-theme-name"></div>
            </div>
            <div class="item-arrow">›</div>
          </div>
          <div class="app-list-item" onclick="showChangePwdSheet()">
            <div class="item-icon">🔒</div>
            <div class="item-content">
              <div class="item-title">修改密码</div>
            </div>
            <div class="item-arrow">›</div>
          </div>
        </div>

        <div style="padding:24px 0">
          <button class="app-btn app-btn-danger" onclick="logoutApp()">退出登录</button>
        </div>
      </div>
    `;

    // 更新当前主题名称
    if (window.ThemeSwitcher) {
      var cur = ThemeSwitcher.get();
      var t = ThemeSwitcher.themes.filter(function(x){return x.id===cur});
      var nameEl = document.getElementById('current-theme-name');
      if (nameEl && t.length) nameEl.textContent = t[0].name;
    }
  };

  window.showChangePwdSheet = function () {
    const overlay = document.createElement('div');
    overlay.className = 'app-action-sheet-overlay';
    overlay.innerHTML = `
      <div class="app-action-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">修改密码</div>
        <div style="padding:0 16px 16px">
          <div class="app-form">
            <div class="app-form-item">
              <div class="form-label">原密码</div>
              <input class="form-input" type="password" id="old-pwd" placeholder="请输入原密码">
            </div>
            <div class="app-form-item">
              <div class="form-label">新密码</div>
              <input class="form-input" type="password" id="new-pwd" placeholder="请输入新密码">
            </div>
            <div class="app-form-item">
              <div class="form-label">确认</div>
              <input class="form-input" type="password" id="confirm-pwd" placeholder="再次输入新密码">
            </div>
          </div>
          <button class="app-btn app-btn-primary" style="margin-top:16px" onclick="submitChangePwd()">确认修改</button>
        </div>
        <div class="sheet-cancel" onclick="closeActionSheet()">取消</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    
    overlay.onclick = (e) => {
      if (e.target === overlay) closeActionSheet();
    };
    
    window.closeActionSheet = function() {
      overlay.querySelector('.app-action-sheet').classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };
  };

  window.submitChangePwd = async function () {
    const oldPwd = document.getElementById('old-pwd')?.value;
    const newPwd = document.getElementById('new-pwd')?.value;
    const confirmPwd = document.getElementById('confirm-pwd')?.value;

    if (!oldPwd || !newPwd) { appToast('请填写完整'); return; }
    if (newPwd !== confirmPwd) { appToast('两次密码不一致'); return; }

    appShowLoading();
    const res = await API.post('user/', { action: 'password', old_password: oldPwd, new_password: newPwd });
    appHideLoading();

    appToast(res.msg);
    if (res.code === 200) {
      closeActionSheet();
    }
  };

  window.logoutApp = async function () {
    const ok = await confirmDialog('退出登录', '确定要退出当前账号吗？');
    if (!ok) return;

    try {
      const res = await API.post('login/?action=logout');
      if (res.code !== 200) {
        console.warn('退出登录API返回错误:', res.msg);
      }
    } catch (err) {
      console.error('退出登录API调用失败:', err);
    }
    Storage.remove('currentUser');
    window.location.href = '../index.html';
  };

  // ==================== 初始化 ====================
  window.AppRouter = AppRouter;
  document.addEventListener('DOMContentLoaded', () => AppRouter.init());
})();
