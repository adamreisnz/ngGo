
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.ShadowLayer.Service', [
  'ngGo',
  'ngGo.Board.Layer.Service',
  'ngGo.Board.Object.StoneShadow.Service',
])

/**
 * Factory definition
 */
.factory('ShadowLayer', function(BoardLayer, StoneShadow) {

  /**
   * Constructor
   */
  function ShadowLayer(board, context) {

    //Call parent constructor
    BoardLayer.call(this, board, context);
  }

  /**
   * Prototype extension
   */
  angular.extend(ShadowLayer.prototype, BoardLayer.prototype);

  /**
   * Add a stone
   */
  ShadowLayer.prototype.add = function(stone) {

    //Don't add if no shadow
    if (stone.shadow === false ||
      (typeof stone.alpha !== 'undefined' && stone.alpha < 1)) {
      return;
    }

    //Already have a stone here?
    if (this.grid.has(stone.x, stone.y)) {
      return;
    }

    //Add to grid
    this.grid.set(stone.x, stone.y, stone.color);

    //Draw it if there is a context
    if (this.context &&
      this.board.drawWidth !== 0 && this.board.drawheight !== 0) {
      StoneShadow.draw.call(this, stone);
    }
  };

  /**
   * Remove a stone
   */
  ShadowLayer.prototype.remove = function(stone) {

    //Remove from grid
    this.grid.unset(stone.x, stone.y);

    //Redraw whole layer
    this.redraw();
  };

  /**
   * Draw layer
   */
  ShadowLayer.prototype.draw = function() {

    //Can only draw when we have dimensions and context
    if (!this.context ||
      this.board.drawWidth === 0 || this.board.drawheight === 0) {
      return;
    }

    //Get shadowsize from theme
    const cellSize = this.board.getCellSize();
    const shadowSize = this.board.theme.get('shadow.size', cellSize);

    //Apply shadow transformation
    this.context.setTransform(1, 0, 0, 1, shadowSize, shadowSize);

    //Draw all stones
    this.grid.all('color').forEach(stone => StoneShadow.draw.call(this, stone));
  };

  //Return
  return ShadowLayer;
});
