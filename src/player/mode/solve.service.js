
/**
 * PlayerModeSolve :: This module governs the "solve" mode of the player, e.g. trying to solve
 * go problems and finding the right move or variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Solve.Service', [
	'ngGo'
])

/**
 * Extend player functionality and register the mode
 */
.run(function(Player, PlayerModes, PlayerModeSolve) {

	/**
	 * Register event handlers
	 */
	Player.on('settingChange', PlayerModeSolve.settingChange, PlayerModes.SOLVE);
	Player.on('boardUpdate', PlayerModeSolve.boardUpdate, PlayerModes.SOLVE);
	Player.on('gameLoaded', PlayerModeSolve.gameLoaded, PlayerModes.SOLVE);
	Player.on('modeEnter', PlayerModeSolve.modeEnter, PlayerModes.SOLVE);
	Player.on('modeExit', PlayerModeSolve.modeExit, PlayerModes.SOLVE);
	Player.on('keydown', PlayerModeSolve.keyDown, PlayerModes.SOLVE);
	Player.on('click', PlayerModeSolve.click, PlayerModes.SOLVE);
	Player.on('hover', PlayerModeSolve.hover, PlayerModes.SOLVE);

	/**
	 * Set solve auto play delay
	 */
	Player.setSolveAutoPlay = function(autoPlay) {
		if (this.solveAutoPlay != autoPlay) {
			this.solveAutoPlay = autoPlay;
			this.broadcast('settingChange', 'solveAutoPlay');
		}
	};

	/**
	 * Set solve auto play delay
	 */
	Player.setSolveAutoPlayDelay = function(delay) {
		if (this.solveAutoPlayDelay != delay) {
			this.solveAutoPlayDelay = delay;
			this.broadcast('settingChange', 'solveAutoPlayDelay');
		}
	};

	//The player color for this problem
	Player.problemPlayerColor = 0;

	//Solved and off-path flags
	Player.problemSolved = false;
	Player.problemOffPath = false;

	//Auto play vars
	Player.solveAutoPlay = true;
	Player.solveAutoPlayDelay = 500;

	//Register mode
	Player.registerMode(PlayerModes.SOLVE, PlayerModeSolve);
})

/**
 * Provider definition
 */
