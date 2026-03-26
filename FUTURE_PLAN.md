# RBAC 权限管理系统 — 未来开发计划与改进建议

> 基于 2026-03-25 的全面用户视角测试体验撰写
> 测试环境：https://panel.shixis.site
> 最近更新：2026-03-26 11:15 GMT+8（第十七轮 — 会话安全与暗色模式修复）

---

## 一、已完成的修复与优化（v3.0.x）

### 1.1 基础修复（第一轮）

| # | 问题 | 提交 |
|---|------|------|
| 1 | 管理员编辑用户后，顶栏/个人中心不更新 | `6c08881` |
| 2 | PC/移动端路由编辑路径被锁定为只读 | `6c08881` |
| 3 | 图标选择器过大，6列22px图标 | `6c08881` |
| 4 | PC端角色编辑权限复选框不预选 | `6c08881` |
| 5 | PC端路由弹窗缺少状态(启用/禁用)字段 | `f04aa50` |
| 6 | 主题面板出现在页面最底部 | `20e9ab7` |
| 7 | 用户头像/名称点击下拉菜单位置偏移 | `20e9ab7` |

### 1.2 新增功能与体验优化（第二轮）

| # | 改进项 | 提交 | 原优先级 |
|---|--------|------|----------|
| 8 | 登录页Tab切换过渡动画 | `908c036` | P1 |
| 9 | 注册成功后显示引导提示 | `908c036` | 2.1 |
| 10 | 验证码点击刷新加载反馈动画 | `908c036` | P1 |
| 11 | 密码显示/隐藏切换按钮 | `908c036` | 2.1 |
| 12 | 网络异常处理和离线提示 | `4c918c7` | P0 |
| 13 | 移动端Tab栏超过5个时「更多」按钮 | `40d3370` | P0 |
| 14 | 密码强度指示器 | `574211c` | P1 |
| 15 | 操作审计日志功能 | `7204467` | P0 |
| 16 | 404友好页面（PC+移动端） | `f82bdd5` | P1 |
| 17 | 首页柱状图改为环形图 | `9f137fb` | P1 |
| 18 | 移动端首页去除重复快捷操作入口 | `9f137fb` | 2.7 |
| 19 | 用户列表批量启用/禁用功能 | `8d5fa09` | P1 |
| 20 | 编辑用户保存二次确认 | `54a8113` | 2.3 |
| 21 | 角色/权限列表搜索过滤 | `54a8113` | 2.3 |
| 22 | 编辑弹窗高度溢出修复 | `54a8113` | 2.3 |

### 1.3 权限系统升级（第三轮）

| # | 改进项 | 提交 | 原优先级 |
|---|--------|------|----------|
| 23 | 路由权限细分（查看/编辑/删除三级） | `7aae5bf` | P0 |
| 24 | 角色编辑器权限复选框（PC+移动端） | `7aae5bf` | P0 |
| 25 | 角色列表显示权限级别标签 | `7aae5bf` | — |
| 26 | 服务器端批量用户导入接口 | `7aae5bf` | P0 |
| 27 | 数据库自动迁移（permissions列） | `7aae5bf` | — |

### 1.4 本轮修复（第四轮）

| # | 改进项 | 提交 | 原优先级 |
|---|--------|------|----------|
| 28 | 移动端登录验证码图片宽高约束，修复布局变形 | `f372c79` | P0 |
| 29 | 用户头像上传功能（PC+移动端，自动压缩） | `1609712` | P1 |
| 30 | Material Icons 字体加载失败时显示占位符♢ | `c012127` | — |

---

### 1.5 本轮修复（第五轮）

| # | 改进项 | 提交 | 原优先级 |
|---|--------|------|----------|
| 31 | PC端图标选择器改用 div 容器，修复 select 内 onclick 不触发 | `a8c51d8` | — |
| 32 | Material Icons 添加 pointer-events: none，修复主题按钮点击穿透 | `a8c51d8` | — |
| 33 | 移除错位的 privacy_policy 内置图标 | `a8c51d8` | — |
| 34 | 移动端暗色主题全面适配 + 移动端主题按钮 onclick 移到父元素 | `0e154e1` | — |

### 1.6 本轮新增（第六轮）

| # | 改进项 | 提交 | 原优先级 |
|---|--------|------|----------|
| 35 | 移动端用户列表无限滚动（IntersectionObserver + 分页加载） | `2114358` | P1 |
| 36 | 移动端日志列表无限滚动（IntersectionObserver + 分页加载） | `2114358` | P1 |

### 1.7 本轮新增（第七轮）

| # | 改进项 | 提交 | 原优先级 |
|---|--------|------|----------|
| 37 | 暗色主题全面完善（所有组件统一适配） | `72da07a` | P2 |
| 38 | 图标选择器搜索过滤 | `72da07a` | P2 |
| 39 | 键盘快捷键（Ctrl+K 搜索、Esc 关闭弹窗） | `72da07a` | P2 |
| 40 | 用户列表批量删除 | `72da07a` | P2 |
| 41 | 个人中心登录日志 | `72da07a` | P2 |
| 42 | Toast 位置优化（避免中央叠加） | `72da07a` | P2 |

---

## 二、仍存在的问题与体验缺陷

### 2.1 登录页

- **记住密码安全性**：密码以 base64 编码存储在 cookie 中，明文可逆，建议至少做一层加密或提示用户风险

### 2.2 PC 端仪表盘（首页）

- **欢迎文字写死**：「欢迎回来，任尚仁」——如果管理员没有设置昵称，这里显示的是账号名，不够友好
- **统计数据无趋势**：无法看到用户增长、近期活跃等时间维度的数据

### 2.3 用户管理

- ~~**无批量删除**~~ ✅ 已完成：用户列表支持批量删除（PC端）

### 2.4 角色管理

- **无角色层级/继承**：不能设置"管理员继承普通用户的所有权限"，必须手动勾选
- **无权限描述**：勾选权限时只有"查看/编辑/删除"，没有说明具体含义
- **角色删除无转移**：删除角色后，关联的用户直接失去权限，没有"转移用户到其他角色"的选项

