
/**
 * Player :: This class brings the board to life and allows a user to interact with it. It
 * handles user input, can load Kifu's, places markup and allows the user to edit the board or score
 * a position. Unless you want to display static positions, this is the class you'd use by default.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Service', [
	'ngGo.Service',
	'ngGo.Player.Directive',
	'ngGo.Player.Mode.Common.Service',
	'ngGo.Board.Service',
	'ngGo.Game.Service',
	'ngGo.Game.Scorer.Service'
])

/**
 * Player modes constant
 */
.constant('PlayerModes', {
	PLAY:		'play',
	REPLAY:		'replay',
	EDIT:		'edit',
	SOLVE:		'solve'
})

/**
 * Player tools constant
 */
.constant('PlayerTools', {
	NONE:		'none',
	MOVE:		'move',
	SCORE:		'score',
	SETUP:		'setup',
	MARKUP:		'markup'
})

/**
 * Setup types
 */
.constant('SetupTypes', {
	BLACK:		'B',
	WHITE:		'W',
	CLEAR:		'E'
})

/**
 * Markup types
 */
.constant('MarkupTypes', {
	TRIANGLE:	'triangle',
	CIRCLE:		'circle',
	SQUARE:		'square',
	MARK:		'mark',
	SELECT:		'select',
	LABEL:		'label',
	LAST:		'last',
	SAD:		'sad',
	HAPPY:		'happy'
})

/**
 * Provider definition
 */
