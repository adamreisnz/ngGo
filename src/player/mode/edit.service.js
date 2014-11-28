
/**
 * PlayerModeEdit :: This module governs the "edit" mode of the player, e.g. editing
 * a game record and its board positions.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Edit.Service', [
	'ngGo.Service'
])

/**
 * Run block
 */
.run(function(Player, PlayerModes, PlayerModeEdit, StoneColor) {

	/**
	 * Register mode
	 */
	Player.modes[PlayerModes.EDIT] = PlayerModeEdit;

	/**
	 * Register event handlers for this mode
	 */
	Player.on('modeEnter', PlayerModeEdit.modeEnter, PlayerModes.EDIT);
	Player.on('toolSwitch', PlayerModeEdit.toolSwitch, PlayerModes.EDIT);
	Player.on('keydown', PlayerModeEdit.keyDown, PlayerModes.EDIT);
	Player.on('click', PlayerModeEdit.mouseClick, PlayerModes.EDIT);
	Player.on('mousemove', PlayerModeEdit.mouseMove, PlayerModes.EDIT);

	//Setup stone color
	Player.setupStoneColor = StoneColor.B;

	/**
	 * Set the setup color
	 */
	Player.setSetupStoneColor = function(color) {

		//No color
		if (!color) {
			return;
		}

		//Handle string color
		if (typeof color == 'string') {
			color = color.charAt(0).toLowerCase();
		}

		//Set color
		if (color == 'w' || color == StoneColor.W) {
			this.setupStoneColor = StoneColor.W;
		}
		else {
			this.setupStoneColor = StoneColor.B;
		}
	};
})

/**
 * Factory definition
 */
.factory('PlayerModeEdit', function($document, PlayerTools, MarkupTypes, SetupTypes, GameScorer, StoneColor, Stone, StoneFaded, Markup) {

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
	 * Helper to update the hover mark
	 */
	var updateHoverMark = function(x, y) {

		//Remove hover mark if we have one
		if (this._hoverMark) {
			this.board.removeObject(this._hoverMark);
			delete this._hoverMark;
		}

		//What happens, depends on the active tool
		switch (this.tool) {

			//Setup tool
			case PlayerTools.SETUP:

				//Hovering over a stone? We can remove it
				if (this.game.hasStone(x, y)) {
					this._hoverMark = new Markup({
						type: 'mark',
						x: x,
						y: y
					});
				}

				//Empty spot, we can add a stone
				else {
					this._hoverMark = new StoneFaded({
						x: x,
						y: y,
						color: this.setupStoneColor
					});
				}
				break;

			//Move tool
			case PlayerTools.MOVE:

				//Hovering over empty spot where we can make a move?
				if (!this.game.hasStone(x, y) && this.game.isValidMove(x, y)) {
					this._hoverMark = new StoneFaded({
						x: x,
						y: y,
						color: this.game.getTurn()
					});
				}
				break;

			//Score tool
			case PlayerTools.SCORE:

				//Hovering over a stone means it can be marked dead or alive
				if (this.game.hasStone(x, y)) {
					this._hoverMark = new Markup({
						type: 'mark',
						x: x,
						y: y
					});
				}
				break;
		}

		//Add hover mark
		if (this._hoverMark) {
			this.board.addObject(this._hoverMark);
		}
	};

	/**
	 * Player mode definition
	 */
	var PlayerModeEdit = {

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
			var node = this.game.getNode();

			//Check if anything to do
			if (!node) {
				return false;
			}

			//Initialize changes
			var changes;

			//What happens, depends on the active tool
			switch (this.tool) {

				//When moving, we can create new moves
				case PlayerTools.MOVE:
					changes = this.game.play(event.x, event.y);
					break;

				//When setting up, we can place stones on empty positions
				case PlayerTools.SETUP:

					//Trying to remove a stone
					if (this.setupColor === StoneColor.NONE) {
						changes = this.game.setup(event.x, event.y, StoneColor.NONE);
					}

					//Adding a stone
					else {

						//Already a stone in place? Remove it first
						if (this.game.hasStone(event.x, event.y)) {
							changes = this.game.setup(event.x, event.y, StoneColor.NONE);
						}

						//Set it up
						else {
							changes = this.game.setup(event.x, event.y, this.setupColor);
						}
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

			//Update board with changes and update the hover mark
			this.updateBoard.call(this, changes);
			updateHoverMark.call(this, event.x, event.y);
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

			//Update hover mark
			updateHoverMark.call(this, event.x, event.y);
		},

		/**
		 * Handler for mode entry
		 */
		modeEnter: function(event) {

			//Set available tools for this mode
			this.tools = [
				PlayerTools.MOVE,
				PlayerTools.SETUP,
				PlayerTools.MARKUP,
				PlayerTools.SCORE
			];

			//Set default tool
			this.tool = this.tools[0];
		},

		/**
		 * Handler for tool switches
		 */
		toolSwitch: function(event) {

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
	return PlayerModeEdit;
});