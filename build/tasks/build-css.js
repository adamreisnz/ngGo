'use strict';

/**
 * Dependencies
 */
const gulp = require('gulp');
const sass = require('gulp-sass');
const csso = require('gulp-csso');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const build = require('../build');

/**
 * Build configuration
 */
const SRC_INDEX_SCSS = build.SRC_INDEX_SCSS;
const DEST_RELEASE = build.DEST_RELEASE;
const AUTOPREFIXER = build.AUTOPREFIXER;

/**
 * Build CSS
 */
module.exports = function buildCss() {
  return gulp.src(SRC_INDEX_SCSS)
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer(AUTOPREFIXER))
    .pipe(csso())
    .pipe(rename('ngGo.min.css'))
    .pipe(gulp.dest(DEST_RELEASE));
};
