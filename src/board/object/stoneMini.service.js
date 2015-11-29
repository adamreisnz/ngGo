
/**
 * StoneMini :: This class extends the Stone class and is used for drawing mini stones
 * (for scoring).
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.StoneMini.Service', [
  'ngGo',
  'ngGo.Board.Object.Stone.Service'
])

/**
 * Factory definition
 */
.factory('StoneMini', function(Stone) {

  /**
   * Class
   */
  var StoneMini = {

    /**
     * Draw stone
     */
    draw: function(stone) {

      //Set scale and alpha
      stone.scale = this.board.theme.get('stone.mini.scale');
      stone.alpha = this.board.theme.get('stone.mini.alpha', stone.color);

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
