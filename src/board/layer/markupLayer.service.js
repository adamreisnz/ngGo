
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.MarkupLayer.Service', [
	'ngGo',
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Object.Markup.Service'
])

/**
 * Factory definition
 */
.factory('MarkupLayer', function(BoardLayer, Markup) {

	/**
	 * Constructor
	 */
	var MarkupLayer = function(board, context) {

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(MarkupLayer.prototype, BoardLayer.prototype);

	/***********************************************************************************************
	 * Object handling
	 ***/

	/**
	 * Set all stones at once
	 */
	MarkupLayer.prototype.setAll = function(grid) {

		//Get changes compared to current grid
		var i, changes = this.grid.compare(grid, 'type');

		//Clear removed stuff
		for (i = 0; i < changes.remove.length; i++) {
			Markup.clear.call(this, changes.remove[i]);
		}

		//Draw added stuff
		for (i = 0; i < changes.add.length; i++) {
			Markup.draw.call(this, changes.add[i]);
		}

		//Remember new grid
		this.grid = grid.clone();
	};

	/***********************************************************************************************
	 * Drawing
	 ***/

	/**
	 * Draw layer
	 */
	MarkupLayer.prototype.draw = function() {

		//Can only draw when we have dimensions and context
		if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//Get all markup as objects
		var markup = this.grid.all('type');

		//Draw them
		for (var i = 0; i < markup.length; i++) {
			Markup.draw.call(this, markup[i]);
		}
	};

	/**
	 * Clear layer
	 */
	MarkupLayer.prototype.clear = function() {

		//Use parent method
		BoardLayer.prototype.clear.call(this);

		//Make sure the grid is redrawn, because labels could have erased parts of it
		this.board.redraw('grid');
	};

	/**
	 * Draw cell
	 */
	MarkupLayer.prototype.drawCell = function(x, y) {

		//Can only draw when we have dimensions
		if (this.board.drawWidth === 0 || this.board.drawheight === 0) {
			return;
		}

		//On grid?
		if (this.grid.has(x, y)) {
			Markup.draw.call(this, this.grid.get(x, y, 'type'));
		}
	};

	/**
	 * Clear cell
	 */
	MarkupLayer.prototype.clearCell = function(x, y) {
		if (this.grid.has(x, y)) {
			Markup.clear.call(this, this.grid.get(x, y, 'type'));
		}
	};

	//Return
	return MarkupLayer;
});