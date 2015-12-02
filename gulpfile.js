'use strict';

/**
 * Dependencies
 */
var fs = require('fs');
var del = require('del');
var gulp = require('gulp');
var karma = require('karma');
var git = require('gulp-git');
var bump = require('gulp-bump');
var sass = require('gulp-sass');
var csso = require('gulp-csso');
var jscs = require('gulp-jscs');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var cached = require('gulp-cached');
var filter = require('gulp-filter');
var replace = require('gulp-replace');
var wrapper = require('gulp-wrapper');
var stylish = require('gulp-jscs-stylish');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');

/**
 * Package and configuration
 */
var pkg = require('./package.json');
var noop = function() {};

/*****************************************************************************
 * Helpers
 ***/

/**
 * Get package JSON directly from file system
 */
function packageJson() {
  return (pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8')));
}

/**
 * Get package file name
 */
function packageFileName(filename, ext) {
  if (!ext) {
    ext = filename;
    filename = 'ngGo';
  }
  return filename + (ext || '');
}

/**
 * Generate angular wrapper for module files
 */
function angularWrapper() {
  return {
    header: '(function(window, angular, undefined) {\'use strict\';\n',
    footer: '\n})(window, window.angular);\n'
  };
}

/**
 * Generate banner wrapper for compiled files
 */
function bannerWrapper() {

  //Refresh package JSON
  packageJson();

  //Get date and author
  var today = new Date();
  var date = today.getDate() + '-' + today.getMonth() + '-' + today.getFullYear();
  var author = pkg.author.name + ' <' + pkg.author.email + '>';

  //Format banner
  var banner =
    '/**\n' +
    ' * ' + pkg.name + ' - v' + pkg.version + ' - ' + date + '\n' +
    ' * ' + pkg.homepage + '\n' +
    ' *\n' +
    ' * Copyright (c) ' + today.getFullYear() + ' ' + author + '\n' +
    ' * License: MIT\n' +
    ' */\n';

  //Return wrapper
  return {
    header: banner,
    footer: ''
  };
}

/*****************************************************************************
 * Builders
 ***/

/**
 * Clean the release folder
 */
function clean() {
  return del('release');
}

/**
 * Build css
 */
function buildCss() {
  return gulp.src('src/ngGo.scss')
    .pipe(sass())
    .pipe(csso())
    .pipe(rename(packageFileName('.css')))
    .pipe(gulp.dest('release'));
}

/**
 * Build release files
 */
function buildJs() {
  var jsFilter = filter(['*.js'], {
    restore: true
  });
  return gulp.src([
    'src/**/*.js'
  ]).pipe(ngAnnotate({
    single_quotes: true
  }))
    .pipe(wrapper(angularWrapper()))
    .pipe(sourcemaps.init())
      .pipe(concat(packageFileName('.js')))
      .pipe(wrapper(bannerWrapper()))
      .pipe(gulp.dest('release'))
      .pipe(rename(packageFileName('.min.js')))
      .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(jsFilter)
    .pipe(wrapper(bannerWrapper()))
    .pipe(jsFilter.restore)
    .pipe(gulp.dest('release'));
}

/*****************************************************************************
 * Linting, testing and watching
 ***/

/**
 * Lint only client code
 */
function lint() {
  return gulp.src([
    'src/**/*.js',
    'tests/**/*.spec.js'
  ]).pipe(cached('lint'))
    .pipe(jshint())
    .pipe(jscs())
    .on('error', noop)
    .pipe(stylish.combineWithHintResults())
    .pipe(jshint.reporter('jshint-stylish'));
}

/**
 * Run unit tests
 */
function test(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true,
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'src/**/*.js',
      'tests/**/*.spec.js'
    ]
  }, done).start();
}

/**
 * Watch code and tests
 */
function watch() {
  gulp.watch([
    'src/**/*.js',
    'tests/**/*.spec.js'
  ], gulp.series(lint, test, buildJs));
}

/*****************************************************************************
 * Bumpers
 ***/

/**
 * Bump version number (patch)
 */
function patchBump() {
  return gulp.src([
    './package.json'
  ]).pipe(bump({type: 'patch'}))
    .pipe(gulp.dest('./'));
}

/**
 * Bump version number (minor)
 */
function minorBump() {
  return gulp.src([
    './package.json'
  ]).pipe(bump({type: 'minor'}))
    .pipe(gulp.dest('./'));
}

/**
 * Bump version number (major)
 */
function majorBump() {
  return gulp.src([
    './package.json'
  ]).pipe(bump({type: 'major'}))
    .pipe(gulp.dest('./'));
}

/**
 * Update version in ngGo.js
 */
function updateSourceVersion() {
  return gulp.src([
    './src/ngGo.js'
  ]).pipe(replace(
    /'([0-9]\.[0-9]+\.[0-9]+)'/g, '\'' + packageJson().version + '\''
  )).pipe(gulp.dest('./src'));
}

/**
 * Commit the version bump
 */
function commitBump() {
  var version = packageJson().version;
  return gulp.src([
    './package.json',
    './release/*',
    './src/ngGo.js'
  ]).pipe(git.commit('Bump version to ' + version));
}

/**
 * Tag latest commit with current version
 */
function tagBump(cb) {
  var version = packageJson().version;
  git.tag(version, 'Tag version ' + version, function(error) {
    if (error) {
      return cb(error);
    }
    git.push('origin', 'master', {
      args: '--tags'
    }, cb);
  });
}

/*****************************************************************************
 * CLI exposed tasks
 ***/

/**
 * Build a release version
 */
gulp.task('release', gulp.series(
  clean, gulp.parallel(buildCss, buildJs)
));

/**
 * Testing, linting, watching and tagging
 */
gulp.task('test', test);
gulp.task('lint', lint);
gulp.task('watch', watch);

/**
 * Bump version numbers
 */
gulp.task('patch', gulp.series(
  patchBump, updateSourceVersion, 'release', commitBump, tagBump
));
gulp.task('minor', gulp.series(
  minorBump, updateSourceVersion, 'release', commitBump, tagBump
));
gulp.task('major', gulp.series(
  majorBump, updateSourceVersion, 'release', commitBump, tagBump
));

/**
 * Default task is to lint, test and release
 */
gulp.task('default', gulp.series(
  'lint', 'test', 'release'
));