### 2.5 路由管理

- **无路由层级**：所有路由扁平排列，不能设置父子关系
- ~~**图标选择器无搜索**~~ ✅ 已完成：图标选择器已添加搜索过滤

### 2.6 个人中心

- ~~**无登录日志**~~ ✅ 已完成：个人中心展示最近登录/退出记录

### 2.7 移动端

- **下拉刷新缺失**：不支持下拉刷新手势更新数据
- **无骨架屏**：数据加载时只有转圈 loading，没有骨架屏占位
- **长列表无虚拟滚动**：用户/角色多了之后列表会很卡

### 2.8 通用问题

- **无多语言支持**：所有文案硬编码为中文
- ~~**无键盘快捷键**~~ ✅ 已完成：Ctrl+K 聚焦搜索，Esc 关闭弹窗
- ~~**Toast 位置固定**~~ ✅ 已完成：移动端 Toast 移至底部（TabBar 上方）
- **无全局错误边界**：JavaScript 报错后整个页面可能卡死

---

## 三、剩余优先级与开发路线图

### P0 — 必须修复（影响核心功能）

| 任务 | 说明 | 状态 |
|------|------|------|
| ~~网络异常处理~~ | ~~API 失败时统一提示~~ | ✅ 已完成 (`4c918c7`) |
| ~~移动端 Tab 溢出处理~~ | ~~超过5个Tab时用「更多」按钮~~ | ✅ 已完成 (`40d3370`) |
| ~~用户操作审计日志~~ | ~~谁在什么时间做了什么操作~~ | ✅ 已完成 (`7204467`) |
| ~~路由权限细分~~ | ~~支持"查看/编辑/删除"三级权限~~ | ✅ 已完成 (`7aae5bf`) |
| ~~数据导入导出~~ | ~~CSV导入（批量接口）+ 导出~~ | ✅ 已完成 (`7aae5bf` + `8d5fa09`) |

### P1 — 重要改进（显著提升体验）

| 任务 | 说明 | 状态 |
|------|------|------|
| ~~404/错误页面~~ | ~~友好的错误页面~~ | ✅ 已完成 (`f82bdd5`) |
| ~~密码强度指示器~~ | ~~实时显示密码强度~~ | ✅ 已完成 (`574211c`) |
| ~~验证码+登录页体验~~ | ~~Tab动画/验证码反馈/密码显隐/注册引导~~ | ✅ 已完成 (`908c036`) |
| ~~批量操作~~ | ~~用户列表批量启用/禁用~~ | ✅ 已完成 (`8d5fa09`) |
| ~~首页数据可视化升级~~ | ~~环形图 + 去除重复快捷操作~~ | ✅ 已完成 (`9f137fb`) |
| ~~编辑用户保存确认+搜索过滤+弹窗溢出~~ | ~~多项体验优化~~ | ✅ 已完成 (`54a8113`) |
| ~~用户头像上传~~ | ~~支持上传自定义头像，自动压缩至200px~~ | ✅ 已完成 (`1609712`) |
| ~~长列表虚拟滚动~~ | ~~用户/日志多时移动端无限滚动加载~~ | ✅ 已完成（本轮） |
| ~~移动端验证码布局修复~~ | ~~验证码图片宽高约束，防止撑开布局~~ | ✅ 已完成（本轮） |

### P2 — 锦上添花（未来迭代）

| 任务 | 说明 |
|------|------|
| 路由层级/分组 | 支持树形路由结构 |
| 角色继承 | 角色之间可以继承权限 |
| 多语言 i18n | 支持中/英/日等多语言 |
| 暗色主题完善 | ✅ 已完成：所有组件统一适配暗色模式 |
| 键盘快捷键 | ✅ 已完成：Ctrl+K 搜索、Esc 关闭弹窗 |
| PWA 支持 | 添加到主屏幕、离线缓存 |
| WebSocket 实时通知 | 多人协作时实时同步变更 |
| 登录设备管理 | 查看和踢出其他设备的登录 |
| 操作撤销 | 删除/修改后短时间内可撤销 |

---

## 四、架构建议

### 4.1 代码层面

- ~~app.js 仍然较大~~：~~建议按模块拆分为 `app-users.js`、`app-roles.js`、`app-routers.js`、`app-mine.js`~~ ✅ 已完成（本轮）
- ~~PC/移动端代码重复度高~~：~~`editRouterApp`（移动）和 `pcEditRouter`（PC）逻辑几乎一样，建议抽出共用函数~~ ✅ 已完成（本轮）
- ~~全局变量污染~~：~~`showToast`、`confirmDialog`、`escapeHtml` 等都在 window 上，建议逐步迁移到命名空间~~ ✅ 已完成（本轮）
- ~~CSS 变量主题~~做得不错，但部分组件仍有硬编码色值残留 ✅ 已完成（本轮）

### 4.2 后端层面

- **无分页缓存**：每次请求用户列表都查数据库，建议加 Redis 缓存
- **无 API 限流**：登录接口没有频率限制，存在暴力破解风险
- **Session 存储在文件**：生产环境建议改用 Redis 存储 Session
- **无单元测试**：核心业务逻辑没有测试覆盖
- **数据库无索引优化**：`admin_users.username` 应有唯一索引

### 4.3 安全层面

- **CSRF 防护缺失**：API 没有 CSRF Token 验证
- **密码存储**：目前用 bcrypt，但兼容旧 MD5 密码的逻辑应该在迁移完成后移除
- **Session 固定**：虽然有 `session_regenerate_id`，但应在登录成功后额外调用一次
- **CORS 配置**：当前白名单是硬编码，建议改为配置文件

---

## 五、总结

当前 v3.4 版本经过十轮开发，核心功能完整、权限粒度大幅提升：

