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

			//Re-initialize player
			Player.init();

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
			Player.linkElement(element);

			//Observe mode and tool attributes
			attrs.$observe('mode', function(mode) {
				Player.switchMode(mode);
			});
			attrs.$observe('tool', function(tool) {
				Player.switchTool(tool);
			});

			//Observe other settings attributes
			attrs.$observe('variationMarkup', function(attr) {
				Player.toggleVariationMarkup(parseBool(attr));
			});
			attrs.$observe('solutionPaths', function(attr) {
				Player.toggleSolutionPaths(parseBool(attr));
			});
			attrs.$observe('lastMoveMarker', function(attr) {
				Player.setLastMoveMarker(attr);
			});
		}
	};
});