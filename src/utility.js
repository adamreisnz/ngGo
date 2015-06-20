
/**
 * Utility functions
 */

/**
 * Angular extend deep implementation
 */
if (typeof angular.extendDeep == 'undefined') {
	angular.extendDeep = function(dest) {
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i] != dest) {
				for (var k in arguments[i]) {
					if (dest[k] && dest[k].constructor && dest[k].constructor === Object) {
						angular.extendDeep(dest[k], arguments[i][k]);
					}
					else {
						dest[k] = angular.copy(arguments[i][k]);
					}
				}
			}
		}
		return dest;
	};
}
