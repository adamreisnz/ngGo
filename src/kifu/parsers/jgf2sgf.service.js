
/**
 * Jgf2Sgf :: This is a parser wrapped by the KifuParser which is used to convert fom JGF to SGF
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parsers.Jgf2Sgf.Service', [
  'ngGo',
  'ngGo.Kifu.Blank.Service'
])

/**
 * Factory definition
 */
.factory('Jgf2Sgf', function(ngGo, sgfAliases, sgfGames, KifuBlank) {

  /**
   * Flip SGF alias map and create JGF alias map
   */
  var jgfAliases = {};
  for (var sgfProp in sgfAliases) {
    if (sgfAliases.hasOwnProperty(sgfProp)) {
      jgfAliases[sgfAliases[sgfProp]] = sgfProp;
    }
  }

  /**
   * Character index of "a"
   */
  var aChar = 'a'.charCodeAt(0);

  /**
   * Helper to convert to SGF coordinates
   */
  var convertCoordinates = function(coords) {
    return String.fromCharCode(aChar + coords[0]) + String.fromCharCode(aChar + coords[1]);
  };

  /*****************************************************************************
   * Conversion helpers
   ***/

  /**
   * Helper to escape SGF info
   */
  var escapeSgf = function(text) {
    if (typeof text === 'string') {
      return text.replace(/\\/g, '\\\\').replace(/]/g, '\\]');
    }
    return text;
  };

  /**
   * Helper to write an SGF group
   */
  var writeGroup = function(prop, values, output, escape) {
    if (values.length) {
      output.sgf += prop;
      for (var i = 0; i < values.length; i++) {
        output.sgf += '[' + (escape ? escapeSgf(values[i]) : values[i]) + ']';
      }
    }
  };

  /**
   * Move parser
   */
  var parseMove = function(move, output) {

    //Determine and validate color
    var color = move.B ? 'B' : (move.W ? 'W' : '');
    if (color === '') {
      return;
    }

    //Determine move
    var coords = (move[color] === 'pass') ? '' : move[color];

    //Append to SGF
    output.sgf += color + '[' + convertCoordinates(coords) + ']';
  };

  /**
   * Setup parser
   */
  var parseSetup = function(setup, output) {

    //Loop colors
    for (var color in setup) {
      if (setup.hasOwnProperty(color)) {

        //Convert coordinates
        for (var i = 0; i < setup[color].length; i++) {
          setup[color][i] = convertCoordinates(setup[color][i]);
        }

        //Write as group
        writeGroup('A' + color, setup[color], output);
      }
    }
  };

  /**
   * Score parser
   */
  var parseScore = function(score, output) {

    //Loop colors
    for (var color in score) {
      if (score.hasOwnProperty(color)) {

        //Convert coordinates
        for (var i = 0; i < score[color].length; i++) {
          score[color][i] = convertCoordinates(score[color][i]);
        }

        //Write as group
        writeGroup('T' + color, score[color], output);
      }
    }
  };

  /**
   * Markup parser
   */
  var parseMarkup = function(markup, output) {

    //Loop markup types
    for (var type in markup) {
      if (markup.hasOwnProperty(type)) {
        var i;

        //Label type has the label text appended to the coords
        if (type === 'label') {
          for (i = 0; i < markup[type].length; i++) {
            markup[type][i] = convertCoordinates(markup[type][i]) + ':' + markup[type][i][2];
          }
        }
        else {
          for (i = 0; i < markup[type].length; i++) {
            markup[type][i] = convertCoordinates(markup[type][i]);
          }
        }

        //Convert type
        if (typeof jgfAliases[type] !== 'undefined') {
          type = jgfAliases[type];
        }

        //Write as group
        writeGroup(type, markup[type], output);
      }
    }
  };

  /**
   * Turn parser
   */
  var parseTurn = function(turn, output) {
    output.sgf += 'PL[' + turn + ']';
  };

  /**
   * Comments parser
   */
  var parseComments = function(comments, output) {

    //Determine key
    var key = (typeof jgfAliases.comments !== 'undefined') ? jgfAliases.comments : 'C';

    //Flatten comment objects
    var flatComments = [];
    for (var c = 0; c < comments.length; c++) {
      if (typeof comments[c] === 'string') {
        flatComments.push(comments[c]);
      }
      else if (comments[c].comment) {
        flatComments.push(comments[c].comment);
      }
    }

    //Write as group
    writeGroup(key, flatComments, output, true);
  };

  /**
   * Node name parser
   */
  var parseNodeName = function(nodeName, output) {
    var key = (typeof jgfAliases.name !== 'undefined') ? jgfAliases.name : 'N';
    output.sgf += key + '[' + escapeSgf(nodeName) + ']';
  };

  /**
   * Game parser
   */
  var parseGame = function(game) {

    //Loop SGF game definitions
    for (var i in sgfGames) {
      if (sgfGames.hasOwnProperty(i) && sgfGames[i] === game) {
        return i;
      }
    }

    //Not found
    return 0;
  };

  /**
   * Application parser
   */
  var parseApplication = function(application) {
    var parts = application.split(' v');
    if (parts.length > 1) {
      return parts[0] + ':' + parts[1];
    }
    return application;
  };

  /**
   * Player instructions parser
   */
  var parsePlayer = function(player, rootProperties) {

    //Variation handling
    var st = 0;
    if (!player.variation_markup) {
      st += 2;
    }
    if (player.variation_siblings) {
      st += 1;
    }

    //Set in root properties
    rootProperties.ST = st;
  };

  /**
   * Board parser
   */
  var parseBoard = function(board, rootProperties) {

    //Both width and height should be given
    if (board.width && board.height) {

      //Same dimensions?
      if (board.width === board.height) {
        rootProperties.SZ = board.width;
      }

      //Different dimensions are not supported by SGF, but OGS uses the
      //format w:h, so we will stick with that for anyone who supports it.
      else {
        rootProperties.SZ = board.width + ':' + board.height;
      }
    }

    //Otherwise, check if only width or height were given at least
    else if (board.width) {
      rootProperties.SZ = board.width;
    }
    else if (board.height) {
      rootProperties.SZ = board.height;
    }

    //Can't determine size
    else {
      rootProperties.SZ = '';
    }
  };

  /**
   * Players parser
   */
  var parsePlayers = function(players, rootProperties) {

    //Loop players
    for (var p = 0; p < players.length; p++) {

      //Validate color
      if (!players[p].color || (players[p].color !== 'black' && players[p].color !== 'white')) {
        continue;
      }

      //Get SGF color
      var color = (players[p].color === 'black') ? 'B' : 'W';

      //Name given?
      if (players[p].name) {
        rootProperties['P' + color] = players[p].name;
      }

      //Rank given?
      if (players[p].rank) {
        rootProperties[color + 'R'] = players[p].rank;
      }

      //Team given?
      if (players[p].team) {
        rootProperties[color + 'T'] = players[p].team;
      }
    }
  };

  /**
   * Parse function to property mapper
   */
  var parsingMap = {

    //Node properties
    'move': parseMove,
    'setup': parseSetup,
    'score': parseScore,
    'markup': parseMarkup,
    'turn': parseTurn,
    'comments': parseComments,
    'name': parseNodeName,

    //Info properties
    'record.application': parseApplication,
    'player': parsePlayer,
    'board': parseBoard,
    'game.type': parseGame,
    'game.players': parsePlayers
  };

  /*****************************************************************************
   * Parser functions
   ***/

  /**
   * Helper to write a JGF tree to SGF
   */
  var writeTree = function(tree, output) {

    //Loop nodes in the tree
    for (var i = 0; i < tree.length; i++) {
      var node = tree[i];

      //Array? That means a variation
      if (angular.isArray(node)) {
        for (var j = 0; j < node.length; j++) {
          output.sgf += '(\n;';
          writeTree(node[j], output);
          output.sgf += '\n)';
        }

        //Continue
        continue;
      }

      //Loop node properties
      for (var key in node) {
        if (node.hasOwnProperty(key)) {

          //Handler present in parsing map?
          if (typeof parsingMap[key] !== 'undefined') {
            parsingMap[key](node[key], output);
            continue;
          }

          //Other object, can't handle it
          if (typeof node[key] === 'object') {
            continue;
          }

          //Anything else, append it
          output.sgf += key + '[' + escapeSgf(node[key]) + ']';
        }
      }

      //More to come?
      if ((i + 1) < tree.length) {
        output.sgf += '\n;';
      }
    }
  };

  /**
   * Helper to extract all SGF root properties from a JGF object
   */
  var extractRootProperties = function(jgf, rootProperties, key) {

    //Initialize key
    if (typeof key === 'undefined') {
      key = '';
    }

    //Loop properties of jgf node
    for (var subKey in jgf) {
      if (jgf.hasOwnProperty(subKey)) {

        //Skip SGF signature (as we keep our own)
        if (subKey === 'sgf') {
          continue;
        }

        //Build jgf key
        var jgfKey = (key === '') ? subKey : key + '.' + subKey;

        //If the item is an object, handle separately
        if (typeof jgf[subKey] === 'object') {

          //Handler for this object present in parsing map?
          if (typeof parsingMap[jgfKey] !== 'undefined') {
            parsingMap[jgfKey](jgf[subKey], rootProperties);
          }

          //Otherwise, just flatten and call this function recursively
          else {
            extractRootProperties(jgf[subKey], rootProperties, jgfKey);
          }
          continue;
        }

        //Check if it's a known key, if so, append the value to the root
        var value;
        if (typeof jgfAliases[jgfKey] !== 'undefined') {

          //Handler present in parsing map?
          if (typeof parsingMap[jgfKey] !== 'undefined') {
            value = parsingMap[jgfKey](jgf[subKey]);
          }
          else {
            value = escapeSgf(jgf[subKey]);
          }

          //Set in root properties
          rootProperties[jgfAliases[jgfKey]] = value;
        }
      }
    }
  };

  /**
   * Parser class
   */
  var Parser = {

    /**
     * Parse JGF object or string into an SGF string
     */
    parse: function(jgf) {

      //String given?
      if (typeof jgf === 'string') {
        jgf = angular.fromJson(jgf);
      }

      //Must have moves tree
      if (!jgf.tree) {
        console.error('No moves tree in JGF object');
        return;
      }

      //Initialize output (as object, so it remains a reference) and root properties container
      var output = {sgf: '(\n;'};
      var root = angular.copy(jgf);
      var rootProperties = KifuBlank.sgf();

      //The first node of the JGF tree is the root node, and it can contain comments,
      //board setup parameters, etc. It doesn't contain moves. We handle it separately here
      //and attach it to the root
      if (jgf.tree && jgf.tree.length > 0 && jgf.tree[0].root) {
        root = angular.extend(root, jgf.tree[0]);
        delete root.root;
        delete jgf.tree[0];
      }

      //Set root properties
      delete root.tree;
      extractRootProperties(root, rootProperties);

      //Write root properties
      for (var key in rootProperties) {
        if (rootProperties[key]) {
          output.sgf += key + '[' + escapeSgf(rootProperties[key]) + ']';
        }
      }

      //Write game tree
      writeTree(jgf.tree, output);

      //Close SGF and return
      output.sgf += ')';
      return output.sgf;
    }
  };

  //Return object
  return Parser;
});
