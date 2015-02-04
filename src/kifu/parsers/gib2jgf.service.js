
/**
 * Gib2Jgf :: This is a parser wrapped by the KifuParser which is used to convert fom GIB to JGF
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
.factory('Gib2Jgf', function(ngGo, gibAliases, KifuBlank) {

	var regMove = /STO\s0\s([0-9]+)\s(1|2)\s([0-9]+)\s([0-9]+)/g;

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

			//Find moves
			while (match = regMove.exec(gib)) {

				//Create new node
				node = {};

				//Parse move
				parseMove(jgf, node, match);

				//Push node to container
				container.push(node);
			}

			//Return jgf
			return jgf;
		}
	};

	//Return object
	return Parser;
});