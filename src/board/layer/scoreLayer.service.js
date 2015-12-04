
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.ScoreLayer.Service', [
  'ngGo',
  'ngGo.Board.Layer.Service',
  'ngGo.Board.Object.StoneMini.Service',
  'ngGo.Board.Object.StoneFaded.Service'
])

/**
 * Factory definition
 */
.factory('ScoreLayer', function(BoardLayer, StoneMini, StoneFaded) {

  /**
   * Constructor
   */
  function ScoreLayer(board, context) {

    //Points and captures
    this.points = [];
    this.captures = [];

    //Call parent constructor
    BoardLayer.call(this, board, context);
  }

  /**
   * Prototype extension
   */
  angular.extend(ScoreLayer.prototype, BoardLayer.prototype);

  /*****************************************************************************
   * Object handling
   ***/

  /**
   * Set points and captures
   */
  ScoreLayer.prototype.setAll = function(points, captures) {

    //Remove all existing stuff first
    this.removeAll();

    //Set new stuff
    this.points = points.all('color');
    this.captures = captures.all('color');

    //Draw
    this.draw();
  };

  /**
   * Remove all scoring
   */
  ScoreLayer.prototype.removeAll = function() {

    //If there are captures, draw them back onto the stones layer
    for (var i = 0; i < this.captures.length; i++) {
      this.board.add('stones', this.captures[i].x, this.captures[i].y, this.captures[i].color);
    }

    //Clear the layer
    this.clear();

    //Remove all stuff
    this.points = [];
    this.captures = [];
  };

  /*****************************************************************************
   * Drawing
   ***/

  /**
   * Draw layer
   */
  ScoreLayer.prototype.draw = function() {

    //Can only draw when we have dimensions and context
    if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
      return;
    }

    //Init
    var i;

    //Draw captures first (removing stones from the stones layer)
    for (i = 0; i < this.captures.length; i++) {
      this.board.remove('stones', this.captures[i].x, this.captures[i].y);
      StoneFaded.draw.call(this, this.captures[i]);
    }

    //Draw points on top of it
    for (i = 0; i < this.points.length; i++) {
      StoneMini.draw.call(this, this.points[i]);
    }
  };

  //Return
  return ScoreLayer;
});
