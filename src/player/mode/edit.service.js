
/**
 * PlayerModeEdit :: This class governs the "edit" mode of the player, e.g. editing a game record
 * and its board positions.
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
.run(function(Player, PlayerModes, PlayerTools, MarkupTypes, SetupTypes, KifuReader, GameScorer, StoneFaded, Markup) {

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
	 * Keydown handler
	 */
	var keyDown = function(event, keyboardEvent) {

		//Don't navigate when we're inside a text field?
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

			//TODO: up down for variation selection?
			default:
				return true;
		}

		//Don't scroll with arrows
		if (this.config.lockScroll) {
			keyboardEvent.preventDefault();
		}
	};

	/**
	 * Click handler
	 */
	var mouseClick = function(event, mouseEvent) {

		//Get current node
		var node = KifuReader.getNode();

		//Check if anything to do
		if (!node) {
			return false;
		}

		//What happens, depends on the active tool
		switch (this.tool) {

			//When setting up, we can place stones on empty positions
			case PlayerTools.SETUP:
				if (!this.board.hasStone(event.x, event.y)) {

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
	};

	/**
	 * Mouse move handler
	 */
	var mouseMove = function(event, mouseEvent) {

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
				break;

			//We can place stones on empty spots
			case PlayerTools.SETUP:
				if (!this.board.hasStone(event.x, event.y)) {

					//Create faded stone object
					this._lastMark = new StoneFaded({
						x: event.x,
						y: event.y,
						color: StoneColor[this.tool]
					});

					//Add to board
					this.board.addObject(this._lastMark);
				}
				break;

			//We can mark stones as dead or alive
			case PlayerTools.SCORE:
				if (this.board.hasStone(event.x, event.y)) {

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
	};

	/**
	 * Mouse out handler
	 */
	var mouseOut = function(event, mouseEvent) {
		if (this._lastMark) {
			this.board.removeObject(this._lastMark);
			delete this._lastMark;
			delete this._lastX;
			delete this._lastY;
		}
	};

	/**
	 * Mousewheel handler
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
	 * Handler for mode switches
	 */
	var modeSwitch = function(event) {

		//Set default tool
		this.tool = availableTools[0];
	};

	/**
	 * Handler for tool switches
	 */
	var toolSwitch = function(event) {

		//Invalid tool? Select the first one
		if (availableTools.indexOf(this.tool) === -1) {
			this.tool = availableTools[0];
		}

		//Switched to scoring?
		if (this.tool == PlayerTools.SCORE) {

			//Remember the current board state
			this.preScoreState = this.board.getState();

			//Feed the current game
			GameScorer.setGame(KifuReader.getGame());

			//Score the position
			scorePosition.call(this);
		}
	};

	/**
	 * Register event listeners
	 */
	Player.listen('modeSwitch', modeSwitch, PlayerModes.EDIT);
	Player.listen('toolSwitch', toolSwitch, PlayerModes.EDIT);
	Player.listen('keydown', keyDown, PlayerModes.EDIT);
	Player.listen('click', mouseClick, PlayerModes.EDIT);
	Player.listen('mousemove', mouseMove, PlayerModes.EDIT);
	Player.listen('mouseout', mouseOut, PlayerModes.EDIT);
	Player.listen('mousewheel', mouseWheel, PlayerModes.EDIT);
});