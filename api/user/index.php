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
        elseif ($action === 'batch_status') { batchUpdateStatus(); }
        elseif ($action === 'batch_import') { batchImportUsers(); }
        elseif ($action === 'avatar') { uploadAvatar(); }
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

        // 返回更新后的用户数据，方便前端同步
        $stmt = $db->prepare("SELECT id, username, nickname, avatar, email, phone, status, is_super, last_login, create_time FROM admin_users WHERE id = ?");
        $stmt->execute(array($id));
        $updatedUser = $stmt->fetch();

        $logDetail = "更新用户 ID=$id";
        if ($status !== null) { $logDetail .= ', 状态=' . ($status ? '启用' : '禁用'); }
        writeLog('user_update', $logDetail);
        success($updatedUser, '更新成功');
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

function batchUpdateStatus() {
    requireSuper();

    $data = getJsonBody();
    $ids = isset($data['ids']) ? $data['ids'] : array();
    $status = isset($data['status']) ? intval($data['status']) : -1;

    if (empty($ids)) { error('请选择至少一个用户'); }
    if (!in_array($status, array(0, 1), true)) { error('状态值无效（0=禁用，1=启用）'); }

    $currentUser = getCurrentUser();
    $idList = array();
    foreach ($ids as $id) {
        $id = intval($id);
        if ($id > 0 && $id !== $currentUser['id']) { // 不能修改自己
            $idList[] = $id;
        }
    }

    if (empty($idList)) { error('没有有效的用户ID'); }

    try {
        $db = getDB();
        $placeholders = implode(',', array_fill(0, count($idList), '?'));
        $db->prepare("UPDATE admin_users SET status = ? WHERE id IN ($placeholders)")->execute(array_merge(array($status), $idList));

        $statusText = $status ? '启用' : '禁用';
        $count = count($idList);
        writeLog('user_update', "批量{$statusText} {$count} 个用户");
        success(array('count' => $count), "已{$statusText} {$count} 个用户");
    } catch (Exception $e) {
        error('批量操作失败');
    }
}

function batchImportUsers() {
    requireSuper();

    $data = getJsonBody();
    $users = isset($data['users']) ? $data['users'] : array();
    $defaultPwd = isset($data['default_password']) ? $data['default_password'] : '123456';

    if (empty($users)) { error('没有要导入的用户数据'); }
    if (count($users) > 500) { error('单次导入不超过500个用户'); }

    $db = getDB();
    $successCount = 0;
    $failCount = 0;
    $errors = array();

    foreach ($users as $u) {
        $username = trim(isset($u['username']) ? $u['username'] : '');
        if (empty($username)) { $failCount++; $errors[] = '空账号'; continue; }
        if (!validateUsername($username)) { $failCount++; $errors[] = "$username: 账号格式不合法"; continue; }

        $password = !empty(trim($u['password'])) ? trim($u['password']) : $defaultPwd;
        $nickname = trim(isset($u['nickname']) ? $u['nickname'] : '');
        $email    = trim(isset($u['email']) ? $u['email'] : '');
        $phone    = trim(isset($u['phone']) ? $u['phone'] : '');

        if (!validateEmail($email)) { $failCount++; $errors[] = "$username: 邮箱格式错误"; continue; }
        if (!validateLength($nickname, 0, 50)) { $failCount++; $errors[] = "$username: 昵称过长"; continue; }

        try {
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE username = ?");
            $stmt->execute(array($username));
            if ($stmt->fetch()) { $failCount++; $errors[] = "$username: 账号已存在"; continue; }

            $hashed = encryptPassword($password);
            $stmt = $db->prepare("INSERT INTO admin_users (username, password, nickname, email, phone) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute(array($username, $hashed, $nickname, $email, $phone));
            $successCount++;
        } catch (Exception $e) {
            $failCount++;
            $errors[] = "$username: 导入失败";
        }
    }

    writeLog('user_create', "批量导入用户: 成功 $successCount 个, 失败 $failCount 个");
    success(array(
        'success_count' => $successCount,
        'fail_count' => $failCount,
        'errors' => array_slice($errors, 0, 10) // 最多返回10条错误
    ), "导入完成：成功 {$successCount} 个，失败 {$failCount} 个");
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

        // 修改密码后销毁当前 session，强制重新登录
        session_destroy();
        success(array('require_logout' => true), '密码修改成功，请重新登录');
    } catch (Exception $e) {
        error('修改密码失败');
    }
}

