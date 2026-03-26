/**
 * pc-home.js - PC 端首页 + 系统设置
 * 从 pc-pages.js 拆分
 * v3.2: 内联样式迁移到 components.css
 */
(function () {
  function loadHome(c) {
    var currentUser = Storage.get('currentUser') || {};
    var isSuper = currentUser.is_super == 1;
    var routers = window._userRouters || [];

    var promises = [API.get('router/')];
    if (isSuper) {
      promises.unshift(API.get('role/', { limit: 100 }));
      promises.unshift(API.get('user/', { limit: 1 }));
    }

    Promise.all(promises).then(function(results) {
      var uR = isSuper ? results[0] : { data: { total: 0 } };
      var rR = isSuper ? results[1] : { data: { total: 0 } };
      var rtR = isSuper ? results[2] : results[0];
      var routerCount = (rtR.data || []).length;

      if (isSuper) {
        c.innerHTML =
          '<div class="stats-grid">'
          + '<div class="stat-card"><div class="stat-icon">' + mi('group', 'mi-lg') + '</div><div class="stat-value">' + (uR.data && uR.data.total || 0) + '</div><div class="stat-label">系统用户</div></div>'
          + '<div class="stat-card"><div class="stat-icon">' + mi('shield', 'mi-lg') + '</div><div class="stat-value">' + (rR.data && rR.data.total || 0) + '</div><div class="stat-label">角色数量</div></div>'
          + '<div class="stat-card"><div class="stat-icon">' + mi('route', 'mi-lg') + '</div><div class="stat-value">' + routerCount + '</div><div class="stat-label">路由权限</div></div>'
          + '<div class="stat-card"><div class="stat-icon">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-value" style="color:var(--success)">正常</div><div class="stat-label">系统状态</div></div>'
          + '</div>'
          + '<div class="card"><div class="card-header">欢迎回来，' + escapeHtml(currentUser.nickname || currentUser.username) + '</div>'
          + '<div class="card-body">'
          + '<p class="text-secondary">RBAC 权限管理系统 v3.0 运行正常。当前系统概况如下：</p>'
          + '</div></div>'
          + '<div class="card mt-24"><div class="card-header">数据概览</div><div class="card-body"><div id="stats-chart" style="height:320px" class="flex-center-center"></div></div></div>'
          + '<div class="card mt-24"><div class="card-header">' + mi('settings', 'mi-18') + ' 系统设置</div><div class="card-body" id="settings-panel"><div class="text-center p-16-0"><div class="spinner"></div></div></div></div>';

        if (window.ApexCharts) {
          var totalUsers = uR.data && uR.data.total || 0;
          var totalRoles = rR.data && rR.data.total || 0;
          var chartData = [totalUsers, totalRoles, routerCount];
          var chartLabels = ['系统用户', '角色数量', '路由权限'];
          var chartColors = ['var(--primary)', 'var(--success)', 'var(--warning)'];
          var hasData = chartData.some(function(v) { return v > 0; });

          var options = {
            series: hasData ? chartData : [1],
            chart: { type: 'donut', height: 320, toolbar: { show: false } },
            labels: hasData ? chartLabels : ['暂无数据'],
            colors: hasData ? chartColors : ['#E5E5EA'],
            plotOptions: {
              pie: {
                donut: {
                  size: '68%',
                  labels: {
                    show: true,
                    name: { show: true, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' },
                    value: { show: true, fontSize: '28px', fontWeight: 700, color: 'var(--primary)' },
                    total: {
                      show: true, label: '总计', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)',
                      formatter: function (w) { return w.globals.seriesTotals.reduce(function(a, b) { return a + b; }, 0); }
                    }
                  }
                }
              }
            },
            dataLabels: { enabled: false },
            legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '13px', fontWeight: 500, markers: { width: 10, height: 10, radius: 50 }, itemMargin: { horizontal: 16, vertical: 8 } },
            stroke: { width: 0 },
            tooltip: { theme: 'light', y: { formatter: function(val) { return val; } } },
            states: { hover: { filter: { type: 'lighten', value: 0.1 } }, active: { filter: { type: 'darken', value: 0.1 } } }
          };
          var chart = new ApexCharts(document.querySelector('#stats-chart'), options);
          chart.render();
        }

        PCPages.loadSettings();
      } else {
        c.innerHTML =
          '<div class="stats-grid">'
          + '<div class="stat-card"><div class="stat-icon">' + mi('route', 'mi-lg') + '</div><div class="stat-value">' + routerCount + '</div><div class="stat-label">可用功能</div></div>'
          + '<div class="stat-card"><div class="stat-icon">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-value" style="color:var(--success)">正常</div><div class="stat-label">系统状态</div></div>'
          + '</div>'
          + '<div class="card"><div class="card-header">欢迎回来，' + escapeHtml(currentUser.nickname || currentUser.username) + '</div>'
          + '<div class="card-body">'
          + '<p class="text-secondary">RBAC 权限管理系统 v3.0 运行正常。您可以通过左侧菜单访问已授权的功能模块。</p>'
          + '</div></div>';
      }
    });
  }

  function loadSettings() {
    var panel = document.getElementById('settings-panel');
    if (!panel) return;
    API.get('settings/').then(function(res) {
      if (res.code !== 200) {
        panel.innerHTML = '<p style="color:var(--danger)">加载设置失败</p>';
        return;
      }
      var settings = res.data || {};
      var captchaOn = settings.captcha_enabled && settings.captcha_enabled.value !== false;
      panel.innerHTML =
        '<div class="setting-row">'
        + '<div class="setting-info">'
        + '<div class="setting-label">' + mi('visibility', 'mi-18') + ' 登录验证码</div>'
        + '<div class="setting-desc">开启后，登录/注册/找回密码需要输入图形验证码</div>'
        + '</div>'
        + '<label class="toggle-switch">'
        + '<input type="checkbox" id="toggle-captcha"' + (captchaOn ? ' checked' : '') + ' onchange="PCPages.toggleCaptcha(this.checked)">'
        + '<span class="toggle-slider"></span>'
        + '</label>'
        + '</div>';
    });
  }

  function toggleCaptcha(enabled) {
    API.post('settings/', { captcha_enabled: enabled }).then(function(res) {
      if (res.code === 200) {
        showToast(enabled ? '验证码已启用' : '验证码已禁用');
      } else {
        showToast(res.msg || '操作失败');
        var toggle = document.getElementById('toggle-captcha');
        if (toggle) toggle.checked = !enabled;
      }
    });
  }

  PCPages.loadHome = loadHome;
  PCPages.loadSettings = loadSettings;
  PCPages.toggleCaptcha = toggleCaptcha;
})();
