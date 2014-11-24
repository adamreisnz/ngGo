
/**
 * PlayerModeReplay :: This class governs the "replay" mode of the player, e.g. traversing through an
 * existing game record without the ability to deviate from the tree or its variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Replay.Service', [
	'ngGo.Service'
])

/**
 * Run block
 */
.run(function($document, Player, PlayerModes, PlayerTools, KifuReader, StoneFaded) {

	/**
	 * Available tools for this mode
	 */
	var availableTools = [
		PlayerTools.MOVE,
		PlayerTools.NONE
	];

	/**
	 * Handler for keydown events
	 */
	var keyDown = function(event, keyboardEvent) {

		//Don't navigate when we're inside a text field?
		if ($document[0].querySelector(':focus')) {
			return true;
		}

		//Switch key code
		switch (keyboardEvent.keyCode) {

			//Right arrow
			case 39:
				if (this.config.arrowKeysNavigation) {
					this.next();
				}
				break;

			//Left arrow
			case 37:
				if (this.config.arrowKeysNavigation) {
					this.previous();
				}
				break;

			//TODO: up down for variation selection?
			default:
				return true;
		}

		//Don't scroll with arrows
		if (this.config.lockScroll) {
			keyboardEvent.preventDefault();
		}
	};

	/**
	 * Handler for mouse click events
	 */
	var mouseClick = function(event, mouseEvent) {

		//Get current node
		var node = KifuReader.getNode();

		//Check if anything to do
		if (!node) {
			return false;
		}

		//Check if we need to move to a node (e.g. clicked on the proper coordinates)
		for (var i in node.children) {
			if (node.children[i].move && node.children[i].move.x == event.x && node.children[i].move.y == event.y) {
				this.next(i);
				return;
			}
		}
	};

	/**
	 * Mouse move handler
	 */
	var mouseMove = function(event, mouseEvent) {

		//Nothing to do?
		if (this.frozen || (this._lastX == event.x && this._lastY == event.y)) {
			return;
		}

		//Remember last coordinates
		this._lastX = event.x;
		this._lastY = event.y;

		//Remove last mark if we have one
		if (this._lastMark) {
			this.board.removeObject(this._lastMark);
		}

		//When replaying, we can place stones only on valid locations
		if (KifuReader.game && KifuReader.game.isValidMove(event.x, event.y)) {

			//Create faded stone object
			this._lastMark = new StoneFaded({
				x: event.x,
				y: event.y,
				color: KifuReader.game.getTurn()
			});

			//Add to board
			this.board.addObject(this._lastMark);
			return;
		}

		//Clear last mark
		delete this._lastMark;
	};

	/**
	 * Handler for mousewheel events
	 */
	var mouseWheel = function(event, mouseEvent) {

		//Disabled?
		if (!this.config.scrollWheelNavigation) {
			return true;
		}

		//Find delta
		var delta = mouseEvent.deltaY || mouseEvent.originalEvent.deltaY;

		//Next move
		if (delta < 0) {
			this.next();
		}

		//Previous move
		else if (delta > 0) {
			this.previous();
		}

		//Don't scroll the window
		if (delta !== 0 && this.config.lockScroll) {
			mouseEvent.preventDefault();
		}
	};

	/**
	 * Handler for mode switches
	 */
	var modeSwitch = function(event) {
		this.tool = availableTools[0];
	};

	/**
	 * Register event listeners
	 */
	Player.listen('modeSwitch', modeSwitch, PlayerModes.REPLAY);
	Player.listen('keydown', keyDown, PlayerModes.REPLAY);
	Player.listen('click', mouseClick, PlayerModes.REPLAY);
	Player.listen('mousewheel', mouseWheel, PlayerModes.REPLAY);
});