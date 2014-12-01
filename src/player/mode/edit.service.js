
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
	 * Register event handlers
	 */
	Player.on('modeEnter', PlayerModeEdit.modeEnter, PlayerModes.EDIT);
	Player.on('toolSwitch', PlayerModeEdit.toolSwitch, PlayerModes.EDIT);
	Player.on('keydown', PlayerModeEdit.keyDown, PlayerModes.EDIT);
	Player.on('click', PlayerModeEdit.mouseClick, PlayerModes.EDIT);
	Player.on('mousemove', PlayerModeEdit.mouseMove, PlayerModes.EDIT);

	//Setup tools
	Player.setupTools = {
		BLACK:		'black',
		WHITE:		'white',
		CLEAR:		'clear'
	};

	//Markup tools
	Player.markupTools = {
		TRIANGLE:	'triangle',
		CIRCLE:		'circle',
		SQUARE:		'square',
		MARK:		'mark',
		SELECT:		'select',
		SAD:		'sad',
		HAPPY:		'happy',
		TEXT:		'text',
		NUMBER:		'number'
	};

	//Active setup type and markup type
	Player.setupTool = Player.setupTools.BLACK;
	Player.markupTool = Player.markupTools.TRIANGLE;

	//Current text and number for labels
	Player.markupTextLabel = 'A';
	Player.markupNumberLabel = '1';

	/**
	 * Set the setup tool
	 */
	Player.switchSetupTool = function(tool) {
		this.setupTool = tool;
	};

	/**
	 * Set the markup tool
	 */
	Player.switchMarkupTool = function(tool) {
		this.markupTool = tool;
	};

	/**
	 * Conversion of setup tool to stone color
	 */
	Player.setupToolColor = function() {
		switch (this.setupTool) {
			case this.setupTools.BLACK:
				return StoneColor.B;
			case this.setupTools.WHITE:
				return StoneColor.W;
			default:
				return StoneColor.NONE;
		}
	};

	/**
	 * Set the new text markup label
	 */
	Player.setMarkupTextLabel = function(label) {
		if (label) {
			this.markupTextLabel = label;
		}
	};

	/**
	 * Set the new number markup label
	 */
	Player.setMarkupNumberLabel = function(label) {
		if (label = parseInt(label)) {
			this.markupNumberLabel = label;
		}
	};

	/**
	 * Set the new text markup label
	 */
	Player.incrementMarkupTextLabel = function() {

		//Going beyond Z?
		if (this.markupTextLabel == 'Z') {
			this.markupTextLabel = 'a';
			return;
		}

		//Get charcode of current label
		var charCode = this.markupTextLabel.charCodeAt(0);

		//Set new label
		this.markupTextLabel = String.fromCharCode(++charCode);
	};

	/**
	 * Set the new number markup label
	 */
	Player.incrementMarkupNumberLabel = function() {
		this.markupNumberLabel++;
	};
})

/**
 * Factory definition
 */
