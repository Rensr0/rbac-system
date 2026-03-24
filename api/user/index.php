<?php
/**
 * 用户管理接口
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
        $action === 'detail' ? getUserDetail() : getUserList();
        break;
    case 'POST':
        if ($action === 'roles') { assignRoles(); }
        elseif ($action === 'password') { changePassword(); }
        elseif ($action === 'profile') { updateProfile(); }
        elseif ($action === 'update') { updateUser(); }
        elseif ($action === 'delete') { deleteUser(); }
        else { createUser(); }
        break;
    case 'PUT': updateUser(); break;
    case 'DELETE': deleteUser(); break;
    default: error('不支持的请求方式', 405);
}

function getUserList() {
    $p = getPagination();
    $keyword = getParam('keyword', '');

    try {
        $db = getDB();
        $where = 'WHERE 1=1';
        $params = array();

        if ($keyword !== '') {
            $where .= ' AND (username LIKE ? OR nickname LIKE ?)';
            $params[] = "%$keyword%";
            $params[] = "%$keyword%";
        }

        $stmt = $db->prepare("SELECT COUNT(*) as total FROM admin_users $where");
        $stmt->execute($params);
        $total = intval($stmt->fetch()['total']);

        $stmt = $db->prepare("SELECT id, username, nickname, avatar, email, phone, status, is_super, last_login, create_time FROM admin_users $where ORDER BY id DESC LIMIT ? OFFSET ?");
        $params[] = $p['limit'];
        $params[] = $p['offset'];
        $stmt->execute($params);
        $list = $stmt->fetchAll();

        foreach ($list as &$item) {
            $stmt2 = $db->prepare("SELECT r.id, r.role_name FROM roles r INNER JOIN user_role ur ON ur.role_id = r.id WHERE ur.user_id = ?");
            $stmt2->execute(array($item['id']));
            $item['roles'] = $stmt2->fetchAll();
        }

        success(array('list' => $list, 'total' => $total, 'page' => $p['page'], 'limit' => $p['limit']));
    } catch (Exception $e) {
        error('获取用户列表失败');
    }
}

function getUserDetail() {
    $id = intval(getParam('id', 0));
    if ($id <= 0) { error('参数错误'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT id, username, nickname, avatar, email, phone, status, is_super, last_login, create_time FROM admin_users WHERE id = ?");
        $stmt->execute(array($id));
        $user = $stmt->fetch();
        if (!$user) { error('用户不存在'); }

        $stmt2 = $db->prepare("SELECT role_id FROM user_role WHERE user_id = ?");
        $stmt2->execute(array($id));
        $user['role_ids'] = array_column($stmt2->fetchAll(), 'role_id');

        success($user);
    } catch (Exception $e) {
        error('获取用户详情失败');
    }
}

function createUser() {
    requireSuper();

    $data = getJsonBody();
    $username = trim(isset($data['username']) ? $data['username'] : '');
    $password = trim(isset($data['password']) ? $data['password'] : '123456');
    $nickname = trim(isset($data['nickname']) ? $data['nickname'] : '');
    $email    = trim(isset($data['email']) ? $data['email'] : '');
    $phone    = trim(isset($data['phone']) ? $data['phone'] : '');
    $roleIds  = isset($data['role_ids']) ? $data['role_ids'] : array();

    if (empty($username)) { error('用户名不能为空'); }
    if (!validateUsername($username)) { error('用户名格式不正确（2-50位字母数字下划线）'); }
    if (mb_strlen($password) < 6 || mb_strlen($password) > 128) { error('密码长度需在 6-128 位之间'); }
    if (empty($nickname)) { $nickname = $username; }
    if (!validateLength($nickname, 1, 50)) { error('昵称长度需在 1-50 位之间'); }
    if (!validateEmail($email)) { error('邮箱格式不正确'); }
    if (!empty($phone) && !preg_match('/^[\d\-+() ]{0,20}$/', $phone)) { error('手机号格式不正确'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM admin_users WHERE username = ?");
        $stmt->execute(array($username));
        if ($stmt->fetch()) { error('用户名已存在'); }

        $stmt = $db->prepare("INSERT INTO admin_users (username, password, nickname, email, phone) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(array($username, encryptPassword($password), $nickname, $email, $phone));
        $userId = $db->lastInsertId();

        if (!empty($roleIds)) {
            $stmt2 = $db->prepare("INSERT INTO user_role (user_id, role_id) VALUES (?, ?)");
            foreach ($roleIds as $rid) {
                $stmt2->execute(array($userId, intval($rid)));
            }
        }

        writeLog('user_create', "创建用户 [$username], ID=$userId");
        success(array('id' => $userId), '用户创建成功');
    } catch (Exception $e) {
        error('创建用户失败');
    }
}

function updateUser() {
    requireSuper();

    $data = getJsonBody();
    $id = intval(isset($data['id']) ? $data['id'] : 0);
    if ($id <= 0) { error('参数错误'); }

    $nickname = trim(isset($data['nickname']) ? $data['nickname'] : '');
    $email    = trim(isset($data['email']) ? $data['email'] : '');
    $phone    = trim(isset($data['phone']) ? $data['phone'] : '');
    $status   = isset($data['status']) ? intval($data['status']) : null;

    if ($nickname !== '' && !validateLength($nickname, 1, 50)) { error('昵称长度需在 1-50 位之间'); }
    if ($email !== '' && !validateEmail($email)) { error('邮箱格式不正确'); }
    if ($phone !== '' && !preg_match('/^[\d\-+() ]{0,20}$/', $phone)) { error('手机号格式不正确'); }
    if ($status !== null && !in_array($status, array(0, 1), true)) { error('状态值无效'); }

    try {
        $db = getDB();
        $sets = array();
        $params = array();

        if ($nickname !== '') { $sets[] = 'nickname = ?'; $params[] = $nickname; }
        if ($email !== '')    { $sets[] = 'email = ?';    $params[] = $email; }
        if ($phone !== '')    { $sets[] = 'phone = ?';    $params[] = $phone; }
        if ($status !== null) { $sets[] = 'status = ?';   $params[] = $status; }

        if (!empty($sets)) {
            $params[] = $id;
            $db->prepare("UPDATE admin_users SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
        } else {
            error('没有需要更新的字段');
        }

        $logDetail = "更新用户 ID=$id";
        if ($status !== null) { $logDetail .= ', 状态=' . ($status ? '启用' : '禁用'); }
        writeLog('user_update', $logDetail);
        success(null, '更新成功');
    } catch (Exception $e) {
        error('更新用户失败');
    }
}

/**
 * 用户自助编辑个人资料（无需超级管理员权限）
 */
