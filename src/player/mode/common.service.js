
/**
 * PlayerModeCommon :: This module governs some common event handling of the player shared by various player modes.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Common.Service', [])

/**
 * Run block
 */
.run(function($document, Player, PlayerModes) {

	/**
	 * Handler for keydown events
	 */
	var keyDown = function(event, keyboardEvent) {

		//Inside a text field?
		if ($document[0].querySelector(':focus')) {
			return true;
		}

		//Switch key code
		switch (keyboardEvent.keyCode) {

			//Right arrow
			case 39:
				if (this.config.arrowKeysNavigation) {
					this.next();
				}
				break;

			//Left arrow
			case 37:
				if (this.config.arrowKeysNavigation) {
					this.previous();
				}
				break;

			//TODO: up down for variation selection
			default:
				return true;
		}

		//Don't scroll with arrows
		if (this.config.lockScroll) {
			keyboardEvent.preventDefault();
		}
	};

	/**
	 * Handler for mousewheel events
	 */
	var mouseWheel = function(event, mouseEvent) {

		//Disabled?
		if (!this.config.scrollWheelNavigation) {
			return true;
		}

		//Find delta
		var delta = mouseEvent.deltaY || mouseEvent.originalEvent.deltaY;

		//Next move
		if (delta < 0) {
			this.next();
		}

		//Previous move
		else if (delta > 0) {
			this.previous();
		}

		//Don't scroll the window
		if (delta !== 0 && this.config.lockScroll) {
			mouseEvent.preventDefault();
		}
	};

	/**
	 * Register event listeners
	 */
	Player.listen('keydown', keyDown);
	Player.listen('mousewheel', mouseWheel);
});