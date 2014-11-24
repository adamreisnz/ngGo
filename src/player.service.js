
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
	'ngGo.Player.Mode.Replay.Service',
	'ngGo.Player.Mode.Edit.Service',
	'ngGo.Board.Service',
	'ngGo.Kifu.Service',
	'ngGo.Kifu.Reader.Service',
	'ngGo.Game.Scorer.Service'
])

/**
 * Player modes constant
 */
.constant('PlayerModes', {
	REPLAY:	'replay',
	PLAY:	'play',
	EDIT:	'edit'
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
 * Provider definition
 */
.provider('Player', function(PlayerModes) {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Starting mode and available modes
		startingMode: PlayerModes.REPLAY,
		availableModes: [PlayerModes.REPLAY, PlayerModes.EDIT],

		//Keys/scrollwheel navigation
		arrowKeysNavigation: true,
		scrollWheelNavigation: true,

		//Disable window scrolling when scrolling player
		lockScroll: true,

		//Last move handling
		markLastMove: true,
		lastMoveMarker: 'last',

		//Variations handling
		markVariations: true
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
			broadcastEvent.x = x >= this.board.size ? -1 : x;
			broadcastEvent.y = y >= this.board.size ? -1 : y;
		};

		/**
		 * Handler for updating the board
		 */
		var updateBoard = function() {

			//Remove existing markup from the board
			if (this.existingMarkup) {
				this.board.removeObject(this.existingMarkup, 'markup');
			}

			//Reset existing markup array
			this.existingMarkup = [];

			//Get changes to the board's position
			var i,
				node = KifuReader.getNode(),
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
					this.existingMarkup.push(node.move);
					this.board.addObject(new Markup({
						type: this.config.lastMoveMarker,
						x: node.move.x,
						y: node.move.y
					}));
				}
			}

			//Add variation letters
			if (node.children.length > 1 && this.config.markVariations) {
				for (i = 0; i < node.children.length; i++) {
					if (node.children[i].move && !node.children[i].move.pass) {
						this.existingMarkup.push(node.children[i].move);
						this.board.addObject(new Markup({
							type: 'label',
							text: String.fromCharCode(65+i),
							color: this.board.theme.get('markupVariationColor'),
							x: node.children[i].move.x,
							y: node.children[i].move.y
						}));
					}
				}
			}

			//Add any other markup
			if (node.markup) {
				for (i in node.markup) {
					this.existingMarkup.push(node.markup[i]);
					this.board.addObject(new Markup(node.markup[i]));
				}
			}
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

				//Dispatch kifu loaded event
				this.broadcast('kifuLoaded', this.kifu);

				//Set board size
				this.board.setSize(this.kifu.size);
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
				this.mode = mode || PlayerModes.REPLAY;
				this.broadcast('modeSwitch', this.mode);
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
			 * Set whether to mark variations
			 */
			setMarkVariations: function(markVariations) {
				this.config.markVariations = (markVariations === true || markVariations === 'true');
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