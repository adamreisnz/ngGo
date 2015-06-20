
/**
 * PlayerModeEdit :: This module governs the "edit" mode of the player, e.g. editing
 * a game record and its board positions.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Edit.Service', [
	'ngGo',
	'ngGo.Game.Scorer.Service'
])

/**
 * Setup tools
 */
.constant('SetupTools', {
	BLACK:		'black',
	WHITE:		'white',
	CLEAR:		'clear'
})

/**
 * Markup tools
 */
.constant('MarkupTools', {
	TRIANGLE:	'triangle',
	CIRCLE:		'circle',
	SQUARE:		'square',
	MARK:		'mark',
	SELECT:		'select',
	SAD:		'sad',
	HAPPY:		'happy',
	TEXT:		'text',
	NUMBER:		'number',
	CLEAR:		'clear'
})

/**
 * Extend player functionality and register the mode
 */
.run(function(Player, PlayerModes, PlayerModeEdit) {

	//Register event handlers
	Player.on('pathChange', PlayerModeEdit.pathChange, PlayerModes.EDIT);
	Player.on('toolSwitch', PlayerModeEdit.toolSwitch, PlayerModes.EDIT);
	Player.on('modeEnter', PlayerModeEdit.modeEnter, PlayerModes.EDIT);
	Player.on('mousedrag', PlayerModeEdit.mouseDrag, PlayerModes.EDIT);
	Player.on('keydown', PlayerModeEdit.keyDown, PlayerModes.EDIT);
	Player.on('click', PlayerModeEdit.click, PlayerModes.EDIT);
	Player.on('hover', PlayerModeEdit.hover, PlayerModes.EDIT);

	//Register mode
	Player.registerMode(PlayerModes.EDIT, PlayerModeEdit);
})

/**
 * Provider definition
 */
