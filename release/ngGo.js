/**
 * ngGo v1.1.1
 * https://github.com/AdamBuczynski/ngGo
 *
 * Copyright (c) 2015 Adam Buczynski
 */
(function (window, angular, undefined) {
	'use strict';
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Directive', [
	'ngGo.Board.Service'
])

/**
 * Directive definition
 */
.directive('board', ["$window", "Board", function($window, Board) {

	//Get pixel ratio
	var pixelRatio = window.pixelRatio || 1;

	/**
	 * Helper to create a layer canvas
	 */
	var createLayerCanvas = function(name) {

		//Create canvas element and get context
		var canvas = document.createElement('canvas'),
			context = canvas.getContext('2d');

		//Scale context depending on pixel ratio
		if (pixelRatio > 1) {
			context.scale(pixelRatio, pixelRatio);
		}

		//Set class
		canvas.className = name;

		//Set initial canvas width/height based on our own size
		canvas.width = this.clientWidth * pixelRatio;
		canvas.height = this.clientHeight * pixelRatio;

		//Append to element now and return context
		this.appendChild(canvas);
		return context;
	};

	/**
	 * Helper to determine draw size
	 */
	var determineDrawSize = function(scope, availableWidth, availableHeight) {

		//Init vars
		var drawWidth, drawHeight, cellSize;

		//Stretch available height to width if zero
		if (availableHeight === 0 && availableWidth > 0) {
			availableHeight = availableWidth;
		}

		//Grid size known?
		if (scope.Board.width && scope.Board.height) {

			//Determine smallest cell size
			cellSize = Math.min(availableWidth / scope.Board.width, availableHeight / scope.Board.height);

			//Set draw size
			drawWidth = Math.floor(cellSize * scope.Board.width);
			drawHeight = Math.floor(cellSize * scope.Board.height);
		}

		//Otherwise, use the lesser of the available width/height
		else {
			drawWidth = drawHeight = Math.min(availableWidth, availableHeight);
		}

		//Broadcast new size if changed
		if (scope.lastDrawWidth != drawWidth || scope.lastDrawHeight != drawHeight) {
			scope.lastDrawWidth = drawWidth;
			scope.lastDrawHeight = drawHeight;
			scope.$broadcast('ngGo.board.drawSizeChanged', drawWidth, drawHeight);
			return true;
		}

		//No change
		return false;
	};

	/**
	 * Directive
	 */
	return {
		restrict:	'E',
		scope:		{
			instance: '&'
		},

		/**
		 * Linking function
		 */
		link: function(scope, element, attrs) {

			//Init vars
			var i, context, layer, playerElement,
				parent = element.parent(),
				sizingElement = element[0],
				existingInstance = true;

			//Remember last draw width/height
			scope.lastDrawWidth = 0;
			scope.lastDrawHeight = 0;

			//Get board instance
			scope.Board = scope.instance();

			//Function given?
			if (typeof scope.Board == 'function') {
				scope.Board = scope.Board();
			}

			//Instantiate board if not present in scope
			if (!scope.Board) {
				existingInstance = false;
				scope.Board = new Board();
			}

			//Link element
			scope.Board.linkElement(element);

			//Find player element
			if (parent[0].tagName == 'PLAYER') {
				playerElement = parent;
				sizingElement = parent.parent()[0];
			}

			//Listen for board drawsize events
			scope.$on('ngGo.board.drawSizeChanged', function(event, width, height) {

				//First set the new dimensions on the canvas elements
				var canvas = element.find('canvas');
				for (i = 0; i < canvas.length; i++) {
					canvas[i].width = width * pixelRatio;
					canvas[i].height = height * pixelRatio;
				}

				//Set on the element if we're using a player element and if there is a size
				if (playerElement || attrs.forceSize === 'true') {
					element.css({width: width + 'px', height: height + 'px'});
				}

				//Next set it on the board itself
				scope.Board.setDrawSize(width * pixelRatio, height * pixelRatio);
			});

			//Determine initial draw size
			determineDrawSize(scope, sizingElement.clientWidth, sizingElement.clientHeight);

			//On window resize, determine the draw size again
			angular.element($window).on('resize', function() {
				determineDrawSize(scope, sizingElement.clientWidth, sizingElement.clientHeight);
			});

			//On manual resize, determine draw size again
			scope.$on('ngGo.board.determineDrawSize', function() {
				determineDrawSize(scope, sizingElement.clientWidth, sizingElement.clientHeight);
			});

			//On board grid resize, determine the draw size again
			scope.$on('ngGo.board.resize', function(event, board, width, height) {

				//Only relevent if this was our own board
				if (board != scope.Board) {
					return;
				}

				//If the draw size didn't change, the draw size event won't be triggered.
				//However, that means we should call the resized() method now manually because
				//it won't be called with the setDrawSize() call.
				//This may seem a bit "off", but it's the best way to prevent redundant redraws.
				if (!determineDrawSize(scope, sizingElement.clientWidth, sizingElement.clientHeight)) {
					scope.Board.resized();
				}
			});

			//Static board
			if (attrs.static && attrs.static === 'true') {

				//Add static class and make the board static
				element.addClass('static');
				scope.Board.makeStatic();

				//Create single canvas and link to all relevant layer service classes
				context = createLayerCanvas.call(element[0], 'static');
				for (i = 0; i < scope.Board.layerOrder.length; i++) {
					layer = scope.Board.layerOrder[i];
					scope.Board.layers[layer].setContext(context);
				}
			}

			//Dynamic board
			else {

				//Create individual layer canvasses and link the canvas context to the layer service class
				for (i = 0; i < scope.Board.layerOrder.length; i++) {
					layer = scope.Board.layerOrder[i];
					context = createLayerCanvas.call(element[0], layer);
					scope.Board.layers[layer].setContext(context);
				}
			}

			//Observe the board size attribute
			attrs.$observe('size', function(size) {
				if (typeof size == 'string' && size.toLowerCase().indexOf('x') !== -1) {
					size = size.split('x');
					scope.Board.setSize(size[0], size[1]);
				}
				else {
					scope.Board.setSize(size, size);
				}
			});

			//Observe the coordinates attribute
			attrs.$observe('coordinates', function(attr) {
				scope.Board.toggleCoordinates(attr === 'true');
			});

			//Observe the cutoff attribute
			attrs.$observe('cutoff', function(attr) {
				if (angular.isDefined(attr)) {
					scope.Board.setCutoff(attr.split(','));
				}
			});

			//Observe color multiplier
			attrs.$observe('colorMultiplier', function(attr) {
				if (angular.isDefined(attr)) {
					scope.Board.swapColors(attr);
				}
			});

			//Link board to player if present in parent scope
			if (scope.$parent.Player) {
				scope.$parent.Player.setBoard(scope.Board);
			}

			//Redraw board if we had an existing instance (it might contain data)
			if (existingInstance) {
				scope.Board.redraw();
			}
		}
	};
}]);

/**
 * Board :: This class represents the Go board. It is a placeholder for all the various board layers
 * and is used for placing and removing objects on the board. The class has helpers to figure out the
 * correct size of the grid cells and to toggle coordinates on or off. This class is responsible for
 * drawing all layers on the board.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Service', [
	'ngGo',
	'ngGo.Board.Directive',
	'ngGo.Board.Theme.Service',
	'ngGo.Board.Layer.GridLayer.Service',
	'ngGo.Board.Layer.ShadowLayer.Service',
	'ngGo.Board.Layer.StonesLayer.Service',
	'ngGo.Board.Layer.MarkupLayer.Service',
	'ngGo.Board.Layer.ScoreLayer.Service',
	'ngGo.Board.Layer.HoverLayer.Service',
	'ngGo.Board.Object.Markup.Service',
	'ngGo.Board.Object.Stone.Service',
	'ngGo.Board.Object.StoneMini.Service',
	'ngGo.Board.Object.StoneFaded.Service'
])

/**
 * Provider definition
 */
.provider('Board', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Width and height
		width: 0,
		height: 0,

		//Grid cut-off sides (i.e. ["top", "left"])
		cutoff: [],

		//Section of board to display
		section: {top:0,right:0,bottom:0,left:0},

		//Show coordinates?
		coordinates: false,

		//Color multiplier (use -1 to swap colors)
		color_multiplier: 1
	};

	/**
	 * Set global default configuration for players
	 */
	this.setConfig = function(config) {
		defaultConfig = angular.extend(defaultConfig, config);
	};

	/**
	 * Service getter
	 */
	this.$get = ["$rootScope", "BoardTheme", "GridLayer", "ShadowLayer", "StonesLayer", "MarkupLayer", "ScoreLayer", "HoverLayer", function($rootScope, BoardTheme, GridLayer, ShadowLayer, StonesLayer, MarkupLayer, ScoreLayer, HoverLayer) {

		/**
		 * Board constructor
		 */
		var Board = function(config) {

			//Initialize board
			this.init();

			//Parse config
			this.parseConfig(config || {});
		};

		/**
		 * Initialize board
		 */
		Board.prototype.init = function() {

			//Remove everything
			this.removeAll();

			//Set board theme
			this.theme = new BoardTheme();

			//Initialize board draw dimensions in pixels
			this.cellSize = 0;
			this.drawWidth = 0;
			this.drawHeight = 0;
			this.drawMarginHor = 0;
			this.drawMarginVer = 0;
			this.gridDrawWidth = 0;
			this.gridDrawHeight = 0;

			//Initialize layers
			this.layerOrder = ['grid', 'shadow', 'stones', 'score', 'markup', 'hover'];
			this.layers = {
				grid: new GridLayer(this),
				shadow: new ShadowLayer(this),
				stones: new StonesLayer(this),
				markup: new MarkupLayer(this),
				score: new ScoreLayer(this),
				hover: new HoverLayer(this)
			};

			//Static board flag
			this.static = false;

			//Get margin from theme
			this.margin = this.theme.get('board.margin');

			//Color multiplier (to allow color swapping)
			this.colorMultiplier = 1;

			//Turn off coordinates
			this.coordinates = false;
			this.layers.grid.setCoordinates(false);

			//Initialize grid size
			this.width = 0;
			this.height = 0;

			//Initialize cutoff
			this.cutoff = {
				top: false,
				left: false,
				right: false,
				bottom: false
			};

			//Initialize section
			this.section = {
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			};
		};

		/**
		 * Link the board to a HTML element
		 */
		Board.prototype.linkElement = function(element) {
			this.element = element;
		};

		/**
		 * Make this board static (one canvas layer, only grid, stones and markup)
		 */
		Board.prototype.makeStatic = function() {
			this.static = true;
			this.layerOrder = ['grid', 'stones', 'markup'];
		};

		/***********************************************************************************************
		 * Configuration
		 ***/

		/**
		 * Parse config instructions
		 */
		Board.prototype.parseConfig = function(config) {

			//Validate
			if (typeof config != 'object') {
				return;
			}

			//Extend from default config
			config = angular.extend({}, defaultConfig, config);

			//Process settigns
			this.toggleCoordinates(config.coordinates);
			this.swapColors(config.color_multiplier);
			this.setCutoff(config.cutoff);
			this.setSection(config.section);
			this.setSize(config.width, config.height);
		};

		/**
		 * Set margin
		 */
		Board.prototype.setMargin = function(margin) {

			//Reset when not defined
			if (typeof margin == 'undefined') {
				margin = this.theme.get('board.margin');
			}

			//Set margin if changed
			if (this.margin != margin) {
				this.margin = margin;
				this.resized();
			}

			//Return self for chaining
			return this;
		};

		/**
		 * Set grid cut-off
		 */
		Board.prototype.setCutoff = function(cutoff) {

			//Nothing given? Reset cutoff
			if (!cutoff || !angular.isArray(cutoff)) {
				cutoff = [];
			}

			//Init
			var changes = false;

			//Check if there's a change
			for (var side in this.cutoff) {
				if (cutoff.indexOf(side) != -1) {
					if (!this.cutoff[side]) {
						this.cutoff[side] = true;
						changes = true;
					}
				}
				else {
					if (this.cutoff[side]) {
						this.cutoff[side] = false;
						changes = true;
					}
				}
			}

			//Trigger resized if there were changes
			if (changes) {
				this.resized();
			}

			//Return self for chaining
			return this;
		};

		/**
		 * Set section of the board to be displayed
		 */
		Board.prototype.setSection = function(section) {

			//Nothing given?
			if (!section || typeof section != 'object') {
				return this;
			}

			//Expand on default
			section = angular.extend({
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			}, section);

			//No changes?
			if (this.section.top == section.top && this.section.bottom == section.bottom && this.section.left == section.left && this.section.right == section.right) {
				return this;
			}

			//Set section and call resized handler
			this.section = section;
			this.resized();

			//Return self for chaining
			return this;
		};

		/**
		 * Set board size. This will clear the board objects.
		 */
		Board.prototype.setSize = function(width, height) {

			//Check what's given
			width = parseInt(width || height || 0);
			height = parseInt(height || width || 0);

			//Invalid?
			if (isNaN(width) || isNaN(height)) {
				return;
			}

			//Changing?
			if (width != this.width || height != this.height) {

				//Remember size
				this.width = width;
				this.height = height;

				//Set size in layers
				for (var layer in this.layers) {
					this.layers[layer].setSize(width, height);
				}

				//Broadcast event (no call to resized, as that is handled in the directive)
				$rootScope.$broadcast('ngGo.board.resize', this, width, height);
			}

			//Return self for chaining
			return this;
		};

		/**
		 * Set new draw size
		 */
		Board.prototype.setDrawSize = function(width, height) {
			if (width != this.drawWidth || height != this.drawHeight) {
				this.drawWidth = width;
				this.drawHeight = height;
				this.resized();
			}
		};

		/**
		 * Toggle the coordinates
		 */
		Board.prototype.toggleCoordinates = function(show) {

			//Set or toggle
			if (typeof show != 'undefined') {
				this.coordinates = show;
			}
			else {
				this.coordinates = !this.coordinates;
			}

			//Set in grid layer
			this.layers.grid.setCoordinates(this.coordinates);

			//Set the proper board margin
			if (this.coordinates) {
				this.setMargin(this.theme.get('coordinates.margin'));
			}
			else {
				this.setMargin(this.theme.get('board.margin'));
			}
		};

		/**
		 * Swap colors on the board
		 */
		Board.prototype.swapColors = function(multiplier) {

			//Multiplier not given? Set to inverse of current value
			if (typeof multiplier == 'undefined') {
				multiplier = -this.colorMultiplier;
			}
			else {
				multiplier = parseInt(multiplier);
				if (isNaN(multiplier)) {
					return;
				}
			}

			//No change?
			if (multiplier == this.colorMultiplier) {
				return;
			}

			//Set new value
			this.colorMultiplier = multiplier;

			//For static board, redraw the whole thing
			if (this.static) {
				this.redraw();
			}

			//For a dynamic board, only these layers
			else {
				this.redraw('stones');
				this.redraw('markup');
			}
		};

		/***********************************************************************************************
		 * Theme handling
		 ***/

		/**
		 * Get the current theme object
		 */
		Board.prototype.getTheme = function() {
			return this.theme;
		};

		/**
		 * Set the theme object
		 */
		Board.prototype.setTheme = function(theme) {
			this.theme = theme;
			return this;
		};

		/***********************************************************************************************
		 * Object handling
		 ***/

		/**
		 * Add an object to a board layer
		 */
		Board.prototype.add = function(layer, x, y, value) {
			if (typeof this.layers[layer] != 'undefined') {
				this.layers[layer].add(x, y, value);
			}
		};

		/**
		 * Remove an object from a board layer
		 */
		Board.prototype.remove = function(layer, x, y) {
			if (typeof this.layers[layer] != 'undefined') {
				this.layers[layer].remove(x, y);
			}
		};

		/**
		 * Get something from a board layer
		 */
		Board.prototype.get = function(layer, x, y) {
			return (this.layers[layer] && this.layers[layer].get(x, y));
		};

		/**
		 * Check if we have something at given coordinates for a given layer
		 */
		Board.prototype.has = function(layer, x, y) {
			return (this.layers[layer] && this.layers[layer].has(x, y));
		};

		/**
		 * Set all objects (grid) for a given layer
		 */
		Board.prototype.setAll = function(layer, grid) {
			if (typeof this.layers[layer] != 'undefined') {
				this.layers[layer].setAll(grid);
			}
		};

		/**
		 * Remove all objects from the board, optionally for a given layer
		 */
		Board.prototype.removeAll = function(layer) {
			if (layer) {
				if (typeof this.layers[layer] != 'undefined') {
					this.layers[layer].removeAll();
				}
			}
			else {
				for (layer in this.layers) {
					this.layers[layer].removeAll();
				}
			}
		};

		/***********************************************************************************************
		 * Position handling
		 ***/

		/**
		 * Update the board with a new position
		 */
		Board.prototype.updatePosition = function(position, pathChanged) {

			//If we have no grid size yet, use what's in the position
			if (!this.width || !this.height) {
				this.setSize(position.width, position.height);
			}

			//Remove markup if path changed
			if (pathChanged) {
				this.removeAll('markup');
			}

			//Set new stones and markup grids
			this.setAll('stones', position.stones);
			this.setAll('markup', position.markup);
		};

		/***********************************************************************************************
		 * State handling
		 ***/

		/**
		 * Get the board state (list of objects per layer)
		 */
		Board.prototype.getState = function(layer) {

			//Only specific layer?
			if (layer) {
				if (this.layers[layer]) {
					return this.layers[layer].getAll();
				}
				return null;
			}

			//All layers
			var state = {};
			for (layer in this.layers) {
				var grid = this.layers[layer].getAll();
				if (grid && !grid.isEmpty()) {
					state[layer] = grid;
				}
			}
			return state;
		};

		/**
		 * Restore the board state from given state object
		 */
		Board.prototype.restoreState = function(state, layer) {

			//Only specific layer?
			if (layer) {
				if (this.layers[layer]) {
					this.layers[layer].setAll(state);
				}
				return;
			}

			//All layers
			for (layer in this.layers) {
				this.layers[layer].removeAll();
				if (state[layer]) {
					this.layers[layer].setAll(state[layer]);
				}
			}
		};

		/***********************************************************************************************
		 * Drawing control
		 ***/

		/**
		 * Clear the whole board
		 */
		Board.prototype.clear = function(layer) {

			//Just clearing one layer?
			if (layer) {

				//If the board is static or the layer is unknown, we can't do this
				if (this.static || !this.layers[layer]) {
					return;
				}

				//Clear the layer
				this.layers[layer].clear();
				return;
			}

			//Static? One clear is enough
			if (this.static) {
				this.layers.stones.clear();
				return;
			}

			//Clear all layers
			for (layer in this.layers) {
				this.layers[layer].clear();
			}
		};

		/**
		 * Redraw everything or just a single layer
		 */
		Board.prototype.redraw = function(layer) {

			//The board can only be redrawn when there is a grid size and a draw size
			if (!this.width || !this.height || !this.drawWidth || !this.drawHeight) {
				return;
			}

			//Just redrawing one layer?
			if (layer) {

				//If the board is static or the layer is unknown, we can't do this
				if (this.static || !this.layers[layer]) {
					return;
				}

				//Redraw the layer
				this.layers[layer].redraw();
				return;
			}

			//Clear the board first
			this.clear();

			//Now draw all layers again in the correct order
			for (var i = 0; i < this.layerOrder.length; i++) {
				layer = this.layerOrder[i];
				this.layers[layer].draw();
			}
		};

		/***********************************************************************************************
		 * Drawing helpers
		 ***/

		/**
		 * Called after a board size change, draw size change, section change or margin change
		 */
		Board.prototype.resized = function() {

			//Determine the new grid
			this.grid = {
				xLeft: 0 + this.section.left,
				xRight: this.width - 1 - this.section.right,
				yTop: 0 + this.section.top,
				yBot: this.height - 1 - this.section.bottom
			};

			//Only redraw when there is sensible data
			if (!this.width || !this.height || !this.drawWidth || !this.drawHeight) {
				return;
			}

			//Determine number of cells horizontall and vertically
			//The margin is a factor of the cell size, so let's add it to the number of cells
			var noCellsHor = this.width + this.margin,
				noCellsVer = this.height + this.margin;

			//Are we cutting off parts of the grid? Add half a cell of draw size
			for (var side in this.cutoff) {
				if (this.cutoff[side]) {
					if (side == 'top' || side == 'bottom') {
						noCellsVer += 0.5;
					}
					else {
						noCellsHor += 0.5;
					}
				}
			}

			//Determine cell size now
			this.cellSize = Math.floor(Math.min(
				this.drawWidth / noCellsHor,
				this.drawHeight / noCellsVer
			));

			//Determine actual grid draw size (taking off the margin again)
			this.gridDrawWidth = this.cellSize * (noCellsHor - this.margin - 1);
			this.gridDrawHeight = this.cellSize * (noCellsVer - this.margin - 1);

			//Determine draw margins
			this.drawMarginHor = Math.floor((this.drawWidth - this.gridDrawWidth) / 2);
			this.drawMarginVer = Math.floor((this.drawHeight - this.gridDrawHeight) / 2);

			//Redraw
			this.redraw();
		};

		/**
		 * Get the current cell size
		 */
		Board.prototype.getCellSize = function() {
			return this.cellSize;
		};

		/**
		 * Convert grid coordinate to pixel coordinate
		 */
		Board.prototype.getAbsX = function(gridX) {
			var offset = this.cutoff.left ? 0.5 : 0;
			return this.drawMarginHor + Math.round((gridX + offset) * this.cellSize);
		};

		/**
		 * Convert grid coordinate to pixel coordinate
		 */
		Board.prototype.getAbsY = function(gridY) {
			var offset = this.cutoff.top ? 0.5 : 0;
			return this.drawMarginVer + Math.round((gridY + offset) * this.cellSize);
		};

		/**
		 * Convert pixel coordinate to grid coordinate
		 */
		Board.prototype.getGridX = function(absX) {
			var offset = this.cutoff.left ? 0.5 : 0;
			return Math.round((absX - this.drawMarginHor) / this.cellSize - offset);
		};

		/**
		 * Convert pixel coordinate to grid coordinate
		 */
		Board.prototype.getGridY = function(absY) {
			var offset = this.cutoff.top ? 0.5 : 0;
			return Math.round((absY - this.drawMarginVer) / this.cellSize - offset);
		};

		/**
		 * Check if given grid coordinates are on board
		 */
		Board.prototype.isOnBoard = function(gridX, gridY) {
			return gridX >= this.grid.xLeft && gridY >= this.grid.yTop && gridX <= this.grid.xRight && gridY <= this.grid.yBot;
		};

		//Return object
		return Board;
	}];
});

/**
 * DefaultClearHandler :: This is the default clear handler for clearing a cell of the board grid. It
 * is used by all objects that lack their own specific clear handler. Basically, it just clears a small
 * rectangular area on the canvas.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.DefaultClearHandler.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('DefaultClearHandler', function() {

	/**
	 * Clear handler definition
	 *
	 * All external handlers are called from the context of the layer that contains the object.
	 * First parameter is the canvas2d context, second parameter is the object itself.
	 */
	return function(context, obj) {

		//No context?
		if (!context) {
			return;
		}

		//Get coordinates and stone radius
		var x = this.board.getAbsX(obj.x),
			y = this.board.getAbsY(obj.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Clear rectangle the size of the stone radius
		context.clearRect(x-r, y-r, 2*r, 2*r);
	};
});

/**
 * BoardGrid :: This class represents a board grid of a given size. It acts as a container for
 * values (e.g. stone colors, markup types) for the layer classes, as well as a container for
 * stone color values for the game position class. It has built in validation of coordinates.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Grid.Service', [
	'ngGo',
	'ngGo.Board.GridChanges.Service'
])

/**
 * Factory definition
 */
.factory('BoardGrid', ["BoardGridChanges", function(BoardGridChanges) {

	/**
	 * Helper to convert a value at given coordinates to an object
	 */
	var toObject = function(x, y, valueKey) {

		//Create coordinates object
		var obj = {
			x: x,
			y: y
		};

		//Already an object?
		if (typeof this.grid[x][y] == 'object') {
			return angular.extend(obj, this.grid[x][y]);
		}

		//Not an object, set value with given value key and return
		obj[valueKey] = this.grid[x][y];
		return obj;
	};

	/**
	 * Constructor
	 */
	var BoardGrid = function(width, height, emptyValue) {

		//Initialize size and grid array
		this.width = 0;
		this.height = 0;
		this.grid = [];
		this.emptyValue = null;

		//Set empty value if given
		if (typeof emptyValue != 'undefined') {
			this.emptyValue = emptyValue;
		}

		//Size given? Set it
		if (width || height) {
			this.setSize(width, height);
		}
	};

	/**
	 * Set a value
	 */
	BoardGrid.prototype.set = function(x, y, value) {
		if (this.isOnGrid(x, y)) {
			this.grid[x][y] = value;
		}
	};

	/**
	 * Unset a value
	 */
	BoardGrid.prototype.unset = function(x, y) {
		if (this.isOnGrid(x, y)) {
			this.grid[x][y] = this.emptyValue;
		}
	};

	/**
	 * Check if we have a non null value on the coordinates
	 */
	BoardGrid.prototype.has = function(x, y) {
		return (this.isOnGrid(x, y) && this.grid[x][y] !== this.emptyValue);
	};

	/**
	 * Check if we have a specific value on the coordinates
	 */
	BoardGrid.prototype.is = function(x, y, value) {
		return (this.isOnGrid(x, y) && this.grid[x][y] === value);
	};

	/**
	 * Get a value, or an object with coordinates and the value in the given value key
	 */
	BoardGrid.prototype.get = function(x, y, valueKey) {

		//Validate
		if (!this.isOnGrid(x, y) || this.grid[x][y] === this.emptyValue) {
			return this.emptyValue;
		}

		//Return as is?
		if (!valueKey) {
			return this.grid[x][y];
		}

		//Return as object
		return toObject.call(this, x, y, valueKey);
	};

	/***********************************************************************************************
	 * Mass operations
	 ***/

	/**
	 * Get all items in the grid. If you specify a value key, a list of objects with coordinates
	 * and the value in the given value key will be returned.
	 */
	BoardGrid.prototype.all = function(valueKey) {

		//Just get the grid?
		if (!valueKey) {
			return this.grid;
		}

		//Initialize objects list
		var objects = [];

		//Loop coordinates
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				if (this.grid[x][y] !== this.emptyValue) {
					objects.push(toObject.call(this, x, y, valueKey));
				}
			}
		}

		//Return objects list
		return objects;
	};

	/**
	 * Check if there is anything
	 */
	BoardGrid.prototype.isEmpty = function() {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				if (this.grid[x][y] !== this.emptyValue) {
					return false;
				}
			}
		}
		return true;
	};

	/**
	 * Populate the whole grid with a given value
	 */
	BoardGrid.prototype.populate = function(value) {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				this.grid[x][y] = value;
			}
		}
	};

	/**
	 * Empty the grid
	 */
	BoardGrid.prototype.empty = function() {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				this.grid[x][y] = this.emptyValue;
			}
		}
	};

	/**
	 * Clone ourselves
	 */
	BoardGrid.prototype.clone = function() {

		//Create new instance
		var newGrid = new BoardGrid();

		//Manually set vars for maximum efficiency
		newGrid.grid = angular.copy(this.grid);
		newGrid.emptyValue = this.emptyValue;
		newGrid.width = this.width;
		newGrid.height = this.height;

		//Return
		return newGrid;
	};

	/***********************************************************************************************
	 * Comparison
	 ***/

	/**
	 * Checks if a given grid is the same as the current grid
	 */
	BoardGrid.prototype.isSameAs = function(grid) {

		//Must have the same size
		if (this.width != grid.width || this.height != grid.height) {
			return false;
		}

		//Loop all coordinates
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				if (this.grid[x][y] != grid[x][y]) {
					return false;
				}
			}
		}

		//No differences found
		return true;
	};

	/**
	 * Compares this position with another position and return change object
	 */
	BoardGrid.prototype.compare = function(newGrid, valueKey) {

		//Initialize board grid changes object
		var change, changes = new BoardGridChanges();

		//Must have the same size
		if (this.width != newGrid.width || this.height != newGrid.height) {
			console.warn('Trying to compare grids of a different size');
			return changes;
		}

		//Loop all coordinates
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {

				//Something to add?
				if (newGrid.grid[x][y] !== this.emptyValue && newGrid.grid[x][y] !== this.grid[x][y]) {
					changes.add.push(toObject.call(newGrid, x, y, valueKey));
				}

				//Something to remove?
				if (this.grid[x][y] !== this.emptyValue && newGrid.grid[x][y] !== this.grid[x][y]) {
					changes.remove.push(toObject.call(this, x, y, valueKey));
				}
			}
		}

		//Return changes grid
		return changes;
	};

	/***********************************************************************************************
	 * Helpers
	 ***/

	/**
	 * Helper to validate coordinates (first param can be an object)
	 */
	BoardGrid.prototype.isOnGrid = function(x, y) {
		return (x >= 0 && y >= 0 && x < this.width && y < this.height);
	};

	/**
	 * Helper to set the empty value
	 */
	BoardGrid.prototype.whenEmpty = function(emptyValue) {
		this.emptyValue = emptyValue;
	};

	/**
	 * Set the grid size
	 */
	BoardGrid.prototype.setSize = function(width, height) {

		//Check what's given
		width = width || height || 0;
		height = height || width || 0;

		//Set
		this.width = parseInt(width);
		this.height = parseInt(height);

		//Create grid array
		this.grid = [];
		for (var x = 0; x < this.width; x++) {
			this.grid[x] = [];
			for (var y = 0; y < this.height; y++) {
				this.grid[x][y] = this.emptyValue;
			}
		}
	};

	/**
	 * Get the grid size object
	 */
	BoardGrid.prototype.getSize = function() {
		return {width: this.width, height: this.height};
	};

	//Return
	return BoardGrid;
}]);

/**
 * BoardGridChanges :: This is a simple class which acts as a wrapper for changes between two board
 * grids. It simply keeps track of what was added and what was removed.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.GridChanges.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('BoardGridChanges', function() {

	/**
	 * Helper to subtract sets
	 */
	var setSubtract = function(a, b) {
		var n = [], q;
		for (var i in a) {
			q = true;
			for (var j in b) {
				if (a[i].x == b[j].x && a[i].y == b[j].y) {
					q = false;
					break;
				}
			}
			if (q) {
				n.push(a[i]);
			}
		}
		return n;
	};

	/**
	 * Game position constructor
	 */
	return function() {

		/**
		 * Containers
		 */
		this.add = [];
		this.remove = [];

		/**
		 * Concatenation helper
		 */
		this.concat = function(newChanges) {
			this.add = setSubtract(this.add, newChanges.remove).concat(newChanges.add);
			this.remove = setSubtract(this.remove, newChanges.add).concat(newChanges.remove);
		};

		/**
		 * Check if there are changes
		 */
		this.has = function() {
			return !!(this.add.length || this.remove.length);
		};
	};
});

