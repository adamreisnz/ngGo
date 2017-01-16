describe('Game', function() {
  var StoneColor;
  var InvalidPositionError;
  var Game;

  //Load modules
  beforeEach(module('ngGo'));
  beforeEach(module('ngGo.Errors.InvalidPositionError.Service'));
  beforeEach(module('ngGo.Game.Service'));

  //Get injectable functions
  beforeEach(inject(function(_StoneColor_, _InvalidPositionError_, _Game_) {
    StoneColor = _StoneColor_;
    InvalidPositionError = _InvalidPositionError_;
    Game = _Game_;
  }));

  //Specify SGF files
  beforeEach(function() {
    this.sgfSimple = '(;SZ[9];B[cg];W[gc])';
    this.sgfRepeatingKo = '(;SZ[9]' +
      ';B[db];W[cb];B[ec];W[dc];B[dd];W[bc];B[gc];W[cd];B[cc])';
    this.sgfRepeatingAll = '(;SZ[9]' +
      ';B[db];W[cb];B[ec];W[dc];B[dd];W[bc];B[gc];W[cd];B[cc];W[fc];B[hd];W[ed];B[ge];W[fe]' +
      ';B[fd];W[gd];B[df];W[cf];B[eg];W[bg];B[dh];W[ch];B[cg];W[dg];B[fd];W[dc];B[cg];W[gd])';
  });

  it('#clone', function() {
    var game = new Game(this.sgfSimple);
    var clonedGame = game.clone();
    expect(game).toEqual(clonedGame);
    expect(clonedGame.position).toBeDefined();
  });

  describe('#play', function() {
    function createGames() {
      this.gameSimple = new Game(this.sgfSimple, this.config);
      this.gameRepeatingKo = new Game(this.sgfRepeatingKo, this.config);
      this.gameRepeatingAll = new Game(this.sgfRepeatingAll, this.config);
    }

    function goToLastMove() {
      this.gameSimple.last();
      this.gameRepeatingKo.last();
      this.gameRepeatingAll.last();
    }

    it('with checking disabled', function() {

      //Set config
      this.config = {
        checkRepeat: null
      };

      //Create games
      createGames.call(this);

      //Go to last move
      goToLastMove.call(this);

      //Verify
      expect(this.gameSimple.play.bind(this.gameSimple, 2, 2, StoneColor.BLACK)).not.toThrow();
      expect(this.gameRepeatingKo.play.bind(this.gameRepeatingKo, 3, 2, StoneColor.WHITE)).not.toThrow();
      expect(this.gameRepeatingAll.play.bind(this.gameRepeatingAll, 2, 2, StoneColor.BLACK)).not.toThrow();
    });

    it('with Ko checking enabled', function() {

      //Set config
      this.config = {
        checkRepeat: 'KO'
      };

      //Create games
      createGames.call(this);

      //Go to last move
      goToLastMove.call(this);

      //Verify
      expect(this.gameSimple.play.bind(this.gameSimple, 2, 2, StoneColor.BLACK)).not.toThrow();
      expect(this.gameRepeatingKo.play.bind(this.gameRepeatingKo, 3, 2, StoneColor.WHITE))
        .toThrowError(InvalidPositionError);
      expect(this.gameRepeatingAll.play.bind(this.gameRepeatingAll, 2, 2, StoneColor.BLACK)).not.toThrow();
    });

    it('with all checking enabled', function() {

      //Set config
      this.config = {
        checkRepeat: 'ALL'
      };

      //Create games
      createGames.call(this);

      //Go to last move
      goToLastMove.call(this);

      //Verify
      expect(this.gameSimple.play.bind(this.gameSimple, 2, 2, StoneColor.BLACK)).not.toThrow();
      expect(this.gameRepeatingKo.play.bind(this.gameRepeatingKo, 3, 2, StoneColor.WHITE))
        .toThrowError(InvalidPositionError);
      expect(this.gameRepeatingAll.play.bind(this.gameRepeatingAll, 2, 2, StoneColor.BLACK))
        .toThrowError(InvalidPositionError);
    });

    it('should not create new node if the move has existed in the children', function() {

      //Create a new game
      this.gameSimple = new Game(this.sgfSimple);

      //Go to some move number in the middle of the main line
      this.gameSimple.goto(1);

      //Play the move
      this.gameSimple.play(6, 2, StoneColor.WHITE);

      //Verify
      var parentNode = this.gameSimple.node.parent;
      expect(parentNode.rememberedPath).toEqual(0);
      expect(parentNode.children.length).toEqual(1);
    });
  });

  describe('#undo', function() {
    it('should have no children node if the last move is undoed', function() {

      //Create a new game
      this.gameSimple = new Game(this.sgfSimple);

      //Go to the last move
      this.gameSimple.last();

      //Undo
      var result = this.gameSimple.undo();

      //Verify
      expect(result).toBe(true);
      expect(this.gameSimple.path.move).toEqual(1);
      expect(this.gameSimple.node.rememberedPath || 0).toEqual(0);
      expect(this.gameSimple.node.children.length).toEqual(0);
    });

    it('should return false if it is not currently the last move', function() {

      //Create a new game
      this.gameSimple = new Game(this.sgfSimple);

      //Go to some move instead of the last move
      this.gameSimple.goto(1);

      //Undo
      var result = this.gameSimple.undo();

      //Verify
      expect(result).toBe(false);
      expect(this.gameSimple.path.move).toEqual(1);
      expect(this.gameSimple.node.rememberedPath || 0).toEqual(0);
      expect(this.gameSimple.node.children.length).toEqual(1);
    });

    it('should change the remembered path index if some path is removed', function() {

      //Create a new game
      this.gameSimple = new Game(this.sgfSimple);

      //Create a new branch
      this.gameSimple.goto(1);
      this.gameSimple.play(2, 2, StoneColor.WHITE);

      //Undo
      var result = this.gameSimple.undo();

      //Verify
      expect(result).toBe(true);
      expect(this.gameSimple.path.move).toEqual(1);
      expect(this.gameSimple.node.rememberedPath || 0).toEqual(0);
      expect(this.gameSimple.node.children.length).toEqual(1);
    });
  });
});
