
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
	 * Class
	 */
	StoneMini = {

		/**
		 * Draw stone
		 */
		draw: function(stone) {

			//Set alpha if not given
			if (!stone.scale) {
				stone.scale = this.board.theme.get('stoneMiniScale');
			}

			//Don't show shadow
			stone.shadow = false;

			//Now call the regular stone draw handler
			Stone.draw.call(this, stone);
		},

		/**
		 * Clear stone
		 */
		clear: function(stone) {

			//Don't show shadow
			stone.shadow = false;

			//Call parent method
			Stone.clear.call(this, stone);
		}
	};

	//Return
	return StoneMini;
});