.provider('Player', function(PlayerModes) {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Keys/scrollwheel navigation
		arrowKeysNavigation: true,
		scrollWheelNavigation: true,

		//Disable window scrolling when scrolling player
		lockScroll: true,

		//Last move marking
		markLastMove: true,
		lastMoveMarker: 'last',

		//Allow the display instructions from the game record to overwrite standard settings
		allowDisplayInstructions: true,

		//Indicate variations with markup on the board or not
		variationBoardMarkup: true,

		//Show variations of successor nodes
		variationChildren: true,

		//Show variations of current node
		variationSiblings: false,

		//Solve mode auto play settings
		solveAutoPlay: true,
		solveAutoPlayTimeout: 500,

		//Event listeners to apply on the player HTML element
		elementEvents: ['keydown', 'click', 'mousemove', 'mouseout', 'mousewheel']
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
	this.$get = function($rootScope, Game, GameScorer, Board, PlayerModes, PlayerTools, Stone, Markup) {

		/**
		 * Helper to append board grid coordinatess to the broadcast event object
		 */
		var appendGridCoordinates = function(broadcastEvent, mouseEvent) {

			//Can only do this with a board
			if (!this.board) {
				broadcastEvent.x = -1;
				broadcastEvent.y = -1;
				return;
			}

			//Init
			var x = mouseEvent.offsetX || mouseEvent.originalEvent.offsetX || mouseEvent.originalEvent.layerX,
				y = mouseEvent.offsetY || mouseEvent.originalEvent.offsetY || mouseEvent.originalEvent.layerY;

			//Apply pixel ratio factor
			x *= (window.devicePixelRatio || 1);
			y *= (window.devicePixelRatio || 1);

			//Append coords
			broadcastEvent.x = this.board.getGridX(x);
			broadcastEvent.y = this.board.getGridY(y);
		};

		/**
		 * Player class
		 */
		var Player = {

			//Player configuration
			config: angular.copy(defaultConfig),

			//Board and game containers
			board: null,
			game: new Game(),

			//Frozen state
			frozen: false,

			//Player mode and active tool
			mode: null,
			tool: null,

			//Available modes and tools
			modes: {},
			tools: [],

			/**
			 * Load and auto detect format
			 */
			load: function(data, path) {

				//Try to load the game record data
				if (!this.game.load(data)) {
					return false;
				}

				//Process display instructions
				if (this.config.allowDisplayInstructions) {
					this.displayInstructions(this.game.get('display'));
				}

				//Get board info
				var board = this.game.get('board');

				//Remove all objects, set size and section
				this.board.removeAllObjects();
				this.board.setSize(board.width, board.height);
				this.board.setSection(board.section);

				//Path given? Go there now
				if (path) {
					this.goto(path);
				}

				//Otherwise, go to the fist position
				else {
					this.first();
				}

				//Dispatch game loaded event
				this.broadcast('gameLoaded', this.game);
			},

			/**
			 * Process display instructions (can be given in game record)
			 */
			displayInstructions: function(display) {

				//No instructions?
				if (!display) {
					return;
				}

				//Show board markup for variations?
				if (typeof display.variation_board_markup != 'undefined') {
					this.variationBoardMarkup = display.variation_board_markup;
				}

				//Show variations of successor nodes?
				if (typeof display.variation_children != 'undefined') {
					this.variationChildren = display.variation_children;
				}

				//Show variations of current node?
				if (typeof display.variation_siblings != 'undefined') {
					this.variationSiblings = display.variation_siblings;
				}
			},

			/***********************************************************************************************
			 * Game record navigation
			 ***/

			/**
			 * Play next move
			 */
			next: function(i) {

				//Frozen or no game?
				if (this.frozen || !this.game) {
					return;
				}

				//Go to the next position and update board
				var changes = this.game.next(i);
				this.updateBoard.call(this, changes);
			},

			/**
			 * Go back to the previous position
			 */
			previous: function() {

				//Frozen or no game?
				if (this.frozen || !this.game) {
					return;
				}

				//Go to the previous position and update board
				var changes = this.game.previous();
				this.updateBoard.call(this, changes);
			},

			/**
			 * Go to the last position
			 */
			last: function() {

				//Frozen or no game?
				if (this.frozen || !this.game) {
					return;
				}

				//Go to last position and update board
				var changes = this.game.last();
				this.updateBoard.call(this, changes);
			},

			/**
			 * Go to the first position
			 */
			first: function() {

				//Frozen or no game?
				if (this.frozen || !this.game) {
					return;
				}

				//Go to first position and update board
				var changes = this.game.first();
				this.updateBoard.call(this, changes);
			},

			/**
			 * Go to a specific move/path
			 */
			goto: function(path) {

				//Frozen or no game?
				if (this.frozen || !this.game) {
					return;
				}

				//Go to specified path and update board
				var changes = this.game.goto(path);
				this.updateBoard.call(this, changes);
			},

			/**
			 * Update the board with given changes
			 */
			updateBoard: function(changes) {

				//Remove existing markup from the board
				this.board.removeAllObjects('markup');

				//Get current node
				var i, node = this.game.getNode();

				//Changes to the board's position
				if (changes) {

					//Stones to remove (no need for a class, as just the position is relevant)
					for (var r in changes.remove) {
						this.board.removeObject(changes.remove[r], 'stones');
					}

					//Stone to add
					for (var a in changes.add) {
						this.board.addObject(new Stone(changes.add[a]));
					}
				}

				//Move made?
				if (node.move) {

					//Passed?
					if (node.move.pass) {
						this.broadcast('notification', 'pass');
					}

					//Mark last move?
					else if (this.config.markLastMove) {
						this.board.addObject(new Markup({
							type: this.config.lastMoveMarker,
							x: node.move.x,
							y: node.move.y
						}));
					}
				}

				//Add any other markup
				if (node.markup) {
					for (i in node.markup) {
						this.board.addObject(new Markup(node.markup[i]));
					}
				}

				//Broadcast event
				this.broadcast('update');
			},

			/***********************************************************************************************
			 * Player control
			 ***/

			/**
			 * Freeze player
			 */
			freeze: function() {
				this.frozen = true;
				this.broadcast('freeze');
			},

			/**
			 * Unfreeze player
			 */
			unFreeze: function() {
				this.frozen = false;
				this.broadcast('unfreeze');
			},

			/**
			 * Switch player mode
			 */
			switchMode: function(mode) {

				//Validate input
				mode = mode || this.mode;

				//No change or mode not available?
				if (this.mode == mode || !this.modes[mode]) {
					return false;
				}

				//Broadcast mode exit
				this.broadcast('modeExit', this.mode);

				//Set mode, reset tools and active tool
				this.mode = mode;
				this.tools = [];
				this.tool = PlayerTools.NONE;

				//Broadcast mode entry
				this.broadcast('modeEnter', this.mode);
				return true;
			},

			/**
			 * Switch player tool
			 */
			switchTool: function(tool) {

				//Check input
				tool = tool || PlayerTools.NONE;

				//No change or invaid tool?
				if (this.tool == tool || this.tools.indexOf(tool) === -1) {
					return false;
				}

				//Change tool
				this.tool = tool;
				this.broadcast('toolSwitch', this.tool);
			},

			/**
			 * Toggle board coordinates wrapper
			 */
			toggleCoordinates: function(show) {
				this.board.toggleCoordinates(show);
			},

			/***********************************************************************************************
			 * Configuration
			 ***/

			/**
			 * Set arrow keys navigation
			 */
			setArrowKeysNavigation: function(arrowKeys) {
				this.config.arrowKeysNavigation = (arrowKeys === true || arrowKeys === 'true');
			},

			/**
			 * Set scroll wheel navigation
			 */
			setScrollWheelNavigation: function(scrollWheel) {
				this.config.scrollWheelNavigation = (scrollWheel === true || scrollWheel === 'true');
			},

			/**
			 * Set the last move marker
			 */
			setLastMoveMarker: function(lastMoveMarker) {
				this.config.lastMoveMarker = lastMoveMarker;
			},

			/**
			 * Set whether to mark the last move
			 */
			setMarkLastMove: function(markLastMove) {
				this.config.markLastMove = (markLastMove === true || markLastMove === 'true');
			},

			/***********************************************************************************************
			 * Event handling
			 ***/

			/**
			 * Returns the necessary events that the element needs to listen to
			 */
			getElementEvents: function() {
				return this.config.elementEvents;
			},

			/**
			 * Event listener
			 */
			on: function(type, listener, mode) {

				//Get self
				var self = this;

				//Create listener
				$rootScope.$on('ngGo.player.' + type, function() {

					//Filter on mode
					if (mode) {
						if ((typeof mode == 'string' && mode != self.mode) || mode.indexOf(self.mode) === -1) {
							return;
						}
					}

					//Append grid coordinates for mouse events
					if (type == 'click' || type.substr(0, 5) == 'mouse') {
						appendGridCoordinates.call(self, arguments[0], arguments[1]);
					}

					//Call listener
					listener.apply(self, arguments);
				});
			},

			/**
			 * Event broadcaster
			 */
			broadcast: function(type, args) {

				//Make sure we are in a digest cycle
				if (!$rootScope.$$phase) {
					$rootScope.$apply(function() {
						$rootScope.$broadcast('ngGo.player.' + type, args);
					});
				}
				else {
					$rootScope.$broadcast('ngGo.player.' + type, args);
				}
			}
		};

		//Return object
		return Player;
	};
});