'use strict';

/**
 * Generate angular wrapper for module files
 */
module.exports = function angularWrapper() {
  return {
    header: '(function(window, angular, undefined) {\n  \'use strict\';\n',
    footer: '\n})(window, window.angular);\n',
  };
};
