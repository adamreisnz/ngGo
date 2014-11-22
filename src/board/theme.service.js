
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
	'ngGo.Service'
])

/**
 * Factory definition
 */
.provider('BoardTheme', function(StoneColor) {

	/**
	 * Default theme
	 */
	var defaultTheme = {

		//Stones
		stoneStyle: 'shell', //shell, glass, mono, or specify a custom handler service
		stoneShadow: true,
		stoneMiniScale: 0.5,
		stoneFadedAlpha: 0.4,
		stoneColorMonoBlack: '#000',
		stoneColorMonoWhite: '#fff',
		stoneRadius: function(cellSize) {
			return Math.floor(cellSize / 2);
		},

		//Shadows
		shadowColor: 'rgba(62,32,32,0.3)',
		shadowTransparentColor: 'rgba(62,32,32,0)',
		shadowSize: function(cellSize) {
			return Math.floor(cellSize / 20);
		},
		shadowBlur: function(cellSize) {
			return cellSize / 20;
		},

		//Markup
		markupColor: function(stoneColor) {
			if (stoneColor == StoneColor.B) {
				return 'rgba(255,255,255,0.9)';
			}
			else {
				return 'rgba(0,0,0,0.9)';
			}
		},
		markupVariationColor: 'rgba(0,32,128,0.8)',
		markupTriangleScale: 0.85,
		markupSquareScale: 0.85,
		markupCircleScale: 0.55,
		markupMarkScale: 0.75,
		markupSmileyScale: 0.85,
		markupLastScale: 0.7,
		markupLineCap: 'square',
		markupLineWidth: function(cellSize) {
			return Math.max(1, Math.floor(cellSize / 16));
		},

		//Grid
		gridLineColor: 'rgba(101,69,37,1)',
		gridLineWidth: 1,

		//Star points
		starColor: 'rgba(85,51,17,1)',
		starRadius: function(cellSize) {
			return Math.floor((cellSize / 16) + 1);
		},

		//Coordinates
		coordinatesColor: 'rgba(85,51,17,0.5)',
		coordinatesSize: function(cellSize) {
			return Math.floor((cellSize / 3) + 1);
		},

		//Font
		font: 'Calibri',

		//To combat 2d canvas blurry lines, we translate the canvas prior to drawing elements
		//See: http://www.mobtowers.com/html5-canvas-crisp-lines-every-time/
		canvasTranslateFactor: 0.5,
		canvasTranslate: function(cellSize, lineWidth) {

			//If no linewidth specified, use the grid line width as a reference
			//to make sure stuff is aligned to the grid
			if (typeof lineWidth == 'undefined') {
				lineWidth = this.get('gridLineWidth');
			}

			//Return a translation for uneven widths
			return (lineWidth % 2) * this.get('canvasTranslateFactor');
		}
	};

	/**
	 * Set global default theme
	 */
	this.setTheme = function(theme) {
		defaultTheme = angular.extend(defaultTheme, theme);
	};

	/**
	 * Service getter
	 */
	this.$get = function(StoneColor) {

		/**
		 * Board theme constructor
		 */
		var BoardTheme = function(theme) {

			//Set the theme
			theme = theme || {};
			this.theme = angular.extend(defaultTheme, theme);
		};

		/**
		 * Get a theme property
		 */
		BoardTheme.prototype.get = function(property) {

			//Not set?
			if (typeof this.theme[property] == 'undefined') {
				return '';
			}

			//Function?
			if (typeof this.theme[property] == 'function') {

				//Prepare arguments
				var args = [];
				if (arguments.length > 1) {
					for (var a = 1; a < arguments.length; a++) {
						args.push(arguments[a]);
					}
				}

				//Call function
				return this.theme[property].apply(this, args);
			}

			//All other
			return this.theme[property];
		};

		/**
		 * Change a theme property dynamically (accepts handler function as value)
		 */
		BoardTheme.prototype.set = function(property, value) {
			this.theme[property] = value;
			return this;
		};

		//Return
		return BoardTheme;
	};
});