**本轮完成的工作（第十轮，6 项 — 移动端 Bug 修复）：**
- 修复 `app-roles.js` 引用未定义函数 `filterRouters` 导致角色页面崩溃
- 添加缺失的 `slideUp` CSS 动画（"更多"Tab 弹出菜单使用但未定义）
- 完善 `app-logs.js` 日志操作类型映射（补充 user_create/update/delete 等 12 种操作）
- 修复移动端用户编辑缺少状态字段（无法启用/禁用用户）
- 修复登录页注册/忘记密码弹窗无滑入动画 + 点击背景无法关闭
- 修复移动端顶部导航栏管理员页面标题显示为"管理系统"而非实际名称

**累计完成（53 项）：** P0 全部完成，P1 全部完成，P2 完成 11 项

---

## 六、第十一轮：移动端导航与图标修复

### 6.1 已完成修复（本轮）

| # | 问题 | 提交 |
|---|------|------|
| 54 | 移动端导航栏硬编码 admin tabs，不是从 API userRouters 动态生成 | `f0633fa` |
| 55 | 硬编码 tabs 图标（people/route/history）不在 KNOWN_ICONS 列表中，显示为 ♢ | `f0633fa` |
| 56 | buildPages() 仅为 userRouters 创建页面 div，admin 硬编码 tabs 多出的页面点击无响应 | `f0633fa` |
| 57 | app.js 遗留文件（旧版单文件移动端路由），未被 home.html 加载 | `f0633fa` |
| 58 | more_horiz 图标不在 KNOWN_ICONS 中，"更多"按钮显示 ♢ | `f0633fa` |
| 59 | 移动端与电脑端页面不一致：移动端有硬编码 admin tabs，PC 端从 userRouters 动态生成 | `f0633fa` |

**本轮核心改动：**
- `app-core.js` buildTabBar() 移除超级管理员硬编码 admin tabs，统一从 API userRouters 动态生成
- `app-core.js` buildPages() 移除硬编码 allPages 逻辑，同步为所有 userRouters 创建页面 div
- `core.js` KNOWN_ICONS 从 70+ 扩充到 600+，覆盖 Material Icons 常用图标
- `core.js` getRouteName() 优化，优先查 userRouters，兜底用内置映射
- 删除未使用的 app.js（1283 行旧代码）

### 6.2 全面代码审查发现的潜在问题

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 60 | PC 端 loadSettings 在 loadHome 内嵌套调用，如果非超级管理员不触发 | P2 | 普通用户首页不加载设置面板，不影响功能但逻辑耦合 |
| 61 | 移动端 app-users.js 和 app-logs.js 重复定义 setupInfiniteScroll | P2 | 同一个函数在两个文件中各定义一次，应抽取到共享模块 |
| 62 | pc-pages.js 内部函数 pcAddUser/pcEditUser/saveUser 与导出对象方法同名但作用域不同 | P2 | 内部函数 pcAddUser vs 导出 addUser（指向 pcAddUser），命名冗余但不影响功能 |
| 63 | 移动端日志管理的 searchLogs 函数中 actionMap 在每个渲染循环内重复定义 | P2 | 性能微优化，不影响功能 |
| 64 | core.js 中 checkPwdStrength 同时定义了两份（函数声明 + checkPwdStrengthCore 包装） | P2 | 冗余代码，checkPwdStrengthCore 直接调用 checkPwdStrength |
| 65 | 移动端 app-mine.js uploadAppAvatar 使用 base64 POST 上传头像，PC 端使用 FormData + XHR | P2 | 两端上传方式不一致，移动端 base64 体积更大 |
| 66 | theme-switcher.js PC 端 toggle 定位 theme-panel 时使用 getBoundingClientRect | P2 | 侧边栏收起时位置可能偏移，但用户可手动调整 |

### 6.3 功能完整性确认

经过代码审查，以下功能在 PC 端和移动端均已完整实现：
- ✅ 用户管理（增删改查 + 批量操作 + CSV 导入导出）
- ✅ 角色管理（增删改 + 权限级别 view/edit/delete）
- ✅ 路由管理（增删改 + 图标选择器 + 搜索过滤）
- ✅ 操作日志（搜索 + 分页 + 无限滚动）
- ✅ 个人中心（编辑资料 + 修改密码 + 头像上传 + 登录日志）
- ✅ 主题切换（6 种主题 + PC 面板 + 移动端 ActionSheet）
- ✅ 暗色模式全组件适配
- ✅ 键盘快捷键（Ctrl+K 搜索、Esc 关闭弹窗）
- ✅ 密码强度指示器
- ✅ 验证码（可由管理员禁用）
- ✅ 404 友好页面（PC + 移动端）
- ✅ 移动端 Tab 溢出 "更多" 按钮
- ✅ 无限滚动（用户列表 + 日志列表）

**累计完成（59 项）：** P0 全部完成，P1 全部完成，P2 完成 11 项

---

## 七、第十二轮：Pad 端侧边栏恢复

### 7.1 已完成修复（本轮）

| # | 问题 | 提交 |
|---|------|------|
| 67 | Pad 端（769-1024px）侧边栏消失——第十一轮将 Pad 紧凑侧边栏替换为 Drawer 模式导致 | `188ea19` |
| 68 | 恢复 Pad 端 64px 紧凑图标侧边栏，点击汉堡按钮可展开为完整 280px 侧边栏 | `188ea19` |
| 69 | toggleSidebar 函数支持 Pad 展开/收起 和 移动端 Drawer 两种模式 | `188ea19` |
| 70 | pcNavigate 在 Pad 端只收起展开态而非完全关闭侧边栏 | `188ea19` |

**累计完成（70 项）：** P0 全部完成，P1 全部完成，P2 完成 11 项

---

## 九、代码重构：pc-pages.js 模块化拆分

### 9.1 拆分说明

原 `pc-pages.js`（1052 行）承载了所有 PC 端页面逻辑，拆分为 7 个独立模块：

