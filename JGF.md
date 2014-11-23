# JGF specification

````javascript
JGF = {

	// The application that created the game record file including version identifier
	application: "ngGo v3.0.0",

	// JGF version
	version: 1,

	// Character set of the file
	charset: "UTF-8",

	// The creator of the game record
	creator: "C. Reator",

	// The source of the game record
	source: "Go magazine",

	// Any copyright notice
	copyright: "Copyright 2014",

	// Any comment about the game record itself
	comment: "This is my first JGF game record",

	// Instructions for how variations should be shown
	variations: {

		// Indicate variations with markup on the board or not
		markup: true,

		// Show variations of sucessor nodes
		children: false,

		// Show variations of current node
		siblings: true
	},

	// If converted from SGF, this node will contain additional information
	sgf: {

		// The application that created the SGF file
		application: "wGo v2.3.1",

		// The SGF file format
		format: 4
	},

	// Game information
	game: {

		// The type of game
		type: "go",

		// The game name
		name: "Lee Sedol beats Lee Chang-Ho",

		// Black player information
		black: {

			// Player name
			name: "Lee Chang-Ho",

			// Player rank, e.g. 15k, 4d, 2p
			rank: "9p",

			// Player team, if any
			team: ""
		},

		// White player information
		white: {
			name: "Lee Sedol",
			rank: "9p",
			team: ""
		},

		// The board size used
		// This can be an integer (for normal square board) or an object specifying the
		// width and height separately if the board was not square.
		size: 19,
		size: {width: 19, height: 9},

		// Komi used (can be negative)
		komi: 6.5,

		// Handicap used
		// The amount of handicap specified does not imply any particular
		// way of handicap stone placement.
		handicap: 0,

		// The game result, using the following format:
		//
		//   W+4.5 (white wins by 4.5 points)
		//   B+R (black wins by resignation)
		//   W+T (white wins by time)
		//   B+F (black wins by forfeit)
		//   0 (draw / jigo)
		//   ? (unknown result)
		//   <empty string> (no result or suspended play)
		//
		result: "W+4.5",

		// The ruleset used
		rules: "Japanese",

		// The time system used
		time: {

			// Type of time system
			type: "Byo-yomi",

			// Main time (in seconds)
			main: 7200,

			// Overtime per move (in seconds)
			overtime: 60
		},

		// Dates this game was played on
		// Each date is in YYYY-MM-DD format, but MM or DD can be ommitted if not known
		dates: ["2011-04-22", "2011-04-23"],

		// Where the game was played
		location: "Seoul",

		// The event this game was played for
		event: "3rd Fujitsu cup",

		// The round of the event
		round: "Semi finals",

		// Opening used
		opening: "Low chinese",

		// The annotator of the game
		annotator: "A. N. Notator",

		// Any general comments about the game
		comment: "These are general comments about the game"
	},

	// Moves tree
	tree: [

		// First (root) node may contain comments, board setup or just a blank board.
		// It cannot contain moves.
		{

			// Flag to indicate this is the root node
			root: true,

			// Comments are placed in an array, to separate different commentators.
			comments: [
				"These are comments shown at the start of the game.",
				"Every separate comment has it's own entry."

				//Comments can be further
			]
		},

		// Second node and onwards contain moves, setup instructions or variations
		// Moves are indicated by the player whose turn it was color and the move
		// coordinates. Move coordinates are indicated by letters, where the first
		// coordinate is the x coordinate and the latter is the y coordinate.
		{ move: {B: "mm"} },

		// Pass moves are indicated by a "pass" or empty string
		{ move: {W: "pass"} },

		// A move node may contain other annotation as well, like comments or markup
		{ move: {B: "nn"}, comments: ["Move comment", "Another comment"] },

		// A node can be named using the name property
		{ name: "Node name", move: {W: "ch"} },

		// Markup is contained in its own container, with the key defining the type of
		// markup. Default types are "circle", "triangle", "square", "mark", "label"
		// and "selected". However, any other type can be specified in order to store
		// any custom markup types in the game record as well.
		{
			move: {B: "cf"},
			markup: {

				// Regular markup has an array of coordinates to mark with that type.
				triangle: ["mm", "nn"],
				circle: ["me"],

				// Label markup has an array of label arrays, each containing the
				// coordinate as the first value, and the label to apply as the second.
				label: [["ab", "A"], ["bc", "B"], ["dg", "1"]]
			}
		},

		// Setup instructions are placed in their own container
		{

			// Setup can contain three keys, B for black stones to place, W for white
			// stones to place, and E for empty spots (e.g. remove stones)
			setup: {
				B: ["mm", "nn"],
				W: ["mf"],
				E: ["aa", "ab"]
			},

			// The player turn can be specified as well.
			turn: "W"
		},

		// When scoring a position, a scoring node is used
		{

			// Scoring instructions indicate black and white territory.
			// These points must be unique and can overlap existing stones.
			// For japanese scoring, existing (living) stone positions can be
			// excluded. For chinese scoring, they can be included.
			score: {
				B: ["aa", "ab", "ac"],
				W: ["gg", "gh"],
			}
		},

		// Variations are contained in a variations container.
		[
			// Each variation's nodes are contained in a child moves container.
			// Variation nodes themselves adhere to the same specifications.
			[
				{ move: {B: "de"} },
				{ move: {W: "ed"} }
			],
			[
				{ move: {B: "ed"} },
				{ move: {W: "de"} }
			]
		]
	]
};
````