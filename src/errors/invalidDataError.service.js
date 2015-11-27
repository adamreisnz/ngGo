
/**
 * InvalidDataError :: Error class to handle invalid data.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Errors.InvalidDataError.Service', [
  'ngGo'
])

/**
 * Factory definition
 */
.factory('InvalidDataError', function(ngGo) {

  /**
   * Define error
   */
  var InvalidDataError = function(code) {

    //Set name and message
    this.code = code;
    this.name = 'InvalidDataError';
      this.message = 'Invalid data: ';

    //Append code message
    switch (code) {
      case ngGo.error.NO_DATA:
        this.message += "no data to process.";
        break;
      case ngGo.error.UNKNOWN_DATA:
        this.message += "unknown data format.";
        break;
      case ngGo.error.INVALID_GIB:
        this.message += "unable to parse GIB data.";
        break;
      case ngGo.error.INVALID_SGF:
        this.message += "unable to parse SGF data.";
        break;
      case ngGo.error.INVALID_JGF_JSON:
        this.message += "unable to parse JGF data.";
        break;
      case ngGo.error.INVALID_JGF_TREE_JSON:
        this.message += "unable to parse the JGF tree data.";
        break;
      default:
        this.message += "unable to parse the data.";
    }
  };

  /**
   * Extend from error class
   */
  InvalidDataError.prototype = new Error();
  InvalidDataError.prototype.constructor = InvalidDataError;

  //Return object
  return InvalidDataError;
});