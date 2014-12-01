
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.HoverLayer.Service', [
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Object.Markup.Service',
	'ngGo.Board.Object.StoneFaded.Service'
])

/**
 * Factory definition
 */
.factory('HoverLayer', function(BoardLayer, Markup, StoneFaded) {

	/**
	 * Constructor
	 */
	var HoverLayer = function(board, context) {

		//Remember coordinates of last item
		this.lastX = -1;
		this.lastY = -1;

		//Remember last object
		this.lastObject = null;
		this.lastClass = null;

		//Markup to restore if hovering over it
		this.restoreMarkup = null;

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(HoverLayer.prototype, BoardLayer.prototype);

	/**
	 * Check if the remembered last coordinates are the same as the given ones
	 */
	HoverLayer.prototype.isLast = function(x, y) {
		return (this.lastX == x && this.lastY == y);
	};

	/**
	 * Add faded stone
	 */
	HoverLayer.prototype.fadedStone = function(x, y, color) {

		//Validate coordinates
		if (x == -1 || y == -1) {
			return;
		}

		//Remove any previous item
		this.remove();

		//Remember new coordinates
		this.lastX = x;
		this.lastY = y;

		//Remember last object
		this.lastClass = StoneFaded;
		this.lastObject = {
			x: x,
			y: y,
			color: color
		};

		//Draw faded stone
		StoneFaded.draw.call(this, this.lastObject);
	};

	/**
	 * Add markup
	 */
	HoverLayer.prototype.markup = function(x, y, markup) {

		//Validate coordinates
		if (x == -1 || y == -1) {
			return;
		}

		//Remove any previous item
		this.remove();

		//Remember new coordinates
		this.lastX = x;
		this.lastY = y;

		//String (type) given?
		if (typeof markup == 'string') {
			markup = {
				type: markup
			};
		}

		//Remember last object
		this.lastClass = Markup;
		this.lastObject = angular.extend(markup, {
			x: x,
			y: y
		});

		//Check if there is existing markup on the board which we need to temporarily remove
		if (this.board.layers.markup.has(x, y)) {
			this.restoreMarkup = this.board.layers.markup.get(x, y);
			this.board.layers.markup.remove(x, y);
		}

		//Draw markup
		Markup.draw.call(this, this.lastObject);
	};

	/**
	 * Remove the hover object
	 */
	HoverLayer.prototype.remove = function() {

		//Something to remove?
		if (this.lastX > -1 && this.lastY > -1) {

			//Clear last object
			if (this.lastObject && this.lastClass) {
				this.lastClass.clear.call(this, this.lastObject);
			}

			//Markup to restore?
			if (this.restoreMarkup) {
				this.board.layers.markup.add(this.lastX, this.lastY, this.restoreMarkup);
				this.restoreMarkup = null;
			}

			//Clear coordinates
			this.lastX = -1;
			this.lastY = -1;
		}
	};

	//Return
	return HoverLayer;
});