
/**
 * BoardTheme :: This class representes the theme of a Go board. It contains all tweakable visual
 * aspects like colors, dimensions, used stone style, etc. It is very flexible and allows you to
 * use static values or dynamic values depending on other properties, like the grid cell size.
 * Using the provider, the theme can be configured globally at application launch.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Theme.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.provider('BoardTheme', function(StoneColor, MarkupTypes) {

	/**
	 * Default theme
	 */
	var defaultTheme = {

		//Board
		board: {

			//Font for labels & coordinates
			font: 'Calibri',

			//Board margin (factor of the lesser of available width and height)
			margin: 0.04
		},

		//Stones
		stone: {

			//Stone style can be shell, glass, mono, or specify a custom handler service
			style: 'shell',
			shadow: true,
			radius: function(cellSize) {
				return Math.floor(cellSize / 2);
			},

			//Mono stones
			mono: {
				color: function(stoneColor) {
					if (stoneColor == StoneColor.B) {
						return '#000';
					}
					return '#fff';
				}
			},

			//Mini stones
			mini: {
				scale: 0.5,
				alpha: 1
			},

			//Faded stones
			faded: {
				scale: 1,
				alpha: function(stoneColor) {
					if (stoneColor == StoneColor.B) {
						return 0.3;
					}
					return 0.4;
				}
			}
		},

		//Shadows
		shadow: {

			//Shadow gradient colors
			color: 'rgba(62,32,32,0.3)',
			colorTransparent: 'rgba(62,32,32,0)',

			//Shadow size
			size: function(cellSize) {
				return Math.floor(cellSize / 20);
			},

			//Shadow blur size
			blur: function(cellSize) {
				return cellSize / 20;
			}
		},

		//Markup
		markup: {

			//Standard color
			color: function(stoneColor) {
				if (stoneColor == StoneColor.B) {
					return 'rgba(255,255,255,0.9)';
				}
				return 'rgba(0,0,0,0.9)';
			},

			//Line width
			lineWidth: function(cellSize) {
				return Math.max(1, Math.floor(cellSize / 16));
			},

			//Triangle
			triangle: {
				scale: 0.85
			},

			//Square
			square: {
				scale: 0.85
			},

			//Cricle
			circle: {
				scale: 0.55
			},

			//Mark
			mark: {
				lineCap: 'square',
				scale: 0.75
			},

			//Last
			last: {
				scale: 0.7
			},

			//Smiley
			smiley: {
				lineCap: 'round',
				scale: 0.85
			},

			//Variation markup
			variation: {
				type: MarkupTypes.LABEL,
				text: function(i) {
					return String.fromCharCode(65+i);
				},
				color: 'rgba(86,114,30,0.9)'
			},

			//Solution paths markup
			solution: {
				valid: {
					type: MarkupTypes.SELECT,
					text: null,
					color: 'rgba(86,114,30,0.9)',
					scale: 0.5
				},
				invalid: {
					type: MarkupTypes.MARK,
					text: null,
					color: 'rgba(237,9,15,0.8)',
					scale: 0.3
				}
			}
		},

		//Grid
		grid: {

			//Line properties
			lineColor: 'rgba(101,69,37,0.4)',
			lineWidth: 1,

			//Star points
			star: {

				//Color and radius
				color: 'rgba(168,132,81,1)',
				radius: function(cellSize) {
					return Math.floor((cellSize / 16) + 1);
				},

				//Locations
				points: function(width, height) {

					//19x19
					if (width == height && width == 19) {
						return [
							{x:3, y:3}, {x:9, y:3}, {x:15,y:3},
							{x:3, y:9}, {x:9, y:9}, {x:15,y:9},
							{x:3, y:15}, {x:9, y:15}, {x:15,y:15}
						];
					}

					//13x13
					if (width == height && width == 13) {
						return [
							{x:3, y:3}, {x:9, y:3},
							{x:3, y:9}, {x:9, y:9}
						];
					}

					//9x9
					if (width == height && width == 9) {
						return [
							{x:4, y:4}, {x:2, y:2},
							{x:2, y:6}, {x:6, y:2},
							{x:6, y:6}
						];
					}

					//No star points
					return [];
				}
			}
		},

		//Coordinates
		coordinates: {

			//Color
			color: 'rgba(101,69,37,0.4)',

			//Board margin when showing coordinates
			margin: function(width, height) {
				if (width > 9) {
					return 0.08;
				}
				return 0.12;
			},

			//Vertical coordinates style
			vertical: {
				font: 'Calibri',
				style: 'numbers',
				inverse: true,
				size: function() {
					return function(ch, cellSize) {
						return Math.floor((cellSize / 3) + 1) + 'px';
					};
				}
			},

			//Horizontal coordinates style
			horizontal: {
				font: 'Calibri',
				style: 'letters',
				inverse: false,
				size: function() {
					return function(ch, cellSize) {
						return Math.floor((cellSize / 3) + 1) + 'px';
					};
				}
			}
		},

		//To combat 2d canvas blurry lines, we translate the canvas prior to drawing elements
		//See: http://www.mobtowers.com/html5-canvas-crisp-lines-every-time/
		canvasTranslate: function(cellSize, lineWidth) {

			//If no linewidth specified, use the grid line width as a reference
			//to make sure stuff is aligned to the grid
			if (typeof lineWidth == 'undefined') {
				lineWidth = this.get('grid.lineWidth');
			}

			//Return a translation for uneven widths
			return (lineWidth % 2) * 0.5;
		}
	};

	/**
	 * Set global default theme
	 */
	this.setTheme = function(theme) {
		if (theme) {
			defaultTheme = angular.extendDeep(defaultTheme, theme);
		}
	};

	/**
	 * Service getter
	 */
	this.$get = function(StoneColor) {

		/**
		 * Board theme constructor
		 */
		var BoardTheme = function(theme) {

			//Remember the given instance theme settings and (re)set the theme
			this.instanceTheme = theme;
			this.reset();
		};

		/**
		 * Reset the theme to defaults
		 */
		BoardTheme.prototype.reset = function() {

			//Use default theme as a base
			this.theme = angular.copy(defaultTheme);

			//Add any instance theme properties
			if (this.instanceTheme) {
				angular.extendDeep(this.theme, this.instanceTheme);
			}
		};

		/**
		 * Get a theme property
		 */
		BoardTheme.prototype.get = function(property) {

			//Determine path to the property
			var path = property.split('.'),
				prop = this.theme;

			//Loop path
			for (var i = 0; i < path.length; i++) {

				//Can't find the property?
				if (typeof prop[path[i]] == 'undefined') {
					console.warn('Could not find theme property', property);
					return null;
				}

				//Advance further in the object
				prop = prop[path[i]];
			}

			//Found what we're looking for
			if (typeof prop != 'function') {
				return prop;
			}

			//Prepare arguments
			var args = [];
			if (arguments.length > 1) {
				for (var a = 1; a < arguments.length; a++) {
					args.push(arguments[a]);
				}
			}

			//Call function
			return prop.apply(this, args);
		};

		/**
		 * Change a theme property dynamically (accepts handler function as value)
		 */
		BoardTheme.prototype.set = function(property, value) {

			//Determine path to the property
			var path = property.split('.'),
				prop = this.theme;

			//Loop path
			for (var i = 0; i < path.length; i++) {

				//Not set?
				if (typeof prop[path[i]] == 'undefined') {
					if ((i + 1) == path.length) {
						prop[path[i]] = value;
					}
					else {
						prop[path[i]] = {};
						prop = prop[path[i]];
					}
				}
			}

			//Return self for chaining
			return this;
		};

		//Return
		return BoardTheme;
	};
});