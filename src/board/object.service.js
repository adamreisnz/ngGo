
/**
 * BoardObject :: Base class for drawing board objects
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Service', [
  'ngGo',
  'ngGo.Board.DefaultClearHandler.Service',
])

/**
 * Factory definition
 */
.factory('BoardObject', function(DefaultClearHandler) {

  /**
   * Constructor
   */
  const BoardObject = {

    /**
     * Draw method
     */
    draw() {
      if (!this.board.hasDrawSize()) {
        return;
      }
    },

    /**
     * Clear method
     */
    clear(obj) {
      DefaultClearHandler.call(this, this.context, obj);
    },
  };

  //Return
  return BoardObject;
});
