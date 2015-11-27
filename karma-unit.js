module.exports = function (config) {
  config.set({

    /**
     * From where to look for files, starting with the location of this file.
     */
    basePath: '',

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    files: [
      'angular/angular.js',
      'angular/angular-mocks.js',
      'src/**/*.js'
    ],
    exclude: [

    ],

    /**
     * Test frameworks
     */
    frameworks: [
      'jasmine'
    ],

    /**
     * How to report, by default.
     */
    reporters: 'dots',

    /**
     * Port and URL root
     */
    port:     9019,
    urlRoot:  '/',

    /**
     * Disable file watching by default.
     */
    autoWatch: false,

    /**
     * The list of browsers to launch to test on. This includes only "Firefox" by
     * default, but other browser names include:
     * Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
     *
     * Note that you can also use the executable name of the browser, like "chromium"
     * or "firefox", but that these vary based on your operating system.
     *
     * You may also leave this blank and manually navigate your browser to
     * http://localhost:9018/ when you're running tests. The window/tab can be left
     * open and the tests will automatically occur there during the build. This has
     * the aesthetic advantage of not launching a browser every time you save.
     */
    browsers: [
      'ChromeSmall'
    ],
    customLaunchers: {
      ChromeSmall: {
        base: 'Chrome',
        flags: ['--window-size=300,300']
      },
      ChromeBackground: {
        base: 'Chrome',
        flags: ['--no-startup-window']
      }
    },

    /**
     * Plugins to load
     */
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-phantomjs-launcher'
    ]
  });
};