/**
 * BoardLayer :: This class represents a layer on the board and is the base class for all board layers.
 * Each layer can contain it's own objects on a grid with coordinates and is responsible for drawing
 * itself as well as its objects onto the canvas.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.Service', [
	'ngGo',
	'ngGo.Board.Grid.Service'
])

/**
 * Factory definition
 */
.factory('BoardLayer', ["BoardGrid", function(BoardGrid) {

	/**
	 * Constructor
	 */
	var BoardLayer = function(board, context) {

		//Remember board reference and 2d canvas context
		this.board = board;
		this.context = context;

		//Initialize grid for board objects
		this.grid = new BoardGrid();
	};

	/***********************************************************************************************
	 * Generic grid and object handling
	 ***/

	/**
	 * Set grid size
	 */
	BoardLayer.prototype.setSize = function(width, height) {

		//Note: since this method is usually only called upon a global board resize,
		//which also triggers the redraw method for layers, the layer is not cleared
		//here, as it will happen anyway during the redraw cycle.

		//Set it in the grid (removing all objects in the process)
		this.grid.setSize(width, height);
	};

	/**
	 * Get all items
	 */
	BoardLayer.prototype.getAll = function() {
		return this.grid.clone();
	};

	/**
	 * Set all items at once
	 */
	BoardLayer.prototype.setAll = function(grid) {
		this.grid = grid.clone();
	};

	/**
	 * Remove all (clear layer and empty grid)
	 */
	BoardLayer.prototype.removeAll = function() {
		this.clear();
		this.grid.empty();
	};

	/**
	 * Add a single item
	 */
	BoardLayer.prototype.add = function(x, y, value) {
		this.clearCell(x, y);
		this.grid.set(x, y, value);
		this.drawCell(x, y);
	};

	/**
	 * Remove a single item
	 */
	BoardLayer.prototype.remove = function(x, y) {
		this.clearCell(x, y);
		this.grid.unset(x, y);
	};

	/**
	 * Get an item
	 */
	BoardLayer.prototype.get = function(x, y) {
		return this.grid.get(x, y);
	};

	/**
	 * Check if there is an item
	 */
	BoardLayer.prototype.has = function(x, y) {
		return this.grid.has(x, y);
	};

	/***********************************************************************************************
	 * Generic drawing methods
	 ***/

	/**
	 * Draw layer
	 */
	BoardLayer.prototype.draw = function() {
		//Drawing method to be implemented in specific layer class
	};

	/**
	 * Clear layer (this method doesn't clear objects, as the canvas wipe clears the entire canvas)
	 */
	BoardLayer.prototype.clear = function() {
		if (this.context) {
			this.context.clearRect(0, 0, this.context.canvas.clientWidth, this.context.canvas.clientHeight);
		}
	};

	/**
	 * Redraw layer
	 */
	BoardLayer.prototype.redraw = function() {
		this.clear();
		this.draw();
	};

	/**
	 * Draw cell
	 */
	BoardLayer.prototype.drawCell = function(x, y) {
		//Drawing method to be implemented in specific layer class
	};

	/**
	 * Clear cell
	 */
	BoardLayer.prototype.clearCell = function(x, y) {
		//Clearing method to be implemented in specific layer class
	};

	/**
	 * Redraw cell
	 */
	BoardLayer.prototype.redrawCell = function(x, y) {
		this.clearCell(x, y);
		this.drawCell(x, y);
	};

	/**
	 * Set the canvas2d context
	 */
	BoardLayer.prototype.setContext = function(context) {
		this.context = context;
	};

	/**
	 * Get the canvas2d context
	 */
	BoardLayer.prototype.getContext = function() {
		return this.context;
	};

	//Return
	return BoardLayer;
}]);

/**
 * GridLayer :: This class represents the grid layer of the board, and it is responsible for drawing
 * gridlines, starpoints and coordinates via the Coordinates class.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.GridLayer.Service', [
	'ngGo',
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Object.Coordinates.Service'
])

/**
 * Factory definition
 */
.factory('GridLayer', ["BoardLayer", "Coordinates", function(BoardLayer, Coordinates) {

	/**
	 * Helper for drawing starpoints
	 */
	var drawStarPoint = function(gridX, gridY, starRadius, starColor) {

		//Don't draw if it falls outsize of the board grid
		if (gridX < this.board.grid.xLeft || gridX > this.board.grid.xRight) {
			return;
		}
		if (gridY < this.board.grid.yTop || gridY > this.board.grid.yBot) {
			return;
		}

		//Get absolute coordinates and star point radius
		var x = this.board.getAbsX(gridX),
			y = this.board.getAbsY(gridY);

		//Draw star point
		this.context.beginPath();
		this.context.fillStyle = starColor;
		this.context.arc(x, y, starRadius, 0, 2*Math.PI, true);
		this.context.fill();
	};

	/**
	 * Constructor
	 */
	var GridLayer = function(board, context) {

		//Set coordinates setting
		this.coordinates = false;

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(GridLayer.prototype, BoardLayer.prototype);

	/**
	 * Show or hide the coordinates.
	 */
	GridLayer.prototype.setCoordinates = function(show) {
		this.coordinates = show;
	};

	/***********************************************************************************************
	 * Object handling
	 ***/

	/**
	 * Get all has nothing to return
	 */
	GridLayer.prototype.getAll = function() {
		return null;
	};

	/**
	 * Set all has nothing to set
	 */
	GridLayer.prototype.setAll = function(grid) {
		return;
	};

	/**
	 * Remove all has nothing to remove
	 */
	GridLayer.prototype.removeAll = function() {
		return;
	};

	/***********************************************************************************************
	 * Drawing
	 ***/

	/**
	 * Draw method
	 */
	GridLayer.prototype.draw = function() {

		//Can only draw when we have dimensions and context
		if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//Determine top x and y margin
		var tx = this.board.drawMarginHor,
			ty = this.board.drawMarginVer;

		//Get theme properties
		var cellSize = this.board.getCellSize(),
			lineWidth = this.board.theme.get('grid.lineWidth', cellSize),
			lineCap = this.board.theme.get('grid.lineCap'),
			strokeStyle = this.board.theme.get('grid.lineColor'),
			starRadius = this.board.theme.get('grid.star.radius', cellSize),
			starColor = this.board.theme.get('grid.star.color'),
			starPoints = this.board.theme.get('grid.star.points', this.board.width, this.board.height),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.beginPath();
		this.context.lineWidth = lineWidth;
		this.context.lineCap = lineCap;
		this.context.strokeStyle = strokeStyle;

		//Helper vars
		var i, x, y;

		//Draw vertical lines
		for (i = this.board.grid.xLeft; i <= this.board.grid.xRight; i++) {
			x = this.board.getAbsX(i);
			this.context.moveTo(x, ty);
			this.context.lineTo(x, ty + this.board.gridDrawHeight);
		}

		//Draw horizontal lines
		for (i = this.board.grid.yTop; i <= this.board.grid.yBot; i++) {
			y = this.board.getAbsY(i);
			this.context.moveTo(tx, y);
			this.context.lineTo(tx + this.board.gridDrawWidth, y);
		}

		//Draw grid lines
		this.context.stroke();

		//Star points defined?
		for (i in starPoints) {
			drawStarPoint.call(this, starPoints[i].x, starPoints[i].y, starRadius, starColor);
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);

		//Draw coordinates
		if (this.coordinates) {
			Coordinates.draw.call(this);
		}
	};

	/**
	 * Clear a square cell area on the grid
	 */
	GridLayer.prototype.clearCell = function(gridX, gridY) {

		//Get absolute coordinates and stone radius
		var x = this.board.getAbsX(gridX),
			y = this.board.getAbsY(gridY),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Get theme properties
		var lineWidth = this.board.theme.get('grid.lineWidth', s),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Clear rectangle
		this.context.clearRect(x-r, y-r, 2*r, 2*r);

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Redraw a square cell area on the grid
	 */
	GridLayer.prototype.redrawCell = function(gridX, gridY) {

		//Get absolute coordinates and stone radius
		var x = this.board.getAbsX(gridX),
			y = this.board.getAbsY(gridY),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Get theme properties
		var lineWidth = this.board.theme.get('grid.lineWidth', s),
			strokeStyle = this.board.theme.get('grid.lineColor'),
			starRadius = this.board.theme.get('grid.star.radius', s),
			starColor = this.board.theme.get('grid.star.color'),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth),
			starPoints = this.board.theme.get('grid.star.points', this.board.width, this.board.height);

		//Determine draw coordinates
		var x1 = (gridX === 0) ? x : x-r,
			x2 = (gridX === this.board.width - 1) ? x : x+r,
			y1 = (gridY === 0) ? y : y-r,
			y2 = (gridY === this.board.height - 1) ? y : y+r;

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.beginPath();
		this.context.lineWidth = lineWidth;
		this.context.strokeStyle = strokeStyle;

		//Patch up grid lines
		this.context.moveTo(x1, y);
		this.context.lineTo(x2, y);
		this.context.moveTo(x, y1);
		this.context.lineTo(x, y2);
		this.context.stroke();

		//Check if we need to draw a star point here
		for (var i in starPoints) {
			if (starPoints[i].x == gridX && starPoints[i].y == gridY) {
				drawStarPoint.call(this, gridX, gridY, starRadius, starColor);
			}
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	//Return
	return GridLayer;
}]);

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.HoverLayer.Service', [
	'ngGo',
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Object.Markup.Service',
	'ngGo.Board.Object.StoneFaded.Service'
])

/**
 * Factory definition
 */
.factory('HoverLayer', ["BoardLayer", "Markup", "StoneFaded", function(BoardLayer, Markup, StoneFaded) {

	/**
	 * Constructor
	 */
	var HoverLayer = function(board, context) {

		//Container for items to restore
		this.restore = [];

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(HoverLayer.prototype, BoardLayer.prototype);

	/**
	 * Add hover item
	 */
	HoverLayer.prototype.add = function(x, y, hover) {

		//Validate coordinates
		if (!this.grid.isOnGrid(x, y)) {
			return;
		}

		//Remove any previous item at this position
		this.remove(x, y);

		//Create hover object
		hover.object = {
			x: x,
			y: y
		};

		//Stones
		if (hover.type == 'stones') {
			hover.objectClass = StoneFaded;
			hover.object.color = hover.value;
		}

		//Markup
		else if (hover.type == 'markup') {
			hover.objectClass = Markup;
			if (typeof hover.value == 'object') {
				hover.object = angular.extend(hover.object, hover.value);
			}
			else {
				hover.object.type = hover.value;
			}
		}

		//Unknown
		else {
			console.warn('Unknown hover type', hover.type);
			return;
		}

		//Check if we need to hide something on layers underneath
		if (this.board.has(hover.type, x, y)) {
			this.restore.push({
				x: x,
				y: y,
				layer: hover.type,
				value: this.board.get(hover.type, x, y)
			});
			this.board.remove(hover.type, x, y);
		}

		//Add to stack
		this.grid.set(x, y, hover);

		//Draw item
		if (hover.objectClass && hover.objectClass.draw) {
			hover.objectClass.draw.call(this, hover.object);
		}
	};

	/**
	 * Remove the hover object
	 */
	HoverLayer.prototype.remove = function(x, y) {

		//Validate coordinates
		if (!this.grid.has(x, y)) {
			return;
		}

		//Get object and clear it
		var hover = this.grid.get(x, y);
		if (hover.objectClass && hover.objectClass.clear) {
			hover.objectClass.clear.call(this, hover.object);
		}

		//Other objects to restore?
		for (var i = 0; i < this.restore.length; i++) {
			if (this.restore[i].x == x && this.restore[i].y == y) {
				this.board.add(this.restore[i].layer, this.restore[i].x, this.restore[i].y, this.restore[i].value);
				this.restore.splice(i, 1);
			}
		}
	};

	/**
	 * Remove all hover objects
	 */
	HoverLayer.prototype.removeAll = function() {

		//Anything to do?
		if (this.grid.isEmpty()) {
			return;
		}

		//Get all item as objects
		var i, hover = this.grid.all('layer');

		//Clear them
		for (i = 0; i < hover.length; i++) {
			if (hover[i].objectClass && hover[i].objectClass.clear) {
				hover[i].objectClass.clear.call(this, hover[i].object);
			}
		}

		//Clear layer and empty grid
		this.clear();
		this.grid.empty();

		//Restore objects on other layers
		for (i = 0; i < this.restore.length; i++) {
			this.board.add(this.restore[i].layer, this.restore[i].x, this.restore[i].y, this.restore[i].value);
		}

		//Clear restore array
		this.restore = [];
	};

	/**
	 * Draw layer
	 */
	HoverLayer.prototype.draw = function() {

		//Can only draw when we have dimensions and context
		if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//Loop objects and clear them
		var hover = this.grid.all('hover');
		for (var i = 0; i < hover.length; i++) {
			if (hover.objectClass && hover.objectClass.draw) {
				hover.objectClass.draw.call(this, hover.object);
			}
		}
	};

	//Return
	return HoverLayer;
}]);

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.MarkupLayer.Service', [
	'ngGo',
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Object.Markup.Service'
])

/**
 * Factory definition
 */
.factory('MarkupLayer', ["BoardLayer", "Markup", function(BoardLayer, Markup) {

	/**
	 * Constructor
	 */
	var MarkupLayer = function(board, context) {

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(MarkupLayer.prototype, BoardLayer.prototype);

	/***********************************************************************************************
	 * Object handling
	 ***/

	/**
	 * Set all markup at once
	 */
	MarkupLayer.prototype.setAll = function(grid) {

		//Get changes compared to current grid
		var i, changes = this.grid.compare(grid, 'type');

		//Clear removed stuff
		for (i = 0; i < changes.remove.length; i++) {
			Markup.clear.call(this, changes.remove[i]);
		}

		//Draw added stuff
		for (i = 0; i < changes.add.length; i++) {
			Markup.draw.call(this, changes.add[i]);
		}

		//Remember new grid
		this.grid = grid.clone();
	};

	/**
	 * Remove all (clear layer and empty grid)
	 */
	MarkupLayer.prototype.removeAll = function() {

		//Get all markup as objects
		var markup = this.grid.all('type');

		//Clear them
		for (var i = 0; i < markup.length; i++) {
			Markup.clear.call(this, markup[i]);
		}

		//Empty the grid now
		this.grid.empty();
	};

	/***********************************************************************************************
	 * Drawing
	 ***/

	/**
	 * Draw layer
	 */
	MarkupLayer.prototype.draw = function() {

		//Can only draw when we have dimensions and context
		if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//Get all markup as objects
		var markup = this.grid.all('type');

		//Draw them
		for (var i = 0; i < markup.length; i++) {
			Markup.draw.call(this, markup[i]);
		}
	};

	/**
	 * Draw cell
	 */
	MarkupLayer.prototype.drawCell = function(x, y) {

		//Can only draw when we have dimensions
		if (this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//On grid?
		if (this.grid.has(x, y)) {
			Markup.draw.call(this, this.grid.get(x, y, 'type'));
		}
	};

	/**
	 * Clear cell
	 */
	MarkupLayer.prototype.clearCell = function(x, y) {
		if (this.grid.has(x, y)) {
			Markup.clear.call(this, this.grid.get(x, y, 'type'));
		}
	};

	//Return
	return MarkupLayer;
}]);

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.ScoreLayer.Service', [
	'ngGo',
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Object.StoneMini.Service',
	'ngGo.Board.Object.StoneFaded.Service'
])

/**
 * Factory definition
 */
.factory('ScoreLayer', ["BoardLayer", "StoneMini", "StoneFaded", function(BoardLayer, StoneMini, StoneFaded) {

	/**
	 * Constructor
	 */
	var ScoreLayer = function(board, context) {

		//Points and captures
		this.points = [];
		this.captures = [];

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(ScoreLayer.prototype, BoardLayer.prototype);

	/***********************************************************************************************
	 * Object handling
	 ***/

	/**
	 * Set points and captures
	 */
	ScoreLayer.prototype.setAll = function(points, captures) {

		//Remove all existing stuff first
		this.removeAll();

		//Set new stuff
		this.points = points.all('color');
		this.captures = captures.all('color');

		//Draw
		this.draw();
	};

	/**
	 * Remove all scoring
	 */
	ScoreLayer.prototype.removeAll = function() {

		//If there are captures, draw them back onto the stones layer
		for (var i = 0; i < this.captures.length; i++) {
			this.board.add('stones', this.captures[i].x, this.captures[i].y, this.captures[i].color);
		}

		//Clear the layer
		this.clear();

		//Remove all stuff
		this.points = [];
		this.captures = [];
	};

	/***********************************************************************************************
	 * Drawing
	 ***/

	/**
	 * Draw layer
	 */
	ScoreLayer.prototype.draw = function() {

		//Can only draw when we have dimensions and context
		if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//Init
		var i;

		//Draw captures first (removing stones from the stones layer)
		for (i = 0; i < this.captures.length; i++) {
			this.board.remove('stones', this.captures[i].x, this.captures[i].y);
			StoneFaded.draw.call(this, this.captures[i]);
		}

		//Draw points on top of it
		for (i = 0; i < this.points.length; i++) {
			StoneMini.draw.call(this, this.points[i]);
		}
	};

	//Return
	return ScoreLayer;
}]);

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.ShadowLayer.Service', [
	'ngGo',
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Object.StoneShadow.Service',
])

/**
 * Factory definition
 */
.factory('ShadowLayer', ["BoardLayer", "StoneShadow", function(BoardLayer, StoneShadow) {

	/**
	 * Constructor
	 */
	var ShadowLayer = function(board, context) {

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(ShadowLayer.prototype, BoardLayer.prototype);

	/**
	 * Add a stone
	 */
	ShadowLayer.prototype.add = function(stone) {

		//Don't add if no shadow
		if (stone.shadow === false || (typeof stone.alpha != 'undefined' && stone.alpha < 1)) {
			return;
		}

		//Already have a stone here?
		if (this.grid.has(stone.x, stone.y)) {
			return;
		}

		//Add to grid
		this.grid.set(stone.x, stone.y, stone.color);

		//Draw it if there is a context
		if (this.context && this.board.drawWidth !== 0 && this.board.drawheight !== 0) {
			StoneShadow.draw.call(this, stone);
		}
	};

	/**
	 * Remove a stone
	 */
	ShadowLayer.prototype.remove = function(stone) {

		//Remove from grid
		this.grid.unset(stone.x, stone.y);

		//Redraw whole layer
		this.redraw();
	};

	/**
	 * Draw layer
	 */
	ShadowLayer.prototype.draw = function() {

		//Can only draw when we have dimensions and context
		if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//Get shadowsize from theme
		var shadowSize = this.board.theme.get('shadow.size', this.board.getCellSize());

		//Apply shadow transformation
		this.context.setTransform(1, 0, 0, 1, shadowSize, shadowSize);

		//Get all stones as objects
		var stones = this.grid.all('color');

		//Draw them
		for (var i = 0; i < stones.length; i++) {
			StoneShadow.draw.call(this, stones[i]);
		}
	};

	//Return
	return ShadowLayer;
}]);

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.StonesLayer.Service', [
	'ngGo',
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Object.Stone.Service'
])

/**
 * Factory definition
 */
.factory('StonesLayer', ["BoardLayer", "Stone", "StoneColor", function(BoardLayer, Stone, StoneColor) {

	/**
	 * Constructor
	 */
	var StonesLayer = function(board, context) {

		//Call parent constructor
		BoardLayer.call(this, board, context);

		//Set empty value for grid
		this.grid.whenEmpty(StoneColor.EMPTY);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(StonesLayer.prototype, BoardLayer.prototype);

	/***********************************************************************************************
	 * Object handling
	 ***/

	/**
	 * Set all stones at once
	 */
	StonesLayer.prototype.setAll = function(grid) {

		//Get changes compared to current grid
		var i, changes = this.grid.compare(grid, 'color');

		//Clear removed stuff
		for (i = 0; i < changes.remove.length; i++) {
			Stone.clear.call(this, changes.remove[i]);
		}

		//Draw added stuff
		for (i = 0; i < changes.add.length; i++) {
			Stone.draw.call(this, changes.add[i]);
		}

		//Remember new grid
		this.grid = grid.clone();
	};

	/***********************************************************************************************
	 * Drawing
	 ***/

	/**
	 * Draw layer
	 */
	StonesLayer.prototype.draw = function() {

		//Can only draw when we have dimensions and context
		if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//Get all stones as objects
		var stones = this.grid.all('color');

		//Draw them
		for (var i = 0; i < stones.length; i++) {
			Stone.draw.call(this, stones[i]);
		}
	};

	/**
	 * Redraw layer
	 */
	StonesLayer.prototype.redraw = function() {

		//Clear shadows layer
		this.board.removeAll('shadow');

		//Redraw ourselves
		this.clear();
		this.draw();
	};

	/**
	 * Draw cell
	 */
	StonesLayer.prototype.drawCell = function(x, y) {

		//Can only draw when we have dimensions
		if (this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//On grid?
		if (this.grid.has(x, y)) {
			Stone.draw.call(this, this.grid.get(x, y, 'color'));
		}
	};

	/**
	 * Clear cell
	 */
	StonesLayer.prototype.clearCell = function(x, y) {
		if (this.grid.has(x, y)) {
			Stone.clear.call(this, this.grid.get(x, y, 'color'));
		}
	};

	//Return
	return StonesLayer;
}]);

/**
 * BoardObject :: Base class for drawing board objects
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Service', [
	'ngGo',
	'ngGo.Board.DefaultClearHandler.Service'
])

/**
 * Factory definition
 */
.factory('BoardObject', ["DefaultClearHandler", function(DefaultClearHandler) {

	/**
	 * Constructor
	 */
	var BoardObject = {

		/**
		 * Draw method
		 */
		draw: function(obj) {
			if (this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}
		},

		/**
		 * Clear method
		 */
		clear: function(obj) {
			DefaultClearHandler.call(this, this.context, obj);
		}
	};

	//Return
	return BoardObject;
}]);

/**
 * Coordinates :: This class is used for drawing board coordinates
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Coordinates.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('Coordinates', function() {

	//Kanji
	var kanji = [
		'一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
		'十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
		'二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十',
		'三十一', '三十二', '三十三', '三十四', '三十五', '三十六', '三十七', '三十八', '三十九', '四十'
	];

	//Some character codes
	var aChar = 'A'.charCodeAt(0),
		iChar = 'I'.charCodeAt(0),
		aCharLc = 'a'.charCodeAt(0);

	/**
	 * Coordinate generators
	 */
	var coordinates = {

		//Kanji coordinates
		kanji: function(i) {
			return kanji[i] || '';
		},

		//Numbers from 1
		numbers: function(i) {
			return i + 1;
		},

		//Capital letters from A
		letters: function(i) {

			//Initialize
			var ch = '';

			//Beyond Z? Prepend with A
			if (i >= 25) {
				ch = 'A';
				i -= 25;
			}

			//The letter I is ommitted
			if (i >= 8) {
				i++;
			}

			//Return
			return ch + String.fromCharCode(aChar + i);
		},

		//JGF coordinates (e.g. 0, 1, ...)
		jgf: function(i) {
			return i;
		},

		//SGF coordinates (e.g. a, b, ...)
		sgf: function(i) {
			var ch;
			if (i < 26) {
				ch = aCharLc + i;
			}
			else {
				ch = aChar + i;
			}
			return String.fromCharCode(ch);
		}
	};

	/**
	 * Coordinates object
	 */
	var Coordinates = {

		/**
		 * Draw
		 */
		draw: function() {

			//Can only draw when we have context and dimensions
			if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Get cell size
			var cellSize = this.board.getCellSize();

			//Get boundary coordinates
			var xl = Math.ceil((this.board.drawMarginHor - cellSize/2) / 2),
				xr = this.board.drawWidth - xl,
				yt = Math.ceil((this.board.drawMarginVer - cellSize/2) / 2),
				yb = this.board.drawHeight - yt;

			//Get theme properties
			var stoneRadius = this.board.theme.get('stone.radius', cellSize),
				fillStyle = this.board.theme.get('coordinates.color'),
				vertical = {
					font: this.board.theme.get('coordinates.vertical.font'),
					size: this.board.theme.get('coordinates.vertical.size'),
					style: this.board.theme.get('coordinates.vertical.style'),
					inverse: this.board.theme.get('coordinates.vertical.inverse')
				},
				horizontal = {
					font: this.board.theme.get('coordinates.horizontal.font'),
					size: this.board.theme.get('coordinates.horizontal.size'),
					style: this.board.theme.get('coordinates.horizontal.style'),
					inverse: this.board.theme.get('coordinates.horizontal.inverse')
				};

			//Configure context
			this.context.fillStyle = fillStyle;
			this.context.textBaseline = 'middle';
			this.context.textAlign = 'center';

			//Helper vars
			var i, j, x, y, ch;

			//Draw vertical coordinates
			for (i = 0; i < this.board.height; i++) {

				//Inverse?
				j = i;
				if (vertical.inverse) {
					j = this.board.height - i - 1;
				}

				//Get character
				if (typeof vertical.style == 'function') {
					ch = vertical.style.call(this, j);
				}
				else if (coordinates[vertical.style]) {
					ch = coordinates[vertical.style].call(this, j);
				}
				else {
					ch = j;
				}

				//Draw
				y = this.board.getAbsY(i);
				this.context.font = vertical.size(ch, cellSize) + ' ' + vertical.font;
				this.context.fillText(ch, xl, y);
				this.context.fillText(ch, xr, y);
			}

			//Draw horizontal coordinates
			for (i = 0; i < this.board.width; i++) {

				//Inverse?
				j = i;
				if (horizontal.inverse) {
					j = this.board.width - i - 1;
				}

				//Get character
				if (typeof horizontal.style == 'function') {
					ch = horizontal.style.call(this, j);
				}
				else if (coordinates[horizontal.style]) {
					ch = coordinates[horizontal.style].call(this, j);
				}
				else {
					ch = j;
				}

				//Draw
				x = this.board.getAbsX(i);
				this.context.font = horizontal.size(ch, cellSize) + ' ' + horizontal.font;
				this.context.fillText(ch, x, yt);
				this.context.fillText(ch, x, yb);
			}
		}
	};

	//Return
	return Coordinates;
});

/**
 * Markup :: This class is used for drawing markup
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Markup.Service', [
	'ngGo',
	'ngGo.Board.Object.Service'
])

/**
 * Factory definition
 */
