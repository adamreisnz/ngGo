describe('BoardGrid', function() {
  let BoardGrid;

  //Load modules
  beforeEach(module('ngGo.Board.Grid.Service'));

  //Get injectable functions
  beforeEach(inject(function(_BoardGrid_) {
    BoardGrid = _BoardGrid_;
  }));

  describe('#constructor', function() {
    it('should have default properties', function() {
      const grid = new BoardGrid();
      expect(grid).toEqual(jasmine.objectContaining({
        width: 0,
        height: 0,
        grid: [],
        emptyValue: null,
      }));
    });

    it('should have specified size', function() {
      const grid = new BoardGrid(13, 19);
      expect(grid).toEqual(jasmine.objectContaining({
        width: 13,
        height: 19,
        emptyValue: null,
      }));
      expect(grid.grid.length).toEqual(13);
      expect(grid.grid[0].length).toEqual(19);
    });

    it('should have specified size and empty value', function() {
      const grid = new BoardGrid(13, 19, -1);
      expect(grid).toEqual(jasmine.objectContaining({
        width: 13,
        height: 19,
        emptyValue: -1,
      }));
      expect(grid.grid.length).toEqual(13);
      expect(grid.grid[0].length).toEqual(19);
      expect(grid.grid[0][0]).toEqual(-1);
    });
  });

  describe('#isSameAs', function() {
    //Initialize board grids
    beforeAll(function() {
      this.gridBase = new BoardGrid(3, 3);
      this.gridDiffSize = new BoardGrid(5, 5);
      this.gridEmpty = new BoardGrid(3, 3);
      this.gridDiffStones = new BoardGrid(3, 3);
    });

    //Specify fake stones
    beforeAll(function() {
      this.gridBase.grid = [
        [0, 1, -1],
        [-1, 0, 1],
        [1, -1, 0],
      ];
      this.gridDiffStones.grid = [
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0],
      ];
    });

    it('from the view of base', function() {
      expect(this.gridBase.isSameAs(this.gridBase)).toEqual(true);
      expect(this.gridBase.isSameAs(this.gridDiffSize)).toEqual(false);
      expect(this.gridBase.isSameAs(this.gridEmpty)).toEqual(false);
      expect(this.gridBase.isSameAs(this.gridDiffStones)).toEqual(false);
    });

    it('from the view of different grid', function() {
      expect(this.gridDiffStones.isSameAs(this.gridBase)).toEqual(false);
      expect(this.gridDiffStones.isSameAs(this.gridDiffSize)).toEqual(false);
      expect(this.gridDiffStones.isSameAs(this.gridEmpty)).toEqual(false);
      expect(this.gridDiffStones.isSameAs(this.gridDiffStones)).toEqual(true);
    });
  });
});