.provider('PlayerModeEdit', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

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
	this.$get = function(Player, PlayerTools, SetupTools, MarkupTools, MarkupTypes, GameScorer, StoneColor) {

		//Character codes
		var aChar = 'A'.charCodeAt(0),
			aCharLc = 'a'.charCodeAt(0);

		/**
		 * Update hover mark at specific coordinates
		 */
		var updateHoverMark = function(x, y, isDrag) {

			//If no coordinates specified, use last mouse coordinates
			if (typeof x === 'undefined' || typeof y === 'undefined') {
				x = this.mouse.lastX;
				y = this.mouse.lastY;
			}

			//Falling outside of grid?
			if (!this.board || !this.board.isOnBoard(x, y)) {
				return;
			}

			//What happens, depends on the active tool
			switch (this.tool) {

				//Setup tool
				case PlayerTools.SETUP:

					//Clear tool
					if (this.setupTool === SetupTools.CLEAR) {

						//Stone present? Can remove it
						if (this.game.hasStone(x, y)) {
							this.board.add('hover', x, y, {
								type: 'markup',
								value: MarkupTypes.MARK
							});
						}
					}

					//Stone color tool
					else {

						//Add or overwrite stone if no stone present of the given color
						if (!this.game.hasStone(x, y, this.setupToolColor())) {
							this.board.add('hover', x, y, {
								type: 'stones',
								value: this.setupToolColor()
							});
						}

						//Stone present of same color? Can remove it if we're not dragging
						else if (!isDrag) {
							this.board.add('hover', x, y, {
								type: 'markup',
								value: MarkupTypes.MARK
							});
						}
					}
					break;

				//Markup tool
				case PlayerTools.MARKUP:

					//Clear tool, or already markup in place?
					if (this.markupTool === MarkupTools.CLEAR || this.game.hasMarkup(x, y)) {
						if (this.game.hasMarkup(x, y)) {
							this.board.add('hover', x, y, {
								type: 'markup',
								value: MarkupTypes.MARK
							});
						}
					}

					//Text or number
					else if (this.markupTool === MarkupTools.TEXT || this.markupTool === MarkupTools.NUMBER) {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: {
								type: MarkupTypes.LABEL,
								text: this.markupLabel
							}
						});
					}

					//Other markup
					else {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: this.markupTool
						});
					}
					break;

				//Move tool
				case PlayerTools.MOVE:

					//Hovering over empty spot where we can make a move?
					if (!this.game.hasStone(x, y) && this.game.isValidMove(x, y)) {
						this.board.add('hover', x, y, {
							type: 'stones',
							value: this.game.getTurn()
						});
					}
					break;

				//Score tool
				case PlayerTools.SCORE:

					//Hovering over a stone means it can be marked dead or alive
					if (this.game.hasStone(x, y)) {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: MarkupTypes.MARK
						});
					}
					break;
			}
		};

		/**
		 * Helper to set markup
		 */
		var setMarkup = function(x, y) {

			//Already markup in place? Remove it first
			if (this.game.hasMarkup(x, y)) {

				//Check what markup there is
				var markup = this.game.getMarkup(x, y);

				//Label? Also remove from our labels list
				if (markup.type === MarkupTypes.LABEL && markup.text) {
					var i = this.markupLabels.indexOf(markup.text);
					if (i !==  -1) {
						this.markupLabels.splice(i, 1);
					}
				}

				//Remove from game
				this.game.removeMarkup(x, y);
				return;
			}

			//Clear tool used? Done
			if (this.markupTool === MarkupTools.CLEAR) {
				return;
			}

			//Text
			else if (this.markupTool === MarkupTools.TEXT) {
				this.game.addMarkup(x, y, {
					type: MarkupTypes.LABEL,
					text: this.markupLabel
				});

				//Determine next text label
				this.markupLabels.push(this.markupLabel);
				this.determineMarkupLabel();
			}

			//Number
			else if (this.markupTool === MarkupTools.NUMBER) {
				this.game.addMarkup(x, y, {
					type: MarkupTypes.LABEL,
					text: this.markupLabel
				});

				//Determine next number label
				this.markupLabels.push(this.markupLabel);
				this.determineMarkupLabel();
			}

			//Other markup
			else {
				this.game.addMarkup(x, y, this.markupTool);
			}
		};

		/**
		 * Helper to set a stone
		 */
		var setStone = function(x, y, isDrag) {

			//Get the stone color
			var color = this.setupToolColor();

			//Trying to remove a stone
			if (color === StoneColor.EMPTY) {
				this.game.removeStone(x, y);
			}

			//Adding a stone
			else {

				//A stone there already of the same color? Just remove if not dragging
				if (!isDrag && this.game.hasStone(x, y, color)) {
					this.game.removeStone(x, y);
					return;
				}

				//Any stone present?
				else if (this.game.hasStone(x, y)) {
					this.game.removeStone(x, y);
				}

				//Add stone now
				this.game.addStone(x, y, color);
			}

			//Redraw markup
			this.board.layers.markup.redrawCell(x, y);
		};

		/**
		 * Find all markup labels in current position
		 */
		var findAllMarkupLabels = function() {

			//Clear
			this.markupLabels = [];

			//Must have game
			if (!this.game || !this.game.isLoaded()) {
				return;
			}

			//Get all markup from position
			var markup = this.game.position.markup.all('type');
			for (var i = 0; i < markup.length; i++) {
				if (markup[i].type === MarkupTypes.LABEL && markup[i].text !== = '') {
					this.markupLabels.push(markup[i].text);
				}
			}
		};

		/**
		 * Player extension
		 */
		angular.extend(Player, {

			//Active setup tool and markup tool
			setupTool: SetupTools.BLACK,
			markupTool: MarkupTools.TRIANGLE,

			//Current markup labels on the board and current markup label
			markupLabels: [],
			markupLabel: '',

			/**
			 * Set the setup tool
			 */
			switchSetupTool: function(tool) {
				this.setupTool = tool;
			},

			/**
			 * Set the markup tool
			 */
			switchMarkupTool: function(tool) {
				this.markupTool = tool;
				if (this.markupTool === MarkupTools.TEXT || this.markupTool === MarkupTools.NUMBER) {
					this.determineMarkupLabel();
				}
			},

			/**
			 * Conversion of setup tool to stone color
			 */
			setupToolColor: function() {
				switch (this.setupTool) {
					case SetupTools.BLACK:
						return StoneColor.B;
					case SetupTools.WHITE:
						return StoneColor.W;
					default:
						return StoneColor.EMPTY;
				}
			},

			/**
			 * Set the new text markup label
			 */
			setMarkupLabel: function(label) {
				if (label) {
					this.markupLabel = label;
				}
			},

			/**
			 * Determine the new text markup label
			 */
			determineMarkupLabel: function() {

				//Clear
				this.markupLabel = '';

				//Check what tool we're using
				switch (this.markupTool) {

					//Text tool?
					case MarkupTools.TEXT:
						var i = 0;

						//Loop while the label is present
						while (!this.markupLabel || this.markupLabels.indexOf(this.markupLabel) !==  -1) {

							//A-Z
							if (i < 26) {
								this.markupLabel = String.fromCharCode(aChar + i);
							}

							//a-z
							else if (i < 52) {
								this.markupLabel = String.fromCharCode(aCharLc + i - 26);
							}

							//AA, AB, AC, etc.
							else {
								this.markupLabel = String.fromCharCode(aChar + Math.floor(i / 26) - 2) + String.fromCharCode(aChar + (i % 26));
							}

							//Keep going
							i++;
						}
						break;

					//Number tool?
					case MarkupTools.NUMBER:
						this.markupLabel = 0;

						//Loop while the label is present
						while (this.markupLabel === 0 || this.markupLabels.indexOf(this.markupLabel) !==  -1) {
							this.markupLabel++;
						}
						break;
				}
			}
		});

		/**
		 * Player mode definition
		 */
		var PlayerModeEdit = {

			/**
			 * Hover handler
			 */
			hover: function(event) {

				//Must have board
				if (!this.board) {
					return;
				}

				//Remove all hover items
				this.board.removeAll('hover');

				//Single coordinate?
				if (!event.drag || (this.tool !==  PlayerTools.SETUP && this.tool !==  PlayerTools.MARKUP)) {
					updateHoverMark.call(this);
					return;
				}

				//No dragging for labels
				if (this.markupTool === MarkupTools.TEXT || this.markupTool === MarkupTools.NUMBER) {
					updateHoverMark.call(this);
					return;
				}

				//Loop area
				for (var x = event.drag.start.x; x <= event.drag.stop.x; x++) {
					for (var y = event.drag.start.y; y <= event.drag.stop.y; y++) {
						updateHoverMark.call(this, x, y, true);
					}
				}
			},

			/**
			 * Keydown handler
			 */
			keyDown: function(event, keyboardEvent) {

				//Switch key code
				switch (keyboardEvent.keyCode) {

					//TODO: tool switching via keyboard input
				}
			},

			/**
			 * Click handler
			 */
			click: function(event) {

				//Falling outside of grid?
				if (!this.board || !this.board.isOnBoard(event.x, event.y)) {
					return;
				}

				//Remove all hover items now to restore actual stones and markup to the board,
				//otherwise it will conflict when updating the board
				this.board.removeAll('hover');

				//What happens, depends on the active tool
				switch (this.tool) {

					//Move tool
					case PlayerTools.MOVE:

						//Try to play the move
						if (!this.game.play(event.x, event.y)) {
							return;
						}
						this.processPosition();
						break;

					//Setup tool
					case PlayerTools.SETUP:

						//Set stone and update board
						setStone.call(this, event.x, event.y);
						this.processPosition();
						break;

					//Markup tool
					case PlayerTools.MARKUP:

						//Set markup and update board
						setMarkup.call(this, event.x, event.y);
						this.processPosition();
						break;

					//Score tool, mark stones dead or alive
					case PlayerTools.SCORE:

						//Mark the clicked item and score the current game position
						GameScorer.mark(event.x, event.y);
						this.scoreGame();
						break;
				}

				//Handle hover
				PlayerModeEdit.hover.call(this, event);
			},

			/**
			 * Mouse drag handler
			 */
			mouseDrag: function(event) {

				//Initialize vars
				var x, y;

				//Remove all hover items now to restore actual stones and markup to the board,
				//otherwise it will conflict when updating the board
				if (this.board) {
					this.board.removeAll('hover');
				}

				//What happens, depends on the active tool
				switch (this.tool) {

					//Setup tool
					case PlayerTools.SETUP:

						//Loop dragging grid
						for (x = event.drag.start.x; x <= event.drag.stop.x; x++) {
							for (y = event.drag.start.y; y <= event.drag.stop.y; y++) {
								setStone.call(this, x, y, true);
							}
						}

						//Process position
						this.processPosition();
						break;

					//Markup tool
					case PlayerTools.MARKUP:

						//Don't do this for labels
						if (this.markupTool === MarkupTools.TEXT || this.markupTool === MarkupTools.NUMBER) {
							break;
						}

						//Loop dragging grid
						for (x = event.drag.start.x; x <= event.drag.stop.x; x++) {
							for (y = event.drag.start.y; y <= event.drag.stop.y; y++) {
								setMarkup.call(this, x, y);
							}
						}

						//Process position
						this.processPosition();
						break;
				}

				//Handle hover
				PlayerModeEdit.hover.call(this, event);
			},

			/**
			 * Path change
			 */
			pathChange: function() {
				findAllMarkupLabels.call(this);
			},

			/**
			 * Handler for mode entry
			 */
			modeEnter: function() {

				//Set available tools for this mode
				this.setTools([
					PlayerTools.MOVE,
					PlayerTools.SETUP,
					PlayerTools.MARKUP,
					PlayerTools.SCORE
				]);

				//Set default tool
				this.tool = this.tools[0];

				//Find all markup labels in the current game position
				findAllMarkupLabels.call(this);
			},

			/**
			 * Handler for tool switches
			 */
			toolSwitch: function() {

				//Switched to scoring?
				if (this.tool === PlayerTools.SCORE) {

					//Remember the current board state
					this.statePreScoring = this.board.getState();

					//Load game into scorer and score the game
					GameScorer.load(this.game);
					this.scoreGame();
				}

				//Back to another state?
				else {
					if (this.statePreScoring) {
						this.board.restoreState(this.statePreScoring);
						delete this.statePreScoring;
					}
				}
			}
		};

		//Return
		return PlayerModeEdit;
	};
});
