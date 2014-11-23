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

			//Set dimensions in scope if not set yet
			if (!$scope.dimensions) {
				$scope.dimensions = {
					width: 0,
					height: 0
				};
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

			//Observe the size attribute
			attrs.$observe('size', function(value) {
				$scope.Board.setSize(value);
			});

			//Watch for dimension changes
			$scope.$watch('dimensions', function(dim) {
				$scope.Board.setDimensions(dim.width * pixelRatio, dim.height * pixelRatio);
			});
		}
	};
});