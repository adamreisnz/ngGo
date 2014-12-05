/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Directive', [
	'ngGo.Board.Service',
	'ngGo.Board.Directive'
])

/**
 * Directive definition
 */
.directive('player', function($window, Player, Board) {
	return {
		restrict: 'E',

		/**
		 * Linking function
		 */
		link: function($scope, element, attrs) {

			//Set player in scope
			$scope.Player = Player;

			//Get parent element
			var parent = element.parent(),
				parentSize = Math.min(parent[0].clientWidth, parent[0].clientHeight);

			//Set initial dimensions
			if (parentSize > 0) {
				element.css({width: parentSize + 'px', height: parentSize + 'px'});
				$scope.$broadcast('ngGo.board.resize', parentSize, parentSize);
			}

			//Link the element
			Player.setElement(element);

			//Link the board
			$scope.$watch('Board', function(Board) {
				Player.setBoard(Board);
			});

			//On window resize, change the board dimensions
			angular.element($window).on('resize', function() {
				$scope.$broadcast('ngGo.player.resize');
			});

			//On resize event, change the board dimensions
			$scope.$on('ngGo.player.resize', function() {

				//Determine and set our size
				parentSize = Math.min(parent[0].clientWidth, parent[0].clientHeight);
				element.css({width: parentSize + 'px', height: parentSize + 'px'});

				//Propagate to board and layers
				$scope.$broadcast('ngGo.board.resize', parentSize, parentSize);
			});

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