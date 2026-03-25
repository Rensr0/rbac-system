-- ============================================
-- RBAC 权限管理系统 v1.0 - 数据库初始化脚本
-- 适用：MySQL 5.7+ / 8.0+
-- 默认超级管理员：admin / 123456
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 管理员用户表
-- ----------------------------
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL DEFAULT '' COMMENT '登录账号',
  `password` varchar(255) NOT NULL DEFAULT '' COMMENT '加密密码(bcrypt)',
  `nickname` varchar(50) NOT NULL DEFAULT '' COMMENT '昵称',
  `avatar` varchar(255) NOT NULL DEFAULT '' COMMENT '头像URL',
  `email` varchar(100) NOT NULL DEFAULT '' COMMENT '邮箱',
  `phone` varchar(20) NOT NULL DEFAULT '' COMMENT '手机号',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态:1-正常 0-禁用',
  `is_super` tinyint(1) NOT NULL DEFAULT 0 COMMENT '超级管理员:1-是 0-否',
  `last_login` datetime DEFAULT NULL COMMENT '最后登录时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员用户表';

-- 默认超级管理员 (密码: 123456, bcrypt)
-- 注意：此处使用 password_hash('123456', PASSWORD_BCRYPT) 预计算的值
INSERT INTO `admin_users` (`id`, `username`, `password`, `nickname`, `status`, `is_super`) VALUES
(1, 'admin', '$2y$10$rxwxpU4WYgjiNQ60kJKnzOH2gs1DgxImLDeMdCGKmMfn4ej0bsx5y', '超级管理员', 1, 1);

-- ----------------------------
-- 角色表
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL DEFAULT '' COMMENT '角色名称',
  `remark` varchar(255) NOT NULL DEFAULT '' COMMENT '角色备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

INSERT INTO `roles` (`id`, `role_name`, `remark`) VALUES
(1, '超级管理员', '系统最高权限，拥有所有功能'),
(2, '普通管理员', '基本管理权限'),
(3, '运营人员', '日常运营管理权限');

-- ----------------------------
-- 路由/权限页面表
-- ----------------------------
DROP TABLE IF EXISTS `routers`;
CREATE TABLE `routers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `router_name` varchar(50) NOT NULL DEFAULT '' COMMENT '路由名称',
  `router_path` varchar(100) NOT NULL DEFAULT '' COMMENT '页面路径',
  `icon` varchar(50) NOT NULL DEFAULT '' COMMENT '菜单图标',
  `sort` int(11) NOT NULL DEFAULT 0 COMMENT '排序(越小越靠前)',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态:1-启用 0-禁用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_path` (`router_path`),
  KEY `idx_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='路由权限页面表';

INSERT INTO `routers` (`id`, `router_name`, `router_path`, `icon`, `sort`, `status`) VALUES
(1, '系统首页', 'home', 'home', 1, 1),
(2, '用户管理', 'user', 'group', 2, 1),
(3, '角色管理', 'role', 'security', 3, 1),
(4, '路由管理', 'router', 'route', 4, 1),
(5, '个人中心', 'mine', 'account_circle', 5, 1);

-- ----------------------------
-- 角色-路由关联表（含权限细分）
-- permissions: 位掩码 1=查看 2=编辑 4=删除，7=全部权限
-- ----------------------------
DROP TABLE IF EXISTS `role_router`;
CREATE TABLE `role_router` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL DEFAULT 0 COMMENT '角色ID',
  `router_id` int(11) NOT NULL DEFAULT 0 COMMENT '路由ID',
  `permissions` int(11) NOT NULL DEFAULT 1 COMMENT '权限位掩码:1=查看 2=编辑 4=删除 7=全部',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_router` (`role_id`, `router_id`),
  KEY `idx_router_id` (`router_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色路由关联表';

INSERT INTO `role_router` (`role_id`, `router_id`, `permissions`) VALUES
(1, 1, 7), (1, 2, 7), (1, 3, 7), (1, 4, 7), (1, 5, 7),
(2, 1, 7), (2, 2, 3), (2, 5, 7),
(3, 1, 7), (3, 2, 1), (3, 5, 7);

-- ----------------------------
-- 用户-角色关联表
-- ----------------------------
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT 0 COMMENT '用户ID',
  `role_id` int(11) NOT NULL DEFAULT 0 COMMENT '角色ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

INSERT INTO `user_role` (`user_id`, `role_id`) VALUES (1, 1);

-- ----------------------------
-- 操作日志表
-- ----------------------------
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT 0 COMMENT '操作人ID',
  `username` varchar(50) NOT NULL DEFAULT '' COMMENT '操作人账号',
  `action` varchar(50) NOT NULL DEFAULT '' COMMENT '操作类型',
  `detail` varchar(500) NOT NULL DEFAULT '' COMMENT '操作详情',
  `ip` varchar(45) NOT NULL DEFAULT '' COMMENT 'IP地址',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- ----------------------------
-- 系统设置表
-- ----------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL DEFAULT '' COMMENT '设置键名',
  `setting_value` text COMMENT '设置值',
  `setting_type` varchar(20) NOT NULL DEFAULT 'string' COMMENT '类型:string/int/bool',
  `label` varchar(100) NOT NULL DEFAULT '' COMMENT '显示名称',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表';

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `label`) VALUES
('captcha_enabled', '1', 'bool', '登录验证码');

SET FOREIGN_KEY_CHECKS = 1;
