<?php
/**
 * 登录接口
 * 兼容 PHP 5.6+
 * POST   /api/login/  - 登录
 * GET    /api/login/  - 检查登录状态
 * DELETE /api/login/  - 退出登录
 */
require_once __DIR__ . '/../common.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST': handleLogin(); break;
    case 'GET':  checkLogin(); break;
    case 'DELETE': handleLogout(); break;
    default: error('不支持的请求方式', 405);
}

function handleLogin() {
    $data = getJsonBody();
    $username = trim(isset($data['username']) ? $data['username'] : '');
    $password = isset($data['password']) ? $data['password'] : '';

    if (empty($username) || empty($password)) {
        error('用户名和密码不能为空');
    }
    if (mb_strlen($username) > 50 || mb_strlen($password) > 128) {
        error('输入内容过长');
    }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = ? LIMIT 1");
        $stmt->execute(array($username));
        $user = $stmt->fetch();

        if (!$user || !verifyPassword($password, $user['password'])) {
            usleep(random_int(100000, 300000));
            error('用户名或密码错误');
        }

        if ($user['status'] != 1) {
            error('账号已被禁用，请联系管理员');
        }

        // 旧 MD5 密码自动升级为 bcrypt
        if (strlen($user['password']) === 32 && ctype_xdigit($user['password'])) {
            $newHash = encryptPassword($password);
            $db->prepare("UPDATE admin_users SET password = ? WHERE id = ?")->execute(array($newHash, $user['id']));
        }

        $db->prepare("UPDATE admin_users SET last_login = NOW() WHERE id = ?")->execute(array($user['id']));

        unset($user['password']);
        $_SESSION['admin_user'] = $user;

        writeLog('login', "用户 [$username] 登录成功");
        success($user, '登录成功');
    } catch (Exception $e) {
        error('登录失败：' . $e->getMessage());
    }
}

function checkLogin() {
    $user = getCurrentUser();
    if ($user) {
        success($user, '已登录');
    } else {
        unauthorized();
    }
}

function handleLogout() {
    $user = getCurrentUser();
    $uname = (isset($user['username']) && $user['username']) ? $user['username'] : 'unknown';
    writeLog('logout', "用户 [$uname] 退出登录");
    session_destroy();
    success(null, '已退出登录');
}
