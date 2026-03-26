/**
 * modals.js - PC 端弹窗 HTML 模板
 * 动态注入到页面，避免 home.html 膨胀
 */
var ModalTemplates = (function () {

  var html =
    // 用户弹窗
    '<div class="modal-overlay" id="modal-user">'
    + '<div class="modal">'
    + '<div class="modal-header"><h3 id="modal-user-title">新增用户</h3><button class="modal-close" onclick="closeModal(\'modal-user\')">✕</button></div>'
    + '<div class="modal-body">'
    + '<input type="hidden" id="form-user-id">'
    + '<div class="form-group"><label class="form-label">账号</label><input class="form-input" id="form-user-username" placeholder="字母数字下划线，2-50位"></div>'
    + '<div class="form-group"><label class="form-label">密码</label><input class="form-input" type="password" id="form-user-password" placeholder="默认 123456"></div>'
    + '<div class="form-group"><label class="form-label">昵称</label><input class="form-input" id="form-user-nickname" placeholder="请输入昵称"></div>'
    + '<div class="form-group"><label class="form-label">邮箱</label><input class="form-input" id="form-user-email" placeholder="选填"></div>'
    + '<div class="form-group"><label class="form-label">手机</label><input class="form-input" id="form-user-phone" placeholder="选填"></div>'
    + '<div class="form-group hidden" id="form-user-status-group"><label class="form-label">状态</label><select class="form-input" id="form-user-status"><option value="1">正常</option><option value="0">禁用</option></select></div>'
    + '<div class="form-group"><label class="form-label">分配角色</label>'
    + '<input class="form-input" type="text" id="form-user-role-search" placeholder="搜索角色..." oninput="filterRoleList(this.value)" class="mb-8">'
    + '<div class="tree-selector" id="form-user-roles"></div></div>'
    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-outline" onclick="closeModal(\'modal-user\')">取消</button>'
    + '<button class="btn btn-primary" onclick="PCPages.saveUser()">保存</button>'
    + '</div></div></div>'

    // 角色弹窗
    + '<div class="modal-overlay" id="modal-role">'
    + '<div class="modal">'
    + '<div class="modal-header"><h3 id="modal-role-title">新增角色</h3><button class="modal-close" onclick="closeModal(\'modal-role\')">✕</button></div>'
    + '<div class="modal-body">'
    + '<input type="hidden" id="form-role-id">'
    + '<div class="form-group"><label class="form-label">角色名称</label><input class="form-input" id="form-role-name" placeholder="请输入角色名称"></div>'
    + '<div class="form-group"><label class="form-label">备注</label><input class="form-input" id="form-role-remark" placeholder="选填"></div>'
    + '<div class="form-group"><label class="form-label">绑定权限</label>'
    + '<input class="form-input" type="text" id="form-role-router-search" placeholder="搜索权限..." oninput="filterRouterList(this.value)" class="mb-8">'
    + '<div class="tree-selector" id="form-role-routers"></div></div>'
    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-outline" onclick="closeModal(\'modal-role\')">取消</button>'
    + '<button class="btn btn-primary" onclick="PCPages.saveRole()">保存</button>'
    + '</div></div></div>'

    // 路由弹窗
    + '<div class="modal-overlay" id="modal-router">'
    + '<div class="modal">'
    + '<div class="modal-header"><h3 id="modal-router-title">新增路由</h3><button class="modal-close" onclick="closeModal(\'modal-router\')">✕</button></div>'
    + '<div class="modal-body">'
    + '<input type="hidden" id="form-router-id">'
    + '<div class="form-group"><label class="form-label">路由名称</label><input class="form-input" id="form-router-name" placeholder="如：用户管理"></div>'
    + '<div class="form-group"><label class="form-label">路由路径</label><input class="form-input" id="form-router-path" placeholder="如：user（字母数字短横线）"></div>'
    + '<div class="form-group"><label class="form-label">图标（Material Icons）</label><div id="form-router-icon-wrap"></div></div>'
    + '<div class="form-group"><label class="form-label">排序</label><input class="form-input" type="number" id="form-router-sort" value="0" min="0"></div>'
    + '<div class="form-group"><label class="form-label">状态</label><select class="form-input" id="form-router-status"><option value="1">启用</option><option value="0">禁用</option></select></div>'
    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn btn-outline" onclick="closeModal(\'modal-router\')">取消</button>'
    + '<button class="btn btn-primary" onclick="PCPages.saveRouter()">保存</button>'
    + '</div></div></div>';

  function inject() {
    var container = document.getElementById('modal-container');
    if (container) container.innerHTML = html;
  }

  return { inject: inject };
})();

// ==================== 列表搜索过滤 ====================
window.filterRoleList = function(keyword) {
  SharedUtils.filterRoleList(keyword, 'form-user-roles');
};

window.filterRouterList = function(keyword) {
  SharedUtils.filterRouterList(keyword, 'form-role-routers');
};
