/**
 * Specifications
 */
describe('KifuParser', function() {

  //Load module and service
  beforeEach(module('ngGo.Kifu.Parser.Service'));

  //Inject KifuParser
  var KifuParser;
  beforeEach(inject(function(_KifuParser_) {
    KifuParser = _KifuParser_;
  }));

  /**
   * Conversion methods
   */
  it('should have two way conversion methods', function() {
    expect(typeof KifuParser.jgf2sgf).toBe('function');
    expect(typeof KifuParser.sgf2jgf).toBe('function');
  });
});
