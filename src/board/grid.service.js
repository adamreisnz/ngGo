
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
.factory('BoardGrid', function(BoardGridChanges) {

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
});