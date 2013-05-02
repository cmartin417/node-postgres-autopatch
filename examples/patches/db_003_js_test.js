var pg = require('pg');

module.exports = function(dbConfig, callback) {

	pg.connect(dbConfig, function(err, client, done) {

		if (err) return callback(err);

		var inserts = 10;
		var i = 0;
		var colors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'white', 'black'];
		var sql = "INSERT INTO balloons (color, size) VALUES ($1, $2)";

		var insert = function(err) {
			if (err) return finish(err);
			if (i == inserts) return finish();

			i++;
			var color = colors[Math.floor(Math.random() * colors.length)];
			var size = Math.floor((Math.random() * 10) + 1);

			client.query(sql, [color, size], insert);
		};

		var finish = function(err) {
			done();
			callback(err);
		};

		insert();
	});

};