
/**
 * BoardObject :: Base class for drawing board objects
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Service', [
  'ngGo',
  'ngGo.Board.DefaultClearHandler.Service'
])

/**
 * Factory definition
 */
.factory('BoardObject', function(DefaultClearHandler) {

  /**
   * Constructor
   */
  var BoardObject = {

    /**
     * Draw method
     */
    draw: function(/*obj*/) {
      if (this.board.drawWidth === 0 || this.board.drawheight === 0) {
        return;
      }
    },

    /**
     * Clear method
     */
    clear: function(obj) {
      DefaultClearHandler.call(this, this.context, obj);
    }
  };

  //Return
  return BoardObject;
});
