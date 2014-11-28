
/**
 * PlayerModeSolve :: This module governs the "solve" mode of the player, e.g. trying to solve
 * go problems and finding the right move or variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Solve.Service', [])

/**
 * Run block
 */
.run(function(Player, PlayerModes, PlayerModeSolve) {

	/**
	 * Register mode
	 */
	Player.modes[PlayerModes.SOLVE] = PlayerModeSolve;

	/**
	 * Register event handlers for this mode
	 */
	Player.on('gameLoaded', PlayerModeSolve.gameLoaded, PlayerModes.SOLVE);
	Player.on('modeEnter', PlayerModeSolve.modeEnter, PlayerModes.SOLVE);
	Player.on('modeExit', PlayerModeSolve.modeExit, PlayerModes.SOLVE);
	Player.on('keydown', PlayerModeSolve.keyDown, PlayerModes.SOLVE);
	Player.on('click', PlayerModeSolve.mouseClick, PlayerModes.SOLVE);
	Player.on('mousemove', PlayerModeSolve.mouseMove, PlayerModes.SOLVE);

	//Remember the player color for this problem
	Player.problemPlayerColor = 0;

	//Solved flag
	Player.problemSolved = false;

	//Off path flag
	Player.problemOffPath = false;
})

/**
 * Factory definition
 */
.factory('PlayerModeSolve', function($document, $timeout, PlayerTools, StoneFaded) {

	//Block navigation while in timeout
	var navigationBlocked = false;

	/**
	 * Check if we can make a move
	 */
	var canMakeMove = function() {

		//We can make a move when...

		//...there is no auto play going on
		if (!this.config.solveAutoPlay) {
			return true;
		}

		//...we solved the puzzle already
		if (this.problemSolved) {
			return true;
		}

		//...we are off path
		if (this.problemOffPath) {
			return true;
		}

		//...it's our turn
		if (this.game.getTurn() == this.problemPlayerColor) {
			return true;
		}

		//Otherwise, we can't make a move
		return false;
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

			//Move tool
			case PlayerTools.MOVE:

				//Check if we can make a move and if it's a valid move location
				if (canMakeMove.call(this) && this.game.isValidMove(x, y)) {
					this._hoverMark = new StoneFaded({
						x: x,
						y: y,
						color: this.game.getTurn()
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
	var PlayerModeSolve = {

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

					//Go forward one move if solved
					if (this.config.arrowKeysNavigation && solved) {
						this.next();
					}
					break;

				//Left arrow
				case 37:
					if (this.config.arrowKeysNavigation && !navigationBlocked) {

						//Go back one move
						this.previous();

						//Go back one more if this is not the player's turn and if
						//the problem hasn't been solved yet
						if (!this.problemSolved && this.config.solveAutoPlay && this.game.getTurn() == -this.problemPlayerColor) {
							this.previous();
						}
					}
					break;

				default:
					return true;
			}

			//Don't scroll with arrows
			if (this.config.lockScroll) {
				keyboardEvent.preventDefault();
			}
		},

		/**
		 * Handler for mouse click events
		 */
		mouseClick: function(event, mouseEvent) {

			//Check if we clicked a move variation
			var i = this.game.isMoveVariation(event.x, event.y);

			//A valid variation
			if (i != -1) {

				//Advance to the next position and get the next node
				this.next(i);
				var node = this.game.getNode();

				//No children left? Check if we solved it or not
				if (node.children.length === 0) {
					if (node.move.solution) {
						this.problemSolved = true;
						this.broadcast('solutionFound', node);
					}
					else {
						this.broadcast('solutionWrong', node);
					}
					return;
				}

				//Stop auto-playing if solved
				if (this.problemSolved || !this.config.solveAutoPlay) {
					return;
				}

				//Children left, pick a random one and make a move
				i = Math.floor(Math.random() * node.children.length), self = this;

				//Using timeouts?
				if (this.config.solveAutoPlayTimeout) {

					//Block navigation and run the timeout
					navigationBlocked = true;
					$timeout(function() {
						self.next(i);
						navigationBlocked = false;
					}, this.config.solveAutoPlayTimeout);
					return;
				}

				//Just move to the next node immediately
				this.next(i);
				return;
			}

			//Unknown variation, try to play
			var changes = this.game.play(event.x, event.y);
			if (changes) {
				this.problemOffPath = true;
				this.updateBoard.call(this, changes);
				this.broadcast('solutionWrong', this.game.getNode());
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

			//Update hover mark
			updateHoverMark.call(this, event.x, event.y);
		},

		/**
		 * Handler for game loaded
		 */
		gameLoaded: function(event) {

			//Set player color
			this.problemPlayerColor = this.game.getTurn();
		},

		/**
		 * Handler for mode entry
		 */
		modeEnter: function(event) {

			//Set available tools for this mode
			this.tools = [
				PlayerTools.MOVE
			];

			//Set default tool
			this.tool = this.tools[0];

			//Initialize player color
			this.problemPlayerColor = this.game.getTurn();
		},

		/**
		 * Handler for mode exit
		 */
		modeExit: function(event) {

		}
	};

	//Return
	return PlayerModeSolve;
});