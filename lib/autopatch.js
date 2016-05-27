var Runner = require('./runner');

exports.run = function (config, callback) {
    new Runner(config).run(callback);
};