.factory('Markup', ["MarkupTypes", "BoardObject", function(MarkupTypes, BoardObject) {

	/**
	 * Math constants
	 */
	var cosPi4 = Math.cos(Math.PI/4),
		cosPi6 = Math.cos(Math.PI/6);

	/**
	 * Triangle draw handler
	 */
	var drawTriangle = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.triangle.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;

		//Draw element
		this.context.beginPath();
		this.context.moveTo(x, y-r);
		this.context.lineTo(x - Math.round(r*cosPi6), y + Math.round(r/2));
		this.context.lineTo(x + Math.round(r*cosPi6), y + Math.round(r/2));
		this.context.closePath();
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Square draw handler
	 */
	var drawSquare = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.square.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Determine cos
		var rcos = Math.round(r*cosPi4);

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;

		//Draw element
		this.context.beginPath();
		this.context.rect(x - rcos, y - rcos, 2*rcos, 2*rcos);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw circle handler
	 */
	var drawCircle = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.circle.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;

		//Draw element
		this.context.beginPath();
		this.context.arc(x, y, r, 0, 2*Math.PI, true);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw mark handler
	 */
	var drawMark = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.mark.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Determine cos
		var rcos = Math.round(r*cosPi4);

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			lineCap = markup.lineCap || this.board.theme.get('markup.mark.lineCap'),
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;
		this.context.lineCap = lineCap;

		//Draw element
		this.context.beginPath();
		this.context.moveTo(x - rcos, y - rcos);
		this.context.lineTo(x + rcos, y + rcos);
		this.context.moveTo(x + rcos, y - rcos);
		this.context.lineTo(x - rcos, y + rcos);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw select handler
	 */
	var drawSelect = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.circle.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			fillStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.fillStyle = fillStyle;
		this.context.lineWidth = lineWidth;

		//Draw element
		this.context.beginPath();
		this.context.arc(x, y, r, 0, 2*Math.PI, true);
		this.context.fill();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Last move draw handler
	 */
	var drawLast = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.last.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var fillStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate(s);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.fillStyle = fillStyle;

		//Draw element
		this.context.beginPath();
		this.context.moveTo(x, y);
		this.context.lineTo(x + r, y);
		this.context.lineTo(x, y + r);
		this.context.closePath();
		this.context.fill();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw happy smiley handler
	 */
	var drawHappySmiley = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.smiley.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			lineCap = markup.lineCap || this.board.theme.get('markup.smiley.lineCap'),
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;
		this.context.lineCap = lineCap;

		//Draw element
		this.context.beginPath();
		this.context.arc(x - r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		this.context.stroke();
		this.context.beginPath();
		this.context.arc(x + r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		this.context.stroke();
		this.context.beginPath();
		this.context.moveTo(x - r/1.6, y + r/8);
		this.context.bezierCurveTo(x - r/1.8, y + r/1.5, x + r/1.8, y + r/1.5, x + r/1.6, y + r/8);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw sad smiley handler
	 */
	var drawSadSmiley = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.smiley.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			lineCap = markup.lineCap || this.board.theme.get('markup.smiley.lineCap'),
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;
		this.context.lineCap = lineCap;

		//Draw element
		this.context.beginPath();
		this.context.arc(x - r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		this.context.stroke();
		this.context.beginPath();
		this.context.arc(x + r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		this.context.stroke();
		this.context.beginPath();
		this.context.moveTo(x - r/1.6, y + r/1.5 -1);
		this.context.bezierCurveTo(x - r/1.8, y + r/8 -1, x + r/1.8, y + r/8 -1, x + r/1.6, y + r/1.5 -1);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw label
	 */
	var drawLabel = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.get('stones', markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var font = markup.font || this.board.theme.get('markup.label.font') || '',
			fillStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.canvasTranslate();

		//First, clear grid square below for clarity
		if (!this.board.has('stones', markup.x, markup.y)) {
			this.board.layers.grid.clearCell(markup.x, markup.y);
		}

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.fillStyle = fillStyle;
		this.context.textBaseline = 'middle';
		this.context.textAlign = 'center';

		//Convert to text
		if (typeof markup.text == 'number') {
			markup.text = markup.text.toString();
		}

		//Determine font size
		if (markup.text.length == 1) {
			this.context.font = Math.round(r * 1.5) + 'px ' + font;
		}
		else if (markup.text.length == 2) {
			this.context.font = Math.round(r * 1.2) + 'px ' + font;
		}
		else {
			this.context.font = r + 'px ' + font;
		}

		//Draw element
		this.context.beginPath();
		this.context.fillText(markup.text, x, y, 2*r);

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Clear label
	 */
	var clearLabel = function(markup) {

		//No stone on location? Redraw the grid square, if we cleared it
		if (!this.board.has('stones', markup.x, markup.y)) {
			var r = this.board.theme.get('stone.radius', this.board.getCellSize());
			this.board.layers.grid.redrawCell(markup.x, markup.y);
		}
	};

	/**
	 * Markup class
	 */
	var Markup = {

		/**
		 * Draw
		 */
		draw: function(markup) {

			//Can only draw when we have dimensions and context
			if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Drawing depends on type
			switch (markup.type) {

				//Triangle
				case MarkupTypes.TRIANGLE:
					drawTriangle.call(this, markup);
					break;

				//Square
				case MarkupTypes.SQUARE:
					drawSquare.call(this, markup);
					break;

				//Circle
				case MarkupTypes.CIRCLE:
					drawCircle.call(this, markup);
					break;

				//Mark
				case MarkupTypes.MARK:
					drawMark.call(this, markup);
					break;

				//Select
				case MarkupTypes.SELECT:
					drawSelect.call(this, markup);
					break;

				//happy
				case MarkupTypes.HAPPY:
					drawHappySmiley.call(this, markup);
					break;

				//Sad
				case MarkupTypes.SAD:
					drawSadSmiley.call(this, markup);
					break;

				//Last move marker
				case MarkupTypes.LAST:
					drawLast.call(this, markup);
					break;

				//Label
				case MarkupTypes.LABEL:
					markup.text = markup.text || '';
					drawLabel.call(this, markup);
					break;
			}
		},

		/**
		 * Clear
		 */
		clear: function(markup) {

			//Can only draw when we have dimensions and context
			if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Call parent method
			BoardObject.clear.call(this, markup);

			//Special handling for label
			if (markup.type == MarkupTypes.LABEL) {
				clearLabel.call(this, markup);
			}
		}
	};

	//Return
	return Markup;
}]);

/**
 * Stone :: This class is used for drawing stones on the board.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Stone.Service', [
	'ngGo',
	'ngGo.Board.Object.Service',
	'ngGo.Board.ShellPattern.Service'
])

/**
 * Factory definition
 */
.factory('Stone', ["$injector", "BoardObject", "StoneColor", "ShellPattern", function($injector, BoardObject, StoneColor, ShellPattern) {

	/**
	 * Shell random seed
	 */
	var shellSeed;

	/**
	 * Mono colored stones
	 */
	var drawMono = function(stone) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(stone.x),
			y = this.board.getAbsY(stone.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Apply scaling factor?
		if (stone.scale) {
			r = Math.round(r * stone.scale);
		}

		//Don't draw shadow
		stone.shadow = false;

		//Apply color multiplier
		var color = stone.color * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = this.board.theme.get('stone.mono.lineWidth', s) || 1,
			fillStyle = this.board.theme.get('stone.mono.color', color),
			strokeStyle = this.board.theme.get('stone.mono.lineColor', color),
			canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = stone.alpha;
		}

		//Configure context
		this.context.fillStyle = fillStyle;

		//Draw stone
		this.context.beginPath();
		this.context.arc(x, y, Math.max(0, r - lineWidth), 0, 2*Math.PI, true);
		this.context.fill();

		//Configure context
		this.context.lineWidth = lineWidth;
		this.context.strokeStyle = strokeStyle;

		//Draw outline
		this.context.stroke();

		//Undo transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = 1;
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Glass stones
	 */
	var drawGlass = function(stone) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(stone.x),
			y = this.board.getAbsY(stone.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Apply scaling factor?
		if (stone.scale) {
			r = Math.round(r * stone.scale);
		}

		//Apply color multiplier
		var color = stone.color * this.board.colorMultiplier;

		//Get theme variables
		var canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = stone.alpha;
		}

		//Begin path
		this.context.beginPath();

		//Determine stone texture
		if (color == StoneColor.W) {
			this.context.fillStyle = this.context.createRadialGradient(x - 2*r/5, y - 2*r/5, r/3, x - r/5, y - r/5, 5*r/5);
			this.context.fillStyle.addColorStop(0, '#fff');
			this.context.fillStyle.addColorStop(1, '#aaa');
		}
		else {
			this.context.fillStyle = this.context.createRadialGradient(x - 2*r/5, y - 2*r/5, 1, x - r/5, y - r/5, 4*r/5);
			this.context.fillStyle.addColorStop(0, '#666');
			this.context.fillStyle.addColorStop(1, '#111');
		}

		//Complete drawing
		this.context.arc(x, y, Math.max(0, r - 0.5), 0, 2*Math.PI, true);
		this.context.fill();

		//Undo transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = 1;
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Slate and shell stones
	 */
	var drawSlateShell = function(stone) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(stone.x),
			y = this.board.getAbsY(stone.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Apply scaling factor?
		if (stone.scale) {
			r = Math.round(r * stone.scale);
		}

		//Get random seed
		shellSeed = shellSeed || Math.ceil(Math.random() * 9999999);

		//Apply color multiplier
		var color = stone.color * this.board.colorMultiplier;

		//Get theme variables
		var shellTypes = this.board.theme.get('stone.shell.types'),
			fillStyle = this.board.theme.get('stone.shell.color', color),
			strokeStyle = this.board.theme.get('stone.shell.stroke'),
			canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = stone.alpha;
		}

		//Draw stone
		this.context.beginPath();
		this.context.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
		this.context.fillStyle = fillStyle;
		this.context.fill();

		//Shell stones
		if (color == StoneColor.W) {

			//Get random shell type
			var type = shellSeed%(shellTypes.length + stone.x * this.board.width + stone.y) % shellTypes.length;

			//Determine random angle
			var z = this.board.width * this.board.height + stone.x * this.board.width + stone.y,
				angle = (2/z)*(shellSeed%z);

			//Draw shell pattern
			ShellPattern.call(shellTypes[type], this.context, x, y, r, angle, strokeStyle);

			//Add radial gradient
			this.context.beginPath();
			this.context.fillStyle = this.context.createRadialGradient(x - 2*r/5, y - 2*r/5, r/6, x - r/5, y - r/5, r);
			this.context.fillStyle.addColorStop(0, 'rgba(255,255,255,0.9)');
			this.context.fillStyle.addColorStop(1, 'rgba(255,255,255,0)');
			this.context.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			this.context.fill();
		}

		//Slate stones
		else {

			//Add radial gradient
			this.context.beginPath();
			this.context.fillStyle = this.context.createRadialGradient(x + 2*r/5, y + 2*r/5, 0, x + r/2, y + r/2, r);
			this.context.fillStyle.addColorStop(0, 'rgba(32,32,32,1)');
			this.context.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');
			this.context.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			this.context.fill();

			//Add radial gradient
			this.context.beginPath();
			this.context.fillStyle = this.context.createRadialGradient(x - 2*r/5, y - 2*r/5, 1, x - r/2, y - r/2, 3*r/2);
			this.context.fillStyle.addColorStop(0, 'rgba(64,64,64,1)');
			this.context.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');
			this.context.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			this.context.fill();
		}

		//Undo transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = 1;
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Constructor
	 */
	var Stone = {

		/**
		 * Draw a stone
		 */
		draw: function(stone) {

			//Can only draw when we have dimensions and context
			if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Determine style of stone
			var style = this.board.theme.get('stone.style');

			//Draw using the appropriate handler
			switch (style) {

				//Slate and shell
				case 'shell':
					drawSlateShell.call(this, stone);
					break;

				//Glass stones
				case 'glass':
					drawGlass.call(this, stone);
					break;

				//Mono stones
				case 'mono':
					drawMono.call(this, stone);
					break;

				//Custom type
				default:
					var handler = $injector.get(style);
					if (handler) {
						handler.call(this, stone);
					}
			}

			//Add shadow
			if (!this.board.static && stone.shadow !== false && this.board.theme.get('stone.shadow')) {
				this.board.layers.shadow.add(stone);
			}
		},

		/**
		 * Clear a stone
		 */
		clear: function(stone) {

			//Can only draw when we have dimensions and context
			if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Call parent method
			BoardObject.clear.call(this, stone);

			//Remove shadow
			if (!this.board.static && stone.shadow !== false && this.board.theme.get('stone.shadow')) {
				this.board.layers.shadow.remove(stone);
			}
		}
	};

	//Return
	return Stone;
}]);

/**
 * StoneFaded :: This class extends the Stone class and is used for drawing faded stones.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.StoneFaded.Service', [
	'ngGo',
	'ngGo.Board.Object.Stone.Service'
])

/**
 * Factory definition
 */
.factory('StoneFaded', ["Stone", function(Stone) {

	/**
	 * Class
	 */
	var StoneFaded = {

		/**
		 * Draw stone
		 */
		draw: function(stone) {

			//Set scale and alpha
			stone.scale = this.board.theme.get('stone.faded.scale');
			stone.alpha = this.board.theme.get('stone.faded.alpha', stone.color);

			//Don't show shadow
			stone.shadow = false;

			//Now call the regular stone draw handler
			Stone.draw.call(this, stone);
		},

		/**
		 * Clear stone
		 */
		clear: function(stone) {

			//Don't show shadow
			stone.shadow = false;

			//Call parent method
			Stone.clear.call(this, stone);
		}
	};

	//Return
	return StoneFaded;
}]);

/**
 * StoneMini :: This class extends the Stone class and is used for drawing mini stones (for scoring).
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.StoneMini.Service', [
	'ngGo',
	'ngGo.Board.Object.Stone.Service'
])

/**
 * Factory definition
 */
.factory('StoneMini', ["Stone", function(Stone) {

	/**
	 * Class
	 */
	var StoneMini = {

		/**
		 * Draw stone
		 */
		draw: function(stone) {

			//Set scale and alpha
			stone.scale = this.board.theme.get('stone.mini.scale');
			stone.alpha = this.board.theme.get('stone.mini.alpha', stone.color);

			//Don't show shadow
			stone.shadow = false;

			//Now call the regular stone draw handler
			Stone.draw.call(this, stone);
		},

		/**
		 * Clear stone
		 */
		clear: function(stone) {

			//Don't show shadow
			stone.shadow = false;

			//Call parent method
			Stone.clear.call(this, stone);
		}
	};

	//Return
	return StoneMini;
}]);

/**
 * StoneShadow :: This class is used for drawing stone shadows on the board.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.StoneShadow.Service', [
	'ngGo',
	'ngGo.Board.Object.Service'
])

/**
 * Factory definition
 */
.factory('StoneShadow', ["BoardObject", function(BoardObject) {

	/**
	 * Constructor
	 */
	var StoneShadow = {

		/**
		 * Draw a stone shadow
		 */
		draw: function(stone) {

			//No context?
			if (!this.context) {
				return;
			}

			//Don't draw shadows if there is stone alpha or if explicitly stated
			if ((stone.alpha && stone.alpha < 1) || stone.shadow === false) {
				return;
			}

			//Get coordinates and stone radius
			var x = this.board.getAbsX(stone.x),
				y = this.board.getAbsY(stone.y),
				s = this.board.getCellSize(),
				r = Math.max(0, this.board.theme.get('stone.radius', s) - 0.5);

			//Apply scaling factor?
			if (stone.scale) {
				r = Math.round(r * stone.scale);
			}

			//Get theme properties
			var blur = this.board.theme.get('shadow.blur', s),
				offsetX = this.board.theme.get('shadow.offsetX', s),
				offsetY = this.board.theme.get('shadow.offsetY', s),
				shadowColor = this.board.theme.get('shadow.color');

			//Configure context
			this.context.fillStyle = this.context.createRadialGradient(x + offsetX, y + offsetY, r-1-blur, x + offsetX, y + offsetY, r+blur);
			this.context.fillStyle.addColorStop(0, shadowColor);
			this.context.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');

			//Draw shadow
			this.context.beginPath();
			this.context.arc(x + offsetX, y + offsetY, r+blur, 0, 2*Math.PI, true);
			this.context.fill();
		},

		/**
		 * Clear a stone shadow
		 */
		clear: function(stone) {

			//Note: this method is currently not in use due to the overlappign shadows
			//problem. Instead, the entire shadow layer is simply cleared and redrawn
			//when removing stones. The multiple canvasses solution from WGo didn't seem
			//appropriate either, so for now we will leave it at this.

			//No context?
			if (!this.context) {
				return;
			}

			//Don't draw shadows if there is stone alpha or if explicitly stated
			if ((stone.alpha && stone.alpha < 1) || stone.shadow === false) {
				return;
			}

			//Get coordinates and stone radius
			var x = this.board.getAbsX(stone.x),
				y = this.board.getAbsY(stone.y),
				s = this.board.getCellSize(),
				r = this.board.theme.get('stone.radius', s);

			//Clear a generous rectangle
			this.context.clearRect(x - 1.2*r, y - 1.2*r, 2.4*r, 2.4*r);
		}
	};

	//Return
	return StoneShadow;
}]);

/**
 * ShellPattern :: This is a helper class to draw shell patterned white stones.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.ShellPattern.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('ShellPattern', function() {

	/**
	 * Helper to draw a shell line
	 */
	var shellLine = function(ctx, x, y, radius, startAngle, endAngle, strokeStyle) {

		//Initialize
		ctx.shadowBlur = 2;
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = (radius/30) * this.thickness;
		ctx.beginPath();

		//Lower radius
		radius -= Math.max(1, ctx.lineWidth);

		//Determine coordinates
		var x1 = x + radius * Math.cos(startAngle * Math.PI),
			y1 = y + radius * Math.sin(startAngle * Math.PI),
			x2 = x + radius * Math.cos(endAngle * Math.PI),
			y2 = y + radius * Math.sin(endAngle * Math.PI);

		//Math magic
		var m, angle;
		if (x2 > x1) {
			m = (y2-y1) / (x2-x1);
			angle = Math.atan(m);
		}
		else if (x2 == x1) {
			angle = Math.PI/2;
		}
		else {
			m = (y2-y1) / (x2-x1);
			angle = Math.atan(m)-Math.PI;
		}

		//Curvature factor
		var c = this.factor * radius,
			diff_x = Math.sin(angle) * c,
			diff_y = Math.cos(angle) * c;

		//Curvature coordinates
		var bx1 = x1 + diff_x,
			by1 = y1 - diff_y,
			bx2 = x2 + diff_x,
			by2 = y2 - diff_y;

		//Draw shell stroke
		ctx.moveTo(x1, y1);
		ctx.bezierCurveTo(bx1, by1, bx2, by2, x2, y2);
		ctx.stroke();
	};

	/**
	 * Shell pattern drawer
	 */
	return function(ctx, x, y, radius, angle, strokeStyle) {

		//Initialize start and end angle
		var startAngle = angle,
			endAngle = angle;

		//Loop lines
		for (var i = 0; i < this.lines.length; i++) {
			startAngle += this.lines[i];
			endAngle -= this.lines[i];
			shellLine.call(this, ctx, x, y, radius, startAngle, endAngle, strokeStyle);
		}
	};
});

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
.provider('BoardTheme', ["StoneColor", "MarkupTypes", function(StoneColor, MarkupTypes) {

	/**
	 * Default theme
	 */
	var defaultTheme = {

		//Board
		board: {

			//Board margin factor
			margin: 0.25
		},

		//Stones
		stone: {

			//Stone style can be shell, glass, mono, or specify a custom handler service
			style: 'shell',
			shadow: true,
			radius: function(cellSize) {
				return Math.floor(cellSize / 2);
			},

			//Shell stones
			shell: {
				color: function(stoneColor) {
					if (stoneColor == StoneColor.B) {
						return '#111';
					}
					return '#BFBFBA';
				},
				stroke: 'rgba(128,128,128,0.15)',
				types: [
					{
						lines: [0.10, 0.12, 0.11, 0.10, 0.09, 0.09, 0.09, 0.09],
						factor: 0.15,
						thickness: 1.75
					},
					{
						lines: [0.10, 0.09, 0.08, 0.07, 0.09, 0.06, 0.06, 0.07, 0.07, 0.06, 0.06],
						factor: 0.1,
						thickness: 1.5
					},
					{
						lines: [0.22, 0.11, 0.13, 0.06, 0.11, 0.09],
						factor: 0.05,
						thickness: 1.75
					},
					{
						lines: [0.18, 0.23, 0.09, 0.17, 0.14],
						factor: 0.1,
						thickness: 2
					}
				]
			},

			//Mono stones
			mono: {
				lineWidth: 1,
				lineColor: function(stoneColor) {
					return '#000';
				},
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
			color: 'rgba(40,30,20,0.5)',

			//Shadow size
			size: function(cellSize) {
				return Math.floor(cellSize / 20);
			},

			//Shadow blur size
			blur: function(cellSize) {
				return cellSize / 20;
			},

			//Shadow offset
			offsetX: function(cellSize) {
				return Math.ceil(cellSize / 20);
			},
			offsetY: function(cellSize) {
				return Math.ceil(cellSize / 20);
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

			//Label
			label: {
				font: 'Arial'
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
					color: 'rgba(86,114,30,1)',
					scale: 0.5
				},
				invalid: {
					type: MarkupTypes.MARK,
					text: null,
					color: 'rgba(237,9,15,1)',
					scale: 0.3
				}
			}
		},

		//Grid
		grid: {

			//Line properties
			lineColor: 'rgba(60,40,15,1)',
			lineWidth: function(cellSize) {
				if (cellSize > 60) {
					return 2;
				}
				else if (cellSize > 50) {
					return 1.5;
				}
				return 1;
			},
			lineCap: 'square',

			//Star points
			star: {

				//Color and radius
				color: 'rgba(60,40,15,1)',
				radius: function(cellSize) {
					if (cellSize > 50) {
						return Math.floor((cellSize / 16) + 1);
					}
					else if (cellSize > 30) {
						return 3;
					}
					else if (cellSize > 15) {
						return 2;
					}
					else if (cellSize > 5) {
						return 1.5;
					}
					return 1;
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
			color: 'rgba(101,69,37,0.5)',

			//Board margin factor when showing coordinates
			margin: 1.25,

			//Vertical coordinates style
			vertical: {
				font: 'Arial',
				style: 'numbers',
				inverse: true,
				size: function() {
					return function(ch, cellSize) {
						return Math.floor((cellSize * 0.3) + 1) + 'px';
					};
				}
			},

			//Horizontal coordinates style
			horizontal: {
				font: 'Arial',
				style: 'letters',
				inverse: false,
				size: function() {
					return function(ch, cellSize) {
						return Math.floor((cellSize * 0.3) + 1) + 'px';
					};
				}
			}
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
	this.$get = ["StoneColor", function(StoneColor) {

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

				//Time to set?
				if ((i + 1) == path.length) {
					prop[path[i]] = value;
					break;
				}

				//Not set?
				if (typeof prop[path[i]] == 'undefined') {
					prop[path[i]] = {};
				}

				//Move on
				prop = prop[path[i]];
			}

			//Return self for chaining
			return this;
		};

		/**
		 * To combat 2d canvas blurry lines, we translate the canvas prior to drawing elements.
		 * See: http://www.mobtowers.com/html5-canvas-crisp-lines-every-time/
		 */
		BoardTheme.prototype.canvasTranslate = function(lineWidth) {

			//If no linewidth specified, use the grid line width as a reference
			//to make sure stuff is aligned to the grid
			if (typeof lineWidth == 'undefined') {
				lineWidth = this.get('grid.lineWidth');
			}

			//Return a translation for uneven widths
			return (lineWidth % 2) * 0.5;
		};

		//Return
		return BoardTheme;
	}];
}]);

/**
 * InvalidDataError :: Error class to handle invalid data.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Errors.InvalidDataError.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('InvalidDataError', ["ngGo", function(ngGo) {

	/**
	 * Define error
	 */
	var InvalidDataError = function(code) {

		//Set name and message
		this.code = code;
		this.name = 'InvalidDataError';
	    this.message = 'Invalid data: ';

		//Append code message
		switch (code) {
			case ngGo.error.NO_DATA:
				this.message += "no data to process.";
				break;
			case ngGo.error.UNKNOWN_DATA:
				this.message += "unknown data format.";
				break;
			case ngGo.error.INVALID_GIB:
				this.message += "unable to parse GIB data.";
				break;
			case ngGo.error.INVALID_SGF:
				this.message += "unable to parse SGF data.";
				break;
			case ngGo.error.INVALID_JGF_JSON:
				this.message += "unable to parse JGF data.";
				break;
			case ngGo.error.INVALID_JGF_TREE_JSON:
				this.message += "unable to parse the JGF tree data.";
				break;
			default:
				this.message += "unable to parse the data.";
		}
	};

	/**
	 * Extend from error class
	 */
	InvalidDataError.prototype = new Error();
	InvalidDataError.prototype.constructor = InvalidDataError;

	//Return object
	return InvalidDataError;
}]);

/**
 * InvalidPositionError :: Error class to handle invalid moves.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Errors.InvalidPositionError.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('InvalidPositionError', ["ngGo", "StoneColor", function(ngGo, StoneColor) {

	/**
	 * Define error
	 */
	var InvalidPositionError = function(code, x, y, color) {

		//Set name and message
		this.code = code;
		this.name = 'InvalidPositionError';
	    this.message = 'Invalid position detected.';

	    //Add position data
	    if (typeof x != 'undefined' && typeof y != 'undefined' && typeof color != 'undefined') {
	    	this.message += " Trying to place a " + (color == StoneColor.W ? "white" : "black") + " stone on (" + x + ", " + y + ")";
		}

		//Append code message
		switch (code) {
			case ngGo.error.POSTITION_OUT_OF_BOUNDS:
				this.message += ", but these coordinates are not on the board.";
				break;
			case ngGo.error.POSTITION_ALREADY_HAS_STONE:
				this.message += ", but there is already a stone on those coordinates.";
				break;
			case ngGo.error.POSTITION_IS_SUICIDE:
				this.message += ", but that would be suicide.";
				break;
			case ngGo.error.POSTITION_IS_REPEATING:
				this.message += ", but this position already occured.";
				break;
			default:
				this.message += ".";
		}
	};

	/**
	 * Extend from error class
	 */
	InvalidPositionError.prototype = new Error();
	InvalidPositionError.prototype.constructor = InvalidPositionError;

	//Return object
	return InvalidPositionError;
}]);

/**
 * Game :: This class represents a game record or a game that is being played/edited. The class
 * traverses the move tree nodes and keeps track of the changes between the previous and new game
 * positions. These changes can then be fed to the board, to add or remove stones and markup.
 * The class also keeps a stack of all board positions in memory and can validate moves to make
 * sure they are not repeating or suicide.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Service', [
	'ngGo',
	'ngGo.Game.Path.Service',
	'ngGo.Game.Node.Service',
	'ngGo.Game.Position.Service',
	'ngGo.Kifu.Blank.Service',
	'ngGo.Kifu.Parser.Service',
	'ngGo.Errors.InvalidDataError.Service',
	'ngGo.Errors.InvalidPositionError.Service'
])

/**
 * Factory definition
 */
