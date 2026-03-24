<?php
/**
 * 路由权限管理接口
 * 兼容 PHP 5.6+
 */
require_once __DIR__ . '/../common.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];
$action = getParam('action', '');

switch ($method) {
    case 'GET':
        $action === 'user' ? getUserRouters() : getRouterList();
        break;
    case 'POST':
        if ($action === 'update') { updateRouter(); }
        elseif ($action === 'delete') { deleteRouter(); }
        else { createRouter(); }
        break;
    case 'PUT':    updateRouter(); break;
    case 'DELETE': deleteRouter(); break;
    default: error('不支持的请求方式', 405);
}

function getRouterList() {
    try {
        $db = getDB();
        $stmt = $db->query("SELECT * FROM routers ORDER BY sort ASC, id ASC");
        $list = $stmt->fetchAll();

        foreach ($list as &$item) {
            $stmt2 = $db->prepare("SELECT COUNT(*) as cnt FROM role_router WHERE router_id = ?");
            $stmt2->execute(array($item['id']));
            $item['role_count'] = intval($stmt2->fetch()['cnt']);
        }

        success($list);
    } catch (Exception $e) {
        error('获取路由列表失败');
    }
}

function getUserRouters() {
    $user = getCurrentUser();
    try {
        $db = getDB();
        if ((isset($user['is_super']) ? $user['is_super'] : 0) == 1) {
            $stmt = $db->query("SELECT * FROM routers WHERE status = 1 ORDER BY sort ASC");
        } else {
            $stmt = $db->prepare("
                SELECT DISTINCT r.* FROM routers r
                INNER JOIN role_router rr ON rr.router_id = r.id
                INNER JOIN user_role ur ON ur.role_id = rr.role_id
                WHERE ur.user_id = ? AND r.status = 1
                ORDER BY r.sort ASC
            ");
            $stmt->execute(array($user['id']));
        }
        success($stmt->fetchAll());
    } catch (Exception $e) {
        error('获取用户路由失败');
    }
}

function createRouter() {
    requireSuper();

    $data = getJsonBody();
    $routerName = trim(isset($data['router_name']) ? $data['router_name'] : '');
    $routerPath = trim(isset($data['router_path']) ? $data['router_path'] : '');
    $icon       = trim(isset($data['icon']) ? $data['icon'] : '');
    $sort       = intval(isset($data['sort']) ? $data['sort'] : 0);

    if (empty($routerName)) { error('路由名称不能为空'); }
    if (empty($routerPath)) { error('路由路径不能为空'); }
    if (!validateLength($routerName, 1, 50)) { error('路由名称长度需在 1-50 位之间'); }
    if (!validateLength($routerPath, 1, 100)) { error('路由路径长度需在 1-100 位之间'); }
    if (!preg_match('/^[a-zA-Z0-9_\-\/]+$/', $routerPath)) { error('路由路径格式不正确'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM routers WHERE router_path = ?");
        $stmt->execute(array($routerPath));
        if ($stmt->fetch()) { error('路由路径已存在'); }

        $stmt = $db->prepare("INSERT INTO routers (router_name, router_path, icon, sort) VALUES (?, ?, ?, ?)");
        $stmt->execute(array($routerName, $routerPath, $icon, $sort));

        writeLog('router_create', "创建路由 [$routerName] path=$routerPath");
        success(array('id' => $db->lastInsertId()), '路由创建成功');
    } catch (Exception $e) {
        error('创建路由失败');
    }
}

function updateRouter() {
    requireSuper();

    $data = getJsonBody();
    $id = intval(isset($data['id']) ? $data['id'] : 0);
    if ($id <= 0) { error('参数错误'); }

    $routerName = trim(isset($data['router_name']) ? $data['router_name'] : '');
    $routerPath = trim(isset($data['router_path']) ? $data['router_path'] : '');
    $icon       = trim(isset($data['icon']) ? $data['icon'] : '');
    $sort       = isset($data['sort']) ? intval($data['sort']) : null;
    $status     = isset($data['status']) ? intval($data['status']) : null;

    if ($routerName !== '' && !validateLength($routerName, 1, 50)) { error('路由名称长度需在 1-50 位之间'); }
    if ($routerPath !== '') {
        if (!validateLength($routerPath, 1, 100)) { error('路由路径长度需在 1-100 位之间'); }
        if (!preg_match('/^[a-zA-Z0-9_\-\/]+$/', $routerPath)) { error('路由路径格式不正确'); }
    }
    if ($status !== null && !in_array($status, array(0, 1), true)) { error('状态值无效'); }

    try {
        $db = getDB();
        $sets = array();
        $params = array();
        if ($routerName !== '') { $sets[] = 'router_name = ?'; $params[] = $routerName; }
        if ($routerPath !== '') { $sets[] = 'router_path = ?'; $params[] = $routerPath; }
        if ($icon !== '')       { $sets[] = 'icon = ?';        $params[] = $icon; }
        if ($sort !== null)     { $sets[] = 'sort = ?';        $params[] = $sort; }
        if ($status !== null)   { $sets[] = 'status = ?';      $params[] = $status; }

        if (!empty($sets)) {
            $params[] = $id;
            $db->prepare("UPDATE routers SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
        }

        writeLog('router_update', "更新路由 ID=$id");
        success(null, '更新成功');
    } catch (Exception $e) {
        error('更新路由失败');
    }
}

function deleteRouter() {
    requireSuper();

    $data = getJsonBody();
    $id = intval(isset($data['id']) ? $data['id'] : 0);
    if ($id <= 0) { error('参数错误'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT router_name FROM routers WHERE id = ?");
        $stmt->execute(array($id));
        $router = $stmt->fetch();
        if (!$router) { error('路由不存在'); }

        $db->prepare("DELETE FROM routers WHERE id = ?")->execute(array($id));
        $db->prepare("DELETE FROM role_router WHERE router_id = ?")->execute(array($id));

        writeLog('router_delete', "删除路由 [{$router['router_name']}], ID=$id");
        success(null, '删除成功');
    } catch (Exception $e) {
        error('删除路由失败');
    }
}
