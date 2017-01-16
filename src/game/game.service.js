
/**
 * Game :: This class represents a game record or a game that is being played/edited. The class
 * traverses the move tree nodes and keeps track of the changes between the previous and new game
 * positions. These changes can then be fed to the board, to add or remove stones and markup.
 * The class also keeps a stack of all board positions in memory and can validate moves to make
 * sure they are not repeating or suicide.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Service', [
  'ngGo',
  'ngGo.Game.Path.Service',
  'ngGo.Game.Node.Service',
  'ngGo.Game.Position.Service',
  'ngGo.Kifu.Blank.Service',
  'ngGo.Kifu.Parser.Service',
  'ngGo.Errors.InvalidDataError.Service',
  'ngGo.Errors.InvalidPositionError.Service'
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
  this.$get = function(
    ngGo, StoneColor, GamePath, GameNode, GamePosition, KifuParser,
    KifuBlank, InvalidDataError, InvalidPositionError
  ) {

    /*****************************************************************************
     * General helpers
     ***/

    /**
     * Validate the info we have to make sure the properties exist
     */
    function validateInfo() {

      //Set board info if not set
      if (!this.info.board) {
        this.info.board = {};
      }

      //Set game info if not set
      if (!this.info.game) {
        this.info.game = {};
      }

      //Set defaults
      if (typeof this.info.board.width === 'undefined') {
        this.info.board.width = this.config.defaultSize;
      }
      if (typeof this.info.board.height === 'undefined') {
        this.info.board.height = this.config.defaultSize;
      }
      if (typeof this.info.game.komi === 'undefined') {
        this.info.game.komi = this.config.defaultKomi;
      }
      if (typeof this.info.game.handicap === 'undefined') {
        this.info.game.handicap = this.config.defaultHandicap;
      }
    }

    /*****************************************************************************
     * Node navigation helpers
     ***/

    /**
     * Navigate to the next node
     */
    function nextNode(i) {

      //Check if we have children
      if (this.node.children.length === 0) {
        return false;
      }

      //Remembered the path we took earlier?
      if (i === undefined) {
        i = this.node.rememberedPath;
      }

      //Determine which child node to process
      i = i || 0;
      if (i === -1) {
        i = 0;
      }

      //Validate
      if (i >= this.node.children.length || !this.node.children[i]) {
        return false;
      }

      //Advance path
      this.path.advance(i);

      //Set pointer of current node
      this.node = this.node.children[i];
      return true;
    }

    /**
     * Navigate to the previous node
     */
    function previousNode() {

      //No parent node?
      if (!this.node.parent) {
        return false;
      }

      //Retreat path
      this.path.retreat();

      //Set pointer of current node
      this.node = this.node.parent;
      return true;
    }

    /**
     * Navigate to the first node
     */
    function firstNode() {

      //Reset path
      this.path.reset();

      //Set node pointer back to root
      this.node = this.root;

      //Set the initial turn depending on handicap
      //Can be overwritten by game record instructions
      this.setTurn((this.info.game.handicap > 1) ? StoneColor.W : StoneColor.B);
    }

    /**
     * Find the move index in the child nodes.
     */
    function findMoveIndexInChildNodes(x, y, color) {

      //Only iterate when there are children
      if (this.node.hasChildren()) {
        for (var i = 0; i < this.node.children.length; ++i) {
          var childNode = this.node.children[i];

          //Only check if the child node is a move node
          if (childNode.isMove()) {
            var nodeMove = childNode.move;
            if (nodeMove.x === x && nodeMove.y === y && nodeMove.color === color) {
              return i;
            }
          }
        }
      }

      //The move doesn't exist
      return null;
    }

    /*****************************************************************************
     * Position history helpers
     ***/

    /**
     * Clear the position history and initialize with a blank position
     */
    function initializeHistory() {

      //Already at beginning?
      if (this.history.length === 1) {
        return;
      }

      //Clear positions stack and create new blank position
      this.history = [];
      this.history.push(new GamePosition());

      //Set board size if we have the info
      if (this.info.board) {
        this.history[0].setSize(this.info.board.width, this.info.board.height);
      }
    }

    /**
     * Add position to stack. If position isn't specified current position is
     * cloned and stacked. Pointer of actual position is moved to the new position.
     */
    function pushPosition(newPosition) {

      //Position not given?
      if (!newPosition) {
        newPosition = this.position.clone();
      }

      //Push
      this.history.push(newPosition);
      return newPosition;
    }

    /**
     * Remove current position from stack
     */
    function popPosition() {

      //Nothing left?
      if (this.history.length === 0) {
        return null;
      }

      //Get old position
      return this.history.pop();
    }

    /**
     * Replace the current position in the stack
     */
    function replacePosition(newPosition) {
      if (newPosition) {
        this.history.pop();
        this.history.push(newPosition);
      }
    }

    /*****************************************************************************
     * Execution helpers
     ***/

    /**
     * Execute the current node
     */
    function executeNode() {

      //Remember last selected node if we have a parent
      if (this.node.parent) {
        this.node.parent.rememberedPath = this.node.parent.children.indexOf(this.node);
      }

      //Initialize new position
      var i;
      var newPosition = this.position.clone();

      //Handle moves
      if (this.node.isMove()) {
        if (this.node.move.pass) {
          newPosition.setTurn(-this.node.move.color);
        }
        else {
          this.validateMove(this.node.move.x, this.node.move.y, this.node.move.color, newPosition);
        }
      }

      //Handle turn instructions
      if (this.node.turn) {
        newPosition.setTurn(this.node.turn);
      }

      //Handle setup instructions
      if (this.node.setup) {
        for (i in this.node.setup) {
          if (this.node.setup.hasOwnProperty(i)) {
            newPosition.stones.set(
              this.node.setup[i].x, this.node.setup[i].y, this.node.setup[i].color
            );
          }
        }
      }

      //Handle markup
      if (this.node.markup) {
        for (i in this.node.markup) {
          if (this.node.markup.hasOwnProperty(i)) {
            newPosition.markup.set(
              this.node.markup[i].x, this.node.markup[i].y, this.node.markup[i]
            );
          }
        }
      }

      //Push the new position into the history now
      pushPosition.call(this, newPosition);
    }

    /*****************************************************************************
     * Game class
     ***/

    /**
     * Constructor
     */
    function Game(data, config) {

      //Extend config
      this.config = angular.extend({}, defaultConfig, config || {});

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

      //Load data
      if (data) {
        this.load(data);
      }
      else {
        this.init();
      }
    }

    /**
     * Initialize
     */
    Game.prototype.init = function() {

      //Info properties
      this.info = {};

      //The rood node and pointer to the current node
      this.root = null;
      this.node = null;

      //Game path
      this.path = new GamePath();

      //JGF record we loaded from
      this.jgf = null;

      //Positions history stack
      this.history = [];
    };

    /**
     * Load game record data
     */
    Game.prototype.load = function(data) {

      //Initialize
      this.init();

      //Try to load game record data
      try {
        this.fromData(data);
      }
      catch (errorCode) {

        //Just initialize our history with a blank position
        initializeHistory.call(this);

        //Wrap error code in error object
        throw new InvalidDataError(errorCode);
      }

      //Go to the first move
      this.first();
    };

    /**
     * Reload game record
     */
    Game.prototype.reload = function() {
      if (this.jgf) {
        this.load(this.jgf);
      }
    };

    /**
     * Check if we managed to load a valid game record
     */
    Game.prototype.isLoaded = function() {
      return this.root !== null;
    };

    /*****************************************************************************
     * Game cloning and conversion
     ***/

    /**
     * Clone this game
     */
    Game.prototype.clone = function() {

      //Create a new object and get properties
      var clone = new Game();
      var props = Object.getOwnPropertyNames(this);

      //Copy all properties
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        clone[prop] = angular.copy(this[prop]);
      }

      return clone;
    };

    /**
     * Load from an unknown data source
     */
    Game.prototype.fromData = function(data) {

      //No data, can't do much
      if (!data) {
        throw ngGo.error.NO_DATA;
      }

      //String given, could be stringified JGF, an SGF or GIB file
      if (typeof data === 'string') {
        var c = data.charAt(0);
        if (c === '(') {
          return this.fromSgf(data);
        }
        else if (c === '{' || c === '[') {
          return this.fromJgf(data);
        }
        else if (c === '\\') {
          return this.fromGib(data);
        }
        else {
          throw ngGo.error.UNKNOWN_DATA;
        }
      }

      //Object given? Probably a JGF object
      else if (typeof data === 'object') {
        this.fromJgf(data);
      }

      //Something else?
      else {
        throw ngGo.error.UNKNOWN_DATA;
      }
    };

    /**
     * Load from GIB data
     */
    Game.prototype.fromGib = function(gib) {

      //Use the kifu parser
      var jgf = KifuParser.gib2jgf(gib);
      if (!jgf) {
        throw ngGo.error.INVALID_GIB;
      }

      //Now load from JGF
      this.fromJgf(jgf);
    };

    /**
     * Load from SGF data
     */
    Game.prototype.fromSgf = function(sgf) {

      //Use the kifu parser
      var jgf = KifuParser.sgf2jgf(sgf);
      if (!jgf) {
        throw ngGo.error.INVALID_SGF;
      }

      //Now load from JGF
      this.fromJgf(jgf);
    };

    /**
     * Load from JGF data
     */
    Game.prototype.fromJgf = function(jgf) {

      //Parse jgf string
      if (typeof jgf === 'string') {
        try {
          jgf = angular.fromJson(jgf);
        }
        catch (error) {
          throw ngGo.error.INVALID_JGF_JSON;
        }
      }

      //If array given, convert to object with only tree
      if (angular.isArray(jgf)) {
        jgf = {
          tree: jgf
        };
      }

      //Parse tree string
      if (typeof jgf.tree === 'string') {
        if (jgf.tree.charAt(0) === '[') {
          try {
            jgf.tree = angular.fromJson(jgf.tree);
          }
          catch (error) {
            throw ngGo.error.INVALID_JGF_TREE_JSON;
          }
        }
        else {
          jgf.tree = [];
        }
      }

      //Copy all properties except moves tree
      for (var i in jgf) {
        if (jgf.hasOwnProperty(i) && i !== 'tree') {
          this.info[i] = angular.copy(jgf[i]);
        }
      }

      //Validate info
      validateInfo.call(this);

      //Create root node
      this.root = new GameNode();

      //Tree given? Load all the moves
      if (jgf.tree) {
        this.root.fromJgf(jgf.tree);
      }

      //Remember JGF
      this.jgf = jgf;
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
      var jgf = KifuBlank.jgf();
      var props = Object.getOwnPropertyNames(this);

      //Copy properties
      for (var p = 0; p < props.length; p++) {

        //Skip root
        if (p === 'root') {
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
      return stringify ? angular.toJson(jgf) : jgf;
    };

    /*****************************************************************************
     * Getters
     ***/

    /**
     * Get current node
     */
    Game.prototype.getNode = function() {
      return this.node;
    };

    /**
     * Get nodes array for currently remembered path
     */
    Game.prototype.getNodes = function() {

      //Initialize node to process
      var node = this.root;
      var nodes = [node];

      //Process children
      while (node) {
        node = node.getChild(node.rememberedPath);
        if (node) {
          nodes.push(node);
        }
      }

      //Return nodes
      return nodes;
    };

    /**
     * Get node for a certain move
     */
    Game.prototype.getMoveNode = function(move) {
      var nodes = this.getMoveNodes(move, move);
      return nodes.length ? nodes[0] : null;
    };

    /**
     * Get move nodes restricted by given move numbers
     */
    Game.prototype.getMoveNodes = function(fromMove, toMove) {

      //Get all nodes for the current path
      var nodes = this.getNodes();

      //Use sensible defaults if no from/to moves given
      fromMove = fromMove || 1;
      toMove = toMove || nodes.length;

      //Filter
      return nodes.filter(function(node) {
        if (node.isMove()) {
          var move = node.getMoveNumber();
          return (move >= fromMove && move <= toMove);
        }
        return false;
      });
    };

    /**
     * Get current move number
     */
    Game.prototype.getMove = function() {
      if (this.node) {
        return this.node.getMoveNumber();
      }
      return 0;
    };

    /**
     * Get the number of moves in the main branch
     */
    Game.prototype.getMoveCount = function() {
      var moveNodes = this.getMoveNodes();
      return moveNodes.length;
    };

    /**
     * Get the move variation for given coordinates
     */
    Game.prototype.getMoveVariation = function(x, y) {
      if (this.node) {
        return this.node.getMoveVariation(x, y);
      }
      return -1;
    };

    /**
     * Get the current game position
     */
    Game.prototype.getPosition = function() {
      return this.position;
    };

    /**
     * Get the game path
     */
    Game.prototype.getPath = function(clone) {
      if (clone) {
        return this.path.clone();
      }
      return this.path;
    };

    /**
     * Clone the current game path
     */
    Game.prototype.clonePath = function() {
      return this.path.clone();
    };

    /**
     * Get the game path to a certain named node
     */
    Game.prototype.getPathToNode = function(nodeName) {
      return GamePath.findNode(nodeName, this.root);
    };

    /**
     * Get the game komi
     */
    Game.prototype.getKomi = function() {
      var komi = this.get('game.komi', 0);
      return parseFloat(komi);
    };

    /**
     * Set the game komi
     */
    Game.prototype.setKomi = function(komi) {
      if (typeof komi === 'undefined') {
        komi = this.config.defaultKomi;
      }
      this.info.game.komi = parseFloat(komi);
    };

    /**
     * Get the game name
     */
    Game.prototype.getName = function() {
      return this.get('game.name', '');
    };

    /**
     * Get the game result
     */
    Game.prototype.getResult = function() {
      return this.get('game.result', '');
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
    Game.prototype.get = function(property, defaultValue) {

      //Must have a property
      if (!property) {
        return;
      }

      //The item's property in the object is given by dot separated strings
      if (typeof property === 'string') {
        property = property.split('.');
      }

      //Initialize object we're getting info from
      var obj = this.info;
      var key;

      //Loop the properties
      for (var p = 0; p < property.length; p++) {

        //Get actual key
        key = property[p];

        //Last key reached? Done, get value
        if ((p + 1) === property.length) {
          if (typeof obj[key] === 'undefined') {
            return defaultValue;
          }
          return obj[key];
        }

        //Must be object container
        if (typeof obj[key] !== 'object') {
          console.warn('Game info property', key, 'is not an object');
          return defaultValue;
        }

        //Move up in tree
        obj = obj[key];
      }
    };

    /*****************************************************************************
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
      return false;
    };

    /**
     * Check if a given position is repeating within this game
     */
    Game.prototype.isRepeatingPosition = function(checkPosition) {

      //Init
      var stop;

      //Check for ko only? (Last two positions)
      if (this.config.checkRepeat === 'KO' && (this.history.length - 2) >= 0) {
        stop = this.history.length - 2;
      }
      //Check all history?
      else if (this.config.checkRepeat === 'ALL') {
        stop = 0;
      }
      //Not repeating
      else {
        return false;
      }

      //Loop history of positions to check
      for (var i = this.history.length - 2; i >= stop; i--) {
        if (checkPosition.isSameAs(this.history[i])) {
          return true;
        }
      }

      //Not repeating
      return false;
    };

    /**
     * Wrapper for validateMove() returning a boolean and catching any errors
     */
    Game.prototype.isValidMove = function(x, y, color) {
      try {
        this.validateMove(x, y, color);
        return true;
      }
      catch (error) {
        return false;
      }
    };

    /**
     * Check if a move is valid. If valid, the new game position object is returned.
     * You can supply a pre-created position to use, or the current position is cloned.
     */
    Game.prototype.validateMove = function(x, y, color, newPosition) {

      //Check coordinates validity
      if (!this.isOnBoard(x, y)) {
        throw new InvalidPositionError(ngGo.error.POSTITION_OUT_OF_BOUNDS, x, y, color);
      }

      //Something already here?
      if (this.position.stones.get(x, y) !== StoneColor.EMPTY) {
        throw new InvalidPositionError(ngGo.error.POSTITION_ALREADY_HAS_STONE, x, y, color);
      }

      //Set color of move to make
      color = color || this.position.getTurn();

      //Determine position to use
      newPosition = newPosition || this.position.clone();

      //Place the stone
      newPosition.stones.set(x, y, color);

      //Capture adjacent stones if possible
      var captures = newPosition.captureAdjacent(x, y);

      //No captures occurred? Check if the move we're making is a suicide move
      if (!captures) {

        //No liberties for the group we've just created?
        if (!newPosition.hasLiberties(x, y)) {

          //Capture the group if it's allowed
          if (this.config.allowSuicide) {
            newPosition.captureGroup(x, y);
          }

          //Invalid move
          else {
            throw new InvalidPositionError(ngGo.error.POSTITION_IS_SUICIDE, x, y, color);
          }
        }
      }

      //Check history for repeating moves
      if (this.config.checkRepeat && this.isRepeatingPosition(newPosition)) {
        throw new InvalidPositionError(ngGo.error.POSTITION_IS_REPEATING, x, y, color);
      }

      //Set proper turn
      newPosition.setTurn(-color);

      //Move is valid
      return newPosition;
    };

    /**
     * Check if a stone (setup) placement is valid.
     */
    Game.prototype.validatePlacement = function(x, y, color, position) {

      //Check coordinates validity
      if (!this.isOnBoard(x, y)) {
        throw new InvalidPositionError(ngGo.error.POSTITION_OUT_OF_BOUNDS, x, y, color);
      }

      //Place the stone
      position.stones.set(x, y, color);

      //Empty spot? Don't need to check for captures
      if (color === StoneColor.EMPTY) {
        return;
      }

      //Capture adjacent stones if possible
      var captures = position.captureAdjacent(x, y);

      //No captures occurred? Check if the move we're making is a suicide move
      if (!captures) {

        //No liberties for the group we've just created? Capture it
        if (!position.hasLiberties(x, y)) {
          position.captureGroup(x, y);
        }
      }
    };

    /*****************************************************************************
     * Stone and markup handling
     ***/

    /**
     * Add a stone
     */
    Game.prototype.addStone = function(x, y, color) {

      //Check if there's anything to do at all
      if (this.position.stones.is(x, y, color)) {
        return;
      }

      //Create temporary position
      var tempPosition = this.position.clone();

      //Validate placement on temp position
      this.validatePlacement(x, y, color, tempPosition);

      //No setup instructions container in this node?
      if (typeof this.node.setup === 'undefined') {

        //Is this a move node?
        if (this.node.isMove()) {

          //Clone our position
          pushPosition.call(this);

          //Create new node
          var node = new GameNode();

          //Append it to the current node and change the pointer
          var i = node.appendTo(this.node);
          this.node = node;

          //Advance path to the added node index
          this.path.advance(i);
        }

        //Create setup container in this node
        this.node.setup = [];
      }

      //Replace current position
      replacePosition.call(this, tempPosition);

      //Add setup instructions to node
      this.node.setup.push(this.position.stones.get(x, y, 'color'));
    };

    /**
     * Add markup
     */
    Game.prototype.addMarkup = function(x, y, markup) {

      //No markup instructions container in this node?
      if (typeof this.node.markup === 'undefined') {
        this.node.markup = [];
      }

      //Add markup to game position
      this.position.markup.set(x, y, markup);

      //Add markup instructions to node
      this.node.markup.push(this.position.markup.get(x, y, 'type'));
    };

    /**
     * Remove a stone
     */
    Game.prototype.removeStone = function(x, y) {

      //Check if the stone is found in setup instructions
      var foundInSetup = false;

      //Remove from node setup instruction
      if (typeof this.node.setup !== 'undefined') {
        for (var i = 0; i < this.node.setup.length; i++) {
          if (x === this.node.setup[i].x && y === this.node.setup[i].y) {

            //Remove from node and unset in position
            this.node.setup.splice(i, 1);
            this.position.stones.unset(x, y);

            //Mark as found
            foundInSetup = true;
            break;
          }
        }
      }

      //Not found in setup? Add as no stone color
      if (!foundInSetup) {
        this.addStone(x, y, StoneColor.EMPTY);
      }
    };

    /**
     * Remove markup
     */
    Game.prototype.removeMarkup = function(x, y) {

      //Remove from node
      if (typeof this.node.markup !== 'undefined') {
        for (var i = 0; i < this.node.markup.length; i++) {
          if (x === this.node.markup[i].x && y === this.node.markup[i].y) {
            this.node.markup.splice(i, 1);
            this.position.markup.unset(x, y);
            break;
          }
        }
      }
    };

    /**
     * Check if there is a stone at the given coordinates for the current position
     */
    Game.prototype.hasStone = function(x, y, color) {
      if (typeof color !== 'undefined') {
        return this.position.stones.is(x, y, color);
      }
      return this.position.stones.has(x, y);
    };

    /**
     * Check if there is markup at the given coordinate for the current position
     */
    Game.prototype.hasMarkup = function(x, y, type) {
      if (typeof type !== 'undefined') {
        return this.position.markup.is(x, y, type);
      }
      return this.position.markup.has(x, y);
    };

    /**
     * Get stone on coordinates
     */
    Game.prototype.getStone = function(x, y) {
      return this.position.stones.get(x, y);
    };

    /**
     * Get markup on coordinates
     */
    Game.prototype.getMarkup = function(x, y) {
      return this.position.markup.get(x, y);
    };

    /*****************************************************************************
     * Move handling
     ***/

    /**
     * Play move
     */
    Game.prototype.play = function(x, y, color) {

      //Color defaults to current turn
      color = color || this.position.getTurn();

      //Validate move and get new position
      var newPosition = this.validateMove(x, y, color);

      //Check whether the move is in the existed child nodes
      //If so, simply move to the existed node
      var existedIndex = findMoveIndexInChildNodes.call(this, x, y, color);
      if (existedIndex !== null) {

        //Push the new position
        pushPosition.call(this, newPosition);

        //Remember the path
        this.node.rememberedPath = existedIndex;

        //Change the current node pointer
        this.node = this.node.children[existedIndex];

        //Advance the path
        this.path.advance(existedIndex);
        return true;
      }

      //Push new position
      pushPosition.call(this, newPosition);

      //Create new move node
      var node = new GameNode({
        move: {
          x: x,
          y: y,
          color: color
        }
      });

      //Append it to the current node, remember the path, and change the pointer
      var i = node.appendTo(this.node);
      this.node.rememberedPath = i;
      this.node = node;

      //Advance path to the added node index
      this.path.advance(i);

      //Valid move
      return true;
    };

    /**
     * Play pass
     */
    Game.prototype.pass = function(color) {

      //Color defaults to current turn
      color = color || this.position.getTurn();

      //Initialize new position and switch the turn
      var newPosition = this.position.clone();
      newPosition.setTurn(-color);

      //Push new position
      pushPosition.call(this, newPosition);

      //Create new move node
      var node = new GameNode({
        move: {
          pass: true,
          color: color
        }
      });

      //Append it to the current node, remember the path, and change the pointer
      var i = node.appendTo(this.node);
      this.node.rememberedPath = i;
      this.node = node;

      //Advance path to the added node index
      this.path.advance(i);
    };

    /**
     * Undo the placed stones.
     */
    Game.prototype.undo = function() {

      //Validate if we can undo
      if (!this.node.parent || this.node.hasChildren()) {
        return false;
      }

      //Get the parent node
      var parentNode = this.node.parent;

      //Remove the current node
      this.node.remove();

      //Set the pointer to the parent node
      this.node = parentNode;

      //Retreat the path
      this.path.retreat();

      //Pop the last position
      popPosition.call(this);

      //Valid operation
      return true;
    };

    /*****************************************************************************
     * Game tree navigation
     ***/

    /**
     * Go to the next position
     */
    Game.prototype.next = function(i) {

      //Object (node) given as parameter? Find index
      if (typeof i === 'object') {
        i = this.node.children.indexOf(i);
      }

      //Go to the next node
      if (nextNode.call(this, i)) {

        //If an invalid move is detected, we can't go on
        try {
          executeNode.call(this);
          return true;
        }
        catch (error) {
          previousNode.call(this);
          throw error;
        }
      }

      //Didn't go to next position
      return false;
    };

    /**
     * Go to the previous position
     */
    Game.prototype.previous = function() {

      //Go to the previous node
      if (previousNode.call(this)) {
        popPosition.call(this);
        return true;
      }

      //Didn't go to previous position
      return false;
    };

    /**
     * Go to the last position
     */
    Game.prototype.last = function() {

      //Keep going to the next node until we reach the end
      while (nextNode.call(this)) {

        //If an invalid move is detected, we can't go on
        try {
          executeNode.call(this);
        }
        catch (error) {
          previousNode.call(this);
          throw error;
        }
      }
    };

    /**
     * Go to the first position
     */
    Game.prototype.first = function() {

      //Go to the first node
      firstNode.call(this);

      //Create the initial position, clone it and parse the current node
      initializeHistory.call(this);
      executeNode.call(this);
    };

    /**
     * Go to position specified by a path object, a numeric move numer, or a node name string
     */
    Game.prototype.goto = function(target) {

      //Must have a tree
      if (this.root === null) {
        return;
      }

      //Nothing given?
      if (typeof target === 'undefined') {
        return;
      }

      //Function given? Call now
      if (typeof target === 'function') {
        target = target.call(this);
      }

      //Initialize path
      var path;

      //Simple move number? Convert to path object
      if (typeof target === 'number') {
        path = this.path.clone();
        path.setMove(target);
      }

      //String? Named node
      else if (typeof target === 'string') {

        //Already here?
        if (this.node.name === target) {
          return;
        }

        //Find path to node
        path = this.getPathToNode(target);
        if (path === null) {
          return;
        }
      }

      //Otherwise assume path object
      else {
        path = target;
      }

      //Already here?
      if (this.path.compare(path)) {
        return;
      }

      //Go to the first node
      firstNode.call(this);

      //Create the initial position, clone it and parse the current node
      initializeHistory.call(this);
      pushPosition.call(this);
      executeNode.call(this);

      //Loop path
      var n = path.getMove();
      for (var i = 0; i < n; i++) {

        //Try going to the next node
        if (!nextNode.call(this, path.nodeAt(i))) {
          break;
        }

        //If an invalid move is detected, we can't go on
        try {
          executeNode.call(this);
        }
        catch (error) {
          previousNode.call(this);
          throw error;
        }
      }
    };

    /**
     * Go to the next fork
     */
    Game.prototype.nextFork = function() {

      //Keep going to the next node until we reach one with multiple children
      while (nextNode.call(this)) {

        //If an invalid move is detected, we can't go on
        try {
          executeNode.call(this);
        }
        catch (error) {
          previousNode.call(this);
          throw error;
        }

        //Have multiple children?
        if (this.node.children.length > 1) {
          break;
        }
      }
    };

    /**
     * Go to the previous fork
     */
    Game.prototype.previousFork = function() {

      //Loop until we find a node with more than one child
      while (previousNode.call(this)) {
        popPosition.call(this);
        if (this.node.children.length > 1) {
          break;
        }
      }
    };

    /**
     * Go to the next move with comments
     */
    Game.prototype.nextComment = function() {

      //Keep going to the next node until we find one with comments
      while (nextNode.call(this)) {

        //If an invalid move is detected, we can't go on
        try {
          executeNode.call(this);
        }
        catch (error) {
          previousNode.call(this);
          throw error;
        }

        //Comments found?
        if (this.node.hasComments()) {
          break;
        }
      }
    };

    /**
     * Go to the previous move with comments
     */
    Game.prototype.previousComment = function() {

      //Go back until we find a node with comments
      while (previousNode.call(this)) {

        //Pop the position
        popPosition.call(this);

        //Comments found?
        if (this.node.hasComments()) {
          break;
        }
      }
    };

    /*****************************************************************************
     * State handling
     ***/

    /**
     * Get the board state
     */
    Game.prototype.getState = function() {

      //Can only create when we have a JGF and path
      if (!this.jgf || !this.path) {
        return null;
      }

      //Create state
      var state = {
        jgf: this.jgf,
        path: this.path.clone()
      };

      //Return
      return state;
    };

    /**
     * Restore the game state
     */
    Game.prototype.restoreState = function(state) {

      //Must have jgf and path
      if (!state || !state.jgf || !state.path) {
        return;
      }

      //Restore state
      this.load(state.jgf);
      this.goto(state.path);
    };

    //Return object
    return Game;
  };
});
