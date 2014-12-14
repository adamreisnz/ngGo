/**
 * Specifications
 */
describe('KifuBlank', function() {

	//Load module and service
	beforeEach(module('ngGo.Kifu.Blank.Service'));

	//Inject KifuBlank
	var KifuBlank;
	beforeEach(inject(function(_KifuBlank_) {
		KifuBlank = _KifuBlank_;
	}));

	/**
	 * JGF blank
	 */
	describe('JGF blank', function() {

		//Create jgf
		var jgf;
		beforeEach(function() {
			jgf = KifuBlank.jgf();
		});

		/**
		 * Object creation
		 */
		it('should create an object', function() {
			expect(typeof jgf).toBe('object');
		});

		/**
		 * Record info
		 */
		it('should have valid record info', function() {
			expect(jgf.record).toBeDefined();
			expect(jgf.record.application).toBeDefined();
			expect(jgf.record.application).not.toBe("");
			expect(jgf.record.version).toBe(1);
			expect(jgf.record.charset).toBe('UTF-8');
		});

		/**
		 * Game type
		 */
		it('should have game info and game type', function() {
			expect(jgf.game).toBeDefined();
			expect(jgf.game.type).toBe('go');
		});

		/**
		 * Player info
		 */
		it('should have basic player information', function() {
			expect(jgf.game.players).toBeDefined();
			expect(jgf.game.players[0]).toBeDefined();
			expect(jgf.game.players[1]).toBeDefined();
			expect(jgf.game.players[0].color).toBeDefined();
			expect(jgf.game.players[1].color).toBeDefined();
			expect(jgf.game.players[0].name).toBeDefined();
			expect(jgf.game.players[1].name).toBeDefined();
		});

		/**
		 * Board info
		 */
		it('should have board size information', function() {
			expect(jgf.board).toBeDefined();
			expect(jgf.board.width).toBeDefined();
			expect(jgf.board.height).toBeDefined();
			expect(jgf.board.width).toBeGreaterThan(0);
			expect(jgf.board.height).toBeGreaterThan(0);
		});

		/**
		 * Game tree
		 */
		it('should have an empty game tree', function() {
			expect(jgf.tree).toEqual([]);
		});
	});

	/**
	 * JGF blank with base
	 */
	describe('JGF blank with base', function() {

		//Create jgf
		var jgf, base = {
			record: {
				application: "Test app",
				source: "Test source"
			},
			game: {
				name: "Test name"
			}
		};
		beforeEach(function() {
			jgf = KifuBlank.jgf(base);
		});

		/**
		 * Object creation
		 */
		it('should create an object', function() {
			expect(typeof jgf).toBe('object');
		});

		/**
		 * Property containers
		 */
		it('should still have all property containers', function() {
			expect(jgf.record).toBeDefined();
			expect(jgf.game).toBeDefined();
			expect(jgf.board).toBeDefined();
			expect(jgf.tree).toBeDefined();
		});

		/**
		 * Base properties
		 */
		it('should have new base properties', function() {
			expect(jgf.record.source).toBe("Test source");
			expect(jgf.game.name).toBe("Test name");
		});

		/**
		 * Overwritten properties
		 */
		it('should overwrite existing properties', function() {
			expect(jgf.record.application).toBe("Test app");
		});
	});

	/**
	 * SGF blank
	 */
	describe('SGF blank', function() {

		//Create jgf
		var sgf;
		beforeEach(function() {
			sgf = KifuBlank.sgf();
		});

		/**
		 * Object creation
		 */
		it('should create an object', function() {
			expect(typeof sgf).toBe('object');
		});

		/**
		 * Application info
		 */
		it('should have application info', function() {
			expect(sgf.AP).toBeDefined();
			expect(sgf.AP).not.toBe("");
		});

		/**
		 * Character encoding
		 */
		it('should have character encoding', function() {
			expect(sgf.CA).toBe("UTF-8");
		});

		/**
		 * File format
		 */
		it('should have a file format/version', function() {
			expect(sgf.FF).toBe("4");
		});

		/**
		 * Game type
		 */
		it('should have a go game type', function() {
			expect(sgf.GM).toBe("1");
		});

		/**
		 * Board size
		 */
		it('should have board size info', function() {
			expect(sgf.SZ).toBeDefined();
			expect(sgf.SZ).not.toBe("");
			expect(sgf.SZ).not.toBe("0");
		});

		/**
		 * Player info
		 */
		it('should have player info', function() {
			expect(sgf.PB).toBeDefined();
			expect(sgf.PB).not.toBe("");
			expect(sgf.PW).toBeDefined();
			expect(sgf.PW).not.toBe("");
		});
	});

	/**
	 * SGF blank with base
	 */
	describe('SGF blank with base', function() {

		//Create jgf
		var sgf, base = {
			AP: "Test app",
			KM: "6.5"
		};
		beforeEach(function() {
			sgf = KifuBlank.sgf(base);
		});

		/**
		 * Object creation
		 */
		it('should still create an object', function() {
			expect(typeof sgf).toBe('object');
		});

		/**
		 * Base properties
		 */
		it('should have new base properties', function() {
			expect(sgf.KM).toBe("6.5");
		});

		/**
		 * Overwritten properties
		 */
		it('should overwrite existing properties', function() {
			expect(sgf.AP).toBe("Test app");
		});
	});
});