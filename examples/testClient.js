var path = require('path');
var autopatch = require('../lib/autopatch.js');

var config = {
	patchDir: path.resolve(__dirname, './patches/'),
    dbType: 'postgres',
	db: {
		host: 'localhost',
		port: 5432,
		user: 'postgres',
		database: 'autopatch_test',
		password: 'password',
		patchTableName: 'patches'
	}
};

autopatch.run(config, function(err, newPatchCount) {
	if (err) {
        console.log('autopatch error: ', err);
	}
	
	console.log('autopatch done. %d new patches applied', newPatchCount);
	process.exit();
});
