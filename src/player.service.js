
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
.provider('Player', function(PlayerModes, PlayerTools, MarkupTypes) {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Default mode/tool
		mode: PlayerModes.REPLAY,
		tool: PlayerTools.MOVE,

		//Keys/scrollwheel navigation
		arrow_keys_navigation: true,
		scroll_wheel_navigation: true,

		//Last move marker, leave empty for none
		last_move_marker: MarkupTypes.LAST,

		//Indicate variations with markup on the board, and show
		//successor node variations or current node variations
		variation_markup: true,
		variation_children: true,
		variation_siblings: false,

		//Show solution paths
		solution_paths: false
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
	this.$get = function($rootScope, $document, Game, GameScorer, Board, PlayerTools) {

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

			//Available modes and tools
			modes: {},
			tools: [],

			//Player mode and active tool
			mode: '',
			tool: '',

			//Current path
			path: null,

			/**
			 * Initialization
			 */
			init: function() {

				//Unlink board instance, create new game
				this.board = null;
				this.game = new Game();

				//Reset path
				this.path = null;

				//Player mode and active tool
				this.mode = '';
				this.tool = '';

				//Arrow keys / scroll wheel navigation
				this.arrowKeysNavigation = false;
				this.scrollWheelNavigation = false;

				//Last move marker
				this.lastMoveMarker = '';

				//Variation markup
				this.variationMarkup = false;
				this.variationChildren = false;
				this.variationSiblings = false;

				//Solution paths
				this.solutionPaths = false;

				//Parse config
				this.parseConfig({});
			},

			/**
			 * Link the player to a HTML element
			 */
			linkElement: function(element) {

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

			/*******************************************************************************************************************************
			 * Configuration
			 ***/

			/**
			 * Parse config instructions
			 */
			parseConfig: function(config) {

				//Validate
				if (typeof config != 'object') {
					return;
				}

				//Extend from default config
				this.config = angular.extend({}, defaultConfig, config);

				//Process settings
				this.switchMode(this.config.mode);
				this.switchTool(this.config.tool);
				this.toggleSolutionPaths(this.config.solution_paths);
				this.setArrowKeysNavigation(this.config.arrow_keys_navigation);
				this.setScrollWheelNavigation(this.config.scroll_wheel_navigation);
				this.setLastMoveMarker(this.config.last_move_marker);
				this.setVariationMarkup(
					this.config.variation_markup,
					this.config.variation_children,
					this.config.variation_siblings
				);

				//Let the modes parse their config
				for (var mode in this.modes) {
					if (this.modes[mode].parseConfig) {
						this.modes[mode].parseConfig.call(this);
					}
				}
			},

			/**
			 * Set arrow keys navigation
			 */
			setArrowKeysNavigation: function(arrowKeys) {
				if (arrowKeys != this.arrowKeysNavigation) {
					this.arrowKeysNavigation = arrowKeys;
					this.broadcast('settingChange', 'arrowKeysNavigation');
				}
			},

			/**
			 * Set scroll wheel navigation
			 */
			setScrollWheelNavigation: function(scrollWheel) {
				if (scrollWheel != this.scrollWheelNavigation) {
					this.scrollWheelNavigation = scrollWheel;
					this.broadcast('settingChange', 'scrollWheelNavigation');
				}
			},

			/**
			 * Set the last move marker
			 */
			setLastMoveMarker: function(lastMoveMarker) {
				if (lastMoveMarker != this.lastMoveMarker) {
					this.lastMoveMarker = lastMoveMarker;
					this.broadcast('settingChange', 'lastMoveMarker');
				}
			},

			/**
			 * Set variation markup on the board
			 */
			setVariationMarkup: function(variationMarkup, variationChildren, variationSiblings) {

				//One change event for these three settings
				var change = false;

				//Markup setting change?
				if (variationMarkup != this.variationMarkup) {
					this.variationMarkup = variationMarkup;
					change = true;
				}

				//Children setting change?
				if (typeof variationChildren != 'undefined' && variationChildren != this.variationChildren) {
					this.variationChildren = variationChildren;
					change = true;
				}

				//Siblings setting change?
				if (typeof variationSiblings != 'undefined' && variationSiblings != this.variationSiblings) {
					this.variationSiblings = variationSiblings;
					change = true;
				}

				//Did anything change?
				if (change) {
					this.broadcast('settingChange', 'variationMarkup');
				}
			},

			/**
			 * Show/hide the solution paths
			 */
			toggleSolutionPaths: function(solutionPaths) {

				//Toggle if not given
				if (typeof solutionPaths == 'undefined') {
					solutionPaths = !this.solutionPaths;
				}

				//Change?
				if (solutionPaths != this.solutionPaths) {
					this.solutionPaths = solutionPaths;
					this.broadcast('settingChange', 'solutionPaths');
				}
			},

			/*******************************************************************************************************************************
			 * Mode and tool handling
			 ***/

			/**
			 * Register a player mode
			 */
			registerMode: function(mode, PlayerMode) {

				//Register the mode and let it parse the configuration
				this.modes[mode] = PlayerMode;

				//Parse config if we have a handler
				if (this.modes[mode].parseConfig) {
					this.modes[mode].parseConfig.call(this);
				}

				//Force switch the mode now, if it matches the initial mode
				if (this.mode == mode) {
					this.switchMode(this.mode, true);
					this.switchTool(this.tool, true);
				}
			},

			/**
			 * Set available tools
			 */
			setTools: function(tools) {
				this.tools = tools || [PlayerTools.NONE];
			},

			/**
			 * Check if we have a player mode
			 */
			hasMode: function(mode) {
				return this.modes[mode] ? true : false;
			},

			/**
			 * Check if we have a player tool
			 */
			hasTool: function(tool) {
				return (this.tools.indexOf(tool) != -1);
			},

			/**
			 * Switch player mode
			 */
			switchMode: function(mode, force) {

				//No change?
				if (!force && (!mode || this.mode == mode)) {
					return false;
				}

				//Broadcast mode exit
				if (this.mode) {
					this.broadcast('modeExit', this.mode);
				}

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
			switchTool: function(tool, force) {

				//No change?
				if (!force && (!tool || this.tool == tool)) {
					return false;
				}

				//Validate tool switch (only when there is a mode)
				if (this.mode && this.modes[this.mode] && this.tools.indexOf(tool) === -1) {
					return false;
				}

				//Change tool
				this.tool = tool;
				this.broadcast('toolSwitch', this.tool);
				return true;
			},

			/***********************************************************************************************
			 * Game record handling
			 ***/

			/**
			 * Load game record
			 */
			load: function(data, allowPlayerConfig) {

				//Try to load the game record data
				if (!this.game.load(data)) {
					return false;
				}

				//Reset path
				this.path = null;

				//Parse configuration from JGF if allowed
				if (allowPlayerConfig || typeof allowPlayerConfig == 'undefined') {
					this.parseConfig(this.game.get('player'));
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

			/*******************************************************************************************************************************
			 * Game handling
			 ***/

			/**
			 * Start a new game
			 */
			newGame: function() {
				this.game = new Game();
				this.updateBoard();
			},

			/**
			 * Score the current game position
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
				this.broadcast('scoreCalculated', score);
			},

			/*******************************************************************************************************************************
			 * Board handling
			 ***/

			/**
			 * Get the board
			 */
			getBoard: function() {
				return this.board;
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
						this.broadcast('movePassed', node);
					}

					//Mark last move?
					else if (this.lastMoveMarker) {
						this.board.add('markup', node.move.x, node.move.y, this.lastMoveMarker);
					}
				}

				//Broadcast event
				this.broadcast('boardUpdate', node);
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
			on: function(type, listener, mode, $scope) {

				//Must have valid listener
				if (typeof listener != 'function') {
					return;
				}

				//Scope given as 3rd parameter?
				if (mode && mode.$parent) {
					$scope = mode;
					mode = '';
				}

				//Get self and determine scope to use
				var self = this,
					scope = $scope || $rootScope;

				//Create listener and return de-registration function
				return scope.$on('ngGo.player.' + type, function() {

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

		//Initialize
		Player.init();

		//Return object
		return Player;
	};
});