.factory('PlayerModeEdit', function($document, PlayerTools, MarkupTypes, GameScorer, StoneColor) {

	/**
	 * Helper to update the hover mark
	 */
	var updateHoverMark = function(x, y) {

		//Remove existing item
		this.board.layers.hover.remove();

		//What happens, depends on the active tool
		switch (this.tool) {

			//Setup tool
			case PlayerTools.SETUP:

				//Hovering over a stone? We can remove it
				if (this.game.hasStone(x, y)) {
					this.board.layers.hover.markup(x, y, MarkupTypes.MARK);
				}

				//Empty spot, we can add a stone if we're not clearing
				else if (this.setupTool != this.setupTools.CLEAR) {
					this.board.layers.hover.fadedStone(x, y, this.setupToolColor());
				}
				break;

			//Markup tool
			case PlayerTools.MARKUP:

				//Hovering over existing markup? We can remove it
				if (this.game.hasMarkup(x, y)) {
					this.board.layers.hover.markup(x, y, MarkupTypes.MARK);
				}

				//No markup yet
				else {

					//Text
					if (this.markupTool == this.markupTools.TEXT) {
						this.board.layers.hover.markup(x, y, {
							type: MarkupTypes.LABEL,
							text: this.markupTextLabel
						});
					}

					//Number
					else if (this.markupTool == this.markupTools.NUMBER) {
						this.board.layers.hover.markup(x, y, {
							type: MarkupTypes.LABEL,
							text: this.markupNumberLabel
						});
					}

					//Other markup
					else {
						this.board.layers.hover.markup(x, y, this.markupTool);
					}
				}
				break;

			//Move tool
			case PlayerTools.MOVE:

				//Hovering over empty spot where we can make a move?
				if (!this.game.hasStone(x, y) && this.game.isValidMove(x, y)) {
					this.board.layers.hover.fadedStone(x, y, this.game.getTurn());
				}
				break;

			//Score tool
			case PlayerTools.SCORE:

				//Hovering over a stone means it can be marked dead or alive
				if (this.game.hasStone(x, y)) {
					this.board.layers.hover.markup(x, y, MarkupTypes.MARK);
				}
				break;
		}

		//Add hover mark
		if (this._hoverMark) {
			this.board.addObject(this._hoverMark);
		}
	};

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

			//What happens, depends on the active tool
			switch (this.tool) {

				//Move tool
				case PlayerTools.MOVE:

					//Try to play the move
					if (!this.game.play(event.x, event.y)) {
						return;
					}
					break;

				//Setup tool
				case PlayerTools.SETUP:

					//Get the stone color
					var color = this.setupToolColor();

					//Trying to remove a stone
					if (color === StoneColor.NONE) {
						this.game.removeStone(event.x, event.y);
					}

					//Adding a stone
					else {

						//Already a stone in place? Remove it first
						if (this.game.hasStone(event.x, event.y)) {
							this.game.removeStone(event.x, event.y);
						}

						//Add it
						else {
							this.game.addStone(event.x, event.y, color);
						}
					}
					break;

				//Markup tool
				case PlayerTools.MARKUP:

					//Before dealing with markup, remove the hover markup in order to restore actual
					//markup back to the board. Otherwise, it conflicts when updating the board.
					this.board.layers.hover.remove();

					//Already markup in place? Remove it first
					if (this.game.hasMarkup(event.x, event.y)) {
						this.game.removeMarkup(event.x, event.y);
					}

					//Placing new markup
					else {

						//Text
						if (this.markupTool == this.markupTools.TEXT) {
							this.game.addMarkup(event.x, event.y, {
								type: MarkupTypes.LABEL,
								text: this.markupTextLabel
							});

							//Increment text
							this.incrementMarkupTextLabel();
						}

						//Number
						else if (this.markupTool == this.markupTools.NUMBER) {
							this.game.addMarkup(event.x, event.y, {
								type: MarkupTypes.LABEL,
								text: this.markupNumberLabel
							});

							//Increment number
							this.incrementMarkupNumberLabel();
						}

						//Other markup
						else {
							this.game.addMarkup(event.x, event.y, this.markupTool);
						}
					}
					break;

				//Score tool, mark stones dead or alive
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

			//Update board and update the hover mark
			this.updateBoard();
			updateHoverMark.call(this, event.x, event.y);
		},

		/**
		 * Mouse move handler
		 */
		mouseMove: function(event, mouseEvent) {

			//Nothing to do?
			if (this.frozen || !this.board.layers.hover) {
				return;
			}

			//Last coordinates are the same?
			if (this.board.layers.hover.isLast(event.x, event.y)) {
				return;
			}

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

				//Load the game into the game scorer and score the position
				GameScorer.load(this.game);
				scorePosition.call(this);
			}
		}
	};

	//Return
	return PlayerModeEdit;
});