
/**
 * Jgf2Sgf :: This is a parser wrapped by the KifuParser which is used to convert fom JGF to SGF
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Kifu.Parsers.Jgf2Sgf.Service', [
  'ngGo',
  'ngGo.Kifu.Blank.Service',
])

/**
 * Factory definition
 */
.factory('Jgf2Sgf', function(ngGo, sgfAliases, sgfGames, KifuBlank) {

  /**
   * Flip SGF alias map and create JGF alias map
   */
  let jgfAliases = {};
  for (let sgfProp in sgfAliases) {
    if (sgfAliases.hasOwnProperty(sgfProp)) {
      jgfAliases[sgfAliases[sgfProp]] = sgfProp;
    }
  }

  /**
   * Character index of "a"
   */
  let aChar = 'a'.charCodeAt(0);

  /**
   * Helper to convert to SGF coordinates
   */
  function convertCoordinates(coords) {
    return String.fromCharCode(aChar + coords[0]) + String.fromCharCode(aChar + coords[1]);
  }

  /**************************************************************************
   * Conversion helpers
   ***/

  /**
   * Helper to escape SGF info
   */
  function escapeSgf(text) {
    if (typeof text === 'string') {
      return text.replace(/\\/g, '\\\\').replace(/]/g, '\\]');
    }
    return text;
  }

  /**
   * Helper to write an SGF group
   */
  function writeGroup(prop, values, output, escape) {
    if (values.length) {
      output.sgf += prop;
      for (let i = 0; i < values.length; i++) {
        output.sgf += '[' + (escape ? escapeSgf(values[i]) : values[i]) + ']';
      }
    }
  }

  /**
   * Move parser
   */
  function parseMove(move, output) {

    //Determine and validate color
    let color = move.B ? 'B' : (move.W ? 'W' : '');
    if (color === '') {
      return;
    }

    //Determine move
    let coords = (move[color] === 'pass') ? '' : move[color];

    //Append to SGF
    output.sgf += color + '[' + convertCoordinates(coords) + ']';
  }

  /**
   * Setup parser
   */
  function parseSetup(setup, output) {

    //Loop colors
    for (let color in setup) {
      if (setup.hasOwnProperty(color)) {

        //Convert coordinates
        for (let i = 0; i < setup[color].length; i++) {
          setup[color][i] = convertCoordinates(setup[color][i]);
        }

        //Write as group
        writeGroup('A' + color, setup[color], output);
      }
    }
  }

  /**
   * Score parser
   */
  function parseScore(score, output) {

    //Loop colors
    for (let color in score) {
      if (score.hasOwnProperty(color)) {

        //Convert coordinates
        for (let i = 0; i < score[color].length; i++) {
          score[color][i] = convertCoordinates(score[color][i]);
        }

        //Write as group
        writeGroup('T' + color, score[color], output);
      }
    }
  }

  /**
   * Markup parser
   */
  function parseMarkup(markup, output) {

    //Loop markup types
    for (let type in markup) {
      if (markup.hasOwnProperty(type)) {
        let i;

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
  }

  /**
   * Turn parser
   */
  function parseTurn(turn, output) {
    output.sgf += 'PL[' + turn + ']';
  }

  /**
   * Comments parser
   */
  function parseComments(comments, output) {

    //Determine key
    let key = (typeof jgfAliases.comments !== 'undefined') ? jgfAliases.comments : 'C';

    //Flatten comment objects
    let flatComments = [];
    for (let c = 0; c < comments.length; c++) {
      if (typeof comments[c] === 'string') {
        flatComments.push(comments[c]);
      }
      else if (comments[c].comment) {
        flatComments.push(comments[c].comment);
      }
    }

    //Write as group
    writeGroup(key, flatComments, output, true);
  }

  /**
   * Node name parser
   */
  function parseNodeName(nodeName, output) {
    let key = (typeof jgfAliases.name !== 'undefined') ? jgfAliases.name : 'N';
    output.sgf += key + '[' + escapeSgf(nodeName) + ']';
  }

  /**
   * Game parser
   */
  function parseGame(game) {

    //Loop SGF game definitions
    for (let i in sgfGames) {
      if (sgfGames.hasOwnProperty(i) && sgfGames[i] === game) {
        return i;
      }
    }

    //Not found
    return 0;
  }

  /**
   * Application parser
   */
  function parseApplication(application) {
    let parts = application.split(' v');
    if (parts.length > 1) {
      return parts[0] + ':' + parts[1];
    }
    return application;
  }

  /**
   * Player instructions parser
   */
  function parsePlayer(player, rootProperties) {

    //Variation handling
    let st = 0;
    if (!player.variationMarkup) {
      st += 2;
    }
    if (player.variationSiblings) {
      st += 1;
    }

    //Set in root properties
    rootProperties.ST = st;
  }

  /**
   * Board parser
   */
  function parseBoard(board, rootProperties) {

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
  }

  /**
   * Players parser
   */
  function parsePlayers(players, rootProperties) {

    //Loop players
    for (let p = 0; p < players.length; p++) {

      //Validate color
      if (!players[p].color || (players[p].color !== 'black' && players[p].color !== 'white')) {
        continue;
      }

      //Get SGF color
      let color = (players[p].color === 'black') ? 'B' : 'W';

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
  }

  /**
   * Parse function to property mapper
   */
  let parsingMap = {

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
    'game.players': parsePlayers,
  };

  /**************************************************************************
   * Parser functions
   ***/

  /**
   * Helper to write a JGF tree to SGF
   */
  function writeTree(tree, output) {

    //Loop nodes in the tree
    for (let i = 0; i < tree.length; i++) {
      let node = tree[i];

      //Array? That means a variation
      if (angular.isArray(node)) {
        for (let j = 0; j < node.length; j++) {
          output.sgf += '(\n;';
          writeTree(node[j], output);
          output.sgf += '\n)';
        }

        //Continue
        continue;
      }

      //Loop node properties
      for (let key in node) {
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
  }

  /**
   * Helper to extract all SGF root properties from a JGF object
   */
  function extractRootProperties(jgf, rootProperties, key) {

    //Initialize key
    if (typeof key === 'undefined') {
      key = '';
    }

    //Loop properties of jgf node
    for (let subKey in jgf) {
      if (jgf.hasOwnProperty(subKey)) {

        //Skip SGF signature (as we keep our own)
        if (subKey === 'sgf') {
          continue;
        }

        //Build jgf key
        let jgfKey = (key === '') ? subKey : key + '.' + subKey;

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
        let value;
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
  }

  /**
   * Parser class
   */
  let Parser = {

    /**
     * Parse JGF object or string into an SGF string
     */
    parse(jgf) {

      //String given?
      if (typeof jgf === 'string') {
        jgf = angular.fromJson(jgf);
      }

      //Must have moves tree
      if (!jgf.tree) {
        throw new Error('No moves tree in JGF object');
      }

      //Initialize output (as object, so it remains a reference) and root properties container
      let output = {sgf: '(\n;'};
      let root = angular.copy(jgf);
      let rootProperties = KifuBlank.sgf();

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
      for (let key in rootProperties) {
        if (rootProperties[key]) {
          output.sgf += key + '[' + escapeSgf(rootProperties[key]) + ']';
        }
      }

      //Write game tree
      writeTree(jgf.tree, output);

      //Close SGF and return
      output.sgf += ')';
      return output.sgf;
    },
  };

  //Return object
  return Parser;
});
