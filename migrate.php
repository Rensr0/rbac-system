<?php
/**
 * 数据库迁移脚本 v3.4
 * 访问即执行，执行完毕后显示结果
 * 仅支持 GET 请求，无需登录
 * 
 * 使用方法：上传代码后访问 https://你的域名/migrate.php
 * 迁移完成后可安全删除此文件
 */

header('Content-Type: text/html; charset=utf-8');
echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>数据库迁移 v3.4</title>';
echo '<style>
body{font-family:monospace;padding:20px;background:#1a1a2e;color:#eee}
.ok{color:#4ade80} .err{color:#f87171} .skip{color:#fbbf24} .info{color:#93c5fd}
h2{color:#60a5fa} .warn{color:#fbbf24}
pre{line-height:1.8}
</style>';
echo '</head><body>';
echo '<h2>🔧 RBAC 数据库迁移脚本 v3.4</h2>';
echo '<pre>';

require_once __DIR__ . '/api/config/database.php';

$db = getDB();
$migrations = [];
$startTime = microtime(true);

function run($db, $sql, $label) {
    global $migrations;
    try {
        $db->exec($sql);
        echo "<span class='ok'>✅ $label</span>\n";
        $migrations[] = ['ok', $label];
    } catch (Exception $e) {
        $msg = $e->getMessage();
        if (strpos($msg, 'Duplicate column') !== false || strpos($msg, 'already exists') !== false || strpos($msg, 'Duplicate key') !== false) {
            echo "<span class='skip'>⏭️  $label（已存在，跳过）</span>\n";
            $migrations[] = ['skip', $label];
        } else {
            echo "<span class='err'>❌ $label：$msg</span>\n";
            $migrations[] = ['err', $label];
        }
    }
}

function checkColumn($db, $table, $column) {
    $col = $db->query("SHOW COLUMNS FROM `$table` LIKE '$column'")->fetch();
    return (bool)$col;
}

function checkTable($db, $table) {
    $tbl = $db->query("SHOW TABLES LIKE '$table'")->fetch();
    return (bool)$tbl;
}

// ========== 迁移版本跟踪表 ==========
echo "<span class='info'>── 初始化迁移跟踪 ──</span>\n";

$db->exec("CREATE TABLE IF NOT EXISTS `_migrations` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `version` varchar(20) NOT NULL DEFAULT '' COMMENT '版本号',
    `name` varchar(100) NOT NULL DEFAULT '' COMMENT '迁移名称',
    `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_version_name` (`version`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库迁移记录'");

function markMigration($db, $version, $name) {
    try {
        $stmt = $db->prepare("INSERT IGNORE INTO _migrations (version, name) VALUES (?, ?)");
        $stmt->execute(array($version, $name));
    } catch (Exception $e) {
        // 忽略
    }
}

function isMigrated($db, $version, $name) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM _migrations WHERE version = ? AND name = ?");
        $stmt->execute(array($version, $name));
        return $stmt->fetch()['cnt'] > 0;
    } catch (Exception $e) {
        return false;
    }
}

echo "<span class='ok'>✅ 迁移跟踪表就绪</span>\n";

// ========== 迁移 1：role_router.permissions 列（v3.1） ==========
echo "\n<span class='info'>── 迁移 1：权限细分字段（v3.1）──</span>\n";

if (!checkColumn($db, 'role_router', 'permissions')) {
    run($db, "ALTER TABLE role_router ADD COLUMN permissions INT NOT NULL DEFAULT 1 COMMENT '权限位掩码:1=查看 2=编辑 4=删除 7=全部'", "添加 role_router.permissions 列");
    run($db, "UPDATE role_router SET permissions = 7", "已有角色权限设为全部（7）");
} else {
    echo "<span class='skip'>⏭️  role_router.permissions 列已存在</span>\n";
}

// 确保默认数据权限不为 0
$zeroPerm = $db->query("SELECT COUNT(*) as cnt FROM role_router WHERE permissions = 0")->fetch();
if ($zeroPerm['cnt'] > 0) {
    run($db, "UPDATE role_router SET permissions = 7 WHERE permissions = 0", "修复权限为0的记录（设为7）");
} else {
    echo "<span class='ok'>✅ 所有权限记录正常</span>\n";
}
markMigration($db, '3.1', 'role_router_permissions');

// ========== 迁移 2：操作日志表（v3.2） ==========
echo "\n<span class='info'>── 迁移 2：操作日志表（v3.2）──</span>\n";

if (!checkTable($db, 'operation_logs')) {
    run($db, "CREATE TABLE IF NOT EXISTS `operation_logs` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表'", "创建 operation_logs 表");
} else {
    echo "<span class='skip'>⏭️  operation_logs 表已存在</span>\n";
}
markMigration($db, '3.2', 'operation_logs');

// ========== 迁移 3：系统设置表（v3.3） ==========
echo "\n<span class='info'>── 迁移 3：系统设置表（v3.3）──</span>\n";

if (!checkTable($db, 'system_settings')) {
    run($db, "CREATE TABLE IF NOT EXISTS `system_settings` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `setting_key` varchar(100) NOT NULL DEFAULT '' COMMENT '设置键名',
        `setting_value` text COMMENT '设置值',
        `setting_type` varchar(20) NOT NULL DEFAULT 'string' COMMENT '类型:string/int/bool',
        `label` varchar(100) NOT NULL DEFAULT '' COMMENT '显示名称',
        `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_key` (`setting_key`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表'", "创建 system_settings 表");

    // 插入默认设置
    run($db, "INSERT INTO system_settings (setting_key, setting_value, setting_type, label) VALUES ('captcha_enabled', '1', 'bool', '登录验证码')", "插入默认设置：验证码已启用");
} else {
    echo "<span class='skip'>⏭️  system_settings 表已存在</span>\n";
    // 确保 captcha_enabled 记录存在
    $row = $db->query("SELECT id FROM system_settings WHERE setting_key = 'captcha_enabled'")->fetch();
    if (!$row) {
        run($db, "INSERT INTO system_settings (setting_key, setting_value, setting_type, label) VALUES ('captcha_enabled', '1', 'bool', '登录验证码')", "插入 captcha_enabled 设置");
    } else {
        echo "<span class='ok'>✅ captcha_enabled 设置已存在</span>\n";
    }
}
markMigration($db, '3.3', 'system_settings');

// ========== 迁移 4：路由表默认数据补充（v3.4） ==========
echo "\n<span class='info'>── 迁移 4：路由默认数据检查（v3.4）──</span>\n";

// 检查日志路由是否存在
$logRoute = $db->query("SELECT id FROM routers WHERE router_path = 'log'")->fetch();
if (!$logRoute) {
    // 获取当前最大排序值
    $maxSort = $db->query("SELECT MAX(sort) as max_sort FROM routers")->fetch();
    $nextSort = intval($maxSort['max_sort']) + 1;
    run($db, "INSERT INTO routers (router_name, router_path, icon, sort, status) VALUES ('操作日志', 'log', 'list_alt', $nextSort, 1)", "添加操作日志路由");
    
    // 为超级管理员角色自动添加日志权限
    $logId = $db->lastInsertId();
    run($db, "INSERT IGNORE INTO role_router (role_id, router_id, permissions) VALUES (1, $logId, 7)", "超级管理员自动获得日志路由权限");
} else {
    echo "<span class='ok'>✅ 操作日志路由已存在</span>\n";
}
markMigration($db, '3.4', 'log_router');

// ========== 迁移 5：密码字段索引优化（v3.4） ==========
echo "\n<span class='info'>── 迁移 5：索引优化（v3.4）──</span>\n";

// 检查 operation_logs 是否有 action 索引（用于筛选）
$hasActionIdx = $db->query("SHOW INDEX FROM operation_logs WHERE Key_name = 'idx_action'")->fetch();
if (!$hasActionIdx) {
    run($db, "ALTER TABLE operation_logs ADD INDEX idx_action (action)", "添加 operation_logs.action 索引");
} else {
    echo "<span class='ok'>✅ operation_logs.action 索引已存在</span>\n";
}
markMigration($db, '3.4', 'indexes');

// ========== 迁移 6：清理重复的自动迁移代码标记（v3.4） ==========
echo "\n<span class='info'>── 迁移 6：迁移系统就绪确认 ──</span>\n";
echo "<span class='ok'>✅ 迁移版本跟踪已启用，后续部署无需重复执行</span>\n";
markMigration($db, '3.4', 'migration_system');

// ========== 输出汇总 ==========
$elapsed = round(microtime(true) - $startTime, 2);
echo "\n<span class='info'>── 汇总 ──</span>\n";
$ok = $skip = $err = 0;
foreach ($migrations as $m) {
    if ($m[0] === 'ok') $ok++;
    elseif ($m[0] === 'skip') $skip++;
    else $err++;
}
echo "<span class='ok'>成功: $ok</span>  <span class='skip'>跳过: $skip</span>  <span class='err'>失败: $err</span>  耗时: {$elapsed}s\n";

if ($err === 0) {
    echo "\n<span class='ok'>🎉 全部迁移完成！数据库已升级至 v3.4</span>\n";
    echo "<span class='warn'>⚠️  安全提示：建议删除此文件（migrate.php）</span>\n";
} else {
    echo "\n<span class='err'>⚠️  部分迁移失败，请检查上方错误信息</span>\n";
}

echo '</pre>';
echo '<p style="color:#888;margin-top:20px">RBAC 权限管理系统 · 数据库迁移 v3.4 · 2026-03-26</p>';
echo '</body></html>';
