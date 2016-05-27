var fs = require('fs');
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Config = require('./config');

var Runner = function (config) {
    EventEmitter.call(this);
    this.config = new Config(config);
    this.client = this._getDbClient(this.config.dbType, this.config.db);
};

util.inherits(Runner, EventEmitter);

Runner.prototype.run = function (callback) {
    var self = this;

    this.client.checkPatchTable();

    this.client.once('patchTableNotFound', function () {
        self.client.createPatchTable();
    });

    this.client.once('patchLevel', function (patchLevel) {
        self._checkNewPatches(patchLevel);
    });

    this.client.once('error', function (error) {
        self.emit('error', error);
        callback(error);
    });

    this.once('patches', function (patches) {
        if (!patches || !patches.length) {
            self.emit('patchesApplied', 0);
            return;
        }

        self._applyPatches(patches);
    });

    this.once('patchesApplied', function (patchCount) {
        callback(null, patchCount);
    });
};

Runner.prototype._getDbClient = function (dbType, config) {
    if (dbType == 'postgres') {
        var PgClient = require('./clients/pg/client');
        return new PgClient(config);
    } else {
        throw new Error('database type ' + dbType + ' is not supported');
    }
};

Runner.prototype._checkNewPatches = function (patchLevel) {
    var self = this;

    fs.readdir(self.config.patchDir, function(err, files) {
        if (err) {
            self.emit('error', err);
            return;
        }

        var newPatches = files
            .map(self._validate)
            .filter(function (patch) {
                return patch !== null;
            })
            .filter(function (patch) {
                return patch.number > patchLevel;
            })
            .sort(function (a, b) {
                return a.number - b.number;
            });

        self.emit('patches', newPatches);
    });
};

Runner.prototype._applyPatches = function (patches) {
    var self = this;
    var patchCount = 0;
    var patch = patches.shift();

    this.client.applyPatch(path.join(this.config.patchDir, patch.fileName));

    this.client.on('patchApplied', function () {
        self.client.addToPatchTable(patch);
    });

    this.client.on('patchTableRowAdded', function () {
        patchCount++;
        patch = patches.shift();

        if (patch) {
            self.client.applyPatch(path.join(self.config.patchDir, patch.fileName));
        } else {
            self.emit('patchesApplied', patchCount);
        }
    });
};

Runner.prototype._validate = function (patchFileName) {
    var validationRegex = /^(([A-Za-z]+)_)?(\d+)_([A-Za-z0-9_]+)\.(sql|js)$/;

    if (validationRegex.test(patchFileName)) {
        var matches = validationRegex.exec(patchFileName);

        return {
            fileName: patchFileName,
            prefix: matches[2],
            number: parseInt(matches[3]),
            name: matches[4].replace('_', ' '),
            type: matches[5]
        }
    } else {
        return null;
    }
};

module.exports = Runner;