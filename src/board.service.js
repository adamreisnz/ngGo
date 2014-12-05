
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

		//Show coordinates?
		coordinates: false,

		//Section of board to display
		section: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		}
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
	this.$get = function(BoardTheme, StoneColor, GridLayer, ShadowLayer, StonesLayer, MarkupLayer, ScoreLayer, HoverLayer) {

		/**
		 * Helper to (re)calculate cellsize and margins
		 */
		var calcCellSizeAndMargins = function() {

			//Check if there is sensible data
			if (!this.width || !this.height) {
				return;
			}

			//Get draw size, available size and number of cells
			var drawSize = Math.min(this.drawWidth, this.drawHeight),
				availableSize = drawSize * (1-this.margin),
				noCells = Math.max(this.width, this.height);

			//Determine cell size
			this.cellSize = Math.round(availableSize / noCells);

			//Determine draw margin
			this.drawMargin = Math.round((drawSize - availableSize) / 2 + this.cellSize/2);
		};

		/**
		 * Helper to determine the grid to display
		 */
		var determineGrid = function() {
			this.grid = {
				xLeft: 0 + this.section.left,
				xRight: this.width - 1 - this.section.right,
				yTop: 0 + this.section.top,
				yBot: this.height - 1 - this.section.bottom
			};
		};

		/**
		 * Board constructor
		 */
		var Board = function(width, height) {

			//Extend config
			this.config = angular.extend({}, defaultConfig);

			//Set board theme
			this.theme = new BoardTheme();

			//Initialize board draw dimensions in pixels
			this.drawWidth = 0;
			this.drawHeight = 0;
			this.drawMargin = 0;

			//Color multiplier (to allow color swapping)
			this.colorMultiplier = 1;

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

			//Initialize board grid size
			this.width = 0;
			this.height = 0;

			//Set section of board to display and determine resulting grid
			this.section = angular.extend({}, defaultConfig.section, this.config.section);
			this.margin = this.theme.get('board.margin');
			determineGrid.call(this);

			//Set size now if given
			this.setSize(width, height);
		};

		/**
		 * Make this board static (one canvas layer, only grid, stones and markup)
		 */
		Board.prototype.makeStatic = function() {
			this.static = true;
			this.theme.set('stone.style', 'mono');
			this.layerOrder = ['grid', 'stones', 'markup'];
		};

		/***********************************************************************************************
		 * Board setup
		 ***/

		/**
		 * Set margin
		 */
		Board.prototype.setMargin = function(margin) {

			//Set margin if changed
			if (this.margin != margin) {
				this.margin = margin;
				this.resized();
			}

			//Return self for chaining
			return this;
		};

		/**
		 * Reset margin to theme value
		 */
		Board.prototype.resetMargin = function() {
			this.setMargin(this.theme.get('board.margin'));
			return this;
		};

		/**
		 * Set section of the board to be displayed
		 */
		Board.prototype.setSection = function(section) {

			//Nothing given?
			if (!section) {
				return this;
			}

			//Expand on default
			section = angular.extend({}, defaultConfig.section, section);

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

			//Changing?
			if (width != this.width || height != this.height) {

				//Remember size
				this.width = width;
				this.height = height;

				//Set size in layers
				for (var layer in this.layers) {
					this.layers[layer].setSize(width, height);
				}

				//Resized handler
				this.resized();
			}

			//Return self for chaining
			return this;
		};

		/**
		 * Set new draw size
		 */
		Board.prototype.setDrawSize = function(width, height) {
			this.drawWidth = width;
			this.drawHeight = height;
			this.resized();
		};

		/**
		 * Called after a board resize, section change or margin change
		 */
		Board.prototype.resized = function() {

			//Determine the new grid and calculate cell size and margins
			determineGrid.call(this);
			calcCellSizeAndMargins.call(this);

			//Only redraw when there is sensible data
			if (this.width && this.height) {
				this.redraw();
			}
		};

		/*******************************************************************************************************************************
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
		 * Coordinates, color swapping
		 ***/

		/**
		 * Toggle the coordinates
		 */
		Board.prototype.toggleCoordinates = function(show) {

			//Set or toggle
			if (typeof show != 'undefined') {
				this.config.coordinates = show;
			}
			else {
				this.config.coordinates = !this.config.coordinates;
			}

			//Show in grid
			this.layers.grid.showCoordinates(this.config.coordinates);

			//Set the board margin, or reset it
			if (this.config.coordinates) {
				this.setMargin(this.theme.get('coordinates.margin'));
			}
			else {
				this.resetMargin();
			}
		};

		/**
		 * Swap colors on the board
		 */
		Board.prototype.swapColors = function() {
			this.colorMultiplier = -this.colorMultiplier;

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
		 * Board state
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
		 * Drawing helpers and control methods
		 ***/

		/**
		 * Clear the whole board
		 */
		Board.prototype.clear = function() {

			//Static? One clear is enough
			if (this.static) {
				this.layers.stones.clear();
				return;
			}

			//Clear all layers
			for (var layer in this.layers) {
				this.layers[layer].clear();
			}
		};

		/**
		 * Redraw everything
		 */
		Board.prototype.redraw = function(layer) {

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
			return this.drawMargin + Math.round((gridX) * this.cellSize);
		};

		/**
		 * Convert grid coordinate to pixel coordinate
		 */
		Board.prototype.getAbsY = function(gridY) {
			return this.drawMargin + Math.round((gridY) * this.cellSize);
		};

		/**
		 * Convert pixel coordinate to grid coordinate
		 */
		Board.prototype.getGridX = function(absX) {
			return Math.round((absX - this.drawMargin) / this.cellSize);
		};

		/**
		 * Convert pixel coordinate to grid coordinate
		 */
		Board.prototype.getGridY = function(absY) {
			return Math.round((absY - this.drawMargin) / this.cellSize);
		};

		/**
		 * Check if given grid coordinates are on board
		 */
		Board.prototype.isOnBoard = function(gridX, gridY) {
			return gridX >= this.grid.xLeft && gridY >= this.grid.yTop && gridX <= this.grid.xRight && gridY <= this.grid.yBot;
		};

		//Return object
		return Board;
	};
});