
/**
 * GridLayer :: This class represents the grid layer of the board, and it is responsible for drawing
 * gridlines, starpoints and coordinates via the Coordinates class.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.GridLayer.Service', [
  'ngGo',
  'ngGo.Board.Layer.Service',
  'ngGo.Board.Object.Coordinates.Service',
])

/**
 * Factory definition
 */
.factory('GridLayer', function(BoardLayer, Coordinates) {

  /**
   * Helper for drawing starpoints
   */
  function drawStarPoint(gridX, gridY, starRadius, starColor) {

    //Don't draw if it falls outsize of the board grid
    if (gridX < this.board.grid.xLeft || gridX > this.board.grid.xRight) {
      return;
    }
    if (gridY < this.board.grid.yTop || gridY > this.board.grid.yBot) {
      return;
    }

    //Get absolute coordinates and star point radius
    const x = this.board.getAbsX(gridX);
    const y = this.board.getAbsY(gridY);

    //Draw star point
    this.context.beginPath();
    this.context.fillStyle = starColor;
    this.context.arc(x, y, starRadius, 0, 2 * Math.PI, true);
    this.context.fill();
  }

  /**
   * Constructor
   */
  function GridLayer(board, context) {

    //Set coordinates setting
    this.coordinates = false;

    //Call parent constructor
    BoardLayer.call(this, board, context);
  }

  /**
   * Prototype extension
   */
  angular.extend(GridLayer.prototype, BoardLayer.prototype);

  /**
   * Show or hide the coordinates.
   */
  GridLayer.prototype.setCoordinates = function(show) {
    this.coordinates = show;
  };

  /**************************************************************************
   * Object handling
   ***/

  /**
   * Get all has nothing to return
   */
  GridLayer.prototype.getAll = function() {
    return null;
  };

  /**
   * Set all has nothing to set
   */
  GridLayer.prototype.setAll = function(/*grid*/) {
    return;
  };

  /**
   * Remove all has nothing to remove
   */
  GridLayer.prototype.removeAll = function() {
    return;
  };

  /**************************************************************************
   * Drawing
   ***/

  /**
   * Draw method
   */
  GridLayer.prototype.draw = function() {

    //Can only draw when we have dimensions and context
    if (!this.context || !this.board.hasDrawSize()) {
      return;
    }

    //Get board properties
    const {
      width, height, theme,
      drawMarginHor: tx, drawMarginVer: ty,
    } = this.board;

    //Get theme properties
    const cellSize = this.board.getCellSize();
    const lineWidth = theme.get('grid.lineWidth', cellSize);
    const lineCap = theme.get('grid.lineCap');
    const strokeStyle = theme.get('grid.lineColor');
    const starRadius = theme.get('grid.star.radius', cellSize);
    const starColor = theme.get('grid.star.color');
    const starPoints = theme.get('grid.star.points', width, height);
    const canvasTranslate = theme.canvasTranslate(lineWidth);

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.beginPath();
    this.context.lineWidth = lineWidth;
    this.context.lineCap = lineCap;
    this.context.strokeStyle = strokeStyle;

    //Helper vars
    let i, x, y;

    //Draw vertical lines
    for (i = this.board.grid.xLeft; i <= this.board.grid.xRight; i++) {
      x = this.board.getAbsX(i);
      this.context.moveTo(x, ty);
      this.context.lineTo(x, ty + this.board.gridDrawHeight);
    }

    //Draw horizontal lines
    for (i = this.board.grid.yTop; i <= this.board.grid.yBot; i++) {
      y = this.board.getAbsY(i);
      this.context.moveTo(tx, y);
      this.context.lineTo(tx + this.board.gridDrawWidth, y);
    }

    //Draw grid lines
    this.context.stroke();

    //Draw star points
    starPoints.forEach(point => {
      drawStarPoint.call(this, point.x, point.y, starRadius, starColor);
    });

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);

    //Draw coordinates
    if (this.coordinates) {
      Coordinates.draw.call(this);
    }
  };

  /**
   * Clear a square cell area on the grid
   */
  GridLayer.prototype.clearCell = function(gridX, gridY) {

    //Get absolute coordinates and stone radius
    const x = this.board.getAbsX(gridX);
    const y = this.board.getAbsY(gridY);
    const s = this.board.getCellSize();
    const r = this.board.theme.get('stone.radius', s);

    //Get theme properties
    const lineWidth = this.board.theme.get('grid.lineWidth', s);
    const canvasTranslate = this.board.theme.canvasTranslate(lineWidth);

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Clear rectangle
    this.context.clearRect(x - r, y - r, 2 * r, 2 * r);

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  };

  /**
   * Redraw a square cell area on the grid
   */
  GridLayer.prototype.redrawCell = function(gridX, gridY) {

    //Get absolute coordinates and stone radius
    const x = this.board.getAbsX(gridX);
    const y = this.board.getAbsY(gridY);
    const s = this.board.getCellSize();
    const r = this.board.theme.get('stone.radius', s);

    //Get board properties
    const {theme, width, height} = this.board;

    //Get theme properties
    const lineWidth = theme.get('grid.lineWidth', s);
    const strokeStyle = theme.get('grid.lineColor');
    const starRadius = theme.get('grid.star.radius', s);
    const starColor = theme.get('grid.star.color');
    const canvasTranslate = theme.canvasTranslate(lineWidth);
    const starPoints = theme.get('grid.star.points', width, height);

    //Determine draw coordinates
    const x1 = (gridX === 0) ? x : x - r;
    const x2 = (gridX === width - 1) ? x : x + r;
    const y1 = (gridY === 0) ? y : y - r;
    const y2 = (gridY === height - 1) ? y : y + r;

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.beginPath();
    this.context.lineWidth = lineWidth;
    this.context.strokeStyle = strokeStyle;

    //Patch up grid lines
    this.context.moveTo(x1, y);
    this.context.lineTo(x2, y);
    this.context.moveTo(x, y1);
    this.context.lineTo(x, y2);
    this.context.stroke();

    //Check if we need to draw a star point here
    const starPoint = starPoints.find(point => {
      return (point.x === gridX && point.y === gridY);
    });

    //Draw if found
    if (starPoint) {
      drawStarPoint.call(this, gridX, gridY, starRadius, starColor);
    }

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  };

  //Return
  return GridLayer;
});
