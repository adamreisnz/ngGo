
/**
 * GridLayer :: This class represents the grid layer of the board, and it is responsible for drawing
 * gridlines and starpoints. The coordinates object can also be attached to this layer.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.GridLayer.Service', [
	'ngGo.Board.Layer.Service'
])

/**
 * Factory definition
 */
.factory('GridLayer', function(BoardLayer) {

	/**
	 * Helper for drawing starpoints
	 */
	var drawStarPoint = function(gridX, gridY, starRadius, starColor) {

		//Don't draw if it falls outsize of the board grid section
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

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(GridLayer.prototype, BoardLayer.prototype);

	/**
	 * Draw method
	 */
	GridLayer.prototype.draw = function() {

		//Determine top x and y margin
		var tx = Math.round(this.board.drawMargin),
			ty = Math.round(this.board.drawMargin);

		//Determine number of visible cells
		var cellsVer = this.board.grid.yBot - this.board.grid.yTop,
			cellsHor = this.board.grid.xRight - this.board.grid.xLeft;

		//If we are displaying a section, add some line height/width to indicate the cut off
		if (this.board.section.top) {
			cellsVer += 0.5;
			ty += Math.round((this.board.grid.yBot - cellsVer) * this.board.cellSize);
		}
		if (this.board.section.bottom) {
			cellsVer += 0.5;
		}
		if (this.board.section.left) {
			cellsHor += 0.5;
			tx += Math.round((this.board.grid.xRight - cellsHor) * this.board.cellSize);
		}
		if (this.board.section.right) {
			cellsHor += 0.5;
		}

		//Determine grid lines width/height
		var gridWidth = Math.round(this.board.cellSize * cellsHor),
			gridHeight = Math.round(this.board.cellSize * cellsVer);

		//Get theme properties
		var cellSize = this.board.getCellSize(),
			lineWidth = this.board.theme.get('gridLineWidth', cellSize),
			strokeStyle = this.board.theme.get('gridLineColor'),
			starRadius = this.board.theme.get('starRadius', cellSize),
			starColor = this.board.theme.get('starColor'),
			canvasTranslate = this.board.theme.get('canvasTranslate', cellSize, lineWidth),
			starPoints = this.board.theme.get('starPoints', this.board.width, this.board.height);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.beginPath();
		this.context.lineWidth = lineWidth;
		this.context.strokeStyle = strokeStyle;

		//Helper vars
		var i, x, y;

		//Draw vertical lines
		for (i = this.board.grid.xLeft; i <= this.board.grid.xRight; i++) {
			x = this.board.getAbsX(i);
			this.context.moveTo(x, ty);
			this.context.lineTo(x, ty + gridHeight);
		}

		//Draw horizontal lines
		for (i = this.board.grid.yTop; i <= this.board.grid.yBot; i++) {
			y = this.board.getAbsY(i);
			this.context.moveTo(tx, y);
			this.context.lineTo(tx + gridWidth, y);
		}

		//Draw grid lines
		this.context.stroke();

		//Star points defined?
		for (i in starPoints) {
			drawStarPoint.call(this, starPoints[i].x, starPoints[i].y, starRadius, starColor);
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);

		//Call parent method
		BoardLayer.prototype.draw.call(this);
	};

	/**
	 * Clear a square cell area on the grid
	 */
	GridLayer.prototype.clearCell = function(gridX, gridY) {

		//Get absolute coordinates and stone radius
		var x = this.board.getAbsX(gridX),
			y = this.board.getAbsY(gridY),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stoneRadius', s);

		//Get theme properties
		var lineWidth = this.board.theme.get('gridLineWidth', s),
			canvasTranslate = this.board.theme.get('canvasTranslate', s, lineWidth);

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
			r = this.board.theme.get('stoneRadius', s);

		//Get theme properties
		var lineWidth = this.board.theme.get('gridLineWidth', s),
			strokeStyle = this.board.theme.get('gridLineColor'),
			starRadius = this.board.theme.get('starRadius', s),
			starColor = this.board.theme.get('starColor'),
			canvasTranslate = this.board.theme.get('canvasTranslate', s, lineWidth),
			starPoints = this.board.theme.get('starPoints', this.board.width, this.board.height);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.beginPath();
		this.context.lineWidth = lineWidth;
		this.context.strokeStyle = strokeStyle;

		//Patch up grid lines
		this.context.moveTo(x-r, y);
		this.context.lineTo(x+r, y);
		this.context.moveTo(x, y+r);
		this.context.lineTo(x, y-r);
		this.context.stroke();

		//Check if we need to draw a star point here
		for (var i in starPoints) {
			if (starPoints[i].x == gridX && starPoints[i].y == gridY) {
				drawStarPoint.call(this, gridX, gridY, starRadius, starColor);
			}
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	//Return
	return GridLayer;
});