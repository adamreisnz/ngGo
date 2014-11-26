
/**
 * Game :: This class represents a game that is being played. The class traverses the nodes of a kifu
 * and keeps track of the changes between the previous and new game positions. These changes can then
 * be fed to the board, to add or remove stones. The class also keeps a stack of all board positions
 * in memory and can validate moves to make sure they are not repeating or suicide.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Service', [
	'ngGo.Service',
	'ngGo.Game.Position.Service',
	'ngGo.Game.PositionChanges.Service',
	'ngGo.Errors.InvalidMoveError.Service'
])

/**
 * Factory definition
 */
.provider('Game', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Remember last selected variation when traversing
		rememberPath: true,

		//Check for repeating positions? (KO / ALL / empty)
		checkRepeat: 'KO',

		//Allow stones on top of each other?
		allowRewrite: false,

		//Allow suicide?
		allowSuicide: false
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
	this.$get = function(ngGo, StoneColor, GamePosition, GamePositionChanges, InvalidMoveError) {

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
					this.pass(node.move.color);
				}

				//Regular move
				else if (!this.play(node.move.x, node.move.y, node.move.color)) {
					throw new InvalidMoveError(this.getError(), node);
				}
			}

			//Handle setup nodes
			else {

				//Advance position, unless we're executing the first node
				if (!first) {
					this.pushPosition();
				}

				//Set turn
				if (node.turn) {
					this.setTurn(node.turn);
				}

				//Board setup
				if (node.setup) {
					for (var i in node.setup) {
						if (node.setup[i].color !== StoneColor.NONE) {
							this.setStone(node.setup[i].x, node.setup[i].y, node.setup[i].color);
						}
						else {
							this.removeStone(node.setup[i].x, node.setup[i].y);
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

			//Set parent node
			this.node = this.node.parent;

			//Pop position in game
			this.popPosition();

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

			//Set initial position
			this.initialPosition();

			//Initialize node and path
			this.node = this.kifu.root;
			this.path = {m:0};

			//Determine who's turn it is depending on handicap
			if (this.kifu.game && this.kifu.game.handicap && this.kifu.game.handicap > 1) {
				this.setTurn(StoneColor.W);
			}

			//Compute initial change
			return execNode.call(this, this.node, true);
		};

		/**
		 * Game class
		 */
		var Game = {

			//Configuration and error
			config: {},
			error: 0,

			//Kifu object, current node and path, positions stack
			kifu: null,
			node: null,
			path: {},
			stack: [],

			//Changes to the position
			changes: {},

			/**
			 * Load kifu into game
			 */
			load: function(kifu, config) {

				//Extend config
				config = config || {};
				this.config = angular.extend(defaultConfig, config);

				//Remember kifu
				this.kifu = kifu;

				//Initialize error
				this.error = 0;

				//Initialize node and path
				this.node = null;
				this.path = {};

				//Initialize stack with a blank position
				this.initialPosition();

				//Now go to the first actual position to compute the first changes
				this.first();
			},

			/***********************************************************************************************
			 * Getters and setters
			 ***/

			/**
			 * Get the last error that occurred
			 */
			getError: function() {
				return this.error;
			},

			/**
			 * Get current node
			 */
			getNode: function() {
				return this.node;
			},

			/**
			 * Get position changes
			 */
			getChanges: function() {
				return this.changes;
			},

			/**
			 * Set the komi used for this game
			 */
			setKomi: function(komi) {
				this.kifu.set('game.komi', parseFloat(komi));
			},

			/**
			 * Get the komi used for this game
			 */
			getKomi: function() {
				return this.kifu.get('game.komi');
			},

			/**
			 * Set the player turn for the current position
			 */
			setTurn: function(color) {

				//Must have a position
				if (!this.stack.length) {
					return;
				}

				//Set in position
				this.position.setTurn(color);
			},

			/**
			 * Get the player turn for this position
			 */
			getTurn: function() {

				//Must have a position
				if (!this.stack.length) {
					return StoneColor.B;
				}

				//Get from position
				return this.position.getTurn();
			},

			/**
			 * Get the total capture count up to the current position
			 */
			getCaptureCount: function() {

				//Initialize
				var captures = {};
				captures[StoneColor.B] = 0;
				captures[StoneColor.W] = 0;

				//Loop all positions and increment capture count
				for (var i = 0; i < this.stack.length; i++) {
					captures[StoneColor.B] += this.stack[i].getCaptureCount(StoneColor.B);
					captures[StoneColor.W] += this.stack[i].getCaptureCount(StoneColor.W);
				}

				//Return
				return captures;
			},

			/***********************************************************************************************
			 * Checkers
			 ***/

			/**
			 * Check if coordinates are on the board
			 */
			isOnBoard: function(x, y) {
				if (!this.kifu.board) {
					return false;
				}
				return x >= 0 && y >= 0 && x < this.kifu.board.width && y < this.kifu.board.height;
			},

			/**
			 * Check if given coordinates are one of the next child node coordinates
			 */
			isMoveVariation: function(x, y) {
				if (this.node) {
					return this.node.isMoveVariation(x, y);
				}
				return -1;
			},

			/**
			 * Check if a given position is repeating within this game
			 */
			isRepeatingPosition: function(position, x, y) {

				//Init
				var flag, stop;

				//Check for ko only? (Last two positions)
				if (this.checkRepeat == 'KO' && (this.stack.length - 2) >= 0) {
					stop = this.stack.length-2;
				}

				//Check all history?
				else if (this.checkRepeat == 'ALL') {
					stop = 0;
				}

				//Not repeating
				else {
					return false;
				}

				//Loop history of positions to check
				for (var i = this.stack.length-2; i >= stop; i--) {
					if (position.isSameAs(this.stack[i])) {
						return true;
					}
				}

				//Not repeating
				return false;
			},

			/**
			 * Check if a move is valid. If valid, the new game position object is returned.
			 * If false is returned, you can obtain details regarding what happend from the error.
			 */
			isValidMove: function(x, y, color) {

				//Check coordinates validity
				if (!this.isOnBoard(x, y)) {
					this.error = ngGo.error.MOVE_OUT_OF_BOUNDS;
					return false;
				}

				//Something already here?
				if (!this.allowRewrite && this.position.get(x, y) != StoneColor.NONE) {
					this.error = ngGo.error.MOVE_ALREADY_HAS_STONE;
					return false;
				}

				//Set color of move to make
				color = color || this.position.getTurn();

				//Clone position and place the stone
				var newPosition = this.position.clone();
				newPosition.set(x, y, color);

				//Capture adjacent stones if possible
				var captures = newPosition.captureAdjacent(x, y);

				//No captures occurred? Check if the move we're making is a suicide move
				if (!captures) {

					//No liberties for the group we've just created?
					if (!newPosition.hasLiberties(x, y)) {

						//Capture the group if it's allowed
						if (this.allowSuicide) {
							newPosition.captureGroup(x, y);
						}

						//Invalid move
						else {
							this.error = ngGo.error.MOVE_IS_SUICIDE;
							return false;
						}
					}
				}

				//Check history for repeating moves
				if (this.checkRepeat && this.isRepeatingPosition(newPosition, x, y)) {
					this.error = ngGo.error.MOVE_IS_REPEATING;
					return false;
				}

				//Update position info
				newPosition.setTurn(-color);

				//Move is valid
				return newPosition;
			},

			/***********************************************************************************************
			 * Move handling
			 ***/

			/**
			 * Play move
			 */
			play: function(x, y, color) {

				//Color defaults to current turn
				color = color || this.position.getTurn();

				//Get new position
				var newPosition = this.isValidMove(x, y, color);

				//Validate move
				if (newPosition === false) {
					return false;
				}

				//Save position
				this.pushPosition(newPosition);

				//Return the new position
				return this.position;
			},

			/**
			 * Play pass
			 */
			pass: function(color) {

				//Color defaults to current turn
				color = color || this.position.getTurn();

				//Push position
				this.pushPosition();

				//Set color
				this.position.setTurn(color);

				//Return new position
				return this.position;
			},

			/***********************************************************************************************
			 * Board setup handling
			 ***/

			/**
			 * Add a stone to the board (used for position setup) (won't overwrite)
			 */
			addStone: function(x, y, color) {
				if (this.isOnBoard(x, y) && this.position.get(x, y) === StoneColor.NONE) {
					this.position.set(x, y, color || StoneColor.NONE);
					return true;
				}
				return false;
			},

			/**
			 * Remove a stone from the board
			 */
			removeStone: function(x, y) {
				if (this.isOnBoard(x, y) && this.position.get(x, y) !== StoneColor.NONE) {
					this.position.set(x, y, StoneColor.NONE);
					return true;
				}
				return false;
			},

			 /**
			  * Set a stone to the board (will overwrite)
			  */
			setStone: function(x, y, color) {
				if(this.isOnBoard(x, y)) {
					this.position.set(x, y, color || StoneColor.NONE);
					return true;
				}
				return false;
			},

			 /**
			  * Get stone for given position
			  */
			getStone: function(x, y) {
				if (this.isOnBoard(x, y)) {
					return this.position.get(x, y);
				}
				return StoneColor.NONE;
			},

			/***********************************************************************************************
			 * Position control
			 ***/

			/**
			 * Get the current game position
			 */
			getPosition: function() {
				return this.position;
			},

			/**
			 * Clear the position stack and initialize with a blank position
			 */
			initialPosition: function() {

				//Already at beginning?
				if (this.stack.length == 1) {
					return;
				}

				//Clear positions stack and create new blank position
				this.stack = [];
				this.stack.push(new GamePosition());

				//Set board size if there is one in the kifu
				if (this.kifu.board) {
					this.stack[0].setSize(this.kifu.board.width, this.kifu.board.height);
				}
			},

			/**
			 * Add position to stack. If position isn't specified current position is
			 * cloned and stacked. Pointer of actual position is moved to the new position.
			 */
			pushPosition: function(newPosition) {

				//Position not given?
				if (!newPosition) {

					//Clone current position and switch turn
					newPosition = this.position.clone();
					newPosition.switchTurn();
				}

				//Push
				this.stack.push(newPosition);
			},

			/**
			 * Remove current position from stack
			 */
			popPosition: function() {

				//Nothing left?
				if (this.stack.length === 0) {
					return null;
				}

				//Get old position
				return this.stack.pop();
			},

			/***********************************************************************************************
			 * Kifu navigation
			 ***/

			/**
			 * Go to next node
			 */
			next: function(i) {

				//Remember current position
				var currentPosition = this.position.clone();

				//Execute node
				execNext.call(this, i);

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.position);
			},

			/**
			 * Go to the previous position
			 */
			previous: function() {

				//Remember current position
				var currentPosition = this.position.clone();

				//Execute node
				execPrevious.call(this);

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.position);
			},

			/**
			 * Go to the last position
			 */
			last: function() {

				//Remember current position
				var currentPosition = this.position.clone();

				//Loop next position unitl the end and concatenate changes
				while (execNext.call(this)) {}

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.position);
			},

			/**
			 * Go to the first position
			 */
			first: function() {

				//Remember current position
				var currentPosition = this.position.clone();

				//Execute node
				execFirst.call(this);

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.position);
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
				var currentPosition = this.position.clone();

				//Execute first move
				execFirst.call(this);

				//Loop path
				for (var i = 0; i < path.m; i++) {
					if (!execNext.call(this, path[i+1])) {
						break;
					}
				}

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.position);
			},

			/**
			 * Go to the last fork (a node with more than one child)
			 */
			lastFork: function() {

				//Remember current position
				var currentPosition = this.position.clone();

				//Loop
				while (execPrevious.call(this) && this.node.children.length == 1) {}

				//Get changes compared to the new position
				this.changes = currentPosition.compare(this.position);
			}
		};

		//Define property getter/setter for position
		Object.defineProperty(Game, 'position', {

			//Getter returns the last position from the stack
			get: function() {
				return this.stack[this.stack.length - 1];
			},

			//Setter adds a new position to the tack
			set: function(position) {
				this[this.stack.length - 1] = position;
			}
		});

		//Return
		return Game;
	};
});