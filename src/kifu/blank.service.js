
/**
 * KifuBlank :: This is a class which can generate blank JGF or SGF templates.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Blank.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('KifuBlank', function(ngGo) {

	/**
	 * Blank JGF
	 */
	var blankJgf = {
		record: {
			application: ngGo.name + ' v' + ngGo.version,
			version: 1,
			charset: 'UTF-8'
		},
		game: {
			type: 'go',
			players: [
				{
					color: 'black',
					name: 'Black'
				},
				{
					color: 'white',
					name: 'White'
				}
			]
		},
		board: {
			width: 19,
			height: 19
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

			//Initialize blank
			var blank = angular.copy(blankJgf);

			//Base given?
			if (base) {
				for (var p in base) {
					if (base.hasOwnProperty(p)) {
						blank[p] = angular.extend(blank[p] || {}, base[p]);
					}
				}
			}

			//Return
			return blank;
		},

		/**
		 * Get blank SGF
		 */
		sgf: function(base) {

			//Initialize blank
			var blank = angular.copy(blankSgf);

			//Base given?
			if (base) {
				for (var p in base) {
					if (base.hasOwnProperty(p)) {
						blank[p] = base[p];
					}
				}
			}

			//Return
			return blank;
		}
	};

	//Return object
	return KifuBlank;
});