| 文件 | 行数 | 职责 |
|------|------|------|
| `pc-core.js` | 30 | 共享状态（分页器）、PCPages 命名空间初始化 |
| `pc-home.js` | 131 | 首页仪表盘 + 系统设置（验证码开关） |
| `pc-users.js` | 339 | 用户管理 CRUD + 批量操作 + CSV 导入导出 |
| `pc-roles.js` | 159 | 角色管理 CRUD + 权限复选框联动 |
| `pc-routers.js` | 101 | 路由管理 CRUD |
| `pc-logs.js` | 69 | 操作日志查看（搜索 + 分页） |
| `pc-mine.js` | 155 | 个人中心（编辑资料 + 修改密码 + 头像上传） |

### 9.2 拆分原则

- 与移动端 `app-*.js` 保持一致的文件命名风格
- 每个文件通过 IIFE 注入 `PCPages` 命名空间
- 通用操作（API 调用）保留在 `shared-ops.js`
- 通用 UI 工具（权限复选框、路由渲染）保留在 `shared-utils.js`
- `pc-pages.js` 保留 17 行空壳向后兼容

### 9.3 共享工具函数提取（shared-utils.js）

从 PC 端和移动端提取了 4 个重复函数到 `shared-utils.js`，减少约 140 行重复代码：

| 函数 | 提取自 | 节省 |
|------|--------|------|
| `setupInfiniteScroll` | app-logs.js + app-users.js（各一份 ~45行） | ~45 行 |
| `actionMap` | app-logs.js（×3处）+ pc-logs.js（×1处，~12行/处） | ~48 行 |
| `validatePasswordChange` | app-mine.js + pc-mine.js（各一份 ~5行） | ~5 行 |
| `parseCSVLine` | pc-users.js（~15行） | ~15 行 |

调用方式：
- `SharedUtils.setupInfiniteScroll(container, loadMore)`
- `SharedUtils.actionMap[l.action]`
- `SharedUtils.validatePasswordChange(oldId, newId, confirmId, toastFn)`
- `SharedUtils.parseCSVLine(line)`

### 9.4 加载顺序

`home.html` 中按依赖顺序加载：
```
core.js → shared-ops.js → shared-utils.js → theme-switcher.js → modals.js →
app-core.js → app-home.js → app-users.js → app-roles.js → app-routers.js →
app-mine.js → app-logs.js →
pc-core.js → pc-home.js → pc-users.js → pc-roles.js → pc-routers.js →
pc-logs.js → pc-mine.js → pc-pages.js
```

---

*文档更新时间：2026-03-26 00:45 GMT+8*
*更新说明：第十三轮 — 操作记录页面权限调整 + 个人中心登录记录移除*

### 7.2 本轮核心修复说明

**根因**：`pc.css` 中存在两段 `@media (max-width: 1024px) and (min-width: 769px)` 查询——
1. 第一段（~364行）：实现紧凑侧边栏 64px + 展开为 280px
2. 第二段（~449行）：覆盖回 280px 完全模式（"Pad 自适应覆盖：Pad 上不再用缩小侧边栏，改用 drawer"）

第二段完全否定了第一段的紧凑布局，导致 Pad 端侧边栏始终为 280px 全宽且无展开/收起能力。

**修复**：删除第二段冲突媒体查询，保留第一段的 Pad 紧凑侧边栏逻辑：
- 默认 64px 图标侧边栏（隐藏文字标签）
- 点击汉堡按钮 → `.sidebar.expanded` 切换为 280px 完整模式
- pcNavigate → 仅移除 `.expanded`（收起但不完全关闭）
- 移动端（≤768px）Drawer 模式不受影响

---

## 八、第十三轮：操作记录页面 + 权限调整

### 8.1 需求描述

新增独立的操作记录页面（PC + 移动端），将个人信息页面的登录记录板块移除。
权限规则：超级管理员可查看所有用户的操作记录，其他用户只能查看自己的操作记录。

### 8.2 待办任务

| # | 任务 | 说明 | 状态 |
|---|------|------|------|
| 71 | 修改 API `/api/log/index.php` 权限逻辑 | 普通用户可查看自己的全部操作记录（不限于登录/退出），超级管理员查看全部 | ✅ 已完成 (`ae8db51`) |
| 72 | 移动端个人中心移除登录记录板块 | 删除 `app-mine.js` 中的 `mine-login-logs` 相关代码 | ✅ 已完成 (`ae8db51`) |
| 73 | PC 端个人中心移除登录记录板块 | 删除 `pc-pages.js` 中 `loadPCMine` 的 `pc-mine-logs` 相关代码 | ✅ 已完成 (`ae8db51`) |
| 74 | 验证移动端操作记录页面正常工作 | 普通用户只能看到自己的操作记录 | ✅ 已完成 |
| 75 | 验证 PC 端操作记录页面正常工作 | 超级管理员看到全部，普通用户看到自己的 | ✅ 已完成 |
| 76 | 提交并推送到 GitHub | 包含所有改动 | ✅ 已完成 |

### 8.3 实现方案

1. **后端 API 修改** (`api/log/index.php`)：
   - 移除"仅超级管理员可查看操作日志"限制
   - 普通用户自动过滤为 `user_id = 自己的ID`，查看全部操作类型（不限于 login/logout）
   - 超级管理员可查看全部用户的操作记录
   - 移除 `self` 参数逻辑（统一由后端根据角色判断）

2. **前端修改**：
   - 移动端 `app-mine.js`：删除登录记录卡片（`mine-login-logs` 部分）
   - PC 端 `pc-pages.js`：删除 `loadPCMine` 中的 `pc-mine-logs` 部分
   - 操作记录页面（`app-logs.js` / `pc-pages.js` loadPCLog）无需修改，已支持搜索和分页

---

## 十四、第十四轮：全面排查发现的 Bug 与待修复项

> 基于 2026-03-26 07:47 GMT+8 的用户视角全面测试（PC端 + 移动端）

### 14.1 已修复（本轮）

