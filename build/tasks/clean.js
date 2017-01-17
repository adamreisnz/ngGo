'use strict';

/**
 * Dependencies
 */
const del = require('del');
const build = require('../build');

/**
 * Clean the build destination folder
 */
module.exports = function clean() {
  return del(build.DEST_RELEASE, {dot: true});
};
