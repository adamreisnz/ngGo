
/**
 * PlayerEventHandlers :: This class contains all the event handlers for the Player, ranging from mouse
 * and keyboard input handling to events related to kifu loading and game updates.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.EventHandlers.Service', [
	'ngGo.Service',
	'ngGo.Board.Object.Markup.Service',
	'ngGo.Board.Object.Stone.Service',
	'ngGo.Board.Object.StoneFaded.Service'
])

/**
 * Factory definition
 */
.factory('PlayerEventHandlers', function($document, KifuReader, PlayerModes, PlayerTools, StoneColor, Markup, Stone, StoneFaded, GameScorer) {

	/**
	 * Determine grid coordinatess from event object
	 */
	var getCellCoordsFromEvent = function(mouseEvent) {

		//Init
		var x, y;

		//Determine x
		x = mouseEvent.offsetX || mouseEvent.originalEvent.offsetX || mouseEvent.originalEvent.layerX;
		x *= (window.devicePixelRatio || 1);
		x -= this.board.left;
		x /= this.board.cellWidth;
		x = Math.round(x);

		//Determine y
		y = mouseEvent.offsetY || mouseEvent.originalEvent.offsetY || mouseEvent.originalEvent.layerY;
		y *= (window.devicePixelRatio || 1);
		y -= this.board.top;
		y /= this.board.cellHeight;
		y = Math.round(y);

		//Return coords
		return {
			x: x >= this.size ? -1 : x,
			y: y >= this.size ? -1 : y
		};
	};

	/**
	 * Define handler
	 */
	var PlayerEventHandlers = {

		/**
		 * Callback for kifu loaded event
		 */
		kifuLoaded: function(event, kifu) {
			this.board.setSize(this.kifu.size);
			this.board.removeAllObjects();
		},

		/**
		 * Player update
		 */
		playerUpdate: function(event) {

			//Remove existing markup from the board
			if (this.existingMarkup) {
				this.board.removeObject(this.existingMarkup, 'markup');
			}

			//Reset existing markup array
			this.existingMarkup = [];

			//Get changes to the board's position
			var i,
				node = KifuReader.getNode(),
				changes = KifuReader.getChanges();

			//Changes to the board's position
			if (changes) {

				//Stones to remove (no need for a class, as just the position is relevant)
				for (var r in changes.remove) {
					this.board.removeObject(changes.remove[r], 'stones');
				}

				//Stone to add
				for (var a in changes.add) {
					this.board.addObject(new Stone(changes.add[a]));
				}
			}

			//Move made?
			if (node.move) {

				//Passed?
				if (node.move.pass) {
					PlayerEvents.notification('pass', {color: node.move.color});
				}

				//Mark last move?
				else if (this.config.markLastMove) {
					this.existingMarkup.push(node.move);
					this.board.addObject(new Markup({
						type: this.config.lastMoveMarker,
						x: node.move.x,
						y: node.move.y
					}));
				}
			}

			//Add variation letters
			if (node.children.length > 1 && this.config.markVariations) {
				for (i = 0; i < node.children.length; i++) {
					if (node.children[i].move && !node.children[i].move.pass) {
						this.existingMarkup.push(node.children[i].move);
						this.board.addObject(new Markup({
							type: 'label',
							text: String.fromCharCode(65+i),
							color: this.board.theme.get('markupVariationColor'),
							x: node.children[i].move.x,
							y: node.children[i].move.y
						}));
					}
				}
			}

			//Add any other markup
			if (node.markup) {
				for (i in node.markup) {
					this.existingMarkup.push(node.markup[i]);
					this.board.addObject(new Markup(node.markup[i]));
				}
			}
		},

		/**
		 * Keydown handler
		 */
		keyDown: function(event) {

			//Don't navigate when we're inside a text field?
			if ($document[0].querySelector(':focus')) {
				return true;
			}

			//Switch key code
			switch (event.keyCode) {

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

				//TODO: up down for variations
				//case 40: this.selectAlternativeVariation(); break;
				default:
					return true;
			}

			//Don't scroll with arrows
			if (this.config.lockScroll) {
				event.preventDefault();
			}
		},

		/**
		 * Mousewheel handler
		 */
		mouseWheel: function(event, mouseEvent) {

			//Disabled?
			if (!this.config.scrollWheelNavigation) {
				return true;
			}

			//Only in play mode or setup mode
			if (this.mode != PlayerModes.PLAY && this.mode != PlayerModes.SETUP) {
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
		},

		/**
		 * Mouse click handler
		 */
		mouseClick: function(event, mouseEvent) {

			//Get grid coordinates
			var grid = getCellCoordsFromEvent.call(this, mouseEvent);

			//Get current node
			var node = KifuReader.getNode();

			//Check if anything to do
			if (!node) {
				return false;
			}

			//Play mode
			if (this.mode == PlayerModes.PLAY) {

				//Check if we need to move to a node (e.g. clicked on the proper coordinates)
				for (var i in node.children) {
					if (node.children[i].move && node.children[i].move.x == grid.x && node.children[i].move.y == grid.y) {
						this.next(i);
						return;
					}
				}
			}

			//Setup mode
			else if (this.mode == PlayerModes.SETUP) {
				if (!this.board.hasStone(grid.x, grid.y)) {

					//Add stone to board
					this.board.addObject(new Stone({
						x: grid.x,
						y: grid.y,
						color: (this.tool == PlayerTools.WHITE) ? StoneColor.W : StoneColor.B
					}));

					//Remove last mark if we have one
					if (this._lastMark) {
						this.board.removeObject(this._lastMark);
					}

					//Clear last remembered mouse move coordinates to refresh mouse over image
					delete this._lastMark;
					delete this._lastX;
					delete this._lastY;
				}
			}

			//Score mode
			else if (this.mode == PlayerModes.SCORE) {

				//Mark the clicked item
				GameScorer.mark(grid.x, grid.y);

				//Restore the board state from pre-scoring
				if (this.preScoreState) {
					this.board.restoreState(this.preScoreState);
				}

				//Get changes and score
				var changes = GameScorer.getChanges(),
					score = GameScorer.getScore();
					console.log(score);

				//Process changes
				this.board.removeAllObjects('markup');
				this.board.removeObject(changes.remove, 'stones');
				this.board.addObject(changes.add);
			}
		},

		/**
		 * Mouse move handler
		 */
		mouseMove: function(event, mouseEvent) {

			//Get grid coordinates
			var grid = getCellCoordsFromEvent.call(this, mouseEvent);

			//Nothing to do?
			if (this.frozen || (this._lastX == grid.x && this._lastY == grid.y)) {
				return;
			}

			//Remember last coordinates
			this._lastX = grid.x;
			this._lastY = grid.y;

			//Remove last mark if we have one
			if (this._lastMark) {
				this.board.removeObject(this._lastMark);
			}

			//When editing, we can place stones on empty spots or remove existing stones
			if (this.mode == PlayerModes.SETUP) {
				if (!this.board.hasStone(grid.x, grid.y)) {

					//Create faded stone object
					this._lastMark = new StoneFaded({
						x: grid.x,
						y: grid.y,
						color: StoneColor[this.tool]
					});
				}
				else {

					//Create mark
					this._lastMark = new Markup({
						type: 'mark',
						x: grid.x,
						y: grid.y
					});
				}

				//Add to board
				this.board.addObject(this._lastMark);
				return;
			}

			//When playing, we can place stones only on valid locations
			else if (this.mode == PlayerModes.PLAY) {
				if (KifuReader.game && KifuReader.game.isValidMove(grid.x, grid.y)) {

					//Create faded stone object
					this._lastMark = new StoneFaded({
						x: grid.x,
						y: grid.y,
						color: KifuReader.game.getTurn()
					});

					//Add to board
					this.board.addObject(this._lastMark);
					return;
				}
			}

			//When scoring, we can mark stons as dead
			else if (this.mode == PlayerModes.SCORE) {
				if (this.board.hasStone(grid.x, grid.y)) {

					//Create mark
					this._lastMark = new Markup({
						type: 'mark',
						x: grid.x,
						y: grid.y
					});

					//Add to board
					this.board.addObject(this._lastMark);
					return;
				}
			}

			//Clear last mark
			delete this._lastMark;
		},

		/**
		 * Mouse out handler
		 */
		mouseOut: function(event) {
			if (this._lastMark) {
				this.board.removeObject(this._lastMark);
				delete this._lastMark;
				delete this._lastX;
				delete this._lastY;
			}
		}
	};

	//Return object
	return PlayerEventHandlers;
});