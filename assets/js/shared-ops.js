/**
 * shared-ops.js - PC/手机端共享业务操作
 * 用户、角色、路由的 CRUD 操作统一入口
 */
var SharedOps = (function () {
  'use strict';

  // ==================== 用户操作 ====================

  function addUser(data, cb) {
    API.post('user/', {
      username: data.username,
      password: data.password || '123456',
      nickname: data.nickname || '',
      email: data.email || '',
      phone: data.phone || '',
      role_ids: data.role_ids || []
    }).then(function (res) { cb(res); });
  }

  function updateUser(id, data, cb) {
    API.post('user/', {
      action: 'update', id: id,
      nickname: data.nickname,
      email: data.email,
      phone: data.phone,
      status: data.status
    }).then(function (res) { cb(res); });
  }

  function updateUserRoles(userId, roleIds, cb) {
    API.post('user/', {
      action: 'roles', user_id: userId, role_ids: roleIds
    }).then(function (res) { cb(res); });
  }

  function deleteUser(id, cb) {
    API.post('user/', { action: 'delete', id: id }).then(function (res) { cb(res); });
  }

  function getUserDetail(id, cb) {
    API.get('user/', { action: 'detail', id: id }).then(function (res) { cb(res); });
  }

  function searchUsers(keyword, page, limit, cb) {
    API.get('user/', { keyword: keyword, page: page || 1, limit: limit || 20 }).then(function (res) { cb(res); });
  }

  function updateProfile(data, cb) {
    API.post('user/', {
      action: 'profile',
      nickname: data.nickname,
      email: data.email,
      phone: data.phone
    }).then(function (res) { cb(res); });
  }

  function changePassword(oldPwd, newPwd, cb) {
    API.post('user/', {
      action: 'password',
      old_password: oldPwd,
      new_password: newPwd
    }).then(function (res) { cb(res); });
  }

  function batchUpdateStatus(ids, status, cb) {
    API.post('user/', {
      action: 'batch_status',
      ids: ids,
      status: status
    }).then(function (res) { cb(res); });
  }

  // ==================== 角色操作 ====================

  function getRoles(limit, cb) {
    API.get('role/', { limit: limit || 100 }).then(function (res) { cb(res); });
  }

  function addRole(data, cb) {
    var postData = {
      role_name: data.role_name,
      remark: data.remark || ''
    };
    // 新格式：router_perms
    if (data.router_perms) {
      postData.router_perms = data.router_perms;
    } else if (data.router_ids) {
      postData.router_ids = data.router_ids;
    }
    API.post('role/', postData).then(function (res) { cb(res); });
  }

  function updateRole(id, data, cb) {
    API.post('role/', {
      action: 'update', id: id,
      role_name: data.role_name,
      remark: data.remark
    }).then(function (res) { cb(res); });
  }

  function updateRoleRouters(roleId, routerPerms, cb) {
    // routerPerms: [{ router_id, perms: ['view','edit','delete'] }, ...]
    API.post('role/', {
      action: 'routers', role_id: roleId, router_perms: routerPerms
    }).then(function (res) { cb(res); });
  }

  function deleteRole(id, cb) {
    API.post('role/', { action: 'delete', id: id }).then(function (res) { cb(res); });
  }

  // ==================== 路由操作 ====================

  function getRouters(cb) {
    API.get('router/').then(function (res) { cb(res); });
  }

  function getUserRouters(cb) {
    API.get('router/', { action: 'user' }).then(function (res) { cb(res); });
  }

  function addRouter(data, cb) {
    API.post('router/', {
      action: 'add',
      router_name: data.router_name,
      router_path: data.router_path,
      icon: data.icon || 'description',
      sort: data.sort || 0,
      status: data.status || 1
    }).then(function (res) { cb(res); });
  }

  function updateRouter(id, data, cb) {
    var postData = { action: 'edit', id: id };
    if (data.router_name !== undefined) postData.router_name = data.router_name;
    if (data.router_path !== undefined) postData.router_path = data.router_path;
    if (data.icon !== undefined) postData.icon = data.icon;
    if (data.sort !== undefined) postData.sort = data.sort;
    if (data.status !== undefined) postData.status = data.status;
    API.post('router/', postData).then(function (res) { cb(res); });
  }

  function deleteRouter(id, cb) {
    API.post('router/', { action: 'delete', id: id }).then(function (res) { cb(res); });
  }

  // ==================== 日志操作 ====================

  function getLogs(keyword, page, limit, action, cb) {
    var params = { keyword: keyword || '', page: page || 1, limit: limit || 20 };
    if (action) params.log_action = action;
    API.get('log/', params).then(function (res) { cb(res); });
  }

  // ==================== 导出 ====================
  return {
    user: {
      add: addUser,
      update: updateUser,
      updateRoles: updateUserRoles,
      delete: deleteUser,
      detail: getUserDetail,
      search: searchUsers,
      updateProfile: updateProfile,
      changePassword: changePassword,
      batchUpdateStatus: batchUpdateStatus
    },
    role: {
      list: getRoles,
      add: addRole,
      update: updateRole,
      updateRouters: updateRoleRouters,
      delete: deleteRole
    },
    router: {
      list: getRouters,
      userRouters: getUserRouters,
      add: addRouter,
      update: updateRouter,
      delete: deleteRouter
    },
    log: {
      search: getLogs
    }
  };
})();
