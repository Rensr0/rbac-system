/**
 * 版本配置文件
 * 用于管理静态资源版本号，方便缓存控制
 */
var VERSION = {
    css: '1.0.7',
    js: '1.0.7',
    build: '20240324'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VERSION;
}
