
/**
 * GamePosition :: This class represents a single game position. It keeps track of the stones and
 * markup on the board in this position, as well as any captures that were made and which player's
 * turn it is. The class is also equipped with helpers to check for liberties, capture stones, and
 * compare changes to other positions.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Position.Service', [
  'ngGo',
  'ngGo.Board.Grid.Service',
])

/**
 * Factory definition
 */
.factory('GamePosition', function(StoneColor, BoardGrid) {

  /**
   * Constructor
   */
  function GamePosition(width, height) {

    //Initialize
    this.error = 0;
    this.width = 0;
    this.height = 0;
    this.stones = new BoardGrid();
    this.markup = new BoardGrid();
    this.turn = StoneColor.B;

    //Initialize captures
    this.captures = {};
    this.captures[StoneColor.B] = [];
    this.captures[StoneColor.W] = [];

    //Set empty value for stones grid
    this.stones.whenEmpty(StoneColor.EMPTY);

    //Set size
    if (width || height) {
      this.setSize(width, height);
    }
  }

  /**
   * Set the grid size
   */
  GamePosition.prototype.setSize = function(width, height) {

    //Check what's given
    width = width || height || 0;
    height = height || width || 0;

    //Set
    this.width = parseInt(width);
    this.height = parseInt(height);

    //Set in grids
    this.stones.setSize(width, height);
    this.markup.setSize(width, height);

    //Empty the position
    this.empty();
  };

  /**
   * Clear the whole position
   */
  GamePosition.prototype.empty = function() {
    this.stones.empty();
    this.markup.empty();
  };

  /**
   * Sets stone color at given coordinates.
   */
  GamePosition.prototype.setStone = function(x, y, color) {
    this.stones.set(x, y, color);
  };

  /**
   * Sets markup type at given coordinates.
   */
  GamePosition.prototype.setMarkup = function(x, y, markup) {
    this.markup.set(x, y, markup);
  };

  /*****************************************************************************
   * Liberties and capturing
   ***/

  /**
   * Check if a group of given color has liberties, starting at the given coordinates
   */
  GamePosition.prototype.hasLiberties = function(x, y, groupColor, tested) {

    //Out of bounds? No liberties outside of the board
    if (!this.stones.isOnGrid(x, y)) {
      return false;
    }

    //Initialize tested grid if needed
    tested = tested || new BoardGrid(this.width, this.height);

    //See what color is present on the coordinates
    let color = this.stones.get(x, y);

    //If no group color was given, use what's on the position
    groupColor = groupColor || color;

    //Already tested, or enemy stone? Not giving any liberties
    if (tested.get(x, y) === true || color === -groupColor) {
      return false;
    }

    //Empty? That's a liberty
    if (color === StoneColor.EMPTY) {
      return true;
    }

    //Mark this position as tested now
    tested.set(x, y, true);

    //Ok, so we're looking at a stone of our own color. Test adjacent positions.
    //If we get at least one true, we have a liberty
    return this.hasLiberties(x, y - 1, groupColor, tested) ||
        this.hasLiberties(x, y + 1, groupColor, tested) ||
        this.hasLiberties(x - 1, y, groupColor, tested) ||
        this.hasLiberties(x + 1, y, groupColor, tested);
  };

  /**
   * Helper to capture adjacent groups
   */
  GamePosition.prototype.captureAdjacent = function(x, y, friendlyColor) {

    //Validate boundaries
    if (!this.stones.isOnGrid(x, y)) {
      return false;
    }

    //Use color of stone present if none given
    friendlyColor = friendlyColor || this.stones.get(x, y);

    //Can't capture empty spots
    if (friendlyColor === StoneColor.EMPTY) {
      return false;
    }

    //Flag to see if we captured stuff
    let captured = false;

    //Check adjacent positions now, capturing stones in the process if possible
    if (this.canCapture(x, y - 1, -friendlyColor, true)) {
      captured = true;
    }
    if (this.canCapture(x, y + 1, -friendlyColor, true)) {
      captured = true;
    }
    if (this.canCapture(x - 1, y, -friendlyColor, true)) {
      captured = true;
    }
    if (this.canCapture(x + 1, y, -friendlyColor, true)) {
      captured = true;
    }

    //Return
    return captured;
  };

  /**
   * Helper if we can capture a certain group
   */
  GamePosition.prototype.canCapture = function(x, y, enemyColor, doCapture) {

    //Out of bounds? Nothing to capture
    if (!this.stones.isOnGrid(x, y)) {
      return false;
    }

    //Empty spot? Can't capture
    if (this.stones.get(x, y) === StoneColor.EMPTY) {
      return false;
    }

    //Use color of stone present if none given
    enemyColor = enemyColor || this.stones.get(x, y);

    //We need to have a stone of matching group color in order to be able to capture it
    if (this.stones.get(x, y) !== enemyColor) {
      return false;
    }

    //There is a capturable stone, let's see if it has any liberties left
    if (this.hasLiberties(x, y, enemyColor)) {
      return false;
    }

    //No liberties left, the group is capturable. Capture if we want to
    if (doCapture) {
      this.captureGroup(x, y, enemyColor);
    }

    //Capturable
    return true;
  };

  /**
   * Capture a group of certain color, starting at the given coordinates
   */
  GamePosition.prototype.captureGroup = function(x, y, enemyColor) {

    //Validate boundaries
    if (!this.stones.isOnGrid(x, y)) {
      return false;
    }

    //If no group color was given, use what's on the position
    enemyColor = enemyColor || this.stones.get(x, y);

    //Stone at position does not match the given group color? Can't capture it
    if (this.stones.get(x, y) !== enemyColor) {
      return false;
    }

    //Capture the stone
    this.captureStone(x, y);

    //Capture the rest of the group
    this.captureGroup(x, y - 1, enemyColor);
    this.captureGroup(x, y + 1, enemyColor);
    this.captureGroup(x - 1, y, enemyColor);
    this.captureGroup(x + 1, y, enemyColor);

    //At least one stone was captured
    return true;
  };

  /**
   * Capture a stone at given coordinates
   */
  GamePosition.prototype.captureStone = function(x, y) {

    //Validate boundaries
    if (!this.stones.isOnGrid(x, y)) {
      return;
    }

    //Get color
    let color = this.stones.get(x, y);

    //Empty?
    if (color === StoneColor.EMPTY) {
      return;
    }

    //Ok, stone present, capture it
    this.stones.set(x, y, StoneColor.EMPTY);
    this.captures[color].push({x: x, y: y});
  };

  /**
   * Set captures for a color (expects array with capture object coordinates)
   */
  GamePosition.prototype.setCaptures = function(color, captures) {
    this.captures[color] = captures;
  };

  /**
   * Get captures for a color
   */
  GamePosition.prototype.getCaptures = function(color) {
    return this.captures[color] || [];
  };

  /**
   * Get the capture count for a color (= the number of captures of the opposing color)
   */
  GamePosition.prototype.getCaptureCount = function(color) {
    return this.captures[-color].length;
  };

  /*****************************************************************************
   * Turn control
   ***/

  /**
   * Set color for whose move it is at this position
   */
  GamePosition.prototype.setTurn = function(color) {
    this.turn = color;
  };

  /**
   * Get color for whose move it is at this position
   */
  GamePosition.prototype.getTurn = function() {
    return this.turn;
  };

  /**
   * Switch the player turn on this position
   */
  GamePosition.prototype.switchTurn = function() {
    this.turn = -this.turn;
  };

  /*****************************************************************************
   * Cloning and comparison
   ***/

  /**
   * Clones the whole position except turn and captures
   */
  GamePosition.prototype.clone = function() {

    //Create a new position
    let newPosition = new GamePosition();

    //Set vars manually for maximum efficiency
    newPosition.turn = this.turn;
    newPosition.width = this.width;
    newPosition.height = this.height;
    newPosition.stones = this.stones.clone();
    newPosition.markup = new BoardGrid(this.width, this.height);

    //Return
    return newPosition;
  };

  /**
   * Checks if a given position is the same as the current position
   */
  GamePosition.prototype.isSameAs = function(newPosition) {

    //Must have the same size
    if (this.width !== newPosition.width || this.height !== newPosition.height) {
      return false;
    }

    //Compare the grids
    return this.stones.isSameAs(newPosition.stones);
  };

  //Return
  return GamePosition;
});