.provider('Game', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Default size of board
		defaultSize: 0,

		//Default komi and handicap
		defaultKomi: 0,
		defaultHandicap: 0,

		//Remember last selected variation when traversing nodes
		rememberPath: true,

		//Check for repeating positions? (KO / ALL / empty)
		checkRepeat: 'KO',

		//Allow suicide?
		allowSuicide: false
	};

	/**
	 * Set global default configuration for players
	 */
	this.setConfig = function(config) {
		defaultConfig = angular.extend(defaultConfig, config);
	};

	/**
	 * Service getter
	 */
	this.$get = ["ngGo", "StoneColor", "GamePath", "GameNode", "GamePosition", "KifuParser", "KifuBlank", "InvalidDataError", "InvalidPositionError", function(ngGo, StoneColor, GamePath, GameNode, GamePosition, KifuParser, KifuBlank, InvalidDataError, InvalidPositionError) {

		/***********************************************************************************************
		 * General helpers
		 ***/

		/**
		 * Validate the info we have to make sure the properties exist
		 */
		var validateInfo = function() {

			//Set board info if not set
			if (!this.info.board) {
				this.info.board = {};
			}

			//Set game info if not set
			if (!this.info.game) {
				this.info.game = {};
			}

			//Set defaults
			if (typeof this.info.board.width == 'undefined') {
				this.info.board.width = this.config.defaultSize;
			}
			if (typeof this.info.board.height == 'undefined') {
				this.info.board.height = this.config.defaultSize;
			}
			if (typeof this.info.game.komi == 'undefined') {
				this.info.game.komi = this.config.defaultKomi;
			}
			if (typeof this.info.game.handicap == 'undefined') {
				this.info.game.handicap = this.config.defaultHandicap;
			}
		};

		/***********************************************************************************************
		 * Node navigation helpers
		 ***/

		/**
		 * Navigate to the next node
		 */
		var nextNode = function(i) {

			//Check if we have children
			if (this.node.children.length === 0) {
				return false;
			}

			//Remembered the path we took earlier?
			if (i === undefined) {
				i = this.node._remembered_path;
			}

			//Determine which child node to process
			i = i || 0;
			if (i == -1) {
				i = 0;
			}

			//Validate
			if (i >= this.node.children.length || !this.node.children[i]) {
				return false;
			}

			//Advance path
			this.path.advance(i);

			//Set pointer of current node
			this.node = this.node.children[i];
			return true;
		};

		/**
		 * Navigate to the previous node
		 */
		var previousNode = function() {

			//No parent node?
			if (!this.node.parent) {
				return false;
			}

			//Retreat path
			this.path.retreat();

			//Set pointer of current node
			this.node = this.node.parent;
			return true;
		};

		/**
		 * Navigate to the first node
		 */
		var firstNode = function() {

			//Reset path
			this.path.reset();

			//Set node pointer back to root
			this.node = this.root;

			//Set the initial turn depending on handicap (can be overwritten by game record instructions)
			this.setTurn((this.info.game.handicap > 1) ? StoneColor.W : StoneColor.B);
		};

		/***********************************************************************************************
		 * Position history helpers
		 ***/

		/**
		 * Clear the position history and initialize with a blank position
		 */
		var initializeHistory = function() {

			//Already at beginning?
			if (this.history.length == 1) {
				return;
			}

			//Clear positions stack and create new blank position
			this.history = [];
			this.history.push(new GamePosition());

			//Set board size if we have the info
			if (this.info.board) {
				this.history[0].setSize(this.info.board.width, this.info.board.height);
			}
		};

		/**
		 * Add position to stack. If position isn't specified current position is
		 * cloned and stacked. Pointer of actual position is moved to the new position.
		 */
		var pushPosition = function(newPosition) {

			//Position not given?
			if (!newPosition) {
				newPosition = this.position.clone();
			}

			//Push
			this.history.push(newPosition);
			return newPosition;
		};

		/**
		 * Remove current position from stack
		 */
		var popPosition = function() {

			//Nothing left?
			if (this.history.length === 0) {
				return null;
			}

			//Get old position
			return this.history.pop();
		};

		/**
		 * Replace the current position in the stack
		 */
		var replacePosition = function(newPosition) {
			if (newPosition) {
				this.history.pop();
				this.history.push(newPosition);
			}
		};

		/***********************************************************************************************
		 * Execution helpers
		 ***/

		/**
		 * Execute the current node
		 */
		var executeNode = function() {

			//Remember last selected node if we have a parent
			if (this.node.parent) {
				this.node.parent._remembered_path = this.node.parent.children.indexOf(this.node);
			}

			//Initialize new position
			var i, newPosition = this.position.clone();

			//Handle moves
			if (this.node.move) {
				if (this.node.move.pass) {
					newPosition.setTurn(-this.node.move.color);
				}
				else {
					this.validateMove(this.node.move.x, this.node.move.y, this.node.move.color, newPosition);
				}
			}

			//Handle turn instructions
			if (this.node.turn) {
				newPosition.setTurn(this.node.turn);
			}

			//Handle setup instructions
			if (this.node.setup) {
				for (i in this.node.setup) {
					newPosition.stones.set(this.node.setup[i].x, this.node.setup[i].y, this.node.setup[i].color);
				}
			}

			//Handle markup
			if (this.node.markup) {
				for (i in this.node.markup) {
					newPosition.markup.set(this.node.markup[i].x, this.node.markup[i].y, this.node.markup[i]);
				}
			}

			//Push the new position into the history now
			pushPosition.call(this, newPosition);
		};

		/***********************************************************************************************
		 * Game class
		 ***/

		/**
		 * Constructor
		 */
		var Game = function(data, config) {

			//Extend config
			this.config = angular.extend({}, defaultConfig, config || {});

			//Define property getter/setter for position
			Object.defineProperty(this, 'position', {

				//Getter returns the last position from the stack
				get: function() {
					return this.history[this.history.length - 1];
				},

				//Setter adds a new position to the stack
				set: function(newPosition) {
					this.history[this.history.length] = newPosition;
				}
			});

			//Load data
			if (data) {
				this.load(data);
			}
			else {
				this.init();
			}
		};

		/**
		 * Initialize
		 */
		Game.prototype.init = function() {

			//Info properties
			this.info = {};

			//The rood node and pointer to the current node
			this.root = null;
			this.node = null;

			//Game path
			this.path = new GamePath();

			//JGF record we loaded from
			this.jgf = null;

			//Positions history stack
			this.history = [];
		};

		/**
		 * Load game record data
		 */
		Game.prototype.load = function(data) {

			//Initialize
			this.init();

			//Try to load game record data
			try {
				this.fromData(data);
			}
			catch (errorCode) {

				//Just initialize our history with a blank position
				initializeHistory.call(this);

				//Wrap error code in error object
				throw new InvalidDataError(errorCode);
			}

			//Go to the first move
			this.first();
		};

		/**
		 * Reload game record
		 */
		Game.prototype.reload = function() {
			if (this.jgf) {
				this.load(this.jgf);
			}
		};

		/**
		 * Check if we managed to load a valid game record
		 */
		Game.prototype.isLoaded = function() {
			return this.root !== null;
		};

		/***********************************************************************************************
		 * Game cloning and conversion
		 ***/

		/**
		 * Clone this game
		 */
		Game.prototype.clone = function() {

			//Create new kifu object and get properties
			var clone = new Game(),
				props = Object.getOwnPropertyNames(this);

			//Copy all properties
			for (var p = 0; p < props.length; p++) {
				clone[p] = angular.copy(this[p]);
			}

			//Return clone
			return clone;
		};

		/**
		 * Load from an unknown data source
		 */
		Game.prototype.fromData = function(data) {

			//No data, can't do much
			if (!data) {
				throw ngGo.error.NO_DATA;
			}

			//String given, could be stringified JGF, an SGF or GIB file
			if (typeof data == 'string') {
				var c = data.charAt(0);
				if (c == '(') {
					return this.fromSgf(data);
				}
				else if (c == '{') {
					return this.fromJgf(data);
				}
				else if (c == '\\') {
					return this.fromGib(data);
				}
				else {
					throw ngGo.error.UNKNOWN_DATA;
				}
			}

			//Object given? Probably a JGF object
			else if (typeof data == 'object') {
				this.fromJgf(data);
			}

			//Something else?
			else {
				throw ngGo.error.UNKNOWN_DATA;
			}
		};

		/**
		 * Load from GIB data
		 */
		Game.prototype.fromGib = function(gib) {

			//Use the kifu parser
			var jgf = KifuParser.gib2jgf(gib);
			if (!jgf) {
				throw ngGo.error.INVALID_GIB;
			}

			//Now load from JGF
			this.fromJgf(jgf);
		};

		/**
		 * Load from SGF data
		 */
		Game.prototype.fromSgf = function(sgf) {

			//Use the kifu parser
			var jgf = KifuParser.sgf2jgf(sgf);
			if (!jgf) {
				throw ngGo.error.INVALID_SGF;
			}

			//Now load from JGF
			this.fromJgf(jgf);
		};

		/**
		 * Load from JGF data
		 */
		Game.prototype.fromJgf = function(jgf) {

			//Parse jgf string
			if (typeof jgf == 'string') {
				try {
					jgf = angular.fromJson(jgf);
				}
				catch (error) {
					throw ngGo.error.INVALID_JGF_JSON;
				}
			}

			//Parse tree string
			if (typeof jgf.tree == 'string') {
				if (jgf.tree.charAt(0) == '[') {
					try {
						jgf.tree = angular.fromJson(jgf.tree);
					}
					catch (error) {
						throw ngGo.error.INVALID_JGF_TREE_JSON;
					}
				}
				else {
					jgf.tree = [];
				}
			}

			//Copy all properties except moves tree
			for (var i in jgf) {
				if (i != 'tree') {
					this.info[i] = angular.copy(jgf[i]);
				}
			}

			//Validate info
			validateInfo.call(this);

			//Create root node
			this.root = new GameNode();

			//Tree given? Load all the moves
			if (jgf.tree) {
				this.root.fromJgf(jgf.tree);
			}

			//Remember JGF
			this.jgf = jgf;
		};

		/**
		 * Convert to SGF
		 */
		Game.prototype.toSgf = function() {
			return KifuParser.jgf2sgf(this.toJgf());
		};

		/**
		 * Convert to JGF (optionally stringified)
		 */
		Game.prototype.toJgf = function(stringify) {

			//Initialize JGF and get properties
			var jgf = KifuBlank.jgf(),
				props = Object.getOwnPropertyNames(this);

			//Copy properties
			for (var p = 0; p < props.length; p++) {

				//Skip root
				if (p == 'root') {
					continue;
				}

				//Already present on JGF object? Extend
				if (jgf[p]) {
					jgf[p] = angular.extend(jgf[p], this[p]);
				}

				//Otherwise copy
				else {
					jgf[p] = angular.copy(this[p]);
				}
			}

			//Build tree
			jgf.tree = this.root.toJgf();

			//Return
			return stringify ? angular.toJson(jgf) : jgf;
		};

		/***********************************************************************************************
		 * Getters
		 ***/

		/**
		 * Get current node
		 */
		Game.prototype.getNode = function() {
			return this.node;
		};

		/**
		 * Get the current game position
		 */
		Game.prototype.getPosition = function() {
			return this.position;
		};

		/**
		 * Get the game path
		 */
		Game.prototype.getPath = function(clone) {
			if (clone) {
				return this.path.clone();
			}
			return this.path;
		};

		/**
		 * Clone the current game path
		 */
		Game.prototype.clonePath = function() {
			return this.path.clone();
		};

		/**
		 * Get the game path to a certain named node
		 */
		Game.prototype.getPathToNode = function(nodeName) {
			return GamePath.findNode(nodeName, this.root);
		};

		/**
		 * Get the game komi
		 */
		Game.prototype.getKomi = function() {
			if (!this.info.game.komi) {
				return 0;
			}
			return parseFloat(this.info.game.komi);
		};

		/**
		 * Set the game komi
		 */
		Game.prototype.setKomi = function(komi) {
			this.info.game.komi = komi ? parseFloat(komi) : this.config.defaultKomi;
		};

		/**
		 * Get the player turn for this position
		 */
		Game.prototype.getTurn = function() {

			//Must have a position
			if (!this.history.length) {
				return StoneColor.B;
			}

			//Get from position
			return this.position.getTurn();
		};

		/**
		 * Set the player turn for the current position
		 */
		Game.prototype.setTurn = function(color) {

			//Must have a position
			if (!this.history.length) {
				return;
			}

			//Set in position
			this.position.setTurn(color);
		};

		/**
		 * Get the total capture count up to the current position
		 */
		Game.prototype.getCaptureCount = function() {

			//Initialize
			var captures = {};
			captures[StoneColor.B] = 0;
			captures[StoneColor.W] = 0;

			//Loop all positions and increment capture count
			for (var i = 0; i < this.history.length; i++) {
				captures[StoneColor.B] += this.history[i].getCaptureCount(StoneColor.B);
				captures[StoneColor.W] += this.history[i].getCaptureCount(StoneColor.W);
			}

			//Return
			return captures;
		};

		/**
		 * Get the move variation for given coordinates
		 */
		Game.prototype.getMoveVariation = function(x, y) {
			if (this.node) {
				return this.node.getMoveVariation(x, y);
			}
			return -1;
		};

		/**
		 * Get an info property
		 */
		Game.prototype.get = function(position) {

			//Must have a position
			if (!position) {
				return;
			}

			//The item's position in the object is given by dot separated strings
			if (typeof position == 'string') {
				position = position.split('.');
			}

			//Initialize object we're getting info from
			var obj = this.info, key;

			//Loop the position
			for (var p = 0; p < position.length; p++) {

				//Get actual key
				key = position[p];

				//Last key reached? Done, get value
				if ((p + 1) == position.length) {
					return obj[key];
				}

				//Must be object container
				if (typeof obj[key] != 'object') {
					console.warn('Game property', key, 'is not an object');
					return;
				}

				//Move up in tree
				obj = obj[key];
			}
		};

		/***********************************************************************************************
		 * Checkers
		 ***/

		/**
		 * Check if coordinates are on the board
		 */
		Game.prototype.isOnBoard = function(x, y) {
			return x >= 0 && y >= 0 && x < this.info.board.width && y < this.info.board.height;
		};

		/**
		 * Check if given coordinates are one of the next child node coordinates
		 */
		Game.prototype.isMoveVariation = function(x, y) {
			if (this.node) {
				return this.node.isMoveVariation(x, y);
			}
			return false;
		};

		/**
		 * Check if a given position is repeating within this game
		 */
		Game.prototype.isRepeatingPosition = function(checkPosition, x, y) {

			//Init
			var flag, stop;

			//Check for ko only? (Last two positions)
			if (this.checkRepeat == 'KO' && (this.history.length - 2) >= 0) {
				stop = this.history.length-2;
			}

			//Check all history?
			else if (this.checkRepeat == 'ALL') {
				stop = 0;
			}

			//Not repeating
			else {
				return false;
			}

			//Loop history of positions to check
			for (var i = this.history.length-2; i >= stop; i--) {
				if (checkPosition.isSameAs(this.history[i])) {
					return true;
				}
			}

			//Not repeating
			return false;
		};

		/**
		 * Wrapper for validateMove() returning a boolean and catching any errors
		 */
		Game.prototype.isValidMove = function(x, y, color) {

			//Validate move
			try {
				this.validateMove(x, y, color);
			}
			catch (error) {
				return false;
			}

			//Valid
			return true;
		};

		/**
		 * Check if a move is valid. If valid, the new game position object is returned.
		 * You can supply a pre-created position to use, or the current position is cloned.
		 */
		Game.prototype.validateMove = function(x, y, color, newPosition) {

			//Check coordinates validity
			if (!this.isOnBoard(x, y)) {
				throw new InvalidPositionError(ngGo.error.POSTITION_OUT_OF_BOUNDS, x, y, color);
			}

			//Something already here?
			if (this.position.stones.get(x, y) != StoneColor.EMPTY) {
				throw new InvalidPositionError(ngGo.error.POSTITION_ALREADY_HAS_STONE, x, y, color);
			}

			//Set color of move to make
			color = color || this.position.getTurn();

			//Determine position to use
			newPosition = newPosition || this.position.clone();

			//Place the stone
			newPosition.stones.set(x, y, color);

			//Capture adjacent stones if possible
			var captures = newPosition.captureAdjacent(x, y);

			//No captures occurred? Check if the move we're making is a suicide move
			if (!captures) {

				//No liberties for the group we've just created?
				if (!newPosition.hasLiberties(x, y)) {

					//Capture the group if it's allowed
					if (this.allowSuicide) {
						newPosition.captureGroup(x, y);
					}

					//Invalid move
					else {
						throw new InvalidPositionError(ngGo.error.POSTITION_IS_SUICIDE, x, y, color);
					}
				}
			}

			//Check history for repeating moves
			if (this.checkRepeat && this.isRepeatingPosition(newPosition, x, y)) {
				throw new InvalidPositionError(ngGo.error.POSTITION_IS_REPEATING, x, y, color);
			}

			//Set proper turn
			newPosition.setTurn(-color);

			//Move is valid
			return newPosition;
		};

		/**
		 * Check if a stone (setup) placement is valid.
		 */
		Game.prototype.validatePlacement = function(x, y, color, position) {

			//Check coordinates validity
			if (!this.isOnBoard(x, y)) {
				throw new InvalidPositionError(ngGo.error.POSTITION_OUT_OF_BOUNDS, x, y, color);
			}

			//Place the stone
			position.stones.set(x, y, color);

			//Empty spot? Don't need to check for captures
			if (color === StoneColor.EMPTY) {
				return;
			}

			//Capture adjacent stones if possible
			var captures = position.captureAdjacent(x, y);

			//No captures occurred? Check if the move we're making is a suicide move
			if (!captures) {

				//No liberties for the group we've just created? Capture it
				if (!position.hasLiberties(x, y)) {
					position.captureGroup(x, y);
				}
			}
		};

		/***********************************************************************************************
		 * Stone and markup handling
		 ***/

		/**
		 * Add a stone
		 */
		Game.prototype.addStone = function(x, y, color) {

			//Check if there's anything to do at all
			if (this.position.stones.is(x, y, color)) {
				return;
			}

			//Create temporary position
			var tempPosition = this.position.clone();

			//Validate placement on temp position
			this.validatePlacement(x, y, color, tempPosition);

			//No setup instructions container in this node?
			if (typeof this.node.setup == 'undefined') {

				//Is this a move node?
				if (this.node.move) {

					//Clone our position
					pushPosition.call(this);

					//Create new node
					var node = new GameNode();

					//Append it to the current node and change the pointer
					var i = node.appendTo(this.node);
					this.node = node;

					//Advance path to the added node index
					this.path.advance(i);
				}

				//Create setup container in this node
				this.node.setup = [];
			}

			//Replace current position
			replacePosition.call(this, tempPosition);

			//Add setup instructions to node
			this.node.setup.push(this.position.stones.get(x, y, 'color'));
		};

		/**
		 * Add markup
		 */
		Game.prototype.addMarkup = function(x, y, markup) {

			//No markup instructions container in this node?
			if (typeof this.node.markup == 'undefined') {
				this.node.markup = [];
			}

			//Add markup to game position
			this.position.markup.set(x, y, markup);

			//Add markup instructions to node
			this.node.markup.push(this.position.markup.get(x, y, 'type'));
		};

		/**
		 * Remove a stone
		 */
		Game.prototype.removeStone = function(x, y) {

			//Check if the stone is found in setup instructions
			var foundInSetup = false;

			//Remove from node setup instruction
			if (typeof this.node.setup != 'undefined') {
				for (var i = 0; i < this.node.setup.length; i++) {
					if (x == this.node.setup[i].x && y == this.node.setup[i].y) {

						//Remove from node and unset in position
						this.node.setup.splice(i, 1);
						this.position.stones.unset(x, y);

						//Mark as found
						foundInSetup = true;
						break;
					}
				}
			}

			//Not found in setup? Add as no stone color
			if (!foundInSetup) {
				this.addStone(x, y, StoneColor.EMPTY);
			}
		};

		/**
		 * Remove markup
		 */
		Game.prototype.removeMarkup = function(x, y) {

			//Remove from node
			if (typeof this.node.markup != 'undefined') {
				for (var i = 0; i < this.node.markup.length; i++) {
					if (x == this.node.markup[i].x && y == this.node.markup[i].y) {
						this.node.markup.splice(i, 1);
						this.position.markup.unset(x, y);
						break;
					}
				}
			}
		};

		/**
		 * Check if there is a stone at the given coordinates for the current position
		 */
		Game.prototype.hasStone = function(x, y, color) {
			if (typeof color != 'undefined') {
				return this.position.stones.is(x, y, color);
			}
			return this.position.stones.has(x, y);
		};

		/**
		 * Check if there is markup at the given coordinate for the current position
		 */
		Game.prototype.hasMarkup = function(x, y, type) {
			if (typeof type != 'undefined') {
				return this.position.markup.is(x, y, type);
			}
			return this.position.markup.has(x, y);
		};

		/**
		 * Get stone on coordinates
		 */
		Game.prototype.getStone = function(x, y) {
			return this.position.stones.get(x, y);
		};

		/**
		 * Get markup on coordinates
		 */
		Game.prototype.getMarkup = function(x, y) {
			return this.position.markup.get(x, y);
		};

		/***********************************************************************************************
		 * Move handling
		 ***/

		/**
		 * Play move
		 */
		Game.prototype.play = function(x, y, color) {

			//Color defaults to current turn
			color = color || this.position.getTurn();

			//Validate move and get new position
			var newPosition = this.validateMove(x, y, color);

			//Push new position
			pushPosition.call(this, newPosition);

			//Create new move node
			var node = new GameNode({
				move: {
					x: x,
					y: y,
					color: color
				}
			});

			//Append it to the current node, remember the path, and change the pointer
			var i = node.appendTo(this.node);
			this.node._remembered_path = i;
			this.node = node;

			//Advance path to the added node index
			this.path.advance(i);

			//Valid move
			return true;
		};

		/**
		 * Play pass
		 */
		Game.prototype.pass = function(color) {

			//Color defaults to current turn
			color = color || this.position.getTurn();

			//Initialize new position and switch the turn
			var newPosition = this.position.clone();
			newPosition.setTurn(-color);

			//Push new position
			pushPosition.call(this, newPosition);

			//Create new move node
			var node = new GameNode({
				move: {
					pass: true,
					color: color
				}
			});

			//Append it to the current node, remember the path, and change the pointer
			var i = node.appendTo(this.node);
			this.node._remembered_path = i;
			this.node = node;

			//Advance path to the added node index
			this.path.advance(i);
		};

		/***********************************************************************************************
		 * Game tree navigation
		 ***/

		/**
		 * Go to the next position
		 */
		Game.prototype.next = function(i) {

			//Object (node) given as parameter? Find index
			if (typeof i == 'object') {
				i = this.node.children.indexOf(i);
			}

			//Go to the next node
			if (nextNode.call(this, i)) {

				//If an invalid move is detected, we can't go on
				try {
					executeNode.call(this);
				}
				catch (error) {
					previousNode.call(this);
					throw error;
				}
			}
		};

		/**
		 * Go to the previous position
		 */
		Game.prototype.previous = function() {

			//Go to the previous node
			if (previousNode.call(this)) {
				popPosition.call(this);
			}
		};

		/**
		 * Go to the last position
		 */
		Game.prototype.last = function() {

			//Keep going to the next node until we reach the end
			while (nextNode.call(this)) {

				//If an invalid move is detected, we can't go on
				try {
					executeNode.call(this);
				}
				catch (error) {
					previousNode.call(this);
					throw error;
				}
			}
		};

		/**
		 * Go to the first position
		 */
		Game.prototype.first = function() {

			//Go to the first node
			firstNode.call(this);

			//Create the initial position, clone it and parse the current node
			initializeHistory.call(this);
			executeNode.call(this);
		};

		/**
		 * Go to position specified by a path object, a numeric move numer, or a node name string
		 */
		Game.prototype.goto = function(target) {

			//Must have a tree
			if (this.root === null) {
				return;
			}

			//Nothing given?
			if (typeof target == 'undefined') {
				return;
			}

			//Function given? Call now
			if (typeof target == 'function') {
				target = target.call(this);
			}

			//Initialize path
			var path;

			//Simple move number? Convert to path object
			if (typeof target == 'number') {
				path = this.path.clone();
				path.setMove(target);
			}

			//String? Named node
			else if (typeof target == 'string') {

				//Already here?
				if (this.node.name == target) {
					return;
				}

				//Find path to node
				path = this.getPathToNode(target);
				if (path === null) {
					return;
				}
			}

			//Otherwise assume path object
			else {
				path = target;
			}

			//Already here?
			if (this.path.compare(path)) {
				return;
			}

			//Go to the first node
			firstNode.call(this);

			//Create the initial position, clone it and parse the current node
			initializeHistory.call(this);
			pushPosition.call(this);
			executeNode.call(this);

			//Loop path
			var n = path.getMove();
			for (var i = 0; i < n; i++) {

				//Try going to the next node
				if (!nextNode.call(this, path.nodeAt(i))) {
					break;
				}

				//If an invalid move is detected, we can't go on
				try {
					executeNode.call(this);
				}
				catch (error) {
					previousNode.call(this);
					throw error;
				}
			}
		};

		/**
		 * Go to the last fork
		 */
		Game.prototype.lastFork = function() {

			//Loop until we find a node with more than one child
			while (execPrevious.call(this) && this.node.children.length == 1) {}
		};

		/***********************************************************************************************
		 * State handling
		 ***/

		/**
		 * Get the board state
		 */
		Game.prototype.getState = function() {

			//Can only create when we have a JGF and path
			if (!this.jgf || !this.path) {
				return null;
			}

			//Create state
			var state = {
				jgf: this.jgf,
				path: this.path.clone()
			};

			//Return
			return state;
		};

		/**
		 * Restore the game state
		 */
		Game.prototype.restoreState = function(state) {

			//Must have jgf and path
			if (!state || !state.jgf || !state.path) {
				return;
			}

			//Restore state
			this.load(state.jgf);
			this.goto(state.path);
		};

		//Return object
		return Game;
	}];
});

/**
 * GameNode :: This class represents a single node in the game moves tree. It contains properties like
 * the x and y grid coordinates, the move played, board setup instructions, markup, player turn and
 * comments. The moves tree in the game record is represented by a string of GameNodes, each with pointers
 * to their parent and children. Each node can have multiple children (move variations), but only
 * one parent.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Node.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('GameNode', ["StoneColor", function(StoneColor) {

	/**
	 * Character index of "a"
	 */
	var aChar = 'a'.charCodeAt(0);

	/**
	 * Helper to convert SGF coordinates
	 */
	var convertCoordinates = function(coords) {
		return [coords.charCodeAt(0)-aChar, coords.charCodeAt(1)-aChar];
	};

	/**
	 * Helper to construct a coordinates base object
	 */
	var coordinatesObject = function(coords, baseObject) {
		baseObject = baseObject || {};
		if (coords === '' || coords == 'pass') {
			baseObject.pass = true;
		}
		else {

			//Backwards compatibility with SGF string coordinates in JGF
			if (typeof coords == 'string') {
				coords = convertCoordinates(coords);
			}

			//Append coordinates
			baseObject.x = coords[0] * 1;
			baseObject.y = coords[1] * 1;
		}
		return baseObject;
	};

	/**
	 * Convert a numeric color value (color constant) to a string
	 */
	var toStringColor = function(color) {
		return (color == StoneColor.B) ? 'B' : (((color == StoneColor.W) ? 'W' : ''));
	};

	/**
	 * Convert a string color value to a numeric color constant
	 */
	var toColorConstant = function(color) {
		if (color == 'B') {
			return StoneColor.B;
		}
		else if (color == 'W') {
			return StoneColor.W;
		}
		return StoneColor.E;
	};

	/***********************************************************************************************
	 * Helpers for conversion between JGF / KIFU format
	 ***/

	/**
	 * Convert move object to JGF format
	 */
	var convertMoveToJgf = function(move) {

		//Initialize JGF move object and determine color
		var jgfMove = angular.copy(move),
			color = toStringColor(move.color);

		//No color?
		if (color === '') {
			return null;
		}

		//Pass move?
		if (move.pass === true) {
			jgfMove[color] = 'pass';
		}

		//Regular move
		else {
			jgfMove[color] = [move.x, move.y];
		}

		//Delete coordinates and color
		delete jgfMove.x;
		delete jgfMove.y;
		delete jgfMove.color;

		//Return move
		return jgfMove;
	};

	/**
	 * Convert move from JGF format
	 */
	var convertMoveFromJgf = function(move) {

		//Prepare color, coordinates
		var i, color, coords,
			colors = ['W', 'B'];

		//Check whose move it was
		if (move.W) {
			color = 'W';
			coords = move.W;
		}
		else if (move.B) {
			color = 'B';
			coords = move.B;
		}

		//No coordinates?
		if (!coords) {
			return null;
		}

		//Return coordinates object
		return coordinatesObject(coords, {
			color: toColorConstant(color)
		});
	};

	/**
	 * Convert setup object to JGF format
	 */
	var convertSetupToJgf = function(setup) {

		//Initialize variables
		var i, color, jgfSetup = {};

		//Loop setup objects
		for (i in setup) {

			//Get color
			color = toStringColor(setup[i].color) || 'E';

			//Initialize array
			if (typeof jgfSetup[color] == 'undefined') {
				jgfSetup[color] = [];
			}

			//Add coordinates
			jgfSetup[color].push([setup[i].x, setup[i].y]);
		}

		//Return
		return jgfSetup;
	};

	/**
	 * Convert setup from JGF format
	 */
	var convertSetupFromJgf = function(setup) {

		//Initialize variables
		var c, key, color, gameSetup = [];

		//Loop setup
		for (key in setup) {

			//Get color constant
			color = toColorConstant(key);

			//Loop coordinates
			for (c in setup[key]) {
				gameSetup.push(coordinatesObject(setup[key][c], {
					color: color
				}));
			}
		}

		//Return
		return gameSetup;
	};

	/**
	 * Convert markup object to JGF format
	 */
	var convertMarkupToJgf = function(markup) {

		//Initialize variables
		var i, type, jgfMarkup = {};

		//Loop setup objects
		for (i in markup) {

			//Get type
			type = markup[i].type;

			//Initialize array
			if (typeof jgfMarkup[type] == 'undefined') {
				jgfMarkup[type] = [];
			}

			//Label?
			if (type == 'LB') {
				jgfMarkup[type].push([markup[i].x, markup[i].y, markup[i].text]);
			}
			else {
				jgfMarkup[type].push([markup[i].x, markup[i].y]);
			}
		}

		//Return
		return jgfMarkup;
	};

	/**
	 * Convert markup from JGF format
	 */
	var convertMarkupFromJgf = function(markup) {

		//Initialize variables
		var l, type, gameMarkup = [];

		//Loop markup types
		for (type in markup) {

			//Label?
			if (type == 'label') {
				for (l = 0; l < markup[type].length; l++) {

					//Validate
					if (!angular.isArray(markup[type][l])) {
						continue;
					}

					//SGF type coordinates?
					if (markup[type][l].length == 2 && typeof markup[type][l][0] == 'string') {
						var text = markup[type][l][1];
						markup[type][l] = convertCoordinates(markup[type][l][0]);
						markup[type][l].push(text);
					}

					//Validate length
					if (markup[type][l].length < 3) {
						continue;
					}

					//Add to stack
					gameMarkup.push(coordinatesObject(markup[type][l], {
						type: type,
						text: markup[type][l][2]
					}));
				}
			}
			else {

				//Loop coordinates
				for (l in markup[type]) {
					gameMarkup.push(coordinatesObject(markup[type][l], {
						type: type
					}));
				}
			}
		}

		//Return
		return gameMarkup;
	};

	/**
	 * Convert turn object to JGF format
	 */
	var convertTurnToJgf = function(turn) {
		switch (turn) {
			case StoneColor.W:
				return 'W';
			case StoneColor.B:
				return 'B';
			default:
				return '';
		}
	};

	/**
	 * Convert turn from JGF format
	 */
	var convertTurnFromJgf = function(turn) {
		switch (turn) {
			case 'W':
				return StoneColor.W;
			case 'B':
				return StoneColor.B;
			default:
				return StoneColor.EMPTY;
		}
	};

	/**
	 * Conversions map
	 */
	var conversionMap = {
		toJgf: {
			'move':		convertMoveToJgf,
			'setup':	convertSetupToJgf,
			'markup':	convertMarkupToJgf,
			'turn':		convertTurnToJgf
		},
		fromJgf: {
			'move':		convertMoveFromJgf,
			'setup':	convertSetupFromJgf,
			'markup':	convertMarkupFromJgf,
			'turn':		convertTurnFromJgf
		}
	};

	/**
	 * Constructor
	 */
	var GameNode = function(properties, parent) {

		//Set parent and children
		this.parent = parent || null;
		this.children = [];

		//Save properties
		if (properties) {
			for (var key in properties) {
				this[key] = properties[key];
			}
		}
	};

	/**
	 * Get node's child specified by index or null if doesn't exist
	 */
	GameNode.prototype.getChild = function(i) {
		i = i || 0;
		if (this.children[i]) {
			return this.children[i];
		}
		return null;
	};

	/**
	 * Get all the children
	 */
	GameNode.prototype.getChildren = function() {
		return this.children;
	};

	/**
	 * Check if the node has any chilren
	 */
	GameNode.prototype.hasChildren = function() {
		return (this.children.length > 0);
	};

	/**
	 * Check if the node has more than one move variation
	 */
	GameNode.prototype.hasMoveVariations = function() {

		//Less than two child nodes?
		if (this.children.length <= 1) {
			return false;
		}

		//Loop children
		var moveVariations = 0;
		for (var i = 0; i < this.children.length; i++) {

			//Is this a move node?
			if (this.children[i].move) {
				moveVariations++;
			}

			//More than one move node present?
			if (moveVariations > 1) {
				return true;
			}
		}

		//No move variations
		return false;
	};

	/**
	 * Get all the move variation nodes
	 */
	GameNode.prototype.getMoveVariations = function() {

		//No child nodes?
		if (this.children.length === 0) {
			return false;
		}

		//Initialize
		var moveVariations = [];

		//Loop child nodes
		for (var i = 0; i < this.children.length; i++) {

			//Is this a move node?
			if (this.children[i].move) {
				moveVariations.push(this.children[i]);
			}
		}

		//Return
		return moveVariations;
	};

	/**
	 * Get the move variation for given coordinates
	 */
	GameNode.prototype.getMoveVariation = function(x, y) {

		//Loop the child nodes
		for (var i in this.children) {
			if (this.children[i].move && this.children[i].move.x == x && this.children[i].move.y == y) {
				return i;
			}
		}

		//Not found
		return -1;
	};

	/**
	 * Check if given coordinates are one of the next child node coordinates
	 */
	GameNode.prototype.isMoveVariation = function(x, y) {

		//Loop the child nodes
		for (var i in this.children) {
			if (this.children[i].move && this.children[i].move.x == x && this.children[i].move.y == y) {
				return true;
			}
		}

		//Not found
		return false;
	};

	/***********************************************************************************************
	 * Node manipulation
	 ***/

	/**
	 * Remove this node from its parent
	 */
	GameNode.prototype.remove = function() {

		//Can't remove if no parent
		if (!this.parent) {
			return;
		}

		//Find the index of this node, and if found remove it
		var i = this.parent.children.indexOf(this);
		if (i !== -1) {
			this.parent.children.splice(i, 1);
		}

		//Clear parent reference
		this.parent = null;
	};

	/**
	 * Move the node up in the parent's child tree
	 */
	GameNode.prototype.moveUp = function() {

		//Can't move if no parent
		if (!this.parent) {
			return;
		}

		//Find the index of this node, and if found swap the nodes from position
		var i = this.parent.children.indexOf(this);
		if (i > 0) {
			var temp = this.parent.children[i - 1];
			this.parent.children[i - 1] = this;
			this.parent.children[i] = temp;
		}
	};

	/**
	 * Move the node down in the parent's child tree
	 */
	GameNode.prototype.moveDown = function() {

		//Can't move if no parent
		if (!this.parent) {
			return;
		}

		//Find the index of this node, and if found swap the nodes from position
		var i = this.parent.children.indexOf(this);
		if (i !== -1 && i < (this.parent.children.length - 1)) {
			var temp = this.parent.children[i + 1];
			this.parent.children[i + 1] = this;
			this.parent.children[i] = temp;
		}
	};

	/**
	 * Append this node to another node
	 */
	GameNode.prototype.appendTo = function(node) {

		//Remove from existing parent
		this.remove();

		//Set new parent
		this.parent = node;
		node.children.push(this);
		return node.children.length - 1;
	};

	/**
	 * Append child node to this node.
	 */
	GameNode.prototype.appendChild = function(node) {
		node.parent = this;
		this.children.push(node);
		return this.children.length - 1;
	};

	/**
	 * Insert another node after this one
	 */
	GameNode.prototype.insertNode = function(node) {

		//Loop our children and change parent node
		for (var i in this.children) {
			this.children[i].parent = node;
		}

		//Merge children, set this node as the parent of given node
		node.children = node.children.concat(this.children);
		node.parent = this;

		//Set given node as the child of this node
		this.children = [node];
	};

	/***********************************************************************************************
	 * JGF conversion
	 ***/

	/**
	 * Build a Game Node from a given JGF tree
	 */
	GameNode.prototype.fromJgf = function(jgf, gameNode) {

		//Root JGF file given?
		if (typeof jgf.tree !== 'undefined') {
			return GameNode.fromJgf(jgf.tree, gameNode);
		}

		//Initialize helper vars
		var variationNode, nextNode, i, j;

		//Node to work with given? Otherwise, work with ourselves
		gameNode = gameNode || this;

		//Loop moves in the JGF tree
		for (i = 0; i < jgf.length; i++) {

			//Array? That means a variation branch
			if (angular.isArray(jgf[i])) {

				//Loop variation stacks
				for (j = 0; j < jgf[i].length; j++) {

					//Build the variation node
					variationNode = new GameNode();
					variationNode.fromJgf(jgf[i][j]);

					//Append to working node
					gameNode.appendChild(variationNode);
				}
			}

			//Regular node
			else {

				//Get properties to copy
				var properties = Object.getOwnPropertyNames(jgf[i]);

				//Copy node properties
				for (var key in properties) {
					var prop = properties[key];

					//Conversion function present?
					if (typeof conversionMap.fromJgf[prop] != 'undefined') {
						gameNode[prop] = conversionMap.fromJgf[prop](jgf[i][prop]);
					}
					else if (typeof jgf[i][prop] == 'object') {
						gameNode[prop] = angular.copy(jgf[i][prop]);
					}
					else {
						gameNode[prop] = jgf[i][prop];
					}
				}
			}

			//Next element is a regular node? Prepare new working node
			//Otherwise, if there are no more nodes or if the next element is
			//an array (e.g. variations), we keep our working node as the current one
			if ((i + 1) < jgf.length && !angular.isArray(jgf[i+1])) {
				nextNode = new GameNode();
				gameNode.appendChild(nextNode);
				gameNode = nextNode;
			}
		}
	};

	/**
	 * Convert this node to a JGF node container
	 */
	GameNode.prototype.toJgf = function(container) {

		//Initialize container to add nodes to
		container = container || [];

		//Initialize node and get properties
		var node = {},
			properties = Object.getOwnPropertyNames(this);

		//Copy node properties
		for (var key in properties) {
			var prop = properties[key];

			//Skip some properties
			if (prop == 'parent' || prop == 'children') {
				continue;
			}

			//Conversion function present?
			if (typeof conversionMap.toJgf[prop] != 'undefined') {
				node[prop] = conversionMap.toJgf[prop](this[prop]);
			}
			else if (typeof this[prop] == 'object') {
				node[prop] = angular.copy(this[prop]);
			}
			else {
				node[prop] = this[prop];
			}
		}

		//Add node to container
		container.push(node);

		//Variations present?
		if (this.children.length > 1) {

			//Create variations container
			var variationsContainer = [];
			container.push(variationsContainer);

			//Loop child (variation) nodes
			for (var i in this.children) {

				//Create container for this variation
				var variationContainer = [];
				variationsContainer.push(variationContainer);

				//Call child node converter
				this.children[i].toJgf(variationContainer);
			}
		}

		//Just one child?
		else if (this.children.length == 1) {
			this.children[0].toJgf(container);
		}

		//Return container
		return container;
	};

	//Return object
	return GameNode;
}]);

