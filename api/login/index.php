<?php
/**
 * 登录接口
 * 兼容 PHP 5.6+
 * POST   /api/login/  - 登录
 * GET    /api/login/  - 检查登录状态
 * POST   /api/login/?action=logout  - 退出登录
 * POST   /api/login/?action=register  - 注册
 * POST   /api/login/?action=forgot  - 忘记密码
 * GET    /api/login/?action=captcha  - 获取验证码
 */
require_once __DIR__ . '/../common.php';

$method = $_SERVER['REQUEST_METHOD'];
// 兼容 action 从 GET 参数和 POST body 两种方式传入
$action = isset($_GET['action']) ? $_GET['action'] : '';
if (empty($action) && $method === 'POST') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);
    if (is_array($body) && isset($body['action'])) {
        $action = $body['action'];
    }
}

switch ($method) {
    case 'POST':
        if ($action === 'logout') { handleLogout(); }
        elseif ($action === 'register') { handleRegister(); }
        elseif ($action === 'forgot') { handleForgot(); }
        else { handleLogin(); }
        break;
    case 'GET':
        if ($action === 'captcha') { handleCaptcha(); }
        else { checkLogin(); }
        break;
    case 'DELETE': handleLogout(); break;
    default: error('不支持的请求方式', 405);
}

/**
 * 生成验证码（暂时返回占位图，验证码功能待修复后启用）
 */
