/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Directive', [
	'ngGo.Board.Service',
	'ngGo.Board.Layer.Directive',
	'ngGo.Board.Layer.GridLayer.Directive',
	'ngGo.Board.Layer.StonesLayer.Directive',
	'ngGo.Board.Layer.MarkupLayer.Directive',
	'ngGo.Board.Layer.ShadowLayer.Directive',
	'ngGo.Board.Layer.ScoreLayer.Directive',
	'ngGo.Board.Layer.HoverLayer.Directive'
])

/**
 * Directive definition
 */
.directive('board', function(Board) {
	return {
		restrict:	'E',
		template:	"\n<gridlayer></gridlayer>" +
					"\n<shadowlayer></shadowlayer>" +
					"\n<stoneslayer></stoneslayer>" +
					"\n<scorelayer></scorelayer>" +
					"\n<markuplayer></markuplayer>" +
					"\n<hoverlayer></hoverlayer>",
		/**
		 * Controller
		 */
		controller: function($scope) {
			$scope.Board = new Board();
		},

		/**
		 * Linking function
		 */
		link: function($scope, element, attrs) {

			//Get pixel ratio
			var pixelRatio = window.pixelRatio || 1;

			//Observe the board size attributes (should be 19x19 format)
			attrs.$observe('size', function(size) {
				size = size.split('x');
				$scope.Board.setSize(size[0], size[1]);
			});

			//Listen for board resize events
			$scope.$on('ngGo.board.resize', function(event, width, height) {
				$scope.Board.setDrawSize(width * pixelRatio, height * pixelRatio);
			});

			//Observe the coordinates attribute
			attrs.$observe('coordinates', function(show) {
				$scope.Board.toggleCoordinates((show === true || show == 'true'));
			});
		}
	};
});