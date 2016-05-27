var fs = require('fs');
var pg = require('pg');
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var PgConfig = require('./config');

// creates a pgClient object
var PgClient = function (config) {
	EventEmitter.call(this);
	this.config = new PgConfig(config);
    this.patchTableName = this.config.patchTableName;
    this.connectionConfig = {
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        database: this.config.database,
        password: this.config.password
    };
};

util.inherits(PgClient, EventEmitter);

// check database patch table. If the table does not exist, create it.
PgClient.prototype.checkPatchTable = function () {
	var self = this;

	pg.connect(this.connectionConfig, function (err, client, done) {
        done();

		if (err) {
            self.emit('error', err);
            return;
        }

		var sql = "SELECT MAX(patch_number) from " + self.patchTableName;

		client.query(sql, function (err, result) {
			done();

			if (err) {
                self.emit('patchTableNotFound');
                return;
            }

			if (result.rows[0].max) {
                self.emit('patchLevel', result.rows[0].max);
                return;
            }
			
			self.emit('patchLevel', 0);
		});
	});
};

PgClient.prototype.createPatchTable = function () {
    var self = this;

    var createPatchTableSql = '' +
        'CREATE TABLE ' + self.config.patchTableName +' ( ' +
        '   patch_number integer NOT NULL, ' +
        '   patch_name text, ' +
        '   patch_install_date_time timestamp with time zone NOT NULL, ' +
        '   CONSTRAINT patch_number PRIMARY KEY (patch_number) ' +
        ') WITH (OIDS=FALSE); ' +
        'ALTER TABLE ' + self.config.patchTableName + ' ' +
        'OWNER TO ' + self.config.user + ';';

    self._execSql(createPatchTableSql, function (err) {
        if (err) {
            self.emit('error', err);
            return;
        }

        self.emit('patchLevel', 0);
    });
};

// adds a patch to the db_patch table
PgClient.prototype.addToPatchTable = function(patch) {
    var self = this;

	pg.connect(this.connectionConfig, function(err, client, done) {
        if (err) {
            self.emit('error', err);
            return;
        }

		var sql = "INSERT INTO " + self.patchTableName + " VALUES($1, $2, NOW())";

		client.query(sql, [patch.number, patch.name], function (err) {
            done();

			if (err) {
                self.emit('error', err);
                return;
            }

            self.emit('patchTableRowAdded');
		});
	});

};

// reads a patch file
PgClient.prototype.applyPatch = function (filepath) {
	var self = this;
	var ext = path.extname(filepath);

    function scriptComplete (err) {
        if (err) {
            self.emit('error', err);
            return;
        }

        self.emit('patchApplied');
    }

	if (ext == '.sql') {
        self._execSqlPatchFile(filepath, scriptComplete);
	} else if (ext == '.js') {
		self._execJsPatchFile(filepath, scriptComplete);
	} else {
		self.emit('error', new Error('patch files with ' + ext + ' extensions not supported'));
	}
};

// executes an SQL patch script
PgClient.prototype._execSqlPatchFile = function (file, callback) {
    var self = this;

    fs.readFile(file, 'utf8', function (err, sql) {
        if (err) {
            return callback(err);
        }

        self._execSql(sql, callback);
    });
};

PgClient.prototype._execSql = function (sql, callback) {
    var statements = sql.split(/;\s*$/m);

    pg.connect(this.connectionConfig, function(err, client, done) {
        if (err) {
            finish(err);
        }

        function next (err, response) {
            if (err) {
                return finish(err);
            }

            var statement = statements.shift();

            if (statement) {
                client.query(statement, next);
            } else {
                finish();
            }
        }

        function finish (err) {
            done();

            if (err)  {
                return callback(err);
            }

            callback();
        }

        next();
    });
};

// executes a javascript patch
PgClient.prototype._execJsPatchFile = function (file, callback) {
	var patch = require(file);

	patch(this.connectionConfig, function(err) {
		if (err) {
            return callback(err);
        }

		callback();
	});
};

module.exports = PgClient;