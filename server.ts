// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { enableProdMode } from '@angular/core';

import * as express from 'express';
import * as fs from 'fs';
import * as https from 'https';
import { join } from 'path';

// HTTPS/SSL credentials
var privateKey  = fs.readFileSync('ssl/private.key', 'utf8');
var certificate = fs.readFileSync('ssl/private.pem', 'utf8');
var options = {key: privateKey, cert: certificate};

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express server
const app = express();

// Use https server for hosting
app.listen = function() {
  var server = https.createServer(options, this);
  return server.listen.apply(server, arguments);
};

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./dist/server/main');

// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP)
  ]
}));

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, 'avatar'));

// TODO: implement data requests securely
app.get('/api/*', (req, res) => {
  res.status(404).send('data requests are not supported');
});

// Serve static files from /browser
app.use(express.static(join(DIST_FOLDER, 'avatar')));

app.get('*.*', (req, res, next) => {
   res.sendFile(join(DIST_FOLDER, 'avatar'));
});

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node server listening on https://localhost:${PORT}`);
});