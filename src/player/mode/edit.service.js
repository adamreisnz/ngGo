
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
 * Extend player functionality and register the mode
 */
.run(function(Player, PlayerModes, PlayerModeEdit, StoneColor) {

	/**
	 * Register event handlers
	 */
	Player.on('modeEnter', PlayerModeEdit.modeEnter, PlayerModes.EDIT);
	Player.on('mousedrag', PlayerModeEdit.mouseDrag, PlayerModes.EDIT);
	Player.on('keydown', PlayerModeEdit.keyDown, PlayerModes.EDIT);
	Player.on('click', PlayerModeEdit.click, PlayerModes.EDIT);
	Player.on('hover', PlayerModeEdit.hover, PlayerModes.EDIT);

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
		NUMBER:		'number',
		CLEAR:		'clear'
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
				return StoneColor.EMPTY;
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
	this.$get = function($document, PlayerTools, MarkupTypes, GameScorer, StoneColor) {

		/**
		 * Update hover mark at specific coordinates
		 */
		var updateHoverMark = function(x, y, isDrag) {

			//Falling outside of grid?
			if (!this.board.isOnBoard(x, y)) {
				return;
			}

			//What happens, depends on the active tool
			switch (this.tool) {

				//Setup tool
				case PlayerTools.SETUP:

					//Clear tool
					if (this.setupTool == this.setupTools.CLEAR) {

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

					//Clear tool
					if (this.markupTool == this.markupTools.CLEAR) {
						if (this.game.hasMarkup(x, y)) {
							this.board.add('hover', x, y, {
								type: 'markup',
								value: MarkupTypes.MARK
							});
						}
					}

					//Text
					else if (this.markupTool == this.markupTools.TEXT) {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: {
								type: MarkupTypes.LABEL,
								text: this.markupTextLabel
							}
						});
					}

					//Number
					else if (this.markupTool == this.markupTools.NUMBER) {
						this.board.add('hover', x, y, {
							type: 'markup',
							value: {
								type: MarkupTypes.LABEL,
								text: this.markupNumberLabel
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
				this.game.removeMarkup(x, y);
			}

			//Clear tool used? Done
			if (this.markupTool == this.markupTools.CLEAR) {
				return;
			}

			//Text
			else if (this.markupTool == this.markupTools.TEXT) {
				this.game.addMarkup(x, y, {
					type: MarkupTypes.LABEL,
					text: this.markupTextLabel
				});

				//Increment text
				this.incrementMarkupTextLabel();
			}

			//Number
			else if (this.markupTool == this.markupTools.NUMBER) {
				this.game.addMarkup(x, y, {
					type: MarkupTypes.LABEL,
					text: this.markupNumberLabel
				});

				//Increment number
				this.incrementMarkupNumberLabel();
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
		 * Player mode definition
		 */
		var PlayerModeEdit = {

			/**
			 * Hover handler
			 */
			hover: function(event) {

				//Remove all hover items
				this.board.removeAll('hover');

				//Single coordinate?
				if (!event.drag || (this.tool != PlayerTools.SETUP && this.tool != PlayerTools.MARKUP)) {
					updateHoverMark.call(this, event.x, event.y, false);
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

				//Update hover mark
				this.board.removeAll('hover');
				updateHoverMark.call(this, this.lastX, this.lastY);
			},

			/**
			 * Click handler
			 */
			click: function(event, mouseEvent) {

				//Falling outside of grid?
				if (!this.board.isOnBoard(event.x, event.y)) {
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
			mouseDrag: function(event, mouseEvent) {

				//Initialize vars
				var x, y;

				//Remove all hover items now to restore actual stones and markup to the board,
				//otherwise it will conflict when updating the board
				this.board.removeAll('hover');

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
			 * Handler for mode entry
			 */
			modeEnter: function(event) {

				//Set available tools for this mode
				this.setTools([
					PlayerTools.MOVE,
					PlayerTools.SETUP,
					PlayerTools.MARKUP,
					PlayerTools.SCORE
				]);

				//Set default tool
				this.tool = this.tools[0];
			}
		};

		//Return
		return PlayerModeEdit;
	};
});