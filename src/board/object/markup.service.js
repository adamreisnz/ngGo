
/**
 * Markup :: This class represents markup elements and is repsonsible for drawing them.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Markup.Service', [
	'ngGo.Service',
	'ngGo.Board.Object.Service'
])

/**
 * Factory definition
 */
.factory('Markup', function(MarkupTypes, BoardObject) {

	/**
	 * Math constants
	 */
	var cosPi4 = Math.cos(Math.PI/4),
		cosPi6 = Math.cos(Math.PI/6);

	/**
	 * Triangle draw handler
	 */
	var drawTriangle = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.round(board.theme.get('stoneRadius', s) * board.theme.get('markupTriangleScale'));

		//Get theme properties
		var lineWidth = this.lineWidth || board.theme.get('markupLineWidth', s) || 1,
			strokeStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate', s, lineWidth);

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = lineWidth;

		//Draw element
		ctx.beginPath();
		ctx.moveTo(x, y-r);
		ctx.lineTo(x - Math.round(r*cosPi6), y + Math.round(r/2));
		ctx.lineTo(x + Math.round(r*cosPi6), y + Math.round(r/2));
		ctx.closePath();
		ctx.stroke();

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Square draw handler
	 */
	var drawSquare = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.round(board.theme.get('stoneRadius', s) * board.theme.get('markupSquareScale')),
			rcos = Math.round(r*cosPi4);

		//Get theme properties
		var lineWidth = this.lineWidth || board.theme.get('markupLineWidth', s) || 1,
			strokeStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate', s, lineWidth);

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = lineWidth;

		//Draw element
		ctx.beginPath();
		ctx.rect(x - rcos, y - rcos, 2*rcos, 2*rcos);
		ctx.stroke();

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw circle handler
	 */
	var drawCircle = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.round(board.theme.get('stoneRadius', s) * board.theme.get('markupCircleScale'));

		//Get theme properties
		var lineWidth = this.lineWidth || board.theme.get('markupLineWidth', s) || 1,
			strokeStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate');

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = lineWidth;

		//Draw element
		ctx.beginPath();
		ctx.arc(x, y, r, 0, 2*Math.PI, true);
		ctx.stroke();

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw mark handler
	 */
	var drawMark = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.round(board.theme.get('stoneRadius', s) * board.theme.get('markupMarkScale')),
			rcos = Math.round(r*cosPi4);

		//Get theme properties
		var lineWidth = this.lineWidth || board.theme.get('markupLineWidth', s) || 1,
			lineCap = this.lineCap || board.theme.get('markupLineCap'),
			strokeStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate', s, lineWidth);

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = lineWidth;
		ctx.lineCap = lineCap;

		//Draw element
		ctx.beginPath();
		ctx.moveTo(x - rcos, y - rcos);
		ctx.lineTo(x + rcos, y + rcos);
		ctx.moveTo(x + rcos, y - rcos);
		ctx.lineTo(x - rcos, y + rcos);
		ctx.stroke();

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw select handler
	 */
	var drawSelect = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.round(board.theme.get('stoneRadius', s) * board.theme.get('markupCircleScale'));

		//Get theme properties
		var lineWidth = this.lineWidth || board.theme.get('markupLineWidth', s) || 1,
			fillStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate');

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.fillStyle = fillStyle;
		ctx.lineWidth = lineWidth;

		//Draw element
		ctx.beginPath();
		ctx.arc(x, y, r, 0, 2*Math.PI, true);
		ctx.fill();

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Last move draw handler
	 */
	var drawLast = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.round(board.theme.get('stoneRadius', s) * board.theme.get('markupLastScale'));

		//Get theme properties
		var fillStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate', s);

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.fillStyle = fillStyle;

		//Draw element
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + r, y);
		ctx.lineTo(x, y + r);
		ctx.closePath();
		ctx.fill();

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw happy smiley handler
	 */
	var drawHappySmiley = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.round(board.theme.get('stoneRadius', s) * board.theme.get('markupSmileyScale'));

		//Get theme properties
		var lineWidth = this.lineWidth || board.theme.get('markupLineWidth', s) || 1,
			strokeStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate');

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = lineWidth;
		ctx.lineCap = 'round';

		//Draw element
		ctx.beginPath();
		ctx.arc(x - r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(x + r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x - r/1.6, y + r/8);
		ctx.bezierCurveTo(x - r/1.8, y + r/1.5, x + r/1.8, y + r/1.5, x + r/1.6, y + r/8);
		ctx.stroke();

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw sad smiley handler
	 */
	var drawSadSmiley = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.round(board.theme.get('stoneRadius', s) * board.theme.get('markupSmileyScale'));

		//Get theme properties
		var lineWidth = this.lineWidth || board.theme.get('markupLineWidth', s) || 1,
			strokeStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate');

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = lineWidth;
		ctx.lineCap = 'round';

		//Draw element
		ctx.beginPath();
		ctx.arc(x - r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(x + r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x - r/1.6, y + r/1.5 -1);
		ctx.bezierCurveTo(x - r/1.8, y + r/8 -1, x + r/1.8, y + r/8 -1, x + r/1.6, y + r/1.5 -1);
		ctx.stroke();

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw label
	 */
	var drawLabel = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = board.theme.get('stoneRadius', s);

		//Get theme properties
		var font = this.font || board.theme.get('font') || '',
			fillStyle = this.color || board.theme.get('markupColor', board.getStoneColor(this.x, this.y)),
			canvasTranslate = board.theme.get('canvasTranslate');

		//First, clear grid square below for clarity
		if (!board.hasStoneAt(this.x, this.y)) {
			board.layers.grid.clearCell(this.x, this.y);
		}

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Configure context
		ctx.fillStyle = fillStyle;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';

		//Determine font size
		if (this.text.length == 1) {
			ctx.font = Math.round(r * 1.5) + 'px ' + font;
		}
		else if (this.text.length == 2) {
			ctx.font = Math.round(r * 1.2) + 'px ' + font;
		}
		else {
			ctx.font = r + 'px ' + font;
		}

		//Draw element
		ctx.beginPath();
		ctx.fillText(this.text, x, y, 2*r);

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Clear label
	 */
	var clearLabel = function(board) {

		//No stone on location? Redraw the grid square, as we cleared it
		if (!board.hasStoneAt(this.x, this.y))  {
			var r = board.theme.get('stoneRadius', board.getCellSize());
			board.layers.grid.redrawCell(this.x, this.y);
		}
	};

	/**
	 * Constructor
	 */
	var Markup = function(properties, layer) {

		//Initialize specific vars
		this.type = '';
		layer = layer || 'markup';

		//Call parent constructor
		BoardObject.call(this, properties, layer);
	};

	/**
	 * Extend prototype
	 */
	angular.extend(Markup.prototype, BoardObject.prototype);

	/**
	 * Draw
	 */
	Markup.prototype.draw = function(board) {

		//Drawing depends on type
		switch (this.type) {

			//Triangle
			case MarkupTypes.TRIANGLE:
				drawTriangle.call(this, board);
				break;

			//Square
			case MarkupTypes.SQUARE:
				drawSquare.call(this, board);
				break;

			//Circle
			case MarkupTypes.CIRCLE:
				drawCircle.call(this, board);
				break;

			//Mark
			case MarkupTypes.MARK:
				drawMark.call(this, board);
				break;

			//Select
			case MarkupTypes.SELECT:
				drawSelect.call(this, board);
				break;

			//happy
			case MarkupTypes.HAPPY:
				drawHappySmiley.call(this, board);
				break;

			//Sad
			case MarkupTypes.SAD:
				drawSadSmiley.call(this, board);
				break;

			//Last move marker
			case MarkupTypes.LAST:
				drawLast.call(this, board);
				break;

			//Label
			case MarkupTypes.LABEL:
				this.text = this.text || '';
				drawLabel.call(this, board);
				break;
		}
	};

	/**
	 * Clear
	 */
	Markup.prototype.clear = function(board) {

		//Call parent method
		BoardObject.prototype.clear.call(this, board);

		//Special handling for label
		if (this.type == MarkupTypes.LABEL) {
			clearLabel.call(this, board);
		}
	};

	//Return
	return Markup;
});