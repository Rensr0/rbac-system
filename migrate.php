<?php
/**
 * 数据库迁移脚本
 * 访问即执行，执行完毕后自动销毁
 * 仅支持 GET 请求，无需登录
 */

header('Content-Type: text/html; charset=utf-8');
echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>数据库迁移</title>';
echo '<style>body{font-family:monospace;padding:20px;background:#1a1a2e;color:#eee} .ok{color:#4ade80} .err{color:#f87171} .skip{color:#fbbf24} h2{color:#60a5fa}</style>';
echo '</head><body>';
echo '<h2>🔧 数据库迁移脚本</h2>';
echo '<pre>';

require_once __DIR__ . '/api/config/database.php';

$db = getDB();
$migrations = [];

function run($db, $sql, $label) {
    global $migrations;
    try {
        $db->exec($sql);
        echo "<span class='ok'>✅ $label</span>\n";
        $migrations[] = ['ok', $label];
    } catch (Exception $e) {
        // 检查是否是"列已存在"之类的错误
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

// ========== 迁移 1：role_router.permissions 列 ==========
echo "── 迁移 1：权限细分字段 ──\n";

$col = $db->query("SHOW COLUMNS FROM role_router LIKE 'permissions'")->fetch();
if (!$col) {
    run($db, "ALTER TABLE role_router ADD COLUMN permissions INT NOT NULL DEFAULT 1 COMMENT '权限位掩码:1=查看 2=编辑 4=删除 7=全部'", "添加 role_router.permissions 列");
    run($db, "UPDATE role_router SET permissions = 7", "已有角色权限设为全部（7）");
} else {
    echo "<span class='skip'>⏭️  role_router.permissions 列已存在</span>\n";
}

// ========== 迁移 2：确保默认数据权限为 7 ==========
echo "\n── 迁移 2：数据校验 ──\n";

$zeroPerm = $db->query("SELECT COUNT(*) as cnt FROM role_router WHERE permissions = 0")->fetch();
if ($zeroPerm['cnt'] > 0) {
    run($db, "UPDATE role_router SET permissions = 7 WHERE permissions = 0", "修复权限为0的记录（设为7）");
} else {
    echo "<span class='ok'>✅ 所有权限记录正常</span>\n";
}

// ========== 检查操作日志表 ==========
echo "\n── 迁移 3：操作日志表 ──\n";

$tbl = $db->query("SHOW TABLES LIKE 'operation_logs'")->fetch();
if (!$tbl) {
    run($db, "CREATE TABLE IF NOT EXISTS `operation_logs` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `user_id` int(11) NOT NULL DEFAULT 0,
        `username` varchar(50) NOT NULL DEFAULT '',
        `action` varchar(50) NOT NULL DEFAULT '',
        `detail` varchar(500) NOT NULL DEFAULT '',
        `ip` varchar(45) NOT NULL DEFAULT '',
        `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_user_id` (`user_id`),
        KEY `idx_create_time` (`create_time`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4", "创建 operation_logs 表");
} else {
    echo "<span class='skip'>⏭️  operation_logs 表已存在</span>\n";
}

// ========== 迁移 4：系统设置表 ==========
echo "\n── 迁移 4：系统设置表 ──\n";

$tbl = $db->query("SHOW TABLES LIKE 'system_settings'")->fetch();
if (!$tbl) {
    run($db, "CREATE TABLE IF NOT EXISTS `system_settings` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `setting_key` varchar(100) NOT NULL DEFAULT '' COMMENT '设置键名',
        `setting_value` text COMMENT '设置值',
        `setting_type` varchar(20) NOT NULL DEFAULT 'string' COMMENT '类型:string/int/bool',
        `label` varchar(100) NOT NULL DEFAULT '' COMMENT '显示名称',
        `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

// ========== 输出汇总 ==========
echo "\n── 汇总 ──\n";
$ok = $skip = $err = 0;
foreach ($migrations as $m) {
    if ($m[0] === 'ok') $ok++;
    elseif ($m[0] === 'skip') $skip++;
    else $err++;
}
echo "<span class='ok'>成功: $ok</span>  <span class='skip'>跳过: $skip</span>  <span class='err'>失败: $err</span>\n";

if ($err === 0) {
    echo "\n<span class='ok'>🎉 全部迁移完成！</span>\n";
} else {
    echo "\n<span class='err'>⚠️  部分迁移失败，请检查</span>\n";
}

echo '</pre>';
echo '<p style="color:#888;margin-top:20px">迁移完成，可安全删除此文件</p>';
echo '</body></html>';
