# RBAC 权限管理系统 v3.4

> 前后端分离 · 动态角色/路由/权限 · 三端自适应 · 模块化架构

## 📋 系统概述

RBAC 权限管理系统是一个基于 PHP + MySQL + 原生 JavaScript 的企业级权限管理解决方案。支持动态角色管理、动态路由权限配置，PC / Pad / 手机三端自适应。

### v3.4 更新
- 🐛 **修复移动端用户管理 404** — app-users.js 残留旧代码导致语法错误，window.AppUsers 未定义
- 🐛 **修复 PC 端角色编辑权限复选框不预选** — shared-utils.js 位运算与数组类型不匹配
- 🐛 **修复移动端 404 页面残留** — 导航时清除目标页面旧内容，防止叠加显示
- 🐛 **修复 app-logs.js 双重引用** — SharedUtils.SharedUtils 修正为 SharedUtils
- ✅ **全面 PC + 移动端测试验证** — 所有管理模块功能完整可用

### v3.3 更新
- ✅ **代码模块化重构** — app.js 拆分为 7 个独立模块
- ✅ **PC 端模块化拆分** — pc-pages.js 拆分为 pc-core/home/users/roles/routers/logs/mine
- ✅ **PC/移动端共用函数抽取** — 创建 shared-utils.js / shared-ops.js，消除代码重复
- ✅ **全局变量命名空间迁移** — UI、Utils 命名空间，减少 window 污染
- ✅ **CSS 硬编码色值清理** — 统一使用 CSS 变量，支持主题切换

### v3.0 更新
- ✅ **手机端导航完全动态化** — TabBar、页面容器、标题均由 API 路由数据驱动
- ✅ **模块化拆分** — home.html 从 600+ 行拆为轻量 shell
- ✅ **现代化 UI** — 毛玻璃效果、微交互动画、渐变装饰、弹性缓动
- ✅ **操作审计日志** — 全链路操作记录与分页查询
- ✅ **三级权限** — 查看 / 编辑 / 删除细粒度控制
- ✅ **CSV 导入导出** — 用户数据批量管理
- ✅ **暗色主题** — 6 套配色 + 全组件暗色适配
- ✅ **键盘快捷键** — Ctrl+K 搜索、Esc 关闭弹窗

---

## 🚀 快速部署

### 环境要求
- PHP >= 7.4（推荐 8.0+）
- MySQL >= 5.7（推荐 8.0+）
- Apache / Nginx

### 部署步骤
1. 将项目上传至网站根目录
2. 创建 MySQL 数据库（如 `rbac_system`）
3. 导入 `install.sql` 到数据库
4. 复制 `.env.example` 为 `.env` 并修改数据库连接信息
5. 配置 Web 服务器（Apache 用 `.htaccess`，Nginx 用 `nginx.conf`）
6. 浏览器访问 `index.html`

### 默认管理员
- 账号：`admin`
- 密码：`123456`
- ⚠️ 首次登录后请立即修改密码

---

## 📁 目录结构

```
rbac-system/
├── index.html                  # 三端自适应登录页
├── install.sql                 # MySQL 数据库脚本
├── migrate.php                 # 数据库迁移工具
├── .env.example                # 环境变量配置示例
├── FUTURE_PLAN.md              # 开发计划与改进建议
├── api/                        # PHP 接口服务
│   ├── config/database.php     # 数据库连接
│   ├── common.php              # 公共方法、权限验证、安全加固
│   ├── login/index.php         # 登录/注册/退出/找回密码
│   ├── user/index.php          # 用户 CRUD + 角色分配 + 改密码
│   ├── role/index.php          # 角色 CRUD + 权限绑定
│   ├── router/index.php        # 路由 CRUD + 用户权限查询
│   ├── log/index.php           # 操作日志查询
│   └── settings/index.php      # 系统设置（验证码开关等）
├── pages/
│   └── home.html               # 轻量 shell（仅布局 + 脚本引用）
└── assets/
    ├── css/
    │   ├── global.css          # 全局组件（按钮、表单、表格、弹窗）
    │   ├── pc.css              # PC/Pad 管理后台布局
    │   ├── app.css             # 手机 APP 风格（沉浸式、TabBar、ActionSheet）
    │   ├── themes.css          # 6 套主题配色 + 暗色模式
    │   └── material-icons.css  # Material Icons 字体
    └── js/
        ├── core.js             # AJAX + UI 组件 + 工具函数
        ├── shared-ops.js       # PC/移动端共用 API 操作
        ├── shared-utils.js     # PC/移动端共用工具函数
        ├── theme-switcher.js   # 主题切换（6 套配色）
        ├── modals.js           # PC 端弹窗模板
        ├── version.js          # 版本号
        ├── app-core.js         # 手机端核心路由系统
        ├── app-home.js         # 手机端首页模块
        ├── app-users.js        # 手机端用户管理模块
        ├── app-roles.js        # 手机端角色管理模块
        ├── app-routers.js      # 手机端路由管理模块
        ├── app-mine.js         # 手机端个人中心模块
        ├── app-logs.js         # 手机端日志管理模块
        ├── pc-core.js          # PC 端共享状态
        ├── pc-home.js          # PC 端首页 + 系统设置
        ├── pc-users.js         # PC 端用户管理
        ├── pc-roles.js         # PC 端角色管理
        ├── pc-routers.js       # PC 端路由管理
        ├── pc-logs.js          # PC 端操作日志
        ├── pc-mine.js          # PC 端个人中心
        └── pc-pages.js         # PC 端入口（向后兼容）
```

---

## 🔐 安全特性

| 特性 | 说明 |
|------|------|
| bcrypt 密码加密 | 自动升级旧 MD5 密码 |
| Session 安全 | httponly / samesite / strict_mode / 再生 ID |
| PDO 预处理 | 防 SQL 注入 |
| XSS 输出转义 | 前后端双重转义 |
| 输入验证 | 用户名格式 / 密码长度 / 邮箱格式 |
| 时序攻击防护 | 登录失败随机延迟 |
| 操作日志 | 全链路审计，支持搜索/分页 |

---

## 🛠️ 扩展开发

- **新增页面**：在 `routers` 表添加路由 → 手机端自动出现在 TabBar
- **注册加载器**：使用 `registerPage('path', function() {...})` 注册手机端页面逻辑
- **PC 端扩展**：在 `PCPages` 命名空间中添加方法
- **新增接口**：引入 `common.php`，自动获得权限验证和安全加固

---

## 📄 License

MIT License
