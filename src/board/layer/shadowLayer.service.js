
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.ShadowLayer.Service', [
	'ngGo.Board.Layer.Service'
])

/**
 * Factory definition
 */
.factory('ShadowLayer', function(BoardLayer) {

	/**
	 * Constructor
	 */
	var ShadowLayer = function(board, context) {

		//Call parent constructor
		BoardLayer.call(this, board, context);
	};

	/**
	 * Prototype extension
	 */
	angular.extend(ShadowLayer.prototype, BoardLayer.prototype);

	/**
	 * Draw layer
	 */
	ShadowLayer.prototype.draw = function() {

		//Get shadowsize from theme
		var shadowSize = this.board.theme.get('shadowSize', this.board.getCellSize());

		//Apply shadow transformation
		this.context.setTransform(1, 0, 0, 1, shadowSize, shadowSize);

		//Call parent method
		BoardLayer.prototype.draw.call(this);
	};

	//Return
	return ShadowLayer;
});