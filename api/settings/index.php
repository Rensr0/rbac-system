<?php
/**
 * 系统设置接口
 * 仅超级管理员可修改设置
 * GET    /api/settings/        - 获取所有设置
 * POST   /api/settings/        - 更新设置（批量）
 */
require_once __DIR__ . '/../common.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getSettings();
        break;
    case 'POST':
        updateSettings();
        break;
    default:
        error('不支持的请求方式', 405);
}

/**
 * 获取所有系统设置
 * 任何登录用户都可以读取（前端需要知道某些开关状态）
 */
function getSettings() {
    try {
        $db = getDB();
        $stmt = $db->query("SELECT setting_key, setting_value, setting_type, label FROM system_settings");
        $rows = $stmt->fetchAll();

        $settings = array();
        foreach ($rows as $row) {
            $val = $row['setting_value'];
            // 按类型转换
            if ($row['setting_type'] === 'bool') {
                $val = ($val === '1' || $val === 'true');
            } elseif ($row['setting_type'] === 'int') {
                $val = intval($val);
            }
            $settings[$row['setting_key']] = array(
                'value' => $val,
                'type'  => $row['setting_type'],
                'label' => $row['label'],
            );
        }

        success($settings);
    } catch (Exception $e) {
        error('获取设置失败');
    }
}

/**
 * 更新系统设置（仅超级管理员）
 * 接收 JSON: { "captcha_enabled": false, ... }
 */
function updateSettings() {
    requireSuper();

    $data = getJsonBody();
    if (empty($data)) {
        error('没有需要更新的设置');
    }

    // 允许修改的白名单
    $allowed = array('captcha_enabled');

    try {
        $db = getDB();
        $updated = array();

        foreach ($data as $key => $value) {
            if (!in_array($key, $allowed, true)) {
                continue; // 跳过不允许修改的 key
            }

            // 类型转换：bool → '1'/'0'
            if (is_bool($value)) {
                $strVal = $value ? '1' : '0';
            } else {
                $strVal = strval($value);
            }

            $stmt = $db->prepare("UPDATE system_settings SET setting_value = ? WHERE setting_key = ?");
            $stmt->execute(array($strVal, $key));
            if ($stmt->rowCount() > 0) {
                $updated[] = $key;
            }
        }

        if (empty($updated)) {
            error('没有有效的设置被更新');
        }

        $user = getCurrentUser();
        writeLog('settings_update', "更新系统设置: " . implode(', ', $updated));
        success(array('updated' => $updated), '设置已保存');
    } catch (Exception $e) {
        error('保存设置失败');
    }
}
