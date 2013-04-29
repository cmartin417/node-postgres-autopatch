var pg = require('pg');

module.exports = function(dbConfig, callback) {

	pg.connect(dbConfig, function(err, client, done) {

		if (err) return callback(err);

		var colors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'white', 'black'];
		var sql = "INSERT INTO balloons (color, size) VALUES ($1, $2)";

	});

};