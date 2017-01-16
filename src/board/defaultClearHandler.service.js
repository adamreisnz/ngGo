
/**
 * DefaultClearHandler :: This is the default clear handler for clearing a cell of the board grid.
 * It is used by all objects that lack their own specific clear handler. Basically, it just clears
 * a small rectangular area on the canvas.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.DefaultClearHandler.Service', [
  'ngGo',
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
  return function(context, obj) {

    //No context?
    if (!context) {
      return;
    }

    //Get coordinates and stone radius
    const x = this.board.getAbsX(obj.x);
    const y = this.board.getAbsY(obj.y);
    const s = this.board.getCellSize();
    const r = this.board.theme.get('stone.radius', s);

    //Clear rectangle the size of the stone radius
    context.clearRect(x - r, y - r, 2 * r, 2 * r);
  };
});