/**
 * GamePath :: A simple class that keeps track of a path taken in a game.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Path.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('GamePath', function() {

	/**
	 * Constructor
	 */
	var GamePath = function() {
		this.reset();
	};

	/**
	 * Reset
	 */
	GamePath.prototype.reset = function() {
		this.move = 0;
		this.path = {};
		this.branches = 0;
		return this;
	};

	/**
	 * Advance a move
	 */
	GamePath.prototype.advance = function(i) {

		//Different child variation chosen? Remember
		if (i > 0) {
			this.path[this.move] = 1;
			this.branches++;
		}

		//Increment move
		this.move++;
		return this;
	};

	/**
	 * Retreat a move
	 */
	GamePath.prototype.retreat = function() {

		//At start?
		if (this.move === 0) {
			return;
		}

		//Delete path choice
		if (this.path[this.move]) {
			delete this.path[this.move];
			this.branches--;
		}

		//Decrement move
		this.move--;
		return this;
	};

	/**
	 * Go to a specific move number
	 */
	GamePath.prototype.setMove = function(no) {

		//Less than our current move? We need to erase any paths above the move number
		if (no < this.move) {
			for (var i in this.path) {
				if (i > no) {
					delete this.path[i];
					this.branches--;
				}
			}
		}

		//Set move number
		this.move = no;
		return this;
	};

	/**
	 * Get the move number
	 */
	GamePath.prototype.getMove = function() {
		return this.move;
	};

	/**
	 * Get the node choice at a specific move number
	 */
	GamePath.prototype.nodeAt = function(no) {
		return (typeof this.path[no] == 'undefined') ? 0 : this.path[no];
	};

	/**
	 * Compare to another path
	 */
	GamePath.prototype.compare = function(otherPath) {

		//Invalid object?
		if (!otherPath || typeof otherPath != 'object' || typeof otherPath.move == 'undefined') {
			return;
		}

		//Different move number or path length?
		if (this.move !== otherPath.move || this.branches != otherPath.branches) {
			return false;
		}

		//Check path
		for (var i in this.path) {
			if (typeof otherPath.path[i] == 'undefined' || this.path[i] != otherPath.path[i]) {
				return false;
			}
		}

		//Same path!
		return true;
	};

	/**
	 * Clone
	 */
	GamePath.prototype.clone = function() {

		//Create new instance
		var newPath = new GamePath();

		//Set vars
		newPath.move = this.move;
		newPath.branches = this.branches;
		newPath.path = angular.copy(this.path);

		//Return
		return newPath;
	};

	/**
	 * Helper to find node name recursively
	 */
	var findNodeName = function(node, nodeName, path) {

		//Found in this node?
		if (node.name && node.name == nodeName) {
			return true;
		}

		//Loop children
		for (var i = 0; i < node.children.length; i++) {

			//Advance path
			path.advance(i);

			//Found in child node?
			if (findNodeName(node.children[i], nodeName, path)) {
				return true;
			}

			//Not found in this child node, retreat path
			path.retreat();
		}

		//Not found
		return false;
	};

	/**
	 * Static helper to create a path object to reach a certain node
	 */
	GamePath.findNode = function(nodeName, rootNode) {

		//Create new instance
		var path = new GamePath();

		//Find the node name
		if (findNodeName(rootNode, nodeName, path)) {
			return path;
		}

		//Not found
		return null;
	};

	//Return
	return GamePath;
});

/**
 * GamePosition :: This class represents a single game position. It keeps track of the stones and markup
 * on the board in this position, as well as any captures that were made and which player's turn it is.
 * The class is also equipped with helpers to check for liberties, capture stones, and compare changes
 * to other positions.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Position.Service', [
	'ngGo',
	'ngGo.Board.Grid.Service'
])

/**
 * Factory definition
 */
.factory('GamePosition', ["StoneColor", "BoardGrid", function(StoneColor, BoardGrid) {

	/**
	 * Constructor
	 */
	var GamePosition = function(width, height) {

		//Initialize
		this.error = 0;
		this.width = 0;
		this.height = 0;
		this.stones = new BoardGrid();
		this.markup = new BoardGrid();
		this.turn = StoneColor.B;

		//Initialize captures
		this.captures = {};
		this.captures[StoneColor.B] = [];
		this.captures[StoneColor.W] = [];

		//Set empty value for stones grid
		this.stones.whenEmpty(StoneColor.EMPTY);

		//Set size
		if (width || height) {
			this.setSize(width, height);
		}
	};

	/**
	 * Set the grid size
	 */
	GamePosition.prototype.setSize = function(width, height) {

		//Check what's given
		width = width || height || 0;
		height = height || width || 0;

		//Set
		this.width = parseInt(width);
		this.height = parseInt(height);

		//Set in grids
		this.stones.setSize(width, height);
		this.markup.setSize(width, height);

		//Empty the position
		this.empty();
	};

	/**
	 * Clear the whole position
	 */
	GamePosition.prototype.empty = function() {
		this.stones.empty();
		this.markup.empty();
	};

	/**
	 * Sets stone color at given coordinates.
	 */
	GamePosition.prototype.setStone = function(x, y, color) {
		this.stones.set(x, y, color);
	};

	/**
	 * Sets markup type at given coordinates.
	 */
	GamePosition.prototype.setMarkup = function(x, y, markup) {
		this.markup.set(x, y, markup);
	};

	/***********************************************************************************************
	 * Liberties and capturing
	 ***/

	/**
	 * Check if a group of given color has liberties, starting at the given coordinates
	 */
	GamePosition.prototype.hasLiberties = function(x, y, groupColor, tested) {

		//Out of bounds? No liberties outside of the board
		if (!this.stones.isOnGrid(x, y)) {
			return false;
		}

		//Initialize tested grid if needed
		tested = tested || new BoardGrid(this.width, this.height);

		//See what color is present on the coordinates
		var color = this.stones.get(x, y);

		//If no group color was given, use what's on the position
		groupColor = groupColor || color;

		//Already tested, or enemy stone? Not giving any liberties
		if (tested.get(x, y) === true || color === -groupColor) {
			return false;
		}

		//Empty? That's a liberty
		if (color === StoneColor.EMPTY) {
			return true;
		}

		//Mark this position as tested now
		tested.set(x, y, true);

		//Ok, so we're looking at a stone of our own color. Test adjacent positions.
		//If we get at least one true, we have a liberty
		return 	this.hasLiberties(x, y-1, groupColor, tested) ||
				this.hasLiberties(x, y+1, groupColor, tested) ||
				this.hasLiberties(x-1, y, groupColor, tested) ||
				this.hasLiberties(x+1, y, groupColor, tested);
	};

	/**
	 * Helper to capture adjacent groups
	 */
	GamePosition.prototype.captureAdjacent = function(x, y, friendlyColor) {

		//Validate boundaries
		if (!this.stones.isOnGrid(x, y)) {
			return false;
		}

		//Use color of stone present if none given
		friendlyColor = friendlyColor || this.stones.get(x, y);

		//Can't capture empty spots
		if (friendlyColor == StoneColor.EMPTY) {
			return false;
		}

		//Flag to see if we captured stuff
		var captured = false;

		//Check adjacent positions now, capturing stones in the process if possible
		if (this.canCapture(x, y-1, -friendlyColor, true)) {
			captured = true;
		}
		if (this.canCapture(x, y+1, -friendlyColor, true)) {
			captured = true;
		}
		if (this.canCapture(x-1, y, -friendlyColor, true)) {
			captured = true;
		}
		if (this.canCapture(x+1, y, -friendlyColor, true)) {
			captured = true;
		}

		//Return
		return captured;
	};

	/**
	 * Helper if we can capture a certain group
	 */
	GamePosition.prototype.canCapture = function(x, y, enemyColor, doCapture) {

		//Out of bounds? Nothing to capture
		if (!this.stones.isOnGrid(x, y)) {
			return false;
		}

		//Empty spot? Can't capture
		if (this.stones.get(x, y) == StoneColor.EMPTY) {
			return false;
		}

		//Use color of stone present if none given
		enemyColor = enemyColor || this.stones.get(x, y);

		//We need to have a stone of matching group color in order to be able to capture it
		if (this.stones.get(x, y) !== enemyColor) {
			return false;
		}

		//There is a capturable stone, let's see if it has any liberties left
		if (this.hasLiberties(x, y, enemyColor)) {
			return false;
		}

		//No liberties left, the group is capturable. Capture if we want to
		if (doCapture) {
			this.captureGroup(x, y, enemyColor);
		}

		//Capturable
		return true;
	};

	/**
	 * Capture a group of certain color, starting at the given coordinates
	 */
	GamePosition.prototype.captureGroup = function(x, y, enemyColor) {

		//Validate boundaries
		if (!this.stones.isOnGrid(x, y)) {
			return false;
		}

		//If no group color was given, use what's on the position
		enemyColor = enemyColor || this.stones.get(x, y);

		//Stone at position does not match the given group color? Can't capture it
		if (this.stones.get(x, y) !== enemyColor) {
			return false;
		}

		//Capture the stone
		this.captureStone(x, y);

		//Capture the rest of the group
		this.captureGroup(x, y-1, enemyColor);
		this.captureGroup(x, y+1, enemyColor);
		this.captureGroup(x-1, y, enemyColor);
		this.captureGroup(x+1, y, enemyColor);

		//At least one stone was captured
		return true;
	};

	/**
	 * Capture a stone at given coordinates
	 */
	GamePosition.prototype.captureStone = function(x, y) {

		//Validate boundaries
		if (!this.stones.isOnGrid(x, y)) {
			return;
		}

		//Get color
		var color = this.stones.get(x, y);

		//Empty?
		if (color === StoneColor.EMPTY) {
			return;
		}

		//Ok, stone present, capture it
		this.stones.set(x, y, StoneColor.EMPTY);
		this.captures[color].push({x:x, y:y});
	};

	/**
	 * Set captures for a color (expects array with capture object coordinates)
	 */
	GamePosition.prototype.setCaptures = function(color, captures) {
		this.captures[color] = captures;
	};

	/**
	 * Get captures for a color
	 */
	GamePosition.prototype.getCaptures = function(color) {
		return this.captures[color] || [];
	};

	/**
	 * Get the capture count for a color (= the number of captures of the opposing color)
	 */
	GamePosition.prototype.getCaptureCount = function(color) {
		return this.captures[-color].length;
	};

	/***********************************************************************************************
	 * Turn control
	 ***/

	/**
	 * Set color for whose move it is at this position
	 */
	GamePosition.prototype.setTurn = function(color) {
		this.turn = color;
	};

	/**
	 * Get color for whose move it is at this position
	 */
	GamePosition.prototype.getTurn = function() {
		return this.turn;
	};

	/**
	 * Switch the player turn on this position
	 */
	GamePosition.prototype.switchTurn = function() {
		this.turn = -this.turn;
	};

	/***********************************************************************************************
	 * Cloning and comparison
	 ***/

	/**
	 * Clones the whole position except turn and captures
	 *
	 * @return	object	Copy of this position
	 */
	GamePosition.prototype.clone = function() {

		//Create a new position
		var newPosition = new GamePosition();

		//Set vars manually for maximum efficiency
		newPosition.turn = this.turn;
		newPosition.width = this.width;
		newPosition.height = this.height;
		newPosition.stones = this.stones.clone();
		newPosition.markup = new BoardGrid(this.width, this.height);

		//Return
		return newPosition;
	};

	/**
	 * Checks if a given position is the same as the current position
	 */
	GamePosition.prototype.isSameAs = function(newPosition) {

		//Must have the same size
		if (this.width != newPosition.width || this.height != newPosition.height) {
			return false;
		}

		//Compare the grids
		return this.stones.isSameAs(newPosition.stones);
	};

	//Return
	return GamePosition;
}]);

/**
 * GameScore :: A simple class that contains a game score
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Score.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('GameScore', ["StoneColor", function(StoneColor) {

	/**
	 * Helper to calculate the total points
	 */
	var calcTotal = function() {
		return parseInt(this.stones) + parseInt(this.territory) + parseInt(this.captures) + parseInt(this.komi);
	};

	/**
	 * Constructor
	 */
	var GameScore = function() {

		//Get self
		var self = this;

		//Setup score containers
		this.black = {};
		this.white = {};

		//Initialize
		this.reset();

		//Add total handlers
		this.black.total = function() {
			return calcTotal.call(self.black);
		};
		this.white.total = function() {
			return calcTotal.call(self.white);
		};
	};

	/**
	 * Reset the game score
	 */
	GameScore.prototype.reset = function() {

		//Get properties to loop
		var props = ['stones', 'territory', 'captures', 'komi'];

		//Score for black player
		for (var i in props) {
			this.black[props[i]] = 0;
			this.white[props[i]] = 0;
		}
	};

	/**
	 * Get the winner
	 */
	GameScore.prototype.winner = function() {

		//Get totals
		var b = this.black.total(),
			w = this.white.total();

		//Determine winner
		if (w > b) {
			return StoneColor.W;
		}
		else if (b > w) {
			return StoneColor.B;
		}
		return StoneColor.E;
	};

	//Return
	return GameScore;
}]);

/**
 * this.gameScorer :: This class is used to determine the score of a certain game position. It also provides
 * handling of manual adjustment of dead/living groups.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Scorer.Service', [
	'ngGo',
	'ngGo.Game.Score.Service',
	'ngGo.Board.Grid.Service'
])

/**
 * Factory definition
 */
.factory('GameScorer', ["GameScore", "StoneColor", "BoardGrid", function(GameScore, StoneColor, BoardGrid) {

	/**
	 * Possible score states
	 */
	var scoreState = {
		UNKNOWN: StoneColor.EMPTY,
		BLACK_STONE: StoneColor.B,
		WHITE_STONE: StoneColor.W,
		BLACK_CANDIDATE: StoneColor.B * 2,
		WHITE_CANDIDATE: StoneColor.W * 2,
		NEUTRAL: StoneColor.B * 3
	};

	/**
	 * Helper to set territory
	 */
	var territorySet = function(x, y, candidateColor, boundaryColor) {

		//Get color at given position
		var posColor = this.stones.get(x, y),
			origColor = this.game.position.stones.get(x, y);

		//If border reached, or a position which is already this color, or boundary color, can't set
		if (!this.stones.isOnGrid(x, y) || posColor == candidateColor || posColor == boundaryColor) {
			return;
		}

		//Don't turn stones which are already this color into candidates, instead
		//reset their color to what they were
		if (origColor * 2 == candidateColor) {
			this.stones.set(x, y, origColor);
		}

		//Otherwise, mark as candidate
		else {
			this.stones.set(x, y, candidateColor);
		}

		//Set adjacent squares
		territorySet.call(this, x-1, y, candidateColor, boundaryColor);
		territorySet.call(this, x, y-1, candidateColor, boundaryColor);
		territorySet.call(this, x+1, y, candidateColor, boundaryColor);
		territorySet.call(this, x, y+1, candidateColor, boundaryColor);
	};

	/**
	 * Helper to reset territory
	 */
	var territoryReset = function(x, y) {

		//Get original color from this position
		var origColor = this.game.position.stones.get(x, y);

		//Not on grid, or already this color?
		if (!this.stones.isOnGrid(x, y) || this.stones.get(x, y) == origColor) {
			return;
		}

		//Reset the color
		this.stones.set(x, y, origColor);

		//Set adjacent squares
		territoryReset.call(this, x-1, y);
		territoryReset.call(this, x, y-1);
		territoryReset.call(this, x+1, y);
		territoryReset.call(this, x, y+1);
	};

	/**
	 * Helper to determine score state
	 */
	var determineScoreState = function() {

		//Initialize vars
		var change = true, curState, newState, adjacent, b, w, a, x, y;

		//Loop while there is change
		while (change) {

			//Set to false
			change = false;

			//Go through the whole position
			for (x = 0; x < this.stones.width; x++) {
				for (y = 0; y < this.stones.height; y++) {

					//Get current state at position
					curState = this.stones.get(x, y);

					//Unknown or candiates?
					if (curState == scoreState.UNKNOWN || curState == scoreState.BLACK_CANDIDATE || curState == scoreState.WHITE_CANDIDATE) {

						//Get state in adjacent positions
						adjacent = [
							this.stones.get(x-1, y),
							this.stones.get(x, y-1),
							this.stones.get(x+1, y),
							this.stones.get(x, y+1)
						];

						//Reset
						b = w = false;

						//Loop adjacent squares
						for (a = 0; a < 4; a++) {
							if (adjacent[a] == scoreState.BLACK_STONE || adjacent[a] == scoreState.BLACK_CANDIDATE) {
								b = true;
							}
							else if (adjacent[a] == scoreState.WHITE_STONE || adjacent[a] == scoreState.WHITE_CANDIDATE) {
								w = true;
							}
							else if (adjacent[a] == scoreState.NEUTRAL) {
								b = w = true;
							}
						}

						//Determine new state
						if (b && w) {
							newState = scoreState.NEUTRAL;
						}
						else if (b) {
							newState = scoreState.BLACK_CANDIDATE;
						}
						else if (w) {
							newState = scoreState.WHITE_CANDIDATE;
						}
						else {
							newState = false;
						}

						//Change?
						if (newState !== false && newState != curState) {
							change = true;
							this.stones.set(x, y, newState);
						}
					}
				}
			}
		}
	};

	/**
	 * this.game scorer class
	 */
	var GameScorer = {

		//Game to score
		game: null,

		//Score
		score: null,

		//Stones, captures and points grids
		stones: null,
		captures: null,
		points: null,

		/**
		 * Load a game to score
		 */
		load: function(game) {

			//Reset score
			this.score = new GameScore();

			//Remember
			this.game = game;

			//Clone position to work with
			this.stones	= this.game.position.stones.clone();

			//Create grids
			this.captures = new BoardGrid(this.stones.width, this.stones.height, this.stones.emptyValue);
			this.points = new BoardGrid(this.stones.width, this.stones.height, this.stones.emptyValue);
		},

		/**
		 * Get the calculated score
		 */
		getScore: function() {
			return this.score;
		},

		/**
		 * Get the points grid
		 */
		getPoints: function() {
			return this.points;
		},

		/**
		 * Get the captures grid
		 */
		getCaptures: function() {
			return this.captures;
		},

		/**
		 * Run score calculation routine
		 */
		calculate: function() {

			//No game?
			if (!this.game) {
				console.warn("No game loaded in game scorer, can't calutlate score.");
				return;
			}

			//Empty grids
			this.points.empty();
			this.captures.empty();

			//Determine score state
			determineScoreState.call(this);

			//Get komi and captures
			var komi = this.game.get('game.komi'),
				captures = this.game.getCaptureCount();

			//Reset score
			this.score.reset();

			//Set captures and komi
			this.score.black.captures = captures[StoneColor.B];
			this.score.white.captures = captures[StoneColor.W];
			this.score.black.komi = komi < 0 ? komi : 0;
			this.score.white.komi = komi > 0 ? komi : 0;

			//Init helper vars
			var x, y, state, color;

			//Loop position
			for (x = 0; x < this.stones.width; x++) {
				for (y = 0; y < this.stones.height; y++) {

					//Get state and color on original position
					state = this.stones.get(x, y);
					color = this.game.position.stones.get(x, y);

					//Black stone
					if (state == scoreState.BLACK_STONE && color == StoneColor.B) {
						this.score.black.stones++;
						continue;
					}

					//White stone
					if (state == scoreState.WHITE_STONE && color == StoneColor.W) {
						this.score.white.stones++;
						continue;
					}

					//Black candidate
					if (state == scoreState.BLACK_CANDIDATE) {
						this.score.black.territory++;
						this.points.set(x, y, StoneColor.B);

						//White stone underneath?
						if (color == StoneColor.W) {
							this.score.black.captures++;
							this.captures.set(x, y, StoneColor.W);
						}
						continue;
					}

					//White candidate
					if (state == scoreState.WHITE_CANDIDATE) {
						this.score.white.territory++;
						this.points.set(x, y, StoneColor.W);

						//Black stone underneath?
						if (color == StoneColor.B) {
							this.score.white.captures++;
							this.captures.set(x, y, StoneColor.B);
						}
						continue;
					}
				}
			}
		},

		/**
		 * Mark stones dead or alive
		 */
		mark: function(x, y) {

			//Get color of original position and state of the count position
			var color = this.game.position.stones.get(x, y),
				state = this.stones.get(x, y);

			//White stone
			if (color == StoneColor.W) {

				//Was white, mark it and any territory it's in as black's
				if (state == scoreState.WHITE_STONE) {
					territorySet.call(this, x, y, scoreState.BLACK_CANDIDATE, scoreState.BLACK_STONE);
				}

				//Was marked as not white, reset the territory
				else {
					territoryReset.call(this, x, y);
				}
			}

			//Black stone
			else if (color == StoneColor.B) {

				//Was black, mark it and any territory it's in as white's
				if (state == scoreState.BLACK_STONE) {
					territorySet.call(this, x, y, scoreState.WHITE_CANDIDATE, scoreState.WHITE_STONE);
				}

				//Was marked as not black, reset the territory
				else {
					territoryReset.call(this, x, y);
				}
			}
		}
	};

	//Return
	return GameScorer;
}]);

/**
 * KifuBlank :: This is a class which can generate blank JGF or SGF templates.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Blank.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('KifuBlank', ["ngGo", function(ngGo) {

	/**
	 * Blank JGF
	 */
	var blankJgf = {
		record: {
			application: ngGo.name + ' v' + ngGo.version,
			version: 1,
			charset: 'UTF-8'
		},
		game: {
			type: 'go',
			players: [
				{
					color: 'black',
					name: 'Black'
				},
				{
					color: 'white',
					name: 'White'
				}
			]
		},
		board: {
			width: 19,
			height: 19
		},
		tree: []
	};

	/**
	 * Blank SGF
	 */
	var blankSgf = {
		AP: ngGo.name + ':' + ngGo.version,
		CA: 'UTF-8',
		FF: '4',
		GM: '1',
		SZ: '19',
		PB: 'Black',
		PW: 'White'
	};

	/**
	 * Blank JGF/SGF container
	 */
	var KifuBlank = {

		/**
		 * Get blank JGF
		 */
		jgf: function(base) {

			//Initialize blank
			var blank = angular.copy(blankJgf);

			//Base given?
			if (base) {
				for (var p in base) {
					blank[p] = angular.extend(blank[p] || {}, base[p]);
				}
			}

			//Return
			return blank;
		},

		/**
		 * Get blank SGF
		 */
		sgf: function(base) {

			//Initialize blank
			var blank = angular.copy(blankSgf);

			//Base given?
			if (base) {
				for (var p in base) {
					blank[p] = base[p];
				}
			}

			//Return
			return blank;
		}
	};

	//Return object
	return KifuBlank;
}]);

/**
 * KifuParser :: This is a wrapper class for all available kifu parsers. It also provides
 * constants used by the parsers to aid conversion.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parser.Service', [
	'ngGo',
	'ngGo.Kifu.Parsers.Gib2Jgf.Service',
	'ngGo.Kifu.Parsers.Sgf2Jgf.Service',
	'ngGo.Kifu.Parsers.Jgf2Sgf.Service'
])

/**
 * SGF/JGF aliases constant for conversion between the two formats
 * Note: not all properties can be translated directly, so some are
 * not present here in this constant
 */
.constant('sgfAliases', {

	//Record properties
	'AP': 'record.application',
	'CA': 'record.charset',
	'CP': 'record.copyright',
	'SO': 'record.source',
	'US': 'record.transcriber',
	'AN': 'record.annotator',

	//Game properties
	'GM': 'game.type',
	'GN': 'game.name',
	'KM': 'game.komi',
	'HA': 'game.handicap',
	'RE': 'game.result',
	'RU': 'game.rules',
	'TM': 'game.time.main',
	'OT': 'game.time.overtime',
	'DT': 'game.dates',
	'PC': 'game.location',
	'EV': 'game.event',
	'RO': 'game.round',
	'ON': 'game.opening',
	'GC': 'game.comment',

	//Player info properties
	'PB': 'name',
	'PW': 'name',
	'BT': 'team',
	'WT': 'team',
	'BR': 'rank',
	'WR': 'rank',

	//Node annotation
	'N':  'name',
	'C':  'comments',
	'CR': 'circle',
	'TR': 'triangle',
	'SQ': 'square',
	'MA': 'mark',
	'SL': 'select',
	'LB': 'label'
})

/**
 * SGF game definitions
 */
.constant('sgfGames', {
	1: 'go',
	2: 'othello',
	3: 'chess',
	4: 'renju',
	6: 'backgammon',
	7: 'chinese chess',
	8: 'shogi'
})

/**
 * Factory definition
 */
.factory('KifuParser', ["Gib2Jgf", "Sgf2Jgf", "Jgf2Sgf", function(Gib2Jgf, Sgf2Jgf, Jgf2Sgf) {

	/**
	 * Parser wrapper class
	 */
	var KifuParser = {

		/**
		 * Parse GIB string into a JGF object or string
		 */
		gib2jgf: function(gib, stringified) {
			return Gib2Jgf.parse(gib, stringified);
		},

		/**
		 * Parse SGF string into a JGF object or string
		 */
		sgf2jgf: function(sgf, stringified) {
			return Sgf2Jgf.parse(sgf, stringified);
		},

		/**
		 * Parse JGF object or string into an SGF string
		 */
		jgf2sgf: function(jgf) {
			return Jgf2Sgf.parse(jgf);
		}
	};

	//Return object
	return KifuParser;
}]);

/**
 * Gib2Jgf :: This is a parser wrapped by the KifuParser which is used to convert fom GIB to JGF.
 * Since the Gib format is not public, the accuracy of this parser is not guaranteed.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parsers.Gib2Jgf.Service', [
	'ngGo',
	'ngGo.Kifu.Blank.Service'
])

/**
 * Factory definition
 */
