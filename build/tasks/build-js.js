/* eslint no-console: off */
'use strict';

/**
 * Dependencies
 */
const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const wrapper = require('gulp-wrapper');
const sourcemaps = require('gulp-sourcemaps');
const ngAnnotate = require('gulp-ng-annotate');
const angularWrapper = require('../utils/angular-wrapper');
const build = require('../build');

/**
 * Build configuration
 */
const SRC_JS = build.SRC_JS;
const DEST_RELEASE = build.DEST_RELEASE;

/**
 * Build JS
 */
module.exports = function buildJs() {

  //Create stream
  return gulp
    .src(SRC_JS.concat(['!**/*.spec.js']))
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .on('error', error => console.error(error))
    .pipe(babel({compact: false}))
    .pipe(ngAnnotate())
    .pipe(wrapper(angularWrapper()))
    .pipe(concat('ngGo.js'))
    .pipe(gulp.dest(DEST_RELEASE))
    .pipe(uglify())
    .pipe(rename('ngGo.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DEST_RELEASE));
};