function uploadAvatar() {
    $user = requireLogin();
    $isSuper = (isset($user['is_super']) ? $user['is_super'] : 0) == 1;

    // 支持指定用户ID（仅超级管理员）或默认为自己
    $targetId = intval(getParam('id', $user['id']));
    if ($targetId !== $user['id'] && !$isSuper) {
        forbidden('只能修改自己的头像');
    }

    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        error('请选择头像文件');
    }

    $file = $_FILES['avatar'];
    $maxSize = 2 * 1024 * 1024; // 2MB
    if ($file['size'] > $maxSize) {
        error('头像文件不能超过 2MB');
    }

    $allowedTypes = array('image/jpeg', 'image/png', 'image/gif', 'image/webp');
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes, true)) {
        error('仅支持 JPG/PNG/GIF/WebP 格式的图片');
    }

    // 确保上传目录存在
    $uploadDir = dirname(__DIR__) . '/uploads/avatars';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }

    // 生成文件名
    $ext = 'jpg';
    if ($mimeType === 'image/png') $ext = 'png';
    elseif ($mimeType === 'image/gif') $ext = 'gif';
    elseif ($mimeType === 'image/webp') $ext = 'webp';

    $filename = $targetId . '_' . time() . '.' . $ext;
    $destPath = $uploadDir . '/' . $filename;

    // 读取原图并压缩到最大 200x200
    $srcImage = null;
    if ($mimeType === 'image/jpeg') {
        $srcImage = @imagecreatefromjpeg($file['tmp_name']);
    } elseif ($mimeType === 'image/png') {
        $srcImage = @imagecreatefrompng($file['tmp_name']);
    } elseif ($mimeType === 'image/gif') {
        $srcImage = @imagecreatefromgif($file['tmp_name']);
    } elseif ($mimeType === 'image/webp') {
        $srcImage = @imagecreatefromwebp($file['tmp_name']);
    }

    if (!$srcImage) {
        error('无法读取图片文件');
    }

    $origW = imagesx($srcImage);
    $origH = imagesy($srcImage);
    $size = 200;
    $scale = min($size / $origW, $size / $origH);
    $newW = (int)($origW * $scale);
    $newH = (int)($origH * $scale);

    $dstImage = imagecreatetruecolor($newW, $newH);
    // 保留 PNG/GIF 透明通道
    imagealphablending($dstImage, false);
    imagesavealpha($dstImage, true);
    $transparent = imagecolorallocatealpha($dstImage, 0, 0, 0, 127);
    imagefill($dstImage, 0, 0, $transparent);

    imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
    imagedestroy($srcImage);

    // 保存为 JPEG（统一格式，体积小）
    $finalPath = $uploadDir . '/' . $targetId . '_' . time() . '.jpg';
    imagejpeg($dstImage, $finalPath, 85);
    imagedestroy($dstImage);

    // 删除可能的旧格式文件
    // 清理旧头像（保留最新的）
    $avatarUrl = '/api/uploads/avatars/' . basename($finalPath);

    try {
        $db = getDB();
        // 删除旧头像文件
        $stmt = $db->prepare("SELECT avatar FROM admin_users WHERE id = ?");
        $stmt->execute(array($targetId));
        $oldAvatar = $stmt->fetch();
        if ($oldAvatar && !empty($oldAvatar['avatar']) && strpos($oldAvatar['avatar'], '/api/uploads/avatars/') === 0) {
            $oldFile = dirname(__DIR__) . substr($oldAvatar['avatar'], 4); // /api/uploads -> uploads
            if (file_exists($oldFile)) {
                @unlink($oldFile);
            }
        }

        $stmt = $db->prepare("UPDATE admin_users SET avatar = ? WHERE id = ?");
        $stmt->execute(array($avatarUrl, $targetId));

        // 返回更新后的用户信息
        $stmt = $db->prepare("SELECT id, username, nickname, avatar, email, phone, status, is_super, last_login, create_time FROM admin_users WHERE id = ?");
        $stmt->execute(array($targetId));
        $updatedUser = $stmt->fetch();

        // 如果是修改自己，同步 session
        if ($targetId == $user['id']) {
            $_SESSION['admin_user']['avatar'] = $avatarUrl;
        }

        writeLog('user_update', "用户 ID=$targetId 上传头像");
        success($updatedUser, '头像上传成功');
    } catch (Exception $e) {
        error('头像保存失败');
    }
}
