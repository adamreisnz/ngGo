
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
	'ngGo.Game.Node.Service',
	'ngGo.Game.Position.Service',
	'ngGo.Game.PositionChanges.Service',
	'ngGo.Kifu.Blank.Service',
	'ngGo.Kifu.Parser.Service'
])

/**
 * Factory definition
 */
.provider('Game', function() {

	/**
	 * Default configuration
	 */
	var defaultConfig = {

		//Default size of board
		defaultSize: 0,

		//Default komi and handicap
		defaultKomi: 0,
		defaultHandicap: 0,

		//Remember last selected variation when traversing nodes
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
	this.$get = function(ngGo, StoneColor, GameNode, GamePosition, GamePositionChanges, KifuParser, KifuBlank) {

		/***********************************************************************************************
		 * General helpers
		 ***/

		/**
		 * Validate the info we have to make sure the properties exist
		 */
		var validateInfo = function() {

			//Set board info if not set
			if (!this.info.board) {
				this.info.board = {};
			}

			//Set game info if not set
			if (!this.info.game) {
				this.info.game = {};
			}

			//Set defaults
			if (typeof this.info.board.width == 'undefined') {
				this.info.board.width = this.config.defaultSize;
			}
			if (typeof this.info.board.height == 'undefined') {
				this.info.board.height = this.config.defaultSize;
			}
			if (typeof this.info.game.komi == 'undefined') {
				this.info.game.komi = this.config.defaultKomi;
			}
			if (typeof this.info.game.handicap == 'undefined') {
				this.info.game.handicap = this.config.defaultHandicap;
			}
		};

		/***********************************************************************************************
		 * Node navigation helpers
		 ***/

		/**
		 * Navigate to the next node
		 */
		var nextNode = function(i) {

			//Check if we have children
			if (this.node.children.length === 0) {
				return false;
			}

			//Remembered the path we took earlier?
			if (i === undefined) {
				i = this.node._remembered_path;
			}

			//Determine which child node to process
			i = i || 0;

			//Validate
			if (i >= this.node.children.length || !this.node.children[i]) {
				return false;
			}

			//Update path
			this.path.m++;
			if (this.node.children.length > 1) {
				this.path[this.path.m] = i;
			}

			//Set pointer of current node
			this.node = this.node.children[i];
			return true;
		};

		/**
		 * Navigate to the previous node
		 */
		var previousNode = function() {

			//No parent node?
			if (!this.node.parent) {
				return false;
			}

			//Update path
			if (this.path[this.path.m] !== undefined) {
				delete this.path[this.path.m];
			}
			this.path.m--;

			//Set pointer of current node
			this.node = this.node.parent;
			return true;
		};

		/**
		 * Navigate to the first node
		 */
		var firstNode = function() {

			//Reset path
			this.path = {m: 0};

			//Set node pointer back to root
			this.node = this.root;

			//Set the initial turn depending on handicap (can be overwritten by game record instructions)
			this.setTurn((this.info.game.handicap > 1) ? StoneColor.W : StoneColor.B);
		};

		/***********************************************************************************************
		 * Position history helpers
		 ***/

		/**
		 * Clear the position history and initialize with a blank position
		 */
		var initializeHistory = function() {

			//Already at beginning?
			if (this.history.length == 1) {
				return;
			}

			//Clear positions stack and create new blank position
			this.history = [];
			this.history.push(new GamePosition());

			//Set board size if we have the info
			if (this.info.board) {
				this.history[0].setSize(this.info.board.width, this.info.board.height);
			}
		};

		/**
		 * Add position to stack. If position isn't specified current position is
		 * cloned and stacked. Pointer of actual position is moved to the new position.
		 */
		var pushPosition = function(newPosition) {

			//Position not given?
			if (!newPosition) {

				//Clone current position and switch turn
				newPosition = this.position.clone();
				newPosition.switchTurn();
			}

			//Push
			this.history.push(newPosition);
		};

		/**
		 * Remove current position from stack
		 */
		var popPosition = function() {

			//Nothing left?
			if (this.history.length === 0) {
				return null;
			}

			//Get old position
			return this.history.pop();
		};

		/***********************************************************************************************
		 * Execution helpers
		 ***/

		/**
		 * Execute the current node
		 */
		var executeNode = function() {

			//Remember last selected node if we have a parent
			if (this.node.parent) {
				this.node.parent._remembered_path = this.node.parent.children.indexOf(this.node);
			}

			//Initialize new position var
			var newPosition;

			//Handle move nodes
			if (this.node.move) {
				newPosition = executeMove.call(this, this.node.move);
			}

			//Handle setup nodes
			else if (this.node.setup) {
				newPosition = executeSetup.call(this, this.node.setup);
			}

			//No move or setup instructions? Simply clone current position
			else {
				newPosition = this.position.clone();
			}

			//Handle turn instructions
			if (this.node.turn) {
				newPosition.setTurn(this.node.turn);
			}

			//Push the new position into the history now
			pushPosition.call(this, newPosition);
		};

		/**
		 * Parse move instructions
		 */
		var executeMove = function(move) {

			//Initialize new position
			var newPosition = this.position.clone();

			//Pass
			if (move.pass) {
				newPosition.setTurn(-move.color);
			}

			//Regular move
			else {
				newPosition = this.isValidMove(move.x, move.y, move.color, newPosition);
			}

			//Return the new position
			return newPosition;
		};

		/**
		 * Parse setup instructions
		 */
		var executeSetup = function(setup) {

			//Initialize new position
			var newPosition = this.position.clone();

			//Loop setup instructions
			for (var i in setup) {
				newPosition.set(setup[i].x, setup[i].y, setup[i].color);
			}

			//Return new position
			return newPosition;
		};

		/***********************************************************************************************
		 * Game class
		 ***/

		/**
		 * Constructor
		 */
		var Game = function(data, config) {

			//Extend config
			this.config = angular.extend(defaultConfig, config || {});

			//Load data
			this.load(data);

			//Define property getter/setter for position
			Object.defineProperty(this, 'position', {

				//Getter returns the last position from the stack
				get: function() {
					return this.history[this.history.length - 1];
				},

				//Setter adds a new position to the stack
				set: function(newPosition) {
					this.history[this.history.length] = newPosition;
				}
			});
		};

		/**
		 * Initialize
		 */
		Game.prototype.init = function() {

			//Last error
			this.error = 0;

			//Info properties
			this.info = {};

			//The rood node and pointer to the current node
			this.root = null;
			this.node = null;

			//The current move path and positions history stack
			this.path = {};
			this.history = [];
		};

		/**
		 * Load game record data
		 */
		Game.prototype.load = function(data) {

			//Initialize
			this.init();

			//Try to load game record data
			this.fromData(data);

			//Initialize history with a blank board position
			initializeHistory.call(this);

			//If we don't have a tree, we failed to load
			return this.hasTree();
		};

		/**
		 * Check if we managed to load a valid game record
		 */
		Game.prototype.hasTree = function() {
			return this.root !== null;
		};

		/***********************************************************************************************
		 * Game cloning and conversion
		 ***/

		/**
		 * Clone this game
		 */
		Game.prototype.clone = function() {

			//Create new kifu object and get properties
			var clone = new Game(),
				props = Object.getOwnPropertyNames(this);

			//Copy all properties
			for (var p = 0; p < props.length; p++) {
				clone[p] = angular.copy(this[p]);
			}

			//Return clone
			return clone;
		};

		/**
		 * Load from an unknown data source
		 */
		Game.prototype.fromData = function(data) {

			//No data, can't do much
			if (!data) {
				return;
			}

			//String given, could be stringified JGF or an SGF file
			if (typeof data == 'string') {
				var c = data.charAt(0);
				if (c == '(') {
					this.fromSgf(data);
				}
				else if (c == '{') {
					this.fromJgf(data);
				}
			}

			//Object given? Probably a JGF object
			else if (typeof data == 'object') {
				this.fromJgf(data);
			}
		};

		/**
		 * Load from SGF data
		 */
		Game.prototype.fromSgf = function(sgf) {

			//Init
			var jgf = KifuParser.sgf2jgf(sgf);

			//If parsing succeeded, load from JGF
			if (jgf) {
				this.fromJgf(jgf);
			}
		};

		/**
		 * Load from JGF data
		 */
		Game.prototype.fromJgf = function(jgf) {

			//Parse jgf string
			if (typeof jgf == 'string') {
				jgf = JSON.parse(jgf);
			}

			//Parse tree string
			if (typeof jgf.tree == 'string') {
				if (jgf.tree.charAt(0) == '[') {
					jgf.tree = JSON.parse(jgf.tree);
				}
				else {
					jgf.tree = [];
				}
			}

			//Copy all properties except moves tree
			for (var i in jgf) {
				if (i != 'tree') {
					this.info[i] = angular.copy(jgf[i]);
				}
			}

			//Validate info
			validateInfo.call(this);

			//Create root node
			this.root = new GameNode();

			//If tree given, load all the moves
			if (jgf.tree) {
				this.root.fromJgf(jgf.tree);
			}
		};

		/**
		 * Convert to SGF
		 */
		Game.prototype.toSgf = function() {
			return KifuParser.jgf2sgf(this.toJgf());
		};

		/**
		 * Convert to JGF (optionally stringified)
		 */
		Game.prototype.toJgf = function(stringify) {

			//Initialize JGF and get properties
			var jgf = KifuBlank.jgf(),
				props = Object.getOwnPropertyNames(this);

			//Copy properties
			for (var p = 0; p < props.length; p++) {

				//Skip root
				if (p == 'root') {
					continue;
				}

				//Already present on JGF object? Extend
				if (jgf[p]) {
					jgf[p] = angular.extend(jgf[p], this[p]);
				}

				//Otherwise copy
				else {
					jgf[p] = angular.copy(this[p]);
				}
			}

			//Build tree
			jgf.tree = this.root.toJgf();

			//Return
			return stringify ? JSON.stringify(jgf) : jgf;
		};

		/***********************************************************************************************
		 * Getters
		 ***/

		/**
		 * Get the last error that occurred
		 */
		Game.prototype.getError = function() {
			return this.error;
		};

		/**
		 * Get current node
		 */
		Game.prototype.getNode = function() {
			return this.node;
		};

		/**
		 * Get the current game position
		 */
		Game.prototype.getPosition = function() {
			return this.position;
		};

		/**
		 * Get the move path
		 */
		Game.prototype.getPath = function() {
			return this.path;
		};

		/**
		 * Get the game komi
		 */
		Game.prototype.getKomi = function() {
			if (!this.info.game.komi) {
				return 0;
			}
			return parseFloat(this.info.game.komi);
		};

		/**
		 * Set the game komi
		 */
		Game.prototype.setKomi = function(komi) {
			this.info.game.komi = komi ? parseFloat(komi) : this.config.defaultKomi;
		};

		/**
		 * Get the player turn for this position
		 */
		Game.prototype.getTurn = function() {

			//Must have a position
			if (!this.history.length) {
				return StoneColor.B;
			}

			//Get from position
			return this.position.getTurn();
		};

		/**
		 * Set the player turn for the current position
		 */
		Game.prototype.setTurn = function(color) {

			//Must have a position
			if (!this.history.length) {
				return;
			}

			//Set in position
			this.position.setTurn(color);
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
			for (var i = 0; i < this.history.length; i++) {
				captures[StoneColor.B] += this.history[i].getCaptureCount(StoneColor.B);
				captures[StoneColor.W] += this.history[i].getCaptureCount(StoneColor.W);
			}

			//Return
			return captures;
		};

		/**
		 * Get an info property
		 */
		Game.prototype.get = function(position) {

			//Must have a position
			if (!position) {
				return;
			}

			//The item's position in the object is given by dot separated strings
			if (typeof position == 'string') {
				position = position.split('.');
			}

			//Initialize object we're getting info from
			var obj = this.info, key;

			//Loop the position
			for (var p = 0; p < position.length; p++) {

				//Get actual key
				key = position[p];

				//Last key reached? Done, get value
				if ((p + 1) == position.length) {
					return obj[key];
				}

				//Must be object container
				if (typeof obj[key] != 'object') {
					console.warn('Game property', key, 'is not an object');
					return;
				}

				//Move up in tree
				obj = obj[key];
			}
		};

		/***********************************************************************************************
		 * Checkers
		 ***/

		/**
		 * Check if coordinates are on the board
		 */
		Game.prototype.isOnBoard = function(x, y) {
			return x >= 0 && y >= 0 && x < this.info.board.width && y < this.info.board.height;
		};

		/**
		 * Check if given coordinates are one of the next child node coordinates
		 */
		Game.prototype.isMoveVariation = function(x, y) {
			if (this.node) {
				return this.node.isMoveVariation(x, y);
			}
			return -1;
		};

		/**
		 * Check if a given position is repeating within this game
		 */
		Game.prototype.isRepeatingPosition = function(checkPosition, x, y) {

			//Init
			var flag, stop;

			//Check for ko only? (Last two positions)
			if (this.checkRepeat == 'KO' && (this.history.length - 2) >= 0) {
				stop = this.history.length-2;
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
			for (var i = this.history.length-2; i >= stop; i--) {
				if (checkPosition.isSameAs(this.history[i])) {
					return true;
				}
			}

			//Not repeating
			return false;
		};

		/**
		 * Check if a move is valid. If valid, the new game position object is returned.
		 * If false is returned, you can obtain details regarding what happend from the error.
		 * You can supply a pre-created position to use, or the current position is cloned.
		 */
		Game.prototype.isValidMove = function(x, y, color, newPosition) {

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

			//Determine position to use
			newPosition = newPosition || this.position.clone();

			//Place the stone
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

			//Set proper turn
			newPosition.setTurn(-color);

			//Move is valid
			return newPosition;
		};

		/***********************************************************************************************
		 * Stone handling
		 ***/

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
		 * Remove a stone from the board at given coordinates for the current position
		 */
		Game.prototype.removeStone = function(x, y) {
			if (this.isOnBoard(x, y) && this.position.get(x, y) !== StoneColor.NONE) {
				this.position.set(x, y, StoneColor.NONE);
				return true;
			}
			return false;
		};

		/**
		 * Set the stone color for given coordinates to the current position (will overwrite)
		 */
		Game.prototype.setStone = function(x, y, color) {
			if (this.isOnBoard(x, y)) {
				this.position.set(x, y, color || StoneColor.NONE);
				return true;
			}
			return false;
		};

		/**
		 * Get stone color at given coordinates for the current position
		 */
		Game.prototype.getStone = function(x, y) {
			if (this.isOnBoard(x, y)) {
				return this.position.get(x, y);
			}
			return StoneColor.NONE;
		};

		/**
		 * Check if there is a stone at the given coordinates for the current position
		 */
		Game.prototype.hasStone = function(x, y) {
			if (this.isOnBoard(x, y)) {
				return this.position.get(x, y) !== StoneColor.NONE;
			}
			return false;
		};

		/***********************************************************************************************
		 * Move handling
		 ***/

		/**
		 * Play move
		 */
		Game.prototype.play = function(x, y, color) {

			//Color defaults to current turn
			color = color || this.position.getTurn();

			//Create move object
			var move = {
				x: x,
				y: y,
				color: color
			};

			//Remember current position and obtain new position
			var currentPosition = this.position.clone(),
				newPosition = executeMove.call(this, move);

			//No new position? Means invalid move, no changes
			if (!newPosition) {
				return new GamePositionChanges();
			}

			//Push new position
			pushPosition.call(this, newPosition);

			//Create new move node
			var node = new GameNode({move: move});

			//Append it to the current node, remember the path, and change the pointer
			this.node._remembered_path = node.appendTo(this.node);
			this.node = node;

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		/**
		 * Play pass
		 */
		Game.prototype.pass = function(color) {

			//Color defaults to current turn
			color = color || this.position.getTurn();

			//Create move object
			var move = {
				pass: true,
				color: color
			};

			//Remember current position and obtain new position
			var currentPosition = this.position.clone(),
				newPosition = executeMove.call(this, move);

			//No new position? Means invalid move, no changes
			if (!newPosition) {
				return new GamePositionChanges();
			}

			//Create new move node
			var node = new GameNode({move: move});

			//Append it to the current node, remember the path, and change the pointer
			this.node._remembered_path = node.appendTo(this.node);
			this.node = node;

			//Add the new position to the stack
			pushPosition.call(this, newPosition);

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		/**
		 * Give the game a setup instruction
		 */
		Game.prototype.setup = function(x, y, color) {

			//Check if there's anything to do at all
			if (this.position.is(x, y, color)) {
				return;
			}

			//Remember current position to compute changes
			var currentPosition = this.position.clone();

			//Create setup instruction
			var setup = {
				x: x,
				y: y,
				color: color
			};

			//No setup instructions container in this node?
			if (typeof this.node.setup == 'undefined') {

				//Is this a move node?
				if (this.node.move) {

					//Clone our position
					pushPosition.call(this);

					//Create new node
					var node = new GameNode();

					//Append it to the current node and change the pointer
					node.appendTo(this.node);
					this.node = node;
				}

				//Create setup container
				this.node.setup = [];
			}

			//Add setup instructions to node
			this.node.setup.push(setup);

			//Set it in the position
			this.position.set(x, y, color);

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		/***********************************************************************************************
		 * Game navigation
		 ***/

		/**
		 * Go to the next position
		 */
		Game.prototype.next = function(i) {

			//Remember current position
			var currentPosition = this.position.clone();

			//Go to the next node
			if (nextNode.call(this, i)) {
				executeNode.call(this);
			}

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		/**
		 * Go to the previous position
		 */
		Game.prototype.previous = function() {

			//Remember current position
			var currentPosition = this.position.clone();

			//Go to the previous node
			if (previousNode.call(this)) {
				popPosition.call(this);
			}

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		/**
		 * Go to the last position
		 */
		Game.prototype.last = function() {

			//Remember current position
			var currentPosition = this.position.clone();

			//Keep going to the next node until we reach the end
			while (nextNode.call(this)) {
				executeNode.call(this);
			}

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		/**
		 * Go to the first position
		 */
		Game.prototype.first = function() {

			//Remember current position
			var currentPosition = this.position.clone();

			//Go to the first node
			firstNode.call(this);

			//Create the initial position, clone it and parse the current node
			initializeHistory.call(this);
			pushPosition.call(this);
			executeNode.call(this);

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		/**
		 * Go to position specified by path object
		 */
		Game.prototype.goto = function(path) {

			//Path not given?
			if (typeof path == 'undefined') {
				return null;
			}

			//Function given? Call now
			if (typeof path == 'function') {
				path = path.call(this);
			}

			//Simple move number? Convert to path
			if (typeof path == 'number') {
				var move = path;
				path = angular.copy(this.path);
				path.m = move || 0;
			}

			//Remember current position
			var currentPosition = this.position.clone();

			//Go to the first node
			firstNode.call(this);

			//Create the initial position, clone it and parse the current node
			initializeHistory.call(this);
			pushPosition.call(this);
			executeNode.call(this);

			//Loop path
			for (var i = 0; i < path.m; i++) {
				if (nextNode.call(this, path[i+1])) {
					executeNode.call(this);
				}
				else {
					break;
				}
			}

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		/**
		 * Go to the last fork (a node with more than one child)
		 */
		Game.prototype.lastFork = function() {

			//Remember current position
			var currentPosition = this.position.clone();

			//Loop
			while (execPrevious.call(this) && this.node.children.length == 1) {}

			//Return changes compared to the new position
			return currentPosition.compare(this.position);
		};

		//Return object
		return Game;
	};
});