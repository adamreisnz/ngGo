
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
	'ngGo.Service',
	'ngGo.Board.Directive',
	'ngGo.Board.Theme.Service',
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

		//Default size
		//Note that the default size is left at 0 intentionally, to prevent needless re-draws when loading SGF/JGF data
		//You can change this via BoardProvider.setConfig() or via a size attribute on the board element in HTML
		defaultSize: 0,

		//Show coordinates?
		coordinates: false,

		//Section of board to display
		section: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		},

		//Margin size (factor of the lesser of available width and height)
		margin: 0.04
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
	this.$get = function(BoardTheme, StoneColor, Stone, Markup) {

		/**
		 * Helper to (re)calculate cellsize and margins
		 */
		var calcCellSizeAndMargins = function() {

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
		var Board = function(config) {

			//Extend config
			this.config = angular.extend({}, defaultConfig, config || {});

			//Set board theme
			this.theme = new BoardTheme(this.config.theme);

			//Initialize board draw dimensions in pixels
			this.drawWidth = 0;
			this.drawHeight = 0;

			//Color multiplier (to allow color swapping)
			this.colorMultiplier = 1;

			//Initialize layers
			this.layers = {};

			//Initialize grid size
			this.width = this.height = parseInt(this.config.defaultSize);

			//Set section of board to display and determine resulting grid
			this.section = angular.extend({}, defaultConfig.section, this.config.section);
			this.margin = this.config.margin;
			determineGrid.call(this);
		};

		/***********************************************************************************************
		 * Board setup
		 ***/

		/**
		 * Set margin
		 */
		Board.prototype.setMargin = function(margin) {

			//No change?
			if (this.margin == margin) {
				return;
			}

			//Set margin and call resized handler
			this.margin = margin;
			this.resized();
		};

		/**
		 * Reset margin to config value
		 */
		Board.prototype.resetMargin = function() {
			this.setMargin(this.config.margin);
		};

		/**
		 * Set section of the board to be displayed
		 */
		Board.prototype.setSection = function(section) {

			//Nothing given?
			if (!section) {
				return;
			}

			//Expand on default
			section = angular.extend({}, defaultConfig.section, section);

			//No changes?
			if (this.section.top == section.top && this.section.bottom == section.bottom && this.section.left == section.left && this.section.right == section.right) {
				return;
			}

			//Set section and call resized handler
			this.section = section;
			this.resized();
		};

		/**
		 * Set board size. This will clear the board objects.
		 */
		Board.prototype.setSize = function(width, height) {

			//Check what's given
			width = parseInt(width || height || defaultConfig.defaultSize);
			height = parseInt(height || width || defaultConfig.defaultSize);

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
			determineGrid.call(this);
			calcCellSizeAndMargins.call(this);
			this.redraw();
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
		 * Configuration
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

			//Set in grid
			if (this.layers.grid) {
				this.layers.grid.showCoordinates(this.config.coordinates);
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
		 * Redraw everything
		 */
		Board.prototype.redraw = function() {
			for (var layer in this.layers) {
				this.layers[layer].redraw();
			}
		};

		/**
		 * Swap colors on the board
		 */
		Board.prototype.swapColors = function() {
			this.colorMultiplier = -this.colorMultiplier;
			if (this.layers.stones)	{

				//Clear shadows
				//TODO: this would belong in a stone layer redraw method, but there is no distinct
				//stone layer class. This might be obsolete anyway when we find a better way to handle
				//shadows
				if (this.layers.shadow)	{
					this.layers.shadow.clear();
				}

				//Redraw stones
				this.layers.stones.redraw();
			}
		};

		/**
		 * Get the stone color for a certain coordinate
		 */
		Board.prototype.getStoneColor = function(x, y) {
			if (this.layers.stones) {
				return this.layers.stones.get(x, y);
			}
			return StoneColor.NONE;
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
			return gridX >= 0 && gridY >= 0 && gridX < this.width && gridY < this.height;
		};

		//Return object
		return Board;
	};
});