var fs = require('fs');
var path = require('path');
var async = require('async');

var config = null;
var patchDir = './patch/';

exports.run = function (configObj, callback) {
    var dbClient;
    config = configObj;
    patchDir = config.patchDir ? config.patchDir : patchDir;

    async.waterfall([
        function (next) {
            getClient(config, next);
        },
        function (client, next) {
            dbClient = client;
            dbClient.checkPatchTable(next);
        },
        function (patchLevel, next) {
            console.log('\x1b[36mautopatch:\x1b[0m current patch level: %d', patchLevel);
            checkNewPatches(patchLevel, patchDir, next);
        },
        function (newPatches, next) {
            if (!newPatches) {
                return next();
            }

            console.log('\x1b[36mautopatch:\x1b[0m found %d new patches', newPatches.length);

            var patchFunctions = newPatches.map(function (patch) {
                return function (next) {
                    applyPatch(dbClient, patchDir, patch, next);
                };
            });

            async.waterfall(patchFunctions, callback);
        }
    ]);
};

function applyPatch(dbClient, patchDir, patch, callback) {
    var patchFilePath = path.join(patchDir, patch.fileName);

    dbClient.applyPatch(patchFilePath, function (err) {
        if (err) {
            return callback(err);
        }

        dbClient.addToPatchTable(patch, callback);
    });
}


// checks the patch directory and returns an array containing any patches above the specified patch level
function checkNewPatches (patchLevel, patchDir, callback) {
    console.log('\x1b[36mautopatch:\x1b[0m checking for new patches in directory %s', patchDir);

	fs.readdir(patchDir, function(err, files) {
		if (err) {
            return callback(err);
        }

        console.log('\x1b[36mautopatch:\x1b[0m found %d patch files', files.length);
		
		var newPatches = files
            .map(validatePatchFileName)
            .filter(function (patch) {
                return patch !== null;
            })
            .filter(function (patch) {
                return patch.number > patchLevel;
            })
            .sort(function (a, b) {
                return a.number - b.number;
            });

		callback(null, newPatches);
	});
}

function validatePatchFileName (patchFileName) {
    var validationRegex = /([A-Za-z]+)_(\d+)_([A-Za-z_]+)\.(sql|js)$/;

    if (validationRegex.test(patchFileName)) {
        var matches = validationRegex.exec(patchFileName);

        return {
            fileName: patchFileName,
            prefix: matches[1],
            number: matches[2],
            name: matches[3],
            type: matches[4]
        }
    } else {
        return null;
    }
}

// gets the database client
function getClient (config, callback) {
	var dbClient = require('./clients/pg/client.js');
	return callback(null, new dbClient(config.db));
}