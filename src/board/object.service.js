
/**
 * BoardObject :: This class represents a board object. It is the base class for all other objects which
 * are to be placed on the board, e.g. stones, markup, coordinates, etc.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Service', [
	'ngGo.Board.DefaultClearHandler.Service'
])

/**
 * Factory definition
 */
.factory('BoardObject', function(DefaultClearHandler) {

	/**
	 * Constructor
	 */
	var BoardObject = function(properties, layer) {

		//Set layer
		this.layer = layer;

		//Initialize x, y coords
		this.x = 0;
		this.y = 0;

		//Set properties given
		if (typeof properties == 'object') {
			for (var p in properties) {
				this[p] = properties[p];
			}
		}
	};

	/**
	 * Get the layer this object is on
	 */
	BoardObject.prototype.getLayer = function() {
		return this.layer;
	};

	/**
	 * Draw
	 */
	BoardObject.prototype.draw = function(board) {
		/* \o/ */
	};

	/**
	 * Clear
	 */
	BoardObject.prototype.clear = function(board) {

		//Call default clear handler
		DefaultClearHandler.call(this, board.layers[this.layer].getContext(), board);
	};

	//Return
	return BoardObject;
});