| # | 问题 | 严重度 | 位置 | 提交 | 说明 |
|---|------|--------|------|------|------|
| 77 | 移动端用户管理 tab 点击后显示 404 页面 | P0 | 移动端 | `40dca3c` | `app-users.js` 第14-41行残留旧代码（setupInfiniteScroll 提取后未删除函数体），导致整个 IIFE 语法错误，`window.AppUsers` 未定义 |
| 78 | `app-logs.js` 中 `SharedUtils.SharedUtils.setupInfiniteScroll` 双重引用 | P2 | 移动端日志 | `40dca3c` | 修正为 `SharedUtils.setupInfiniteScroll` |
| 79 | PC端角色编辑权限子复选框(查看/编辑/删除)不预选 | P0 | PC端 | `161b00e` | `shared-utils.js` 中 `renderRouterPermItemPC` 和 `renderRouterPermItem` 使用位运算 `permLevel & 1` 判断，但调用方传入的是权限数组 `['view','edit']`，导致 `(数组 & 1)` 始终为 false |
| 80 | 移动端404页面"返回首页"后残留显示 | P2 | 移动端 | `3207abf` | navigate() 中在激活新页面前清空 .app-page-content，避免旧内容叠加 |

### 14.2 待修复项

| # | 问题 | 严重度 | 位置 | 说明 |
|---|------|--------|------|------|
| 81 | PC端 `renderRouterPermItem` 位运算参数不匹配 | P0 | PC端用户编辑 | 用户编辑弹窗中的角色权限复选框也可能受影响（已修复 shared-utils.js 但需验证） |
| 82 | 超级管理员编辑弹窗无密码修改字段 | P1 | PC+移动端 | 编辑其他用户时不显示密码字段，但管理员也需要修改普通用户的密码 |
| 83 | 超级管理员可被编辑昵称/邮箱/手机 | P2 | PC+移动端 | 超级管理员账号应限制编辑（防止误改关键信息） |
| 84 | `app-logs.js` 中 actionMap 在渲染循环内重复定义 | P2 | 移动端日志 | 性能微优化，不影响功能 |
| 85 | PC/移动端头像上传方式不一致 | P2 | 全局 | 移动端用 base64 POST，PC端用 FormData + XHR |
| 86 | 登录页密码字段不在 form 标签内 | P2 | 登录页 | 控制台有 DOM 警告 |
| 87 | 移动端侧边栏 Drawer 返回手势缺失 | P2 | 移动端 | 不支持滑动返回关闭 Drawer |
| 88 | 移动端角色管理编辑权限子复选框禁用状态 | P2 | 移动端 | 未勾选主路由时子复选框被 disabled，但视觉上不够明确 |

### 14.3 代码质量待改进

| # | 问题 | 说明 |
|---|------|------|
| 89 | pc-pages.js 空壳文件 | 仅17行向后兼容代码，可删除 |
| 90 | 全局变量污染 | `showToast`、`confirmDialog`、`escapeHtml` 等在 window 上 |
| 91 | 无单元测试 | 核心业务逻辑没有测试覆盖 |
| 92 | 无 API 限流 | 登录接口没有频率限制 |

---

*文档更新时间：2026-03-26 08:24 GMT+8*
*更新说明：第十四轮 — 全面排查完成，Bug 修复与验证*

### 14.4 测试验证结果

#### PC端（1440×900）

| 功能 | 状态 | 说明 |
|------|------|------|
| 首页仪表盘 | ✅ | 统计卡片/环形图/系统设置正常 |
| 用户管理-列表 | ✅ | 搜索/分页/批量勾选正常 |
| 用户管理-编辑 | ✅ | 昵称/邮箱/手机/状态/角色预选正常 |
| 用户管理-新增 | ✅ | 弹窗字段完整 |
| 角色管理-列表 | ✅ | 权限标签展示正常 |
| 角色管理-编辑 | ✅ | **已修复** — 权限子复选框(查看/编辑/删除)现在正确预选 |
| 路由管理-列表 | ✅ | 图标/状态/排序正常 |
| 路由管理-编辑 | ✅ | 弹窗字段完整 |
| 个人中心 | ✅ | 编辑资料/修改密码正常 |
| 日志页面 | ✅ | 搜索/分页/操作类型过滤正常 |
| 普通用户权限 | ✅ | 侧边栏仅显示已授权菜单（首页/个人中心/日志） |
| 普通用户日志 | ✅ | 仅显示自己的操作记录 |

#### 移动端（375×812）

| 功能 | 状态 | 说明 |
|------|------|------|
| 首页 | ✅ | 统计卡片/环形图正常 |
| 用户管理 | ✅ | **已修复** — 404问题解决，列表/编辑/新增正常 |
| 角色管理 | ✅ | 列表/编辑权限复选框正确预选 |
| 路由管理 | ✅ | 列表/编辑正常 |
| 我的 | ✅ | 编辑资料/修改密码/退出登录正常 |
| 日志页面 | ✅ | 搜索/无限滚动正常 |
| 普通用户权限 | ✅ | 底部tab仅显示首页/日志/我的 |
| 普通用户日志 | ✅ | 仅显示自己的操作记录 |

#### 仍存在的问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 编辑用户无密码字段 | P1 | 超级管理员编辑其他用户时无法修改其密码 |

---

## 十五、第十五轮：CSS 样式重构与内联样式清理

> 基于 2026-03-26 08:47 GMT+8 的代码审查
> 目标：将 JS 中的内联样式迁移到 CSS 文件，封装公共样式类，提升可维护性

### 15.1 问题分析

当前 JS 文件中存在 **166 处** 内联 `style=""` 属性，主要集中在以下文件：

| 文件 | 内联样式数 | 主要问题 |
|------|-----------|----------|
| `pc-mine.js` | 40 | 大量表单布局样式 |
| `app-logs.js` | 24 | 日志卡片渲染重复样式 |
| `app-roles.js` | 17 | 角色列表卡片样式 |
| `core.js` | 13 | ActionSheet、图标选择器 |
| `app-routers.js` | 11 | 路由列表卡片样式 |
| `app-mine.js` | 11 | 个人中心布局 |
| `shared-utils.js` | 12 | 权限复选框布局 |
| `app-users.js` | 8 | 用户列表样式 |

