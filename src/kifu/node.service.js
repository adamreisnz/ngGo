
/**
 * KifuNode :: This class represents a single node in the Kifu moves tree. It contains properties like
 * the x and y grid coordinates, the move played, board setup instructions, markup, player turn and
 * comments. The move tree in the Kifu is represented by a string of KifuNodes, each with pointers
 * to their parent and children. Each node can have multiple children (move variations), but only
 * one parent.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Node.Service', [
	'ngGo.Service'
])

/**
 * Factory definition
 */
.factory('KifuNode', function(StoneColor) {

	/**
	 * Node properties to copy to/from JGF
	 */
	var nodeProperties = ['name', 'move', 'setup', 'markup', 'turn', 'comments'];

	/**
	 * Character index of "a"
	 */
	var aChar = 'a'.charCodeAt(0);

	/**
	 * Helper to create flat coordinates
	 */
	var flattenCoordinates = function(x, y) {
		return String.fromCharCode(aChar+x) + String.fromCharCode(aChar+y);
	};

	/**
	 * Helper to expand flat coordinates
	 */
	var expandCoordinate = function(coords, index) {
		return coords.charCodeAt(index)-aChar;
	};

	/**
	 * Helper to construct a coordinates base object
	 */
	var coordinatesObject = function(coords, baseObject) {
		baseObject = baseObject || {};
		if (coords === '' || coords == 'pass') {
			baseObject.pass = true;
		}
		else {
			baseObject.x = expandCoordinate(coords, 0);
			baseObject.y = expandCoordinate(coords, 1);
		}
		return baseObject;
	};

	/**
	 * Convert a numeric color value (color constant) to a string
	 */
	var toStringColor = function(color) {
		return (color == StoneColor.B) ? 'B' : (((color == StoneColor.W) ? 'W' : ''));
	};

	/**
	 * Convert a string color value to a numeric color constant
	 */
	var toColorConstant = function(color) {
		if (color == 'B') {
			return StoneColor.B;
		}
		else if (color == 'W') {
			return StoneColor.W;
		}
		return StoneColor.NONE;
	};

	/***********************************************************************************************
	 * Helpers for conversion between JGF / KIFU format
	 ***/

	/**
	 * Convert move object to JGF format
	 */
	var convertMoveToJgf = function(move) {

		//Initialize JGF move object and determine color
		var jgfMove = {},
			color = toStringColor(move.color);

		//No color?
		if (color === '') {
			return null;
		}

		//Pass move?
		if (move.pass === true) {
			jgfMove[color] = 'pass';
		}

		//Regular move
		else {
			jgfMove[color] = flattenCoordinates(move.x, move.y);
		}

		//Return move
		return jgfMove;
	};

	/**
	 * Convert move from JGF format
	 */
	var convertMoveFromJgf = function(move) {

		//Prepare color, coordinates
		var i, color, coords,
			colors = ['W', 'B'];

		//Check whose move it was
		for (i in colors) {
			color = colors[i];
			if (move[color]) {
				coords = move[color];
				break;
			}
		}

		//No coordinates?
		if (!coords) {
			return null;
		}

		//Return coordinates object
		return coordinatesObject(coords, {
			color: toColorConstant(color)
		});
	};

	/**
	 * Convert setup object to JGF format
	 */
	var convertSetupToJgf = function(setup) {

		//Initialize variables
		var i, color, jgfSetup = {};

		//Loop setup objects
		for (i in setup) {

			//Get color
			color = toStringColor(setup[i].color) || 'E';

			//Initialize array
			if (typeof jgfSetup[color] == 'undefined') {
				jgfSetup[color] = [];
			}

			//Add coordinates
			jgfSetup[color].push(flattenCoordinates(setup[i].x, setup[i].y));
		}

		//Return
		return jgfSetup;
	};

	/**
	 * Convert setup from JGF format
	 */
	var convertSetupFromJgf = function(setup) {

		//Initialize variables
		var c, key, color, kifuSetup = [];

		//Loop setup
		for (key in setup) {

			//Get color constant
			color = toColorConstant(key);

			//Loop coordinates
			for (c in setup[key]) {
				kifuSetup.push(coordinatesObject(setup[key][c], {
					color: color
				}));
			}
		}

		//Return
		return kifuSetup;
	};

	/**
	 * Convert markup object to JGF format
	 */
	var convertMarkupToJgf = function(markup) {

		//Initialize variables
		var i, type, jgfMarkup = {};

		//Loop setup objects
		for (i in markup) {

			//Get type
			type = markup[i].type;

			//Initialize array
			if (typeof jgfMarkup[type] == 'undefined') {
				jgfMarkup[type] = [];
			}

			//Label?
			if (type == 'LB') {
				var label = flattenCoordinates(markup[i].x, markup[i].y) + ':' + markup[i].text;
				jgfMarkup[type].push(label);
			}
			else {
				jgfMarkup[type].push(flattenCoordinates(markup[i].x, markup[i].y));
			}
		}

		//Return
		return jgfMarkup;
	};

	/**
	 * Convert markup from JGF format
	 */
	var convertMarkupFromJgf = function(markup) {

		//Initialize variables
		var l, type, kifuMarkup = [];

		//Loop markup types
		for (type in markup) {

			//Label?
			if (type == 'label') {
				for (l = 0; l < markup[type].length; l++) {

					//Validate
					if (!angular.isArray(markup[type][l]) || markup[type][l].length < 2) {
						continue;
					}

					//Add to stack
					kifuMarkup.push(coordinatesObject(markup[type][l][0], {
						type: type,
						text: markup[type][l][1]
					}));
				}
			}
			else {

				//Loop coordinates
				for (l in markup[type]) {
					kifuMarkup.push(coordinatesObject(markup[type][l], {
						type: type
					}));
				}
			}
		}

		//Return
		return kifuMarkup;
	};

	/**
	 * Convert turn object to JGF format
	 */
	var convertTurnToJgf = function(turn) {
		switch (turn) {
			case StoneColor.W:
				return 'W';
			case StoneColor.B:
				return 'B';
			default:
				return '';
		}
	};

	/**
	 * Convert turn from JGF format
	 */
	var convertTurnFromJgf = function(turn) {
		switch (turn) {
			case 'W':
				return StoneColor.W;
			case 'B':
				return StoneColor.B;
			default:
				return StoneColor.NONE;
		}
	};

	/**
	 * Conversions map
	 */
	var conversionMap = {
		toJgf: {
			'move':		convertMoveToJgf,
			'setup':	convertSetupToJgf,
			'markup':	convertMarkupToJgf,
			'turn':		convertTurnToJgf
		},
		fromJgf: {
			'move':		convertMoveFromJgf,
			'setup':	convertSetupFromJgf,
			'markup':	convertMarkupFromJgf,
			'turn':		convertTurnFromJgf
		}
	};

	/**
	 * Constructor
	 */
	var KifuNode = function(properties, parent) {

		//Set parent and children
		this.parent = parent || null;
		this.children = [];

		//Save properties
		if (properties) {
			for (var key in properties) {
				this[key] = properties[key];
			}
		}
	};

	/**
	 * Prototype extension
	 */
	angular.extend(KifuNode.prototype, {

		/**
		 * Get node's child specified by index or null if doesn't exist
		 */
		getChild: function(i) {
			i = i || 0;
			if (this.children[i]) {
				return this.children[i];
			}
			return null;
		},

		/**
		 * Remove this node (node is removed from its parent and children are passed to parent)
		 */
		remove: function() {

			//Can't remove root node
			if (!this.parent) {
				return;
			}

			//Get parent
			var p = this.parent;

			//Loop children
			for (var i in p.children) {
				if (p.children[i] == this) {
					p.children.splice(i,1);
					break;
				}
			}

			//Add to children and return parent node
			p.children = p.children.concat(this.children);
			this.parent = null;
			return p;
		},

		/**
		 * Insert node after another node. All children are passed to new node.
		 */
		insertAfter: function(node) {

			//Loop our children and change parent node
			for (var i in this.children) {
				this.children[i].parent = node;
			}

			//Merge children, set this node as the parent of given node
			node.children = node.children.concat(this.children);
			node.parent = this;

			//Set given node as the child of this node
			this.children = [node];
		},

		/**
		 * Append child node to this node.
		 */
		appendChild: function(node) {
			node.parent = this;
			this.children.push(node);
		},

		/**
		 * Get properties as object
		 */
		getProperties: function() {
			var props = {};
			for (var key in this) {
				if (this.hasOwnProperty(key) && key != 'children' && key != 'parent' && key[0] != '_') {
					props[key] = this[key];
				}
			}
			return props;
		},

		/**
		 * Build a Kifu Node from a given JGF tree
		 */
		fromJgf: function(jgf, kifuNode) {

			//Root JGF file given?
			if (typeof jgf.tree !== 'undefined') {
				return KifuNode.fromJgf(jgf.tree, kifuNode);
			}

			//Initialize helper vars
			var variationNode, nextNode, i, j;

			//Node to work with given? Otherwise, work with ourselves
			kifuNode = kifuNode || this;

			//Loop moves in the JGF tree
			for (i = 0; i < jgf.length; i++) {

				//Array? That means a variation branch
				if (angular.isArray(jgf[i])) {

					//Loop variation stacks
					for (j = 0; j < jgf[i].length; j++) {

						//Build the variation node
						variationNode = new KifuNode();
						variationNode.fromJgf(jgf[i][j]);

						//Append to working node
						kifuNode.appendChild(variationNode);
					}
				}

				//Regular node
				else {

					//Copy node properties
					for (var key in nodeProperties) {
						var prop = nodeProperties[key];
						if (typeof jgf[i][prop] != 'undefined') {

							//Conversion function present?
							if (typeof conversionMap.fromJgf[prop] != 'undefined') {
								kifuNode[prop] = conversionMap.fromJgf[prop](jgf[i][prop]);
							}
							else if (typeof jgf[i][prop] == 'object') {
								kifuNode[prop] = angular.copy(jgf[i][prop]);
							}
							else {
								kifuNode[prop] = jgf[i][prop];
							}
						}
					}
				}

				//Next element is a regular node? Prepare new working node
				//Otherwise, if there are no more nodes or if the next element is
				//an array (e.g. variations), we keep our working node as the current one
				if ((i + 1) < jgf.length && !angular.isArray(jgf[i+1])) {
					nextNode = new KifuNode();
					kifuNode.appendChild(nextNode);
					kifuNode = nextNode;
				}
			}
		},

		/**
		 * Convert this node to a JGF node container
		 */
		toJgf: function(container) {

			//Initialize container to add nodes to
			container = container || [];

			//Initialize node
			var node = {};

			//Copy node properties
			for (var key in nodeProperties) {
				var prop = nodeProperties[key];
				if (typeof this[prop] != 'undefined') {

					//Conversion function present?
					if (typeof conversionMap.toJgf[prop] != 'undefined') {
						node[prop] = conversionMap.toJgf[prop](this[prop]);
					}
					else if (typeof this[prop] == 'object') {
						node[prop] = angular.copy(this[prop]);
					}
					else {
						node[prop] = this[prop];
					}
				}
			}

			//Add node to container
			container.push(node);

			//Variations present?
			if (this.children.length > 1) {

				//Create variations container
				var variationsContainer = [];
				container.push(variationsContainer);

				//Loop child (variation) nodes
				for (var i in this.children) {

					//Create container for this variation
					var variationContainer = [];
					variationsContainer.push(variationContainer);

					//Call child node converter
					this.children[i].toJgf(variationContainer);
				}
			}

			//Just one child?
			else if (this.children.length == 1) {
				this.children[0].toJgf(container);
			}

			//Return container
			return container;
		}
	});

	//Return object
	return KifuNode;
});