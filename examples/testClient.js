var autopatch = require('../lib/autopatch.js');

var config = {
	patchDir: './patches/',
	db: {
		host: 'localhost',
		port: 5432,
		user: 'postgres',
		database: 'autopatch_test',
		password: 'password'
	}
};

autopatch.run(config, function(err) {
	if (err) {
        console.log('autopatch error: ', err);
	}
	
	console.log('autopatch done');
	process.exit();
});
