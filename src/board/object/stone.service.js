
/**
 * Stone :: This class is used for drawing stones on the board.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Stone.Service', [
	'ngGo',
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
	var drawMono = function(stone) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(stone.x),
			y = this.board.getAbsY(stone.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Apply scaling factor?
		if (stone.scale) {
			r = Math.round(r * stone.scale);
		}

		//Don't draw shadow
		stone.shadow = false;

		//Apply color multiplier
		var color = stone.color * this.board.colorMultiplier;

		//Get theme properties
		var lineWidth = this.board.theme.get('stone.mono.lineWidth', s) || 1,
			fillStyle = this.board.theme.get('stone.mono.color', color),
			strokeStyle = this.board.theme.get('stone.mono.lineColor', color),
			canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = stone.alpha;
		}

		//Configure context
		this.context.fillStyle = fillStyle;

		//Draw stone
		this.context.beginPath();
		this.context.arc(x, y, Math.max(0, r - lineWidth), 0, 2*Math.PI, true);
		this.context.fill();

		//Configure context
		this.context.lineWidth = lineWidth;
		this.context.strokeStyle = strokeStyle;

		//Draw outline
		this.context.stroke();

		//Undo transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = 1;
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Glass stones
	 */
	var drawGlass = function(stone) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(stone.x),
			y = this.board.getAbsY(stone.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Apply scaling factor?
		if (stone.scale) {
			r = Math.round(r * stone.scale);
		}

		//Apply color multiplier
		var color = stone.color * this.board.colorMultiplier;

		//Get theme variables
		var canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = stone.alpha;
		}

		//Begin path
		this.context.beginPath();

		//Determine stone texture
		if (color == StoneColor.W) {
			this.context.fillStyle = this.context.createRadialGradient(x - 2*r/5, y - 2*r/5, r/3, x - r/5, y - r/5, 5*r/5);
			this.context.fillStyle.addColorStop(0, '#fff');
			this.context.fillStyle.addColorStop(1, '#aaa');
		}
		else {
			this.context.fillStyle = this.context.createRadialGradient(x - 2*r/5, y - 2*r/5, 1, x - r/5, y - r/5, 4*r/5);
			this.context.fillStyle.addColorStop(0, '#666');
			this.context.fillStyle.addColorStop(1, '#000');
		}

		//Complete drawing
		this.context.arc(x, y, Math.max(0, r - 0.5), 0, 2*Math.PI, true);
		this.context.fill();

		//Undo transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = 1;
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Slate and shell stones
	 */
	var drawSlateShell = function(stone) {

		//Get coordinates and stone radius
		var x = this.board.getAbsX(stone.x),
			y = this.board.getAbsY(stone.y),
			s = this.board.getCellSize(),
			r = this.board.theme.get('stone.radius', s);

		//Apply scaling factor?
		if (stone.scale) {
			r = Math.round(r * stone.scale);
		}

		//Get random seed
		shellSeed = shellSeed || Math.ceil(Math.random() * 9999999);

		//Apply color multiplier
		var color = stone.color * this.board.colorMultiplier;

		//Get theme variables
		var canvasTranslate = this.board.theme.canvasTranslate();

		//Translate canvas
		this.context.translate(canvasTranslate, canvasTranslate);

		//Apply transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = stone.alpha;
		}

		//Begin path
		this.context.beginPath();

		//Determine fill color
		if (color == StoneColor.W) {
			this.context.fillStyle = '#aaa';
		}
		else {
			this.context.fillStyle = '#000';
		}

		//Draw filler
		this.context.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
		this.context.fill();

		//Shell stones
		if (color == StoneColor.W) {

			//Get random shell type
			var type = shellSeed%(shellTypes.length + stone.x * this.board.width + stone.y) % shellTypes.length;

			//Determine random angle
			var z = this.board.width * this.board.height + stone.x * this.board.width + stone.y,
				angle = (2/z)*(shellSeed%z);

			//Draw shell pattern
			ShellPattern.call(shellTypes[type], this.context, x, y, r, angle);

			//Add radial gradient
			this.context.beginPath();
			this.context.fillStyle = this.context.createRadialGradient(x - 2*r/5, y - 2*r/5, r/3, x - r/5, y - r/5, 5*r/5);
			this.context.fillStyle.addColorStop(0, 'rgba(255,255,255,0.9)');
			this.context.fillStyle.addColorStop(1, 'rgba(255,255,255,0)');
			this.context.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			this.context.fill();
		}

		//Slate stones
		else {

			//Add radial gradient
			this.context.beginPath();
			this.context.fillStyle = this.context.createRadialGradient(x + 2*r/5, y + 2*r/5, 0, x + r/2, y + r/2, r);
			this.context.fillStyle.addColorStop(0, 'rgba(32,32,32,1)');
			this.context.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');
			this.context.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			this.context.fill();

			//Add radial gradient
			this.context.beginPath();
			this.context.fillStyle = this.context.createRadialGradient(x - 2*r/5, y - 2*r/5, 1, x - r/2, y - r/2, 3*r/2);
			this.context.fillStyle.addColorStop(0, 'rgba(64,64,64,1)');
			this.context.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');
			this.context.arc(x, y, Math.max(0, r-0.5), 0, 2*Math.PI, true);
			this.context.fill();
		}

		//Undo transparency?
		if (stone.alpha && stone.alpha < 1) {
			this.context.globalAlpha = 1;
		}

		//Undo translation
		this.context.translate(-canvasTranslate, -canvasTranslate);
	};

	/**
	 * Constructor
	 */
	var Stone = {

		/**
		 * Draw a stone
		 */
		draw: function(stone) {

			//Can only draw when we have dimensions and context
			if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Determine style of stone
			var style = this.board.theme.get('stone.style');

			//Draw using the appropriate handler
			switch (style) {

				//Slate and shell
				case 'shell':
					drawSlateShell.call(this, stone);
					break;

				//Glass stones
				case 'glass':
					drawGlass.call(this, stone);
					break;

				//Mono stones
				case 'mono':
					drawMono.call(this, stone);
					break;

				//Custom type
				default:
					var handler = $injector.get(style);
					if (handler) {
						handler.call(this, stone);
					}
			}

			//Add shadow
			if (!this.board.static && stone.shadow !== false && this.board.theme.get('stone.shadow')) {
				this.board.layers.shadow.add(stone);
			}
		},

		/**
		 * Clear a stone
		 */
		clear: function(stone) {

			//Can only draw when we have dimensions and context
			if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
				return;
			}

			//Call parent method
			BoardObject.clear.call(this, stone);

			//Remove shadow
			if (!this.board.static && stone.shadow !== false && this.board.theme.get('stone.shadow')) {
				this.board.layers.shadow.remove(stone);
			}
		}
	};

	//Return
	return Stone;
});