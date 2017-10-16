var {Handler} = require('./handler');
var {ServerWeb} = require('./webServer');

var handler = new Handler;
var serverWeb = new ServerWeb;

serverWeb.create();
handler.initializeHandler();


