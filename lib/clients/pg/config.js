var defaults = require('./defaults');

var PgConfig = function (config) {
    config = config || {};
    this.host = getConfigVal('host', config);
    this.port = getConfigVal('port', config);
    this.user = getConfigVal('user', config);
    this.database = getConfigVal('database', config);
    this.password = getConfigVal('password', config);
    this.patchTableName = getConfigVal('patchTableName', config);
};

function getConfigVal(key, config) {
    return config[key] || defaults[key];
}

module.exports = PgConfig;