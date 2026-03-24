# RBAC 权限管理系统 v1.0

> 前后端分离 · 动态角色/路由/权限 · 三端自适应（PC + Pad + 手机原生APP风格）· 企业级安全

## 📋 系统概述

RBAC 权限管理系统是一个基于 PHP + MySQL + 原生 JavaScript 的企业级权限管理解决方案。系统采用前后端分离架构，支持动态角色管理、动态路由权限配置，完美适配 PC、Pad 和手机三种设备。

### 核心特性
- ✅ **动态角色管理** — 自由创建/编辑/删除角色，无数量限制
- ✅ **动态路由权限** — 自由添加系统页面路由，全数据库配置
- ✅ **RBAC 三级权限** — 用户 → 角色 → 路由，细粒度控制
- ✅ **前端权限拦截** — 无权限的页面自动隐藏
- ✅ **后端接口校验** — 防止非法 API 访问
- ✅ **PC 端管理后台** — 经典侧边栏 + 表格 + 弹窗
- ✅ **Pad 端自适应** — 侧边栏折叠 + 响应式网格
- ✅ **手机原生 APP 风格** — 沉浸式状态栏 + 5 宫格 TabBar + 卡片布局 + ActionSheet + 原生弹窗
- ✅ **操作日志** — 用户操作审计追溯
- ✅ **bcrypt 密码加密** — 兼容旧 MD5 密码自动升级

---

## 🚀 快速部署

### 1. 环境要求
- PHP >= 7.4（推荐 8.0+）
- MySQL >= 5.7（推荐 8.0+）
- Apache / Nginx

### 2. 部署步骤
1. 将 `rbac-system` 目录上传至网站根目录
2. 创建 MySQL 数据库（如 `rbac_system`）
3. 导入 `install.sql` 到数据库
4. 复制 `.env.example` 为 `.env` 并修改数据库连接信息
5. 配置 Web 服务器（Apache 使用 `.htaccess`，Nginx 使用 `nginx.conf`）
6. 浏览器访问 `index.html`，自动适配 PC / Pad / 手机

### 3. 默认管理员
- 账号：`admin`
- 密码：`123456`
- ⚠️ **首次登录后请立即修改密码**

---

## 📁 目录结构

```
rbac-system/
├── .htaccess                 # Apache 安全配置（目录保护、缓存、安全头）
├── nginx.conf                # Nginx 配置文件
├── .env.example              # 环境变量配置示例
├── .gitignore               # Git 忽略规则
├── index.html                # 入口（三端自适应登录页）
├── install.sql               # MySQL 数据库脚本（6张表 + 初始数据）
├── README.md
├── api/                      # PHP 接口服务
│   ├── logs/                # 错误日志目录（自动创建）
│   ├── config/database.php   # 数据库配置（支持环境变量）
│   ├── common.php            # 公共方法、权限验证、安全加固
│   ├── login/index.php       # 登录/退出/状态检查
│   ├── user/index.php        # 用户 CRUD + 角色分配 + 改密码
│   ├── role/index.php        # 角色 CRUD + 权限绑定
│   └── router/index.php      # 路由 CRUD + 用户权限查询
├── pages/
│   ├── home.html             # 主控页面（PC 侧边栏 + 手机 TabBar，全自动切换）
│   ├── user.html            # 用户管理页（跳转）
│   ├── role.html            # 角色管理页（跳转）
│   ├── router.html          # 路由管理页（跳转）
│   └── mine.html           # 个人中心页（跳转）
└── assets/
    ├── css/
    │   ├── global.css        # 全局组件样式（按钮、表单、表格、弹窗、Toast）
    │   ├── pc.css            # PC/Pad 管理后台布局（侧边栏、顶栏、响应式）
    │   ├── app.css           # 手机原生 APP 风格（沉浸式、TabBar、ActionSheet…）
    │   └── themes.css       # 主题切换样式
    └── js/
        ├── core.js           # AJAX 请求库 + UI 组件 + 工具函数
        ├── theme-switcher.js  # 主题切换功能
        ├── app.js            # 手机端 APP 路由栈 + 全部页面逻辑
        └── version.js       # 版本配置文件
```

---

## ⚙️ 配置说明

### 环境变量配置 (.env)
复制 `.env.example` 为 `.env`，根据实际情况修改：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rbac_system
DB_USER=root
DB_PASS=your_secure_password_here

# 应用配置
APP_ENV=production      # production 或 development
APP_DEBUG=false        # 生产环境设为 false

# 时区
TIMEZONE=Asia/Shanghai

# Session 配置
SESSION_LIFETIME=7200

# CORS 配置（生产环境请设置实际域名）
ALLOWED_ORIGINS=http://localhost,http://127.0.0.1
```

### 调试模式
在 `.env` 中设置 `APP_DEBUG=true` 可查看详细错误信息（仅开发环境使用）

### 日志文件
- PHP 错误日志：`api/logs/php-error.log`
- 日志目录会自动创建，无需手动创建

---

## 🔐 安全特性

| 特性 | 说明 |
|------|------|
| bcrypt 密码加密 | 替代 MD5，自动升级旧密码 |
| Session 安全 | httponly / samesite / strict_mode / 再生 ID |
| 安全响应头 | X-Frame-Options / X-Content-Type-Options / CSP |
| CORS 白名单 | 替代通配符 *，限制来源域 |
| PDO 预处理 | 防 SQL 注入 |
| XSS 输出转义 | 前后端双重转义 |
| 输入验证 | 用户名格式 / 密码长度 / 邮箱格式 / 路径格式 |
| .htaccess 保护 | 禁止访问 .sql / .md / database.php 等敏感文件 |
| 时序攻击防护 | 登录失败随机延迟 |
| 自删保护 | 不可删除当前登录账号 / 超级管理员 |
| 操作日志 | 全链路操作审计 |
| Apache 安全头 | Gzip 压缩 + 静态资源缓存 |

---

## 📡 接口规范

```
GET    /api/{module}/           获取列表/详情
POST   /api/{module}/           新增
PUT    /api/{module}/           编辑
DELETE /api/{module}/           删除
```

响应格式：
```json
{ "code": 200, "msg": "操作成功", "data": {} }
```

状态码：200 成功 | 401 未登录 | 403 无权限 | 404 不存在 | 500 错误

---

## 🗄️ 数据库表（6 张）

| 表名 | 说明 |
|------|------|
| admin_users | 管理员用户（bcrypt 密码、最后登录时间） |
| roles | 角色（动态创建） |
| routers | 路由权限页面（动态配置） |
| role_router | 角色-路由关联 |
| user_role | 用户-角色关联 |
| operation_logs | 操作日志（审计） |

---

## 🛠️ 扩展开发

- **新增页面**：直接在 `routers` 表添加路由即可自动出现在菜单
- **新增接口**：引入 `common.php`，自动获得权限验证和安全加固
- **打包 APP**：使用 WebView 套壳可直接打包为 APK / IPA
- **二次开发**：所有代码无框架依赖，纯原生 PHP + HTML + JS

---

## 📄 License

MIT License — 可自由商用、修改、分发
