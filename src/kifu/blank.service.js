
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
		charset: 'UTF-8',
		version: '1.0',
		game: 'go',
		size: 19,
		variations: 2,
		info: {
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
		ST: '2',
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
		jgf: function() {
			return angular.copy(blankJgf);
		},

		/**
		 * Get blank SGF
		 */
		sgf: function() {
			return angular.copy(blankSgf);
		}
	};

	//Return object
	return KifuBlank;
});