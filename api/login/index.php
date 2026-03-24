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
$action = isset($_GET['action']) ? $_GET['action'] : '';

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
 * 生成验证码图片（彩色扭曲文字，提高机器人门槛）
 */
function handleCaptcha() {
    $code = '';
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    for ($i = 0; $i < 4; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }

    $_SESSION['captcha_code'] = strtolower($code);
    $_SESSION['captcha_time'] = time();

    $width = 150;
    $height = 50;
    $img = imagecreatetruecolor($width, $height);

    // 背景渐变
    for ($x = 0; $x < $width; $x++) {
        $r = (int)(240 + sin($x * 0.03) * 10);
        $g = (int)(242 + sin($x * 0.04) * 8);
        $b = (int)(247 + sin($x * 0.02) * 5);
        $color = imagecolorallocate($img, $r, $g, $b);
        imageline($img, $x, 0, $x, $height, $color);
    }

    // 干扰线
    for ($i = 0; $i < 6; $i++) {
        $lineColor = imagecolorallocate($img, random_int(150, 220), random_int(150, 220), random_int(150, 220));
        imageline($img, random_int(0, $width), random_int(0, $height),
                  random_int(0, $width), random_int(0, $height), $lineColor);
    }

    // 干扰点
    for ($i = 0; $i < 60; $i++) {
        $dotColor = imagecolorallocate($img, random_int(100, 230), random_int(100, 230), random_int(100, 230));
        imagefilledellipse($img, random_int(0, $width), random_int(0, $height), random_int(1, 3), random_int(1, 3), $dotColor);
    }

    // 彩色文字 - 每个字符不同颜色、不同角度、不同大小
    $colors = [
        imagecolorallocate($img, 200, 50, 50),   // 红
        imagecolorallocate($img, 50, 120, 200),   // 蓝
        imagecolorallocate($img, 80, 160, 60),    // 绿
        imagecolorallocate($img, 180, 80, 200),   // 紫
        imagecolorallocate($img, 200, 140, 30),   // 橙
        imagecolorallocate($img, 30, 150, 150),   // 青
    ];

    $fontSize = 128;
    $x = 20;
    for ($i = 0; $i < strlen($code); $i++) {
        $angle = random_int(-25, 25);
        $y = random_int(28, 38);
        $color = $colors[array_rand($colors)];

        // 尝试 TTF 字体，回退到内置字体
        $fontPaths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
        ];
        $fontFound = false;
        foreach ($fontPaths as $fp) {
            if (file_exists($fp)) {
                imagettftext($img, $fontSize, $angle, $x, $y, $color, $fp, $code[$i]);
                $fontFound = true;
                break;
            }
        }
        if (!$fontFound) {
            imagestring($img, 5, $x, $y - 15, $code[$i], $color);
        }
        $x += random_int(24, 32);
    }

    // 背景噪点
    for ($i = 0; $i < 200; $i++) {
        $c = imagecolorallocate($img, random_int(180, 240), random_int(180, 240), random_int(180, 240));
        imagesetpixel($img, random_int(0, $width), random_int(0, $height), $c);
    }

    header('Content-Type: image/png');
    header('Cache-Control: no-store, no-cache');
    imagepng($img);
    imagedestroy($img);
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

    // 验证码检查
    $expectedCaptcha = isset($_SESSION['captcha_code']) ? $_SESSION['captcha_code'] : '';
    $captchaTime = isset($_SESSION['captcha_time']) ? $_SESSION['captcha_time'] : 0;
    if (empty($expectedCaptcha) || time() - $captchaTime > 300) {
        error('验证码已过期，请刷新');
    }
    if (strtolower($captcha) !== $expectedCaptcha) {
        // 错误后清除验证码
        unset($_SESSION['captcha_code'], $_SESSION['captcha_time']);
        error('验证码错误');
    }
    // 验证通过后清除
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

    // 验证码检查
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

    // 验证码检查
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