.factory('Gib2Jgf', ["ngGo", "KifuBlank", function(ngGo, KifuBlank) {

	/**
	 * Regular expressions
	 */
	var regMove = /STO\s0\s([0-9]+)\s(1|2)\s([0-9]+)\s([0-9]+)/gi,
		regPlayer = /GAME(BLACK|WHITE)NAME=([A-Za-z0-9]+)\s\(([0-9]+D|K)\)/gi,
		regKomi = /GAMEGONGJE=([0-9]+)/gi,
		regDate = /GAMEDATE=([0-9]+)-\s?([0-9]+)-\s?([0-9]+)/g,
		regResultMargin = /GAMERESULT=(white|black)\s([0-9]+\.?[0-9]?)/gi,
		regResultOther = /GAMERESULT=(white|black)\s[a-z\s]+(resignation|time)/gi;

	/**
	 * Player parser function
	 */
	var parsePlayer = function(jgf, match) {

		//Initialize players container
		if (typeof jgf.game.players == 'undefined') {
			jgf.game.players = [];
		}

		//Determine player color
		var color = (match[1].toUpperCase() == 'BLACK') ? 'black' : 'white';

		//Create player object
		var player = {
			color: color,
			name: match[2],
			rank: match[3].toLowerCase()
		};

		//Check if player of this color already exists, if so, overwrite
		for (var p = 0; p < jgf.game.players.length; p++) {
			if (jgf.game.players[p].color == color) {
				jgf.game.players[p] = player;
				return;
			}
		}

		//Player of this color not found, push
		jgf.game.players.push(player);
	};

	/**
	 * Komi parser function
	 */
	var parseKomi = function(jgf, match) {
		jgf.game.komi = parseFloat(match[1]/10);
	};

	/**
	 * Date parser function
	 */
	var parseDate = function(jgf, match) {

		//Initialize dates container
		if (typeof jgf.game.dates == 'undefined') {
			jgf.game.dates = [];
		}

		//Push date
		jgf.game.dates.push(match[1]+'-'+match[2]+'-'+match[3]);
	};

	/**
	 * Result parser function
	 */
	var parseResult = function(jgf, match) {

		//Winner color
		var result = (match[1].toLowerCase() == 'black') ? 'B' : 'W';
		result += '+';

		//Win condition
		if (match[2].match(/res/i)) {
			result += 'R';
		}
		else if (match[2].match(/time/i)) {
			result += 'T';
		}
		else {
			result += match[2];
		}

		//Set in JGF
		jgf.game.result = result;
	};

	/**
	 * Move parser function
	 */
	var parseMove = function(jgf, node, match) {

		//Determine player color
		var color = match[2];
		if (color == 1) {
			color = 'B';
		}
		else if (color == 2) {
			color = 'W';
		}
		else {
			return;
		}

		//Create move container
		node.move = {};

		//Pass
		if (false) {

		}

		//Regular move
		else {
			node.move[color] = [match[3] * 1, match[4] * 1];
		}
	};

	/**
	 * Parser class
	 */
	var Parser = {

		/**
		 * Parse GIB string into a JGF object or string
		 */
		parse: function(gib, stringified) {

			//Get new JGF object
			var jgf = KifuBlank.jgf();

			//Initialize
			var match, container = jgf.tree;

			//Create first node for game, which is usually an empty board position, but can
			//contain comments or board setup instructions, which will be added to the node
			//later if needed.
			var node = {root: true};
			container.push(node);

			//Find player information
			while (match = regPlayer.exec(gib)) {
				parsePlayer(jgf, match);
			}

			//Find komi
			if (match = regKomi.exec(gib)) {
				parseKomi(jgf, match);
			}

			//Find game date
			if (match = regDate.exec(gib)) {
				parseDate(jgf, match);
			}

			//Find game result
			if ((match = regResultMargin.exec(gib)) || (match = regResultOther.exec(gib))) {
				parseResult(jgf, match);
			}

			//Find moves
			while (match = regMove.exec(gib)) {

				//Create new node
				node = {};

				//Parse move
				parseMove(jgf, node, match);

				//Push node to container
				container.push(node);
			}

			//Return jgf
			return jgf;
		}
	};

	//Return object
	return Parser;
}]);

/**
 * Jgf2Sgf :: This is a parser wrapped by the KifuParser which is used to convert fom JGF to SGF
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parsers.Jgf2Sgf.Service', [
	'ngGo',
	'ngGo.Kifu.Blank.Service'
])

/**
 * Factory definition
 */
.factory('Jgf2Sgf', ["ngGo", "sgfAliases", "sgfGames", "KifuBlank", function(ngGo, sgfAliases, sgfGames, KifuBlank) {

	/**
	 * Flip SGF alias map and create JGF alias map
	 */
	var jgfAliases = {};
	for (var sgfProp in sgfAliases) {
		jgfAliases[sgfAliases[sgfProp]] = sgfProp;
	}

	/**
	 * Character index of "a"
	 */
	var aChar = 'a'.charCodeAt(0);

	/**
	 * Helper to convert to SGF coordinates
	 */
	var convertCoordinates = function(coords) {
		return String.fromCharCode(aChar + coords[0]) + String.fromCharCode(aChar + coords[1]);
	};

	/***********************************************************************************************
	 * Conversion helpers
	 ***/

	/**
	 * Helper to escape SGF info
	 */
	var escapeSgf = function(text) {
		if (typeof text == 'string') {
			return text.replace(/\\/g, "\\\\").replace(/]/g, "\\]");
		}
		return text;
	};

	/**
	 * Helper to write an SGF group
	 */
	var writeGroup = function(prop, values, output, escape) {
		if (values.length) {
			output.sgf += prop;
			for (var i = 0; i < values.length; i++) {
				output.sgf += '[' + (escape ? escapeSgf(values[i]) : values[i]) + ']';
			}
		}
	};

	/**
	 * Move parser
	 */
	var parseMove = function(move, output) {

		//Determine and validate color
		var color = move.B ? 'B' : (move.W ? 'W' : '');
		if (color === '') {
			return;
		}

		//Determine move
		var coords = (move[color] == 'pass') ? '' : move[color];

		//Append to SGF
		output.sgf += color + '[' + convertCoordinates(coords) + ']';
	};

	/**
	 * Setup parser
	 */
	var parseSetup = function(setup, output) {

		//Loop colors
		for (var color in setup) {

			//Convert coordinates
			for (var i = 0; i < setup[color].length; i++) {
				setup[color][i] = convertCoordinates(setup[color][i]);
			}

			//Write as group
			writeGroup('A' + color, setup[color], output);
		}
	};

	/**
	 * Score parser
	 */
	var parseScore = function(score, output) {

		//Loop colors
		for (var color in score) {

			//Convert coordinates
			for (var i = 0; i < score[color].length; i++) {
				score[color][i] = convertCoordinates(score[color][i]);
			}

			//Write as group
			writeGroup('T' + color, score[color], output);
		}
	};

	/**
	 * Markup parser
	 */
	var parseMarkup = function(markup, output) {

		//Loop markup types
		for (var type in markup) {
			var i;

			//Label type has the label text appended to the coords
			if (type == 'label') {
				for (i = 0; i < markup[type].length; i++) {
					markup[type][i] = convertCoordinates(markup[type][i]) + ':' + markup[type][i][2];
				}
			}
			else {
				for (i = 0; i < markup[type].length; i++) {
					markup[type][i] = convertCoordinates(markup[type][i]);
				}
			}

			//Convert type
			if (typeof jgfAliases[type] != 'undefined') {
				type = jgfAliases[type];
			}

			//Write as group
			writeGroup(type, markup[type], output);
		}
	};

	/**
	 * Turn parser
	 */
	var parseTurn = function(turn, output) {
		output.sgf += 'PL[' + turn + ']';
	};

	/**
	 * Comments parser
	 */
	var parseComments = function(comments, output) {

		//Determine key
		var key = (typeof jgfAliases.comments != 'undefined') ? jgfAliases.comments : 'C';

		//Flatten comment objects
		var flatComments = [];
		for (var c = 0; c < comments.length; c++) {
			if (typeof comments[c] == 'string') {
				flatComments.push(comments[c]);
			}
			else if (comments[c].comment) {
				flatComments.push(comments[c].comment);
			}
		}

		//Write as group
		writeGroup(key, flatComments, output, true);
	};

	/**
	 * Node name parser
	 */
	var parseNodeName = function(nodeName, output) {
		var key = (typeof jgfAliases.name != 'undefined') ? jgfAliases.name : 'N';
		output.sgf += key + '[' + escapeSgf(nodeName) + ']';
	};

	/**
	 * Game parser
	 */
	var parseGame = function(game) {

		//Loop SGF game definitions
		for (var i in sgfGames) {
			if (sgfGames[i] == game) {
				return i;
			}
		}

		//Not found
		return 0;
	};

	/**
	 * Application parser
	 */
	var parseApplication = function(application) {
		var parts = application.split(' v');
		if (parts.length > 1) {
			return parts[0] + ':' + parts[1];
		}
		return application;
	};

	/**
	 * Player instructions parser
	 */
	var parsePlayer = function(player, rootProperties) {

		//Variation handling
		var st = 0;
		if (!player.variation_markup)	{
			st += 2;
		}
		if (player.variation_siblings) {
			st += 1;
		}

		//Set in root properties
		rootProperties['ST'] = st;
	};

	/**
	 * Board parser
	 */
	var parseBoard = function(board, rootProperties) {

		//Both width and height should be given
		if (board.width && board.height) {

			//Same dimensions?
			if (board.width == board.height) {
				rootProperties['SZ'] = board.width;
			}

			//Different dimensions are not supported by SGF, but OGS uses the
			//format w:h, so we will stick with that for anyone who supports it.
			else {
				rootProperties['SZ'] = board.width + ':' + board.height;
			}
		}

		//Otherwise, check if only width or height were given at least
		else if (board.width) {
			rootProperties['SZ'] = board.width;
		}
		else if (board.height) {
			rootProperties['SZ'] = board.height;
		}

		//Can't determine size
		else {
			rootProperties['SZ'] = '';
		}
	};

	/**
	 * Players parser
	 */
	var parsePlayers = function(players, rootProperties) {

		//Loop players
		for (var p = 0; p < players.length; p++) {

			//Validate color
			if (!players[p].color || (players[p].color != 'black' && players[p].color != 'white')) {
				continue;
			}

			//Get SGF color
			var color = (players[p].color == 'black') ? 'B' : 'W';

			//Name given?
			if (players[p].name) {
				rootProperties['P' + color] = players[p].name;
			}

			//Rank given?
			if (players[p].rank) {
				rootProperties[color + 'R'] = players[p].rank;
			}

			//Team given?
			if (players[p].team) {
				rootProperties[color + 'T'] = players[p].team;
			}
		}
	};

	/**
	 * Parse function to property mapper
	 */
	var parsingMap = {

		//Node properties
		'move':			parseMove,
		'setup':		parseSetup,
		'score':		parseScore,
		'markup':		parseMarkup,
		'turn':			parseTurn,
		'comments':		parseComments,
		'name':			parseNodeName,

		//Info properties
		'record.application':	parseApplication,
		'player':				parsePlayer,
		'board':				parseBoard,
		'game.type':			parseGame,
		'game.players':			parsePlayers
	};

	/***********************************************************************************************
	 * Parser functions
	 ***/

	/**
	 * Helper to write a JGF tree to SGF
	 */
	var writeTree = function(tree, output) {

		//Loop nodes in the tree
		for (var i = 0; i < tree.length; i++)	{
			var node = tree[i];

			//Array? That means a variation
			if (angular.isArray(node)) {
				for (var j = 0; j < node.length; j++) {
					output.sgf += "(\n;";
					writeTree(node[j], output);
					output.sgf += "\n)";
				}

				//Continue
				continue;
			}

			//Loop node properties
			for (var key in node) {

				//Handler present in parsing map?
				if (typeof parsingMap[key] !== 'undefined') {
					parsingMap[key](node[key], output);
					continue;
				}

				//Other object, can't handle it
				if (typeof props[key] == 'object') {
					continue;
				}

				//Anything else, append it
				output.sgf += key + '[' + escapeSgf(node[key]) + ']';
			}

			//More to come?
			if ((i + 1) < tree.length) {
				output.sgf += "\n;";
			}
		}
	};

	/**
	 * Helper to extract all SGF root properties from a JGF object
	 */
	var extractRootProperties = function(jgf, rootProperties, key) {

		//Initialize key
		if (typeof key == 'undefined') {
			key = '';
		}

		//Loop properties of jgf node
		for (var subKey in jgf) {

			//Skip SGF signature (as we keep our own)
			if (subKey == 'sgf') {
				continue;
			}

			//Build jgf key
			var jgfKey = (key === '') ? subKey : key + '.' + subKey;

			//If the item is an object, handle separately
			if (typeof jgf[subKey] == 'object') {

				//Handler for this object present in parsing map?
				if (typeof parsingMap[jgfKey] !== 'undefined') {
					parsingMap[jgfKey](jgf[subKey], rootProperties);
				}

				//Otherwise, just flatten and call this function recursively
				else {
					extractRootProperties(jgf[subKey], rootProperties, jgfKey);
				}
				continue;
			}

			//Check if it's a known key, if so, append the value to the root
			var value;
			if (typeof jgfAliases[jgfKey] != 'undefined') {

				//Handler present in parsing map?
				if (typeof parsingMap[jgfKey] !== 'undefined') {
					value = parsingMap[jgfKey](jgf[subKey]);
				}
				else {
					value = escapeSgf(jgf[subKey]);
				}

				//Set in root properties
				rootProperties[jgfAliases[jgfKey]] = value;
			}
		}
	};

	/**
	 * Parser class
	 */
	var Parser = {

		/**
		 * Parse JGF object or string into an SGF string
		 */
		parse: function(jgf) {

			//String given?
			if (typeof jgf == 'string') {
				jgf = angular.fromJson(jgf);
			}

			//Must have moves tree
			if (!jgf.tree) {
				console.error('No moves tree in JGF object');
				return;
			}

			//Initialize output (as object, so it remains a reference) and root properties container
			var output = {sgf: "(\n;"},
				root = angular.copy(jgf),
				rootProperties = KifuBlank.sgf();

			//The first node of the JGF tree is the root node, and it can contain comments,
			//board setup parameters, etc. It doesn't contain moves. We handle it separately here
			//and attach it to the root
			if (jgf.tree && jgf.tree.length > 0 && jgf.tree[0].root) {
				root = angular.extend(root, jgf.tree[0]);
				delete root.root;
				delete jgf.tree[0];
			}

			//Set root properties
			delete root.tree;
			extractRootProperties(root, rootProperties);

			//Write root properties
			for (var key in rootProperties) {
				if (rootProperties[key]) {
					output.sgf += key + '[' + escapeSgf(rootProperties[key]) + ']';
				}
			}

			//Write game tree
			writeTree(jgf.tree, output);

			//Close SGF and return
			output.sgf += ")";
			return output.sgf;
		}
	};

	//Return object
	return Parser;
}]);

/**
 * Sgf2Jgf :: This is a parser wrapped by the KifuParser which is used to convert fom SGF to JGF
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parsers.Sgf2Jgf.Service', [
	'ngGo',
	'ngGo.Kifu.Blank.Service'
])

/**
 * Factory definition
 */
.factory('Sgf2Jgf', ["ngGo", "sgfAliases", "sgfGames", "KifuBlank", function(ngGo, sgfAliases, sgfGames, KifuBlank) {

	/**
	 * Regular expressions for SGF data
	 */
	var regSequence = /\(|\)|(;(\s*[A-Z]+\s*((\[\])|(\[(.|\s)*?([^\\]\])))+)*)/g,
		regNode = /[A-Z]+\s*((\[\])|(\[(.|\s)*?([^\\]\])))+/g,
		regProperty = /[A-Z]+/,
		regValues = /(\[\])|(\[(.|\s)*?([^\\]\]))/g;

	/**
	 * Character index of "a"
	 */
	var aChar = 'a'.charCodeAt(0);

	/**
	 * Helper to convert SGF coordinates
	 */
	var convertCoordinates = function(coords) {
		return [coords.charCodeAt(0)-aChar, coords.charCodeAt(1)-aChar];
	};

	/***********************************************************************************************
	 * Conversion helpers
	 ***/

	/**
	 * Application parser function (doesn't overwrite existing signature)
	 */
	var parseApp = function(jgf, node, key, value) {
		if (!jgf.record.application) {
			var app = value[0].split(':');
			if (app.length > 1) {
				jgf.record.application = app[0] + ' v' + app[1];
			}
			else {
				jgf.record.application = app[0];
			}
		}
	};

	/**
	 * SGF format parser
	 */
	var parseSgfFormat = function(jgf, node, key, value) {
		return;
	};

	/**
	 * Game type parser function
	 */
	var parseGame = function(jgf, node, key, value) {
		var game = value[0];
		if (typeof sgfGames[game] != 'undefined') {
			jgf.game.type = sgfGames[game];
		}
		else {
			jgf.game.type = value[0];
		}
	};

	/**
	 * Move parser function
	 */
	var parseMove = function(jgf, node, key, value) {

		//Create move container
		node.move = {};

		//Pass
		if (value[0] === '' || (jgf.width <= 19 && value[0] == 'tt')) {
			node.move[key] = 'pass';
		}

		//Regular move
		else {
			node.move[key] = convertCoordinates(value[0]);
		}
	};

	/**
	 * Comment parser function
	 */
	var parseComment = function(jgf, node, key, value) {

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Set value
		node[key] = value;
	};

	/**
	 * Node name parser function
	 */
	var parseNodeName = function(jgf, node, key, value) {

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Set value
		node[key] = value[0];
	};

	/**
	 * Board setup parser function
	 */
	var parseSetup = function(jgf, node, key, value) {

		//Initialize setup container on node
		if (typeof node.setup == 'undefined') {
			node.setup = {};
		}

		//Remove "A" from setup key
		key = key.charAt(1);

		//Initialize setup container of this type
		if (typeof node.setup[key] == 'undefined') {
			node.setup[key] = [];
		}

		//Add values
		for (var i = 0; i < value.length; i++) {
			node.setup[key].push(convertCoordinates(value[i]));
		}
	};

	/**
	 * Scoring parser function
	 */
	var parseScore = function(jgf, node, key, value) {

		//Initialize score container on node
		if (typeof node.score == 'undefined') {
			node.score = {
				B: [],
				W: []
			};
		}

		//Remove "T" from setup key
		key = key.charAt(1);

		//Add values
		for (var i = 0; i < value.length; i++) {
			node.score[key].push(convertCoordinates(value[i]));
		}
	};

	/**
	 * Turn parser function
	 */
	var parseTurn = function(jgf, node, key, value) {
		node.turn = value[0];
	};

	/**
	 * Label parser function
	 */
	var parseLabel = function(jgf, node, key, value) {

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Initialize markup container on node
		if (typeof node.markup == 'undefined') {
			node.markup = {};
		}

		//Initialize markup container of this type
		if (typeof node.markup[key] == 'undefined') {
			node.markup[key] = [];
		}

		//Add values
		for (var i = 0; i < value.length; i++) {

			//Split off coordinates and add label contents
			var coords = convertCoordinates(value[i].substr(0, 2));
			coords.push(value[i].substr(3));

			//Add to node
			node.markup[key].push(coords);
		}
	};

	/**
	 * Markup parser function
	 */
	var parseMarkup = function(jgf, node, key, value) {

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Initialize markup container on node
		if (typeof node.markup == 'undefined') {
			node.markup = {};
		}

		//Initialize markup container of this type
		if (typeof node.markup[key] == 'undefined') {
			node.markup[key] = [];
		}

		//Add values
		for (var i in value) {
			node.markup[key].push(convertCoordinates(value[i]));
		}
	};

	/**
	 * Size parser function
	 */
	var parseSize = function(jgf, node, key, value) {

		//Initialize board container
		if (typeof jgf.board == 'undefined') {
			jgf.board = {};
		}

		//Add size property (can be width:height or just a single size)
		var size = value[0].split(':');
		if (size.length > 1) {
			jgf.board.width = parseInt(size[0]);
			jgf.board.height = parseInt(size[1]);
		}
		else {
			jgf.board.width = jgf.board.height = parseInt(size[0]);
		}
	};

	/**
	 * Date parser function
	 */
	var parseDate = function(jgf, node, key, value) {

		//Initialize dates container
		if (typeof jgf.game.dates == 'undefined') {
			jgf.game.dates = [];
		}

		//Explode dates
		var dates = value[0].split(',');
		for (var d = 0; d < dates.length; d++) {
			jgf.game.dates.push(dates[d]);
		}
	};

	/**
	 * Komi parser function
	 */
	var parseKomi = function(jgf, node, key, value) {
		jgf.game.komi = parseFloat(value[0]);
	};

	/**
	 * Variations handling parser function
	 */
	var parseVariations = function(jgf, node, key, value) {

		//Initialize display property
		if (typeof jgf.player == 'undefined') {
			jgf.player = {};
		}

		//Initialize variation display settings
		jgf.player.variation_markup = false;
		jgf.player.variation_children = false;
		jgf.player.variation_siblings = false;

		//Parse as integer
		var st = parseInt(value[0]);

		//Determine what we want (see SGF specs for details)
		switch (st) {
			case 0:
				jgf.player.variation_markup = true;
				jgf.player.variation_children = true;
				break;
			case 1:
				jgf.player.variation_markup = true;
				jgf.player.variation_siblings = true;
				break;
			case 2:
				jgf.player.variation_children = true;
				break;
			case 3:
				jgf.player.variation_siblings = true;
				break;
		}
	};

	/**
	 * Player info parser function
	 */
	var parsePlayer = function(jgf, node, key, value) {

		//Initialize players container
		if (typeof jgf.game.players == 'undefined') {
			jgf.game.players = [];
		}

		//Determine player color
		var color = (key == 'PB' || key == 'BT' || key == 'BR') ? 'black' : 'white';

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Check if player of this color already exists
		for (var p = 0; p < jgf.game.players.length; p++) {
			if (jgf.game.players[p].color == color) {
				jgf.game.players[p][key] = value[0];
				return;
			}
		}

		//Player of this color not found, initialize
		var player = {color: color};
		player[key] = value[0];
		jgf.game.players.push(player);
	};

	/**
	 * Parsing function to property mapper
	 */
	var parsingMap = {

		//Application, game type, board size, komi, date
		'AP':	parseApp,
		'FF':	parseSgfFormat,
		'GM':	parseGame,
		'SZ':	parseSize,
		'KM':	parseKomi,
		'DT':	parseDate,

		//Variations handling
		'ST':	parseVariations,

		//Player info handling
		'PB':	parsePlayer,
		'PW':	parsePlayer,
		'BT':	parsePlayer,
		'WT':	parsePlayer,
		'BR':	parsePlayer,
		'WR':	parsePlayer,

		//Moves
		'B':	parseMove,
		'W':	parseMove,

		//Node annotation
		'C':	parseComment,
		'N':	parseNodeName,

		//Board setup
		'AB':	parseSetup,
		'AW':	parseSetup,
		'AE':	parseSetup,
		'PL':	parseTurn,
		'TW':	parseScore,
		'TB':	parseScore,

		//Markup
		'CR':	parseMarkup,
		'SQ':	parseMarkup,
		'TR':	parseMarkup,
		'MA':	parseMarkup,
		'SL':	parseMarkup,
		'LB':	parseLabel
	};

	/**
	 * These properties need a node object
	 */
	var needsNode = ['B', 'W', 'C', 'N', 'AB', 'AW', 'AE', 'PL', 'LB', 'CR', 'SQ', 'TR', 'MA', 'SL', 'TW', 'TB'];

	/***********************************************************************************************
	 * Parser helpers
	 ***/

	/**
	 * Set info in the JGF tree at a certain position
	 */
	var setInfo = function(jgf, position, value) {

		//Position given must be an array
		if (typeof position != 'object') {
			return;
		}

		//Initialize node to attach value to
		var node = jgf, key;

		//Loop the position
		for (var p = 0; p < position.length; p++) {

			//Get key
			key = position[p];

			//Last key reached? Done
			if ((p + 1) == position.length) {
				break;
			}

			//Create container if not set
			if (typeof node[key] != 'object') {
				node[key] = {};
			}

			//Move up in tree
			node = node[key];
		}

		//Set value
		node[key] = value;
	};

	/**
	 * Parser class
	 */
	var Parser = {

		/**
		 * Parse SGF string into a JGF object or string
		 */
		parse: function(sgf, stringified) {

			//Get new JGF object (with SGF node as a base)
			var jgf = KifuBlank.jgf({record: {sgf: {}}});

			//Initialize
			var stack = [],
				container = jgf.tree;

			//Create first node for game, which is usually an empty board position, but can
			//contain comments or board setup instructions, which will be added to the node
			//later if needed.
			var node = {root: true};
			container.push(node);

			//Find sequence of elements
			var sequence = sgf.match(regSequence);

			//Loop sequence items
			for (var i in sequence) {

				//Push stack if new variation found
				if (sequence[i] == '(') {

					//First encounter, this defines the main tree branch, so skip
					if (i === 0 || i === '0') {
						continue;
					}

					//Push the current container to the stack
					stack.push(container);

					//Create variation container if it doesn't exist yet
					if (!angular.isArray(container[container.length-1])) {
						container.push([]);
					}

					//Use variation container
					container = container[container.length-1];

					//Now create moves container
					container.push([]);
					container = container[container.length-1];
					continue;
				}

				//Grab last container from stack if end of variation reached
				else if (sequence[i] == ')') {
					if (stack.length) {
						container = stack.pop();
					}
					continue;
				}

				//Make array of properties within this sequence
				var properties = sequence[i].match(regNode) || [];

				//Loop them
				for (var j in properties) {

					//Get property's key and separate values
					var key = regProperty.exec(properties[j])[0].toUpperCase(),
						values = properties[j].match(regValues);

					//Remove additional braces [ and ]
					for (var k in values) {
						values[k] = values[k].substring(1, values[k].length - 1).replace(/\\(?!\\)/g, "");
					}

					//SGF parser present for this key? Call it, and we're done
					if (typeof parsingMap[key] != 'undefined') {

						//Does this type of property need a node?
						if (needsNode.indexOf(key) !== -1) {

							//If no node object present, create a new node
							//For moves, always a new node is created
							if (!node || key == 'B' || key == 'W') {
								node = {};
								container.push(node);
							}
						}

						//Apply parsing function on node
						parsingMap[key](jgf, node, key, values);
						continue;
					}

					//No SGF parser present, we continue with regular property handling

					//If there is only one value, simplify array
					if (values.length == 1) {
						values = values[0];
					}

					//SGF alias known? Then this is an info element and we handle it accordingly
					if (typeof sgfAliases[key] != 'undefined') {

						//The position in the JGF object is represented by dot separated strings
						//in the sgfAliases array. Split the position and use the setInfo helper
						//to set the info on the JGF object
						setInfo(jgf, sgfAliases[key].split('.'), values);
						continue;
					}

					//No SGF alias present either, just append the data

					//Save in node
					if (node) {
						node[key] = values;
					}

					//Save in root
					else {
						jgf[key] = values;
					}
				}

				//Reset node, unless this was the root node
				if (node && !node.root) {
					node = null;
				}
			}

			//Return jgf
			return jgf;
		}
	};

	//Return object
	return Parser;
}]);
/**
 * ngGo
 *
 * This is the AngularJS implementation of WGo, based on WGo version 2.3.1. All code has been
 * refactored to fit the Angular framework, as well as having been linted, properly commented
 * and generally cleaned up.
 *
 * Copyright (c) 2013 Jan Prokop (WGo)
 * Copyright (c) 2014-2015 Adam Buczynski (ngGo)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo', [])

/**
 * ngGo constants
 */
.constant('ngGo', {
	name:		'ngGo',
	version:	'1.1.1',
	error:		{

		//Position errors
		POSITION_OUT_OF_BOUNDS:		1,
		POSITION_ALREADY_HAS_STONE:	2,
		POSITION_IS_SUICIDE:		3,
		POSITION_IS_REPEATING:		4,

		//Data loading errors
		NO_DATA:					5,
		UNKNOWN_DATA:				6,
		INVALID_SGF:				7,
		INVALID_GIB:				8,
		INVALID_JGF_JSON:			9,
		INVALID_JGF_TREE_JSON:		10
	}
})

/**
 * Stone colors
 */
.constant('StoneColor', {
	E: 0,
	EMPTY: 0,
	B:	1,
	BLACK: 1,
	W:	-1,
	WHITE: -1
})

/**
 * Markup types
 */
.constant('MarkupTypes', {
	TRIANGLE:	'triangle',
	CIRCLE:		'circle',
	SQUARE:		'square',
	MARK:		'mark',
	SELECT:		'select',
	LABEL:		'label',
	LAST:		'last',
	SAD:		'sad',
	HAPPY:		'happy'
})

/**
 * Player modes
 */
.constant('PlayerModes', {
	PLAY:	'play',
	REPLAY:	'replay',
	EDIT:	'edit',
	SOLVE:	'solve'
})

/**
 * Player tools
 */
.constant('PlayerTools', {
	NONE:	'none',
	MOVE:	'move',
	SCORE:	'score',
	SETUP:	'setup',
	MARKUP:	'markup'
})

/**
 * Key codes
 */
.constant('KeyCodes', {
	LEFT:		37,
	RIGHT:		39,
	UP:			38,
	DOWN:		40,
	ESC:		27,
	ENTER:		13,
	SPACE:		32,
	TAB:		9,
	SHIFT:		16,
	CTRL:		17,
	ALT:		18,
	HOME:		36,
	END:		35,
	PAGEUP:		33,
	PAGEDOWN:	34
});

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Directive', [
	'ngGo.Board.Directive'
])

/**
 * Directive definition
 */
.directive('player', ["Player", function(Player) {
	return {
		restrict: 'E',

		/**
		 * Controller
		 */
		controller: ["$scope", function($scope) {

			//Set player in scope
			if (!$scope.Player) {
				$scope.Player = Player;
			}
		}],

		/**
		 * Linking function
		 */
		link: function(scope, element, attrs) {

			//Link the element
			Player.linkElement(element);

			//Observe mode and tool attributes
			attrs.$observe('mode', function(mode) {
				Player.switchMode(mode);
			});
			attrs.$observe('tool', function(tool) {
				Player.switchTool(tool);
			});

			//Observe other settings attributes
			attrs.$observe('variationMarkup', function(attr) {
				Player.setVariationMarkup(attr === 'true');
			});
			attrs.$observe('solutionPaths', function(attr) {
				Player.toggleSolutionPaths(attr === 'true');
			});
			attrs.$observe('lastMoveMarker', function(attr) {
				Player.setLastMoveMarker(attr);
			});
		}
	};
}]);

/**
 * Player :: This class brings the board to life and allows a user to interact with it. It
 * handles user input, controls objects going to the board, can load game records, and allows the
 * user to manipulate the board according to the current player mode.
 * Unless you want to display static positions, this is the class you'd use by default.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Service', [
	'ngGo',
	'ngGo.Player.Directive',
	'ngGo.Player.Mode.Common.Service',
	'ngGo.Board.Service',
	'ngGo.Game.Service',
	'ngGo.Game.Scorer.Service'
])

/**
 * Provider definition
 */