function handleCaptcha() {
    // 生成 4 位随机验证码（不含易混淆字符）
    $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    $code = '';
    for ($i = 0; $i < 4; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    $_SESSION['captcha_code'] = strtolower($code);
    $_SESSION['captcha_time'] = time();

    // 生成带干扰线和噪点的 SVG 验证码
    $colors = ['#333', '#555', '#444', '#666'];
    $bgColors = ['#f0f2f7', '#e8eaf0', '#f5f5fa', '#eaeff5'];
    $bg = $bgColors[random_int(0, count($bgColors) - 1)];

    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80">';
    $svg .= '<rect width="100%" height="100%" fill="' . $bg . '"/>';

    // 干扰线
    for ($i = 0; $i < 3; $i++) {
        $x1 = random_int(10, 50);
        $y1 = random_int(5, 75);
        $x2 = random_int(190, 230);
        $y2 = random_int(5, 75);
        $lineColor = $colors[random_int(0, count($colors) - 1)];
        $svg .= '<line x1="' . $x1 . '" y1="' . $y1 . '" x2="' . $x2 . '" y2="' . $y2 . '" stroke="' . $lineColor . '" stroke-width="1" opacity="0.3"/>';
    }

    // 噪点
    for ($i = 0; $i < 20; $i++) {
        $cx = random_int(5, 235);
        $cy = random_int(5, 75);
        $svg .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="1" fill="#999" opacity="0.4"/>';
    }

    // 绘制每个字符（随机位置偏移和旋转）
    $chars_arr = mb_str_split($code);
    $startX = 30;
    foreach ($chars_arr as $idx => $ch) {
        $x = $startX + $idx * 50 + random_int(-3, 3);
        $y = 45 + random_int(-8, 8);
        $rotate = random_int(-15, 15);
        $fontSize = random_int(28, 36);
        $charColor = $colors[random_int(0, count($colors) - 1)];
        $svg .= '<text x="' . $x . '" y="' . $y . '" font-family="Arial,sans-serif" font-size="' . $fontSize . '" font-weight="bold" fill="' . $charColor . '" text-anchor="middle" dominant-baseline="central" transform="rotate(' . $rotate . ',' . $x . ',' . $y . ')">' . htmlspecialchars($ch) . '</text>';
    }

    $svg .= '</svg>';

    header('Content-Type: image/svg+xml');
    header('Cache-Control: no-store, no-cache');
    echo $svg;
    exit;
}

function handleLogin() {
    global $_jsonBodyCache;
    $_jsonBodyCache = null;

    $data = getJsonBody();
    $username = trim(isset($data['username']) ? $data['username'] : '');
    $password = isset($data['password']) ? $data['password'] : '';
    $captcha  = trim(isset($data['captcha']) ? $data['captcha'] : '');

    if (empty($username) || empty($password)) {
        error('用户名和密码不能为空');
    }
    if (mb_strlen($username) > 50 || mb_strlen($password) > 128) {
        error('输入内容过长');
    }

    $expectedCaptcha = isset($_SESSION['captcha_code']) ? $_SESSION['captcha_code'] : '';
    $captchaTime = isset($_SESSION['captcha_time']) ? $_SESSION['captcha_time'] : 0;
    if (empty($expectedCaptcha) || time() - $captchaTime > 300) {
        error('验证码已过期，请刷新');
    }
    if (strtolower($captcha) !== $expectedCaptcha) {
        unset($_SESSION['captcha_code'], $_SESSION['captcha_time']);
        error('验证码错误');
    }
    unset($_SESSION['captcha_code'], $_SESSION['captcha_time']);

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

/**
 * 用户注册（需要验证码）
 */
function handleRegister() {
    global $_jsonBodyCache;
    $_jsonBodyCache = null;

    $data = getJsonBody();
    $username = trim(isset($data['username']) ? $data['username'] : '');
    $password = isset($data['password']) ? $data['password'] : '';
    $nickname = trim(isset($data['nickname']) ? $data['nickname'] : '');
    $email    = trim(isset($data['email']) ? $data['email'] : '');
    $captcha  = trim(isset($data['captcha']) ? $data['captcha'] : '');

    $expectedCaptcha = isset($_SESSION['captcha_code']) ? $_SESSION['captcha_code'] : '';
    $captchaTime = isset($_SESSION['captcha_time']) ? $_SESSION['captcha_time'] : 0;
    if (empty($expectedCaptcha) || time() - $captchaTime > 300) {
        error('验证码已过期，请刷新');
    }
    if (strtolower($captcha) !== $expectedCaptcha) {
        unset($_SESSION['captcha_code'], $_SESSION['captcha_time']);
        error('验证码错误');
    }
    unset($_SESSION['captcha_code'], $_SESSION['captcha_time']);

    // 输入验证
    if (empty($username)) { error('用户名不能为空'); }
    if (!validateUsername($username)) { error('用户名格式不正确（2-50位字母数字下划线）'); }
    if (mb_strlen($password) < 6 || mb_strlen($password) > 128) { error('密码长度需在 6-128 位之间'); }
    if (empty($nickname)) { $nickname = $username; }
    if (!validateLength($nickname, 1, 50)) { error('昵称长度需在 1-50 位之间'); }
    if (!validateEmail($email)) { error('邮箱格式不正确'); }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM admin_users WHERE username = ?");
        $stmt->execute(array($username));
        if ($stmt->fetch()) { error('用户名已存在'); }

        // 检查邮箱是否已被注册
        if (!empty($email)) {
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ?");
            $stmt->execute(array($email));
            if ($stmt->fetch()) { error('该邮箱已被注册'); }
        }

        $stmt = $db->prepare("INSERT INTO admin_users (username, password, nickname, email, status) VALUES (?, ?, ?, ?, 0)");
        $stmt->execute(array($username, encryptPassword($password), $nickname, $email));
        $userId = $db->lastInsertId();

        writeLog('register', "用户 [$username] 注册成功，待管理员审核");
        success(array('id' => $userId), '注册成功，请等待管理员审核激活');
    } catch (Exception $e) {
        error('注册失败：' . $e->getMessage());
    }
}

/**
 * 忘记密码（通过邮箱重置，需要验证码）
 */
function handleForgot() {
    global $_jsonBodyCache;
    $_jsonBodyCache = null;

    $data = getJsonBody();
    $username = trim(isset($data['username']) ? $data['username'] : '');
    $email    = trim(isset($data['email']) ? $data['email'] : '');
    $captcha  = trim(isset($data['captcha']) ? $data['captcha'] : '');

    $expectedCaptcha = isset($_SESSION['captcha_code']) ? $_SESSION['captcha_code'] : '';
    $captchaTime = isset($_SESSION['captcha_time']) ? $_SESSION['captcha_time'] : 0;
    if (empty($expectedCaptcha) || time() - $captchaTime > 300) {
        error('验证码已过期，请刷新');
    }
    if (strtolower($captcha) !== $expectedCaptcha) {
        unset($_SESSION['captcha_code'], $_SESSION['captcha_time']);
        error('验证码错误');
    }
    unset($_SESSION['captcha_code'], $_SESSION['captcha_time']);

    if (empty($username) || empty($email)) {
        error('用户名和邮箱不能为空');
    }

    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT id, username, email FROM admin_users WHERE username = ? AND email = ? LIMIT 1");
        $stmt->execute(array($username, $email));
        $user = $stmt->fetch();

        if (!$user) {
            // 不泄露用户是否存在
            success(null, '如果账号信息匹配，密码已重置为 123456');
            return;
        }

        // 重置为默认密码
        $newPwd = '123456';
        $db->prepare("UPDATE admin_users SET password = ? WHERE id = ?")
           ->execute(array(encryptPassword($newPwd), $user['id']));

        writeLog('forgot_password', "用户 [{$user['username']}] 重置密码");
        success(null, '密码已重置为 123456，请登录后立即修改密码');
    } catch (Exception $e) {
        error('操作失败');
    }
}
