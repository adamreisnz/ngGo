
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
	'ngGo.Player.Mode.Replay.Service',
	'ngGo.Player.Mode.Edit.Service',
	'ngGo.Player.Mode.Solve.Service',
	'ngGo.Board.Service',
	'ngGo.Kifu.Service',
	'ngGo.Kifu.Reader.Service',
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
	NONE:		'',
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
 * Run block
 */
.run(function(Player, PlayerModes, PlayerModeCommon, PlayerModeReplay, PlayerModeEdit, PlayerModeSolve) {

	/**
	 * Common event listeners
	 */
	Player.listen('keydown', PlayerModeCommon.keyDown);
	Player.listen('mousewheel', PlayerModeCommon.mouseWheel);

	/**
	 * Replay mode
	 */
	Player.listen('modeEnter', PlayerModeReplay.modeEnter, PlayerModes.REPLAY);
	Player.listen('click', PlayerModeReplay.mouseClick, PlayerModes.REPLAY);
	Player.listen('mousemove', PlayerModeReplay.mouseMove, PlayerModes.REPLAY);

	/**
	 * Edit mode
	 */
	Player.listen('modeEnter', PlayerModeEdit.modeEnter, PlayerModes.EDIT);
	Player.listen('toolSwitch', PlayerModeEdit.toolSwitch, PlayerModes.EDIT);
	Player.listen('keydown', PlayerModeEdit.keyDown, PlayerModes.EDIT);
	Player.listen('click', PlayerModeEdit.mouseClick, PlayerModes.EDIT);
	Player.listen('mousemove', PlayerModeEdit.mouseMove, PlayerModes.EDIT);
	Player.listen('mouseout', PlayerModeEdit.mouseOut, PlayerModes.EDIT);

	/**
	 * Solve mode
	 */
	Player.listen('modeEnter', PlayerModeSolve.modeEnter, PlayerModes.SOLVE);
	Player.listen('modeExit', PlayerModeSolve.modeExit, PlayerModes.SOLVE);
	Player.listen('click', PlayerModeSolve.mouseClick, PlayerModes.SOLVE);
	Player.listen('mousemove', PlayerModeSolve.mouseMove, PlayerModes.SOLVE);
})

/**
 * Provider definition
 */
