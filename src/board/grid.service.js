
/**
 * BoardGrid :: This class represents a board grid of a given size. It acts as a container for
 * board objects for the layer classes, as well as a container for stone color values for the game
 * position class. It has built in validation of coordinates.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Grid.Service', [])

/**
 * Factory definition
 */
.factory('BoardGrid', function() {

	/**
	 * Constructor
	 */
	var BoardGrid = function(width, height) {

		//Initialize size and objects array
		this.width = 0;
		this.height = 0;
		this.objects = [];

		//Size given? Set it
		if (width || height) {
			this.setSize(width, height);
		}
	};

	/**
	 * Clone ourselves
	 */
	BoardGrid.prototype.clone = function() {

		//Create new instance
		var newGrid = new BoardGrid();

		//Manually set vars for maximum efficiency
		newGrid.width = this.width;
		newGrid.height = this.height;
		newGrid.objects = angular.copy(this.objects);

		//Return
		return newGrid;
	};

	/**
	 * Add multiple objects at once
	 */
	BoardGrid.prototype.addObjects = function(objects) {
		for (var i = 0; i < objects.length; i++) {
			this.addObject(objects[i]);
		}
	};

	/**
	 * Get all objects
	 */
	BoardGrid.prototype.getObjects = function(flat, cloned) {

		//Flat array of objects?
		if (flat) {
			flat = [];
			for (var x = 0; x < this.width; x++) {
				for (var y = 0; y < this.height; y++) {
					if (this.objects[x][y] !== null) {
						if (cloned) {
							flat.push(angular.copy(this.objects[x][y]));
						}
						else {
							flat.push(this.objects[x][y]);
						}
					}
				}
			}
			return flat;
		}

		//Return grid array
		return cloned ? angular.copy(this.objects) : this.objects;
	};

	/**
	 * Populate the whole grid with the same object (clones the object if object given)
	 */
	BoardGrid.prototype.populateObjects = function(obj) {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				this.objects[x][y] = (typeof obj == 'object') ? angular.copy(obj) : obj;
			}
		}
	};

	/**
	 * Add an object and return the replace object, if any
	 */
	BoardGrid.prototype.addObject = function(obj) {

		//Must have coordinates
		if (typeof obj.x == 'undefined' || typeof obj.y == 'undefined') {
			return;
		}

		//Must be on grid
		if (!this.isOnGrid(obj)) {
			return;
		}

		//Replaced object?
		var objReplaced = this.objects[obj.x][obj.y];

		//Add object
		this.objects[obj.x][obj.y] = obj;
		return objReplaced;
	};

	/**
	 * Remove an object (first param can be an object)
	 */
	BoardGrid.prototype.removeObject = function(x, y) {

		//Object given?
		if (typeof x == 'object') {
			y = x.y;
			x = x.x;
		}

		//Must be on grid
		if (!this.isOnGrid(x, y)) {
			return;
		}

		//Removed object?
		var objRemoved = this.objects[x][y];

		//Remove object
		this.objects[x][y] = null;
		return objRemoved;
	};

	/**
	 * Remove all objects from the grid
	 */
	BoardGrid.prototype.removeObjects = function() {

		//Keep track of removed objects
		var objectsRemoved = [];
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				if (this.objects[x][y] !== null) {
					objectsRemoved.push(this.objects[x][y]);
					this.objects[x][y] = null;
				}
			}
		}

		//Return them
		return objectsRemoved;
	};

	/**
	 * Check if we have an object
	 */
	BoardGrid.prototype.hasObject = function(x, y) {
		return (this.isOnGrid(x, y) && this.objects[x][y] !== null);
	};

	/**
	 * Manually set an item on the grid
	 */
	BoardGrid.prototype.setObject = function(x, y, obj) {
		if (this.isOnGrid(x, y)) {
			this.objects[x][y] = obj;
		}
	};

	/**
	 * Get an object
	 */
	BoardGrid.prototype.getObject = function(x, y, ifInvalid) {

		//If on grid, return the object
		if (this.isOnGrid(x, y)) {
			return this.objects[x][y];
		}

		//Not a valid position
		return (typeof ifInvalid == 'undefined') ? null : ifInvalid;
	};

	/**
	 * Helper to validate coordinates (first param can be an object)
	 */
	BoardGrid.prototype.isOnGrid = function(x, y) {

		//Object given?
		if (typeof x == 'object') {
			y = x.y;
			x = x.x;
		}

		//Validate coordinates
		return (x >= 0 && y >= 0 && x < this.width && y < this.height);
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

		//Create objects array
		this.objects = [];
		for (var x = 0; x < this.width; x++) {
			this.objects[x] = [];
			for (var y = 0; y < this.height; y++) {
				this.objects[x][y] = null;
			}
		}
	};

	/**
	 * Get the grid size object
	 */
	BoardGrid.prototype.getSize = function() {
		return {width: this.width, height: this.height};
	};

	/**
	 * Get the grid width
	 */
	BoardGrid.prototype.getWidth = function() {
		return this.width;
	};

	/**
	 * Get the grid height
	 */
	BoardGrid.prototype.getHeight = function() {
		return this.height;
	};

	//Return
	return BoardGrid;
});