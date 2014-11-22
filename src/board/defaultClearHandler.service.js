
/**
 * DefaultClearHandler :: This is the default clear handler for clearing a cell of the board grid. It
 * is used by all objects that lack their own specific clear handler. Basically, it just clears a small
 * rectangular area on the canvas.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.DefaultClearHandler.Service', [])

/**
 * Factory definition
 */
.factory('DefaultClearHandler', function() {

	/**
	 * Clear handler definition
	 *
	 * All external handlers are called from the context of the object that is being drawn.
	 * First parameter is the canvas2d context, second parameter is the board object.
	 */
	return function(ctx, board) {

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = board.theme.get('stoneRadius', s);

		//Clear rectangle the size of the stone radius
		ctx.clearRect(x-r, y-r, 2*r, 2*r);
	};
});