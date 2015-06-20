
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
	'ngGo.Board.Object.Coordinates.Service'
])

/**
 * Factory definition
 */
.factory('GridLayer', function(BoardLayer, Coordinates) {

	/**
	 * Helper for drawing starpoints
	 */
	var drawStarPoint = function(gridX, gridY, starRadius, starColor) {

		//Don't draw if it falls outsize of the board grid
		if (gridX < this.board.grid.xLeft || gridX > this.board.grid.xRight) {
			return;
		}
		if (gridY < this.board.grid.yTop || gridY > this.board.grid.yBot) {
			return;
		}

		//Get absolute coordinates and star point radius
		var x = this.board.getAbsX(gridX),
			y = this.board.getAbsY(gridY);

		//Draw star point
		this.context.beginPath();
		this.context.fillStyle = starColor;
		this.context.arc(x, y, starRadius, 0, 2*Math.PI, true);
		this.context.fill();
	};

	/**
	 * Constructor
	 */
	var GridLayer = function(board, context) {

		//Set coordinates setting
		this.coordinates = false;

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

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

	/***********************************************************************************************
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

	/***********************************************************************************************
	 * Drawing
	 ***/

	/**
	 * Draw method
	 */
	GridLayer.prototype.draw = function() {

		//Can only draw when we have dimensions and context
		if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//Determine top x and y margin
		var tx = this.board.drawMarginHor,
			ty = this.board.drawMarginVer;

		//Get theme properties
		var cellSize = this.board.getCellSize(),
			lineWidth = this.board.theme.get('grid.lineWidth', cellSize),
			lineCap = this.board.theme.get('grid.lineCap'),
			strokeStyle = this.board.theme.get('grid.lineColor'),
			starRadius = this.board.theme.get('grid.star.radius', cellSize),
			starColor = this.board.theme.get('grid.star.color'),
			starPoints = this.board.theme.get('grid.star.points', this.board.width, this.board.height),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.beginPath();
		this.context.lineWidth = lineWidth;
		this.context.lineCap = lineCap;
		this.context.strokeStyle = strokeStyle;

		//Helper vars
		var i, x, y;

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

		//Star points defined?
		for (i = 0; i < starPoints.length; i++) {
			drawStarPoint.call(this, starPoints[i].x, starPoints[i].y, starRadius, starColor);
		}

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
		var x = this.board.getAbsX(gridX),
			y = this.board.getAbsY(gridY),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Get theme properties
		var lineWidth = this.board.theme.get('grid.lineWidth', s),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Clear rectangle
		this.context.clearRect(x-r, y-r, 2*r, 2*r);

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Redraw a square cell area on the grid
	 */
	GridLayer.prototype.redrawCell = function(gridX, gridY) {

		//Get absolute coordinates and stone radius
		var x = this.board.getAbsX(gridX),
			y = this.board.getAbsY(gridY),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Get theme properties
		var lineWidth = this.board.theme.get('grid.lineWidth', s),
			strokeStyle = this.board.theme.get('grid.lineColor'),
			starRadius = this.board.theme.get('grid.star.radius', s),
			starColor = this.board.theme.get('grid.star.color'),
			canvasTranslate = this.board.theme.canvasTranslate(lineWidth),
			starPoints = this.board.theme.get('grid.star.points', this.board.width, this.board.height);

		//Determine draw coordinates
		var x1 = (gridX === 0) ? x : x-r,
			x2 = (gridX === this.board.width - 1) ? x : x+r,
			y1 = (gridY === 0) ? y : y-r,
			y2 = (gridY === this.board.height - 1) ? y : y+r;

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
		for (var i in starPoints) {
			if (starPoints[i].x === gridX && starPoints[i].y === gridY) {
				drawStarPoint.call(this, gridX, gridY, starRadius, starColor);
			}
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	//Return
	return GridLayer;
});
