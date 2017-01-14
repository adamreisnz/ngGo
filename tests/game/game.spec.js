describe('Game', function() {
  var Game;

  // Load modules
  beforeEach(module('ngGo.Game.Service'));

  // Get injectable functions
  beforeEach(inject(function(_Game_) {
    Game = _Game_;
  }));

  it('#clone', function() {
    var sgf = '(;SZ[9];B[cg];W[gc])';
    var game = new Game(sgf);
    var clonedGame = game.clone();
    expect(game).toEqual(clonedGame);
  });
});
