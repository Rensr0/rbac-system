<?php
/**
 * 操作日志接口
 * 仅超级管理员可查看
 */
require_once __DIR__ . '/../common.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'GET') {
    getLogs();
} else {
    error('不支持的请求方式', 405);
}

function getLogs() {
    $user = getCurrentUser();
    $isSuper = (isset($user['is_super']) ? $user['is_super'] : 0) == 1;
    $selfOnly = getParam('self', '') === '1';

    // 仅超级管理员可查看全部日志，普通用户只能查看自己的登录日志
    if (!$isSuper && !$selfOnly) {
        forbidden('仅超级管理员可查看操作日志');
    }

    $p = getPagination();
    $keyword = getParam('keyword', '');
    $action = getParam('log_action', '');

    try {
        $db = getDB();
        $where = 'WHERE 1=1';
        $params = array();

        // 普通用户只看自己的
        if (!$isSuper && $selfOnly) {
            $where .= ' AND user_id = ?';
            $params[] = $user['id'];
            // 只显示登录相关的操作
            $where .= " AND action IN ('login','logout','register','password_change','profile_update')";
            if ($action === '') {
                // 默认只返回登录/退出
                $where = str_replace(" AND action IN ('login','logout','register','password_change','profile_update')", " AND action IN ('login','logout')", $where);
            }
        }

        if ($keyword !== '') {
            $where .= ' AND (username LIKE ? OR detail LIKE ? OR ip LIKE ?)';
            $params[] = "%$keyword%";
            $params[] = "%$keyword%";
            $params[] = "%$keyword%";
        }

        if ($action !== '') {
            $where .= ' AND action = ?';
            $params[] = $action;
        }

        $stmt = $db->prepare("SELECT COUNT(*) as total FROM operation_logs $where");
        $stmt->execute($params);
        $total = intval($stmt->fetch()['total']);

        $stmt = $db->prepare("SELECT * FROM operation_logs $where ORDER BY create_time DESC LIMIT ? OFFSET ?");
        $params[] = $p['limit'];
        $params[] = $p['offset'];
        $stmt->execute($params);
        $list = $stmt->fetchAll();

        // 获取操作类型列表
        $stmt2 = $db->query("SELECT DISTINCT action FROM operation_logs ORDER BY action");
        $actions = array_column($stmt2->fetchAll(), 'action');

        success(array(
            'list' => $list,
            'total' => $total,
            'page' => $p['page'],
            'limit' => $p['limit'],
            'actions' => $actions
        ));
    } catch (Exception $e) {
        error('获取日志失败');
    }
}
