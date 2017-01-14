
/**
 * StoneFaded :: This class extends the Stone class and is used for drawing faded stones.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.StoneFaded.Service', [
  'ngGo',
  'ngGo.Board.Object.Stone.Service',
])

/**
 * Factory definition
 */
.factory('StoneFaded', function(Stone) {

  /**
   * Class
   */
  let StoneFaded = {

    /**
     * Draw stone
     */
    draw: function(stone) {

      //Set scale and alpha
      stone.scale = this.board.theme.get('stone.faded.scale');
      stone.alpha = this.board.theme.get('stone.faded.alpha', stone.color);

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
    },
  };

  //Return
  return StoneFaded;
});
