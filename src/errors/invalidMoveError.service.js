
/**
 * InvalidMoveError :: This is an error class to handle invalid moves.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Errors.InvalidMoveError.Service', [
	'ngGo.Service'
])

/**
 * Factory definition
 */
.factory('InvalidMoveError', function(ngGo, StoneColor) {

	/**
	 * Define error
	 */
	var InvalidMoveError = function(code, node) {

		//Set name and message
		this.name = 'InvalidMoveError';
	    this.message = 'Invalid move detected in kifu.';

		//Check if we can add move data
		if (node.move && node.move.color !== undefined && node.move.x !== undefined && node.move.y !== undefined) {
			var letter = node.move.x;
			if (node.move.x > 7) {
				letter++;
			}
			letter = String.fromCharCode(letter + 65);
			this.message += " Trying to play " + (node.move.color == StoneColor.W ? "white" : "black") + " move on (" + node.move.x + ", " + node.move.y + ")";
		}

		//Append code message
		switch (code) {
			case ngGo.error.MOVE_OUT_OF_BOUNDS:
				this.message += ", but these coordinates are not on the board.";
				break;
			case ngGo.error.MOVE_ALREADY_HAS_STONE:
				this.message += ", but there is already a stone on those coordinates.";
				break;
			case ngGo.error.MOVE_IS_SUICIDE:
				this.message += ", but this move is suicide.";
				break;
			case ngGo.error.MOVE_IS_REPEATING:
				this.message += ", but this position already occured.";
				break;
			default:
				this.message += ".";
		}
	};

	/**
	 * Extend from error class
	 */
	InvalidMoveError.prototype = new Error();
	InvalidMoveError.prototype.constructor = InvalidMoveError;

	//Return object
	return InvalidMoveError;
});