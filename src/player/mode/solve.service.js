
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
.factory('PlayerModeSolve', function($document, $timeout, PlayerTools, Game, StoneFaded) {

	//Available tools for this mode
	var availableTools = [
		PlayerTools.MOVE,
		PlayerTools.NONE
	];

	//Remember the variation board markup setting
	var variationBoardMarkup = false;

	//Block navigation while in timeout
	var navigationBlocked = false;

	//Remember the player color for this problem
	var playerColor;

	//Solved flag
	var solved = false;

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
						if (!solved && this.config.solveAutoPlay && Game.getTurn() == -playerColor) {
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
			var i = Game.isMoveVariation(event.x, event.y);

			//A valid variation
			if (i != -1) {

				//Advance to the next position and get the next node
				this.next(i);
				var node = Game.getNode();

				//No children left? Check if we solved it or not
				if (node.children.length === 0) {
					if (node.move.solution) {
						solved = true;
						this.broadcast('solutionFound', node);
					}
					else {
						this.broadcast('solutionWrong', node);
					}
					return;
				}

				//Stop auto-playing if solved
				if (solved || !this.config.solveAutoPlay) {
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

			//Unknown, but valid move
			if (Game.play(event.x, event.y)) {
				//TODO: add move to kifu!
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

			//When in solve mode, we are allowed to place stones on all valid move locations
			//and only when it's our turn, unless we've solved the problem
			if (solved || !this.config.solveAutoPlay || Game.getTurn() == playerColor) {
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
			}

			//Clear last mark
			delete this._lastMark;
		},

		/**
		 * Handler for kifu loaded
		 */
		kifuLoaded: function(event) {
			playerColor = Game.getTurn();
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