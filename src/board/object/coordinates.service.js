
/**
 * Coordinates :: This class represents board coordinates and is repsonsible for drawing them.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Coordinates.Service', [
	'ngGo.Board.Object.Static.Service'
])

/**
 * Factory definition
 */
.factory('Coordinates', function(BoardObjectStatic) {

	/**
	 * Constructor
	 */
	var Coordinates = function(properties, identifier, layer) {

		//Mark as static and set identifier
		this.static = true;

		//Set default layer and identifier
		layer = layer || 'grid';
		identifier = identifier || 'coordinates';

		//Call parent constructor
		BoardObjectStatic.call(this, properties, identifier, layer);
	};

	/**
	 * Extend prototype
	 */
	angular.extend(Coordinates.prototype, BoardObjectStatic.prototype);

	/**
	 * Draw
	 */
	Coordinates.prototype.draw = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get boundary coordinates
		var xr = board.getAbsX(-0.75);
			xl = board.getAbsX(board.width - 0.25);
			yt = board.getAbsY(-0.75);
			yb = board.getAbsY(board.height - 0.25);

		//Get A and I character codes
		var aChar = 'A'.charCodeAt(0),
			iChar = 'I'.charCodeAt(0);

		//Get theme properties
		var cellSize = board.getCellSize(),
			stoneRadius = board.theme.get('stoneRadius', cellSize),
			fillStyle = board.theme.get('coordinatesColor'),
			fontSize = board.theme.get('coordinatesSize', cellSize),
			font = board.theme.get('font') || '';

		//Configure context
		ctx.fillStyle = fillStyle;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = fontSize + 'px ' + font;

		//Helper vars
		var i, x, y;

		//Draw vertical coordinates (numbers)
		for (i = 1; i < board.height - 1; i++) {
			y = board.getAbsX(i);
			ctx.fillText(board.height - i, xr, y);
			ctx.fillText(board.height - i, xl, y);
		}

		//Draw horizontal coordinates (letters)
		for (i = 1; i < board.width - 1; i++) {
			x = board.getAbsY(i);

			//Determine character code
			var ch = i + aChar;
			if (ch >= iChar) {
				ch++;
			}

			ctx.fillText(String.fromCharCode(ch), x, yt);
			ctx.fillText(String.fromCharCode(ch), x, yb);
		}
	};

	//Return
	return Coordinates;
});