/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Directive', [
	'ngGo.Board.Service',
	'ngGo.Board.Layer.Directive'
])

/**
 * Directive definition
 */
.directive('board', function($injector, Board) {
	return {
		restrict: 'E',

		/**
		 * Controller
		 */
		controller: function($scope) {

			//Set board in scope if not set yet
			if (!$scope.Board) {
				$scope.Board = new Board();
			}

			/**
			 * Helper to add a new layer
			 */
			$scope.addLayer = function(name, type, context) {
				type = type.charAt(0).toUpperCase() + type.substr(1) + 'Layer';
				if ($injector.has(type)) {
					var boardLayer = $injector.get(type);
					$scope.Board.addLayer(name, new boardLayer($scope.Board, context));
				}
			};
		},

		/**
		 * Linking function
		 */
		link: function($scope, element, attrs) {

			//Get pixel ratio
			var pixelRatio = window.pixelRatio || 1;

			//Observe the coordinates attribute
			attrs.$observe('showCoordinates', function(value) {
				$scope.Board.toggleCoordinates(value);
			});

			//Observe the board size attributes (should be 19x19 format)
			attrs.$observe('size', function(size) {
				size = size.split('x');
				$scope.Board.setSize(size[0], size[1]);
			});

			//Listen for board resize events
			$scope.$on('ngGo.board.resize', function(event, width, height) {
				$scope.Board.setDimensions(width * pixelRatio, height * pixelRatio);
			});
		}
	};
});