.provider('Player', function(PlayerModes) {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Starting mode and available modes
		startingMode: PlayerModes.REPLAY,
		availableModes: [PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE],

		//Keys/scrollwheel navigation
		arrowKeysNavigation: true,
		scrollWheelNavigation: true,

		//Disable window scrolling when scrolling player
		lockScroll: true,

		//Last move marking
		markLastMove: true,
		lastMoveMarker: 'last',

		//Allow the display instructions from the Kifu to overwrite standard settings
		kifuDisplayInstructions: true,

		//Indicate variations with markup on the board or not
		variationBoardMarkup: true,

		//Show variations of successor nodes
		variationChildren: true,

		//Show variations of current node
		variationSiblings: false
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
	this.$get = function($rootScope, Kifu, KifuReader, GameScorer, Board, PlayerModes, PlayerTools, Stone, Markup) {

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
			var x, y;

			//Determine x
			x = mouseEvent.offsetX || mouseEvent.originalEvent.offsetX || mouseEvent.originalEvent.layerX;
			x *= (window.devicePixelRatio || 1);
			x -= this.board.left;
			x /= this.board.cellWidth;
			x = Math.round(x);

			//Determine y
			y = mouseEvent.offsetY || mouseEvent.originalEvent.offsetY || mouseEvent.originalEvent.layerY;
			y *= (window.devicePixelRatio || 1);
			y -= this.board.top;
			y /= this.board.cellHeight;
			y = Math.round(y);

			//Append coords
			broadcastEvent.x = x >= this.board.width ? -1 : x;
			broadcastEvent.y = y >= this.board.height ? -1 : y;
		};

		/**
		 * Helper to remove move variations from the board
		 */
		var removeMoveVariations = function(nodes) {
			for (var i = 0; i < nodes.length; i++) {
				this.board.removeObject({
					x: nodes[i].move.x,
					y: nodes[i].move.y
				}, 'markup');
			}
		};

		/**
		 * Helper to add move variations to the board
		 */
		var addMoveVariations = function(nodes) {
			for (var i = 0; i < nodes.length; i++) {

				//Auto variation markup should never overwrite existing markup
				if (this.board.hasObjectAt(nodes[i].move.x, nodes[i].move.y, 'markup')) {
					continue;
				}

				//Add to board
				this.board.addObject(new Markup({
					type: 'label',
					text: String.fromCharCode(65+i),
					color: this.board.theme.get('markupVariationColor'),
					x: nodes[i].move.x,
					y: nodes[i].move.y
				}));
			}
		};

		/**
		 * Helper to add or remove the appropriate move variations
		 */
		var toggleMoveVariations = function() {

			//Get the current node
			var node = KifuReader.getNode(), variations;

			//Child variations?
			if (this.config.variationChildren && node.hasMoveVariations()) {
				variations = node.getMoveVariations();
				if (this.config.variationBoardMarkup) {
					addMoveVariations.call(this, variations);
				}
				else {
					removeMoveVariations.call(this, variations);
				}
			}

			//Sibling variations?
			if (this.config.variationSiblings && node.parent && node.parent.hasMoveVariations()) {
				variations = node.parent.getMoveVariations();
				if (this.config.variationBoardMarkup) {
					addMoveVariations.call(this, variations);
				}
				else {
					removeMoveVariations.call(this, variations);
				}
			}
		};

		/**
		 * Handler for updating the board
		 */
		var updateBoard = function() {

			//Remove existing markup from the board
			this.board.removeAllObjects('markup');

			//Get changes to the board's position
			var i, node = KifuReader.getNode(),
				changes = KifuReader.getChanges();

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

			//Add variation letters
			if (node.children.length > 1 && this.config.variationBoardMarkup) {
				for (i = 0; i < node.children.length; i++) {
					if (node.children[i].move && !node.children[i].move.pass) {

					}
				}
			}

			//Add any other markup
			if (node.markup) {
				for (i in node.markup) {
					this.board.addObject(new Markup(node.markup[i]));
				}
			}

			//Toggle move variations
			toggleMoveVariations.call(this);
		};

		/**
		 * Player class
		 */
		var Player = {

			//Player configuration
			config: angular.copy(defaultConfig),

			//Board and kifu containers
			board: null,
			kifu: null,

			//Player mode and active tool
			mode: PlayerModes.REPLAY,
			tool: PlayerTools.MOVE,

			//Frozen state
			frozen: false,

		 	/**
		 	 * Load a kifu game record and prepare the kifu reader
		 	 */
			loadKifu: function(kifu, path) {

				//Remember kifu and load in kifu reader
				this.kifu = kifu;
				KifuReader.load(kifu);

				//Process display instructions
				if (kifu.display && !this.config.kifuDisplayInstructions) {
					this.processDisplayInstructions(kifu.display);
				}

				//Dispatch kifu loaded event
				this.broadcast('kifuLoaded', this.kifu);

				//Set board size
				this.board.setSize(this.kifu.board.width, this.kifu.board.height);
				this.board.removeAllObjects();

				//Update board and broadcast update event
				updateBoard.call(this);
				this.broadcast('update', 'kifu');

				//Path given?
				if (path) {
					this.goTo(path);
				}
			},

			/**
			 * Load game from SGF
			 */
			loadSgf: function(sgf, path) {
				this.loadKifu(Kifu.fromSgf(sgf), path);
			},

			/**
			 * Load game from JGF
			 */
			loadJgf: function(jgf, path) {
				this.loadKifu(Kifu.fromJgf(jgf), path);
			},

			/**
			 * Get the game kifu
			 */
			getKifu: function() {
				return this.kifu;
			},

			/**
			 * Process display instructions (can be given in Kifu)
			 */
			processDisplayInstructions: function(display) {

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
			 * Control methods
			 ***/

			/**
			 * Play next move
			 */
			next: function(i) {

				//Frozen or no kifu?
				if (this.frozen || !this.kifu) {
					return;
				}

				//Go to the next move
				KifuReader.next(i);

				//Update board and broadcast update event
				updateBoard.call(this);
				this.broadcast('update', 'next');
			},

			/**
			 * Go back to the previous position
			 */
			previous: function() {

				//Frozen or no kifu?
				if (this.frozen || !this.kifu) {
					return;
				}

				//Go to the previous position
				KifuReader.previous();

				//Update board and broadcast update event
				updateBoard.call(this);
				this.broadcast('update', 'prev');
			},

			/**
			 * Go to the last position
			 */
			last: function() {

				//Frozen or no kifu?
				if (this.frozen || !this.kifu) {
					return;
				}

				//Go to last position
				KifuReader.last();

				//Update board and broadcast update event
				updateBoard.call(this);
				this.broadcast('update', 'last');
			},

			/**
			 * Go to the first position
			 */
			first: function() {

				//Frozen or no kifu?
				if (this.frozen || !this.kifu) {
					return;
				}

				//Go to first position
				KifuReader.first();

				//Update board and broadcast update event
				updateBoard.call(this);
				this.broadcast('update', 'first');
			},

			/**
			 * Go to a specific move
			 */
			goTo: function(move) {

				//Frozen or no kifu?
				if (this.frozen || !this.kifu) {
					return;
				}

				//Initialize path
				var path;

				//Function given? Call now
				if (typeof move == 'function') {
					move = move.call(this);
				}

				//Simple move number? Convert to path
				if (typeof move == 'number') {
					path = angular.copy(KifuReader.getPath());
					path.m = move || 0;
				}
				else {
					path = move;
				}

				//Go to specified path
				KifuReader.goTo(path);

				//Update board and broadcast update event
				updateBoard.call(this);
				this.broadcast('update', 'goto');
			},

			/**
			 * Freeze player
			 */
			freeze: function() {
				this.frozen = true;
				this.broadcast('frozen');
			},

			/**
			 * Unfreeze player
			 */
			unFreeze: function() {
				this.frozen = false;
				this.broadcast('unfrozen');
			},

			/**
			 * Switch player mode
			 */
			switchMode: function(mode) {

				//Validate input
				mode = mode || PlayerModes.REPLAY;

				//Check if mode is available
				if (this.config.availableModes && this.config.availableModes.indexOf(mode) === -1) {
					return false;
				}

				//Set and broadcast
				this.broadcast('modeExit', this.mode);
				this.mode = mode;
				this.broadcast('modeEnter', this.mode);
				return true;
			},

			/**
			 * Switch player tool
			 */
			switchTool: function(tool) {
				this.tool = tool || PlayerTools.NONE;
				this.broadcast('toolSwitch', this.tool);
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

			/**
			 * Set whether to mark variations on the board
			 */
			setVariationBoardMarkup: function(mark) {
				this.config.variationBoardMarkup = (mark === true || mark === 'true');
				toggleMoveVariations.call(this);
			},

			/***********************************************************************************************
			 * Event handling
			 ***/

			/**
			 * Returns the necessary events that the element needs to listen to
			 */
			getElementEvents: function() {
				return ['keydown', 'click', 'mousemove', 'mouseout', 'mousewheel'];
			},

			/**
			 * Event listener
			 */
			listen: function(type, listener, mode) {

				//Get self
				var self = this;

				//Create listener
				$rootScope.$on('ngGo.player.' + type, function() {

					//Filter on mode
					if (mode && mode != self.mode) {
						return;
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
				$rootScope.$broadcast('ngGo.player.' + type, args);
			}
		};

		//Return object
		return Player;
	};
});