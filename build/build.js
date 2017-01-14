/* eslint max-len: off */
'use strict';

/**
 * Dependencies
 */
const path = require('path');
const pkg = require('../package.json');

//Environment
const VERSION = pkg.version;
const ROOT_PATH = path.normalize(path.join(__dirname, '..'));

//Source globs
const SRC_INDEX_SCSS = 'src/ngGo.scss';
const SRC_JS = ['src/**/*.js'];
const SRC_TESTS = ['src/**/*.spec.js'];

//Test libraries
const SRC_LIB_TESTS = [
  'angular-mocks/angular-mocks.js',
].map(lib => 'node_modules/' + lib);

//Destination
let DEST_RELEASE = 'release/';

//Build settings
let AUTOPREFIXER = {browsers: ['last 2 versions']};

/**
 * Export build config object
 */
module.exports = {

  //Environment
  VERSION,
  ROOT_PATH,

  //Destination path
  DEST_RELEASE,

  //Sources
  SRC_JS,
  SRC_TESTS,
  SRC_LIB_TESTS,
  SRC_INDEX_SCSS,

  //Other build settings
  AUTOPREFIXER,
};
