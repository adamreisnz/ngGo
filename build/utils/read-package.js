'use strict';

/**
 * Dependencies
 */
const fs = require('fs');
const path = require('path');

/**
 * Location of package.json
 */
const PACKAGE_LOCATION = path.resolve(
  path.join(__dirname, '..', '..', 'package.json')
);

/**
 * Get package details (read on demand)
 */
module.exports = function readPackage() {
  return JSON.parse(fs.readFileSync(PACKAGE_LOCATION).toString());
};