**高频重复样式模式：**

| 出现次数 | 样式值 |
|----------|--------|
| 6 | `padding:0 16px 16px` |
| 6 | `display:none` |
| 6 | `display:flex;align-items:center;gap:4px;font-size:12px` |
| 5 | `font-size:12px;color:var(--text-secondary)` |
| 4 | `margin-bottom:8px;padding:12px` |
| 4 | `font-size:14px;font-weight:500` |
| 4 | `display:flex;justify-content:space-between;align-items:center` |
| 4 | `font-size:10px` |
| 3 | `width:100%;height:100%;border-radius:50%;object-fit:cover` |
| 3 | `padding:0 10px;height:30px;font-size:12px` |
| 3 | `display:flex;align-items:center;gap:8px;padding:8px 0` |

### 15.2 待办任务

| # | 任务 | 说明 | 状态 |
|---|------|------|------|
| 93 | 创建 `components.css` 公共样式文件 | 封装高频重复的内联样式为 CSS 类 | ✅ 已完成 |
| 94 | 重构 `app-logs.js` — 移除24处内联样式 | 日志卡片使用 CSS 类替代，引入 renderLogItem 模板函数 | ✅ 已完成 |
| 95 | 重构 `pc-mine.js` — 移除40处内联样式 | PC个人中心使用 CSS 类（mine-hero/mine-info-grid等） | ✅ 已完成 |
| 96 | 重构 `app-roles.js` — 移除17处内联样式 | 角色列表/编辑弹窗使用 CSS 类，引入 renderRoleItem/renderRouterPermSheetHtml | ✅ 已完成 |
| 97 | 重构 `app-routers.js` — 移除11处内联样式 | 路由列表/编辑弹窗使用 CSS 类 | ✅ 已完成 |
| 98 | 重构 `app-mine.js` — 移除11处内联样式 | 移动端个人中心使用 CSS 类 | ✅ 已完成 |
| 99 | 重构 `shared-utils.js` — 移除12处内联样式 | 权限复选框布局使用 CSS 类 | ✅ 已完成 |
| 100 | 重构 `app-users.js` — 移除8处内联样式 | 用户列表使用 CSS 类 | ✅ 已完成 |
| 101 | 重构 `core.js` — 密码强度条/图标选择器 | 使用 str-bar/flex-center 等 CSS 类 | ✅ 已完成 |
| 102 | 重构 `app-home.js` — 移除4处内联样式 | 首页布局使用 CSS 类 | ✅ 已完成 |
| 103 | 重构 `pc-home.js` — 移除9处内联样式 | PC端首页使用 CSS 类 | ✅ 已完成 |
| 104 | 重构 `pc-logs.js` — 移除4处内联样式 | PC端日志使用 CSS 类 | ✅ 已完成 |
| 105 | 重构 `modals.js` — 移除3处内联样式 | 弹窗使用 CSS 类 | ✅ 已完成 |
| 106 | 在 `home.html` + `index.html` 中引入 `components.css` | 确保新样式文件正确加载 | ✅ 已完成 |
| 107 | 验证 PC + 移动端功能完整性 | 所有页面功能正常 | ⏳ 待测试 |
| 108 | 提交并推送到 GitHub | 2次提交，内联样式从 166→35 | ✅ 已完成 |

**CSS 重构成果：**
- 内联样式总数：166 → 35（减少 79%）
- 新增 components.css：~250 行通用工具类
- 提取公共模板函数：renderLogItem、renderRoleItem、renderRouterPermSheetHtml、renderRouterItem
- 剩余 35 处为动态样式（如 sheetStyle）或特殊布局，可后续优化

**CSS 文件优化：**
- pc.css: 侧边栏/导航/登录渐变全部改用 CSS 变量，暗色主题正常生效
- index.html: 登录页渐变使用 CSS 变量
- global.css: 新增 .text-tertiary 类
- components.css: 清理与 global.css 重复的定义（.text-center/.text-secondary）
- app.css: 移除重复的 @keyframes spin 动画定义
- 修复暗色主题下侧边栏颜色不跟随变化的问题

### 15.3 CSS 类封装方案

计划创建以下 CSS 工具类：

```css
/* 布局 */
.flex-center     → display:flex;align-items:center
.flex-between    → display:flex;justify-content:space-between;align-items:center
.flex-col        → display:flex;flex-direction:column
.flex-wrap       → display:flex;flex-wrap:wrap

/* 间距 */
.gap-4  → gap:4px   .gap-6  → gap:6px   .gap-8  → gap:8px
.gap-10 → gap:10px  .gap-12 → gap:12px  .gap-16 → gap:16px

.p-0-16-16  → padding:0 16px 16px
.p-0-12-12  → padding:0 12px 12px
.p-8-0      → padding:8px 0

/* 字号 */
.fs-10 → font-size:10px   .fs-11 → font-size:11px
.fs-12 → font-size:12px   .fs-13 → font-size:13px
.fs-14 → font-size:14px   .fs-15 → font-size:15px
.fs-16 → font-size:16px   .fs-18 → font-size:18px

/* 文字颜色 */
.text-secondary → color:var(--text-secondary)
.text-tertiary  → color:var(--text-tertiary)

/* 通用组件 */
.avatar-fill    → width:100%;height:100%;border-radius:50%;object-fit:cover
.card           → 常用卡片样式
.btn-sm-outline → 小按钮+描边样式
.perm-row       → 权限复选框行布局
.log-card       → 日志卡片布局
```

### 16.6 新增修复：图标选择器实时预览

