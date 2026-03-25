<?php
/**
 * 公共方法文件
 * 兼容 PHP 5.6+
 * 包含：响应函数、权限验证、Session管理、安全加固、工具函数
 */

// ==================== PHP 错误处理（防止 HTML 污染 JSON） ====================
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// 自定义错误日志路径
$logDir = dirname(__DIR__) . '/logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
ini_set('error_log', $logDir . '/php-error.log');

// 自定义错误日志函数
function logError($message, $level = 'ERROR') {
    $logFile = dirname(__DIR__) . '/logs/php-error.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : 'unknown';
    $logMessage = "[{$timestamp}] [{$level}] [{$ip}] {$uri} - {$message}\n";
    @file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// 全局异常/错误捕获，保证始终返回 JSON
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    $errorMsg = "Error in {$file}:{$line} - {$message}";
    logError($errorMsg, 'ERROR');
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function ($e) {
    $errorMsg = "Uncaught Exception: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine();
    logError($errorMsg, 'FATAL');
    
    header('Content-Type: application/json; charset=utf-8');
    $debugMode = envGet('APP_DEBUG') === 'true';
    $response = [
        'code' => 500,
        'msg'  => $debugMode ? $e->getMessage() : '服务器内部错误',
        'data' => null
    ];
    if ($debugMode) {
        $response['file'] = $e->getFile();
        $response['line'] = $e->getLine();
        $response['trace'] = $e->getTraceAsString();
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
});

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        $errorMsg = "Fatal Error: {$error['message']} in {$error['file']}:{$error['line']}";
        logError($errorMsg, 'FATAL');
    }
});

// ==================== Session 安全配置 ====================
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_lifetime', 0);
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', 1);
}
// samesite 需要 PHP 7.3+
if (version_compare(PHP_VERSION, '7.3.0', '>=')) {
    ini_set('session.cookie_samesite', 'Strict');
}
session_start();

// 防止 Session 固定攻击
if (!isset($_SESSION['_initiated'])) {
    session_regenerate_id(true);
    $_SESSION['_initiated'] = true;
}

// ==================== 安全响应头 ====================
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store, no-cache, must-revalidate');