.provider('PlayerModeSolve', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Auto play settings
		solve_auto_play: true,
		solve_auto_play_delay: 500
	};

	/**
	 * Set global default configuration for players
	 */
	this.setConfig = function(config) {
		defaultConfig = angular.extend(defaultConfig, config);
	};

	/**
	 * Service getter
	 */
	this.$get = function($document, $timeout, Player, PlayerTools) {

		/**
		 * Block navigation while in timeout
		 */
		var navigationBlocked = false;

		/**
		 * Check if we can make a move
		 */
		var canMakeMove = function() {

			//We can make a move when...

			//...there is no auto play going on
			if (!this.solveAutoPlay) {
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

			//Falling outside of grid?
			if (!this.board.isOnBoard(x, y)) {
				return;
			}

			//What happens, depends on the active tool
			switch (this.tool) {

				//Move tool
				case PlayerTools.MOVE:

					//Hovering over empty spot where we can make a move?
					if (canMakeMove.call(this) && this.game.isValidMove(x, y)) {
						this.board.add('hover', x, y, {
							type: 'stones',
							value: this.game.getTurn()
						});
					}
					break;
			}
		};

		/**
		 * Helper to show solution paths
		 */
		var showSolutionPaths = function(variations) {
			for (var i = 0; i < variations.length; i++) {
				if (variations[i].solution === true) {
					this.board.add('markup', variations[i].move.x, variations[i].move.y, {
						type: this.board.theme.get('markup.solution.valid.type'),
						text: this.board.theme.get('markup.solution.valid.text', i),
						scale: this.board.theme.get('markup.solution.valid.scale'),
						color: this.board.theme.get('markup.solution.valid.color')
					});
				}
				else {
					this.board.add('markup', variations[i].move.x, variations[i].move.y, {
						type: this.board.theme.get('markup.solution.invalid.type'),
						text: this.board.theme.get('markup.solution.invalid.text', i),
						scale: this.board.theme.get('markup.solution.invalid.scale'),
						color: this.board.theme.get('markup.solution.invalid.color')
					});
				}
			}
		};

		/**
		 * Helper to hide solution paths
		 */
		var hideSolutionPaths = function(variations) {
			for (var i = 0; i < variations.length; i++) {
				this.board.remove('markup', variations[i].move.x, variations[i].move.y);
			}
		};

		/**
		 * Draw (or clear) solution paths
		 */
		var drawSolutionPaths = function(show) {

			//Check if we can do something
			if (!this.board || !this.game || !this.game.isLoaded()) {
				return;
			}

			//Get node and variations
			var node = this.game.getNode(),
				variations = node.getMoveVariations();

			//When showing, make sure it's not during the auto solver's move
			if (show && !this.problemSolved && this.solveAutoPlay) {
				if (this.game.getTurn() != this.problemPlayerColor) {
					return;
				}
			}

			//Call helper
			if (show) {
				showSolutionPaths.call(this, variations);
			}
			else {
				hideSolutionPaths.call(this, variations);
			}
		};

		/**
		 * Player mode definition
		 */
		var PlayerModeSolve = {

			/**
			 * Parse config instructions
			 */
			parseConfig: function(config) {

				//Validate
				if (typeof config != 'object') {
					return;
				}

				//Extend from default config
				this.config = angular.extend({}, this.config, defaultConfig, config);

				//Process settings
				this.setSolveAutoPlay(this.config.solve_auto_play);
				this.setSolveAutoPlayDelay(this.config.solve_auto_play_delay);
			},

			/**
			 * Setting changes handler
			 */
			settingChange: function(event, setting) {

				//Solution paths setting changes?
				if (setting == 'solutionPaths')	{
					drawSolutionPaths.call(this, this.solutionPaths);
				}
			},

			/**
			 * Hover handler
			 */
			hover: function(event) {
				this.board.removeAll('hover');
				updateHoverMark.call(this, event.x, event.y);
			},

			/**
			 * Board update event handler
			 */
			boardUpdate: function(event, node) {

				//Show move variations
				if (this.solutionPaths) {
					drawSolutionPaths.call(this, true);
				}
			},

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

						//Arrow keys navigation enabled?
						if (this.arrowKeysNavigation) {

							//Lock scroll
							keyboardEvent.preventDefault();

							//Go forward one move if solved
							if (this.problemSolved) {
								this.next();
							}
						}
						break;

					//Left arrow
					case 37:

						//Arrow keys navigation enabled?
						if (this.arrowKeysNavigation) {

							//Lock scroll
							keyboardEvent.preventDefault();

							//Navigation not blocked?
							if (!navigationBlocked) {

								//Go back one move
								this.previous();

								//Go back one more if this is not the player's turn and if
								//the problem hasn't been solved yet
								if (!this.problemSolved && this.solveAutoPlay && this.game.getTurn() == -this.problemPlayerColor) {
									this.previous();
								}
							}
						}
						break;
				}

				//Update hover mark
				this.board.removeAll('hover');
				updateHoverMark.call(this, this.lastX, this.lastY);
			},

			/**
			 * Handler for mouse click events
			 */
			click: function(event, mouseEvent) {

				//Falling outside of grid?
				if (!this.board.isOnBoard(event.x, event.y)) {
					return;
				}

				//A valid variation
				if (this.game.isMoveVariation(event.x, event.y)) {

					//Get the node
					var i = this.game.getMoveVariation(event.x, event.y);

					//Advance to the next position and get the next node
					this.next(i);
					var node = this.game.getNode();

					//No children left? Check if we solved it or not
					if (node.children.length === 0) {
						if (node.solution === true) {
							this.problemSolved = true;
							this.broadcast('solutionFound', node);
						}
						else {
							this.broadcast('solutionWrong', node);
						}
					}

					//Auto-play?
					else if (!this.problemSolved && this.solveAutoPlay) {

						//Children left, pick a random one and make a move
						i = Math.floor(Math.random() * node.children.length), self = this;

						//Using a delay?
						if (this.solveAutoPlayDelay) {

							//Block navigation and run the timeout
							navigationBlocked = true;
							var self = this;
							$timeout(function() {
								self.next(i);
								navigationBlocked = false;
							}, this.solveAutoPlayDelay);
						}

						//Just move to the next node immediately
						else {
							this.next(i);
						}
					}
				}

				//Unknown variation, try to play
				else if (this.game.play(event.x, event.y)) {
					this.problemOffPath = true;
					this.updateBoard();
					this.broadcast('solutionOffPath', this.game.getNode());
				}

				//Update hover mark
				this.board.removeAll('hover');
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
				this.setTools([
					PlayerTools.MOVE
				]);

				//Set default tool
				this.tool = this.tools[0];

				//Initialize player color
				if (this.game && this.game.isLoaded()) {
					this.problemPlayerColor = this.game.getTurn();
				}

				//Draw solution variations
				if (this.solutionPaths) {
					drawSolutionPaths.call(this, true);
				}
			},

			/**
			 * Handler for mode exit
			 */
			modeExit: function(event) {

				//Hide any solution variations
				if (this.solutionPaths) {
					drawSolutionPaths.call(this, false);
				}
			}
		};

		//Return
		return PlayerModeSolve;
	};
});