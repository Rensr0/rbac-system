/**
 * app-logs.js v3.1 - 手机端日志管理模块
 * 从 app.js 拆分出来
 */
(function () {
  'use strict';

  if (window.innerWidth > 768) return;

  var _logPage = 1;
  var _logTotalPages = 1;
  var _logKeyword = '';
  var _scrollCtrl = null;

  function loadPage() {
    var content = document.getElementById('page-log');
    if (!content) return;

    var isSuper = (Storage.get('currentUser') || {}).is_super == 1;
    _logPage = 1;
    _logTotalPages = 1;
    _logKeyword = '';

    appShowLoading();
    SharedOps.log.search('', 1, 20, '', function(res) {
      appHideLoading();
      if (res.code !== 200) { appToast(res.msg); return; }

      var data = res.data || {};
      var list = data.list || [];
      var total = data.total || 0;
      _logTotalPages = Math.ceil(total / 20) || 1;

      content.innerHTML =
        '<div class="app-page-content">'
        + '<div class="app-search">'
        + '<span class="search-icon">' + mi('search', 'mi-18') + '</span>'
        + '<input type="text" placeholder="搜索操作人或详情" id="log-search" onkeyup="if(event.key===\'Enter\')AppLogs.search()">'
        + '</div>'
        + '<div id="log-list">'
        + (list.length === 0 ? '<div class="empty-state"><div class="empty-icon">' + mi('inbox', 'mi-xl') + '</div><p>暂无日志数据</p></div>' : '')
        + list.map(function(l) {
          return '<div class="app-card" style="margin-bottom:8px;padding:12px">'
            + '<div style="display:flex;justify-content:space-between;align-items:center">'
            + '<div style="font-size:14px;font-weight:500">' + escapeHtml(l.username) + '</div>'
            + '<span class="badge badge-info" style="font-size:10px">' + (SharedUtils.actionMap[l.action] || l.action) + '</span>'
            + '</div>'
            + '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">' + escapeHtml(l.detail || '无详情') + '</div>'
            + '<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;display:flex;justify-content:space-between">'
            + '<span>' + escapeHtml(l.ip) + '</span>'
            + '<span>' + formatDate(l.create_time) + '</span>'
            + '</div></div>';
        }).join('')
        + '</div>'
        + '</div>';

      if (_logTotalPages > 1) {
        var listEl = document.getElementById('log-list');
        _scrollCtrl = SharedUtils.SharedUtils.setupInfiniteScroll(listEl, function (done) {
          _logPage++;
          SharedOps.log.search(_logKeyword, _logPage, 20, '', function (r) {
            if (r.code !== 200) { done(false); return; }
            var items = (r.data || {}).list || [];
            if (items.length === 0) { done(false); return; }
            var html = items.map(function(l) {
              return '<div class="app-card" style="margin-bottom:8px;padding:12px">'
                + '<div style="display:flex;justify-content:space-between;align-items:center">'
                + '<div style="font-size:14px;font-weight:500">' + escapeHtml(l.username) + '</div>'
                + '<span class="badge badge-info" style="font-size:10px">' + (SharedUtils.actionMap[l.action] || l.action) + '</span>'
                + '</div>'
                + '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">' + escapeHtml(l.detail || '无详情') + '</div>'
                + '<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;display:flex;justify-content:space-between">'
                + '<span>' + escapeHtml(l.ip) + '</span>'
                + '<span>' + formatDate(l.create_time) + '</span>'
                + '</div></div>';
            }).join('');
            var sentinel = listEl.querySelector('.scroll-sentinel');
            var tmp = document.createElement('div');
            tmp.innerHTML = html;
            while (tmp.firstChild) {
              listEl.insertBefore(tmp.firstChild, sentinel);
            }
            done(_logPage < _logTotalPages);
          });
        });
      }
    });
  }

  function searchLogs() {
    var kw = document.getElementById('log-search') ? document.getElementById('log-search').value : '';
    _logKeyword = kw;
    appShowLoading();
    SharedOps.log.search(kw, 1, 20, '', function(res) {
      appHideLoading();
      if (res.code !== 200) return;
      var data = res.data || {};
      var list = data.list || [];
      var total = data.total || 0;
      var container = document.getElementById('log-list');
      if (container) {
        var oldSentinel = container.querySelector('.scroll-sentinel');
        if (oldSentinel) oldSentinel.remove();

        container.innerHTML = list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">' + mi('search_off', 'mi-xl') + '</div><p>未找到日志</p></div>'
          : list.map(function(l) {
            return '<div class="app-card" style="margin-bottom:8px;padding:12px">'
              + '<div style="display:flex;justify-content:space-between;align-items:center">'
              + '<div style="font-size:14px;font-weight:500">' + escapeHtml(l.username) + '</div>'
              + '<span class="badge badge-info" style="font-size:10px">' + (SharedUtils.actionMap[l.action] || l.action) + '</span>'
              + '</div>'
              + '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">' + escapeHtml(l.detail || '无详情') + '</div>'
              + '<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;display:flex;justify-content:space-between">'
              + '<span>' + escapeHtml(l.ip) + '</span>'
              + '<span>' + formatDate(l.create_time) + '</span>'
              + '</div></div>';
          }).join('');

        var totalPages = Math.ceil(total / 20) || 1;
        if (totalPages > 1) {
          _logPage = 1;
          SharedUtils.setupInfiniteScroll(container, function (done) {
            _logPage++;
            SharedOps.log.search(kw, _logPage, 20, '', function (r) {
              if (r.code !== 200) { done(false); return; }
              var items = (r.data || {}).list || [];
              if (items.length === 0) { done(false); return; }
              var html = items.map(function(l) {
                return '<div class="app-card" style="margin-bottom:8px;padding:12px">'
                  + '<div style="display:flex;justify-content:space-between;align-items:center">'
                  + '<div style="font-size:14px;font-weight:500">' + escapeHtml(l.username) + '</div>'
                  + '<span class="badge badge-info" style="font-size:10px">' + (SharedUtils.actionMap[l.action] || l.action) + '</span>'
                  + '</div>'
                  + '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">' + escapeHtml(l.detail || '无详情') + '</div>'
                  + '<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;display:flex;justify-content:space-between">'
                  + '<span>' + escapeHtml(l.ip) + '</span>'
                  + '<span>' + formatDate(l.create_time) + '</span>'
                  + '</div></div>';
              }).join('');
              var sentinel = container.querySelector('.scroll-sentinel');
              var tmp = document.createElement('div');
              tmp.innerHTML = html;
              while (tmp.firstChild) {
                container.insertBefore(tmp.firstChild, sentinel);
              }
              done(_logPage < totalPages);
            });
          });
        }
      }
    });
  }

  window.AppLogs = {
    load: loadPage,
    search: searchLogs
  };

  if (window.registerPage) {
    window.registerPage('log', loadPage);
  }
})();
