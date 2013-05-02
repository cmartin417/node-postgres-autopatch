#node-postgres-autopatch

Node application for automatically applying postgreSQL database patches.

#Features

* Automatic database patch application
* SQL patches
* Javascript patches

#Installation

`npm install postgres-autopatch`

#Examples

	var autopatch = require('../lib/autopatch.js');

	var config = {
		patchDir: './patches/',
		db: {
			host: 'localhost',
			port: 5432,
			user: 'postgres',
			database: 'db_name',
			password: 'password'
		}
	};

	autopatch.run(config, function(err) {
		console.log('autopatch done');
	});

#Notes

postgres-autopatch will create a table in the specified database called 'db_patch', in order to keep track of the applied patches. It will look in the patch directory specified in the config object for new patches to apply. New patches should be placed in this directory and postgres-autopatch will apply them when the autopatcher's `run` method is called. `run` should be called on application startup, so that it finishes before any server logic is executed. Patches should have names following the pattern `db_001_patch_name.sql` or `db_002_patch_name.js`.

##SQL Patches

An SQL patch file can be any valid SQL file. Every statement in the patch file will be executed in sequence.

##Javascript Patches

postgres-autopatch also supports javascript patch files, where more complex patches can be applied with logic. Javascript patch files must adhere to a specific format in order for them to be applied correctly. For Example:

	var pg = require('pg');

	module.exports = function(dbConfig, callback) {

		pg.connect(dbConfig, function(err, client, done) {
			var sql = "SELECT * FROM test_table";
			
			client.query(sql, function(err, response) {
				console.log(response);
				done();
			});
		});
	};

You must use `require('pg')` in the patch file and export a function with a `dbConfig` and `callback` parameter. You may then use the `dbConfig` object to connect to the database and query using whatever logic you want.
