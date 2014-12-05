/**
 * Some JGF data to work with, since Chrome doesnt allow loading a file due to cross domain policy
 */
var testJGF1 = {
	"record": {
		"application": "ngGo v3.0.3",
		"version": 1,
		"charset": "UTF-8"
	},
	"game": {
		"type": "go",
		"name": "Demo JGF",
		"players": [
			{
				"color": "black",
				"name": "Black",
				"rank": "5k"
			},
			{
				"color": "white",
				"name": "White",
				"rank": "2d"
			}
		],
		"rules": "Japanese",
		"komi": 0.5
	},
	"board": {
		"width": 9,
		"height": 9
	},
	"tree": [{"root":true,"markup":{"circle":["af","bf","cf"],"label":[["ac","1"],["bc","2"],["cc","3"],["ag","A"],["bg","B"],["cg","C"]],"happy":["ah","ch"],"sad":["bh"],"triangle":["aa","ba","ca"],"square":["ab","bb","cb"],"select":["ae","be","ce"],"mark":["ad","bd","cd"]},"setup":{"W":["ba","bb","bc","bd","be","bf","bg","bh"],"B":["aa","ab","ac","ad","ae","af","ag","ah"]},"comments":["Comment at start of game"]},[[{"move":{"B":"gc"},"comments":["Comment at first variation"],"name":"First variation"},{"move":{"W":"gg"}},{"move":{"B":"cc"}},{"move":{"W":"dc"}},{"move":{"B":"cb"}},{"move":{"W":"db"}},{"move":{"B":"ca"}},{"move":{"W":"cd"}},{"move":{"B":"da"}},{"move":{"W":"ea"}},{"move":{"B":"bi"}},{"move":{"W":"ef"}},{"move":{"B":"ch"}},{"move":{"W":"cg"}},{"move":{"B":"dh"}},{"move":{"W":"dg"}},{"move":{"B":"eh"}},{"move":{"W":"ge"}},{"move":{"B":"fg"}},{"move":{"W":"ff"}},{"move":{"B":"gh"}},{"move":{"W":"hg"}},{"move":{"B":"hh"}},{"move":{"W":"ig"}},{"move":{"B":"ih"}},{"move":{"W":"fd"}},{"move":{"B":"ai"}},{"move":{"W":"hd"}},{"move":{"B":"ci"}},{"move":{"W":"eg"}},{"move":{"B":"fh"}},{"move":{"W":"gi"}},{"move":{"B":"fi"}}],[{"move":{"B":"gg"},"comments":["Comment at second variation"],"name":"Second variation"},[[{"move":{"W":"gc"}},{"mode":"solve","move":{"B":"eg"}},[[{"move":{"W":"ec","solution":true}},{"move":{"B":"fe","solution":true}}],[{"move":{"W":"ge","solution":true}},{"move":{"B":"dh","solution":true}}]]],[{"setup":{"E":["aa","ba","ab","bb","ac","bc","ad","bd","ae","be","af","bf","ag","bg","ah","bh"]},"comments":["Variation where setup stones have been removed"],"name":"Third variation"},{"move":{"W":"cc"}},{"move":{"B":"cg"}},{"move":{"W":"gc"}},{"move":{"B":"ef"}},{"move":{"W":"ed"}}]]]]]
};

/**
 * Module definition and dependencies
 */
angular.module('ngGoDemo', [

	//ngGo player
	'ngGo.Player.Service',

	//ngGo player modes that you wish to enable
	'ngGo.Player.Mode.Edit.Service',
	'ngGo.Player.Mode.Demo.Service',
	'ngGo.Player.Mode.Solve.Service',
	'ngGo.Player.Mode.Replay.Service'
])

/**
 * Configuration
 */
.config(function(
	PlayerProvider, BoardProvider, BoardThemeProvider
) {

	//Player configuration
	PlayerProvider.setConfig({
		lastMoveMarker: 'circle',
		autoPlayDelay: 750
	});

	//Board configuration
	BoardProvider.setConfig({
		coordinates: true
	});

	//Board theme
	BoardThemeProvider.setTheme({
		coordinates: {
			vertical: {
				style: 'kanji',
				inverse: false
			},
			horizontal: {
				style: 'numbers',
				inverse: false
			}
		}
	});
})

/**
 * Controller
 */
.controller('ngGoDemoController', function($scope, $timeout, $http, Player) {

	//Set the game in scope for easy access
	$scope.Game = Player.game;

	//Load game data from external source
	/*$http.get('demo-replay.jgf').success(function(data) {
		Player.load(data);
	});*/

	//Load local data
	Player.load(testJGF1);
})

/**
 * Stone color example filter
 */
.filter('stoneColor', function(StoneColor) {
	return function(color) {
		if (color == StoneColor.B) {
			return 'Black';
		}
		else if (color == StoneColor.W) {
			return 'White';
		}
		else if (color == StoneColor.E) {
			return '';
		}
		return input;
	};
});