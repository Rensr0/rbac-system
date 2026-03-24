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
    // 仅超级管理员可查看日志
    if ((isset($user['is_super']) ? $user['is_super'] : 0) != 1) {
        forbidden('仅超级管理员可查看操作日志');
    }

    $p = getPagination();
    $keyword = getParam('keyword', '');
    $action = getParam('log_action', '');

    try {
        $db = getDB();
        $where = 'WHERE 1=1';
        $params = array();

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
