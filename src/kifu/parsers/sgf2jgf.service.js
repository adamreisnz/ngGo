
/**
 * Sgf2Jgf :: This is a parser wrapped by the KifuParser which is used to convert fom SGF to JGF
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parsers.Sgf2Jgf.Service', [
	'ngGo.Kifu.Blank.Service'
])

/**
 * Factory definition
 */
.factory('Sgf2Jgf', function(ngGo, sgfAliases, sgfGames, KifuBlank) {

	/**
	 * Regular expressions for SGF data
	 */
	var regSequence = /\(|\)|(;(\s*[A-Z]+\s*((\[\])|(\[(.|\s)*?([^\\]\])))+)*)/g,
		regNode = /[A-Z]+\s*((\[\])|(\[(.|\s)*?([^\\]\])))+/g,
		regProperty = /[A-Z]+/,
		regValues = /(\[\])|(\[(.|\s)*?([^\\]\]))/g;

	/***********************************************************************************************
	 * Conversion helpers
	 ***/

	/**
	 * Application parser function (doesn't overwrite existing signature)
	 */
	var parseApp = function(jgf, node, key, value) {
		if (!jgf.record.application) {
			var app = value[0].split(':');
			if (app.length > 1) {
				jgf.record.application = app[0] + ' v' + app[1];
			}
			else {
				jgf.record.application = app[0];
			}
		}
	};

	/**
	 * Game type parser function
	 */
	var parseGame = function(jgf, node, key, value) {
		var game = value[0];
		if (typeof sgfGames[game] != 'undefined') {
			jgf.game.type = sgfGames[game];
		}
		else {
			jgf.game.type = value[0];
		}
	};

	/**
	 * Move parser function
	 */
	var parseMove = function(jgf, node, key, value) {

		//Create move container
		node.move = {};

		//Pass
		if (value[0] === '' || (jgf.width <= 19 && value[0].toLowerCase() == 'tt')) {
			node.move[key] = 'pass';
		}

		//Regular move
		else {
			node.move[key] = value[0].toLowerCase();
		}
	};

	/**
	 * Comment parser function
	 */
	var parseComment = function(jgf, node, key, value) {

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Set value
		node[key] = value;
	};

	/**
	 * Node name parser function
	 */
	var parseNodeName = function(jgf, node, key, value) {

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Set value
		node[key] = value[0];
	};

	/**
	 * Board setup parser function
	 */
	var parseSetup = function(jgf, node, key, value) {

		//Initialize setup container on node
		if (typeof node.setup == 'undefined') {
			node.setup = {};
		}

		//Remove "A" from setup key
		key = key.charAt(1);

		//Initialize setup container of this type
		if (typeof node.setup[key] == 'undefined') {
			node.setup[key] = [];
		}

		//Add values
		for (var i in value) {
			node.setup[key].push(value[i].toLowerCase());
		}
	};

	/**
	 * Scoring parser function
	 */
	var parseScore = function(jgf, node, key, value) {

		//Initialize score container on node
		if (typeof node.score == 'undefined') {
			node.score = {
				B: [],
				W: []
			};
		}

		//Remove "T" from setup key
		key = key.charAt(1);

		//Add values
		for (var i in value) {
			node.score[key].push(value[i].toLowerCase());
		}
	};

	/**
	 * Turn parser function
	 */
	var parseTurn = function(jgf, node, key, value) {
		node.turn = value[0];
	};

	/**
	 * Label parser function
	 */
	var parseLabel = function(jgf, node, key, value) {

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Initialize markup container on node
		if (typeof node.markup == 'undefined') {
			node.markup = {};
		}

		//Initialize markup container of this type
		if (typeof node.markup[key] == 'undefined') {
			node.markup[key] = [];
		}

		//Add values
		for (var i in value) {

			//Split coordinates and label
			var coords = value[i].substr(0, 2).toLowerCase(),
				label = value[i].substr(3);

			//Add to node
			node.markup[key].push([coords, label]);
		}
	};

	/**
	 * Markup parser function
	 */
	var parseMarkup = function(jgf, node, key, value) {

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Initialize markup container on node
		if (typeof node.markup == 'undefined') {
			node.markup = {};
		}

		//Initialize markup container of this type
		if (typeof node.markup[key] == 'undefined') {
			node.markup[key] = [];
		}

		//Add values
		for (var i in value) {
			node.markup[key].push(value[i].toLowerCase());
		}
	};

	/**
	 * Size parser function
	 */
	var parseSize = function(jgf, node, key, value) {

		//Initialize board container
		if (typeof jgf.board == 'undefined') {
			jgf.board = {};
		}

		//Add size property (can be width:height or just a single size)
		var size = value[0].split(':');
		if (size.length > 1) {
			jgf.board.width = parseInt(size[0]);
			jgf.board.height = parseInt(size[1]);
		}
		else {
			jgf.board.width = jgf.board.height = parseInt(size[0]);
		}
	};

	/**
	 * Komi parser function
	 */
	var parseKomi = function(jgf, node, key, value) {
		jgf.game.komi = parseFloat(value[0]);
	};

	/**
	 * Variations handling parser function
	 */
	var parseVariations = function(jgf, node, key, value) {

		//Initialize display property
		if (typeof jgf.display == 'undefined') {
			jgf.display = {};
		}

		//Initialize variation display settings
		jgf.display.variation_markup = false;
		jgf.display.variation_children = false;
		jgf.display.variation_siblings = false;

		//Parse as integer
		var st = parseInt(value[0]);

		//Determine what we want (see SGF specs for details)
		switch (st) {
			case 0:
				jgf.display.variation_markup = true;
				jgf.display.variation_children = true;
				break;
			case 1:
				jgf.display.variation_markup = true;
				jgf.display.variation_siblings = true;
				break;
			case 2:
				jgf.display.variation_children = true;
				break;
			case 3:
				jgf.display.variation_siblings = true;
				break;
		}
	};

	/**
	 * Player info parser function
	 */
	var parsePlayer = function(jgf, node, key, value) {

		//Initialize players container
		if (typeof jgf.game.players == 'undefined') {
			jgf.game.players = [];
		}

		//Determine player color
		var color = (key == 'PB' || key == 'BT' || key == 'BR') ? 'black' : 'white';

		//Get key alias
		if (typeof sgfAliases[key] != 'undefined') {
			key = sgfAliases[key];
		}

		//Check if player of this color already exists
		for (var p = 0; p < jgf.game.players.length; p++) {
			if (jgf.game.players[p].color == color) {
				jgf.game.players[p][key] = value[0];
				return;
			}
		}

		//Player of this color not found, initialize
		var player = {color: color};
		player[key] = value[0];
		jgf.game.players.push(player);
	};

	/**
	 * Parsing function to property mapper
	 */
	var parsingMap = {

		//Application, game type, board size, komi
		'AP':	parseApp,
		'GM':	parseGame,
		'SZ':	parseSize,
		'KM':	parseKomi,

		//Variations handling
		'ST':	parseVariations,

		//Player info handling
		'PB':	parsePlayer,
		'PW':	parsePlayer,
		'BT':	parsePlayer,
		'WT':	parsePlayer,
		'BR':	parsePlayer,
		'WR':	parsePlayer,

		//Moves
		'B':	parseMove,
		'W':	parseMove,

		//Node annotation
		'C':	parseComment,
		'N':	parseNodeName,

		//Board setup
		'AB':	parseSetup,
		'AW':	parseSetup,
		'AE':	parseSetup,
		'PL':	parseTurn,
		'TW':	parseScore,
		'TB':	parseScore,

		//Markup
		'CR':	parseMarkup,
		'SQ':	parseMarkup,
		'TR':	parseMarkup,
		'MA':	parseMarkup,
		'SL':	parseMarkup,
		'LB':	parseLabel
	};

	/**
	 * These properties need a node object
	 */
	var needsNode = ['B', 'W', 'C', 'N', 'AB', 'AW', 'AE', 'PL', 'LB', 'CR', 'SQ', 'TR', 'MA', 'SL', 'TW', 'TB'];

	/***********************************************************************************************
	 * Parser helpers
	 ***/

	/**
	 * Set info in the JGF tree at a certain position
	 */
	var setInfo = function(jgf, position, value) {

		//Position given must be an array
		if (typeof position != 'object') {
			return;
		}

		//Initialize node to attach value to
		var node = jgf, key;

		//Loop the position
		for (var p = 0; p < position.length; p++) {

			//Get key
			key = position[p];

			//Last key reached? Done
			if ((p + 1) == position.length) {
				break;
			}

			//Create container if not set
			if (typeof node[key] != 'object') {
				node[key] = {};
			}

			//Move up in tree
			node = node[key];
		}

		//Set value
		node[key] = value;
	};

	/**
	 * Parser class
	 */
	var Parser = {

		/**
		 * Parse SGF string into a JGF object or string
		 */
		parse: function(sgf, stringified) {

			//Get new JGF object (with SGF node as a base)
			var jgf = KifuBlank.jgf({record: {sgf: {}}});

			//Initialize
			var stack = [],
				container = jgf.tree;

			//Create first node for game, which is usually an empty board position, but can
			//contain comments or board setup instructions, which will be added to the node
			//later if needed.
			var node = {root: true};
			container.push(node);

			//Find sequence of elements
			var sequence = sgf.match(regSequence);

			//Loop sequence items
			for (var i in sequence) {

				//Push stack if new variation found
				if (sequence[i] == '(') {

					//First encounter, this defines the main tree branch, so skip
					if (i === 0 || i === '0') {
						continue;
					}

					//Push the current container to the stack
					stack.push(container);

					//Create variation container if it doesn't exist yet
					if (!angular.isArray(container[container.length-1])) {
						container.push([]);
					}

					//Use variation container
					container = container[container.length-1];

					//Now create moves container
					container.push([]);
					container = container[container.length-1];
					continue;
				}

				//Grab last container from stack if end of variation reached
				else if (sequence[i] == ')') {
					if (stack.length) {
						container = stack.pop();
					}
					continue;
				}

				//Make array of properties within this sequence
				var properties = sequence[i].match(regNode) || [];

				//Loop them
				for (var j in properties) {

					//Get property's key and separate values
					var key = regProperty.exec(properties[j])[0].toUpperCase(),
						values = properties[j].match(regValues);

					//Remove additional braces [ and ]
					for (var k in values) {
						values[k] = values[k].substring(1, values[k].length - 1).replace(/\\(?!\\)/g, "");
					}

					//SGF parser present for this key? Call it, and we're done
					if (typeof parsingMap[key] != 'undefined') {

						//Does this type of property need a node?
						if (needsNode.indexOf(key) !== -1) {

							//If no node object present, create a new node
							//For moves, always a new node is created
							if (!node || key == 'B' || key == 'W') {
								node = {};
								container.push(node);
							}
						}

						//Apply parsing function on node
						parsingMap[key](jgf, node, key, values);
						continue;
					}

					//No SGF parser present, we continue with regular property handling

					//If there is only one value, simplify array
					if (values.length == 1) {
						values = values[0];
					}

					//SGF alias known? Then this is an info element and we handle it accordingly
					if (typeof sgfAliases[key] != 'undefined') {

						//The position in the JGF object is represented by dot separated strings
						//in the sgfAliases array. Split the position and use the setInfo helper
						//to set the info on the JGF object
						setInfo(jgf, sgfAliases[key].split('.'), values);
						continue;
					}

					//No SGF alias present either, just append the data

					//Save in node
					if (node) {
						node[key] = values;
					}

					//Save in root
					else {
						jgf[key] = values;
					}
				}

				//Reset node, unless this was the root node
				if (node && !node.root) {
					node = null;
				}
			}

			//Return jgf
			return jgf;
		}
	};

	//Return object
	return Parser;
});