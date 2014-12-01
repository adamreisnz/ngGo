
/**
 * Coordinates :: This class is used for drawing board coordinates
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Coordinates.Service', [])

/**
 * Factory definition
 */
.factory('Coordinates', function() {

	/**
	 * Coordinates object
	 */
	var Coordinates = {

		/**
		 * Draw
		 */
		draw: function() {

			//Can only draw when we have dimensions
			if (this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Get boundary coordinates
			var xl = this.board.getAbsX(-0.75),
				xr = this.board.getAbsX(this.board.width - 0.25),
				yt = this.board.getAbsY(-0.75),
				yb = this.board.getAbsY(this.board.height - 0.25);

			//Get A and I character codes
			var aChar = 'A'.charCodeAt(0),
				iChar = 'I'.charCodeAt(0);

			//Get theme properties
			var cellSize = this.board.getCellSize(),
				stoneRadius = this.board.theme.get('stoneRadius', cellSize),
				fillStyle = this.board.theme.get('coordinatesColor'),
				fontSize = this.board.theme.get('coordinatesSize', cellSize),
				font = this.board.theme.get('font') || '';

			//Configure context
			this.context.fillStyle = fillStyle;
			this.context.textBaseline = 'middle';
			this.context.textAlign = 'center';
			this.context.font = fontSize + 'px ' + font;

			//Helper vars
			var i, x, y;

			//Draw vertical coordinates (numbers)
			for (i = 0; i < this.board.height; i++) {
				y = this.board.getAbsX(i);

				//Determine number
				var num = (this.board.section.bottom === 0) ? this.board.height - i : i + 1;

				//Write text
				this.context.fillText(num, xr, y);
				this.context.fillText(num, xl, y);
			}

			//Draw horizontal coordinates (letters)
			for (i = 0; i < this.board.width; i++) {
				x = this.board.getAbsY(i);

				//Determine character code
				var ch = aChar + i;
				if (ch >= iChar) {
					ch++;
				}

				//Write text
				this.context.fillText(String.fromCharCode(ch), x, yt);
				this.context.fillText(String.fromCharCode(ch), x, yb);
			}
		}
	};

	//Return
	return Coordinates;
});