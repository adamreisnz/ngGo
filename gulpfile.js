'use strict';

/**
 * Dependencies
 */
const gulp = require('gulp');

/**
 * Tasks
 */
const clean = require('./build/tasks/clean');
const buildJs = require('./build/tasks/build-js');
const buildCss = require('./build/tasks/build-css');

/**
 * Build
 */
gulp.task('build', gulp.series(
  clean,
  gulp.parallel(
    buildJs,
    buildCss
  )
));
