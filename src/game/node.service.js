
/**
 * GameNode :: This class represents a single node in the game moves tree. It contains
 * properties like the x and y grid coordinates, the move played, board setup instructions,
 * markup, player turn and comments. The moves tree in the game record is represented by a
 * string of GameNodes, each with pointers to their parent and children. Each node can have
 * multiple children (move variations), but only one parent.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Node.Service', [
  'ngGo'
])

/**
 * Factory definition
 */
.factory('GameNode', function(StoneColor) {

  /**
   * Character index of "a"
   */
  var aChar = 'a'.charCodeAt(0);

  /**
   * Helper to convert SGF coordinates
   */
  var convertCoordinates = function(coords) {
    return [coords.charCodeAt(0) - aChar, coords.charCodeAt(1) - aChar];
  };

  /**
   * Helper to construct a coordinates base object
   */
  var coordinatesObject = function(coords, baseObject) {
    baseObject = baseObject || {};
    if (coords === '' || coords === 'pass') {
      baseObject.pass = true;
    }
    else {

      //Backwards compatibility with SGF string coordinates in JGF
      if (typeof coords === 'string') {
        coords = convertCoordinates(coords);
      }

      //Append coordinates
      baseObject.x = coords[0] * 1;
      baseObject.y = coords[1] * 1;
    }
    return baseObject;
  };

  /**
   * Convert a numeric color value (color constant) to a string
   */
  var toStringColor = function(color) {
    return (color === StoneColor.B) ? 'B' : (((color === StoneColor.W) ? 'W' : ''));
  };

  /**
   * Convert a string color value to a numeric color constant
   */
  var toColorConstant = function(color) {
    if (color === 'B') {
      return StoneColor.B;
    }
    else if (color === 'W') {
      return StoneColor.W;
    }
    return StoneColor.E;
  };

  /*****************************************************************************
   * Helpers for conversion between JGF / KIFU format
   ***/

  /**
   * Convert move object to JGF format
   */
  var convertMoveToJgf = function(move) {

    //Initialize JGF move object and determine color
    var jgfMove = angular.copy(move);
    var color = toStringColor(move.color);

    //No color?
    if (color === '') {
      return null;
    }

    //Pass move?
    if (move.pass === true) {
      jgfMove[color] = 'pass';
    }

    //Regular move
    else {
      jgfMove[color] = [move.x, move.y];
    }

    //Delete coordinates and color
    delete jgfMove.x;
    delete jgfMove.y;
    delete jgfMove.color;

    //Return move
    return jgfMove;
  };

  /**
   * Convert move from JGF format
   */
  var convertMoveFromJgf = function(move) {

    //Prepare color, coordinates
    var color, coords;

    //Check whose move it was
    if (move.W) {
      color = 'W';
      coords = move.W;
    }
    else if (move.B) {
      color = 'B';
      coords = move.B;
    }

    //No coordinates?
    if (!coords) {
      return null;
    }

    //Return coordinates object
    return coordinatesObject(coords, {
      color: toColorConstant(color)
    });
  };

  /**
   * Convert setup object to JGF format
   */
  var convertSetupToJgf = function(setup) {

    //Initialize variables
    var i, color;
    var jgfSetup = {};

    //Loop setup objects
    for (i in setup) {
      if (setup.hasOwnProperty(i)) {

        //Get color
        color = toStringColor(setup[i].color) || 'E';

        //Initialize array
        if (typeof jgfSetup[color] === 'undefined') {
          jgfSetup[color] = [];
        }

        //Add coordinates
        jgfSetup[color].push([setup[i].x, setup[i].y]);
      }
    }

    //Return
    return jgfSetup;
  };

  /**
   * Convert setup from JGF format
   */
  var convertSetupFromJgf = function(setup) {

    //Initialize variables
    var c, key, color;
    var gameSetup = [];

    //Loop setup
    for (key in setup) {
      if (setup.hasOwnProperty(key)) {

        //Get color constant
        color = toColorConstant(key);

        //Loop coordinates
        for (c in setup[key]) {
          if (setup[key].hasOwnProperty(c)) {
            gameSetup.push(coordinatesObject(setup[key][c], {
              color: color
            }));
          }
        }
      }
    }

    //Return
    return gameSetup;
  };

  /**
   * Convert markup object to JGF format
   */
  var convertMarkupToJgf = function(markup) {

    //Initialize variables
    var i, type;
    var jgfMarkup = {};

    //Loop setup objects
    for (i in markup) {
      if (markup.hasOwnProperty(i)) {

        //Get type
        type = markup[i].type;

        //Initialize array
        if (typeof jgfMarkup[type] === 'undefined') {
          jgfMarkup[type] = [];
        }

        //Label?
        if (type === 'label') {
          jgfMarkup[type].push([markup[i].x, markup[i].y, markup[i].text]);
        }
        else {
          jgfMarkup[type].push([markup[i].x, markup[i].y]);
        }
      }
    }

    //Return
    return jgfMarkup;
  };

  /**
   * Convert markup from JGF format
   */
  var convertMarkupFromJgf = function(markup) {

    //Initialize variables
    var l, type;
    var gameMarkup = [];

    //Loop markup types
    for (type in markup) {
      if (markup.hasOwnProperty(type)) {

        //Label?
        if (type === 'label') {
          for (l = 0; l < markup[type].length; l++) {

            //Validate
            if (!angular.isArray(markup[type][l])) {
              continue;
            }

            //SGF type coordinates?
            if (markup[type][l].length === 2 && typeof markup[type][l][0] === 'string') {
              var text = markup[type][l][1];
              markup[type][l] = convertCoordinates(markup[type][l][0]);
              markup[type][l].push(text);
            }

            //Validate length
            if (markup[type][l].length < 3) {
              continue;
            }

            //Add to stack
            gameMarkup.push(coordinatesObject(markup[type][l], {
              type: type,
              text: markup[type][l][2]
            }));
          }
        }
        else {

          //Loop coordinates
          for (l in markup[type]) {
            if (markup[type].hasOwnProperty(l)) {
              gameMarkup.push(coordinatesObject(markup[type][l], {
                type: type
              }));
            }
          }
        }
      }
    }

    //Return
    return gameMarkup;
  };

  /**
   * Convert turn object to JGF format
   */
  var convertTurnToJgf = function(turn) {
    switch (turn) {
      case StoneColor.W:
        return 'W';
      case StoneColor.B:
        return 'B';
      default:
        return '';
    }
  };

  /**
   * Convert turn from JGF format
   */
  var convertTurnFromJgf = function(turn) {
    switch (turn) {
      case 'W':
        return StoneColor.W;
      case 'B':
        return StoneColor.B;
      default:
        return StoneColor.EMPTY;
    }
  };

  /**
   * Conversions map
   */
  var conversionMap = {
    toJgf: {
      move: convertMoveToJgf,
      setup: convertSetupToJgf,
      markup: convertMarkupToJgf,
      turn: convertTurnToJgf
    },
    fromJgf: {
      move: convertMoveFromJgf,
      setup: convertSetupFromJgf,
      markup: convertMarkupFromJgf,
      turn: convertTurnFromJgf
    }
  };

  /**
   * Constructor
   */
  var GameNode = function(properties, parent) {

    //Set parent and children
    this.parent = parent || null;
    this.children = [];

    //Save properties
    if (properties) {
      for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
          this[key] = properties[key];
        }
      }
    }
  };

  /**
   * Get node's child specified by index or null if doesn't exist
   */
  GameNode.prototype.getChild = function(i) {
    i = i || 0;
    if (this.children[i]) {
      return this.children[i];
    }
    return null;
  };

  /**
   * Get all the children
   */
  GameNode.prototype.getChildren = function() {
    return this.children;
  };

  /**
   * Check if the node has any chilren
   */
  GameNode.prototype.hasChildren = function() {
    return (this.children.length > 0);
  };

  /**
   * Get parent node
   */
  GameNode.prototype.getParent = function() {
    return this.parent;
  };

  /**
   * Check if the node has more than one move variation
   */
  GameNode.prototype.hasMoveVariations = function() {

    //Less than two child nodes?
    if (this.children.length <= 1) {
      return false;
    }

    //Loop children
    var moveVariations = 0;
    for (var i = 0; i < this.children.length; i++) {

      //Is this a move node?
      if (this.children[i].isMove()) {
        moveVariations++;
      }

      //More than one move node present?
      if (moveVariations > 1) {
        return true;
      }
    }

    //No move variations
    return false;
  };

  /**
   * Get all the move variation nodes
   */
  GameNode.prototype.getMoveVariations = function() {

    //No child nodes?
    if (this.children.length === 0) {
      return false;
    }

    //Initialize
    var moveVariations = [];

    //Loop child nodes
    for (var i = 0; i < this.children.length; i++) {

      //Is this a move node?
      if (this.children[i].isMove()) {
        moveVariations.push(this.children[i]);
      }
    }

    //Return
    return moveVariations;
  };

  /**
   * Get the move variation for given coordinates
   */
  GameNode.prototype.getMoveVariation = function(x, y) {

    //Loop the child nodes
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].move && this.children[i].move.x === x && this.children[i].move.y === y) {
        return i;
      }
    }

    //Not found
    return -1;
  };

  /**
   * Check if given coordinates are one of the next child node coordinates
   */
  GameNode.prototype.isMoveVariation = function(x, y) {

    //Loop the child nodes
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].move && this.children[i].move.x === x && this.children[i].move.y === y) {
        return true;
      }
    }

    //Not found
    return false;
  };

  /**
   * Check if we have comments
   */
  GameNode.prototype.hasComments = function() {
    return (this.comments && this.comments.length > 0);
  };

  /**
   * Check if this is a move node
   */
  GameNode.prototype.isMove = function() {
    return !!this.move;
  };

  /**
   * Get move number
   */
  GameNode.prototype.getMoveNumber = function() {

    //Move node?
    if (this.isMove()) {
      if (this.parent) {
        return this.parent.getMoveNumber() + 1;
      }
      return 1;
    }

    //Use parent move number if we have one
    if (this.parent) {
      return this.parent.getMoveNumber();
    }

    //No parent
    return 0;
  };

  /*****************************************************************************
   * Node manipulation
   ***/

  /**
   * Remove this node from its parent
   */
  GameNode.prototype.remove = function() {

    //Can't remove if no parent
    if (!this.parent) {
      return;
    }

    //Find the index of this node, and if found remove it
    var i = this.parent.children.indexOf(this);
    if (i !== -1) {
      this.parent.children.splice(i, 1);
    }

    //Clear parent reference
    this.parent = null;
  };

  /**
   * Move the node up in the parent's child tree
   */
  GameNode.prototype.moveUp = function() {

    //Can't move if no parent
    if (!this.parent) {
      return;
    }

    //Find the index of this node, and if found swap the nodes from position
    var i = this.parent.children.indexOf(this);
    if (i > 0) {
      var temp = this.parent.children[i - 1];
      this.parent.children[i - 1] = this;
      this.parent.children[i] = temp;
    }
  };

  /**
   * Move the node down in the parent's child tree
   */
  GameNode.prototype.moveDown = function() {

    //Can't move if no parent
    if (!this.parent) {
      return;
    }

    //Find the index of this node, and if found swap the nodes from position
    var i = this.parent.children.indexOf(this);
    if (i !== -1 && i < (this.parent.children.length - 1)) {
      var temp = this.parent.children[i + 1];
      this.parent.children[i + 1] = this;
      this.parent.children[i] = temp;
    }
  };

  /**
   * Append this node to another node
   */
  GameNode.prototype.appendTo = function(node) {

    //Remove from existing parent
    this.remove();

    //Set new parent
    this.parent = node;
    node.children.push(this);
    return node.children.length - 1;
  };

  /**
   * Append child node to this node.
   */
  GameNode.prototype.appendChild = function(node) {
    node.parent = this;
    this.children.push(node);
    return this.children.length - 1;
  };

  /**
   * Insert another node after this one
   */
  GameNode.prototype.insertNode = function(node) {

    //Loop our children and change parent node
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].parent = node;
    }

    //Merge children, set this node as the parent of given node
    node.children = node.children.concat(this.children);
    node.parent = this;

    //Set given node as the child of this node
    this.children = [node];
  };

  /*****************************************************************************
   * JGF conversion
   ***/

  /**
   * Build a Game Node from a given JGF tree
   */
  GameNode.prototype.fromJgf = function(jgf, gameNode) {

    //Root JGF file given?
    if (typeof jgf.tree !== 'undefined') {
      return GameNode.fromJgf(jgf.tree, gameNode);
    }

    //Initialize helper vars
    var variationNode, nextNode, i, j;

    //Node to work with given? Otherwise, work with ourselves
    gameNode = gameNode || this;

    //Loop moves in the JGF tree
    for (i = 0; i < jgf.length; i++) {

      //Array? That means a variation branch
      if (angular.isArray(jgf[i])) {

        //Loop variation stacks
        for (j = 0; j < jgf[i].length; j++) {

          //Build the variation node
          variationNode = new GameNode();
          variationNode.fromJgf(jgf[i][j]);

          //Append to working node
          gameNode.appendChild(variationNode);
        }
      }

      //Regular node
      else {

        //Get properties to copy
        var properties = Object.getOwnPropertyNames(jgf[i]);

        //Copy node properties
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            var prop = properties[key];

            //Conversion function present?
            if (typeof conversionMap.fromJgf[prop] !== 'undefined') {
              gameNode[prop] = conversionMap.fromJgf[prop](jgf[i][prop]);
            }
            else if (typeof jgf[i][prop] === 'object') {
              gameNode[prop] = angular.copy(jgf[i][prop]);
            }
            else {
              gameNode[prop] = jgf[i][prop];
            }
          }
        }
      }

      //Next element is a regular node? Prepare new working node
      //Otherwise, if there are no more nodes or if the next element is
      //an array (e.g. variations), we keep our working node as the current one
      if ((i + 1) < jgf.length && !angular.isArray(jgf[i + 1])) {
        nextNode = new GameNode();
        gameNode.appendChild(nextNode);
        gameNode = nextNode;
      }
    }
  };

  /**
   * Convert this node to a JGF node container
   */
  GameNode.prototype.toJgf = function(container) {

    //Initialize container to add nodes to
    container = container || [];

    //Initialize node and get properties
    var node = {};
    var properties = Object.getOwnPropertyNames(this);

    //Copy node properties
    for (var key in properties) {
      if (properties.hasOwnProperty(key)) {
        var prop = properties[key];

        //Skip some properties
        if (prop === 'parent' || prop === 'children') {
          continue;
        }

        //Conversion function present?
        if (typeof conversionMap.toJgf[prop] !== 'undefined') {
          node[prop] = conversionMap.toJgf[prop](this[prop]);
        }
        else if (typeof this[prop] === 'object') {
          node[prop] = angular.copy(this[prop]);
        }
        else {
          node[prop] = this[prop];
        }
      }
    }

    //Add node to container
    container.push(node);

    //Variations present?
    if (this.children.length > 1) {

      //Create variations container
      var variationsContainer = [];
      container.push(variationsContainer);

      //Loop child (variation) nodes
      for (var i = 0; i < this.children.length; i++) {

        //Create container for this variation
        var variationContainer = [];
        variationsContainer.push(variationContainer);

        //Call child node converter
        this.children[i].toJgf(variationContainer);
      }
    }

    //Just one child?
    else if (this.children.length === 1) {
      this.children[0].toJgf(container);
    }

    //Return container
    return container;
  };

  //Return object
  return GameNode;
});
