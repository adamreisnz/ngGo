
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
	'ngGo.Player.Events.Service',
	'ngGo.Player.EventHandlers.Service',
	'ngGo.Board.Service',
	'ngGo.Kifu.Service',
	'ngGo.Kifu.Reader.Service',
	'ngGo.Game.Scorer.Service'
])

/**
 * Provider definition
 */
.provider('Player', function(PlayerModes) {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Starting mode
		startingMode: PlayerModes.PLAY,

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
	this.$get = function(Kifu, KifuReader, GameScorer, Board, PlayerEvents, PlayerEventHandlers, PlayerModes, PlayerTools) {

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
			mode: PlayerModes.PLAY,
			tool: PlayerTools.MOVE,

			//Frozen state
			frozen: false,

		 	/**
		 	 * Prepare kifu for replaying and fire the kifuLoaded event
		 	 */
			loadKifu: function(kifu, path) {

				//Remember kifu and load in kifu reader
				this.kifu = kifu;
				KifuReader.load(kifu);

				//Dispatch kifu loaded and player update events
				PlayerEvents.kifuLoaded(this.kifu);
				PlayerEvents.update('kifu');

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
				PlayerEvents.update('next');
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
				PlayerEvents.update('prev');
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
				PlayerEvents.update('last');
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
				PlayerEvents.update('first');
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
				PlayerEvents.update('goTo');
			},

			/**
			 * Get information about the actual game from the kifu
			 */
			getGameInfo: function(formatted) {

				//No kifu?
				if (!this.kifu) {
					return null;
				}

				//Return
				return this.kifu.gameInfo(formatted);
			},

			/**
			 * Get root information from the kifu
			 */
			getRootInfo: function(formatted) {

				//No kifu?
				if (!this.kifu) {
					return null;
				}

				//Return
				return this.kifu.rootInfo(formatted);
			},

			/**
			 * Freeze player
			 */
			freeze: function() {
				this.frozen = true;
				$rootScope.$broadcast('ngGo.player.frozen');
			},

			/**
			 * Unfreeze player
			 */
			unFreeze: function() {
				this.frozen = false;
				$rootScope.$broadcast('ngGo.player.unfrozen');
			},

			/***********************************************************************************************
			 * Scoring
			 ***/

			/**
			 * Score the current board position
			 */
			scorePosition: function() {

				//Remember the current board state
				this.preScoreState = this.board.getState();

				//Feed the current game
				GameScorer.setGame(KifuReader.getGame());

				//Get changes and score
				var changes = GameScorer.getChanges(),
					score = GameScorer.getScore();
					console.log(score);

				//Remove all markup, and process changes
				this.board.removeAllObjects('markup');
				this.board.removeObject(changes.remove, 'stones');
				this.board.addObject(changes.add);
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
			 * Mode switching
			 ***/

			/**
			 * Switch player mode
			 */
			switchMode: function(mode) {

				//Remember
				this.mode = mode || PlayerModes.PLAY;

				//Set tools and other logic according to player mode
				switch (this.mode) {

					//Setup mode
					case PlayerModes.SETUP:
						this.tool = PlayerTools.BLACK;
						break;

					//Play mode
					case PlayerModes.PLAY:
						this.tool = PlayerTools.MOVE;
						break;

					//Score mode
					case PlayerModes.SCORE:
						this.tool = PlayerTools.SCORE;
						this.scorePosition();
						break;

					//Default
					default:
						this.mode = PlayerModes.PLAY;
						this.tool = PlayerTools.MOVE;
				}
			},

			/**
			 * Switch player tool
			 */
			switchTool: function(tool) {

				//Validate
				var validTools = [];
				switch (this.mode) {

					//Setup mode
					case PlayerModes.SETUP:
						validTools = [
							PlayerTools.MOVE, PlayerTools.BLACK, PlayerTools.WHITE,
							PlayerTools.CLEAR, PlayerTools.NONE
						];
						break;

					//Play mode
					case PlayerModes.PLAY:
						validTOols = [
							PlayerTools.MOVE, PlayerTools.NONE
						];
						break;

					//Markup mode
					case PlayerModes.MARKUP:
						validTools = [
							PlayerTools.TRIANGLE, PlayerTools.CIRCLE, PlayerTools.SQUARE,
							PlayerTools.MARK, PlayerTools.SELECT, PlayerTools.LETTER,
							PlayerTools.NUMBER, PlayerTools.HAPPY, PlayerTools.SAD,
							PlayerTools.NONE
						];
						break;

					//Score mode
					case PlayerModes.SCORE:
						validTools = [
							PlayerTools.SCORE, PlayerTools.NONE
						];
						break;

					//Default
					default:
						validTools = [
							PlayerTools.NONE
						];
				}

				//Valid tool selected?
				if (validTools.indexOf(tool) !== -1) {
					this.tool = tool;
				}

				//Otherwise use first valid tool
				else {
					this.tool = validTools[0];
				}
			}
		};

		/**
		 * Setup player event listeners
		 */
		PlayerEvents.listen('kifuLoaded', PlayerEventHandlers.kifuLoaded.bind(Player));
		PlayerEvents.listen('update', PlayerEventHandlers.playerUpdate.bind(Player));
		PlayerEvents.listen('keydown', PlayerEventHandlers.keyDown.bind(Player));
		PlayerEvents.listen('click', PlayerEventHandlers.mouseClick.bind(Player));
		PlayerEvents.listen('mousemove', PlayerEventHandlers.mouseMove.bind(Player));
		PlayerEvents.listen('mouseout', PlayerEventHandlers.mouseOut.bind(Player));
		PlayerEvents.listen('mousewheel', PlayerEventHandlers.mouseWheel.bind(Player));

		//Return object
		return Player;
	};
});