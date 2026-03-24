<?php
/**
 * 角色管理接口
 * 兼容 PHP 5.6+
 */
require_once __DIR__ . '/../common.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];
// 兼容 action 从 GET 参数和 POST body (JSON) 两种方式传入
$action = isset($_GET['action']) ? $_GET['action'] : '';
if (empty($action) && $method === 'POST') {
    $body = getJsonBody();
    if (isset($body['action'])) {
        $action = $body['action'];
    }
}

switch ($method) {
    case 'GET':
        $action === 'detail' ? getRoleDetail() : getRoleList();
        break;
    case 'POST':
        if ($action === 'routers') { assignRouters(); }
        elseif ($action === 'update') { updateRole(); }
        elseif ($action === 'delete') { deleteRole(); }
        else { createRole(); }
        break;
    case 'PUT':    updateRole(); break;
    case 'DELETE': deleteRole(); break;
    default: error('不支持的请求方式', 405);
}

function getRoleList() {
    $p = getPagination();

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM roles");
        $stmt->execute();
        $total = intval($stmt->fetch()['total']);

        $stmt = $db->prepare("SELECT * FROM roles ORDER BY id ASC LIMIT ? OFFSET ?");
        $stmt->execute(array($p['limit'], $p['offset']));
        $list = $stmt->fetchAll();

        foreach ($list as &$role) {
            $stmt2 = $db->prepare("
                SELECT r.id, r.router_name, r.router_path, r.icon
                FROM routers r
                INNER JOIN role_router rr ON rr.router_id = r.id
                WHERE rr.role_id = ? AND r.status = 1
                ORDER BY r.sort ASC
            ");
            $stmt2->execute(array($role['id']));
            $role['routers'] = $stmt2->fetchAll();
            $role['router_ids'] = array_column($role['routers'], 'id');

            $stmt3 = $db->prepare("SELECT COUNT(*) as cnt FROM user_role WHERE role_id = ?");
            $stmt3->execute(array($role['id']));
            $role['user_count'] = intval($stmt3->fetch()['cnt']);
        }

        success(array('list' => $list, 'total' => $total, 'page' => $p['page'], 'limit' => $p['limit']));
    } catch (Exception $e) {
        error('获取角色列表失败');
    }
}

function getRoleDetail() {
    $id = intval(getParam('id', 0));
    if ($id <= 0) { error('参数错误'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute(array($id));
        $role = $stmt->fetch();
        if (!$role) { error('角色不存在'); }

        $stmt2 = $db->prepare("
            SELECT r.id, r.router_name, r.router_path, r.icon
            FROM routers r
            INNER JOIN role_router rr ON rr.router_id = r.id
            WHERE rr.role_id = ? AND r.status = 1
            ORDER BY r.sort ASC
        ");
        $stmt2->execute(array($id));
        $role['routers'] = $stmt2->fetchAll();
        $role['router_ids'] = array_column($role['routers'], 'id');

        $stmt3 = $db->prepare("SELECT COUNT(*) as cnt FROM user_role WHERE role_id = ?");
        $stmt3->execute(array($id));
        $role['user_count'] = intval($stmt3->fetch()['cnt']);

        success($role);
    } catch (Exception $e) {
        error('获取角色详情失败');
    }
}

function createRole() {
    requireSuper();

    $data = getJsonBody();
    $roleName  = trim(isset($data['role_name']) ? $data['role_name'] : '');
    $remark    = trim(isset($data['remark']) ? $data['remark'] : '');
    $routerIds = isset($data['router_ids']) ? $data['router_ids'] : array();

    if (empty($roleName)) { error('角色名称不能为空'); }
    if (!validateLength($roleName, 1, 50)) { error('角色名称长度需在 1-50 位之间'); }
    if (!validateLength($remark, 0, 255))  { error('备注长度不能超过 255 位'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("INSERT INTO roles (role_name, remark) VALUES (?, ?)");
        $stmt->execute(array($roleName, $remark));
        $roleId = $db->lastInsertId();

        if (!empty($routerIds)) {
            $stmt2 = $db->prepare("INSERT INTO role_router (role_id, router_id) VALUES (?, ?)");
            foreach ($routerIds as $rid) {
                $stmt2->execute(array($roleId, intval($rid)));
            }
        }

        writeLog('role_create', "创建角色 [$roleName], ID=$roleId");
        success(array('id' => $roleId), '角色创建成功');
    } catch (Exception $e) {
        error('创建角色失败');
    }
}

function updateRole() {
    requireSuper();

    $data = getJsonBody();
    $id = intval(isset($data['id']) ? $data['id'] : 0);
    if ($id <= 0) { error('参数错误'); }
    if ($id == 1) { error('超级管理员角色不可修改名称'); }

    $roleName = trim(isset($data['role_name']) ? $data['role_name'] : '');
    $remark   = trim(isset($data['remark']) ? $data['remark'] : '');

    if ($roleName !== '' && !validateLength($roleName, 1, 50)) { error('角色名称长度需在 1-50 位之间'); }
    if (!validateLength($remark, 0, 255)) { error('备注长度不能超过 255 位'); }

    try {
        $db = getDB();
        $sets = array();
        $params = array();
        if ($roleName !== '') { $sets[] = 'role_name = ?'; $params[] = $roleName; }
        if ($remark !== '')   { $sets[] = 'remark = ?';     $params[] = $remark; }

        if (!empty($sets)) {
            $params[] = $id;
            $db->prepare("UPDATE roles SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
        } else {
            error('没有需要更新的字段');
        }

        writeLog('role_update', "更新角色 ID=$id");
        success(null, '更新成功');
    } catch (Exception $e) {
        error('更新角色失败');
    }
}

function deleteRole() {
    requireSuper();

    $data = getJsonBody();
    $id = intval(isset($data['id']) ? $data['id'] : 0);
    if ($id <= 0) { error('参数错误'); }
    if ($id == 1) { error('超级管理员角色不可删除'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT role_name FROM roles WHERE id = ?");
        $stmt->execute(array($id));
        $role = $stmt->fetch();
        if (!$role) { error('角色不存在'); }

        $db->prepare("DELETE FROM roles WHERE id = ?")->execute(array($id));
        $db->prepare("DELETE FROM role_router WHERE role_id = ?")->execute(array($id));
        $db->prepare("DELETE FROM user_role WHERE role_id = ?")->execute(array($id));

        writeLog('role_delete', "删除角色 [{$role['role_name']}], ID=$id");
        success(null, '删除成功');
    } catch (Exception $e) {
        error('删除角色失败');
    }
}

function assignRouters() {
    requireSuper();

    $data = getJsonBody();
    $roleId    = intval(isset($data['role_id']) ? $data['role_id'] : 0);
    $routerIds = isset($data['router_ids']) ? $data['router_ids'] : array();

    if ($roleId <= 0) { error('参数错误'); }

    try {
        $db = getDB();
        $db->prepare("DELETE FROM role_router WHERE role_id = ?")->execute(array($roleId));

        if (!empty($routerIds)) {
            $stmt = $db->prepare("INSERT INTO role_router (role_id, router_id) VALUES (?, ?)");
            foreach ($routerIds as $rid) {
                $stmt->execute(array($roleId, intval($rid)));
            }
        }

        writeLog('role_assign_router', "角色 ID=$roleId 绑定路由");
        success(null, '权限绑定成功');
    } catch (Exception $e) {
        error('绑定权限失败');
    }
}
