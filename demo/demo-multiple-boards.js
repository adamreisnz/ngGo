
/**
 * Module definition and dependencies
 */
angular.module('ngGoDemo', [

	//ngGo player
	'ngGo.Player.Service'
])

/**
 * Controller
 */
.controller('ngGoDemoController', function($scope, Board, StoneColor) {

	//Prepare board container
	$scope.Boards = [];

	//Create some random boards
	for (var i = 0; i < 5; i++) {
		var board = new Board(5);
		for (var j = 0; j <= i; j++) {
			board.add('stones', j, j, j%2 ? StoneColor.B : StoneColor.W);
		}
		$scope.Boards.push(board);
	}
});