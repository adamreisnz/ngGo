
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

/**
 * Normalize the mousewheel event
 */
function normalizeMousewheelEvent(event) {

	//Initialize vars
	var deltaX = 0, deltaY = 0;

	//Old school scrollwheel delta
	if ('detail' in event) {
		deltaY = event.detail * -1;
	}
	if ('wheelDelta' in event) {
		deltaY = event.wheelDelta;
	}
	if ('wheelDeltaY' in event) {
		deltaY = event.wheelDeltaY;
	}
	if ('wheelDeltaX' in event) {
		deltaX = event.wheelDeltaX * -1;
	}

	// Firefox < 17 horizontal scrolling related to DOMMouseScroll event
	if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
		deltaX = deltaY * -1;
		deltaY = 0;
	}

	//New type wheel delta (wheel event)
	if ('deltaY' in event) {
		deltaY = event.deltaY * -1;
	}
	if ('deltaX' in event) {
		deltaX = event.deltaX;
	}

	//Set in event (have to use different property name because of strict mode)
	event.mouseWheelX = deltaX;
	event.mouseWheelY = deltaY;

	//Return
	return event;
}