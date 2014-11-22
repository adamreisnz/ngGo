
/**
 * Game :: This class represents a game that is being played. It keeps a stack of all board positions
 * in memory, and keeps track of komi. In addition, the class can validate moves to make sure they are
 * not repeating or suicide if desired.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Service', [
	'ngGo.Service',
	'ngGo.Game.Position.Service'
])

/**
 * Factory definition
 */
.provider('Game', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Default board size
		defaultSize: 19,

		//Default komi
		defaultKomi: 0,

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
	this.$get = function(ngGo, StoneColor, GamePosition) {

		/**
		 * Constructor
		 */
		var Game = function(size, komi, config) {

			//Extend config
			config = config || {};
			this.config = angular.extend(defaultConfig, config);

			//Set size and komi
			this.size = size || this.config.defaultSize;
			this.komi = komi || this.config.defaultKomi;

			//Parse size, komi and set turn
			this.size = parseInt(this.size);
			this.komi = parseFloat(this.komi);
			this.turn = StoneColor.B;

			//Initialize error
			this.error = 0;

			//Initialize positions stack
			this.stack = [];

			//Create new position
			this.stack.push(new GamePosition(this.size));

			//Define property getter/setter for position
			Object.defineProperty(this, 'position', {

				//Getter returns the last position from the stack
				get: function() {
					return this.stack[this.stack.length - 1];
				},

				//Setter adds a new position to the tack
				set: function(position) {
					this[this.stack.length - 1] = position;
				}
			});
		};

		/**
		 * Get the last error that occurred
		 */
		Game.prototype.getError = function() {
			return this.error;
		};

		/**
		 * Get the total capture count up to the current position
		 */
		Game.prototype.getCaptureCount = function() {

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
		};

		/**
		 * Set the komi used for this game
		 */
		Game.prototype.setKomi = function(komi) {
			this.komi = parseFloat(komi);
		};

		/**
		 * Get the komi used for this game
		 */
		Game.prototype.getKomi = function() {
			return this.komi;
		};

		/**
		 * Set the player turn for the current position
		 */
		Game.prototype.setTurn = function(color) {

			//Must have a position
			if (!this.stack.length) {
				return;
			}

			//Set in position
			this.position.setTurn(color);
		};

		/**
		 * Get the player turn for this position
		 */
		Game.prototype.getTurn = function() {

			//Must have a position
			if (!this.stack.length) {
				return StoneColor.B;
			}

			//Get from position
			return this.position.getTurn();
		};

		/**
		 * Gets actual position.
		 */
		Game.prototype.getPosition = function() {
			return this.position;
		};

		/**
		 * Add position to stack. If position isn't specified current position is
		 * cloned and stacked. Pointer of actual position is moved to the new position.
		 */
		Game.prototype.pushPosition = function(newPosition) {

			//Position not given?
			if (!newPosition) {

				//Clone current position and switch turn
				newPosition = this.position.clone();
				newPosition.switchTurn();
			}

			//Push
			this.stack.push(newPosition);
		};

		/**
		 * Remove current position from stack. Pointer of actual position is moved to the previous position.
		 */
		Game.prototype.popPosition = function() {

			//Nothing left?
			if (this.stack.length === 0) {
				return null;
			}

			//Get old position
			return this.stack.pop();
		};

		/**
		 * Go back to the first position
		 */
		Game.prototype.firstPosition = function() {

			//Already at beginning?
			if (this.stack.length == 1) {
				return;
			}

			//Clear positions stack
			this.stack = [];

			//Create new position
			this.stack.push(new GamePosition(this.size));
		};

		/**
		 * Check if a given position is repeating within this game
		 */
		Game.prototype.isRepeatingPosition = function(position, x, y) {

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
		};

		/**
		 * Check if a move is on the board
		 */
		Game.prototype.isOnBoard = function(x, y) {
			return x >= 0 && y >= 0 && x < this.size && y < this.size;
		};

		/**
		 * Check if a move is valid. If valid, the new game position object is returned.
		 * If false is returned, you can obtain details regarding what happend from the error.
		 */
		Game.prototype.isValidMove = function(x, y, color) {

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
		};

		/**
		 * Play move
		 */
		Game.prototype.play = function(x, y, color) {

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
		};

		/**
		 * Play pass
		 */
		Game.prototype.pass = function(color) {

			//Push position
			this.pushPosition();

			//Set color
			if (color) {
				this.position.color = color;
				this.turn = -color;
			}
			else {
				this.position.color = this.turn;
				this.turn = -this.turn;
			}

			//Return new position
			return this.position;
		};

		/**
		 * Add a stone to the board (used for position setup) (won't overwrite)
		 */
		Game.prototype.addStone = function(x, y, color) {
			if (this.isOnBoard(x, y) && this.position.get(x, y) === StoneColor.NONE) {
				this.position.set(x, y, color || StoneColor.NONE);
				return true;
			}
			return false;
		};

		/**
		 * Remove a stone from the board
		 */
		Game.prototype.removeStone = function(x, y) {
			if (this.isOnBoard(x, y) && this.position.get(x, y) !== StoneColor.NONE) {
				this.position.set(x, y, StoneColor.NONE);
				return true;
			}
			return false;
		};

		 /**
		  * Set a stone to the board (will overwrite)
		  */
		Game.prototype.setStone = function(x, y, color) {
			if(this.isOnBoard(x, y)) {
				this.position.set(x, y, color || StoneColor.NONE);
				return true;
			}
			return false;
		};

		 /**
		  * Get stone for given position
		  */
		Game.prototype.getStone = function(x, y) {
			if (this.isOnBoard(x, y)) {
				return this.position.get(x, y);
			}
			return StoneColor.NONE;
		};

		//Return
		return Game;
	};
});