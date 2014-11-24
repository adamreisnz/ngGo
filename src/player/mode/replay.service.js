
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
.factory('PlayerModeReplay', function(PlayerTools, KifuReader, StoneFaded) {

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

			//Get current node
			var node = KifuReader.getNode();

			//Check if anything to do
			if (!node) {
				return false;
			}

			//Check if we need to move to a node (e.g. clicked on the proper coordinates)
			for (var i in node.children) {
				if (node.children[i].move && node.children[i].move.x == event.x && node.children[i].move.y == event.y) {
					this.next(i);
					return;
				}
			}
		},

		/**
		 * Mouse move handler
		 */
		mouseMove: function(event, mouseEvent) {

			//Nothing to do?
			if (this.frozen || (this._lastX == event.x && this._lastY == event.y)) {
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
			if (KifuReader.game && KifuReader.game.isValidMove(event.x, event.y)) {

				//Create faded stone object
				this._lastMark = new StoneFaded({
					x: event.x,
					y: event.y,
					color: KifuReader.game.getTurn()
				});

				//Add to board
				this.board.addObject(this._lastMark);
				return;
			}

			//Clear last mark
			delete this._lastMark;
		},

		/**
		 * Handler for mode switches
		 */
		modeSwitch: function(event) {
			this.tool = availableTools[0];
		}
	};

	//Return
	return PlayerMode;
});