/**
 * pc-pages.js v4.0 - PC 端页面模块加载器
 * 原单文件已拆分为：
 *   pc-core.js   — 共享状态与初始化
 *   pc-home.js   — 首页 + 系统设置
 *   pc-users.js  — 用户管理 + 批量操作 + CSV
 *   pc-roles.js  — 角色管理 + 权限联动
 *   pc-routers.js— 路由管理
 *   pc-logs.js   — 操作日志
 *   pc-mine.js   — 个人中心
 * 此文件保留空壳以兼容未更新的引用。
 */
// PCPages 由 pc-core.js 创建，各页面模块自行挂载方法
// 如果未加载 pc-core.js（向后兼容），在此创建
if (typeof window.PCPages === 'undefined') {
  window.PCPages = {};
}
