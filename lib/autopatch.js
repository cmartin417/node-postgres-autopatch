var fs = require('fs');
var path = require('path');

var supportedDbClients = ['pg'];
var client = null;
var config = null;
var patchDir = './patch/';

// runs autopatcher
exports.run = function(configObj, callback) {

	config = configObj;
	patchDir = config.patchDir ? config.patchDir : patchDir;

	getClient(config, function(err, dbClient) {
		if (err) return callback(err);
		client = dbClient;
	});

	if (!client) {
		console.log("Could not create a database client");
		return;
	}
                               
	client.checkPatchTable(function(err, patchLevel) {
		if (err) return callback(err);

		console.log('patch level = ' + patchLevel);

		checkNewPatches(patchLevel, function(err, newPatches) {
			if (err) return callback(err);
			if (!newPatches) return callback();

			console.log('%d new patches', newPatches.length);
			
			var next = function(err) {
				if (err) return callback(err);
				
				var patch = newPatches.shift();

				if (patch) {
					client.applyPatch(patchDir + patch.file, function(err) {
						if (err) return callback(err);
						client.addToPatchTable(patch, next);
					});
				} else {
					callback();
				};
			}

			next();
		});
	});
};

//
// checks the patch directory and returns an array containing any patches above the specified patch level
var checkNewPatches = function(patchLevel, callback) {
	
	fs.readdir(patchDir, function(err, files) {
		if (err) return callback(err);
		
		var newPatches = [];

		for (var i = 0; i < files.length; i++) {
			var parts = files[i].split('_');
			var number = parseInt(parts[1]);

			if (number > patchLevel) {
				parts.splice(0, 2);			
				var name = parts.join(' ');
				name = name.replace(path.extname(files[i]), '');

				newPatches.push({
					number: number,
					name: name, 
					file: files[i]
				});
			}
		}

		if (newPatches.length > 0)
			newPatches.sort(function(a, b) {return a.number-b.number});
		else 
			newPatches = null;

		callback(null, newPatches);
	});

};

// gets the database client
var getClient = function(config, callback) {

	if (supportedDbClients.indexOf(config.db.client) < 0) {
		return callback(new Error('Autopatcher failed - this version of autopatcher does no support your database client'));
	} 

	if (config.db.client == 'pg'){
		var dbClient = require('./clients/pg/client.js');
		return callback(null, new dbClient(config.db));
	}

	callback(new Error('error'));
};