
/**
 * PlayerModeReplay :: This module governs the "replay" mode of the player, e.g. traversing through an
 * existing game record without the ability to deviate from the tree or its variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Replay.Service', [])

/**
 * Run block
 */
.run(function(Player, PlayerModes, PlayerModeReplay, Markup) {

	/**
	 * Register mode
	 */
	Player.modes[PlayerModes.REPLAY] = PlayerModeReplay;

	/**
	 * Register event handlers for this mode
	 */
	Player.on('modeEnter', PlayerModeReplay.modeEnter, PlayerModes.REPLAY);
	Player.on('modeExit', PlayerModeReplay.modeExit, PlayerModes.REPLAY);
	Player.on('click', PlayerModeReplay.mouseClick, PlayerModes.REPLAY);
	Player.on('mousemove', PlayerModeReplay.mouseMove, PlayerModes.REPLAY);
	Player.on('update', PlayerModeReplay.update, PlayerModes.REPLAY);

	/**
	 * Helper to remove move variations from the board
	 */
	var removeMoveVariations = function(nodes) {
		for (var i = 0; i < nodes.length; i++) {
			this.board.removeObject({
				x: nodes[i].move.x,
				y: nodes[i].move.y
			}, 'markup');
		}
	};

	/**
	 * Helper to add move variations to the board
	 */
	var addMoveVariations = function(nodes) {
		for (var i = 0; i < nodes.length; i++) {

			//Auto variation markup should never overwrite existing markup
			if (this.board.hasObjectAt(nodes[i].move.x, nodes[i].move.y, 'markup')) {
				continue;
			}

			//Add to board
			this.board.addObject(new Markup({
				type: 'label',
				text: String.fromCharCode(65+i),
				color: this.board.theme.get('markupVariationColor'),
				x: nodes[i].move.x,
				y: nodes[i].move.y
			}));
		}
	};

	/**
	 * Set whether to mark variations on the board
	 */
	Player.setVariationBoardMarkup = function(mark) {

		//Set the config parameter
		this.config.variationBoardMarkup = (mark === true || mark === 'true');

		//If we're in replay mode toggle the variations
		if (this.mode == PlayerModes.REPLAY) {
			this.toggleMoveVariations(this.config.variationBoardMarkup);
		}
	};

	/**
	 * Show or hide move variations
	 */
	Player.toggleMoveVariations = function(show) {

		//Not the right mode, or disabled via configuration?
		if (this.mode != PlayerModes.REPLAY || !this.config.variationBoardMarkup) {
			return;
		}

		//Get the current node
		var node = this.game.getNode(), variations;
		if (!node) {
			return;
		}

		//Child variations?
		if (this.config.variationChildren && node.hasMoveVariations()) {
			variations = node.getMoveVariations();
			if (show) {
				addMoveVariations.call(this, variations);
			}
			else {
				removeMoveVariations.call(this, variations);
			}
		}

		//Sibling variations?
		if (this.config.variationSiblings && node.parent && node.parent.hasMoveVariations()) {
			variations = node.parent.getMoveVariations();
			if (show) {
				addMoveVariations.call(this, variations);
			}
			else {
				removeMoveVariations.call(this, variations);
			}
		}
	};
})

/**
 * Factory definition
 */
.factory('PlayerModeReplay', function(PlayerTools, StoneFaded) {

	/**
	 * Helper to update the hover mark
	 */
	var updateHoverMark = function(x, y) {

		//Remove hover mark if we have one
		if (this._hoverMark) {
			this.board.removeObject(this._hoverMark);
			delete this._hoverMark;
		}

		//What happens, depends on the active tool
		switch (this.tool) {

			//Move tool
			case PlayerTools.MOVE:

				//Hovering over empty spot where we can make a move?
				if (!this.game.hasStone(x, y) && this.game.isValidMove(x, y)) {
					this._hoverMark = new StoneFaded({
						x: x,
						y: y,
						color: this.game.getTurn()
					});
				}
				break;

			//Score tool
			case PlayerTools.SCORE:

				//Hovering over a stone means it can be marked dead or alive
				if (this.game.hasStone(x, y)) {
					this._hoverMark = new Markup({
						type: 'mark',
						x: x,
						y: y
					});
				}
				break;
		}

		//Add hover mark
		if (this._hoverMark) {
			this.board.addObject(this._hoverMark);
		}
	};

	/**
	 * Player mode definition
	 */
	var PlayerModeReplay = {

		/**
		 * Board update event handler
		 */
		update: function() {

			//Show move variations
			this.toggleMoveVariations(true);
		},

		/**
		 * Handler for mouse click events
		 */
		mouseClick: function(event, mouseEvent) {

			//Check if we clicked a move variation
			var i = this.game.isMoveVariation(event.x, event.y);

			//Advance to the next position
			if (i != -1) {
				this.next(i);
			}

			//Update hover mark
			updateHoverMark.call(this, event.x, event.y);
		},

		/**
		 * Mouse move handler
		 */
		mouseMove: function(event, mouseEvent) {

			//Nothing to do?
			if (this.frozen || (this._lastX == event.x && this._lastY == event.y)) {
				return;
			}

			//Remember last coordinates
			this._lastX = event.x;
			this._lastY = event.y;

			//Update hover mark
			updateHoverMark.call(this, event.x, event.y);
		},

		/**
		 * Handler for mode entry
		 */
		modeEnter: function(event) {

			//Set available tools for this mode
			this.tools = [
				PlayerTools.MOVE,
				PlayerTools.SCORE
			];

			//Set default tool
			this.tool = this.tools[0];

			//Show move variations
			this.toggleMoveVariations(true);
		},

		/**
		 * Handler for mode exit
		 */
		modeExit: function(event) {

			//Hide move variations
			this.toggleMoveVariations(false);
		}
	};

	//Return
	return PlayerModeReplay;
});