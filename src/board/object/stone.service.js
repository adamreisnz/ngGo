
/**
 * Stone :: This class represents stones on the board and is repsonsible for drawing them.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Stone.Service', [
	'ngGo.Service',
	'ngGo.Board.Object.Service',
	'ngGo.Board.ShellPattern.Service'
])

/**
 * Factory definition
 */
.factory('Stone', function($injector, BoardObject, StoneColor, ShellPattern) {

	/**
	 * Shell random seed
	 */
	var shellSeed;

	/**
	 * Pre-defined shell types
	 */
	var shellTypes = [
		{
			lines: [0.10, 0.12, 0.11, 0.10, 0.09, 0.09, 0.09, 0.09],
			factor: 0.25,
			thickness: 1.75
		},
		{
			lines: [0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06],
			factor: 0.2,
			thickness: 1.5
		},
		{
			lines: [0.12, 0.14, 0.13, 0.12, 0.12, 0.12],
			factor: 0.3,
			thickness: 2
		}
	];

	/**
	 * Mono colored stones
	 */
	var drawMono = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = board.theme.get('stoneRadius', s);

		//Apply scaling factor?
		if (this.scale) {
			r = Math.round(r * this.scale);
		}

		//Get theme properties
		var lineWidth = board.theme.get('markupLinesWidth', s) || 1;
			canvasTranslate = board.theme.get('canvasTranslate');

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (this.alpha && this.alpha < 1) {
			ctx.globalAlpha = this.alpha;
		}

		//Configure context
		ctx.fillStyle = (this.color == StoneColor.W) ? board.theme.get('stoneColorMonoWhite') : board.theme.get('stoneColorMonoBlack');

		//Draw stone
		ctx.beginPath();
		ctx.arc(x, y, Math.max(0, r - lineWidth), 0, 2*Math.PI, true);
		ctx.fill();

		//Configure context
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = '#000';

		//Draw outline
		ctx.stroke();

		//Undo transparency?
		if (this.alpha && this.alpha < 1) {
			ctx.globalAlpha = 1;
		}

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Glass stones
	 */
	var drawGlass = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = board.theme.get('stoneRadius', s);

		//Apply scaling factor?
		if (this.scale) {
			r = Math.round(r * this.scale);
		}

		//Get theme variables
		var canvasTranslate = board.theme.get('canvasTranslate');

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (this.alpha && this.alpha < 1) {
			ctx.globalAlpha = this.alpha;
		}

		//Begin path
		ctx.beginPath();

		//Determine stone texture
		if (this.color == StoneColor.W) {
			ctx.fillStyle = ctx.createRadialGradient(x - 2*r/5, y - 2*r/5, r/3, x - r/5, y - r/5, 5*r/5);
			ctx.fillStyle.addColorStop(0, '#fff');
			ctx.fillStyle.addColorStop(1, '#aaa');
		}
		else {
			ctx.fillStyle = ctx.createRadialGradient(x - 2*r/5, y - 2*r/5, 1, x - r/5, y - r/5, 4*r/5);
			ctx.fillStyle.addColorStop(0, '#666');
			ctx.fillStyle.addColorStop(1, '#000');
		}

		//Complete drawing
		ctx.arc(x, y, Math.max(0, r - 0.5), 0, 2*Math.PI, true);
		ctx.fill();

		//Undo transparency?
		if (this.alpha && this.alpha < 1) {
			ctx.globalAlpha = 1;
		}

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Slate and shell stones
	 */
	var drawSlateShell = function(board) {

		//Get context
		var ctx = board.layers[this.layer].getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = board.theme.get('stoneRadius', s);

		//Apply scaling factor?
		if (this.scale) {
			r = Math.round(r * this.scale);
		}

		//Get random seed
		shellSeed = shellSeed || Math.ceil(Math.random() * 9999999);

		//Get theme variables
		var canvasTranslate = board.theme.get('canvasTranslate');

		//Translate canvas
		ctx.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (this.alpha && this.alpha < 1) {
			ctx.globalAlpha = this.alpha;
		}

		//Begin path
		ctx.beginPath();

		//Determine fill color
		if (this.color == StoneColor.W) {
			ctx.fillStyle = '#aaa';
		}
		else {
			ctx.fillStyle = '#000';
		}

		//Draw filler
		ctx.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
		ctx.fill();

		//Shell stones
		if (this.color == StoneColor.W) {

			//Get random shell type
			var type = shellSeed%(shellTypes.length + this.x * board.width + this.y) % shellTypes.length;

			//Determine random angle
			var z = board.width * board.height + this.x*board.width + this.y,
				angle = (2/z)*(shellSeed%z);

			//Draw shell pattern
			ShellPattern.call(shellTypes[type], ctx, x, y, r, angle);

			//Add radial gradient
			ctx.beginPath();
			ctx.fillStyle = ctx.createRadialGradient(x - 2*r/5, y - 2*r/5, r/3, x - r/5, y - r/5, 5*r/5);
			ctx.fillStyle.addColorStop(0, 'rgba(255,255,255,0.9)');
			ctx.fillStyle.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			ctx.fill();
		}

		//Slate stones
		else {

			//Add radial gradient
			ctx.beginPath();
			ctx.fillStyle = ctx.createRadialGradient(x + 2*r/5, y + 2*r/5, 0, x + r/2, y + r/2, r);
			ctx.fillStyle.addColorStop(0, 'rgba(32,32,32,1)');
			ctx.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			ctx.fill();

			//Add radial gradient
			ctx.beginPath();
			ctx.fillStyle = ctx.createRadialGradient(x - 2*r/5, y - 2*r/5, 1, x - r/2, y - r/2, 3*r/2);
			ctx.fillStyle.addColorStop(0, 'rgba(64,64,64,1)');
			ctx.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			ctx.fill();
		}

		//Undo transparency?
		if (this.alpha && this.alpha < 1) {
			ctx.globalAlpha = 1;
		}

		//Undo translation
		ctx.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Generic shadow drawer
	 */
	var drawShadow = function(board) {

		//Don't draw shadows if we have transparency or if there is no shadows layer
		if ((this.alpha && this.alpha < 1) || !board.layers.shadow) {
			return;
		}

		//Get context
		var ctx = board.layers.shadow.getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = Math.max(0, board.theme.get('stoneRadius', s) - 0.5);

		//Apply scaling factor?
		if (this.scale) {
			r = Math.round(r * this.scale);
		}

		//Get theme properties
		var blur = board.theme.get('shadowBlur', s),
			shadowColor = board.theme.get('shadowColor'),
			shadowTransparentColor = board.theme.get('shadowTransparentColor');

		//Configure context
		ctx.fillStyle = ctx.createRadialGradient(x, y, r-1-blur, x, y, r+blur);
		ctx.fillStyle.addColorStop(0, shadowColor);
		ctx.fillStyle.addColorStop(1, shadowTransparentColor);

		//Draw shadow
		ctx.beginPath();
		ctx.arc(x, y, r+blur, 0, 2*Math.PI, true);
		ctx.fill();
	};

	/**
	 * Generic shadow clearer
	 */
	var clearShadow = function(board) {

		//Don't draw shadows if we have transparency or if there is no shadow layer
		if ((this.alpha && this.alpha < 1) || !board.layers.shadow) {
			return;
		}

		//Get context
		var ctx = board.layers.shadow.getContext();

		//Get coordinates and stone radius
		var x = board.getAbsX(this.x),
			y = board.getAbsY(this.y),
			s = board.getCellSize(),
			r = board.theme.get('stoneRadius', s);

		//Clear a generous rectangle on the shadow layer
		ctx.clearRect(x - 1.2*r, y - 1.2*r, 2.4*r, 2.4*r);
	};

	/**
	 * Constructor
	 */
	var Stone = function(properties, layer) {

		//Initialize specific vars
		this.color = 0;
		layer = layer || 'stones';

		//Parent constructor
		BoardObject.call(this, properties, layer);
	};

	/**
	 * Extend prototype
	 */
	angular.extend(Stone.prototype, BoardObject.prototype);

	/**
	 * Draw
	 */
	Stone.prototype.draw = function(board) {

		//Can only draw when we have dimensions
		if (board.drawWidth === 0 || board.drawheight === 0) {
			return;
		}

		//Determine style of stone
		var style = board.theme.get('stoneStyle');

		//Draw using the appropriate handler
		switch (style) {

			//Slate and shell
			case 'shell':
				drawSlateShell.call(this, board);
				break;

			//Glass stones
			case 'glass':
				drawGlass.call(this, board);
				break;

			//Mono stones
			case 'mono':
				drawMono.call(this, board);
				break;

			//Custom type
			default:
				var handler = $injector.get(style);
				if (handler) {
					handler.call(this, board);
				}
		}

		//Draw shadow
		if (board.theme.get('stoneShadow')) {
			drawShadow.call(this, board);
		}
	};

	/**
	 * Clear
	 */
	Stone.prototype.clear = function(board) {

		//Call parent method
		BoardObject.prototype.clear.call(this, board);

		//Clear shadow
		if (board.theme.get('stoneShadow')) {
			clearShadow.call(this, board);
		}
	};

	//Return
	return Stone;
});