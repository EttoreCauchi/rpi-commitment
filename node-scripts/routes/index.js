const appRoutes = require('./app_routes');

module.exports = function(app, db) {
	appRoutes(app, db);
	//QUI POSSO METTERE TUTTE LE ALTRE ROTTE CHE MI INTERESSANO
};
