
/**
 * Board :: This class represents the Go board. It is a placeholder for all the various board layers
 * and is used for placing and removing objects on the board. The class has helpers to figure out the
 * correct size of the grid cells and to toggle coordinates on or off. This class is responsible for
 * drawing all layers that exist on the board.
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
	'ngGo.Board.Object.StoneFaded.Service',
	'ngGo.Board.Object.Coordinates.Service'
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

		//Show coordinates
		showCoordinates: false,

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
	this.$get = function(BoardTheme, Coordinates, StoneColor, Stone) {

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
			config = config || {};
			this.config = angular.extend(defaultConfig, config);

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

			//Toggle coordinates
			this.toggleCoordinates(this.config.showCoordinates);
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
			section = angular.extend(defaultConfig.section, section);

			//No changes?
			if (this.section.top == section.top && this.section.bottom == section.bottom && this.section.left == section.left && this.section.right == section.right) {
				return;
			}

			//Set section and call resized handler
			this.section = section;
			this.resized();
		};

		/**
		 * Get currently visible section of the board
		 */
		Board.prototype.getSection = function() {
			return this.section;
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
		 * Get the board size
		 */
		Board.prototype.getSize = function() {
			return {width: this.width, height: this.height};
		};

		/**
		 * Set new dimensions
		 */
		Board.prototype.setDimensions = function(width, height) {
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
		 * Layers and drawing
		 ***/

		/**
		 * Add a layer to the board
		 */
		Board.prototype.addLayer = function(name, layer) {
			this.layers[name] = layer;
		};

		/**
		 * Redraw specific layer
		 *
		 * @param	string	Layer name
		 */
		Board.prototype.redrawLayer = function(layer) {

			//Not defined?
			if (typeof this.layers[layer] == 'undefined') {
				return;
			}

			//Redraw layer
			this.layers[layer].redraw();
		};

		/**
		 * Redraw everything
		 */
		Board.prototype.redraw = function() {
			for (var layer in this.layers) {
				this.layers[layer].redraw();
			}
		};

		/***********************************************************************************************
		 * Object handling
		 ***/

		/**
		 * Add object or objects to the board (can be static)
		 */
		Board.prototype.addObject = function(obj, layer) {

			//Multiple objects given?
			if (angular.isArray(obj)) {
				for (var key in obj) {
					this.addObject(obj[key], layer);
				}
				return;
			}

			//Get layer from object if not given
			layer = layer || obj.layer;

			//Validate layer
			if (typeof this.layers[layer] == 'undefined') {
				return;
			}

			//Add object to the layer (the addObject method can filter static objects)
			this.layers[layer].addObject(obj);
		};

		/**
		 * Remove object or objects to the board, pass a string identifier for static objects
		 */
		Board.prototype.removeObject = function(obj, layer) {

			//Multiple objects given?
			if (angular.isArray(obj)) {
				for (var key in obj) {
					this.removeObject(obj[key], layer);
				}
				return;
			}

			//Get layer from object if not given
			layer = layer || obj.layer;

			//Validate layer
			if (typeof this.layers[layer] == 'undefined') {
				return;
			}

			//Remove object from layer
			this.layers[layer].removeObject(obj);
		};

		/**
		 * Remove objects from specific coordinates
		 */
		Board.prototype.removeObjectsAt = function(x, y, restrictLayer) {
			for (var layer in this.layers) {
				if (!restrictLayer || layer == restrictLayer) {
					this.layers[layer].removeObject(x, y);
				}
			}
		};

		/**
		 * Remove all objects from the board
		 */
		Board.prototype.removeAllObjects = function(restrictLayer) {
			for (var layer in this.layers) {
				if (!restrictLayer || layer == restrictLayer) {
					this.layers[layer].removeObjects();
				}
			}
		};

		/**
		 * Check if we have an object at given coordinates and for a given layer
		 */
		Board.prototype.hasObjectAt = function(x, y, layer) {
			return (this.layers[layer] && this.layers[layer].hasObject(x, y));
		};

		/**
		 * Check if the board has a stone on a certain position
		 */
		Board.prototype.hasStoneAt = function(x, y) {
			if (this.layers.stones) {
				var obj = this.layers.stones.getObject(x, y);
				if (obj) {
					return (obj.color == StoneColor.B || obj.color == StoneColor.W);
				}
			}
			return false;
		};

		/**
		 * Get the stone color for a certain coordinate
		 */
		Board.prototype.getStoneColor = function(x, y) {
			if (this.layers.stones) {
				var obj = this.layers.stones.getObject(x, y);
				if (obj) {
					return obj.color;
				}
			}
			return StoneColor.NONE;
		};

		/***********************************************************************************************
		 * Coordinates toggling
		 ***/

		/**
		 * Toggle board coordinates
		 *
		 * @return 	void
		 */
		Board.prototype.toggleCoordinates = function(show) {

			//Toggling?
			if (typeof show == 'undefined') {
				show = !this.coordinates;
			}

			//Show coordinates?
			if (show === true || show === 'true') {
				if (!this.coordinates) {
					this.coordinates = new Coordinates();
					this.setMargin(0.12);
					this.addObject(this.coordinates);
				}
			}

			//Hide them
			else {
				if (this.coordinates) {
					this.removeObject(this.coordinates);
					this.resetMargin();
					this.coordinates = null;
				}
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
					return this.layers[layer].getObjects(true, true);
				}
				return [];
			}

			//All layers
			var state = {}, objects;
			for (layer in this.layers) {
				objects = this.layers[layer].getObjects(true, true);
				if (objects.length) {
					state[layer] = objects;
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
					this.layers[layer].removeObjects();
					this.layers[layer].addObjects(state);
				}
				return;
			}

			//All layers
			for (layer in this.layers) {
				this.layers[layer].removeObjects();
				if (state[layer]) {
					this.layers[layer].addObjects(state[layer]);
				}
			}
		};

		/***********************************************************************************************
		 * Drawing helpers and control methods
		 ***/

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
			var gridX = Math.round((absX - this.drawMargin) / this.cellSize);
			return (gridX > this.grid.xRight || gridX < this.grid.xLeft) ? -1 : gridX;
		};

		/**
		 * Convert pixel coordinate to grid coordinate
		 */
		Board.prototype.getGridY = function(absY) {
			var gridY = Math.round((absY - this.drawMargin) / this.cellSize);
			return (gridY > this.grid.yBot || gridY < this.grid.yTop) ? -1 : gridY;
		};

		//Return object
		return Board;
	};
});