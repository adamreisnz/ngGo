
/**
 * DefaultClearHandler :: This is the default clear handler for clearing a cell of the board grid. It
 * is used by all objects that lack their own specific clear handler. Basically, it just clears a small
 * rectangular area on the canvas.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.DefaultClearHandler.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('DefaultClearHandler', function() {

	/**
	 * Clear handler definition
	 *
	 * All external handlers are called from the context of the layer that contains the object.
	 * First parameter is the canvas2d context, second parameter is the object itself.
	 */
	return function(ctx, obj) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(obj.x),
			y = this.board.getAbsY(obj.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Clear rectangle the size of the stone radius
		ctx.clearRect(x-r, y-r, 2*r, 2*r);
	};
});