function updateProfile() {
    $user = getCurrentUser();
    $data = getJsonBody();

    $nickname = trim(isset($data['nickname']) ? $data['nickname'] : '');
    $email    = trim(isset($data['email']) ? $data['email'] : '');
    $phone    = trim(isset($data['phone']) ? $data['phone'] : '');

    if ($nickname !== '' && !validateLength($nickname, 1, 50)) { error('昵称长度需在 1-50 位之间'); }
    if ($email !== '' && !validateEmail($email)) { error('邮箱格式不正确'); }
    if ($phone !== '' && !preg_match('/^[\d\-+() ]{0,20}$/', $phone)) { error('手机号格式不正确'); }

    try {
        $db = getDB();
        $sets = array();
        $params = array();

        if ($nickname !== '') { $sets[] = 'nickname = ?'; $params[] = $nickname; }
        if ($email !== '')    {
            // 检查邮箱是否被其他用户使用
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ? AND id != ?");
            $stmt->execute(array($email, $user['id']));
            if ($stmt->fetch()) { error('该邮箱已被其他用户使用'); }
            $sets[] = 'email = ?'; $params[] = $email;
        }
        if ($phone !== '')    { $sets[] = 'phone = ?'; $params[] = $phone; }

        if (empty($sets)) { error('没有需要更新的字段'); }

        $params[] = $user['id'];
        $db->prepare("UPDATE admin_users SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);

        // 同步 session
        if ($nickname !== '') { $_SESSION['admin_user']['nickname'] = $nickname; }
        if ($email !== '') { $_SESSION['admin_user']['email'] = $email; }
        if ($phone !== '') { $_SESSION['admin_user']['phone'] = $phone; }

        writeLog('profile_update', "用户 [{$user['username']}] 更新个人资料");
        success($_SESSION['admin_user'], '资料更新成功');
    } catch (Exception $e) {
        error('更新失败');
    }
}

function deleteUser() {
    requireSuper();

    $data = getJsonBody();
    $id = intval(isset($data['id']) ? $data['id'] : 0);
    if ($id <= 0) { error('参数错误'); }
    if ($id == 1) { error('超级管理员不可删除'); }

    $currentUser = getCurrentUser();
    if ($currentUser['id'] == $id) { error('不能删除当前登录账号'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT username, is_super FROM admin_users WHERE id = ?");
        $stmt->execute(array($id));
        $user = $stmt->fetch();
        if (!$user) { error('用户不存在'); }
        if ($user['is_super'] == 1) { error('超级管理员不可删除'); }

        $db->prepare("DELETE FROM admin_users WHERE id = ?")->execute(array($id));
        $db->prepare("DELETE FROM user_role WHERE user_id = ?")->execute(array($id));

        writeLog('user_delete', "删除用户 [{$user['username']}], ID=$id");
        success(null, '删除成功');
    } catch (Exception $e) {
        error('删除用户失败');
    }
}

function assignRoles() {
    requireSuper();

    $data = getJsonBody();
    $userId  = intval(isset($data['user_id']) ? $data['user_id'] : 0);
    $roleIds = isset($data['role_ids']) ? $data['role_ids'] : array();

    if ($userId <= 0) { error('参数错误'); }

    try {
        $db = getDB();
        $db->prepare("DELETE FROM user_role WHERE user_id = ?")->execute(array($userId));

        if (!empty($roleIds)) {
            $stmt = $db->prepare("INSERT INTO user_role (user_id, role_id) VALUES (?, ?)");
            foreach ($roleIds as $rid) {
                $stmt->execute(array($userId, intval($rid)));
            }
        }

        writeLog('user_assign_role', "用户 ID=$userId 分配角色");
        success(null, '角色分配成功');
    } catch (Exception $e) {
        error('分配角色失败');
    }
}

function changePassword() {
    $data = getJsonBody();
    $oldPassword = isset($data['old_password']) ? $data['old_password'] : '';
    $newPassword = isset($data['new_password']) ? $data['new_password'] : '';

    if (empty($oldPassword) || empty($newPassword)) { error('密码不能为空'); }
    if (mb_strlen($newPassword) < 6 || mb_strlen($newPassword) > 128) { error('新密码长度需在 6-128 位之间'); }

    $user = getCurrentUser();
    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT password FROM admin_users WHERE id = ?");
        $stmt->execute(array($user['id']));
        $row = $stmt->fetch();

        if (!verifyPassword($oldPassword, $row['password'])) {
            error('原密码错误');
        }

        $db->prepare("UPDATE admin_users SET password = ? WHERE id = ?")
           ->execute(array(encryptPassword($newPassword), $user['id']));

        writeLog('password_change', "用户 [{$user['username']}] 修改密码");
        success(null, '密码修改成功');
    } catch (Exception $e) {
        error('修改密码失败');
    }
}
