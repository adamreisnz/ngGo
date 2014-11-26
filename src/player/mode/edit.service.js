
/**
 * PlayerModeEdit :: This module governs the "edit" mode of the player, e.g. editing
 * a game record and its board positions.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Edit.Service', [])

/**
 * Factory definition
 */
.factory('PlayerModeEdit', function($document, PlayerTools, MarkupTypes, SetupTypes, Game, GameScorer, StoneColor, Stone, StoneFaded, Markup) {

	/**
	 * Available tools for this mode
	 */
	var availableTools = [
		PlayerTools.MOVE,
		PlayerTools.SETUP,
		PlayerTools.MARKUP,
		PlayerTools.SCORE
	];

	/**
	 * Helper to score the current position
	 */
	var scorePosition = function() {

		//Get changes and score
		var changes = GameScorer.getChanges(),
			score = GameScorer.getScore();
			console.log(score);

		//Remove all markup, and process changes
		this.board.removeAllObjects('markup');
		this.board.removeObject(changes.remove, 'stones');
		this.board.addObject(changes.add);
	};

	/**
	 * Player mode definition
	 */
	var PlayerMode = {

		/**
		 * Keydown handler
		 */
		keyDown: function(event, keyboardEvent) {

			//Inside a text field?
			if ($document[0].querySelector(':focus')) {
				return true;
			}

			//Switch key code
			switch (keyboardEvent.keyCode) {

				//TODO: tool switching via keyboard input

				default:
					return true;
			}
		},

		/**
		 * Click handler
		 */
		mouseClick: function(event, mouseEvent) {

			//Get current node
			var node = Game.getNode();

			//Check if anything to do
			if (!node) {
				return false;
			}

			//What happens, depends on the active tool
			switch (this.tool) {

				//When setting up, we can place stones on empty positions
				case PlayerTools.SETUP:
					if (!this.board.hasStoneAt(event.x, event.y)) {

						//Add stone to board
						this.board.addObject(new Stone({
							x: event.x,
							y: event.y,
							color: (this.tool == PlayerTools.WHITE) ? StoneColor.W : StoneColor.B
						}));

						//Remove last mark if we have one
						if (this._lastMark) {
							this.board.removeObject(this._lastMark);
						}

						//Clear last remembered mouse move coordinates to refresh mouse over image
						delete this._lastMark;
						delete this._lastX;
						delete this._lastY;
					}
					break;

				//When scoring, we can mark stones alive or dead
				case PlayerTools.SCORE:

					//Mark the clicked item
					GameScorer.mark(event.x, event.y);

					//Restore the board state from pre-scoring
					if (this.preScoreState) {
						this.board.restoreState(this.preScoreState);
					}

					//Score the current position
					scorePosition.call(this);
					break;
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

			//What is shown depends on the active tool
			switch (this.tool) {

				//We can only make valid moves
				case PlayerTools.MOVE:
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
					break;

				//We can place stones on empty spots
				case PlayerTools.SETUP:
					if (!this.board.hasStoneAt(event.x, event.y)) {

						//Create faded stone object
						this._lastMark = new StoneFaded({
							x: event.x,
							y: event.y,
							color: StoneColor.B
						});

						//Add to board
						this.board.addObject(this._lastMark);
						return;
					}
					break;

				//We can mark stones as dead or alive
				case PlayerTools.SCORE:
					if (this.board.hasStoneAt(event.x, event.y)) {

						//Create mark
						this._lastMark = new Markup({
							type: 'mark',
							x: event.x,
							y: event.y
						});

						//Add to board
						this.board.addObject(this._lastMark);
						return;
					}
					break;
			}

			//Clear last mark
			delete this._lastMark;
		},

		/**
		 * Mouse out handler
		 */
		mouseOut: function(event, mouseEvent) {
			if (this._lastMark) {
				this.board.removeObject(this._lastMark);
				delete this._lastMark;
				delete this._lastX;
				delete this._lastY;
			}
		},

		/**
		 * Handler for mode entry
		 */
		modeEnter: function(event) {

			//Set default tool
			this.tool = availableTools[0];
		},

		/**
		 * Handler for tool switches
		 */
		toolSwitch: function(event) {

			//Invalid tool? Select the first one
			if (availableTools.indexOf(this.tool) === -1) {
				this.tool = availableTools[0];
			}

			//Switched to scoring?
			if (this.tool == PlayerTools.SCORE) {

				//Remember the current board state
				this.preScoreState = this.board.getState();

				//Score the position
				scorePosition.call(this);
			}
		}
	};

	//Return
	return PlayerMode;
});