# JGF specification

````javascript
JGF = {
	application: "WGo 2.3.1",
	charset: "UTF-8",
	version: "1.0",
	sgfformat: "4", //If it was converted from SGF (FF property)
	game: "go",
	size: 19,
	variations: 2,
	info: {
		name: "Lee Sedol beats Lee Chang-Ho",
		black: {name: "Lee Chang-Ho", rank: "9p", team: "", territory: 46},
		white: {name: "Lee Sedol", rank: "9p", team: "", territory: 44},
		komi: 6.5,
		handicap: 0,
		result: "W+4.5",
		rules: "Japanese",
		time: 7200,
		overtime: "1 minute per move",
		dates: ["2011-04-22", "2011-04-23"],
		location: "Seoul",
		event: "3rd Fujitsu cup",
		round: "Semi finals",
		opening: "Low chinese",
		annotator: "A. N. Notator",
		typist: "User or program",
		source: "Go magazine",
		copyright: "Copyright 2014",
		comment: "..."
	},
	tree: [

		//First (root) node may contain comments, board setup or just a blank board
		{root: true, comments: []},

		//Second node and onwards contain moves, setup instructions or variations
		{move: {B: "mm"}},
		{move: {W: "nn"}, comments: ["Move comment", "Another comment"]},
		{move: {B: "cd"}, markup: {triangle: ["mm", "nn"], label: ["ab:A", "bc:B"]}},
		{setup: {B: ["mm", "nn"], E: ["aa", "ab"]}, turn: "W"},
		{move: {W: "pass"}},

		//Variations are contained in an array
		[
			//Each variation's nodes are contained in a sub array
			[
				{move: {B: "de"}},
				{move: {W: "ed"}}
			],
			[
				{move: {B: "ed"}},
				{move: {W: "de"}}
			]
		]
	]
};
````