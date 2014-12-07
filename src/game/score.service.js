
/**
 * GameScore :: A simple class that contains a game score
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Game.Score.Service', [
	'ngGo'
])

/**
 * Factory definition
 */
.factory('GameScore', function(StoneColor) {

	/**
	 * Constructor
	 */
	var GameScore = function(colors, items) {

		//Set colors and items
		this.setColors(colors || [StoneColor.B, StoneColor.W]);
		this.setItems(items || ['stones', 'territory', 'captures', 'komi']);
	};

	/**
	 * Set colors
	 */
	GameScore.prototype.setColors = function(colors) {

		//Remember colors and initialize score container
		this.colors = colors;
		this.score = {};

		//Prepare score container
		for (var c = 0; c < colors.length; c++) {
			this.score[colors[c]] = {};
		}

		//Reset
		this.reset();
	};

	/**
	 * Set items
	 */
	GameScore.prototype.setItems = function(items) {

		//Remember items
		this.items = items;

		//Reset
		this.reset();
	};

	/**
	 * Set a score item
	 */
	GameScore.prototype.set = function(color, item, score) {

		//Color undefined?
		if (typeof this.score[color] == 'undefined') {
			console.warn('Color', color, 'is not defined');
			return;
		}

		//Item undefined
		if (typeof this.score[color][item] == 'undefined') {
			console.warn('Item', item, 'is not defined');
			return;
		}

		//Set
		this.score[color][item] = score;
		return this;
	};

	/**
	 * Get a score item or object
	 */
	GameScore.prototype.get = function(color, item) {

		//Color undefined?
		if (typeof this.score[color] == 'undefined') {
			console.warn('Color', color, 'is not defined');
			return;
		}

		//Item not given? Return score object
		if (typeof item == 'undefined') {
			var score = angular.copy(this.score[color]);
			score.total = this.total(color);
			return score;
		}

		//Item undefined
		if (typeof this.score[color][item] == 'undefined') {
			console.warn('Item', item, 'is not defined');
			return;
		}

		//Return
		return this.score[color][item];
	};

	/**
	 * Get the total score of a player color
	 */
	GameScore.prototype.total = function(color) {

		//Color undefined?
		if (typeof this.score[color] == 'undefined') {
			console.warn('Color', color, 'is not defined');
			return;
		}

		//Sum up
		var sum = 0;
		for (var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			sum += (1 * this.score[color][item]);
		}
		return sum;
	};

	/**
	 * Reset the game score
	 */
	GameScore.prototype.reset = function() {

		//Must have colors and items
		if (!this.colors || !this.items) {
			return;
		}

		//Reset all score properties
		for (var c = 0; c < this.colors.length; c++) {
			var color = this.colors[c];
			for (var i = 0; i < this.items.length; i++) {
				var item = this.items[i];
				this.score[color][item] = 0;
			}
		}
	};

	/**
	 * Get the winner
	 */
	GameScore.prototype.winner = function() {

		//Initialize
		var winner = StoneColor.E,
			highestScore = 0;

		//Loop colors
		for (var c = 0; c < this.colors.length; c++) {
			var total = this.total(this.colors[c]);

			//Check if higher
			if (total > highestScore) {
				highestScore = total;
				winner = this.colors[c];
			}

			//Check if the same
			else if (total == highestScore) {
				winner = StoneColor.E;
			}
		}

		//Return winner
		return winner;
	};

	//Return
	return GameScore;
});