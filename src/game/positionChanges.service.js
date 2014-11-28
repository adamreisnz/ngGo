
/**
 * GamePositionChanges :: This is a simple class which acts as a wrapper for changes between two game
 * positions. It simply remembers which stones were added, and which were removed.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.PositionChanges.Service', [])

/**
 * Factory definition
 */
.factory('GamePositionChanges', function() {

	/**
	 * Helper to subtract sets
	 */
	var setSubtract = function(a, b) {
		var n = [], q;
		for (var i in a) {
			q = true;
			for (var j in b) {
				if (a[i].x == b[j].x && a[i].y == b[j].y) {
					q = false;
					break;
				}
			}
			if (q) {
				n.push(a[i]);
			}
		}
		return n;
	};

	/**
	 * Game position constructor
	 */
	return function() {

		/**
		 * Add/remove containers
		 */
		this.add = [];
		this.remove = [];

		/**
		 * Concatenation helper
		 */
		this.concat = function(newChanges) {
			this.add = setSubtract(this.add, newChanges.remove).concat(newChanges.add);
			this.remove = setSubtract(this.remove, newChanges.add).concat(newChanges.remove);
		};

		/**
		 * Check if there are changes
		 */
		this.has = function() {
			return !!(this.add.length || this.remove.length);
		};
	};
});