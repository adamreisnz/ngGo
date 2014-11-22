
/**
 * BoardObjectStatic :: This is a base class for static board objects, e.g. board objects which do not
 * sit on fixed coordinates, for example the board coordinates themselves.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Static.Service', [
	'ngGo.Board.Object.Service',
])

/**
 * Factory definition
 */
.factory('BoardObjectStatic', function(BoardObject) {

	/**
	 * Constructor
	 */
	var BoardObjectStatic = function(properties, identifier, layer) {

		//Initialize specific vars
		this.static = true;
		this.identifier = identifier;

		//Parent constructor
		BoardObject.call(this, properties, layer);

		//Remove x/y coords since we are static
		delete this.x;
		delete this.y;
	};

	/**
	 * Extend prototype
	 */
	angular.extend(BoardObjectStatic.prototype, BoardObject.prototype);

	//Return
	return BoardObjectStatic;
});