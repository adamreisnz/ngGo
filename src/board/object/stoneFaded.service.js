
/**
 * StoneFaded :: This class extends the Stone class and is used for drawing faded stones.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.StoneFaded.Service', [
	'ngGo.Board.Object.Stone.Service'
])

/**
 * Factory definition
 */
.factory('StoneFaded', function(Stone) {

	/**
	 * Constructor
	 */
	var StoneFaded = function(properties, layer) {

		//Initialize alpha and set layer to use
		this.alpha = 0;
		layer = layer || 'faded';

		//Call stone constructor
		Stone.call(this, properties, layer);
	};

	/**
	 * Extend prototype
	 */
	angular.extend(StoneFaded.prototype, Stone.prototype);

	/**
	 * Draw method
	 */
	StoneFaded.prototype.draw = function(board) {

		//Get scale if not set
		if (!this.alpha) {
			this.alpha = board.theme.get('stoneFadedAlpha');
		}

		//Call the regular stone draw handler
		Stone.prototype.draw.call(this, board);
	};

	/**
	 * Clear method
	 */
	StoneFaded.prototype.clear = function(board) {
		Stone.prototype.clear.call(this, board);
	};

	//Return
	return StoneFaded;
});