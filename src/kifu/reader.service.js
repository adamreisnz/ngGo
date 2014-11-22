
/**
 * KifuReader :: This class traverses the nodes of a kifu and keeps track of the changes between
 * the previous and new game positions. These changes can then be fed to the board, to add or
 * remove stones. Note that the class only processes moves and setup stones, not markup.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Reader.Service', [
	'ngGo.Service',
	'ngGo.Game.Service',
	'ngGo.Game.Position.Service',
	'ngGo.Game.PositionChanges.Service',
	'ngGo.Errors.InvalidMoveError.Service'
])

/**
 * Provider definition
 */
.provider('KifuReader', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Remember last selected child of all nodes for traversing
		rememberPath: true
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
	this.$get = function(ngGo, StoneColor, Game, GamePosition, GamePositionChanges, InvalidMoveError) {

		/**
		 * Execute a node (change game object according to node info, return changes)
		 */
		var execNode = function(node, first) {

			//Remember last selected node if we have a parent
			if (node.parent) {
				node.parent._last_selected = node.parent.children.indexOf(node);
			}

			//Handle move nodes
			if (typeof node.move != 'undefined') {

				//Pass
				if (node.move.pass) {
					this.game.pass(node.move.color);
				}

				//Regular move
				else if (!this.game.play(node.move.x, node.move.y, node.move.color)) {
					throw new InvalidMoveError(this.game.getError(), node);
				}
			}

			//Handle setup nodes
			else {

				//Advance position, unless we're executing the first node
				if (!first) {
					this.game.pushPosition();
				}

				//Set turn
				if (node.turn) {
					this.game.setTurn(node.turn);
				}

				//Board setup
				if (node.setup) {
					for (var i in node.setup) {
						if (node.setup[i].color !== StoneColor.NONE) {
							this.game.setStone(node.setup[i].x, node.setup[i].y, node.setup[i].color);
						}
						else {
							this.game.removeStone(node.setup[i].x, node.setup[i].y);
						}
					}
				}
			}
		};

		/**
		 * Execute the next node
		 */
		var execNext = function(i) {

			//Remembered the path we took earlier?
			if (i === undefined && this.config.rememberPath) {
				i = this.node._last_selected;
			}

			//Determine which child node to process
			i = i || 0;

			//Set child node and validate
			var node = this.node.children[i];
			if (!node) {
				return false;
			}

			//Execute node
			execNode.call(this, node);

			//Update path
			this.path.m++;
			if (this.node.children.length > 1) {
				this.path[this.path.m] = i;
			}

			//Remember node
			this.node = node;
			return true;
		};

		/**
		 * Execute the previous node
		 */
		var execPrevious = function() {

			//If no parent node, can't do this
			if (!this.node.parent) {
				return false;
			}

			//Remember current position for comparison of changes
			var currentPosition = this.game.getPosition();

			//Set parent node
			this.node = this.node.parent;

			//Pop position in game
			this.game.popPosition();

			//Set turn
			if (this.node.turn) {
				this.game.setTurn(this.node.turn);
			}

			//Update path
			if (this.path[this.path.m] !== undefined) {
				delete this.path[this.path.m];
			}
			this.path.m--;

			//Success
			return true;
		};

		/**
		 * Helper to execute the first node
		 */
		var execFirst = function() {

			//Advance game to first position
			this.game.firstPosition();

			//Initialize node and path
			this.node = this.kifu.root;
			this.path = {m:0};

			//Determine who's turn it is depending on handicap
			if (this.kifu.info.handicap && this.kifu.info.handicap > 1) {
				this.game.setTurn(StoneColor.W);
			}

			//Compute initial change
			return execNode.call(this, this.node, true);
		};

		/**
		 * Reader class
		 */
		var KifuReader = {

			/**
			 * Load a kifu
			 */
			load: function(kifu, config) {

				//Extend config
				config = config || {};
				this.config = angular.extend(defaultConfig, config);

				//Remember kifu
				this.kifu = kifu;

				//Initialize
				this.game = null;
				this.node = null;
				this.path = {};

				//No kifu?
				if (!this.kifu) {
					return;
				}

				//Load game
				this.game = new Game(this.kifu.size, this.kifu.get('info.komi'));

				//Get blank board to compute first changes
				var blankPosition = new GamePosition(this.kifu.size);

				//Execute first position
				execFirst.call(this);

				//Set changes compared to blank position
				this.changes = blankPosition.compare(this.game.getPosition());
			},

			/**
			 * Go to next node and if there is a move, play it
			 */
			next: function(i) {

				//Remember current position
				var currentPosition = this.game.getPosition();

				//Execute node
				execNext.call(this, i);

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.game.getPosition());
			},

			/**
			 * Return to the previous position (redo actual node)
			 */
			previous: function() {

				//Remember current position
				var currentPosition = this.game.getPosition();

				//Execute node
				execPrevious.call(this);

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.game.getPosition());
			},

			/**
			 * Execute all nodes till the end
			 */
			last: function() {

				//Remember current position
				var currentPosition = this.game.getPosition();

				//Loop next position unitl the end and concatenate changes
				while (execNext.call(this)) {}

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.game.getPosition());
			},

			/**
			 * Go to the initial position
			 */
			first: function() {

				//Remember current position
				var currentPosition = this.game.getPosition();

				//Execute node
				execFirst.call(this);

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.game.getPosition());
			},

			/**
			 * Go to position specified by path object
			 */
			goTo: function(path) {

				//Path not given?
				if (typeof path == 'undefined') {
					return this;
				}

				//Remember current position
				var currentPosition = this.game.getPosition();

				//Execute first move
				execFirst.call(this);

				//Loop path
				for (var i = 0; i < path.m; i++) {
					if (!execNext.call(this, path[i+1])) {
						break;
					}
				}

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.game.getPosition());
			},

			/**
			 * Go to previous fork (a node with more than one child)
			 */
			previousFork: function() {

				//Remember current position
				var currentPosition = this.game.getPosition();

				//Loop
				while (execPrevious.call(this) && this.node.children.length == 1) {}

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.game.getPosition());
			},

			/**
			 * Get current game position
			 */
			getPosition: function() {
				return this.game.getPosition();
			},

			/**
			 * Get the game
			 */
			getGame: function() {
				return this.game;
			},

			/**
			 * Get current node
			 */
			getNode: function() {
				return this.node;
			},

			/**
			 * Get change
			 */
			getChanges: function() {
				return this.changes;
			}
		};

		//Return object
		return KifuReader;
	};
});