
/**
 * BoardLayer :: This class represents a layer on the board and is the base class for all board layers.
 * Each layer can contain it's own objects on a grid with coordinates, as well as static objects
 * without coordinates. Each layer is responsible for drawing itself as well as its objects.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.Service', [
	'ngGo.Board.Grid.Service'
])

/**
 * Factory definition
 */
.factory('BoardLayer', function(BoardGrid) {

	/**
	 * Constructor
	 */
	var BoardLayer = function(board, context) {

		//Remember board reference and 2d canvas context
		this.board = board;
		this.context = context;

		//Initialize size
		this.size = 0;

		//Initialize grid for gridded board objects
		this.grid = new BoardGrid();

		//Initialize static objects container (for non-grid objects)
		this.staticObjects = [];
	};

	/***********************************************************************************************
	 * Object handling
	 ***/

	/**
	 * Set grid size
	 */
	BoardLayer.prototype.setSize = function(size) {

		//Set the size for ourselves
		this.size = parseInt(size);

		//Note: since this method is usually only called upon a global board resize,
		//which also triggers the redraw method for all layers, the board objects on the grid
		//are not being cleared here, as it will happen anyway during the redraw cycle.

		//Set it in the grid (removing all objects in the process)
		this.grid.setSize(this.size);
	};

	/**
	 * Get the grid
	 */
	BoardLayer.prototype.getGrid = function() {
		return this.grid;
	};

	/**
	 * Add multiple objects
	 */
	BoardLayer.prototype.addObjects = function(objects) {
		for (var i = 0; i < objects.length; i++) {
			this.addObject(objects[i]);
		}
	};

	/**
	 * Get all gridded objects for this layer
	 */
	BoardLayer.prototype.getObjects = function(flat, cloned) {
		return this.grid.getObjects(flat, cloned);
	};

	/**
	 * Get object from specific coordinates
	 */
	BoardLayer.prototype.getObject = function(x, y) {
		return this.grid.getObject(x, y);
	};

	/**
	 * Add object
	 */
	BoardLayer.prototype.addObject = function(obj) {

		//Static object?
		if (obj.static) {
			this.addStaticObject(obj);
			return;
		}

		//Must be on grid
		if (!this.grid.isOnGrid(obj)) {
			return;
		}

		//Try to add and get replaced object
		var objReplaced = this.grid.addObject(obj);

		//Object replaced? Clear it
		if (objReplaced && objReplaced.clear) {
			objReplaced.clear(this.board);
		}

		//Draw the new object
		if (obj.draw) {
			obj.draw(this.board);
		}
	};

	/**
	 * Remove given object (will just remove from object's coordinates)
	 */
	BoardLayer.prototype.removeObject = function(x, y) {

		//Object given?
		if (typeof x == 'object') {
			var obj = x;

			//Static object?
			if (obj.static) {
				this.removeStaticObject(obj);
				return;
			}

			//Get coordinates
			y = obj.y;
			x = obj.x;
		}

		//Remove and get removed object
		var objRemoved = this.grid.removeObject(x, y);

		//Object removed? Clear it
		if (objRemoved && objRemoved.clear) {
			objRemoved.clear(this.board);
		}
	};

	/**
	 * Remove all objects
	 */
	BoardLayer.prototype.removeObjects = function() {

		//Remove objects from grid and get all removed objects
		var objects = this.grid.removeObjects();

		//Clear them
		for (var i = 0; i < objects.length; i++) {
			if (objects[i].clear) {
				objects[i].clear(this.board);
			}
		}
	};

	/**
	 * Add static object
	 */
	BoardLayer.prototype.addStaticObject = function(obj) {

		//Must have identifier
		if (!obj.identifier) {
			console.warn('Static object', obj, 'must have an identifier');
			return;
		}

		//Mark as static
		obj.static = true;

		//Set
		this.staticObjects[obj.identifier] = obj;

		//Draw if possible
		if (obj.draw) {
			obj.draw(this.board);
		}
	};

	/**
	 * Remove a static object
	 */
	BoardLayer.prototype.removeStaticObject = function(obj) {

		//Check input
		var identifier = (typeof obj == 'object') ? obj.identifier : obj;

		//Object present?
		if (identifier && typeof this.staticObjects[identifier] != 'undefined') {
			obj = this.staticObjects[identifier];

			//Clear if possible
			if (obj.clear) {
				obj.clear(this.board);
			}

			//Remove
			delete this.staticObjects[identifier];
		}
	};

	/**
	 * Draw objects, optionally only at specific grid coordinates
	 */
	BoardLayer.prototype.drawObjects = function(x, y) {

		//Coordinates given?
		if (typeof x != 'undefined' && typeof y != 'undefined') {
			var obj = this.grid.getObject(x, y);
			if (obj && obj.draw) {
				obj.draw(this.board);
			}
			return;
		}

		//Get all objects
		var objects = this.grid.getObjects(true);

		//Draw them
		for (var i = 0; i < objects.length; i++) {
			if (objects[i].draw) {
				objects[i].draw(this.board);
			}
		}

		//Draw static objects
		for (var identifier in this.staticObjects) {
			if (this.staticObjects[identifier].draw) {
				this.staticObjects[identifier].draw(this.board);
			}
		}
	};

	/**
	 * Clear objects, optionally only at specific grid coordinates
	 */
	BoardLayer.prototype.clearObjects = function(x, y) {

		//Coordinates given?
		if (typeof x != 'undefined' && typeof y != 'undefined') {
			var obj = this.grid.getObject(x, y);
			if (obj && obj.clear) {
				obj.clear(this.board);
			}
			return;
		}

		//Get all objects
		var objects = this.grid.getObjects(true);

		//Draw them
		for (var i = 0; i < objects.length; i++) {
			if (objects[i].clear) {
				objects[i].clear(this.board);
			}
		}

		//Draw static objects
		for (var identifier in this.staticObjects) {
			if (this.staticObjects[identifier].clear) {
				this.staticObjects[identifier].clear(this.board);
			}
		}
	};

	/***********************************************************************************************
	 * Drawing
	 ***/

	/**
	 * Draw layer
	 */
	BoardLayer.prototype.draw = function() {
		this.drawObjects();
	};

	/**
	 * Clear layer
	 */
	BoardLayer.prototype.clear = function() {

		//Clear canvas
		this.context.clearRect(0, 0, this.context.canvas.clientWidth, this.context.canvas.clientHeight);

		//Clear objects
		this.clearObjects();
	};

	/**
	 * Redraw layer
	 */
	BoardLayer.prototype.redraw = function() {
		this.clear();
		this.draw();
	};

	/**
	 * Get the canvas2d context
	 */
	BoardLayer.prototype.getContext = function() {
		return this.context;
	};

	//Return
	return BoardLayer;
});