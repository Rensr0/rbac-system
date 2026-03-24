<?php
/**
 * 数据库配置文件
 * 请根据实际环境修改以下配置
 * 
 * 生产环境建议使用环境变量：
 * Windows: set DB_HOST=localhost
 * Linux/Mac: export DB_HOST=localhost
 * 或使用 .env 文件（复制 .env.example 为 .env）
 */

function loadEnv($file = null) {
    $file = $file ?: dirname(dirname(__DIR__)) . '/.env';
    if (!file_exists($file)) return;
    
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        
        if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

loadEnv();

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'rbac_system');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '123456');
define('DB_CHARSET', 'utf8mb4');

/**
 * 获取数据库连接（PDO）
 * 使用单例模式，避免重复创建连接
 * 自动重连机制
 */
function getDB() {
    static $pdo = null;
    static $lastError = null;
    
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_PERSISTENT         => false,
                PDO::MYSQL_ATTR_INIT_COMMAND  => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
                PDO::ATTR_TIMEOUT           => 5,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            $lastError = null;
        } catch (PDOException $e) {
            $lastError = $e->getMessage();
            error_log('Database connection failed: ' . $lastError);
            throw $e;
        }
    } else {
        try {
            $pdo->query('SELECT 1');
        } catch (PDOException $e) {
            $pdo = null;
            return getDB();
        }
    }
    
    return $pdo;
}
