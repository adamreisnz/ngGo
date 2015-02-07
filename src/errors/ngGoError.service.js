
/**
 * ngGoError :: Generic error class to handle ngGo errors
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Errors.ngGoError.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('ngGoError', function(ngGo) {

	/**
	 * Define error
	 */
	var ngGoError = function(code, message) {

		//Set name, code and message
		this.code = code;
		this.name = 'ngGoError';
	    this.message = message;
	};

	/**
	 * Extend from error class
	 */
	ngGoError.prototype = new Error();
	ngGoError.prototype.constructor = ngGoError;

	//Return object
	return ngGoError;
});