| # | 问题 | 说明 | 状态 |
|---|------|------|------|
| 115 | 路由编辑弹窗选择图标后预览不更新 | `openIconPicker` 选择图标后只更新 hidden input，未更新预览 div 的 innerHTML。修复：选择时同步更新 `#inputId-preview` 元素 | ✅ 已完成 |

**验证结果：**
- PC端：选择 star 图标后预览立即更新 ✅
- 移动端：选择 favorite 图标后预览立即更新（hidden input 值正确） ✅

---

*文档更新时间：2026-03-26 10:55 GMT+8*
*更新说明：第十六轮完成 — 图标本地化 + 实时预览修复*

## 十六、第十六轮：Material Icons 本地化修复

> 基于 2026-03-26 10:45 GMT+8 的图标问题排查

### 16.1 问题根因

图标显示为 ♢ 占位符的根本原因有三层：

| # | 原因 | 说明 |
|---|------|------|
| 1 | `font-display: block` | 字体加载期间浏览器完全隐藏图标文字，用户看到空白/闪烁 |
| 2 | JS fallback 过于激进 | `DOMContentLoaded` 时立即检查 `document.fonts.check()`，未加载则永久替换为 ♢，即使字体稍后加载成功也无恢复 |
| 3 | `pointer-events: none` | `.mi` 类设置了该属性，导致主题按钮等包含图标的可点击元素无法响应点击 |

### 16.2 修复方案

**CSS 修复（`assets/css/material-icons.css`）：**
- `font-display: block` → `font-display: swap`（字体加载期间显示 fallback 文字，加载完成后替换为图标）
- 移除 `.mi` 的 `pointer-events: none`（避免图标遮挡点击事件）
- 添加 `-webkit-font-feature-settings: 'liga'` 前缀兼容 Safari
- 更新字体文件至 Google Fonts 最新版本（v145）

**JS 修复（`assets/js/core.js`）：**
- `renderIcon()` 不再检查字体状态，始终返回正常图标 HTML（依赖 CSS `font-display:swap` 处理视觉）
- 移除 `applyFallback()` 函数（不再破坏性替换图标文字为 ♢）
- 移除 `_checkIconFont` 全局函数（无用）
- 保留诊断日志：字体未加载时仅 console.warn，不影响页面

### 16.3 待办任务

| # | 任务 | 说明 | 状态 |
|---|------|------|------|
| 109 | 更新 `material-icons.css` 为本地离线版本 | `font-display:swap` + 移除 `pointer-events:none` + webkit 前缀 | ✅ 已完成 |
| 110 | 更新字体文件至 v145 | 从 Google Fonts CDN 下载最新 woff2 | ✅ 已完成 |
| 111 | 重写 `renderIcon()` fallback 逻辑 | 不再替换为 ♢，依赖 CSS swap 策略 | ✅ 已完成 |
| 112 | 更新缓存版本号 | material-icons.css + core.js | ✅ 已完成 |
| 113 | PC 端 + 移动端全面测试 | 验证所有页面图标正常显示 | ✅ 已完成 |
| 114 | 提交并推送到 GitHub | — | ✅ 已完成 |

### 16.4 本地 Material Icons 使用说明

按照 Google Fonts 官方文档（https://developers.google.cn/fonts/docs/material_icons?hl=zh-cn）：

1. **字体文件**：`assets/fonts/MaterialIcons-Regular.woff2`（128KB，从 Google Fonts 下载）
2. **CSS 声明**：`assets/css/material-icons.css` 中的 `@font-face` 声明
3. **使用方式**：`<i class="mi">icon_name</i>`（icon_name 为 Material Icons 名称，如 `home`、`settings`、`person`）
4. **不依赖 CDN**：全部资源本地化，国内网络不受限

### 16.5 用户视角测试结果

**PC端（1440×900）**

| 功能 | 状态 | 说明 |
|------|------|------|
| 登录页图标 | ✅ | lock/person/visibility/login 全部正常 |
| 首页仪表盘 | ✅ | 统计卡片/环形图/设置图标正常 |
| 侧边栏导航 | ✅ | 所有菜单图标正常显示 |
| 用户管理 | ✅ | 搜索/新增/编辑/删除/导入/分页图标正常 |
| 角色管理 | ✅ | 搜索/新增/编辑/删除图标正常 |
| 路由管理 | ✅ | 搜索/新增/编辑/删除图标正常，路由图标列表正常 |
| 操作日志 | ✅ | 搜索/筛选/分页图标正常 |
| 个人中心 | ✅ | 头像/编辑/修改密码图标正常 |
| 主题切换按钮 | ✅ | 可点击，无穿透问题 |
| 图标选择器 | ✅ | 弹窗中图标网格正常 |

**移动端（375×812）**

| 功能 | 状态 | 说明 |
|------|------|------|
| 首页仪表盘 | ✅ | 统计卡片/环形图/设置图标正常 |
| 底部Tab栏 | ✅ | home/group/security/route/account_circle/more_horiz 全部正常 |
| 用户管理 | ✅ | 搜索/新增/编辑图标正常 |
| 角色管理 | ✅ | 列表/编辑图标正常 |
| 路由管理 | ✅ | 列表/编辑图标正常 |
| 操作日志 | ✅ | 搜索/无限滚动图标正常 |
| 个人中心 | ✅ | 头像/编辑/修改密码/退出图标正常 |
| 登录页 | ✅ | lock/person/visibility/login/person_add 全部正常 |

**结论：全部页面无 ♢ 占位符，所有图标从本地 woff2 字体文件正确加载。**
---

## 十七、第十七轮：会话安全与暗色模式修复

### 17.1 问题描述

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 116 | 管理员禁用用户后，该用户仍可继续操作 | P0 | `requireLogin()` 仅检查 session 是否存在，不从数据库验证用户 status |
| 117 | 用户修改密码后不退出登录 | P0 | `changePassword()` 后端仅更新密码不销毁 session，前端不清除缓存 |
| 118 | 移动端暗色模式下输入框有浅色边框 | P2 | `[data-theme="dark"] .form-input { border-color !important }` 覆盖了 `.app-form-item .form-input { border: none }` |