// CORS 白名单
$allowedOrigins = array(
    'http://localhost',
    'http://127.0.0.1',
    'https://panel.shixis.site',
    'https://shixis.site',
);
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (!empty($origin)) {
    // 未在白名单的来源，不设置 CORS 头（浏览器会阻止）
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';

// ==================== 数据库自动迁移 ====================
try {
    $db = getDB();
    // 检查 role_router 表是否有 permissions 列
    $col = $db->query("SHOW COLUMNS FROM role_router LIKE 'permissions'")->fetch();
    if (!$col) {
        $db->exec("ALTER TABLE role_router ADD COLUMN permissions INT NOT NULL DEFAULT 1 COMMENT '权限位掩码:1=查看 2=编辑 4=删除 7=全部'");
        $db->exec("UPDATE role_router SET permissions = 7");
    }
} catch (Exception $e) {
    // 迁移失败不影响启动（新表会在 install.sql 中创建）
}

// ==================== 响应函数 ====================

function jsonResponse($code, $msg, $data = null) {
    echo json_encode(array(
        'code' => $code,
        'msg'  => $msg,
        'data' => $data
    ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function success($data = null, $msg = '操作成功') {
    jsonResponse(200, $msg, $data);
}

function error($msg = '操作失败', $code = 500) {
    jsonResponse($code, $msg, null);
}

function unauthorized($msg = '未登录或登录已过期') {
    jsonResponse(401, $msg, null);
}

function forbidden($msg = '没有权限访问') {
    jsonResponse(403, $msg, null);
}

function notFound($msg = '资源不存在') {
    jsonResponse(404, $msg, null);
}

// ==================== 请求参数 ====================

function getParam($key, $default = null) {
    $value = isset($_GET[$key]) ? $_GET[$key] : (isset($_POST[$key]) ? $_POST[$key] : null);
    if ($value !== null) {
        return is_string($value) ? trim($value) : $value;
    }
    $body = getJsonBody();
    $value = isset($body[$key]) ? $body[$key] : $default;
    return is_string($value) ? trim($value) : $value;
}

$_jsonBodyCache = null;
function getJsonBody() {
    global $_jsonBodyCache;
    if ($_jsonBodyCache === null) {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        $_jsonBodyCache = is_array($data) ? $data : array();
    }
    return $_jsonBodyCache;
}

function getBodyParam($key, $default = null) {
    $body = getJsonBody();
    return isset($body[$key]) ? $body[$key] : $default;
}

// ==================== 输入验证 ====================

function validateLength($value, $min = 0, $max = 255) {
    $len = mb_strlen($value, 'UTF-8');
    return $len >= $min && $len <= $max;
}

function validateUsername($username) {
    return (bool)preg_match('/^[a-zA-Z0-9_]{2,50}$/', $username);
}

function validateEmail($email) {
    return empty($email) || filter_var($email, FILTER_VALIDATE_EMAIL);
}

function e($str) {
    return htmlspecialchars($str ? $str : '', ENT_QUOTES, 'UTF-8');
}

// ==================== Session & 登录验证 ====================

function getCurrentUser() {
    return isset($_SESSION['admin_user']) ? $_SESSION['admin_user'] : null;
}

function requireLogin() {
    $user = getCurrentUser();
    if (!$user) {
        unauthorized();
    }
    return $user;
}

function requireSuper() {
    $user = requireLogin();
    $isSuper = isset($user['is_super']) ? $user['is_super'] : 0;
    if ($isSuper != 1) {
        forbidden();
    }
    return $user;
}

// ==================== 权限验证 ====================

// 权限位掩码常量
define('PERM_VIEW', 1);
define('PERM_EDIT', 2);
define('PERM_DELETE', 4);
define('PERM_ALL', 7);

// 权限数组 ↔ 位掩码 互转
function permsToBitmask($perms) {
    $mask = 0;
    if (in_array('view', $perms))   $mask |= PERM_VIEW;
    if (in_array('edit', $perms))   $mask |= PERM_EDIT;
    if (in_array('delete', $perms)) $mask |= PERM_DELETE;
    return $mask;
}

function bitmaskToPerms($mask) {
    $perms = array();
    if ($mask & PERM_VIEW)   $perms[] = 'view';
    if ($mask & PERM_EDIT)   $perms[] = 'edit';
    if ($mask & PERM_DELETE) $perms[] = 'delete';
    return $perms;
}

function hasPermission($routerPath) {
    $user = getCurrentUser();
    if (!$user) return false;
    if ((isset($user['is_super']) ? $user['is_super'] : 0) == 1) return true;

    try {
        $db = getDB();
        $stmt = $db->prepare("
            SELECT COUNT(*) as cnt FROM role_router rr
            INNER JOIN user_role ur ON ur.role_id = rr.role_id
            INNER JOIN routers r ON r.id = rr.router_id
            WHERE ur.user_id = ? AND r.router_path = ? AND r.status = 1 AND rr.permissions > 0
        ");
        $stmt->execute(array($user['id'], $routerPath));
        $row = $stmt->fetch();
        return $row && $row['cnt'] > 0;
    } catch (Exception $e) {
        return false;
    }
}

// 检查用户对某路由是否有特定权限级别
function hasPermLevel($routerPath, $level) {
    $user = getCurrentUser();
    if (!$user) return false;
    if ((isset($user['is_super']) ? $user['is_super'] : 0) == 1) return true;

    try {
        $db = getDB();
        $stmt = $db->prepare("
            SELECT MAX(rr.permissions) as max_perm FROM role_router rr
            INNER JOIN user_role ur ON ur.role_id = rr.role_id
            INNER JOIN routers r ON r.id = rr.router_id
            WHERE ur.user_id = ? AND r.router_path = ? AND r.status = 1
        ");
        $stmt->execute(array($user['id'], $routerPath));
        $row = $stmt->fetch();
        if (!$row || !$row['max_perm']) return false;
        return ($row['max_perm'] & $level) == $level;
    } catch (Exception $e) {
        return false;
    }
}

function requirePermission($routerPath) {
    if (!hasPermission($routerPath)) {
        forbidden();
    }
}

function requirePermLevel($routerPath, $level) {
    if (!hasPermLevel($routerPath, $level)) {
        forbidden('没有操作权限');
    }
}

// ==================== 分页 ====================

function getPagination() {
    $page  = max(1, intval(getParam('page', 1)));
    $limit = max(1, min(100, intval(getParam('limit', 10))));
    $offset = ($page - 1) * $limit;
    return array('page' => $page, 'limit' => $limit, 'offset' => $offset);
}

// ==================== 密码工具（bcrypt + MD5 兼容） ====================

function encryptPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, array('cost' => 10));
}

function verifyPassword($input, $stored) {
    // 兼容旧 MD5 密码：如果存储的是 32 位 hex，用 MD5 校验
    if (strlen($stored) === 32 && ctype_xdigit($stored)) {
        return md5($input) === $stored;
    }
    return password_verify($input, $stored);
}

// ==================== 操作日志 ====================

function writeLog($action, $detail = '') {
    try {
        $user = getCurrentUser();
        $db = getDB();
        $stmt = $db->prepare("INSERT INTO operation_logs (user_id, username, action, detail, ip) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(array(
            isset($user['id']) ? $user['id'] : 0,
            isset($user['username']) ? $user['username'] : 'system',
            $action,
            $detail,
            isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown'
        ));
    } catch (Exception $e) {
        // 日志写入失败不影响业务
    }
}
