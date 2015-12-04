
/**
 * BoardLayer :: This class represents a layer on the board and is the base class for all board
 * layers. Each layer can contain it's own objects on a grid with coordinates and is responsible
 * for drawing itself as well as its objects onto the canvas.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.Service', [
  'ngGo',
  'ngGo.Board.Grid.Service'
])

/**
 * Factory definition
 */
.factory('BoardLayer', function(BoardGrid) {

  /**
   * Constructor
   */
  function BoardLayer(board, context) {

    //Remember board reference and 2d canvas context
    this.board = board;
    this.context = context;

    //Initialize grid for board objects
    this.grid = new BoardGrid();
  }

  /*****************************************************************************
   * Generic grid and object handling
   ***/

  /**
   * Set grid size
   */
  BoardLayer.prototype.setSize = function(width, height) {

    //Note: since this method is usually only called upon a global board resize,
    //which also triggers the redraw method for layers, the layer is not cleared
    //here, as it will happen anyway during the redraw cycle.

    //Set it in the grid (removing all objects in the process)
    this.grid.setSize(width, height);
  };

  /**
   * Get all items
   */
  BoardLayer.prototype.getAll = function() {
    return this.grid.clone();
  };

  /**
   * Set all items at once
   */
  BoardLayer.prototype.setAll = function(grid) {
    this.grid = grid.clone();
  };

  /**
   * Remove all (clear layer and empty grid)
   */
  BoardLayer.prototype.removeAll = function() {
    this.clear();
    this.grid.empty();
  };

  /**
   * Add a single item
   */
  BoardLayer.prototype.add = function(x, y, value) {
    this.clearCell(x, y);
    this.grid.set(x, y, value);
    this.drawCell(x, y);
  };

  /**
   * Remove a single item
   */
  BoardLayer.prototype.remove = function(x, y) {
    this.clearCell(x, y);
    this.grid.unset(x, y);
  };

  /**
   * Get an item
   */
  BoardLayer.prototype.get = function(x, y) {
    return this.grid.get(x, y);
  };

  /**
   * Check if there is an item
   */
  BoardLayer.prototype.has = function(x, y) {
    return this.grid.has(x, y);
  };

  /*****************************************************************************
   * Generic drawing methods
   ***/

  /**
   * Draw layer
   */
  BoardLayer.prototype.draw = function() {
    //Drawing method to be implemented in specific layer class
  };

  /**
   * Clear layer (this method doesn't clear objects, as the canvas wipe clears the entire canvas)
   */
  BoardLayer.prototype.clear = function() {
    if (this.context) {
      this.context.clearRect(
        0, 0, this.context.canvas.clientWidth, this.context.canvas.clientHeight
      );
    }
  };

  /**
   * Redraw layer
   */
  BoardLayer.prototype.redraw = function() {
    this.clear();
    this.draw();
  };

  /**
   * Draw cell
   */
  BoardLayer.prototype.drawCell = function(/*x, y*/) {
    //Drawing method to be implemented in specific layer class
  };

  /**
   * Clear cell
   */
  BoardLayer.prototype.clearCell = function(/*x, y*/) {
    //Clearing method to be implemented in specific layer class
  };

  /**
   * Redraw cell
   */
  BoardLayer.prototype.redrawCell = function(x, y) {
    this.clearCell(x, y);
    this.drawCell(x, y);
  };

  /**
   * Set the canvas2d context
   */
  BoardLayer.prototype.setContext = function(context) {
    this.context = context;
  };

  /**
   * Get the canvas2d context
   */
  BoardLayer.prototype.getContext = function() {
    return this.context;
  };

  //Return
  return BoardLayer;
});