### 17.2 修复方案

**后端修复（`api/common.php`）：**
- `requireLogin()` 新增数据库查询：每次 API 调用时从 DB 验证用户 status
- 用户被禁用（status != 1）时销毁 session 并返回 401
- 同步最新用户信息（昵称/邮箱/手机/头像/is_super）到 session

**后端修复（`api/user/index.php`）：**
- `changePassword()` 成功后调用 `session_destroy()` 并返回 `require_logout: true`

**前端修复（`pc-mine.js` + `app-mine.js`）：**
- 密码修改成功后：显示提示 → 清除 Storage → 1.5s 后跳转登录页

**CSS 修复（`themes.css`）：**
- 新增：`[data-theme="dark"] .app-form-item .form-input { border: none !important; box-shadow: none !important; }`

### 17.3 待办任务

| # | 任务 | 说明 | 状态 |
|---|------|------|------|
| 116 | 后端 requireLogin() 增加 DB 状态验证 | 每次 API 调用验证用户 status | ✅ 已完成 |
| 117 | 密码修改后强制退出登录 | 后端 session_destroy + 前端跳转 | ✅ 已完成 |
| 118 | 暗色模式移动端输入框边框修复 | border: none !important | ✅ 已完成 |
| 119 | PC + 移动端功能测试 | 验证密码修改退出、暗色模式 | ⏳ 待测试 |
| 120 | 提交并推送到 GitHub | — | ⏳ 待提交 |

---

*文档更新时间：2026-03-26 11:15 GMT+8*
*更新说明：第十七轮 — 会话安全与暗色模式修复*

---

## 十八、第十八轮：数据库迁移系统完善 + 全面测试

> 基于 2026-03-26 13:01 GMT+8 的用户视角全面测试（PC端 + 移动端）

### 18.1 本轮完成的修复与优化

| # | 改进项 | 说明 | 状态 |
|---|--------|------|------|
| 121 | migrate.php 全面重写 | 新增版本跟踪表 `_migrations`，包含 6 个迁移步骤（权限字段、操作日志表、系统设置表、日志路由、索引优化、迁移系统就绪） | ✅ 已完成 |
| 122 | common.php 自动迁移优化 | 改用 `_migrations` 表判断是否需要执行，已迁移后不再每次请求检查，性能提升 | ✅ 已完成 |
| 123 | install.sql 更新至 v3.4 | 版本号更新，新增 `_migrations` 迁移跟踪表、`operation_logs.action` 索引、操作日志路由(id=6)、日志路由权限记录 | ✅ 已完成 |
| 124 | 自动迁移补充日志路由 | common.php 自动迁移代码中添加日志路由检测与自动创建逻辑，确保从旧版本升级时自动添加 | ✅ 已完成 |

### 18.2 用户视角测试结果

#### PC端（1440×900）

| 功能 | 状态 | 说明 |
|------|------|------|
| 登录页 | ✅ | 图标正常 (person, lock, visibility, login, info) |
| 首页仪表盘 | ✅ | 统计卡片/环形图/系统设置图标全部正常 |
| 用户管理-列表 | ✅ | add/download/upload/search/edit/delete 图标正常 |
| 用户管理-编辑弹窗 | ✅ | 角色复选框正确预选，状态下拉正常 |
| 角色管理-列表 | ✅ | home/group/security/route/account_circle/list_alt 权限图标正常 |
| 角色管理-权限标签 | ✅ | 编(编辑)/看(查看) 标签正确 |
| 路由管理-列表 | ✅ | 6条路由图标全部正常，操作日志路由存在 |
| 操作日志 | ✅ | 196条记录，筛选下拉正常，分页正常 |
| 个人中心 | ✅ | account_circle/edit/lock/palette/logout 图标正常 |
| 普通用户登录 | ✅ | 仅显示首页/个人中心/日志，权限正确 |

#### 移动端（375×812）

| 功能 | 状态 | 说明 |
|------|------|------|
| 首页 | ✅ | dashboard/person/check_circle 图标正常 |
| 底部Tab栏 | ✅ | home/group/security/route/account_circle/more_horiz 全部正常 |
| 用户管理 | ✅ | 搜索图标/编辑按钮/添加按钮正常 |
| 更多菜单 | ✅ | list_alt 日志 + chevron_right 箭头正常 |
| "更多"Tab点击 | ✅ | 弹出日志选项面板 |

### 18.3 发现的问题

| # | 问题 | 严重度 | 位置 | 说明 |
|---|------|--------|------|------|
| 125 | 登录页密码字段不在 form 标签内 | P2 | 登录页 | 控制台有 DOM 警告 "Password field is not contained in a form" |
| 126 | 缺少 favicon.ico | P2 | 全局 | 控制台 404 错误 |
| 127 | admin 密码被修改为 000000 | — | — | 非默认 123456，需用户自行修改为更安全密码 |
| 128 | Cloudflare 可能拦截登录表单 | P1 | 登录页 | 表单提交被拦截，但 API 直接调用正常（可能是 Cloudflare 人机验证） |

### 18.4 待完成任务

| # | 任务 | 说明 | 优先级 | 状态 |
|---|------|------|--------|------|
| 129 | 修复登录页 form 标签问题 | 密码输入框包裹在 `<form>` 内 | P2 | ✅ 已完成 (`9e3b700`) |
| 130 | 添加 favicon.ico | 避免 404 控制台错误 | P2 | ✅ 已完成 (`de24e28`) |
| 131 | 管理员编辑用户增加密码修改字段 | 超级管理员编辑其他用户时可修改密码 | P1 | ✅ 已完成 (`b69b181`) |
| 132 | 管理员禁用用户后前端自动踢出 | 后端已实现，前端无提示直接跳转登录页 | P1 | ⏳ 待完成 |

---

*文档更新时间：2026-03-26 13:26 GMT+8*
*更新说明：第十八轮 — 数据库迁移系统完善 + 全面测试*
