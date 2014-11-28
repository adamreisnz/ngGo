
/**
 * GamePosition :: This class represents a single game position. It keeps track of the stones on
 * the board in this position, as well as any captures that were made and which player's turn it is.
 * The class is also equipped with helpers to check for liberties, capture stones, and compare changes
 * to other positions.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Position.Service', [
	'ngGo.Service',
	'ngGo.Board.Grid.Service',
	'ngGo.Game.PositionChanges.Service'
])

/**
 * Factory definition
 */
.factory('GamePosition', function(StoneColor, BoardGrid, GamePositionChanges) {

	/**
	 * Constructor
	 */
	var GamePosition = function(width, height) {

		//Initialize
		this.error = 0;
		this.width = 0;
		this.height = 0;
		this.grid = new BoardGrid();
		this.turn = StoneColor.B;

		//Initialize captures
		this.captures = {};
		this.captures[StoneColor.B] = [];
		this.captures[StoneColor.W] = [];

		//Set size
		if (width || height) {
			this.setSize(width, height);
		}
	};

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

		//Set in grid
		this.grid.setSize(width, height);

		//Clear the position (populates it with empty stones)
		this.clear();
	};

	/**
	 * Returns the stone color at a given coordinates.
	 */
	GamePosition.prototype.get = function(x, y) {
		return this.grid.getObject(x, y);
	};

	/**
	 * Sets value of given coordinates.
	 */
	GamePosition.prototype.set = function(x, y, color) {
		this.grid.setObject(x, y, color || StoneColor.NONE);
	};

	/**
	 * Check if a stone at given coordinates matches the given color
	 */
	GamePosition.prototype.is = function(x, y, color) {
		return (this.grid.getObject(x, y) === color);
	};

	/**
	 * Check if a group of given color has liberties, starting at the given coordinates
	 */
	GamePosition.prototype.hasLiberties = function(x, y, groupColor, tested) {

		//Out of bounds? No liberties outside of the board
		if (!this.grid.isOnGrid(x, y)) {
			return false;
		}

		//Initialize tested grid if needed
		tested = tested || new BoardGrid(this.width, this.height);

		//See what color is present on the coordinates
		var color = this.get(x, y);

		//If no group color was given, use what's on the position
		groupColor = groupColor || color;

		//Already tested, or enemy stone? Not giving any liberties
		if (tested.getObject(x, y) === true || color === -groupColor) {
			return false;
		}

		//Empty? That's a liberty
		if (color === StoneColor.NONE) {
			return true;
		}

		//Mark this position as tested now
		tested.setObject(x, y, true);

		//Ok, so we're looking at a stone of our own color. Test adjacent positions.
		//If we get at least one true, we have a liberty
		return 	this.hasLiberties(x, y-1, groupColor, tested) ||
				this.hasLiberties(x, y+1, groupColor, tested) ||
				this.hasLiberties(x-1, y, groupColor, tested) ||
				this.hasLiberties(x+1, y, groupColor, tested);
	};

	/**
	 * Helper to capture adjacent groups
	 */
	GamePosition.prototype.captureAdjacent = function(x, y, friendlyColor) {

		//Validate boundaries
		if (!this.grid.isOnGrid(x, y)) {
			return false;
		}

		//Use color of stone present if none given
		friendlyColor = friendlyColor || this.get(x, y);

		//Flag to see if we captured stuff
		var captured = false;

		//Check adjacent positions now, capturing stones in the process if possible
		if (this.canCapture(x, y-1, -friendlyColor, true)) {
			captured = true;
		}
		if (this.canCapture(x, y+1, -friendlyColor, true)) {
			captured = true;
		}
		if (this.canCapture(x-1, y, -friendlyColor, true)) {
			captured = true;
		}
		if (this.canCapture(x+1, y, -friendlyColor, true)) {
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
		if (!this.grid.isOnGrid(x, y)) {
			return false;
		}

		//Use color of stone present if none given
		enemyColor = enemyColor || this.get(x, y);

		//We need to have a stone of matching group color in order to be able to capture it
		if (this.get(x, y) !== enemyColor) {
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
		if (!this.grid.isOnGrid(x, y)) {
			return false;
		}

		//If no group color was given, use what's on the position
		enemyColor = enemyColor || this.get(x, y);

		//Stone at position does not match the given group color? Can't capture it
		if (this.get(x, y) !== enemyColor) {
			return false;
		}

		//Capture the stone
		this.captureStone(x, y);

		//Capture the rest of the group
		this.captureGroup(x, y-1, enemyColor);
		this.captureGroup(x, y+1, enemyColor);
		this.captureGroup(x-1, y, enemyColor);
		this.captureGroup(x+1, y, enemyColor);

		//At least one stone was captured
		return true;
	};

	/**
	 * Capture a stone at given coordinates
	 */
	GamePosition.prototype.captureStone = function(x, y) {

		//Validate boundaries
		if (!this.grid.isOnGrid(x, y)) {
			return;
		}

		//Get color
		var color = this.get(x, y);

		//Empty?
		if (color === StoneColor.NONE) {
			return;
		}

		//Ok, stone present, capture it
		this.set(x, y, StoneColor.NONE);
		this.captures[color].push({x:x, y:y});
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

	/**
	 * Clears the whole position
	 */
	GamePosition.prototype.clear = function() {
		this.grid.populateObjects(StoneColor.NONE);
	};

	/**
	 * Clones the whole position except turn and captures
	 *
	 * @return	object	Copy of this position
	 */
	GamePosition.prototype.clone = function() {

		//Create a new position
		var newPosition = new GamePosition();

		//Set vars manually for maximum efficiency
		newPosition.turn = this.turn;
		newPosition.width = this.width;
		newPosition.height = this.height;
		newPosition.grid = this.grid.clone();

		//Return
		return newPosition;
	};

	/**
	 * Checks if a given position is the same as the current position
	 */
	GamePosition.prototype.isSameAs = function(newPosition) {

		//Must have the same size
		if (this.width != newPosition.width || this.height != newPosition.height) {
			return false;
		}

		//Get the colors for both positions
		var oldColors = this.grid.getObjects(),
			newColors = newPosition.grid.getObjects();

		//Loop all objects
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				if (oldColors[x][y] != newColors[x][y]) {
					return false;
				}
			}
		}

		//No differences found
		return true;
	};

	/**
	 * Compares this position with another position and return change object
	 */
	GamePosition.prototype.compare = function(newPosition) {

		//Create new game position changes object
		var changes = new GamePositionChanges();

		//Must have the same size
		if (this.width != newPosition.width || this.height != newPosition.height) {
			console.warn('Trying to compare positions of a different size');
			return changes;
		}

		//Get the colors for both positions
		var oldColors = this.grid.getObjects(),
			newColors = newPosition.grid.getObjects();

		//Loop all objects
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {

				//Adding a stone?
				if (oldColors[x][y] === StoneColor.NONE && oldColors[x][y] != newColors[x][y]) {
					changes.add.push({
						x: x,
						y: y,
						color: newColors[x][y]
					});
				}

				//Removing a stone?
				if (newColors[x][y] === StoneColor.NONE && oldColors[x][y] != newColors[x][y]) {
					changes.remove.push({
						x: x,
						y: y
					});
				}
			}
		}

		//Return changes
		return changes;
	};

	//Return
	return GamePosition;
});