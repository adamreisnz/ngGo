
/**
 * StoneShadow :: This class is used for drawing stone shadows on the board.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.StoneShadow.Service', [
	'ngGo',
	'ngGo.Board.Object.Service'
])

/**
 * Factory definition
 */
.factory('StoneShadow', function(BoardObject) {

	/**
	 * Constructor
	 */
	var StoneShadow = {

		/**
		 * Draw a stone shadow
		 */
		draw: function(stone) {

			//Don't draw shadows if there is stone alpha or if explicitly stated
			if ((stone.alpha && stone.alpha < 1) || stone.shadow === false) {
				return;
			}

			//Get coordinates and stone radius
			var x = this.board.getAbsX(stone.x),
				y = this.board.getAbsY(stone.y),
				s = this.board.getCellSize(),
				r = Math.max(0, this.board.theme.get('stone.radius', s) - 0.5);

			//Apply scaling factor?
			if (stone.scale) {
				r = Math.round(r * stone.scale);
			}

			//Get theme properties
			var blur = this.board.theme.get('shadow.blur', s),
				shadowColor = this.board.theme.get('shadow.color'),
				shadowColorTransparent = this.board.theme.get('shadow.colorTransparent');

			//Configure context
			this.context.fillStyle = this.context.createRadialGradient(x, y, r-1-blur, x, y, r+blur);
			this.context.fillStyle.addColorStop(0, shadowColor);
			this.context.fillStyle.addColorStop(1, shadowColorTransparent);

			//Draw shadow
			this.context.beginPath();
			this.context.arc(x, y, r+blur, 0, 2*Math.PI, true);
			this.context.fill();
		},

		/**
		 * Clear a stone shadow
		 */
		clear: function(stone) {

			//Note: this method is currently not in use due to the overlappign shadows
			//problem. Instead, the entire shadow layer is simply cleared and redrawn
			//when removing stones. The multiple canvasses solution from WGo didn't seem
			//appropriate either, so for now we will leave it at this.

			//Don't draw shadows if there is stone alpha or if explicitly stated
			if ((stone.alpha && stone.alpha < 1) || stone.shadow === false) {
				return;
			}

			//Get coordinates and stone radius
			var x = this.board.getAbsX(stone.x),
				y = this.board.getAbsY(stone.y),
				s = this.board.getCellSize(),
				r = this.board.theme.get('stone.radius', s);

			//Clear a generous rectangle
			this.context.clearRect(x - 1.2*r, y - 1.2*r, 2.4*r, 2.4*r);
		}
	};

	//Return
	return StoneShadow;
});