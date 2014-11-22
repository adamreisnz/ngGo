
/**
 * Kifu :: This class represents a Kifu, or game record. It contains the fully parsed and normalized
 * game information and moves tree, along with any node annotations. In addition it contains wrapper
 * methods to load itself from SGF or JGF game data, using the KifuParser.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Service', [
	'ngGo.Service',
	'ngGo.Kifu.Node.Service',
	'ngGo.Kifu.Blank.Service',
	'ngGo.Kifu.Parser.Service',
	'ngGo.Kifu.Formatter.Service'
])

/**
 * Factory definition
 */
.factory('Kifu', function(KifuNode, KifuBlank, KifuParser, KifuFormatter) {

	/**
	 * Info properties categorization
	 */
	var infoProperties = {
		root: [
			'application', 'charset', 'game', 'size', 'variations', 'sgfformat'
		],
		game: [
			'black', 'white', 'annotator', 'copyright', 'dates', 'event', 'gamename', 'comment',
			'handicap', 'komi', 'opening', 'overtime', 'location', 'result', 'round', 'rules',
			'source', 'time', 'user'
		]
	};

	/**
	 * Helper to get properties of a certain type (see object above)
	 */
	var getPropertiesOfType = function(type, formatted) {

		//Initialize
		var info = {};

		//Must have type defined
		if (typeof infoProperties[type] == 'undefined') {
			return info;
		}

		//Loop kifu info
		for (var key in this.info) {

			//Present in info list?
			if (infoProperties[type].indexOf(key) == -1) {
				continue;
			}

			//Set in info
			info[key] = this.info[key];

			//Formatted?
			if (formatted) {
				info[key] = KifuFormatter.format(key, info[key]);
			}
		}

		//Return
		return info;
	};

	/**
	 * Helper to find a property in a node
	 */
	var findProperty = function(prop, node) {
		var res;
		if (node[prop] !== undefined) {
			return node[prop];
		}
		for (var child in node.children) {
			res = findProperty(prop, node.children[child]);
			if (res) {
				return res;
			}
		}
		return false;
	};

	/**
	 * Kifu constructor
	 */
	var Kifu = function() {

		//Initialize root properties
		for (var prop in infoProperties.root) {
			this[infoProperties.root[prop]] = '';
		}

		//Set default size
		this.size = 19;

		//Initialize info object and rootnode
		this.info = {};
		this.root = new KifuNode();
	};

	/**
	 * Prototype extension
	 */
	angular.extend(Kifu.prototype, {

		/**
		 * Clone function
		 */
		clone: function() {

			//Create new kifu object
			var clone = new Kifu();

			//Copy size, info and root node
			clone.size = this.size;
			clone.info = angular.copy(this.info);
			clone.root = angular.copy(this.root);

			//Return clone
			return clone;
		},

		/**
		 * Convert to SGF
		 */
		toSgf: function() {
			return KifuParser.jgf2sgf(this.toJgf());
		},

		/**
		 * Convert to JGF (optionally stringified)
		 */
		toJgf: function(stringify) {

			//Initialize JGF
			var jgf = KifuBlank.jgf();

			//Copy root properties
			for (var i in infoProperties.root) {
				var prop = infoProperties.root[i];
				if (this[prop]) {
					jgf[prop] = this[prop];
				}
			}

			//Deep copy info
			jgf.info = angular.copy(this.info);

			//Build tree
			jgf.tree = this.root.toJgf();

			//Return
			return stringify ? JSON.stringify(jgf) : jgf;
		},

		/**
		 * Get a property from this kifu
		 */
		get: function(position) {

			//Must have a position
			if (!position) {
				return;
			}

			//The item's position in the object is given by dot separated strings
			if (typeof position == 'string') {
				position = position.split('.');
			}

			//Initialize object we're getting info from
			var obj = this, key;

			//Loop the position
			for (var p = 0; p < position.length; p++) {

				//Get actual key
				key = position[p];

				//Last key reached? Done, get value
				if ((p + 1) == position.length) {
					return obj[key];
				}

				//Must be object container
				if (typeof obj[key] != 'object') {
					console.warn('Kifu property', key, 'is not an object');
					return;
				}

				//Move up in tree
				obj = obj[key];
			}
		},

		/**
		 * Get all game info from this Kifu (as is or formatted)
		 */
		gameInfo: function(formatted) {
			return getPropertiesOfType.call(this, 'game', formatted);
		},

		/**
		 * Get all root info from this Kifu (as is or formatted)
		 */
		rootInfo: function(formatted) {
			return getPropertiesOfType.call(this, 'root', formatted);
		},

		/**
		 * Check if there are comments in the root node
		 */
		hasComments: function() {
			return !!findProperty('comments', this.root);
		}
	});

	/**
	 * Return a new blank kifu
	 *
	 * @return 	object	Kifu object
	 */
	Kifu.blank = function() {
		return new Kifu();
	};

	/**
	 * Return a new blank kifu node object
	 *
	 * @return 	object	Kifu node object
	 */
	Kifu.blankNode = function() {
		return new KifuNode();
	};

	/**
	 * Create kifu from SGF
	 *
	 * @param 	string 	The SGF string
	 * @return 	object	Kifu object
	 */
	Kifu.fromSgf = function(sgf) {
		var jgf;
		if (jgf = KifuParser.sgf2jgf(sgf)) {
			return this.fromJgf(jgf);
		}
		return null;
	};

	/**
	 * Create kifu from JGF
	 *
	 * @param 	mixed 	String or object
	 * @return 	void
	 */
	Kifu.fromJgf = function(jgf) {

		//Create new instance of kifu
		var kifu = new Kifu();

		//Parse from string
		if (typeof jgf == 'string') {
			jgf = JSON.parse(jgf);
		}

		//Copy properties
		for (var prop in jgf) {

			//Skip moves tree
			if (prop == 'tree') {
				continue;
			}

			//Deep copy objects
			if (typeof jgf[prop] == 'object') {
				kifu[prop] = angular.copy(jgf[prop]);
			}

			//Simple copy all other properties
			kifu[prop] = jgf[prop];
		}

		//Create root node and clone the rest of the moves
		kifu.root = new KifuNode();
		kifu.root.fromJgf(jgf.tree);

		//Return kifu object
		return kifu;
	};

	//Return object
	return Kifu;
});