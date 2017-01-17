
/**
 * GameScore :: A simple class that contains a game score
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Score.Service', [
  'ngGo',
])

/**
 * Factory definition
 */
.factory('GameScore', function(StoneColor) {

  /**
   * Helper to calculate the total points
   */
  function calcTotal() {
    return parseInt(this.stones) + parseInt(this.territory) +
      parseInt(this.captures) + parseInt(this.komi);
  }

  /**
   * Constructor
   */
  function GameScore() {

    //Get self
    let self = this;

    //Setup score containers
    this.black = {};
    this.white = {};

    //Initialize
    this.reset();

    //Add total handlers
    this.black.total = function() {
      return calcTotal.call(self.black);
    };
    this.white.total = function() {
      return calcTotal.call(self.white);
    };
  }

  /**
   * Reset the game score
   */
  GameScore.prototype.reset = function() {

    //Get properties to loop
    let props = ['stones', 'territory', 'captures', 'komi'];

    //Score for black player
    for (let i = 0; i < props.length; i++) {
      this.black[props[i]] = 0;
      this.white[props[i]] = 0;
    }
  };

  /**
   * Get the winner
   */
  GameScore.prototype.winner = function() {

    //Get totals
    let b = this.black.total();
    let w = this.white.total();

    //Determine winner
    if (w > b) {
      return StoneColor.W;
    }
    else if (b > w) {
      return StoneColor.B;
    }
    return StoneColor.E;
  };

  //Return
  return GameScore;
});
