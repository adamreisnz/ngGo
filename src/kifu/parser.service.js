
/**
 * KifuParser :: This is a wrapper class for all available kifu parsers. It also provides
 * constants used by the parsers to aid conversion.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parser.Service', [
	'ngGo',
	'ngGo.Kifu.Parsers.Gib2Jgf.Service',
	'ngGo.Kifu.Parsers.Sgf2Jgf.Service',
	'ngGo.Kifu.Parsers.Jgf2Sgf.Service'
])

/**
 * SGF/JGF aliases constant for conversion between the two formats
 * Note: not all properties can be translated directly, so some are
 * not present here in this constant
 */
.constant('sgfAliases', {

	//Record properties
	'AP': 'record.application',
	'CA': 'record.charset',
	'CP': 'record.copyright',
	'SO': 'record.source',
	'US': 'record.transcriber',
	'AN': 'record.annotator',

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
	'GC': 'game.comment',

	//Player info properties
	'PB': 'name',
	'PW': 'name',
	'BT': 'team',
	'WT': 'team',
	'BR': 'rank',
	'WR': 'rank',

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
})

/**
 * Factory definition
 */
.factory('KifuParser', function(Gib2Jgf, Sgf2Jgf, Jgf2Sgf) {

	/**
	 * Parser wrapper class
	 */
	var KifuParser = {

		/**
		 * Parse GIB string into a JGF object or string
		 */
		gib2jgf: function(gib, stringified) {
			return Gib2Jgf.parse(gib, stringified);
		},

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