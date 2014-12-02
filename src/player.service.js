
/**
 * Player :: This class brings the board to life and allows a user to interact with it. It
 * handles user input, controls objects going to the board, can load game records, and allows the
 * user to manipulate the board according to the current player mode.
 * Unless you want to display static positions, this is the class you'd use by default.
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
		variationMarkup: true,

		//Show variations of successor nodes
		variationChildren: true,

		//Show variations of current node
		variationSiblings: false,

		//Show solution paths
		solutionPaths: false,

		//Solve mode auto play settings
		solveAutoPlay: true,
		solveAutoPlayTimeout: 500,

		//Event listeners to apply on the player HTML element
		elementEvents: ['keydown', 'click', 'mousedown', 'mouseup', 'mousemove', 'mouseout', 'mousewheel']
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
	this.$get = function($rootScope, Game, GameScorer, Board, PlayerModes, PlayerTools) {

		/**
		 * Helper to append board grid coordinatess to the broadcast event object
		 */
		var processMouseEvent = function(broadcastEvent, mouseEvent) {

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

			//Did we drag?
			if (mouseEvent.drag) {
				broadcastEvent.drag = mouseEvent.drag;
			}
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

			//Remembered current path
			path: null,

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
				this.board.removeAll();
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
				if (typeof display.variation_markup != 'undefined') {
					this.variationMarkup = display.variation_markup;
				}

				//Show variations of successor nodes?
				if (typeof display.variation_children != 'undefined') {
					this.variationChildren = display.variation_children;
				}

				//Show variations of current node?
				if (typeof display.variation_siblings != 'undefined') {
					this.variationSiblings = display.variation_siblings;
				}

				//Show solution paths?
				if (typeof display.solution_paths != 'undefined') {
					this.solutionPaths = display.solution_paths;
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
				this.game.next(i);
				this.updateBoard();
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
				this.game.previous();
				this.updateBoard();
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
				this.game.last();
				this.updateBoard();
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
				this.game.first();
				this.updateBoard();
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
				this.game.goto(path);
				this.updateBoard();
			},

			/**
			 * Update the board
			 */
			updateBoard: function() {

				//Get current node and game position
				var i, pathChange = false,
					node = this.game.getNode(),
					path = this.game.getPath(),
					position = this.game.getPosition();

				//Path change? That means a whole new board position
				if (!angular.equals(this.path, path)) {
					pathChange = true;

					//Copy new path and remove all markup
					this.path = angular.copy(path);
					this.board.removeAll('markup');

					//Mode change instruction?
					if (node.mode) {
						this.switchMode(node.mode);
					}
				}

				//Set new stones and markup grids
				this.board.setAll('stones', position.stones);
				this.board.setAll('markup', position.markup);

				//Move made?
				if (node.move) {

					//Passed?
					if (node.move.pass) {
						this.broadcast('notification', 'pass');
					}

					//Mark last move?
					else if (this.config.markLastMove) {
						this.board.add('markup', node.move.x, node.move.y, this.config.lastMoveMarker);
					}
				}

				//Broadcast event
				this.broadcast('update', pathChange);
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
			 * Helper to score the current game position
			 */
			scoreGame: function() {

				//Calculate score
				GameScorer.calculate();

				//Get score, points and captures
				var score = GameScorer.getScore(),
					points = GameScorer.getPoints(),
					captures = GameScorer.getCaptures();

				//Remove all markup, and set captures and points
				this.board.layers.markup.removeAll();
				this.board.layers.score.setAll(points, captures);

				//Broadcast score
				this.broadcast('score', score);
			},

			/***********************************************************************************************
			 * Configuration
			 ***/

			/**
			 * Show/hide the solution paths
			 */
			toggleSolutionPaths: function(solutionPaths) {

				//Set or toggle
				if (typeof solutionPaths != 'undefined') {
					this.config.solutionPaths = solutionPaths;
				}
				else {
					this.config.solutionPaths = !this.config.solutionPaths;
				}

				//Broadcast event
				this.broadcast('config', 'solutionPaths');
			},

			/**
			 * Toggle variation markup on the board
			 */
			toggleVariationMarkup: function(variationMarkup) {

				//Set or toggle
				if (typeof variationMarkup != 'undefined') {
					this.config.variationMarkup = variationMarkup;
				}
				else {
					this.config.variationMarkup = !this.config.variationMarkup;
				}

				//Broadcast event
				this.broadcast('config', 'variationMarkup');
			},

			/**
			 * Set arrow keys navigation
			 */
			toggleArrowKeysNavigation: function(arrowKeys) {

				//Set or toggle
				if (typeof arrowKeys != 'undefined') {
					this.config.arrowKeysNavigation = arrowKeys;
				}
				else {
					this.config.arrowKeysNavigation = !this.config.arrowKeysNavigation;
				}

				//Broadcast event
				this.broadcast('config', 'arrowKeysNavigation');
			},

			/**
			 * Set scroll wheel navigation
			 */
			toggleScrollWheelNavigation: function(scrollWheel) {

				//Set or toggle
				if (typeof scrollWheel != 'undefined') {
					this.config.scrollWheelNavigation = scrollWheel;
				}
				else {
					this.config.scrollWheelNavigation = !this.config.scrollWheelNavigation;
				}

				//Broadcast event
				this.broadcast('config', 'scrollWheelNavigation');
			},

			/**
			 * Set whether to mark the last move
			 */
			toggleMarkLastMove: function(markLastMove) {

				//Set or toggle
				if (typeof markLastMove != 'undefined') {
					this.config.markLastMove = markLastMove;
				}
				else {
					this.config.markLastMove = !this.config.markLastMove;
				}

				//Broadcast event
				this.broadcast('config', 'markLastMove');
			},

			/**
			 * Set the last move marker
			 */
			setLastMoveMarker: function(lastMoveMarker) {
				this.config.lastMoveMarker = lastMoveMarker;
				this.broadcast('config', 'lastMoveMarker');
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
					if (type == 'click' || type == 'hover' || type.substr(0, 5) == 'mouse') {
						processMouseEvent.call(self, arguments[0], arguments[1]);
					}

					//Dragging? Prevent click events from firing
					if (self.preventClickEvent && type == 'click') {
						delete self.preventClickEvent;
						return;
					}
					else if (type == 'mousedrag') {
						self.preventClickEvent = true;
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