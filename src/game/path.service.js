
/**
 * GamePath :: A simple class that keeps track of a path taken in a game.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Path.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('GamePath', function() {

	/**
	 * Constructor
	 */
	var GamePath = function() {
		this.reset();
	};

	/**
	 * Reset
	 */
	GamePath.prototype.reset = function() {
		this.move = 0;
		this.path = {};
		this.branches = 0;
		return this;
	};

	/**
	 * Advance a move
	 */
	GamePath.prototype.advance = function(i) {

		//Different child variation chosen? Remember
		if (i > 0) {
			this.path[this.move] = 1;
			this.branches++;
		}

		//Increment move
		this.move++;
		return this;
	};

	/**
	 * Retreat a move
	 */
	GamePath.prototype.retreat = function() {

		//At start?
		if (this.move === 0) {
			return;
		}

		//Delete path choice
		if (this.path[this.move]) {
			delete this.path[this.move];
			this.branches--;
		}

		//Decrement move
		this.move--;
		return this;
	};

	/**
	 * Go to a specific move number
	 */
	GamePath.prototype.setMove = function(no) {

		//Less than our current move? We need to erase any paths above the move number
		if (no < this.move) {
			for (var i in this.path) {
				if (i > no) {
					delete this.path[i];
					this.branches--;
				}
			}
		}

		//Set move number
		this.move = no;
		return this;
	};

	/**
	 * Get the move number
	 */
	GamePath.prototype.getMove = function() {
		return this.move;
	};

	/**
	 * Get the node choice at a specific move number
	 */
	GamePath.prototype.nodeAt = function(no) {
		return (typeof this.path[no] === 'undefined') ? 0 : this.path[no];
	};

	/**
	 * Compare to another path
	 */
	GamePath.prototype.compare = function(otherPath) {

		//Invalid object?
		if (!otherPath || typeof otherPath != 'object' || typeof otherPath.move === 'undefined') {
			return;
		}

		//Different move number or path length?
		if (this.move !== otherPath.move || this.branches != otherPath.branches) {
			return false;
		}

		//Check path
		for (var i in this.path) {
			if (typeof otherPath.path[i] === 'undefined' || this.path[i] != otherPath.path[i]) {
				return false;
			}
		}

		//Same path!
		return true;
	};

	/**
	 * Clone
	 */
	GamePath.prototype.clone = function() {

		//Create new instance
		var newPath = new GamePath();

		//Set vars
		newPath.move = this.move;
		newPath.branches = this.branches;
		newPath.path = angular.copy(this.path);

		//Return
		return newPath;
	};

	/**
	 * Helper to find node name recursively
	 */
	var findNodeName = function(node, nodeName, path) {

		//Found in this node?
		if (node.name && node.name === nodeName) {
			return true;
		}

		//Loop children
		for (var i = 0; i < node.children.length; i++) {

			//Advance path
			path.advance(i);

			//Found in child node?
			if (findNodeName(node.children[i], nodeName, path)) {
				return true;
			}

			//Not found in this child node, retreat path
			path.retreat();
		}

		//Not found
		return false;
	};

	/**
	 * Static helper to create a path object to reach a certain node
	 */
	GamePath.findNode = function(nodeName, rootNode) {

		//Create new instance
		var path = new GamePath();

		//Find the node name
		if (findNodeName(rootNode, nodeName, path)) {
			return path;
		}

		//Not found
		return null;
	};

	//Return
	return GamePath;
});
