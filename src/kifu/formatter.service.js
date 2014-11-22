
/**
 * KifuFormatter :: This class is used to format kifu data to a human readable format, for example
 * remaining game time or concatenated player info.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Formatter.Service', [])

/**
 * Factory definition
 */
.factory('KifuFormatter', function() {

	/**
	 * Helper to format player string
	 */
	var playerFormatter = function(value) {
		var player = '';
		if (value.name) {
			player = value.name;
			if (value.rank) {
				player += " ("+value.rank+")";
			}
			if (value.team) {
				player += ", "+value.team;
			}
		}
		else {
			if (value.team) {
				player = value.team;
			}
			if (value.rank) {
				player += " ("+value.rank+")";
			}
		}

		//Return value
		return player;
	};

	/**
	 * Pre-defined formatters list
	 */
	var infoFormatters = {
		black: playerFormatter,
		white: playerFormatter,
		time: function(time) {

			//No time system
			if (time === 0) {
				return '';
			}

			//Determine minutes and seconds
			var minutes = Math.floor(time/60),
				seconds = time%60;

			//Return time string
			return minutes + ':' + ((seconds.length == 1) ? '0' : '') + seconds;
		}
	};

	/**
	 * Class definition
	 */
	var KifuFormatter = {

		/**
		 * Setup the kifu formatter
		 */
		setup: function(formatters) {
			if (formatters)	{
				for (var property in formatters) {
					infoFormatters[property] = formatters[property];
				}
			}
		},

		/**
		 * Format a property value
		 */
		format: function(property, value) {

			//Parser function
			if (typeof infoFormatters[property] == 'function') {
				return infoFormatters[property](value);
			}

			//Fixed value
			else if (typeof infoFormatters[property] != 'undefined') {
				return infoFormatters[property];
			}

			//No registered formatter
			return value;
		}
	};

	//Return object
	return KifuFormatter;
});