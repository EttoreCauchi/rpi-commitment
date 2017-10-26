const appRoutes = require('./app_routes');

module.exports = function(app, db, sock) {
	appRoutes(app, db, sock);
	//QUI POSSO METTERE TUTTE LE ALTRE ROTTE CHE MI INTERESSANO
};
