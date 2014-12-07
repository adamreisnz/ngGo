
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
	'ngGo',
	'ngGo.Player.Directive',
	'ngGo.Player.Mode.Common.Service',
	'ngGo.Board.Service',
	'ngGo.Game.Service',
	'ngGo.Game.Scorer.Service'
])

/**
 * Provider definition
 */
.provider('Player', function(PlayerModes, PlayerTools) {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Starting mode/tool
		defaultMode: PlayerModes.REPLAY,
		defaultTool: PlayerTools.MOVE,

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

		//Replay mode auto play interval
		autoPlayDelay: 1000,

		//Solve mode settings
		solveAutoPlay: true,
		solveAutoPlayDelay: 500
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
	this.$get = function($rootScope, $document, $interval, Game, GameScorer, Board, PlayerTools) {

		/**
		 * Helper to append board grid coordinatess to the broadcast event object
		 */
		var processMouseEvent = function(broadcastEvent, mouseEvent) {

			//Can only do this with a board and mouse event
			if (!this.board || !mouseEvent) {
				broadcastEvent.x = -1;
				broadcastEvent.y = -1;
				return;
			}

			//Init
			var x = 0, y = 0;

			//Set x
			if (typeof mouseEvent.offsetX != 'undefined') {
				x = mouseEvent.offsetX;
			}
			else if (mouseEvent.originalEvent && typeof mouseEvent.originalEvent.offsetX != 'undefined') {
				x = mouseEvent.originalEvent.offsetX;
			}
			else if (mouseEvent.originalEvent && typeof mouseEvent.originalEvent.layerX != 'undefined') {
				x = mouseEvent.originalEvent.layerX;
			}

			//Set y
			if (typeof mouseEvent.offsetY != 'undefined') {
				y = mouseEvent.offsetY;
			}
			else if (mouseEvent.originalEvent && typeof mouseEvent.originalEvent.offsetY != 'undefined') {
				y = mouseEvent.originalEvent.offsetY;
			}
			else if (mouseEvent.originalEvent && typeof mouseEvent.originalEvent.layerY != 'undefined') {
				y = mouseEvent.originalEvent.layerY;
			}

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
			config: {},

			//Board and game instances
			board: null,
			game: null,

			//Path
			path: null,

			//Player mode and active tool
			mode: '',
			tool: '',

			//Available modes and tools
			modes: {},
			tools: [],

			/**
			 * Initialization
			 */
			init: function() {

				//Player configuration
				this.config = angular.copy(defaultConfig);

				//Unlink board instance, create new game
				this.board = null;
				this.game = new Game();

				//Reset path
				this.path = null;

				//Player mode and active tool
				this.mode = '';
				this.tool = '';
			},

			/**
			 * Load game record
			 */
			load: function(data) {

				//Try to load the game record data
				if (!this.game.load(data)) {
					return false;
				}

				//Process display instructions
				if (this.config.allowDisplayInstructions) {
					this.displayInstructions(this.game.get('display'));
				}

				//Dispatch game loaded event
				this.broadcast('gameLoaded', this.game);

				//Board present?
				if (this.board) {
					this.board.removeAll();
					this.board.parseConfig(this.game.get('board'));
					this.updateBoard();
				}

				//Loaded ok
				return true;
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

			/**
			 * Set the element
			 */
			setElement: function(element) {

				//Set element
				this.element = element;

				//Register document event
				this.registerElementEvent('keydown', $document);

				//Register element events
				this.registerElementEvent('click');
				this.registerElementEvent('mousedown');
				this.registerElementEvent('mouseup');
				this.registerElementEvent('mousemove');
				this.registerElementEvent('mouseout');
				this.registerElementEvent('mousewheel');
			},

			/**
			 * Set the board
			 */
			setBoard: function(Board) {

				//Set the board
				this.board = Board;

				//Board ready
				if (this.board) {
					this.broadcast('boardReady', this.board);
				}

				//If a game has been loaded already, parse config and update the board
				if (this.game && this.game.isLoaded()) {
					this.board.removeAll();
					this.board.parseConfig(this.game.get('board'));
					this.updateBoard();
				}
			},

			/**
			 * Update the board
			 */
			updateBoard: function() {

				//Premature call?
				if (!this.board || !this.game || !this.game.isLoaded()) {
					return;
				}

				//Get current node and game position
				var i,
					node = this.game.getNode(),
					path = this.game.getPath(),
					position = this.game.getPosition();

				//Path change? That means a whole new board position
				if (!path.compare(this.path)) {

					//Copy new path and remove all markup
					this.path = path.clone();
					this.board.removeAll('markup');

					//Broadcast
					this.broadcast('pathChange', node);

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
				this.broadcast('update', node);
			},

			/**
			 * Register a player mode
			 */
			registerMode: function(mode, handler) {

				//Register the mode
				this.modes[mode] = handler;

				//Switch to the mode now, if not in a mode yet and if it matches the default mode
				if (!this.mode && mode == this.config.defaultMode) {
					this.switchMode(this.config.defaultMode);
					this.switchTool(this.config.defaultTool);
				}
			},

			/**
			 * Check if we have a player mode
			 */
			hasMode: function(mode) {
				return this.modes[mode] ? true : false;
			},

			/***********************************************************************************************
			 * Game record navigation
			 ***/

			/**
			 * Go to the next position
			 */
			next: function(i) {
				if (this.game) {
					this.game.next(i);
					this.updateBoard();
				}
			},

			/**
			 * Go back to the previous position
			 */
			previous: function() {
				if (this.game) {
					this.game.previous();
					this.updateBoard();
				}
			},

			/**
			 * Go to the last position
			 */
			last: function() {
				if (this.game) {
					this.game.last();
					this.updateBoard();
				}
			},

			/**
			 * Go to the first position
			 */
			first: function() {
				if (this.game) {
					this.game.first();
					this.updateBoard();
				}
			},

			/**
			 * Go to a specific move number, tree path or named node
			 */
			goto: function(target) {
				if (this.game && target) {
					this.game.goto(target);
					this.updateBoard();
				}
			},

			/**
			 * Start auto play with a given delay
			 */
			start: function(delay) {

				//No game or no move children?
				if (!this.game || !this.game.node.hasChildren()) {
					return;
				}

				//Get self
				var self = this;

				//Determine delay
				delay = (typeof delay == 'number') ? delay*1000 : this.config.autoPlayDelay;

				//Create interval
				this.autoPlayPromise = $interval(function() {

					//Advance to the next node
					self.next();

					//Ran out of children?
					if (!self.game.node.hasChildren()) {
						self.stop();
					}
				}, delay);
			},

			/**
			 * Cancel auto play
			 */
			stop: function() {
				if (this.autoPlayPromise) {
					$interval.cancel(this.autoPlayPromise);
					this.autoPlayPromise = null;
				}
			},

			/***********************************************************************************************
			 * Player control
			 ***/

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
			 * Start a new game
			 */
			newGame: function() {
				this.game = new Game();
				this.updateBoard();
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
			 * Register an element event
			 */
			registerElementEvent: function(event, element) {

				//Which element to use
				if (typeof element == 'undefined' || !element.on) {
					element = this.element;
				}

				//Remove any existing event listener and apply new one
				//TODO: namespacing doesn't work with Angular's jqLite
				element.off(event/* + '.ngGo.player'*/);
				element.on(event/* + '.ngGo.player'*/, this.broadcast.bind(this, event));
			},

			/**
			 * Event listener
			 */
			on: function(type, listener, mode) {

				//Must have valid listener
				if (typeof listener != 'function') {
					return;
				}

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