.provider('Player', ["PlayerModes", "PlayerTools", "MarkupTypes", function(PlayerModes, PlayerTools, MarkupTypes) {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Default mode/tool
		mode: PlayerModes.REPLAY,
		tool: PlayerTools.MOVE,

		//Keys/scrollwheel navigation
		arrow_keys_navigation: true,
		scroll_wheel_navigation: true,

		//Last move marker, leave empty for none
		last_move_marker: MarkupTypes.LAST,

		//Indicate variations with markup on the board, and show
		//successor node variations or current node variations
		variation_markup: true,
		variation_children: true,
		variation_siblings: false
	};

	/**
	 * Set global default configuration for players
	 */
	this.setConfig = function(config) {
		defaultConfig = angular.extend(defaultConfig, config);
	};

	/**
	 * Service getter
	 */
	this.$get = ["$rootScope", "$document", "Game", "GameScorer", "Board", "PlayerTools", function($rootScope, $document, Game, GameScorer, Board, PlayerTools) {

		/**
		 * Helper to append board grid coordinatess to the broadcast event object
		 */
		var processMouseEvent = function(broadcastEvent, mouseEvent) {

			//Can only do this with a board and mouse event
			if (!this.board || !mouseEvent) {
				broadcastEvent.x = -1;
				broadcastEvent.y = -1;
				return;
			}

			//Init
			var x = 0, y = 0;

			//Set x
			if (typeof mouseEvent.offsetX != 'undefined') {
				x = mouseEvent.offsetX;
			}
			else if (mouseEvent.originalEvent && typeof mouseEvent.originalEvent.offsetX != 'undefined') {
				x = mouseEvent.originalEvent.offsetX;
			}
			else if (mouseEvent.originalEvent && typeof mouseEvent.originalEvent.layerX != 'undefined') {
				x = mouseEvent.originalEvent.layerX;
			}

			//Set y
			if (typeof mouseEvent.offsetY != 'undefined') {
				y = mouseEvent.offsetY;
			}
			else if (mouseEvent.originalEvent && typeof mouseEvent.originalEvent.offsetY != 'undefined') {
				y = mouseEvent.originalEvent.offsetY;
			}
			else if (mouseEvent.originalEvent && typeof mouseEvent.originalEvent.layerY != 'undefined') {
				y = mouseEvent.originalEvent.layerY;
			}

			//Apply pixel ratio factor
			x *= (window.devicePixelRatio || 1);
			y *= (window.devicePixelRatio || 1);

			//Append coords
			broadcastEvent.x = this.board.getGridX(x);
			broadcastEvent.y = this.board.getGridY(y);

			//Did we drag?
			if (mouseEvent.drag) {
				broadcastEvent.drag = mouseEvent.drag;
			}
		};

		/**
		 * Player class
		 */
		var Player = {

			//Player configuration
			config: {},

			//Board and game instances
			board: null,
			game: null,

			//Available modes and tools
			modes: {},
			tools: [],

			//Player mode and active tool
			mode: '',
			tool: '',

			//Current path
			path: null,

			/**
			 * Initialization
			 */
			init: function() {

				//Unlink board instance, create new game
				this.board = null;
				this.game = new Game();

				//Reset path
				this.path = null;

				//Player mode and active tool
				this.mode = '';
				this.tool = '';

				//Arrow keys / scroll wheel navigation
				this.arrowKeysNavigation = false;
				this.scrollWheelNavigation = false;

				//Last move marker
				this.lastMoveMarker = '';

				//Variation markup
				this.variationMarkup = false;
				this.variationChildren = false;
				this.variationSiblings = false;

				//Restricted nodes
				this.restrictNodeStart = null;
				this.restrictNodeEnd = null;

				//Parse config
				this.parseConfig();
			},

			/**
			 * Link the player to a HTML element
			 */
			linkElement: function(element) {

				//Set element
				this.element = element;

				//Register document event
				this.registerElementEvent('keydown', $document);

				//Register element events
				this.registerElementEvent('click');
				this.registerElementEvent('mousedown');
				this.registerElementEvent('mouseup');
				this.registerElementEvent('mousemove');
				this.registerElementEvent('mouseout');
				this.registerElementEvent('mousewheel');
				this.registerElementEvent('wheel');
			},

			/***********************************************************************************************
			 * Configuration
			 ***/

			/**
			 * Parse config instructions
			 */
			parseConfig: function(config) {

				//Extend from default config
				this.config = angular.extend({}, defaultConfig, config || {});

				//Process settings
				this.switchMode(this.config.mode);
				this.switchTool(this.config.tool);
				this.setArrowKeysNavigation(this.config.arrow_keys_navigation);
				this.setScrollWheelNavigation(this.config.scroll_wheel_navigation);
				this.setLastMoveMarker(this.config.last_move_marker);
				this.setVariationMarkup(
					this.config.variation_markup,
					this.config.variation_children,
					this.config.variation_siblings
				);

				//Let the modes parse their config
				for (var mode in this.modes) {
					if (this.modes[mode].parseConfig) {
						this.modes[mode].parseConfig.call(this, this.config);
					}
				}
			},

			/**
			 * Set arrow keys navigation
			 */
			setArrowKeysNavigation: function(arrowKeys) {
				if (arrowKeys != this.arrowKeysNavigation) {
					this.arrowKeysNavigation = arrowKeys;
					this.broadcast('settingChange', 'arrowKeysNavigation');
				}
			},

			/**
			 * Set scroll wheel navigation
			 */
			setScrollWheelNavigation: function(scrollWheel) {
				if (scrollWheel != this.scrollWheelNavigation) {
					this.scrollWheelNavigation = scrollWheel;
					this.broadcast('settingChange', 'scrollWheelNavigation');
				}
			},

			/**
			 * Set the last move marker
			 */
			setLastMoveMarker: function(lastMoveMarker) {
				if (lastMoveMarker != this.lastMoveMarker) {
					this.lastMoveMarker = lastMoveMarker;
					this.broadcast('settingChange', 'lastMoveMarker');
				}
			},

			/**
			 * Set variation markup on the board
			 */
			setVariationMarkup: function(variationMarkup, variationChildren, variationSiblings) {

				//One change event for these three settings
				var change = false;

				//Markup setting change?
				if (variationMarkup != this.variationMarkup) {
					this.variationMarkup = variationMarkup;
					change = true;
				}

				//Children setting change?
				if (typeof variationChildren != 'undefined' && variationChildren != this.variationChildren) {
					this.variationChildren = variationChildren;
					change = true;
				}

				//Siblings setting change?
				if (typeof variationSiblings != 'undefined' && variationSiblings != this.variationSiblings) {
					this.variationSiblings = variationSiblings;
					change = true;
				}

				//Did anything change?
				if (change) {
					this.broadcast('settingChange', 'variationMarkup');
				}
			},

			/***********************************************************************************************
			 * Mode and tool handling
			 ***/

			/**
			 * Register a player mode
			 */
			registerMode: function(mode, PlayerMode) {

				//Register the mode and let it parse the configuration
				this.modes[mode] = PlayerMode;

				//Parse config if we have a handler
				if (this.modes[mode].parseConfig) {
					this.modes[mode].parseConfig.call(this, this.config);
				}

				//Force switch the mode now, if it matches the initial mode
				if (this.mode == mode) {
					this.switchMode(this.mode, true);
					this.switchTool(this.tool, true);
				}
			},

			/**
			 * Set available tools
			 */
			setTools: function(tools) {
				this.tools = tools || [PlayerTools.NONE];
			},

			/**
			 * Check if we have a player mode
			 */
			hasMode: function(mode) {
				return this.modes[mode] ? true : false;
			},

			/**
			 * Check if we have a player tool
			 */
			hasTool: function(tool) {
				return (this.tools.indexOf(tool) != -1);
			},

			/**
			 * Switch player mode
			 */
			switchMode: function(mode, force) {

				//No change?
				if (!force && (!mode || this.mode == mode)) {
					return false;
				}

				//Broadcast mode exit
				if (this.mode) {
					this.broadcast('modeExit', this.mode);
				}

				//Set mode, reset tools and active tool
				this.mode = mode;
				this.tools = [];
				this.tool = PlayerTools.NONE;

				//Broadcast mode entry
				this.broadcast('modeEnter', this.mode);
				return true;
			},

			/**
			 * Switch player tool
			 */
			switchTool: function(tool, force) {

				//No change?
				if (!force && (!tool || this.tool == tool)) {
					return false;
				}

				//Validate tool switch (only when there is a mode)
				if (this.mode && this.modes[this.mode] && this.tools.indexOf(tool) === -1) {
					return false;
				}

				//Change tool
				this.tool = tool;
				this.broadcast('toolSwitch', this.tool);
				return true;
			},

			/**
			 * Save the full player state
			 */
			saveState: function() {

				//Save player state
				this.playerState = {
					mode: this.mode,
					tool: this.tool,
					restrictNodeStart: this.restrictNodeStart,
					restrictNodeEnd: this.restrictNodeEnd
				};

				//Save game state
				this.saveGameState();
			},

			/**
			 * Restore to the saved player state
			 */
			restoreState: function() {

				//Must have player state
				if (!this.playerState) {
					return;
				}

				//Restore
				this.switchMode(this.playerState.mode);
				this.switchTool(this.playerState.tool);
				this.restrictNodeStart = this.playerState.restrictNodeStart;
				this.restrictNodeEnd = this.playerState.restrictNodeEnd;

				//Restore game state
				this.restoreGameState();
			},

			/***********************************************************************************************
			 * Game record handling
			 ***/

			/**
			 * Load game record
			 */
			load: function(data, allowPlayerConfig) {

				//Try to load the game record data
				try {
					this.game.load(data);
				}
				catch (error) {
					throw error;
				}

				//Reset path
				this.path = null;

				//Parse configuration from JGF if allowed
				if (allowPlayerConfig || typeof allowPlayerConfig == 'undefined') {
					this.parseConfig(this.game.get('settings'));
				}

				//Dispatch game loaded event
				this.broadcast('gameLoaded', this.game);

				//Board present?
				if (this.board) {
					this.board.removeAll();
					this.board.parseConfig(this.game.get('board'));
					this.processPosition();
				}

				//Loaded ok
				return true;
			},

			/**
			 * Reload the existing game record
			 */
			reload: function() {

				//Must have game
				if (!this.game || !this.game.isLoaded()) {
					return;
				}

				//Reload game
				this.game.reload();

				//Update board
				if (this.board) {
					this.board.removeAll();
					this.processPosition();
				}
			},

			/**
			 * Save the current state
			 */
			saveGameState: function() {
				if (this.game && this.game.isLoaded()) {
					this.gameState = this.game.getState();
				}
			},

			/**
			 * Restore to the saved state
			 */
			restoreGameState: function(mode) {

				//Must have game and saved state
				if (!this.game || !this.gameState) {
					return;
				}

				//Restore state
				this.game.restoreState(this.gameState);

				//Update board
				if (this.board) {
					this.board.removeAll();
					this.processPosition();
				}
			},

			/***********************************************************************************************
			 * Navigation
			 ***/

			/**
			 * Go to the next position
			 */
			next: function(i) {
				if (this.game && this.game.node != this.restrictNodeEnd) {
					this.game.next(i);
					this.processPosition();
				}
			},

			/**
			 * Go back to the previous position
			 */
			previous: function() {
				if (this.game && this.game.node != this.restrictNodeStart) {
					this.game.previous();
					this.processPosition();
				}
			},

			/**
			 * Go to the last position
			 */
			last: function() {
				if (this.game) {
					this.game.last();
					this.processPosition();
				}
			},

			/**
			 * Go to the first position
			 */
			first: function() {
				if (this.game) {
					this.game.first();
					this.processPosition();
				}
			},

			/**
			 * Go to a specific move number, tree path or named node
			 */
			goto: function(target) {
				if (this.game && target) {
					this.game.goto(target);
					this.processPosition();
				}
			},

			/**
			 * Restrict navigation to the current node
			 */
			restrictNode: function(end) {

				//Must have game and node
				if (!this.game || !this.game.node) {
					return;
				}

				//Restrict to current node
				if (end) {
					this.restrictNodeEnd = this.game.node;
				}
				else {
					this.restrictNodeStart = this.game.node;
				}
			},

			/**
			 * Process a new game position
			 */
			processPosition: function() {

				//No game?
				if (!this.game || !this.game.isLoaded()) {
					return;
				}

				//Get current node and game position
				var node = this.game.getNode(),
					path = this.game.getPath(),
					position = this.game.getPosition(),
					pathChanged = !path.compare(this.path);

				//Update board
				this.updateBoard(node, position, pathChanged);

				//Path change?
				if (pathChanged) {

					//Copy new path and broadcast path change
					this.path = path.clone();
					this.broadcast('pathChange', node);

					//Named node reached? Broadcast event
					if (node.name) {
						this.broadcast('reachedNode.' + node.name, node);
					}
				}

				//Passed?
				if (node.move && node.move.pass) {
					this.broadcast('movePassed', node);
				}
			},

			/***********************************************************************************************
			 * Game handling
			 ***/

			/**
			 * Start a new game
			 */
			newGame: function() {
				this.game = new Game();
				this.processPosition();
			},

			/**
			 * Score the current game position
			 */
			scoreGame: function() {

				//Calculate score
				GameScorer.calculate();

				//Get score, points and captures
				var score = GameScorer.getScore(),
					points = GameScorer.getPoints(),
					captures = GameScorer.getCaptures();

				//Remove all markup, and set captures and points
				this.board.layers.markup.removeAll();
				this.board.layers.score.setAll(points, captures);

				//Broadcast score
				this.broadcast('scoreCalculated', score);
			},

			/***********************************************************************************************
			 * Board handling
			 ***/

			/**
			 * Get the board
			 */
			getBoard: function() {
				return this.board;
			},

			/**
			 * Set the board
			 */
			setBoard: function(Board) {

				//Set the board
				this.board = Board;

				//Board ready
				if (this.board) {
					this.broadcast('boardReady', this.board);
				}

				//If a game has been loaded already, parse config and update the board
				if (this.game && this.game.isLoaded()) {
					this.board.removeAll();
					this.board.parseConfig(this.game.get('board'));
					this.processPosition();
				}
			},

			/**
			 * Update the board
			 */
			updateBoard: function(node, position, pathChanged) {

				//Must have board
				if (!this.board) {
					return;
				}

				//Update board with new position
				this.board.updatePosition(position, pathChanged);

				//Mark last move
				if (this.lastMoveMarker && node.move && !node.move.pass) {
					this.board.add('markup', node.move.x, node.move.y, this.lastMoveMarker);
				}

				//Broadcast board update event
				this.broadcast('boardUpdate', node);
			},

			/***********************************************************************************************
			 * Event handling
			 ***/

			/**
			 * Register an element event
			 */
			registerElementEvent: function(event, element) {

				//Which element to use
				if (typeof element == 'undefined' || !element.on) {
					element = this.element;
				}

				//Remove any existing event listener and apply new one
				//TODO: Namespacing events doesn't work with Angular's jqLite
				element.off(event/* + '.ngGo.player'*/);
				element.on(event/* + '.ngGo.player'*/, this.broadcast.bind(this, event));
			},

			/**
			 * Event listener
			 */
			on: function(type, listener, mode, $scope) {

				//Must have valid listener
				if (typeof listener != 'function') {
					console.warn('Listener is not a function:', listener);
					return;
				}

				//Scope given as 3rd parameter?
				if (mode && mode.$parent) {
					$scope = mode;
					mode = '';
				}

				//Multiple events?
				if (type.indexOf(' ') !== -1) {
					var types = type.split(' ');
					for (var t = 0; t < types.length; t++) {
						this.on(types[t], listener, mode, $scope);
					}
					return;
				}

				//Get self and determine scope to use
				var self = this,
					scope = $scope || $rootScope;

				//Create listener and return de-registration function
				return scope.$on('ngGo.player.' + type, function() {

					//Filter on mode
					if (mode) {
						if ((typeof mode == 'string' && mode != self.mode) || mode.indexOf(self.mode) === -1) {
							return;
						}
					}

					//Inside a text field?
					if (type == 'keydown' && $document[0].querySelector(':focus')) {
						return;
					}

					//Append grid coordinates for mouse events
					if (type == 'click' || type == 'hover' || type.substr(0, 5) == 'mouse') {
						processMouseEvent.call(self, arguments[0], arguments[1]);
					}

					//Dragging? Prevent click events from firing
					if (self.preventClickEvent && type == 'click') {
						delete self.preventClickEvent;
						return;
					}
					else if (type == 'mousedrag') {
						self.preventClickEvent = true;
					}

					//Call listener
					listener.apply(self, arguments);
				});
			},

			/**
			 * Event broadcaster
			 */
			broadcast: function(type, args) {

				//Must have type
				if (!type) {
					return;
				}

				//Make sure we are in a digest cycle
				if (!$rootScope.$$phase) {
					$rootScope.$apply(function() {
						$rootScope.$broadcast('ngGo.player.' + type, args);
					});
				}
				else {
					$rootScope.$broadcast('ngGo.player.' + type, args);
				}
			}
		};

		//Initialize
		Player.init();

		//Return object
		return Player;
	}];
}]);


/**
 * PlayerModeCommon :: This class governs common event handling of the player shared by
 * various player modes. It's basically an abstract player mode and it can't be actively set.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Common.Service', [
	'ngGo',
	'ngGo.Game.Scorer.Service'
])

/**
 * Run block
 */
.run(["Player", "PlayerModes", "PlayerModeCommon", function(Player, PlayerModes, PlayerModeCommon) {

	/**
	 * Register common event handlers
	 */
	Player.on('keydown', PlayerModeCommon.keyDown, [
		PlayerModes.REPLAY, PlayerModes.EDIT
	]);
	Player.on('mousewheel wheel', PlayerModeCommon.mouseWheel, [
		PlayerModes.REPLAY, PlayerModes.EDIT
	]);
	Player.on('mousemove', PlayerModeCommon.mouseMove, [
		PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE
	]);
	Player.on('mouseout', PlayerModeCommon.mouseOut, [
		PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE
	]);
	Player.on('mousedown', PlayerModeCommon.mouseDown, [
		PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE
	]);
	Player.on('mouseup', PlayerModeCommon.mouseUp, [
		PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE
	]);
}])

/**
 * Factory definition
 */
.factory('PlayerModeCommon', ["Player", "PlayerTools", "GameScorer", "KeyCodes", function(Player, PlayerTools, GameScorer, KeyCodes) {

	/**
	 * Helper to build drag object
	 */
	var dragObject = function(event) {

		//Initialize drag object
		var drag = {
			start: {
				x: (this.mouse.dragStart.x > event.x) ? event.x : this.mouse.dragStart.x,
				y: (this.mouse.dragStart.y > event.y) ? event.y : this.mouse.dragStart.y,
			},
			stop: {
				x: (this.mouse.dragStart.x > event.x) ? this.mouse.dragStart.x : event.x,
				y: (this.mouse.dragStart.y > event.y) ? this.mouse.dragStart.y : event.y,
			}
		};

		//Fix boundaries
		if (drag.start.x < 0) {
			drag.start.x = 0;
		}
		if (drag.start.y < 0) {
			drag.start.y = 0;
		}
		if (drag.stop.x > this.board.width - 1) {
			drag.stop.x = this.board.width - 1;
		}
		if (drag.stop.y > this.board.height - 1) {
			drag.stop.y = this.board.height - 1;
		}

		//Return
		return drag;
	};

	/**
	 * Player extension
	 */
	angular.extend(Player, {

		/**
		 * Mouse coordinate helper vars
		 */
		mouse: {

			//Drag start
			dragStart: null,

			//Last grid coordinates
			lastX: -1,
			lastY: -1
		}
	});

	/**
	 * Player mode definition
	 */
	var PlayerMode = {

		/**
		 * Handler for keydown events
		 */
		keyDown: function(event, keyboardEvent) {

			//No game?
			if (!this.game || !this.game.isLoaded()) {
				return;
			}

			//Switch key code
			switch (keyboardEvent.keyCode) {

				//ESC
				case KeyCodes.ESC:

					//Cancel drag event, and prevent click event as well
					this.mouse.dragStart = null;
					this.preventClickEvent = true;
					break;

				//Right arrow
				case KeyCodes.RIGHT:

					//Arrow navigation enabled?
					if (this.arrowKeysNavigation) {
						keyboardEvent.preventDefault();

						//Advance to the next move
						if (this.tool == PlayerTools.MOVE && this.game.node != this.restrictNodeEnd) {
							this.next();
						}
					}
					break;

				//Left arrow
				case KeyCodes.LEFT:

					//Arrow navigation enabled?
					if (this.arrowKeysNavigation) {
						keyboardEvent.preventDefault();

						//Go to the previous move
						if (this.tool == PlayerTools.MOVE && this.game.node != this.restrictNodeStart) {
							this.previous();
						}
					}
					break;

				//Up arrow
				case KeyCodes.UP:
					break;

				//Down arrow
				case KeyCodes.DOWN:
					break;
			}
		},

		/**
		 * Handler for mousewheel events
		 */
		mouseWheel: function(event, mouseEvent) {

			//Disabled or not using move tool?
			if (!this.scrollWheelNavigation || this.tool != PlayerTools.MOVE) {
				return true;
			}

			//No game?
			if (!this.game || !this.game.isLoaded()) {
				return true;
			}

			//Normalize mousewheel event
			mouseEvent = normalizeMousewheelEvent(mouseEvent);

			//Find delta
			var delta = mouseEvent.mouseWheelY || mouseEvent.deltaY;

			//Next move
			if (delta < 0) {
				if (this.board) {
					this.board.removeAll('hover');
				}
				this.next();
			}

			//Previous move
			else if (delta > 0) {
				if (this.board) {
					this.board.removeAll('hover');
				}
				this.previous();
			}

			//Don't scroll the window
			if (delta !== 0) {
				mouseEvent.preventDefault();
			}
		},

		/**
		 * Mouse out handler
		 */
		mouseOut: function(event, mouseEvent) {
			if (this.board) {
				this.board.removeAll('hover');
			}
		},

		/**
		 * Mouse move handler
		 */
		mouseMove: function(event, mouseEvent) {

			//Attach drag object to events
			if (this.mouse.dragStart && (this.mouse.dragStart.x != event.x || this.mouse.dragStart.y != event.y)) {
				mouseEvent.drag = dragObject.call(this, event);
			}

			//Nothing else to do?
			if (!this.board || !this.board.layers.hover) {
				return;
			}

			//Last coordinates are the same?
			if (this.mouse.lastX == event.x && this.mouse.lastY == event.y) {
				return;
			}

			//Remember last coordinates
			this.mouse.lastX = event.x;
			this.mouse.lastY = event.y;

			//Broadcast hover event
			this.broadcast('hover', mouseEvent);
		},

		/**
		 * Mouse down handler
		 */
		mouseDown: function(event, mouseEvent) {
			this.mouse.dragStart = {
				x: event.x,
				y: event.y
			};
		},

		/**
		 * Mouse up handler
		 */
		mouseUp: function(event, mouseEvent) {
			if (this.mouse.dragStart && (this.mouse.dragStart.x != event.x || this.mouse.dragStart.y != event.y)) {
				mouseEvent.drag = dragObject.call(this, event);
				this.broadcast('mousedrag', mouseEvent);
			}
			this.mouse.dragStart = null;
		}
	};

	//Return
	return PlayerMode;
}]);

/**
 * PlayerModeEdit :: This module governs the "edit" mode of the player, e.g. editing
 * a game record and its board positions.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Edit.Service', [
	'ngGo',
	'ngGo.Game.Scorer.Service'
])

/**
 * Setup tools
 */
.constant('SetupTools', {
	BLACK:		'black',
	WHITE:		'white',
	CLEAR:		'clear'
})

/**
 * Markup tools
 */
.constant('MarkupTools', {
	TRIANGLE:	'triangle',
	CIRCLE:		'circle',
	SQUARE:		'square',
	MARK:		'mark',
	SELECT:		'select',
	SAD:		'sad',
	HAPPY:		'happy',
	TEXT:		'text',
	NUMBER:		'number',
	CLEAR:		'clear'
})

/**
 * Extend player functionality and register the mode
 */
.run(["Player", "PlayerModes", "PlayerModeEdit", function(Player, PlayerModes, PlayerModeEdit) {

	//Register event handlers
	Player.on('pathChange', PlayerModeEdit.pathChange, PlayerModes.EDIT);
	Player.on('toolSwitch', PlayerModeEdit.toolSwitch, PlayerModes.EDIT);
	Player.on('modeEnter', PlayerModeEdit.modeEnter, PlayerModes.EDIT);
	Player.on('mousedrag', PlayerModeEdit.mouseDrag, PlayerModes.EDIT);
	Player.on('keydown', PlayerModeEdit.keyDown, PlayerModes.EDIT);
	Player.on('click', PlayerModeEdit.click, PlayerModes.EDIT);
	Player.on('hover', PlayerModeEdit.hover, PlayerModes.EDIT);

	//Register mode
	Player.registerMode(PlayerModes.EDIT, PlayerModeEdit);
}])

/**
 * Provider definition
 */
.provider('PlayerModeEdit', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

	};

	/**
	 * Set global default configuration for players
	 */
	this.setConfig = function(config) {
		defaultConfig = angular.extend(defaultConfig, config);
	};

	/**
	 * Service getter
	 */
	this.$get = ["Player", "PlayerTools", "SetupTools", "MarkupTools", "MarkupTypes", "GameScorer", "StoneColor", "KeyCodes", function(Player, PlayerTools, SetupTools, MarkupTools, MarkupTypes, GameScorer, StoneColor, KeyCodes) {

		//Character codes
		var aChar = 'A'.charCodeAt(0),
			aCharLc = 'a'.charCodeAt(0);

		/**
		 * Update hover mark at specific coordinates
		 */
		var updateHoverMark = function(x, y, isDrag) {

			//If no coordinates specified, use last mouse coordinates
			if (typeof x == 'undefined' || typeof y == 'undefined') {
				x = this.mouse.lastX;
				y = this.mouse.lastY;
			}

			//Falling outside of grid?
			if (!this.board || !this.board.isOnBoard(x, y)) {
				return;
			}

			//What happens, depends on the active tool
			switch (this.tool) {

				//Setup tool
				case PlayerTools.SETUP:

					//Clear tool
					if (this.setupTool == SetupTools.CLEAR) {

						//Stone present? Can remove it
						if (this.game.hasStone(x, y)) {
							this.board.add('hover', x, y, {
								type: 'markup',
								value: MarkupTypes.MARK
							});
						}
					}

					//Stone color tool
					else {

						//Add or overwrite stone if no stone present of the given color
						if (!this.game.hasStone(x, y, this.setupToolColor())) {
							this.board.add('hover', x, y, {
								type: 'stones',
								value: this.setupToolColor()
							});
						}

						//Stone present of same color? Can remove it if we're not dragging
						else if (!isDrag) {
							this.board.add('hover', x, y, {
								type: 'markup',
								value: MarkupTypes.MARK
							});
						}
					}
					break;

				//Markup tool
				case PlayerTools.MARKUP:

					//Clear tool, or already markup in place?
					if (this.markupTool == MarkupTools.CLEAR || this.game.hasMarkup(x, y)) {
						if (this.game.hasMarkup(x, y)) {
							this.board.add('hover', x, y, {
								type: 'markup',
								value: MarkupTypes.MARK
							});
						}
					}

					//Text or number
					else if (this.markupTool == MarkupTools.TEXT || this.markupTool == MarkupTools.NUMBER) {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: {
								type: MarkupTypes.LABEL,
								text: this.markupLabel
							}
						});
					}

					//Other markup
					else {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: this.markupTool
						});
					}
					break;

				//Move tool
				case PlayerTools.MOVE:

					//Hovering over empty spot where we can make a move?
					if (!this.game.hasStone(x, y) && this.game.isValidMove(x, y)) {
						this.board.add('hover', x, y, {
							type: 'stones',
							value: this.game.getTurn()
						});
					}
					break;

				//Score tool
				case PlayerTools.SCORE:

					//Hovering over a stone means it can be marked dead or alive
					if (this.game.hasStone(x, y)) {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: MarkupTypes.MARK
						});
					}
					break;
			}
		};

		/**
		 * Helper to set markup
		 */
		var setMarkup = function(x, y) {

			//Already markup in place? Remove it first
			if (this.game.hasMarkup(x, y)) {

				//Check what markup there is
				var markup = this.game.getMarkup(x, y);

				//Label? Also remove from our labels list
				if (markup.type == MarkupTypes.LABEL && markup.text) {
					var i = this.markupLabels.indexOf(markup.text);
					if (i != -1) {
						this.markupLabels.splice(i, 1);
					}
				}

				//Remove from game
				this.game.removeMarkup(x, y);
				return;
			}

			//Clear tool used? Done
			if (this.markupTool == MarkupTools.CLEAR) {
				return;
			}

			//Text
			else if (this.markupTool == MarkupTools.TEXT) {
				this.game.addMarkup(x, y, {
					type: MarkupTypes.LABEL,
					text: this.markupLabel
				});

				//Determine next text label
				this.markupLabels.push(this.markupLabel);
				this.determineMarkupLabel();
			}

			//Number
			else if (this.markupTool == MarkupTools.NUMBER) {
				this.game.addMarkup(x, y, {
					type: MarkupTypes.LABEL,
					text: this.markupLabel
				});

				//Determine next number label
				this.markupLabels.push(this.markupLabel);
				this.determineMarkupLabel();
			}

			//Other markup
			else {
				this.game.addMarkup(x, y, this.markupTool);
			}
		};

		/**
		 * Helper to set a stone
		 */
		var setStone = function(x, y, isDrag) {

			//Get the stone color
			var color = this.setupToolColor();

			//Trying to remove a stone
			if (color === StoneColor.EMPTY) {
				this.game.removeStone(x, y);
			}

			//Adding a stone
			else {

				//A stone there already of the same color? Just remove if not dragging
				if (!isDrag && this.game.hasStone(x, y, color)) {
					this.game.removeStone(x, y);
					return;
				}

				//Any stone present?
				else if (this.game.hasStone(x, y)) {
					this.game.removeStone(x, y);
				}

				//Add stone now
				this.game.addStone(x, y, color);
			}

			//Redraw markup
			this.board.layers.markup.redrawCell(x, y);
		};

		/**
		 * Find all markup labels in current position
		 */
		var findAllMarkupLabels = function() {

			//Clear
			this.markupLabels = [];

			//Must have game
			if (!this.game || !this.game.isLoaded()) {
				return;
			}

			//Get all markup from position
			var markup = this.game.position.markup.all('type');
			for (var i = 0; i < markup.length; i++) {
				if (markup[i].type == MarkupTypes.LABEL && markup[i].text !== '') {
					this.markupLabels.push(markup[i].text);
				}
			}
		};

		/**
		 * Player extension
		 */
		angular.extend(Player, {

			//Active setup tool and markup tool
			setupTool: SetupTools.BLACK,
			markupTool: MarkupTools.TRIANGLE,

			//Current markup labels on the board and current markup label
			markupLabels: [],
			markupLabel: '',

			/**
			 * Set the setup tool
			 */
			switchSetupTool: function(tool) {
				this.setupTool = tool;
			},

			/**
			 * Set the markup tool
			 */
			switchMarkupTool: function(tool) {
				this.markupTool = tool;
				if (this.markupTool == MarkupTools.TEXT || this.markupTool == MarkupTools.NUMBER) {
					this.determineMarkupLabel();
				}
			},

			/**
			 * Conversion of setup tool to stone color
			 */
			setupToolColor: function() {
				switch (this.setupTool) {
					case SetupTools.BLACK:
						return StoneColor.B;
					case SetupTools.WHITE:
						return StoneColor.W;
					default:
						return StoneColor.EMPTY;
				}
			},

			/**
			 * Set the new text markup label
			 */
			setMarkupLabel: function(label) {
				if (label) {
					this.markupLabel = label;
				}
			},

			/**
			 * Determine the new text markup label
			 */
			determineMarkupLabel: function() {

				//Clear
				this.markupLabel = '';

				//Check what tool we're using
				switch (this.markupTool) {

					//Text tool?
					case MarkupTools.TEXT:
						var i = 0;

						//Loop while the label is present
						while (!this.markupLabel || this.markupLabels.indexOf(this.markupLabel) != -1) {

							//A-Z
							if (i < 26) {
								this.markupLabel = String.fromCharCode(aChar + i);
							}

							//a-z
							else if (i < 52) {
								this.markupLabel = String.fromCharCode(aCharLc + i - 26);
							}

							//AA, AB, AC, etc.
							else {
								this.markupLabel = String.fromCharCode(aChar + Math.floor(i / 26) - 2) + String.fromCharCode(aChar + (i % 26));
							}

							//Keep going
							i++;
						}
						break;

					//Number tool?
					case MarkupTools.NUMBER:
						this.markupLabel = 0;

						//Loop while the label is present
						while (this.markupLabel === 0 || this.markupLabels.indexOf(this.markupLabel) != -1) {
							this.markupLabel++;
						}
						break;
				}
			}
		});

		/**
		 * Player mode definition
		 */
		var PlayerModeEdit = {

			/**
			 * Hover handler
			 */
			hover: function(event) {

				//Must have board
				if (!this.board) {
					return;
				}

				//Remove all hover items
				this.board.removeAll('hover');

				//Single coordinate?
				if (!event.drag || (this.tool != PlayerTools.SETUP && this.tool != PlayerTools.MARKUP)) {
					updateHoverMark.call(this);
					return;
				}

				//No dragging for labels
				if (this.markupTool == MarkupTools.TEXT || this.markupTool == MarkupTools.NUMBER) {
					updateHoverMark.call(this);
					return;
				}

				//Loop area
				for (var x = event.drag.start.x; x <= event.drag.stop.x; x++) {
					for (var y = event.drag.start.y; y <= event.drag.stop.y; y++) {
						updateHoverMark.call(this, x, y, true);
					}
				}
			},

			/**
			 * Keydown handler
			 */
			keyDown: function(event, keyboardEvent) {

				//Switch key code
				switch (keyboardEvent.keyCode) {

					//TODO: tool switching via keyboard input
				}
			},

			/**
			 * Click handler
			 */
			click: function(event, mouseEvent) {

				//Falling outside of grid?
				if (!this.board || !this.board.isOnBoard(event.x, event.y)) {
					return;
				}

				//Remove all hover items now to restore actual stones and markup to the board,
				//otherwise it will conflict when updating the board
				this.board.removeAll('hover');

				//What happens, depends on the active tool
				switch (this.tool) {

					//Move tool
					case PlayerTools.MOVE:

						//Try to play the move
						if (!this.game.play(event.x, event.y)) {
							return;
						}
						this.processPosition();
						break;

					//Setup tool
					case PlayerTools.SETUP:

						//Set stone and update board
						setStone.call(this, event.x, event.y);
						this.processPosition();
						break;

					//Markup tool
					case PlayerTools.MARKUP:

						//Set markup and update board
						setMarkup.call(this, event.x, event.y);
						this.processPosition();
						break;

					//Score tool, mark stones dead or alive
					case PlayerTools.SCORE:

						//Mark the clicked item and score the current game position
						GameScorer.mark(event.x, event.y);
						this.scoreGame();
						break;
				}

				//Handle hover
				PlayerModeEdit.hover.call(this, event);
			},

			/**
			 * Mouse drag handler
			 */
			mouseDrag: function(event, mouseEvent) {

				//Initialize vars
				var x, y;

				//Remove all hover items now to restore actual stones and markup to the board,
				//otherwise it will conflict when updating the board
				if (this.board) {
					this.board.removeAll('hover');
				}

				//What happens, depends on the active tool
				switch (this.tool) {

					//Setup tool
					case PlayerTools.SETUP:

						//Loop dragging grid
						for (x = event.drag.start.x; x <= event.drag.stop.x; x++) {
							for (y = event.drag.start.y; y <= event.drag.stop.y; y++) {
								setStone.call(this, x, y, true);
							}
						}

						//Process position
						this.processPosition();
						break;

					//Markup tool
					case PlayerTools.MARKUP:

						//Don't do this for labels
						if (this.markupTool == MarkupTools.TEXT || this.markupTool == MarkupTools.NUMBER) {
							break;
						}

						//Loop dragging grid
						for (x = event.drag.start.x; x <= event.drag.stop.x; x++) {
							for (y = event.drag.start.y; y <= event.drag.stop.y; y++) {
								setMarkup.call(this, x, y);
							}
						}

						//Process position
						this.processPosition();
						break;
				}

				//Handle hover
				PlayerModeEdit.hover.call(this, event);
			},

			/**
			 * Path change
			 */
			pathChange: function(event, node) {
				findAllMarkupLabels.call(this);
			},

			/**
			 * Handler for mode entry
			 */
			modeEnter: function(event) {

				//Set available tools for this mode
				this.setTools([
					PlayerTools.MOVE,
					PlayerTools.SETUP,
					PlayerTools.MARKUP,
					PlayerTools.SCORE
				]);

				//Set default tool
				this.tool = this.tools[0];

				//Find all markup labels in the current game position
				findAllMarkupLabels.call(this);
			},

			/**
			 * Handler for tool switches
			 */
			toolSwitch: function(event) {

				//Switched to scoring?
				if (this.tool == PlayerTools.SCORE) {

					//Remember the current board state
					this.statePreScoring = this.board.getState();

					//Load game into scorer and score the game
					GameScorer.load(this.game);
					this.scoreGame();
				}

				//Back to another state?
				else {
					if (this.statePreScoring) {
						this.board.restoreState(this.statePreScoring);
						delete this.statePreScoring;
					}
				}
			}
		};

		//Return
		return PlayerModeEdit;
	}];
});

