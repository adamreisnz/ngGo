
/**
 * KifuBlank :: This is a class which can generate blank JGF or SGF templates.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Blank.Service', [
	'ngGo.Service'
])

/**
 * Factory definition
 */
.factory('KifuBlank', function(ngGo) {

	/**
	 * Blank JGF
	 */
	var blankJgf = {
		application: ngGo.name + ' v' + ngGo.version,
		version: 1,
		charset: 'UTF-8',
		board: {
			size: 19
		},
		game: {
			type: 'go',
			black: {
				name: 'Black'
			},
			white: {
				name: 'White'
			},
		},
		tree: []
	};

	/**
	 * Blank SGF
	 */
	var blankSgf = {
		AP: ngGo.name + ':' + ngGo.version,
		CA: 'UTF-8',
		FF: '4',
		GM: '1',
		SZ: '19',
		PB: 'Black',
		PW: 'White'
	};

	/**
	 * Blank JGF/SGF container
	 */
	var KifuBlank = {

		/**
		 * Get blank JGF
		 */
		jgf: function(base) {
			return base ? angular.extend({}, blankJgf, base) : angular.copy(blankJgf);
		},

		/**
		 * Get blank SGF
		 */
		sgf: function(base) {
			return base ? angular.extend({}, blankSgf, base) : angular.copy(blankSgf);
		}
	};

	//Return object
	return KifuBlank;
});