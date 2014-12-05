
/**
 * Markup :: This class is used for drawing markup
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Markup.Service', [
	'ngGo',
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
	var drawTriangle = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.triangle.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate', s, lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;

		//Draw element
		this.context.beginPath();
		this.context.moveTo(x, y-r);
		this.context.lineTo(x - Math.round(r*cosPi6), y + Math.round(r/2));
		this.context.lineTo(x + Math.round(r*cosPi6), y + Math.round(r/2));
		this.context.closePath();
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Square draw handler
	 */
	var drawSquare = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.square.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Determine cos
		var rcos = Math.round(r*cosPi4);

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate', s, lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;

		//Draw element
		this.context.beginPath();
		this.context.rect(x - rcos, y - rcos, 2*rcos, 2*rcos);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw circle handler
	 */
	var drawCircle = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.circle.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate');

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;

		//Draw element
		this.context.beginPath();
		this.context.arc(x, y, r, 0, 2*Math.PI, true);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw mark handler
	 */
	var drawMark = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.mark.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Determine cos
		var rcos = Math.round(r*cosPi4);

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			lineCap = markup.lineCap || this.board.theme.get('markup.mark.lineCap'),
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate', s, lineWidth);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;
		this.context.lineCap = lineCap;

		//Draw element
		this.context.beginPath();
		this.context.moveTo(x - rcos, y - rcos);
		this.context.lineTo(x + rcos, y + rcos);
		this.context.moveTo(x + rcos, y - rcos);
		this.context.lineTo(x - rcos, y + rcos);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw select handler
	 */
	var drawSelect = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.circle.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			fillStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate');

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.fillStyle = fillStyle;
		this.context.lineWidth = lineWidth;

		//Draw element
		this.context.beginPath();
		this.context.arc(x, y, r, 0, 2*Math.PI, true);
		this.context.fill();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Last move draw handler
	 */
	var drawLast = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.last.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var fillStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate', s);

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.fillStyle = fillStyle;

		//Draw element
		this.context.beginPath();
		this.context.moveTo(x, y);
		this.context.lineTo(x + r, y);
		this.context.lineTo(x, y + r);
		this.context.closePath();
		this.context.fill();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw happy smiley handler
	 */
	var drawHappySmiley = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.smiley.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			lineCap = markup.lineCap || this.board.theme.get('markup.smiley.lineCap'),
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate');

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;
		this.context.lineCap = lineCap;

		//Draw element
		this.context.beginPath();
		this.context.arc(x - r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		this.context.stroke();
		this.context.beginPath();
		this.context.arc(x + r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		this.context.stroke();
		this.context.beginPath();
		this.context.moveTo(x - r/1.6, y + r/8);
		this.context.bezierCurveTo(x - r/1.8, y + r/1.5, x + r/1.8, y + r/1.5, x + r/1.6, y + r/8);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw sad smiley handler
	 */
	var drawSadSmiley = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = Math.round(this.board.theme.get('stone.radius', s) * this.board.theme.get('markup.smiley.scale'));

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = markup.lineWidth || this.board.theme.get('markup.lineWidth', s) || 1,
			lineCap = markup.lineCap || this.board.theme.get('markup.smiley.lineCap'),
			strokeStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate');

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.strokeStyle = strokeStyle;
		this.context.lineWidth = lineWidth;
		this.context.lineCap = lineCap;

		//Draw element
		this.context.beginPath();
		this.context.arc(x - r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		this.context.stroke();
		this.context.beginPath();
		this.context.arc(x + r/3, y - r/3, r/6, 0, 2*Math.PI, true);
		this.context.stroke();
		this.context.beginPath();
		this.context.moveTo(x - r/1.6, y + r/1.5 -1);
		this.context.bezierCurveTo(x - r/1.8, y + r/8 -1, x + r/1.8, y + r/8 -1, x + r/1.6, y + r/1.5 -1);
		this.context.stroke();

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Draw label
	 */
	var drawLabel = function(markup) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(markup.x),
			y = this.board.getAbsY(markup.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Apply scaling factor?
		if (markup.scale) {
			r = Math.round(r * markup.scale);
		}

		//Get stone color
		var stoneColor = this.board.getStoneColor(markup.x, markup.y) * this.board.colorMultiplier;

		//Get theme properties
		var font = markup.font || this.board.theme.get('markup.label.font') || '',
			fillStyle = markup.color || this.board.theme.get('markup.color', stoneColor),
			canvasTranslate = this.board.theme.get('canvasTranslate');

		//First, clear grid square below for clarity
		if (this.board.layers.grid && !this.board.layers.stones.has(markup.x, markup.y)) {
			this.board.layers.grid.clearCell(markup.x, markup.y);
		}

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Configure context
		this.context.fillStyle = fillStyle;
		this.context.textBaseline = 'middle';
		this.context.textAlign = 'center';

		//Convert to text
		if (typeof markup.text == 'number') {
			markup.text = markup.text.toString();
		}

		//Determine font size
		if (markup.text.length == 1) {
			this.context.font = Math.round(r * 1.5) + 'px ' + font;
		}
		else if (markup.text.length == 2) {
			this.context.font = Math.round(r * 1.2) + 'px ' + font;
		}
		else {
			this.context.font = r + 'px ' + font;
		}

		//Draw element
		this.context.beginPath();
		this.context.fillText(markup.text, x, y, 2*r);

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Clear label
	 */
	var clearLabel = function(markup) {

		//No stone on location? Redraw the grid square, if we cleared it
		if (this.board.layers.grid && !this.board.layers.stones.has(markup.x, markup.y)) {
			var r = this.board.theme.get('stone.radius', this.board.getCellSize());
			this.board.layers.grid.redrawCell(markup.x, markup.y);
		}
	};

	/**
	 * Markup class
	 */
	var Markup = {

		/**
		 * Draw
		 */
		draw: function(markup) {

			//Can only draw when we have dimensions
			if (this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Drawing depends on type
			switch (markup.type) {

				//Triangle
				case MarkupTypes.TRIANGLE:
					drawTriangle.call(this, markup);
					break;

				//Square
				case MarkupTypes.SQUARE:
					drawSquare.call(this, markup);
					break;

				//Circle
				case MarkupTypes.CIRCLE:
					drawCircle.call(this, markup);
					break;

				//Mark
				case MarkupTypes.MARK:
					drawMark.call(this, markup);
					break;

				//Select
				case MarkupTypes.SELECT:
					drawSelect.call(this, markup);
					break;

				//happy
				case MarkupTypes.HAPPY:
					drawHappySmiley.call(this, markup);
					break;

				//Sad
				case MarkupTypes.SAD:
					drawSadSmiley.call(this, markup);
					break;

				//Last move marker
				case MarkupTypes.LAST:
					drawLast.call(this, markup);
					break;

				//Label
				case MarkupTypes.LABEL:
					markup.text = markup.text || '';
					drawLabel.call(this, markup);
					break;
			}
		},

		/**
		 * Clear
		 */
		clear: function(markup) {

			//Call parent method
			BoardObject.clear.call(this, markup);

			//Special handling for label
			if (markup.type == MarkupTypes.LABEL) {
				clearLabel.call(this, markup);
			}
		}
	};

	//Return
	return Markup;
});