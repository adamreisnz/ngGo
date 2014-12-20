
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
	this.$get = function($rootScope, BoardTheme, GridLayer, ShadowLayer, StonesLayer, MarkupLayer, ScoreLayer, HoverLayer) {

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
	};
});