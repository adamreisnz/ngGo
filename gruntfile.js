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
	grunt.loadNpmTasks('grunt-html2js');
	grunt.loadNpmTasks('grunt-recess');
	grunt.loadNpmTasks('grunt-karma');
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
		 * The 'temp_dir' folder is where temporary files are stashed.
		 * The 'build_dir' folder is where the development build is constructed.
		 * The 'compile_dir' folder is where the fully compiled files are constructed.
		 * The 'deploy_dir' folder is where the final built/compiled code is stashed.
		 */
		temp_dir:		'temp',
		build_dir:		'<%= temp_dir %>/build',
		compile_dir:	'<%= temp_dir %>/compile',
		deploy_dir:		'build',

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
			tpl: {
				app: [
					'src/**/*.html'
				]
			},
			less: 'src/ngGo.less'
		},

		/**
		 * This is a collection of files used during testing only.
		 */
		test_files: {
			js: [
				'angular/angular.js',
				'angular/angular-mocks.js'
			]
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
				' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
				' * <%= pkg.homepage %>\n' +
				' *\n' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
				' */\n'
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
			public: {
				src:	['<%= deploy_dir %>/**']
			}
		},

		/**
		 * The copy task just copies files from A to B.
		 */
		copy: {

			//Application javascript code for the build
			build_app_js: {
				files: [{
					src: [ '<%= app_files.js %>' ],
					dest: '<%= build_dir %>',
					cwd: '.',
					expand: true
				}]
			},

			//Release the build to the public dir
			public_build: {
				files: [{
					src: [ '**' ],
					dest: '<%= deploy_dir %>',
					cwd: '<%= build_dir %>',
					expand: true
				}]
			},

			//Restore the build from the public dir
			public_build_restore: {
				files: [{
					src: [ '**' ],
					dest: '<%= build_dir %>',
					cwd: '<%= deploy_dir %>',
					expand: true
				}]
			},

			//Release the compiled app to the public dir
			public_compile: {
				files: [{
					src: [ '**' ],
					dest: '<%= deploy_dir %>',
					cwd: '<%= compile_dir %>',
					expand: true
				}]
			}
		},

		/**
		 * HTML2JS is a Grunt plugin that takes all of your template files and
		 * places them into JavaScript files as strings that are added to
		 * AngularJS's template cache. This means that the templates too become
		 * part of the initial payload as one JavaScript file and don't need to be
		 * requested individually.
		 */
		html2js: {

			/**
			 * These are the templates from `app`.
			 */
			app: {
				options: {
					base: 'app',
					module: 'ngGo.Templates'
				},
				src: [ '<%= app_files.tpl.app %>' ],
				dest: '<%= build_dir %>/src/ngGo.templates.js'
			}
		},

		/**
		 * Recess handles our LESS compilation and uglification automatically.
		 * Only the 'app.less' file is included in compilation; all other files
		 * must be imported from within this file.
		 */
		recess: {
			build: {
				src: [ '<%= app_files.less %>' ],
				dest: '<%= build_dir %>/<%= pkg.name %>.css',
				options: {
					compile: true,
					compress: false,
					noUnderscores: false,
					noIDs: false,
					zeroUnits: false
				}
			},
			compile: {
				src: [ '<%= recess.build.dest %>' ],
				dest: '<%= compile_dir %>/<%= pkg.name %>.css',
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
			 * The `build_css` target concatenates compiled CSS and vendor CSS
			 * together.
			 */
			build_css: {
				src: [
					'<%= recess.build.dest %>'
				],
				dest: '<%= recess.build.dest %>'
			},

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
					'<%= build_dir %>/src/**/*.js',
					'grunt.module.suffix'
				],
				dest: '<%= compile_dir %>/<%= pkg.name %>.min.js'
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
					cwd: '<%= build_dir %>',
					dest: '<%= build_dir %>',
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
					'<%= concat.compile_js.dest %>': '<%= concat.compile_js.dest %>'
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
		 * This task compiles the karma config file so that changes to the file array
		 * don't have to be managed manually.
		 */
		karmaconfig: {
			template: 'grunt.karma-unit.js',
			dest: '<%= temp_dir %>/karma-unit.js',
			src: [
				'<%= test_files.js %>'
			]
		},

		/**
		 * The Karma unit tester configurations
		 */
		karma: {
			options: {
				configFile: '<%= karmaconfig.dest %>'
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
				tasks: [ 'jshint:src', 'karma:unit:run', 'copy:build_app_js', 'copy:public_build', 'clean:temp' ]
			},

			/**
			 * When our templates change, we only rewrite the template cache.
			 */
			tpls: {
				files: [
					'<%= app_files.tpl.app %>'
				],
				tasks: [ 'html2js', 'copy:build_app_js', 'copy:public_build', 'clean:temp' ]
			},

			/**
			 * When the CSS files change, we need to compile and minify them.
			 */
			less: {
				files: [ 'src/**/*.less' ],
				tasks: [ 'recess:build', 'copy:public_build', 'clean:temp' ]
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
	grunt.registerTask('watch', ['build', 'karma:continuous', 'delta']);

	/**
	 * The default task is to compile
	 */
	grunt.registerTask('default', ['compile']);

	/**
	 * The 'build' task gets the app ready to run for development and testing.
	 */
	grunt.registerTask('build', [

		//Clean directories
		'clean:temp', 'clean:public',

		//Run JS hint
		'jshint',

		//Convert HTML templates to JS
		'html2js',

		//Compile CSS and merge with vendor CSS
		'recess:build', 'concat:build_css',

		//Copy application javascript files
		'copy:build_app_js',

		//Create karma config file and run unit tests
		'karmaconfig', 'karma:unit',

		//Copy everything to the public folder and clean the temp folder
		'copy:public_build', 'clean:temp'
	]);

	/**
	 * The 'compile' task gets the app ready for deployment by concatenating and minifying code.
	 */
	grunt.registerTask('compile', [

		//First, build the app, and copy stuff back to the build folder since we emptied the temp dir
		'build', 'copy:public_build_restore', 'clean:public',

		//Compile the final CSS
		'recess:compile',

		//Apply angular minification protection, concatenate all JS into a single file and minify the code
		'ngAnnotate', 'concat:compile_js', 'uglify',

		//Copy everything to the public folder, clean the temp folder
		'copy:public_compile', 'clean:temp'
	]);

	/**
	 * Task to compile but not minify, for debugging
	 */
	grunt.registerTask('debug', [

		//First, build the app, and copy stuff back to the build folder since we emptied the temp dir
		'build', 'copy:public_build_restore', 'clean:public',

		//Compile the final CSS
		'recess:compile',

		//Apply angular minification protection, concatenate all JS into a single file
		'ngAnnotate', 'concat:compile_js',

		//Copy everything to the public folder, clean the temp folder
		'copy:public_compile', 'clean:temp'
	]);

	/**
	 * A utility function to get all JavaScript sources.
	 */
	function filterForJS (files) {
		return files.filter(function (file) {
			return file.match(/\.js$/);
		});
	}

	/**
	 * In order to avoid having to specify manually the files needed for karma to
	 * run, we use grunt to manage the list for us. The karma files are
	 * compiled as grunt templates for use by Karma.
	 */
	grunt.registerMultiTask('karmaconfig', 'Build karma config file', function () {
		var jsFiles = filterForJS(this.filesSrc);
		grunt.file.copy(grunt.config('karmaconfig.template'), grunt.config('karmaconfig.dest'), {
			process: function (contents, path) {
				return grunt.template.process(contents, {
					data: {
						scripts: jsFiles
					}
				});
			}
		});
	});
};