
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

		//Width and height
		width: 0,
		height: 0,

		//Grid cut-off sides (i.e. ["top", "left"])
		cutoff: [],

		//Section of board to display
		section: null
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
	this.$get = function($rootScope, BoardTheme, GridLayer, ShadowLayer, StonesLayer, MarkupLayer, ScoreLayer, HoverLayer) {

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
			this.drawMarginHor = 0;
			this.drawMarginVer = 0;
			this.gridDrawWidth = 0;
			this.gridDrawHeight = 0;

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

			//Get margin from theme
			this.margin = this.theme.get('board.margin');

			//Width or height given?
			if (typeof width != 'undefined') {
				this.config.width = width;
				this.config.height = height || width;
			}

			//Initialize board
			this.init(this.config);
		};

		/**
		 * Initialize board
		 */
		Board.prototype.init = function(config) {

			//Remove everything
			this.removeAll();

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

			//Cutoff given?
			if (config && config.cutoff) {
				this.setCutoff(config.cutoff);
			}

			//Section given?
			if (config && config.section) {
				this.setSection(config.section);
			}

			//Size given?
			if (config && (config.width || config.height)) {
				this.setSize(config.width, config.height);
			}
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
		 * Set grid cut-off
		 */
		Board.prototype.setCutoff = function(cutoff) {

			//Nothing given?
			if (!cutoff || !angular.isArray(cutoff) || cutoff.length === 0) {
				return this;
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
			var noCellsHor = this.width,
				noCellsVer = this.height;

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

			//Determine cell size with margin
			this.cellSize = Math.floor(Math.min(
				this.drawWidth * (1-this.margin) / noCellsHor,
				this.drawHeight * (1-this.margin) / noCellsVer
			));

			//Determine actual grid draw size
			this.gridDrawWidth = this.cellSize * (noCellsHor - 1);
			this.gridDrawHeight = this.cellSize * (noCellsVer - 1);

			//Determine draw margins
			this.drawMarginHor = Math.floor((this.drawWidth - this.gridDrawWidth) / 2);
			this.drawMarginVer = Math.floor((this.drawHeight - this.gridDrawHeight) / 2);

			//Redraw
			this.redraw();
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
	};
});