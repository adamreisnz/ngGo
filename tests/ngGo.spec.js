/**
 * Specifications
 */
describe('ngGo', function() {

  //Load module and service
  beforeEach(module('ngGo'));

  /**
   * Main test
   */
  it('should run this test', function() {
    expect(true).toBe(true);
  });

  /**
   * ngGo constant
   */
  describe('constant', function() {

    //Inject ngGo constant
    var ngGo;
    beforeEach(inject(function(_ngGo_) {
      ngGo = _ngGo_;
    }));

    /**
     * Name and version
     */
    it('should contain our name and version', function() {
      expect(ngGo.name).toBeDefined();
      expect(ngGo.name).toEqual('ngGo');
      expect(ngGo.version).toBeDefined();
      expect(ngGo.version).toMatch(/[0-9]\.[0-9]+\.[0-9]+/);
    });

    /**
     * Error definitions
     */
    it('should contain error definitions', function() {
      expect(ngGo.error).toBeDefined();
      expect(typeof ngGo.error).toEqual('object');
    });
  });

  /**
   * Stone color constant
   */
  describe('StoneColor constant', function() {

    //Inject StoneColor constant
    var StoneColor;
    beforeEach(inject(function(_StoneColor_) {
      StoneColor = _StoneColor_;
    }));

    /**
     * White color
     */
    it('should have two matching white color definitions', function() {
      expect(StoneColor.W).toBeDefined();
      expect(StoneColor.WHITE).toBeDefined();
      expect(StoneColor.W).toBe(StoneColor.WHITE);
    });

    /**
     * Black color
     */
    it('should have two matching black color definitions', function() {
      expect(StoneColor.B).toBeDefined();
      expect(StoneColor.BLACK).toBeDefined();
      expect(StoneColor.B).toBe(StoneColor.BLACK);
    });

    /**
     * Empty color
     */
    it('should have two matching empty color definitions', function() {
      expect(StoneColor.E).toBeDefined();
      expect(StoneColor.EMPTY).toBeDefined();
      expect(StoneColor.E).toBe(StoneColor.EMPTY);
    });
  });
});
