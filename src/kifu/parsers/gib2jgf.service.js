
/**
 * Gib2Jgf :: This is a parser wrapped by the KifuParser which is used to convert fom GIB to JGF.
 * Since the Gib format is not public, the accuracy of this parser is not guaranteed.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parsers.Gib2Jgf.Service', [
	'ngGo',
	'ngGo.Kifu.Blank.Service'
])

/**
 * Factory definition
 */
.factory('Gib2Jgf', function(ngGo, KifuBlank) {

	/**
	 * Regular expressions
	 */
	var regMove = /STO\s0\s([0-9]+)\s(1|2)\s([0-9]+)\s([0-9]+)/gi,
		regPlayer = /GAME(BLACK|WHITE)NAME=([A-Za-z0-9]+)\s\(([0-9]+D|K)\)/gi,
		regKomi = /GAMEGONGJE=([0-9]+)/gi,
		regDate = /GAMEDATE=([0-9]+)-\s?([0-9]+)-\s?([0-9]+)/g,
		regResultMargin = /GAMERESULT=(white|black)\s([0-9]+\.?[0-9]?)/gi,
		regResultOther = /GAMERESULT=(white|black)\s[a-z\s]+(resignation|time)/gi;

	/**
	 * Player parser function
	 */
	var parsePlayer = function(jgf, match) {

		//Initialize players container
		if (typeof jgf.game.players == 'undefined') {
			jgf.game.players = [];
		}

		//Determine player color
		var color = (match[1].toUpperCase() == 'BLACK') ? 'black' : 'white';

		//Create player object
		var player = {
			color: color,
			name: match[2],
			rank: match[3].toLowerCase()
		};

		//Check if player of this color already exists, if so, overwrite
		for (var p = 0; p < jgf.game.players.length; p++) {
			if (jgf.game.players[p].color == color) {
				jgf.game.players[p] = player;
				return;
			}
		}

		//Player of this color not found, push
		jgf.game.players.push(player);
	};

	/**
	 * Komi parser function
	 */
	var parseKomi = function(jgf, match) {
		jgf.game.komi = parseFloat(match[1]/10);
	};

	/**
	 * Date parser function
	 */
	var parseDate = function(jgf, match) {

		//Initialize dates container
		if (typeof jgf.game.dates == 'undefined') {
			jgf.game.dates = [];
		}

		//Push date
		jgf.game.dates.push(match[1]+'-'+match[2]+'-'+match[3]);
	};

	/**
	 * Result parser function
	 */
	var parseResult = function(jgf, match) {

		//Winner color
		var result = (match[1].toLowerCase() == 'black') ? 'B' : 'W';
		result += '+';

		//Win condition
		if (match[2].match(/res/i)) {
			result += 'R';
		}
		else if (match[2].match(/time/i)) {
			result += 'T';
		}
		else {
			result += match[2];
		}

		//Set in JGF
		jgf.game.result = result;
	};

	/**
	 * Move parser function
	 */
	var parseMove = function(jgf, node, match) {

		//Determine player color
		var color = match[2];
		if (color == 1) {
			color = 'B';
		}
		else if (color == 2) {
			color = 'W';
		}
		else {
			return;
		}

		//Create move container
		node.move = {};

		//Pass
		if (false) {

		}

		//Regular move
		else {
			node.move[color] = [match[3] * 1, match[4] * 1];
		}
	};

	/**
	 * Parser class
	 */
	var Parser = {

		/**
		 * Parse GIB string into a JGF object or string
		 */
		parse: function(gib, stringified) {

			//Get new JGF object
			var jgf = KifuBlank.jgf();

			//Initialize
			var match, container = jgf.tree;

			//Create first node for game, which is usually an empty board position, but can
			//contain comments or board setup instructions, which will be added to the node
			//later if needed.
			var node = {root: true};
			container.push(node);

			//Find player information
			while (match = regPlayer.exec(gib)) {
				parsePlayer(jgf, match);
			}

			//Find komi
			if (match = regKomi.exec(gib)) {
				parseKomi(jgf, match);
			}

			//Find game date
			if (match = regDate.exec(gib)) {
				parseDate(jgf, match);
			}

			//Find game result
			if ((match = regResultMargin.exec(gib)) || (match = regResultOther.exec(gib))) {
				parseResult(jgf, match);
			}

			//Find moves
			while (match = regMove.exec(gib)) {

				//Create new node
				node = {};

				//Parse move
				parseMove(jgf, node, match);

				//Push node to container
				container.push(node);
			}

			//Return stringified
			if (stringified) {
				return angular.toJson(jgf);
			}

			//Return jgf
			return jgf;
		}
	};

	//Return object
	return Parser;
});
