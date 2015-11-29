
/**
 * Karma configuration
 */
module.exports = function(config) {
  config.set({

    //Base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    //Frameworks to use (see https://npmjs.org/browse/keyword/karma-adapter)
    frameworks: ['jasmine'],

    //Test results reporter to use (see https://npmjs.org/browse/keyword/karma-reporter)
    reporters: ['spec'],

    //Web server port
    port: 9876,

    //Web server URL root
    urlRoot: '/',

    //Enable / disable colors in the output (reporters and logs)
    colors: true,

    //Level of logging
    logLevel: config.LOG_INFO,

    //Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    //Start these browsers (see https://npmjs.org/browse/keyword/karma-launcher)
    browsers: ['PhantomJS'],

    //Continuous integration mode
    singleRun: true
  });
};
