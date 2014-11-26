
/**
 * PlayerModeReplay :: This module governs the "replay" mode of the player, e.g. traversing through an
 * existing game record without the ability to deviate from the tree or its variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Replay.Service', [])

/**
 * Factory definition
 */
.factory('PlayerModeReplay', function(PlayerTools, Game, StoneFaded) {

	/**
	 * Available tools for this mode
	 */
	var availableTools = [
		PlayerTools.MOVE,
		PlayerTools.NONE
	];

	/**
	 * Player mode definition
	 */
	var PlayerMode = {

		/**
		 * Handler for mouse click events
		 */
		mouseClick: function(event, mouseEvent) {

			//Check if we clicked a move variation
			var i = Game.isMoveVariation(event.x, event.y);

			//Advance to the next position
			if (i != -1) {
				this.next(i);
			}
		},

		/**
		 * Mouse move handler
		 */
		mouseMove: function(event, mouseEvent) {

			//Frozen player?
			if (this.frozen) {
				return;
			}

			//If a mark is already showing, and the grid coordinates are the same, we're done
			if (this._lastMark && this._lastX == event.x && this._lastY == event.y) {
				return;
			}

			//Remember last coordinates
			this._lastX = event.x;
			this._lastY = event.y;

			//Remove last mark if we have one
			if (this._lastMark) {
				this.board.removeObject(this._lastMark);
			}

			//When replaying, we can place stones only on valid locations
			if (Game.isValidMove(event.x, event.y)) {

				//Create faded stone object
				this._lastMark = new StoneFaded({
					x: event.x,
					y: event.y,
					color: Game.getTurn()
				});

				//Add to board
				this.board.addObject(this._lastMark);
				return;
			}

			//Clear last mark
			delete this._lastMark;
		},

		/**
		 * Handler for mode entry
		 */
		modeEnter: function(event) {

			//Set default tool
			this.tool = availableTools[0];
		}
	};

	//Return
	return PlayerMode;
});