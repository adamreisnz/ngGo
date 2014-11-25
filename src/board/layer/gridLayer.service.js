
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

		//Determine coordinates
		var tx = Math.round(this.board.left),
			ty = Math.round(this.board.top),
			bw = Math.round(this.board.cellWidth * (this.board.width - 1)),
			bh = Math.round(this.board.cellHeight * (this.board.height - 1));

		//Get theme properties
		var cellSize = this.board.getCellSize(),
			lineWidth = this.board.theme.get('gridLineWidth', cellSize),
			strokeStyle = this.board.theme.get('gridLineColor'),
			starRadius = this.board.theme.get('starRadius', cellSize),
			starColor = this.board.theme.get('starColor'),
			canvasTranslate = this.board.theme.get('canvasTranslate', cellSize, lineWidth);

		//Get star points
		var starPoints = this.board.config.starPoints[this.board.width + 'x' + this.board.height] || [];

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.beginPath();
		this.context.lineWidth = lineWidth;
		this.context.strokeStyle = strokeStyle;

		//Draw container rectangle
		this.context.strokeRect(tx, ty, bw, bh);

		//Helper vars
		var i, x, y;

		//Draw vertical lines
		for (i = 1; i < this.board.width - 1; i++) {
			x = this.board.getAbsX(i);
			this.context.moveTo(x, ty);
			this.context.lineTo(x, ty + bh);
		}

		//Draw horizontal lines
		for (i = 1; i < this.board.height - 1; i++) {
			y = this.board.getAbsY(i);
			this.context.moveTo(tx, y);
			this.context.lineTo(tx + bw, y);
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
			canvasTranslate = this.board.theme.get('canvasTranslate', s, lineWidth);

		//Get star points
		var starPoints = this.board.config.starPoints[this.board.width + 'x' + this.board.height] || [];

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