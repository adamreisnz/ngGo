
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.MarkupLayer.Service', [
  'ngGo',
  'ngGo.Board.Layer.Service',
  'ngGo.Board.Object.Markup.Service',
])

/**
 * Factory definition
 */
.factory('MarkupLayer', function(BoardLayer, Markup) {

  /**
   * Constructor
   */
  function MarkupLayer(board, context) {

    //Call parent constructor
    BoardLayer.call(this, board, context);
  }

  /**
   * Prototype extension
   */
  angular.extend(MarkupLayer.prototype, BoardLayer.prototype);

  /*****************************************************************************
   * Object handling
   ***/

  /**
   * Set all markup at once
   */
  MarkupLayer.prototype.setAll = function(grid) {

    //Get changes compared to current grid
    const changes = this.grid.compare(grid, 'type');

    //Clear removed stuff
    changes.remove.forEach(change => Markup.clear.call(this, change));
    changes.add.forEach(change => Markup.draw.call(this, change));

    //Remember new grid
    this.grid = grid.clone();
  };

  /**
   * Remove all (clear layer and empty grid)
   */
  MarkupLayer.prototype.removeAll = function() {

    //Clear all markup items
    this.grid.all('type').forEach(item => Markup.clear.call(this, item));

    //Empty the grid now
    this.grid.empty();
  };

  /*****************************************************************************
   * Drawing
   ***/

  /**
   * Draw layer
   */
  MarkupLayer.prototype.draw = function() {

    //Can only draw when we have dimensions and context
    if (!this.context ||
      this.board.drawWidth === 0 || this.board.drawheight === 0) {
      return;
    }

    //Draw all markup
    this.grid.all('type').forEach(item => Markup.draw.call(this, item));
  };

  /**
   * Draw cell
   */
  MarkupLayer.prototype.drawCell = function(x, y) {

    //Can only draw when we have dimensions
    if (this.board.drawWidth === 0 || this.board.drawheight === 0) {
      return;
    }

    //On grid?
    if (this.grid.has(x, y)) {
      Markup.draw.call(this, this.grid.get(x, y, 'type'));
    }
  };

  /**
   * Clear cell
   */
  MarkupLayer.prototype.clearCell = function(x, y) {
    if (this.grid.has(x, y)) {
      Markup.clear.call(this, this.grid.get(x, y, 'type'));
    }
  };

  //Return
  return MarkupLayer;
});
