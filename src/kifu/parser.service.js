
/**
 * KifuParser :: This is a wrapper class for all available kifu parsers. Currently, it only
 * wraps the parsers to convert SGF to JGF and vice versa. It also provides constants used
 * by the parsers to aid conversion.
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
})

/**
 * SGF/JGF aliases constant for conversion between the two formats
 */
.constant('sgfAliases', {

	//Record properties
	'CA': 'charset',
	'CP': 'copyright',
	'SO': 'source',
	'US': 'creator',

	//SGF properties
	'AP': 'sgf.application',
	'FF': 'sgf.format',

	//Board properties
	'SZ': 'board.size',

	//Game properties
	'GM': 'game.type',
	'GN': 'game.name',
	'KM': 'game.komi',
	'HA': 'game.handicap',
	'RE': 'game.result',
	'RU': 'game.rules',
	'TM': 'game.time.main',
	'OT': 'game.time.overtime',
	'DT': 'game.dates',
	'PC': 'game.location',
	'EV': 'game.event',
	'RO': 'game.round',
	'ON': 'game.opening',
	'AN': 'game.annotator',
	'GC': 'game.comment',

	//Player properties
	'PB': 'game.black.name',
	'PW': 'game.white.name',
	'BT': 'game.black.team',
	'WT': 'game.white.team',
	'BR': 'game.black.rank',
	'WR': 'game.white.rank',

	//Node annotation
	'N':  'name',
	'C':  'comments',
	'CR': 'circle',
	'TR': 'triangle',
	'SQ': 'square',
	'MA': 'mark',
	'SL': 'select',
	'LB': 'label'
})

/**
 * SGF game definitions
 */
.constant('sgfGames', {
	1: 'go',
	2: 'othello',
	3: 'chess',
	4: 'renju',
	6: 'backgammon',
	7: 'chinese chess',
	8: 'shogi'
});