
/**
 * PlayerModeSolve :: This module governs the "solve" mode of the player, e.g. trying to solve
 * go problems and finding the right move or variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Solve.Service', [])

/**
 * Factory definition
 */
.factory('PlayerModeSolve', function(PlayerTools, KifuReader, StoneFaded) {

	/**
	 * Available tools for this mode
	 */
	var availableTools = [
		PlayerTools.MOVE
	];

	/**
	 * Remembering the variation board markup setting
	 */
	var variationBoardMarkup;

	/**
	 * Player mode definition
	 */
	var PlayerMode = {

		/**
		 * Handler for mouse click events
		 */
		mouseClick: function(event, mouseEvent) {

			//Check if we clicked a move variation
			var i = KifuReader.isMoveVariation(event.x, event.y);

			//Advance to the next position
			if (i != -1) {
				this.next(i);
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

			//When in solve mode, we are allowed to place stones on all valid move locations
			if (KifuReader.isValidMove(event.x, event.y)) {

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
		 * Handler for mode entry
		 */
		modeEnter: function(event) {

			//Set default tool
			this.tool = availableTools[0];

			//Disable variation marking
			variationBoardMarkup = this.config.variationBoardMarkup;
			this.setVariationBoardMarkup(false);
		},

		/**
		 * Handler for mode exit
		 */
		modeExit: function(event) {

			//Reset variation marking to remembered setting
			this.setVariationBoardMarkup(variationBoardMarkup);
		}
	};

	//Return
	return PlayerMode;
});