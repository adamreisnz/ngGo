describe('BoardGrid', function() {
  var BoardGrid;

  // Load modules
  beforeEach(module('ngGo.Board.Grid.Service'));

  // Get injectable functions
  beforeEach(inject(function(_BoardGrid_) {
    BoardGrid = _BoardGrid_;
  }));

  describe('#constructor', function() {
    it('should have default properties', function() {
      var grid = new BoardGrid();
      expect(grid).toEqual(jasmine.objectContaining({
        width: 0,
        height: 0,
        grid: [],
        emptyValue: null
      }));
    });

    it('should have specified size', function() {
      var grid = new BoardGrid(13, 19);
      expect(grid).toEqual(jasmine.objectContaining({
        width: 13,
        height: 19,
        emptyValue: null
      }));
      expect(grid.grid.length).toEqual(13);
      expect(grid.grid[0].length).toEqual(19);
    });

    it('should have specified size and empty value', function() {
      var grid = new BoardGrid(13, 19, -1);
      expect(grid).toEqual(jasmine.objectContaining({
        width: 13,
        height: 19,
        emptyValue: -1
      }));
      expect(grid.grid.length).toEqual(13);
      expect(grid.grid[0].length).toEqual(19);
      expect(grid.grid[0][0]).toEqual(-1);
    });
  });

  describe('#isSameAs', function() {
    var gridBase;
    var gridDiffSize;
    var gridEmpty;
    var gridDiffStones;

    // Initialize board grids
    beforeAll(function() {
      gridBase = new BoardGrid(3, 3);
      gridDiffSize = new BoardGrid(5, 5);
      gridEmpty = new BoardGrid(3, 3);
      gridDiffStones = new BoardGrid(3, 3);
    });

    // Specify fake stones for base grid
    beforeAll(function() {
      gridBase.grid = [
        [0, 1, -1],
        [-1, 0, 1],
        [1, -1, 0]
      ];
      gridDiffStones.grid = [
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0]
      ];
    });

    it('from the view of base', function() {
      expect(gridBase.isSameAs(gridBase)).toEqual(true);
      expect(gridBase.isSameAs(gridDiffSize)).toEqual(false);
      expect(gridBase.isSameAs(gridEmpty)).toEqual(false);
      expect(gridBase.isSameAs(gridDiffStones)).toEqual(false);
    });

    it('from the view of different grid', function() {
      expect(gridDiffStones.isSameAs(gridBase)).toEqual(false);
      expect(gridDiffStones.isSameAs(gridDiffSize)).toEqual(false);
      expect(gridDiffStones.isSameAs(gridEmpty)).toEqual(false);
      expect(gridDiffStones.isSameAs(gridDiffStones)).toEqual(true);
    });
  });
});
