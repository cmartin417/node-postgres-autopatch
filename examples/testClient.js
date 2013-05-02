var autopatch = require('../lib/autopatch.js');

var config = {
	patchDir: './patches/',
	db: {
		host: 'localhost',
		port: 5432,
		user: 'db_user',
		database: 'db_name',
		password: 'password'
	}
};

autopatch.run(config, function(err) {
	if (err)
		console.log(err);
	
	console.log('autopatch done');
	process.exit();
});
