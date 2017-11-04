const webRoutes = require('./web_routes');

module.exports = function(app) {
	webRoutes(app);
	//QUI POSSO METTERE TUTTE LE ALTRE ROTTE CHE MI INTERESSANO
};
