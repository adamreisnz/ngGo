module.exports = function(grunt) {

	/**
	 * Load required Grunt tasks. These are installed based on the versions listed
	 * in `package.json` when you do `npm install` in this directory.
	 */
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-recess');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-ng-annotate');

	/**
	 * Set base path
	 */
	grunt.file.setBase('./');

	/**
	 * Build configuration
	 */
	var buildConfig = {

		/**
		 * The 'build_dir' folder is where the development build is constructed.
		 * The 'release_dir' folder is where the fully compiled files are constructed.
		 */
		temp_dir:		'temp',
		release_dir:	'release',

		/**
		 * This is a collection of file patterns that refer to the application code.
		 * These file paths are used in the configuration of build tasks.
		 */
		app_files: {
			js: [
				'src/**/*.js',
				'!src/**/*.spec.js',
			],
			unit: [
				'src/**/*.spec.js',
			],
			less: 'src/ngGo.less'
		}
	};

	/**
	 * This is the configuration object Grunt uses to give each plugin its instructions.
	 */
	var taskConfig = {

		/**
		 * Read in our package.json file so we can access the package name and version
		 */
		pkg: grunt.file.readJSON('package.json'),

		/**
		 * The banner is the comment that is placed at the top of our compiled
		 * source files. It is first processed as a Grunt template, where the `<%=`
		 * pairs are evaluated based on this very configuration object.
		 */
		meta: {
			banner:
				'/**\n' +
				' * <%= pkg.name %> v<%= pkg.version %>, <%= grunt.template.today("dd-mm-yyyy") %>\n' +
				' * <%= pkg.homepage %>\n' +
				' *\n' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
				' */\n'
		},

		/**
		 * Version bump
		 */
		bump: {
		    options: {
				files: ['package.json'],
				updateConfigs: ['pkg'],
				commit: false,
				commitMessage: 'Release v%VERSION%',
				commitFiles: ['package.json'],
				createTag: false,
				tagName: 'v%VERSION%',
				tagMessage: 'Version %VERSION%',
				push: false,
				pushTo: 'upstream',
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
				globalReplace: false
		    }
		},

		/**
		 * Text replace
		 */
		replace: {
			readmeVersion: {
				src: 'README.md',
				dest: 'README.md',
				replacements: [{
					from: /([0-9]\.[0-9]+\.[0-9]+)/i,
					to: '<%= pkg.version %>'
				}]
			},
			ngGoVersion: {
				src: 'src/ngGo.js',
				dest: 'src/ngGo.js',
				replacements: [{
					from: /'([0-9]\.[0-9]+\.[0-9]+)'/i,
					to: '\'<%= pkg.version %>\''
				}]
			}
		},

		/**
		 * The directories to delete when `grunt clean` is executed.
		 */
		clean: {
			options: {
				force:	true
			},
			temp: {
				src:	['<%= temp_dir %>/**']
			},
			release: {
				src:	['<%= release_dir %>/**']
			}
		},

		/**
		 * The copy task just copies files from A to B.
		 */
		copy: {

			//Copy the app files to the temp dir
			temp: {
				files: [{
					src: [ '<%= app_files.js %>' ],
					dest: '<%= temp_dir %>',
					cwd: '.',
					expand: true
				}]
			}
		},

		/**
		 * Recess handles our LESS compilation and uglification automatically.
		 * Only the 'app.less' file is included in compilation; all other files
		 * must be imported from within this file.
		 */
		recess: {
			compile: {
				src: [ '<%= app_files.less %>' ],
				dest: '<%= release_dir %>/<%= pkg.name %>.css',
				options: {
					compile: true,
					compress: true,
					noUnderscores: false,
					noIDs: false,
					zeroUnits: false
				}
			}
		},

		/**
		 * The concat task concatenates multiple source files into a single file
		 */
		concat: {

			/**
			 * The `compile_js` target is the concatenation of our application source
			 * code and all specified vendor source code into a single file.
			 */
			compile_js: {
				options: {
					banner: '<%= meta.banner %>'
				},
				src: [
					'grunt.module.prefix',
					'<%= temp_dir %>/src/**/*.js',
					'grunt.module.suffix'
				],
				dest: '<%= release_dir %>/<%= pkg.name %>.js'
			}
		},

		/**
		 * The 'ng-annotate' task annotates the sources before minifying, allowing us
		 * to code without the array syntax.
		 */
		ngAnnotate: {
			compile: {
				files: [{
					src: [ '<%= app_files.js %>' ],
					cwd: '<%= temp_dir_dir %>',
					dest: '<%= temp_dir %>',
					expand: true
				}]
			}
		},

		/**
		 * Minify the javascript code
		 */
		uglify: {
			compile: {
				options: {
					banner: '<%= meta.banner %>'
				},
				files: {
					'<%= release_dir %>/<%= pkg.name %>.min.js': '<%= concat.compile_js.dest %>'
				}
			}
		},

		/**
		 * `jshint` defines the rules of our linter as well as which files we
		 * should check. This file, all javascript sources, and all our unit tests
		 * are linted based on the policies listed in `options`. But we can also
		 * specify exclusionary patterns by prefixing them with an exclamation
		 * point (!); this is useful when code comes from a third party but is
		 * nonetheless inside `app/`.
		 */
		jshint: {
			src: [
				'<%= app_files.js %>'
			],
			test: [
				'<%= app_files.unit %>'
			],
			gruntfile: [
				'gruntfile.js'
			],
			options: {
				curly: true,
				immed: true,
				newcap: false,
				noarg: true,
				sub: true,
				boss: true,
				eqnull: true,
				expr: true
			}
		},

		/**
		 * The Karma unit tester configurations
		 */
		karma: {
			options: {
				configFile: 'karma-unit.js'
			},
			continuous: {
				runnerPort: 9101,
				background: true
			},
			unit: {
				singleRun: true
			}
		},

		/**
		 * And for rapid development, we have a watch set up that checks to see if
		 * any of the files listed below change, and then to execute the listed
		 * tasks when they do. This just saves us from having to type "grunt" into
		 * the command-line every time we want to see what we're working on; we can
		 * instead just leave "grunt watch" running in a background terminal.
		 *
		 * But we don't need the same thing to happen for all the files.
		 */
		delta: {

			/**
			 * By default, we want the Live Reload to work for all tasks; this is
			 * overridden in some tasks (like this file) where browser resources are
			 * unaffected. It runs by default on port 35729, which your browser
			 * plugin should auto-detect.
			 */
			options: {
				livereload: true
			},

			/**
			 * When the Gruntfile changes, we just want to lint it. In fact, when
			 * your Gruntfile changes, it will automatically be reloaded!
			 */
			gruntfile: {
				files: 'gruntfile.js',
				tasks: [ 'jshint:gruntfile' ],
				options: {
					livereload: false
				}
			},

			/**
			 * When our JavaScript source files change, we want to run lint them and
			 * run our unit tests.
			 */
			jssrc: {
				files: [
					'<%= app_files.js %>'
				],
				tasks: [ 'jshint:src', 'karma:unit:run' ]
			},

			/**
			 * When a JavaScript unit test file changes, we only want to lint it and
			 * run the unit tests. We don't want to do any live reloading.
			 */
			unit: {
				files: [
					'<%= app_files.unit %>'
				],
				tasks: [ 'jshint:test', 'karma:continuous:run' ],
				options: {
					livereload: false
				}
			}
		}
	};

	/**
	 * Initialize configuration
	 */
	grunt.initConfig(grunt.util._.extend(taskConfig, buildConfig));

	/**
	 * In order to make it safe to just compile or copy *only* what was changed,
	 * we need to ensure we are starting from a clean, fresh build. So we rename
	 * the `watch` task to `delta` (that's why the configuration var above is
	 * `delta`) and then add a new task called `watch` that does a clean build
	 * before watching for changes.
	 */
	grunt.renameTask('watch', 'delta');
	grunt.registerTask('watch', ['karma:continuous', 'delta']);

	/**
	 * The default task is to compile
	 */
	grunt.registerTask('default', ['compile']);

	/**
	 * The 'test' task runs jshint and unit tests
	 */
	grunt.registerTask('test', [

		//Run JS hint and unit tests
		'jshint', 'karma:unit'
	]);

	/**
	 * The 'compile' task gets the app ready for deployment by concatenating and minifying code.
	 */
	grunt.registerTask('compile', [

		//Update the version number in the README and in ngGo.js
		'replace:readmeVersion', 'replace:ngGoVersion',

		//Run JS hint and unit tests
		'jshint', 'karma:unit',

		//Compile the CSS
		'recess:compile',

		//Clean the temp folder and copy files to it
		'clean:temp', 'copy:temp',

		//Apply angular minification protection, concatenate all JS into a single file and minify
		'ngAnnotate', 'concat:compile_js', 'uglify',

		//Clean the temp folder again
		'clean:temp'
	]);
};