
/**
 * KifuParser :: This is a wrapper class for all available kifu parsers. Currently, it only
 * wraps the parsers to convert SGF to JGF and vice versa.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parser.Service', [
	'ngGo.Kifu.Parsers.Sgf2Jgf.Service',
	'ngGo.Kifu.Parsers.Jgf2Sgf.Service'
])

/**
 * Factory definition
 */
.factory('KifuParser', function(Sgf2Jgf, Jgf2Sgf) {

	/**
	 * Parser wrapper class
	 */
	var KifuParser = {

		/**
		 * Parse SGF string into a JGF object or string
		 */
		sgf2jgf: function(sgf, stringified) {
			return Sgf2Jgf.parse(sgf, stringified);
		},

		/**
		 * Parse JGF object or string into an SGF string
		 */
		jgf2sgf: function(jgf) {
			return Jgf2Sgf.parse(jgf);
		}
	};

	//Return object
	return KifuParser;
});