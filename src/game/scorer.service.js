
/**
 * GameScorer :: This class is used to determine the score of a certain game position. It also provides
 * handling of manual adjustment of dead/living groups.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Scorer.Service', [
	'ngGo.Service',
	'ngGo.Game.PositionChanges.Service',
	'ngGo.Board.Object.Stone.Service',
	'ngGo.Board.Object.StoneMini.Service',
	'ngGo.Board.Object.StoneFaded.Service'
])

/**
 * Factory definition
 */
.factory('GameScorer', function(StoneColor, Stone, StoneMini, StoneFaded, Game, GamePositionChanges) {

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
		var posColor = this.countPosition.get(x, y),
			origColor = this.origPosition.get(x, y);

		//If border reached, or a position which is already this color, or boundary color, can't set
		if (posColor === null || posColor == candidateColor || posColor == boundaryColor) {
			return;
		}

		//Don't turn stones which are already this color into candidates, instead
		//reset their color to what they were
		if (origColor * 2 == candidateColor) {
			this.countPosition.set(x, y, origColor);
		}

		//Otherwise, mark as candidate
		else {
			this.countPosition.set(x, y, candidateColor);
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
		var origColor = this.origPosition.get(x, y);

		//Already this color?
		if (this.countPosition.get(x, y) == origColor) {
			return;
		}

		//Reset the color
		this.countPosition.set(x, y, origColor);

		//Set adjacent squares
		territoryReset.call(this, x-1, y);
		territoryReset.call(this, x, y-1);
		territoryReset.call(this, x+1, y);
		territoryReset.call(this, x, y+1);
	};

	/**
	 * Helper to (re)determine the score and changes
	 */
	var determineScoreAndChanges = function() {

		//Get komi and captures
		var komi = Game.get('game.komi'),
			captures = Game.getCaptureCount();

		//Initialize score and changes
		this.changes = new GamePositionChanges();
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
		var state, color, x, y;

		//Loop position
		for (x = 0; x < this.countPosition.size; x++) {
			for (y = 0; y < this.countPosition.size; y++) {

				//Get state and color on original position
				state = this.countPosition.get(x, y);
				color = this.origPosition.get(x, y);

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
					this.changes.add.push(new StoneMini({x: x, y: y, color: StoneColor.B}));

					//White stone underneath?
					if (color == StoneColor.W) {
						this.score.black.captures++;
						this.changes.remove.push({x: x, y: y});
						this.changes.add.push(new StoneFaded({x: x, y: y, color: StoneColor.W}));
					}
					continue;
				}

				//White candidate
				if (state == scoreState.WHITE_CANDIDATE) {
					this.score.white.territory++;
					this.changes.add.push(new StoneMini({x: x, y: y, color: StoneColor.W}));

					//Black stone underneath?
					if (color == StoneColor.B) {
						this.score.white.captures++;
						this.changes.remove.push({x: x, y: y});
						this.changes.add.push(new StoneFaded({x: x, y: y, color: StoneColor.B}));
					}
					continue;
				}
			}
		}
	};

	/**
	 * Game scorer class
	 */
	var GameScorer = {

		//Position placeholders
		origPosition: null,
		countPosition: null,

		//Score and changes
		score: null,
		changes: null,

		/**
		 * Get the calculated score
		 */
		getScore: function() {
			return this.score;
		},

		/**
		 * Get the changes to process on the board
		 */
		getChanges: function() {
			return this.changes;
		},

		/**
		 * Run calculation routine
		 */
		calculate: function() {

			//Clone position to work with
			this.origPosition	=	Game.getPosition();
			this.countPosition	= 	this.origPosition.clone();

			//Initialize vars
			var change = true, curState, newState, adjacent, b, w, a, x, y;

			//Loop while there is change
			while (change) {

				//Set to false
				change = false;

				//Go through the whole position
				for (x = 0; x < this.countPosition.size; x++) {
					for (y = 0; y < this.countPosition.size; y++) {

						//Get current state at position
						curState = this.countPosition.get(x, y);

						//Unknown or candiates?
						if (curState == scoreState.UNKNOWN || curState == scoreState.BLACK_CANDIDATE || curState == scoreState.WHITE_CANDIDATE) {

							//Get state in adjacent positions
							adjacent = [
								this.countPosition.get(x-1, y),
								this.countPosition.get(x, y-1),
								this.countPosition.get(x+1, y),
								this.countPosition.get(x, y+1)
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
								this.countPosition.set(x, y, newState);
							}
						}
					}
				}
			}

			//Determine the score and changes now
			determineScoreAndChanges.call(this);
		},

		/**
		 * Mark stones dead or alive
		 */
		mark: function(x, y) {

			//Get color of original position and state of the count position
			var color = this.origPosition.get(x, y),
				state = this.countPosition.get(x, y);

			//White stone
			if (color == StoneColor.W) {

				//Was white, mark it and any territory it's in as black's
				if (state == scoreState.WHITE_STONE) {
					territorySet.call(this, x, y, scoreState.BLACK_CANDIDATE, scoreState.BLACK_STONE);
					determineScoreAndChanges.call(this);
				}

				//Was marked as not white, reset the territory
				else {
					territoryReset.call(this, x, y);
					this.calculate();
				}
			}

			//Black stone
			else if (color == StoneColor.B) {

				//Was black, mark it and any territory it's in as white's
				if (state == scoreState.BLACK_STONE) {
					territorySet.call(this, x, y, scoreState.WHITE_CANDIDATE, scoreState.WHITE_STONE);
					determineScoreAndChanges.call(this);
				}

				//Was marked as not black, reset the territory
				else {
					territoryReset.call(this, x, y);
					this.calculate();
				}
			}
		}
	};

	//Return
	return GameScorer;
});