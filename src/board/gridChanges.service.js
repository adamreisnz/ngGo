
/**
 * BoardGridChanges :: This is a simple class which acts as a wrapper for changes between two board
 * grids. It simply keeps track of what was added and what was removed.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.GridChanges.Service', [
  'ngGo'
])

/**
 * Factory definition
 */
.factory('BoardGridChanges', function() {

  /**
   * Helper to subtract sets
   */
  var setSubtract = function(a, b) {
    var n = [], q;
    for (var i = 0; i < a.length; i++) {
      q = true;
      for (var j in b) {
        if (a[i].x === b[j].x && a[i].y === b[j].y) {
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
     * Containers
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
