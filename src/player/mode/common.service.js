
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
	Player.on('mouseout', PlayerModeCommon.mouseOut, [
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

			//Switch key code
			switch (keyboardEvent.keyCode) {

				//Right arrow
				case 39:
					if (this.config.arrowKeysNavigation && this.tool == PlayerTools.MOVE) {
						this.board.layers.hover.remove();
						this.next();
					}
					break;

				//Left arrow
				case 37:
					if (this.config.arrowKeysNavigation && this.tool == PlayerTools.MOVE) {
						this.board.layers.hover.remove();
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