/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Directive', [
	'ngGo.Player.Events.Service',
	'ngGo.Board.Service',
	'ngGo.Board.Directive'
])

/**
 * Directive definition
 */
.directive('player', function($window, Player, PlayerEvents, Board) {
	return {
		restrict: 'E',

		/**
		 * Controller
		 */
		controller: function($scope) {

			//Initialize player
			$scope.Player = Player;

			//Create a new board for the player and set it in scope for the
			//child board and layer directives to use
			$scope.Board = Player.board = new Board();

			//Initialize dimensions
			$scope.dimensions = {
				width: 0,
				height: 0
			};
		},

		/**
		 * Linking function
		 */
		link: function($scope, element, attrs) {

			//Get parent element
			var parent = element.parent(),
				parentSize = Math.min(parent[0].clientWidth, parent[0].clientHeight);

			//Set dimensions
			element.css({width: parentSize, height: parentSize});
			$scope.dimensions = {
				width: parentSize,
				height: parentSize
			};

			//On resize, change the board dimensions
			angular.element($window).on('resize.ngGo.player', function() {
				$scope.$apply(function() {
					parentSize = Math.min(parent[0].clientWidth, parent[0].clientHeight);
					element.css({width: parentSize, height: parentSize});
					$scope.dimensions = {
						width: parentSize,
						height: parentSize
					};
				});
			});

			//Bind other needed event listeners to the element
			var events = PlayerEvents.getElementEvents();
			for (var e = 0; e < events.length; e++) {
				element.on(events[e] + '.ngGo.player', PlayerEvents.broadcast.bind(PlayerEvents, events[e]));
			}

			//Observe mode and tool attributes
			attrs.$observe('mode', function(mode) {
				Player.switchMode(mode);
			});
			attrs.$observe('tool', function(tool) {
				Player.switchTool(tool);
			});

			//Observe arrowkeys and scrollwheel navigation
			attrs.$observe('arrowKeysNavigation', function(value) {
				Player.setArrowKeysNavigation(value);
			});
			attrs.$observe('scrollWheelNavigation', function(value) {
				Player.setScrollWheelNavigation(value);
			});

			//Observe marking attributes
			attrs.$observe('lastMoveMarker', function(value) {
				Player.setLastMoveMarker(value);
			});
			attrs.$observe('markLastMove', function(value) {
				Player.setMarkLastMove(value);
			});
			attrs.$observe('markVariations', function(value) {
				Player.setMarkVariations(value);
			});
		}
	};
});