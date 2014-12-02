
/**
 * this.gameScorer :: This class is used to determine the score of a certain game position. It also provides
 * handling of manual adjustment of dead/living groups.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Scorer.Service', [
	'ngGo',
	'ngGo.Board.Grid.Service'
])

/**
 * Factory definition
 */
.factory('GameScorer', function(StoneColor, BoardGrid) {

	/**
	 * Possible score states
	 */
	var scoreState = {
		UNKNOWN: StoneColor.NONE,
		BLACK_STONE: StoneColor.B,
		WHITE_STONE: StoneColor.W,
		BLACK_CANDIDATE: StoneColor.B * 2,
		WHITE_CANDIDATE: StoneColor.W * 2,
		NEUTRAL: StoneColor.B * 3
	};

	/**
	 * Helper to set territory
	 */
	var territorySet = function(x, y, candidateColor, boundaryColor) {

		//Get color at given position
		var posColor = this.stones.get(x, y),
			origColor = this.game.position.stones.get(x, y);

		//If border reached, or a position which is already this color, or boundary color, can't set
		if (!this.stones.isOnGrid(x, y) || posColor == candidateColor || posColor == boundaryColor) {
			return;
		}

		//Don't turn stones which are already this color into candidates, instead
		//reset their color to what they were
		if (origColor * 2 == candidateColor) {
			this.stones.set(x, y, origColor);
		}

		//Otherwise, mark as candidate
		else {
			this.stones.set(x, y, candidateColor);
		}

		//Set adjacent squares
		territorySet.call(this, x-1, y, candidateColor, boundaryColor);
		territorySet.call(this, x, y-1, candidateColor, boundaryColor);
		territorySet.call(this, x+1, y, candidateColor, boundaryColor);
		territorySet.call(this, x, y+1, candidateColor, boundaryColor);
	};

	/**
	 * Helper to reset territory
	 */
	var territoryReset = function(x, y) {

		//Get original color from this position
		var origColor = this.game.position.stones.get(x, y);

		//Not on grid, or already this color?
		if (!this.stones.isOnGrid(x, y) || this.stones.get(x, y) == origColor) {
			return;
		}

		//Reset the color
		this.stones.set(x, y, origColor);

		//Set adjacent squares
		territoryReset.call(this, x-1, y);
		territoryReset.call(this, x, y-1);
		territoryReset.call(this, x+1, y);
		territoryReset.call(this, x, y+1);
	};

	/**
	 * Helper to determine score state
	 */
	var determineScoreState = function() {

		//Initialize vars
		var change = true, curState, newState, adjacent, b, w, a, x, y;

		//Loop while there is change
		while (change) {

			//Set to false
			change = false;

			//Go through the whole position
			for (x = 0; x < this.stones.width; x++) {
				for (y = 0; y < this.stones.height; y++) {

					//Get current state at position
					curState = this.stones.get(x, y);

					//Unknown or candiates?
					if (curState == scoreState.UNKNOWN || curState == scoreState.BLACK_CANDIDATE || curState == scoreState.WHITE_CANDIDATE) {

						//Get state in adjacent positions
						adjacent = [
							this.stones.get(x-1, y),
							this.stones.get(x, y-1),
							this.stones.get(x+1, y),
							this.stones.get(x, y+1)
						];

						//Reset
						b = w = false;

						//Loop adjacent squares
						for (a = 0; a < 4; a++) {
							if (adjacent[a] == scoreState.BLACK_STONE || adjacent[a] == scoreState.BLACK_CANDIDATE) {
								b = true;
							}
							else if (adjacent[a] == scoreState.WHITE_STONE || adjacent[a] == scoreState.WHITE_CANDIDATE) {
								w = true;
							}
							else if (adjacent[a] == scoreState.NEUTRAL) {
								b = w = true;
							}
						}

						//Determine new state
						if (b && w) {
							newState = scoreState.NEUTRAL;
						}
						else if (b) {
							newState = scoreState.BLACK_CANDIDATE;
						}
						else if (w) {
							newState = scoreState.WHITE_CANDIDATE;
						}
						else {
							newState = false;
						}

						//Change?
						if (newState !== false && newState != curState) {
							change = true;
							this.stones.set(x, y, newState);
						}
					}
				}
			}
		}
	};

	/**
	 * this.game scorer class
	 */
	var GameScorer = {

		//Game to score
		game: null,

		//Score
		score: null,

		//Stones, captures and points grids
		stones: null,
		captures: null,
		points: null,

		/**
		 * Load a game to score
		 */
		load: function(game) {

			//Remember
			this.game = game;

			//Clone position to work with
			this.stones	= this.game.position.stones.clone();

			//Create grids
			this.captures = new BoardGrid(this.stones.width, this.stones.height, this.stones.emptyValue);
			this.points = new BoardGrid(this.stones.width, this.stones.height, this.stones.emptyValue);
		},

		/**
		 * Get the calculated score
		 */
		getScore: function() {
			return this.score;
		},

		/**
		 * Get the points grid
		 */
		getPoints: function() {
			return this.points;
		},

		/**
		 * Get the captures grid
		 */
		getCaptures: function() {
			return this.captures;
		},

		/**
		 * Run score calculation routine
		 */
		calculate: function() {

			//No game?
			if (!this.game) {
				console.warn("No game loaded in game scorer, can't calutlate score.");
				return;
			}

			//Clear grids
			this.points.clear();
			this.captures.clear();

			//Determine score state
			determineScoreState.call(this);

			//Get komi and captures
			var komi = this.game.get('game.komi'),
				captures = this.game.getCaptureCount();

			//Initialize score
			this.score = {
				black: {
					stones: 0,
					territory: 0,
					captures: captures[StoneColor.B],
					komi: komi < 0 ? komi : 0
				},
				white: {
					stones: 0,
					territory: 0,
					captures: captures[StoneColor.W],
					komi: komi > 0 ? komi : 0
				}
			};

			//Init helper vars
			var x, y, state, color;

			//Loop position
			for (x = 0; x < this.stones.width; x++) {
				for (y = 0; y < this.stones.height; y++) {

					//Get state and color on original position
					state = this.stones.get(x, y);
					color = this.game.position.stones.get(x, y);

					//Black stone
					if (state == scoreState.BLACK_STONE && color == StoneColor.B) {
						this.score.black.stones++;
						continue;
					}

					//White stone
					if (state == scoreState.WHITE_STONE && color == StoneColor.W) {
						this.score.white.stones++;
						continue;
					}

					//Black candidate
					if (state == scoreState.BLACK_CANDIDATE) {
						this.score.black.territory++;
						this.points.set(x, y, StoneColor.B);

						//White stone underneath?
						if (color == StoneColor.W) {
							this.score.black.captures++;
							this.captures.set(x, y, StoneColor.W);
						}
						continue;
					}

					//White candidate
					if (state == scoreState.WHITE_CANDIDATE) {
						this.score.white.territory++;
						this.points.set(x, y, StoneColor.W);

						//Black stone underneath?
						if (color == StoneColor.B) {
							this.score.white.captures++;
							this.captures.set(x, y, StoneColor.B);
						}
						continue;
					}
				}
			}
		},

		/**
		 * Mark stones dead or alive
		 */
		mark: function(x, y) {

			//Get color of original position and state of the count position
			var color = this.game.position.stones.get(x, y),
				state = this.stones.get(x, y);

			//White stone
			if (color == StoneColor.W) {

				//Was white, mark it and any territory it's in as black's
				if (state == scoreState.WHITE_STONE) {
					territorySet.call(this, x, y, scoreState.BLACK_CANDIDATE, scoreState.BLACK_STONE);
				}

				//Was marked as not white, reset the territory
				else {
					territoryReset.call(this, x, y);
				}
			}

			//Black stone
			else if (color == StoneColor.B) {

				//Was black, mark it and any territory it's in as white's
				if (state == scoreState.BLACK_STONE) {
					territorySet.call(this, x, y, scoreState.WHITE_CANDIDATE, scoreState.WHITE_STONE);
				}

				//Was marked as not black, reset the territory
				else {
					territoryReset.call(this, x, y);
				}
			}
		}
	};

	//Return
	return GameScorer;
});