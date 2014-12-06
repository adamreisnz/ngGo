/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Directive', [
	'ngGo.Board.Directive'
])

/**
 * Directive definition
 */
.directive('player', function(Player) {
	return {
		restrict: 'E',

		/**
		 * Controller
		 */
		controller: function($scope) {

			//Set player in scope
			if (!$scope.Player) {
				$scope.Player = Player;
			}
		},

		/**
		 * Linking function
		 */
		link: function($scope, element, attrs) {

			//Link the element
			Player.setElement(element);

			//Observe mode and tool attributes
			attrs.$observe('mode', function(mode) {
				Player.switchMode(mode);
			});
			attrs.$observe('tool', function(tool) {
				Player.switchTool(tool);
			});

			//Observe variation markup and solution paths attributes
			attrs.$observe('variationMarkup', function(attr) {
				Player.toggleVariationMarkup(parseBool(attr));
			});
			attrs.$observe('solutionPaths', function(attr) {
				Player.toggleSolutionPaths(parseBool(attr));
			});

			//Observe arrowkeys and scrollwheel navigation
			attrs.$observe('arrowKeysNavigation', function(attr) {
				Player.toggleArrowKeysNavigation(parseBool(attr));
			});
			attrs.$observe('scrollWheelNavigation', function(attr) {
				Player.toggleScrollWheelNavigation(parseBool(attr));
			});

			//Observe last move attributes
			attrs.$observe('markLastMove', function(attr) {
				Player.toggleMarkLastMove(parseBool(attr));
			});
			attrs.$observe('lastMoveMarker', function(attr) {
				Player.setLastMoveMarker(attr);
			});
		}
	};
});