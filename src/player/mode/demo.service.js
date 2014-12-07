
/**
 * PlayerModeDemo :: This module governs the "demo" mode of the player, e.g. showing
 * positions and playing out sequences automatically, as well as navigating between named nodes.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Demo.Service', [
	'ngGo'
])

/**
 * Run block
 */
.run(function(Player, PlayerModes, PlayerModeDemo) {

	/**
	 * Register event handlers
	 */
	Player.on('modeEnter', PlayerModeDemo.modeEnter, PlayerModes.DEMO);
	Player.on('modeExit', PlayerModeDemo.modeExit, PlayerModes.DEMO);
	Player.on('keydown', PlayerModeDemo.keyDown, PlayerModes.DEMO);
	Player.on('hover', PlayerModeDemo.hover, PlayerModes.DEMO);

	/**
	 * Register mode itself
	 */
	Player.registerMode(PlayerModes.DEMO, PlayerModeDemo);
})

/**
 * Factory definition
 */
.factory('PlayerModeDemo', function($document, Player, PlayerTools) {

	/**
	 * Helper to update the hover mark
	 */
	var updateHoverMark = function(x, y) {

		//Falling outside of grid?
		if (!this.board.isOnBoard(x, y)) {
			return;
		}

		//What happens, depends on the active tool
		switch (this.tool) {

			//Move tool
			case PlayerTools.MOVE:

				//Hovering over empty spot where we can make a move?
				if (canMakeMove.call(this) && this.game.isValidMove(x, y)) {
					this.board.add('hover', x, y, {
						type: 'stones',
						value: this.game.getTurn()
					});
				}
				break;
		}
	};

	/**
	 * Player mode definition
	 */
	var PlayerModeDemo = {

		/**
		 * Hover handler
		 */
		hover: function(event) {
			this.board.removeAll('hover');
			updateHoverMark.call(this, event.x, event.y);
		},

		/**
		 * Handler for keydown events
		 */
		keyDown: function(event, keyboardEvent) {

			//Inside a text field?
			if ($document[0].querySelector(':focus')) {
				return true;
			}

			//Switch key code
			switch (keyboardEvent.keyCode) {

				//Right arrow
				case 39:

					//Arrow keys navigation enabled?
					if (this.config.arrowKeysNavigation) {

						//Lock scroll
						if (this.config.lockScroll) {
							keyboardEvent.preventDefault();
						}

						//Go forward one move slide
						this.next();
					}
					break;

				//Left arrow
				case 37:

					//Arrow keys navigation enabled?
					if (this.config.arrowKeysNavigation) {

						//Lock scroll
						if (this.config.lockScroll) {
							keyboardEvent.preventDefault();
						}

						//Go back one slide
						this.previous();
					}
					break;
			}

			//Update hover mark
			this.board.removeAll('hover');
			updateHoverMark.call(this, this.lastX, this.lastY);
		},

		/**
		 * Handler for mode entry
		 */
		modeEnter: function(event) {

			//Set available tools for this mode
			this.tools = [
				PlayerTools.NONE
			];

			//Set default tool
			this.tool = this.tools[0];
		},

		/**
		 * Handler for mode exit
		 */
		modeExit: function(event) {

		}
	};

	//Return
	return PlayerModeDemo;
});