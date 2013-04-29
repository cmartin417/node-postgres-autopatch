var fs = require('fs');
var pg = require('pg');
var path = require('path');

// creates a pgClient object
var pgClient = function(config) {

	this.patchTableCreateScript = __dirname + '/createPatchTable.sql';
	this.configObject = config;

};

// check database patch table. If the table does not exist, create it.
pgClient.prototype.checkPatchTable = function(callback) {
	
	var self = this;

	pg.connect(self.configObject, function(err, client, done) {
		if (err) return callback(err);
		var sql = "SELECT MAX(patch_number) from db_patch";

		client.query(sql, function(err, result) {
			done();

			if (err) return createPatchTable(callback);
			if (result.rows[0].max) return callback(null, result.rows[0].max); 
			
			callback(null, 0);
		});
	});

	var createPatchTable = function(callback) {
		self.applyPatch(self.patchTableCreateScript, function(err) {
			if (err) return callback(err);
			console.log('patch table created');
			callback(null, 0);
		});
	};
};

// adds a patch to the db_patch table
pgClient.prototype.addToPatchTable = function(patch, callback) {

	pg.connect(this.configObject, function(err, client, done) {
		if (err) return callback(err);
		var sql = "INSERT INTO db_patch VALUES($1, $2, NOW())";

		client.query(sql, [patch.number, patch.name], function(err) {
			if (err) return callback(err);
			callback()
		});
	});

};

// reads a patch file
pgClient.prototype.applyPatch = function(filepath, callback) {

	var self = this;
	var ext = path.extname(filepath);

	if (ext == '.sql') {

		fs.readFile(filepath, 'utf8', function(err, data) {
			if (err) return callback(err);
			execSqlScript(self.configObject, data, callback);
		});

	} else if (ext == '.js') {
		execJsScript(self.configObject, filepath, callback);
	} else {
		callback(new Error('patch files with ' + ext + ' extensions not supported'));
	}
};

// executes an SQL patch script
var execSqlScript = function (dbConfig, sql, callback) {
	
	var statements = sql.split(/;\s*$/m);
	console.log('************ execute script *************');
	
	pg.connect(dbConfig, function(err, client, done) {
		if (err) finish(err);

		var next = function(err, response) {
			if (err) return finish(err);
			if (response) console.dir(response);

			var statement = statements.shift();
			
			if (statement) {
				client.query(statement, next);
			} else {
				finish();
			}
		};

		var finish = function(err) {
			done();
			if (err) return callback(err);
			callback();
		};
		
		next();

	});
};

// executes a javascript patch
var execJsScript = function (dbConfig, filename, callback) {
	
	var file = process.cwd() + '/' + filename;
	var patch = require(file);

	patch(dbConfig, function(err) {
		if (err) return callback(err);
		console.log('successfully applied javascript patch from file: %s', file);
		callback();
	});
	
};

module.exports = pgClient;