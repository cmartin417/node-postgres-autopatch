var defaults = require('./defaults');

var Config = function (config) {
    config = config || {};
    this.dbType = getConfigVal('dbType', config);
    this.db = getConfigVal('db', config);
    this.patchDir = getConfigVal('patchDir', config);
};

function getConfigVal(key, config) {
    return config[key] || defaults[key];
}

module.exports = Config;