/**
 * PlayerModeReplay :: This module governs the "replay" mode of the player, e.g. traversing through an
 * existing game record without the ability to deviate from the tree or its variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Replay.Service', [
	'ngGo',
	'ngGo.Game.Scorer.Service'
])

/**
 * Extend player functionality and register the mode
 */
.run(["Player", "PlayerModes", "PlayerModeReplay", function(Player, PlayerModes, PlayerModeReplay) {

	//Register event handlers
	Player.on('settingChange', PlayerModeReplay.settingChange, PlayerModes.REPLAY);
	Player.on('boardUpdate', PlayerModeReplay.boardUpdate, PlayerModes.REPLAY);
	Player.on('pathChange', PlayerModeReplay.pathChange, PlayerModes.REPLAY);
	Player.on('toolSwitch', PlayerModeReplay.toolSwitch, PlayerModes.REPLAY);
	Player.on('modeEnter', PlayerModeReplay.modeEnter, PlayerModes.REPLAY);
	Player.on('modeExit', PlayerModeReplay.modeExit, PlayerModes.REPLAY);
	Player.on('click', PlayerModeReplay.click, PlayerModes.REPLAY);
	Player.on('hover', PlayerModeReplay.hover, PlayerModes.REPLAY);

	//Register the mode
	Player.registerMode(PlayerModes.REPLAY, PlayerModeReplay);
}])

/**
 * Provider definition
 */
.provider('PlayerModeReplay', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Auto play delay
		auto_play_delay: 1000
	};

	/**
	 * Set global default configuration for players
	 */
	this.setConfig = function(config) {
		defaultConfig = angular.extend(defaultConfig, config);
	};

	/**
	 * Service getter
	 */
	this.$get = ["$interval", "Player", "PlayerModes", "PlayerTools", "MarkupTypes", "GameScorer", function($interval, Player, PlayerModes, PlayerTools, MarkupTypes, GameScorer) {

		/**
		 * Helper to update the hover mark
		 */
		var updateHoverMark = function(x, y) {

			//If no coordinates specified, use last mouse coordinates
			if (typeof x == 'undefined' || typeof y == 'undefined') {
				x = this.mouse.lastX;
				y = this.mouse.lastY;
			}

			//Falling outside of grid?
			if (!this.board || !this.board.isOnBoard(x, y)) {
				return;
			}

			//What happens, depends on the active tool
			switch (this.tool) {

				//Move tool
				case PlayerTools.MOVE:

					//Hovering over empty spot where we can make a move?
					if (!this.game.hasStone(x, y) && this.game.isMoveVariation(x, y)) {
						this.board.add('hover', x, y, {
							type: 'stones',
							value: this.game.getTurn()
						});
					}
					break;

				//Score tool
				case PlayerTools.SCORE:

					//Hovering over a stone means it can be marked dead or alive
					if (this.game.hasStone(x, y)) {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: MarkupTypes.MARK
						});
					}
					break;
			}
		};

		/**
		 * Helper to show move variations on the board
		 */
		var showMoveVariations = function(variations) {
			for (var i = 0; i < variations.length; i++) {

				//Auto variation markup should never overwrite existing markup
				if (this.board.has('markup', variations[i].move.x, variations[i].move.y)) {
					continue;
				}

				//Add to board
				this.board.add('markup', variations[i].move.x, variations[i].move.y, {
					type: this.board.theme.get('markup.variation.type'),
					text: this.board.theme.get('markup.variation.text', i),
					color: this.board.theme.get('markup.variation.color')
				});
			}
		};

		/**
		 * Helper to hide move variations from the board
		 */
		var hideMoveVariations = function(variations) {
			for (var i = 0; i < variations.length; i++) {
				this.board.remove('markup', variations[i].move.x, variations[i].move.y);
			}
		};

		/**
		 * Draw (or clear) move variations on the board
		 */
		var drawMoveVariations = function(show) {

			//Check if we can do something
			if (!this.board || !this.game || !this.game.isLoaded()) {
				return;
			}

			//Get the current node
			var node = this.game.getNode(), variations;
			if (!node) {
				return;
			}

			//Child variations?
			if (this.variationChildren && node.hasMoveVariations()) {
				variations = node.getMoveVariations();
				if (show) {
					showMoveVariations.call(this, variations);
				}
				else {
					hideMoveVariations.call(this, variations);
				}
			}

			//Sibling variations?
			if (this.variationSiblings && node.parent && node.parent.hasMoveVariations()) {
				variations = node.parent.getMoveVariations();
				if (show) {
					showMoveVariations.call(this, variations);
				}
				else {
					hideMoveVariations.call(this, variations);
				}
			}
		};

		/**
		 * Player extension
		 */
		angular.extend(Player, {

			//Auto play vars
			autoPlaying: false,
			autoPlayDelay: 1000,
			autoPlayPromise: null,

			/**
			 * Set auto play delay
			 */
			setAutoPlayDelay: function(delay) {
				if (this.autoPlayDelay != delay) {
					this.autoPlayDelay = delay;
					this.broadcast('settingChange', 'autoPlayDelay');
				}
			},

			/**
			 * Start auto play with a given delay
			 */
			start: function(delay) {

				//Not in replay mode or already auto playing?
				if (this.mode != PlayerModes.REPLAY || this.autoPlaying) {
					return;
				}

				//Already auto playing, no game or no move children?
				if (!this.game || !this.game.node.hasChildren()) {
					return;
				}

				//Get self
				var self = this;

				//Determine delay
				delay = (typeof delay == 'number') ? delay : this.autoPlayDelay;

				//Switch tool
				this.switchTool(PlayerTools.NONE);

				//Create interval
				this.autoPlaying = true;
				this.autoPlayPromise = $interval(function() {

					//Advance to the next node
					self.next(0, true);

					//Ran out of children?
					if (!self.game.node.hasChildren()) {
						self.stop();
					}
				}, delay);

				//Broadcast event
				this.broadcast('autoPlayStarted', this.game.node);
			},

			/**
			 * Stop auto play
			 */
			stop: function() {

				//Not in replay mode or not auto playing?
				if (this.mode != PlayerModes.REPLAY || !this.autoPlaying) {
					return;
				}

				//Cancel interval
				if (this.autoPlayPromise) {
					$interval.cancel(this.autoPlayPromise);
				}

				//Clear flags
				this.autoPlayPromise = null;
				this.autoPlaying = false;

				//Broadcast event
				this.broadcast('autoPlayStopped', this.game.node);
			}
		});

		/**
		 * Player mode definition
		 */
		var PlayerModeReplay = {

			/**
			 * Parse config instructions
			 */
			parseConfig: function(config) {

				//Extend from default config
				this.config = angular.extend({}, this.config, defaultConfig, config || {});

				//Process settings
				this.setAutoPlayDelay(this.config.auto_play_delay);
			},

			/**
			 * Setting changes handler
			 */
			settingChange: function(event, setting) {

				//Solution paths setting changes?
				if (setting == 'variationMarkup') {
					drawMoveVariations.call(this, this.variationMarkup);
				}
			},

			/**
			 * Hover handler
			 */
			hover: function(event) {

				//Update hover mark
				if (this.board) {
					this.board.removeAll('hover');
					updateHoverMark.call(this);
				}
			},

			/**
			 * Board update event handler
			 */
			boardUpdate: function(event, node) {

				//Show move variations
				if (this.variationMarkup) {
					drawMoveVariations.call(this, true);
				}
			},

			/**
			 * Handler for mouse click events
			 */
			click: function(event, mouseEvent) {

				//Falling outside of grid?
				if (!this.board || !this.board.isOnBoard(event.x, event.y)) {
					return;
				}

				//What happens, depends on the active tool
				switch (this.tool) {

					//Move tool
					case PlayerTools.MOVE:

						//Check if we clicked a move variation, advance to the next position if so
						if (this.game.isMoveVariation(event.x, event.y)) {
							this.next(this.game.getMoveVariation(event.x, event.y));
						}
						break;

					//Score tool, mark stones dead or alive
					case PlayerTools.SCORE:

						//Mark the clicked item and score the current game position
						GameScorer.mark(event.x, event.y);
						this.scoreGame();
						break;
				}

				//Handle hover
				PlayerModeReplay.hover.call(this, event);
			},

			/**
			 * Path change event
			 */
			pathChange: function(event, node) {

				//Update hover mark
				if (this.board) {
					this.board.removeAll('hover');
					updateHoverMark.call(this);
				}
			},

			/**
			 * Handler for mode entry
			 */
			modeEnter: function(event) {

				//Set available tools for this mode
				this.setTools([
					PlayerTools.MOVE,
					PlayerTools.SCORE,
					PlayerTools.NONE
				]);

				//Set default tool
				this.tool = this.tools[0];

				//Show move variations
				if (this.variationMarkup) {
					drawMoveVariations.call(this, true);
				}
			},

			/**
			 * Handler for mode exit
			 */
			modeExit: function(event) {

				//Stop auto playing
				if (this.autoPlaying) {
					this.stop();
				}

				//Hide move variations
				if (this.variationMarkup) {
					drawMoveVariations.call(this, false);
				}
			},

			/**
			 * Handler for tool switches
			 */
			toolSwitch: function(event) {

				//Switched to scoring?
				if (this.tool == PlayerTools.SCORE) {

					//Remember the current board state
					this.statePreScoring = this.board.getState();

					//Load game into scorer and score the game
					GameScorer.load(this.game);
					this.scoreGame();
				}

				//Back to another state?
				else {
					if (this.statePreScoring) {
						this.board.restoreState(this.statePreScoring);
						delete this.statePreScoring;
					}
				}
			}
		};

		//Return
		return PlayerModeReplay;
	}];
});

/**
 * PlayerModeSolve :: This module governs the "solve" mode of the player, e.g. trying to solve
 * go problems and finding the right move or variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Solve.Service', [
	'ngGo'
])

/**
 * Extend player functionality and register the mode
 */
.run(["Player", "PlayerModes", "PlayerModeSolve", function(Player, PlayerModes, PlayerModeSolve) {

	//Register event handlers
	Player.on('settingChange', PlayerModeSolve.settingChange, PlayerModes.SOLVE);
	Player.on('boardUpdate', PlayerModeSolve.boardUpdate, PlayerModes.SOLVE);
	Player.on('pathChange', PlayerModeSolve.pathChange, PlayerModes.SOLVE);
	Player.on('modeEnter', PlayerModeSolve.modeEnter, PlayerModes.SOLVE);
	Player.on('modeExit', PlayerModeSolve.modeExit, PlayerModes.SOLVE);
	Player.on('keydown', PlayerModeSolve.keyDown, PlayerModes.SOLVE);
	Player.on('click', PlayerModeSolve.click, PlayerModes.SOLVE);
	Player.on('hover', PlayerModeSolve.hover, PlayerModes.SOLVE);

	//Register mode
	Player.registerMode(PlayerModes.SOLVE, PlayerModeSolve);
}])

/**
 * Provider definition
 */
.provider('PlayerModeSolve', ["StoneColor", function(StoneColor) {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Player color
		player_color: StoneColor.B,

		//Show solution paths
		solution_paths: false,

		//Auto play settings
		solve_auto_play: true,
		solve_auto_play_delay: 500
	};

	/**
	 * Set global default configuration for players
	 */
	this.setConfig = function(config) {
		defaultConfig = angular.extend(defaultConfig, config);
	};

	/**
	 * Service getter
	 */
	this.$get = ["$timeout", "Player", "PlayerModes", "PlayerTools", "KeyCodes", function($timeout, Player, PlayerModes, PlayerTools, KeyCodes) {

		/**
		 * Check if we can make a move
		 */
		var canMakeMove = function() {

			//We can make a move when...

			//...there is no auto play going on
			if (!this.solveAutoPlay) {
				return true;
			}

			//...we solved the puzzle already
			if (this.problemSolved) {
				return true;
			}

			//...we are off path
			if (this.problemOffPath) {
				return true;
			}

			//...it's our turn
			if (this.game.getTurn() == this.playerColor) {
				return true;
			}

			//Otherwise, we can't make a move
			return false;
		};

		/**
		 * Helper to update the hover mark
		 */
		var updateHoverMark = function(x, y) {

			//If no coordinates specified, use last mouse coordinates
			if (typeof x == 'undefined' || typeof y == 'undefined') {
				x = this.mouse.lastX;
				y = this.mouse.lastY;
			}

			//Falling outside of grid?
			if (!this.board || !this.board.isOnBoard(x, y)) {
				return;
			}

			//What happens, depends on the active tool
			switch (this.tool) {

				//Move tool
				case PlayerTools.MOVE:

					//Hovering over empty spot where we can make a move?
					if (canMakeMove.call(this) && this.game.isValidMove(x, y)) {
						this.board.add('hover', x, y, {
							type: 'stones',
							value: this.game.getTurn()
						});
					}
					break;
			}
		};

		/**
		 * Helper to show solution paths
		 */
		var showSolutionPaths = function(variations) {
			for (var i = 0; i < variations.length; i++) {
				if (variations[i].solution === true) {
					this.board.add('markup', variations[i].move.x, variations[i].move.y, {
						type: this.board.theme.get('markup.solution.valid.type'),
						text: this.board.theme.get('markup.solution.valid.text', i),
						scale: this.board.theme.get('markup.solution.valid.scale'),
						color: this.board.theme.get('markup.solution.valid.color')
					});
				}
				else {
					this.board.add('markup', variations[i].move.x, variations[i].move.y, {
						type: this.board.theme.get('markup.solution.invalid.type'),
						text: this.board.theme.get('markup.solution.invalid.text', i),
						scale: this.board.theme.get('markup.solution.invalid.scale'),
						color: this.board.theme.get('markup.solution.invalid.color')
					});
				}
			}
		};

		/**
		 * Helper to hide solution paths
		 */
		var hideSolutionPaths = function(variations) {
			for (var i = 0; i < variations.length; i++) {
				this.board.remove('markup', variations[i].move.x, variations[i].move.y);
			}
		};

		/**
		 * Draw (or clear) solution paths
		 */
		var drawSolutionPaths = function(show) {

			//Check if we can do something
			if (!this.board || !this.game || !this.game.isLoaded()) {
				return;
			}

			//Get node and variations
			var node = this.game.getNode(),
				variations = node.getMoveVariations();

			//When showing, make sure it's not during the auto solver's move
			if (show && !this.problemSolved && this.solveAutoPlay) {
				if (this.game.getTurn() != this.playerColor) {
					hideSolutionPaths.call(this, variations);
					return;
				}
			}

			//Call helper
			if (show) {
				showSolutionPaths.call(this, variations);
			}
			else {
				hideSolutionPaths.call(this, variations);
			}
		};

		/**
		 * Player extension
		 */
		angular.extend(Player, {

			//Solved and off-path flags
			problemSolved: false,
			problemOffPath: false,

			//Problem start path
			problemStartPath: null,

			//The player color
			playerColor: 0,

			//Solution paths
			solutionPaths: false,

			//Auto play vars
			solveAutoPlay: true,
			solveAutoPlayDelay: 500,

			//Navigation blocked flag
			solveNavigationBlocked: false,

			/**
			 * Set solve auto play delay
			 */
			setSolveAutoPlay: function(autoPlay) {
				if (this.solveAutoPlay != autoPlay) {
					this.solveAutoPlay = autoPlay;
					this.broadcast('settingChange', 'solveAutoPlay');
				}
			},

			/**
			 * Set solve auto play delay
			 */
			setSolveAutoPlayDelay: function(delay) {
				if (this.solveAutoPlayDelay != delay) {
					this.solveAutoPlayDelay = delay;
					this.broadcast('settingChange', 'solveAutoPlayDelay');
				}
			},

			/**
			 * Set player color
			 */
			setPlayerColor: function(color) {
				if (this.playerColor != color) {
					this.playerColor = color;
					this.broadcast('settingChange', 'playerColor');
				}
			},

			/**
			 * Get player color
			 */
			getPlayerColor: function(asOnBoard) {
				if (asOnBoard && this.board) {
					return this.board.colorMultiplier * this.playerColor;
				}
				return this.playerColor;
			},

			/**
			 * Toggle solution paths
			 */
			toggleSolutionPaths: function(solutionPaths) {

				//Toggle if not given
				if (typeof solutionPaths == 'undefined') {
					solutionPaths = !this.solutionPaths;
				}

				//Change?
				if (solutionPaths != this.solutionPaths) {
					this.solutionPaths = solutionPaths;
					this.broadcast('settingChange', 'solutionPaths');
				}
			},

			/**
			 * Auto play next move
			 */
			autoPlayNext: function(immediately) {

				//Must have game and children
				if (!this.game || !this.game.isLoaded() || this.game.node.children.length === 0) {
					return;
				}

				//Init vars
				var children = [], self = this, i;

				//When picking a child node, we always prefer to pick a valid solution
				for (i = 0; i < this.game.node.children.length; i++) {
					if (this.game.node.children[i].solution) {
						children.push(this.game.node.children[i]);
					}
				}

				//No solution nodes? Just use all nodes then.
				if (children.length === 0) {
					children = this.game.node.children;
				}

				//Pick a random child node
				i = Math.floor(Math.random() * children.length);

				//No delay?
				if (immediately || !this.solveAutoPlayDelay) {
					this.next(children[i]);
					return;
				}

				//Block navigation and run the timeout
				this.solveNavigationBlocked = true;
				$timeout(function() {

					//Move to next move and unblock navigation
					self.next(children[i]);
					self.solveNavigationBlocked = false;

				}, this.solveAutoPlayDelay);
			},

			/**
			 * Start solving from the current game node
			 */
			solve: function() {

				//Must have a game
				if (!this.game || !this.game.isLoaded()) {
					return false;
				}

				//Reset flags
				this.problemSolved = false;
				this.problemOffPath = false;

				//Remember problem start path
				this.problemStartPath = this.game.getPath(true);

				//Restrict start of navigation to the current node
				this.restrictNode();

				//Auto play next move if it's not our turn
				if (this.solveAutoPlay && this.game.getTurn() != this.playerColor) {
					this.autoPlayNext();
				}
			},

			/**
			 * Restart the problem
			 */
			restartProblem: function() {

				//Must be in solve mode, must have game
				if (this.mode != PlayerModes.SOLVE || !this.game || !this.game.isLoaded()) {
					return;
				}

				//Reset flags
				this.problemSolved = false;
				this.problemOffPath = false;

				//Go back to the start path
				if (this.problemStartPath) {
					this.goto(this.problemStartPath);
				}

				//Auto play next move if it's not our turn
				if (this.solveAutoPlay && this.game.getTurn() != this.playerColor) {
					this.autoPlayNext();
				}
			}
		});

		/**
		 * Player mode definition
		 */
		var PlayerModeSolve = {

			/**
			 * Parse config instructions
			 */
			parseConfig: function(config) {

				//Extend from default config
				this.config = angular.extend({}, this.config, defaultConfig, config || {});

				//Process settings
				this.toggleSolutionPaths(this.config.solution_paths);
				this.setPlayerColor(this.config.player_color);
				this.setSolveAutoPlay(this.config.solve_auto_play);
				this.setSolveAutoPlayDelay(this.config.solve_auto_play_delay);
			},

			/**
			 * Setting changes handler
			 */
			settingChange: function(event, setting) {

				//Solution paths setting changes?
				if (setting == 'solutionPaths')	{
					drawSolutionPaths.call(this, this.solutionPaths);
				}

				//Player color changed?
				if (setting == 'playerColor') {

					//Draw (or hide) solution paths
					drawSolutionPaths.call(this, this.solutionPaths);

					//Make an auto play move if it's not our turn
					if (!this.problemSolved && this.solveAutoPlay && this.game.getTurn() != this.playerColor) {
						this.autoPlayNext(true);
					}
				}
			},

			/**
			 * Hover handler
			 */
			hover: function(event) {

				//Update hover mark
				if (this.board) {
					this.board.removeAll('hover');
					updateHoverMark.call(this, event.x, event.y);
				}
			},

			/**
			 * Board update event handler
			 */
			boardUpdate: function(event, node) {

				//Show move variations
				if (this.solutionPaths) {
					drawSolutionPaths.call(this, true);
				}
			},

			/**
			 * Handler for keydown events
			 */
			keyDown: function(event, keyboardEvent) {

				//Switch key code
				switch (keyboardEvent.keyCode) {

					//Right arrow
					case KeyCodes.RIGHT:

						//Arrow keys navigation enabled?
						if (this.arrowKeysNavigation) {
							keyboardEvent.preventDefault();

							//Navigation not blocked?
							if (!this.solveNavigationBlocked && this.game.node != this.restrictNodeEnd) {

								//Go forward one move if solved
								if (this.problemSolved) {
									this.next();
								}
							}
						}
						break;

					//Left arrow
					case KeyCodes.LEFT:

						//Arrow keys navigation enabled?
						if (this.arrowKeysNavigation) {
							keyboardEvent.preventDefault();

							//Navigation not blocked and not reached the start?
							if (!this.solveNavigationBlocked && this.game.node != this.restrictNodeStart) {

								//Go back one move
								this.previous();

								//Go back one more if this is not the player's turn and if
								//the problem hasn't been solved yet
								if (!this.problemSolved && this.solveAutoPlay && this.game.getTurn() == -this.playerColor) {
									this.previous();
								}
							}
						}
						break;
				}
			},

			/**
			 * Handler for mouse click events
			 */
			click: function(event, mouseEvent) {

				//Falling outside of grid?
				if (!this.board || !this.board.isOnBoard(event.x, event.y)) {
					return;
				}

				//A valid variation
				if (this.game.isMoveVariation(event.x, event.y)) {

					//Get the node
					var i = this.game.getMoveVariation(event.x, event.y);

					//Advance to the next position and get the next node
					this.next(i);
					var node = this.game.getNode();

					//No children left? Check if we solved it or not
					if (node.children.length === 0) {
						if (node.solution === true) {
							this.problemSolved = true;
							this.broadcast('solutionFound', node);
						}
						else {
							this.broadcast('solutionWrong', node);
						}
					}

					//Auto-play next move?
					else if (!this.problemSolved && this.solveAutoPlay) {
						this.autoPlayNext();
					}
				}

				//Unknown variation, try to play
				else if (this.game.play(event.x, event.y)) {
					this.problemOffPath = true;
					this.processPosition();
					this.broadcast('solutionOffPath', this.game.getNode());
				}
			},

			/**
			 * Path change event
			 */
			pathChange: function(event, node) {

				//Update hover mark
				if (this.board) {
					this.board.removeAll('hover');
					updateHoverMark.call(this);
				}
			},

			/**
			 * Handler for mode entry
			 */
			modeEnter: function(event) {

				//Set available tools for this mode
				this.setTools([
					PlayerTools.MOVE
				]);

				//Set default tool
				this.tool = this.tools[0];

				//Draw solution variations
				if (this.solutionPaths) {
					drawSolutionPaths.call(this, true);
				}
			},

			/**
			 * Handler for mode exit
			 */
			modeExit: function(event) {

				//Hide any solution variations
				if (this.solutionPaths) {
					drawSolutionPaths.call(this, false);
				}
			}
		};

		//Return
		return PlayerModeSolve;
	}];
}]);

/**
 * Utility functions
 */

/**
 * Angular extend deep implementation
 */
if (typeof angular.extendDeep == 'undefined') {
	angular.extendDeep = function(dest) {
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i] != dest) {
				for (var k in arguments[i]) {
					if (dest[k] && dest[k].constructor && dest[k].constructor === Object) {
						angular.extendDeep(dest[k], arguments[i][k]);
					}
					else {
						dest[k] = angular.copy(arguments[i][k]);
					}
				}
			}
		}
		return dest;
	};
}

/**
 * Normalize the mousewheel event
 */
function normalizeMousewheelEvent(event) {

	//Initialize vars
	var deltaX = 0, deltaY = 0;

	//Old school scrollwheel delta
	if ('detail' in event) {
		deltaY = event.detail * -1;
	}
	if ('wheelDelta' in event) {
		deltaY = event.wheelDelta;
	}
	if ('wheelDeltaY' in event) {
		deltaY = event.wheelDeltaY;
	}
	if ('wheelDeltaX' in event) {
		deltaX = event.wheelDeltaX * -1;
	}

	// Firefox < 17 horizontal scrolling related to DOMMouseScroll event
	if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
		deltaX = deltaY * -1;
		deltaY = 0;
	}

	//New type wheel delta (WheelEvent)
	if ('deltaY' in event) {
		deltaY = event.deltaY * -1;
	}
	if ('deltaX' in event) {
		deltaX = event.deltaX;
	}

	//Set in event (have to use different property name because of strict mode)
	event.mouseWheelX = deltaX;
	event.mouseWheelY = deltaY;

	//Return
	return event;
}
})(window, window.angular);