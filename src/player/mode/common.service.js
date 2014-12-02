
/**
 * PlayerModeCommon :: This class governs common event handling of the player shared by
 * various player modes. It's basically an abstract player mode and it can't be actively set.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Common.Service', [])

/**
 * Run block
 */
.run(function(Player, PlayerModes, PlayerModeCommon) {

	/**
	 * Register common event handlers
	 */
	Player.on('keydown', PlayerModeCommon.keyDown, [
		PlayerModes.REPLAY, PlayerModes.EDIT
	]);
	Player.on('mousewheel', PlayerModeCommon.mouseWheel, [
		PlayerModes.REPLAY, PlayerModes.EDIT
	]);
	Player.on('mousemove', PlayerModeCommon.mouseMove, [
		PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE
	]);
	Player.on('mouseout', PlayerModeCommon.mouseOut, [
		PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE
	]);
	Player.on('mousedown', PlayerModeCommon.mouseDown, [
		PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE
	]);
	Player.on('mouseup', PlayerModeCommon.mouseUp, [
		PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE
	]);
	Player.on('toolSwitch', PlayerModeCommon.toolSwitch, [
		PlayerModes.REPLAY, PlayerModes.EDIT
	]);
})

/**
 * Factory definition
 */
.factory('PlayerModeCommon', function($document, PlayerTools, GameScorer) {

	/**
	 * Helper var to detect dragging
	 */
	var dragStart = null;

	/**
	 * Helper vars to keep track of last move coordinates
	 */
	var lastX, lastY;

	/**
	 * Helper to build drag object
	 */
	var dragObject = function(event) {

		//Initialize drag object
		var drag = {
			start: {
				x: (dragStart.x > event.x) ? event.x : dragStart.x,
				y: (dragStart.y > event.y) ? event.y : dragStart.y,
			},
			stop: {
				x: (dragStart.x > event.x) ? dragStart.x : event.x,
				y: (dragStart.y > event.y) ? dragStart.y : event.y,
			}
		};

		//Fix boundaries
		if (drag.start.x < 0) {
			drag.start.x = 0;
		}
		if (drag.start.y < 0) {
			drag.start.y = 0;
		}
		if (drag.stop.x > this.board.width - 1) {
			drag.stop.x = this.board.width - 1;
		}
		if (drag.stop.y > this.board.height - 1) {
			drag.stop.y = this.board.height - 1;
		}

		//Return
		return drag;
	};

	/**
	 * Player mode definition
	 */
	var PlayerMode = {

		/**
		 * Handler for keydown events
		 */
		keyDown: function(event, keyboardEvent) {

			//Inside a text field?
			if ($document[0].querySelector(':focus')) {
				return true;
			}

			//Remove hover marks
			this.board.removeAll('hover');

			//Switch key code
			switch (keyboardEvent.keyCode) {

				//ESC
				case 27:

					//Cancel drag event, and prevent click event as well
					dragStart = null;
					this.preventClickEvent = true;
					break;

				//Right arrow
				case 39:
					if (this.config.arrowKeysNavigation && this.tool == PlayerTools.MOVE) {
						this.next();
					}
					break;

				//Left arrow
				case 37:
					if (this.config.arrowKeysNavigation && this.tool == PlayerTools.MOVE) {
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
		},

		/**
		 * Handler for mousewheel events
		 */
		mouseWheel: function(event, mouseEvent) {

			//Disabled or not using move tool?
			if (!this.config.scrollWheelNavigation || this.tool != PlayerTools.MOVE) {
				return true;
			}

			//Find delta
			var delta = mouseEvent.deltaY || mouseEvent.originalEvent.deltaY;

			//Next move
			if (delta < 0) {
				this.board.layers.hover.remove();
				this.next();
			}

			//Previous move
			else if (delta > 0) {
				this.board.layers.hover.remove();
				this.previous();
			}

			//Don't scroll the window
			if (delta !== 0 && this.config.lockScroll) {
				mouseEvent.preventDefault();
			}
		},

		/**
		 * Mouse out handler
		 */
		mouseOut: function(event, mouseEvent) {
			this.board.layers.hover.remove();
		},

		/**
		 * Mouse move handler
		 */
		mouseMove: function(event, mouseEvent) {

			//Attach drag object to events
			if (dragStart && (dragStart.x != event.x || dragStart.y != event.y)) {
				mouseEvent.drag = dragObject.call(this, event);
			}

			//Nothing else to do?
			if (this.frozen || !this.board.layers.hover) {
				return;
			}

			//Last coordinates are the same?
			if (lastX == event.x && lastY == event.y) {
				return;
			}

			//Remember last coordinates
			lastX = event.x;
			lastY = event.y;

			//Broadcast hover event
			this.broadcast('hover', mouseEvent);
		},

		/**
		 * Mouse down handler
		 */
		mouseDown: function(event, mouseEvent) {
			dragStart = {x: event.x, y: event.y};
		},

		/**
		 * Mouse up handler
		 */
		mouseUp: function(event, mouseEvent) {
			if (dragStart && (dragStart.x != event.x || dragStart.y != event.y)) {
				mouseEvent.drag = dragObject.call(this, event);
				this.broadcast('mousedrag', mouseEvent);
			}
			dragStart = null;
		},

		/**
		 * Handler for tool switches
		 */
		toolSwitch: function(event) {

			//Switched to scoring?
			if (this.tool == PlayerTools.SCORE) {

				//Remember the current board state
				this.statePreScoring = this.board.getState();

				//Load game into scorer and score the game
				GameScorer.load(this.game);
				this.scoreGame();
			}

			//Back to another state?
			else {
				if (this.statePreScoring) {
					this.board.restoreState(this.statePreScoring);
					delete this.statePreScoring;
				}
			}
		}
	};

	//Return
	return PlayerMode;
});