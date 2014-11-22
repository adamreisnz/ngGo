
/**
 * StoneMini :: This class extends the Stone class and is used for drawing mini stones (for scoring).
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.StoneMini.Service', [
	'ngGo.Board.Object.Stone.Service'
])

/**
 * Factory definition
 */
.factory('StoneMini', function(Stone) {

	/**
	 * Constructor
	 */
	var StoneMini = function(properties, layer) {

		//Initialize scale and alpha (to prevent shadow)
		this.scale = 0;
		this.alpha = 0.99;
		layer = layer || 'score';

		//Call stone constructor
		Stone.call(this, properties, layer);
	};

	/**
	 * Extend prototype
	 */
	angular.extend(StoneMini.prototype, Stone.prototype);

	/**
	 * Draw method
	 */
	StoneMini.prototype.draw = function(board) {

		//Get scale if not set
		if (!this.scale) {
			this.scale = board.theme.get('stoneMiniScale');
		}

		//Call the regular stone draw handler
		Stone.prototype.draw.call(this, board);
	};

	/**
	 * Clear method
	 */
	StoneMini.prototype.clear = function(board) {
		Stone.prototype.clear.call(this, board);
	};

	//Return
	return StoneMini;
});