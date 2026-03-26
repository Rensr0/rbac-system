/**
 * app-home.js v3.2 - 手机端首页模块
 * 从 app.js 拆分出来
 * v3.2: 内联样式迁移到 components.css
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

  function loadPage() {
    var content = document.getElementById('page-home');
    if (!content) return;

    var currentUser = Storage.get('currentUser') || {};
    var isSuper = currentUser.is_super == 1;
    var routerCount = window.AppRouter ? window.AppRouter.userRouters.length : 0;

    if (isSuper) {
      appShowLoading();
      Promise.all([
        API.get('user/', { limit: 1 }),
        API.get('role/', { limit: 100 })
      ]).then(function (results) {
        appHideLoading();
        var userRes = results[0], roleRes = results[1];
        var userTotal = userRes.code === 200 ? (userRes.data && userRes.data.total || 0) : 0;
        var roleTotal = roleRes.code === 200 ? (roleRes.data && roleRes.data.total || 0) : 0;

        content.innerHTML =
          '<div class="app-page-content">'
          + '<div class="app-stats">'
          + '<div class="app-stat-card"><div class="stat-num">' + userTotal + '</div><div class="stat-name">系统用户</div></div>'
          + '<div class="app-stat-card"><div class="stat-num">' + roleTotal + '</div><div class="stat-name">角色数量</div></div>'
          + '<div class="app-stat-card"><div class="stat-num">' + routerCount + '</div><div class="stat-name">可用功能</div></div>'
          + '<div class="app-stat-card"><div class="stat-num">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-name">系统状态</div></div>'
          + '</div>'
          + '<div class="app-card">'
          + '<div class="app-card-header"><h3>' + mi('dashboard') + ' 系统概况</h3></div>'
          + '<div class="text-center p-16-0">'
          + '<div id="app-stats-chart" style="height:240px"></div>'
          + '</div>'
          + '</div>'
          + '<div class="app-card">'
          + '<div class="app-card-header"><h3>' + mi('person') + ' 欢迎回来，' + escapeHtml(currentUser.nickname || currentUser.username) + '</h3></div>'
          + '<div class="home-stat-text">RBAC 权限管理系统 v3.1 运行正常，请通过底部导航栏访问各功能模块。</div>'
          + '</div></div>';

        if (window.ApexCharts) {
          var hasData = [userTotal, roleTotal, routerCount].some(function(v) { return v > 0; });
          var chartOptions = {
            series: hasData ? [userTotal, roleTotal, routerCount] : [1],
            chart: { type: 'donut', height: 240, toolbar: { show: false } },
            labels: hasData ? ['用户', '角色', '路由'] : ['暂无数据'],
            colors: hasData ? ['var(--primary)', 'var(--success)', 'var(--warning)'] : ['#E5E5EA'],
            plotOptions: {
              pie: {
                donut: {
                  size: '65%',
                  labels: {
                    show: true,
                    total: {
                      show: true,
                      label: '总计',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      formatter: function(w) { return w.globals.seriesTotals.reduce(function(a,b){return a+b;}, 0); }
                    }
                  }
                }
              }
            },
            dataLabels: { enabled: false },
            legend: { position: 'bottom', fontSize: '12px', markers: { width: 8, height: 8, radius: 50 } },
            stroke: { width: 0 }
          };
          var chartEl = document.querySelector('#app-stats-chart');
          if (chartEl) {
            var chart = new ApexCharts(chartEl, chartOptions);
            chart.render();
          }
        }
      });
    } else {
      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-stats">'
        + '<div class="app-stat-card"><div class="stat-num">' + routerCount + '</div><div class="stat-name">可用功能</div></div>'
        + '<div class="app-stat-card"><div class="stat-num">' + mi('check_circle', 'mi-lg mi-success') + '</div><div class="stat-name">系统状态</div></div>'
        + '</div>'
        + '<div class="app-card">'
        + '<div class="app-card-header"><h3>' + mi('person') + ' 欢迎回来，' + escapeHtml(currentUser.nickname || currentUser.username) + '</h3></div>'
        + '<div class="home-stat-text">RBAC 权限管理系统 v3.1 运行正常，请通过底部导航栏访问各功能模块。</div>'
        + '</div></div>';
    }
  }

  window.AppHome = {
    load: loadPage
  };

  if (window.registerPage) {
    window.registerPage('home', loadPage);
  }
})();
