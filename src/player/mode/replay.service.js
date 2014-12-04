
/**
 * PlayerModeReplay :: This module governs the "replay" mode of the player, e.g. traversing through an
 * existing game record without the ability to deviate from the tree or its variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Replay.Service', [
	'ngGo',
	'ngGo.Game.Scorer.Service'
])

/**
 * Run block
 */
.run(function(Player, PlayerModes, PlayerModeReplay) {

	/**
	 * Register event handlers
	 */
	Player.on('modeEnter', PlayerModeReplay.modeEnter, PlayerModes.REPLAY);
	Player.on('modeExit', PlayerModeReplay.modeExit, PlayerModes.REPLAY);
	Player.on('update', PlayerModeReplay.update, PlayerModes.REPLAY);
	Player.on('config', PlayerModeReplay.config, PlayerModes.REPLAY);
	Player.on('click', PlayerModeReplay.click, PlayerModes.REPLAY);
	Player.on('hover', PlayerModeReplay.hover, PlayerModes.REPLAY);

	/**
	 * Register mode itself
	 */
	Player.registerMode(PlayerModes.REPLAY, PlayerModeReplay);
})

/**
 * Factory definition
 */
.factory('PlayerModeReplay', function(Player, PlayerTools, MarkupTypes, GameScorer) {

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
				if (!this.game.hasStone(x, y) && this.game.isValidMove(x, y)) {
					this.board.add('hover', x, y, {
						type: 'stones',
						value: this.game.getTurn()
					});
				}
				break;

			//Score tool
			case PlayerTools.SCORE:

				//Hovering over a stone means it can be marked dead or alive
				if (this.game.hasStone(x, y)) {
					this.board.add('hover', x, y, {
						type: 'markup',
						value: MarkupTypes.MARK
					});
				}
				break;
		}
	};

	/**
	 * Helper to show move variations on the board
	 */
	var showMoveVariations = function(variations) {
		for (var i = 0; i < variations.length; i++) {

			//Auto variation markup should never overwrite existing markup
			if (this.board.has('markup', variations[i].move.x, variations[i].move.y)) {
				continue;
			}

			//Add to board
			this.board.add('markup', variations[i].move.x, variations[i].move.y, {
				type: this.board.theme.get('markup.variation.type'),
				text: this.board.theme.get('markup.variation.text', i),
				color: this.board.theme.get('markup.variation.color')
			});
		}
	};

	/**
	 * Helper to hide move variations from the board
	 */
	var hideMoveVariations = function(variations) {
		for (var i = 0; i < variations.length; i++) {
			this.board.remove('markup', variations[i].move.x, variations[i].move.y);
		}
	};

	/**
	 * Draw (or clear) move variations on the board
	 */
	var drawMoveVariations = function(show) {

		//Get the current node
		var node = this.game.getNode(), variations;
		if (!node) {
			return;
		}

		//Child variations?
		if (this.config.variationChildren && node.hasMoveVariations()) {
			variations = node.getMoveVariations();
			if (show) {
				showMoveVariations.call(this, variations);
			}
			else {
				hideMoveVariations.call(this, variations);
			}
		}

		//Sibling variations?
		if (this.config.variationSiblings && node.parent && node.parent.hasMoveVariations()) {
			variations = node.parent.getMoveVariations();
			if (show) {
				showMoveVariations.call(this, variations);
			}
			else {
				hideMoveVariations.call(this, variations);
			}
		}
	};

	/**
	 * Player mode definition
	 */
	var PlayerModeReplay = {

		/**
		 * Config changes handler
		 */
		config: function(event, setting) {

			//Solution paths setting changes?
			if (setting == 'variationMarkup') {
				drawMoveVariations.call(this, this.config.variationMarkup);
			}
		},

		/**
		 * Hover handler
		 */
		hover: function(event) {
			this.board.removeAll('hover');
			updateHoverMark.call(this, event.x, event.y);
		},

		/**
		 * Board update event handler
		 */
		update: function(event, node) {

			//Show move variations
			if (this.config.variationMarkup) {
				drawMoveVariations.call(this, true);
			}
		},

		/**
		 * Handler for mouse click events
		 */
		click: function(event, mouseEvent) {

			//Falling outside of grid?
			if (!this.board.isOnBoard(event.x, event.y)) {
				return;
			}

			//What happens, depends on the active tool
			switch (this.tool) {

				//Move tool
				case PlayerTools.MOVE:

					//Check if we clicked a move variation
					var i = this.game.isMoveVariation(event.x, event.y);

					//Advance to the next position
					if (i != -1) {
						this.next(i);
					}
					break;

				//Score tool, mark stones dead or alive
				case PlayerTools.SCORE:

					//Mark the clicked item and score the current game position
					GameScorer.mark(event.x, event.y);
					this.scoreGame();
					break;
			}

			//Handle hover
			PlayerModeReplay.hover.call(this, event);
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
			if (this.config.variationMarkup) {
				drawMoveVariations.call(this, true);
			}
		},

		/**
		 * Handler for mode exit
		 */
		modeExit: function(event) {

			//Hide move variations
			if (this.config.variationMarkup) {
				drawMoveVariations.call(this, false);
			}
		}
	};

	//Return
	return PlayerModeReplay;
});