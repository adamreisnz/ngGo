
/**
 * InvalidPositionError :: Error class to handle invalid moves.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Errors.InvalidPositionError.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('InvalidPositionError', function(ngGo, StoneColor) {

	/**
	 * Define error
	 */
	var InvalidPositionError = function(code, x, y, color) {

		//Set name and message
		this.code = code;
		this.name = 'InvalidPositionError';
	    this.message = 'Invalid position detected.';

	    //Add position data
	    if (typeof x !==  'undefined' && typeof y !==  'undefined' && typeof color !==  'undefined') {
	    	this.message += " Trying to place a " + (color === StoneColor.W ? "white" : "black") + " stone on (" + x + ", " + y + ")";
		}

		//Append code message
		switch (code) {
			case ngGo.error.POSTITION_OUT_OF_BOUNDS:
				this.message += ", but these coordinates are not on the board.";
				break;
			case ngGo.error.POSTITION_ALREADY_HAS_STONE:
				this.message += ", but there is already a stone on those coordinates.";
				break;
			case ngGo.error.POSTITION_IS_SUICIDE:
				this.message += ", but that would be suicide.";
				break;
			case ngGo.error.POSTITION_IS_REPEATING:
				this.message += ", but this position already occured.";
				break;
			default:
				this.message += ".";
		}
	};

	/**
	 * Extend from error class
	 */
	InvalidPositionError.prototype = new Error();
	InvalidPositionError.prototype.constructor = InvalidPositionError;

	//Return object
	return InvalidPositionError;
});