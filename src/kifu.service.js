
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
	'ngGo.Kifu.Parser.Service'
])

/**
 * Factory definition
 */
.factory('Kifu', function(KifuNode, KifuBlank, KifuParser) {

	/**
	 * Kifu constructor
	 */
	var Kifu = function() {

		//Create root node
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

			//Create new kifu object and get properties
			var clone = new Kifu(),
				props = Object.getOwnPropertyNames(this);

			//Copy all properties
			for (var p = 0; p < props.length; p++) {
				clone[p] = angular.copy(this[p]);
			}

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

			//Initialize JGF and get properties
			var jgf = KifuBlank.jgf(),
				props = Object.getOwnPropertyNames(this);

			//Copy properties
			for (var p = 0; p < props.length; p++) {

				//Skip root
				if (p == 'root') {
					continue;
				}

				//Already present on JGF object? Extend
				if (jgf[p]) {
					jgf[p] = angular.extend(jgf[p], this[p]);
				}

				//Otherwise copy
				else {
					jgf[p] = angular.copy(this[p]);
				}
			}

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

		//Copy properties, but skip moves tree
		for (var i in jgf) {
			if (i != 'tree') {
				kifu[i] = angular.copy(jgf[i]);
			}
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