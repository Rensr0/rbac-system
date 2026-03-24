# RBAC 权限管理系统 v2.0

> 前后端分离 · 动态角色/路由/权限 · 三端自适应 · 模块化架构

## 📋 系统概述

RBAC 权限管理系统是一个基于 PHP + MySQL + 原生 JavaScript 的企业级权限管理解决方案。支持动态角色管理、动态路由权限配置，PC / Pad / 手机三端自适应。

### v2.0 更新
- ✅ **手机端导航完全动态化** — TabBar、页面容器、标题均由 API 路由数据驱动，新增路由自动加载
- ✅ **模块化拆分** — `home.html` 从 600+ 行拆为轻量 shell，PC 逻辑 → `pc-pages.js`，弹窗 → `modals.js`
- ✅ **现代化 UI** — 毛玻璃效果、微交互动画、渐变装饰、弹性缓动
- ✅ **Bug 修复** — confirmDialog PC 端动画修复、日期格式化 NaN 处理、可选链兼容性

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
├── index.html                # 三端自适应登录页
├── install.sql               # MySQL 数据库脚本
├── .env.example              # 环境变量配置示例
├── api/                      # PHP 接口服务
│   ├── config/database.php
│   ├── common.php            # 公共方法、权限验证、安全加固
│   ├── login/index.php       # 登录/退出/状态检查
│   ├── user/index.php        # 用户 CRUD + 角色分配 + 改密码
│   ├── role/index.php        # 角色 CRUD + 权限绑定
│   └── router/index.php      # 路由 CRUD + 用户权限查询
├── pages/
│   └── home.html             # 轻量 shell（仅布局 + 脚本引用）
└── assets/
    ├── css/
    │   ├── global.css        # 全局组件（按钮、表单、表格、弹窗）
    │   ├── pc.css            # PC/Pad 管理后台布局
    │   ├── app.css           # 手机 APP 风格（沉浸式、TabBar、ActionSheet）
    │   └── themes.css        # 6 套主题配色
    └── js/
        ├── core.js           # AJAX + UI 组件 + 工具函数
        ├── theme-switcher.js  # 主题切换
        ├── app.js            # 手机端路由系统（动态 TabBar + 页面加载器）
        ├── pc-pages.js       # PC 端页面渲染逻辑
        ├── modals.js         # PC 端弹窗模板
        └── version.js        # 版本号
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
| 操作日志 | 全链路审计 |

---

## 🛠️ 扩展开发

- **新增页面**：在 `routers` 表添加路由 → 手机端自动出现在 TabBar + 首页快捷操作
- **注册加载器**：在 `app.js` 中使用 `registerPage('path', function() {...})` 注册页面渲染逻辑
- **新增接口**：引入 `common.php`，自动获得权限验证和安全加固

---

## 📄 License

MIT License
