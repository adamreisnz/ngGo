
/**
 * PlayerModeSolve :: This module governs the "solve" mode of the player, e.g. trying to solve
 * go problems and finding the right move or variations.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Solve.Service', [
  'ngGo'
])

/**
 * Extend player functionality and register the mode
 */
.run(function(Player, PlayerModes, PlayerModeSolve) {

  //Register event handlers
  Player.on('settingChange', PlayerModeSolve.settingChange, PlayerModes.SOLVE);
  Player.on('boardUpdate', PlayerModeSolve.boardUpdate, PlayerModes.SOLVE);
  Player.on('pathChange', PlayerModeSolve.pathChange, PlayerModes.SOLVE);
  Player.on('modeEnter', PlayerModeSolve.modeEnter, PlayerModes.SOLVE);
  Player.on('modeExit', PlayerModeSolve.modeExit, PlayerModes.SOLVE);
  Player.on('keydown', PlayerModeSolve.keyDown, PlayerModes.SOLVE);
  Player.on('click', PlayerModeSolve.click, PlayerModes.SOLVE);
  Player.on('hover', PlayerModeSolve.hover, PlayerModes.SOLVE);

  //Register mode
  Player.registerMode(PlayerModes.SOLVE, PlayerModeSolve);
})

/**
 * Provider definition
 */
.provider('PlayerModeSolve', function(StoneColor) {

  /**
   * Default configuration
   */
  var defaultConfig = {

    //Player color
    player_color: StoneColor.B,

    //Show solution paths
    solution_paths: false,

    //Auto play settings
    solve_auto_play: true,
    solve_auto_play_delay: 500
  };

  /**
   * Set global default configuration for players
   */
  this.setConfig = function(config) {
    defaultConfig = angular.extend(defaultConfig, config);
  };

  /**
   * Service getter
   */
  this.$get = function($timeout, Player, PlayerModes, PlayerTools, KeyCodes) {

    /**
     * Check if we can make a move
     */
    var canMakeMove = function() {

      //We can make a move when...

      //...there is no auto play going on
      if (!this.solveAutoPlay) {
        return true;
      }

      //...we solved the puzzle already
      if (this.problemSolved) {
        return true;
      }

      //...we are off path
      if (this.problemOffPath) {
        return true;
      }

      //...it's our turn
      if (this.game.getTurn() === this.playerColor) {
        return true;
      }

      //Otherwise, we can't make a move
      return false;
    };

    /**
     * Helper to update the hover mark
     */
    var updateHoverMark = function(x, y) {

      //If no coordinates specified, use last mouse coordinates
      if (typeof x === 'undefined' || typeof y === 'undefined') {
        x = this.mouse.lastX;
        y = this.mouse.lastY;
      }

      //Falling outside of grid?
      if (!this.board || !this.board.isOnBoard(x, y)) {
        return;
      }

      //What happens, depends on the active tool
      switch (this.tool) {

        //Move tool
        case PlayerTools.MOVE:

          //Hovering over empty spot where we can make a move?
          if (canMakeMove.call(this) && this.game.isValidMove(x, y)) {
            this.board.add('hover', x, y, {
              type: 'stones',
              value: this.game.getTurn()
            });
          }
          break;
      }
    };

    /**
     * Helper to show solution paths
     */
    var showSolutionPaths = function(variations) {
      for (var i = 0; i < variations.length; i++) {
        if (variations[i].solution === true) {
          this.board.add('markup', variations[i].move.x, variations[i].move.y, {
            type: this.board.theme.get('markup.solution.valid.type'),
            text: this.board.theme.get('markup.solution.valid.text', i),
            scale: this.board.theme.get('markup.solution.valid.scale'),
            color: this.board.theme.get('markup.solution.valid.color')
          });
        }
        else {
          this.board.add('markup', variations[i].move.x, variations[i].move.y, {
            type: this.board.theme.get('markup.solution.invalid.type'),
            text: this.board.theme.get('markup.solution.invalid.text', i),
            scale: this.board.theme.get('markup.solution.invalid.scale'),
            color: this.board.theme.get('markup.solution.invalid.color')
          });
        }
      }
    };

    /**
     * Helper to hide solution paths
     */
    var hideSolutionPaths = function(variations) {
      for (var i = 0; i < variations.length; i++) {
        this.board.remove('markup', variations[i].move.x, variations[i].move.y);
      }
    };

    /**
     * Draw (or clear) solution paths
     */
    var drawSolutionPaths = function(show) {

      //Check if we can do something
      if (!this.board || !this.game || !this.game.isLoaded()) {
        return;
      }

      //Get node and variations
      var node = this.game.getNode();
      var variations = node.getMoveVariations();

      //When showing, make sure it's not during the auto solver's move
      if (show && !this.problemSolved && this.solveAutoPlay) {
        if (this.game.getTurn() !== this.playerColor) {
          hideSolutionPaths.call(this, variations);
          return;
        }
      }

      //Call helper
      if (show) {
        showSolutionPaths.call(this, variations);
      }
      else {
        hideSolutionPaths.call(this, variations);
      }
    };

    /**
     * Player extension
     */
    angular.extend(Player, {

      //Solved and off-path flags
      problemSolved: false,
      problemOffPath: false,

      //Problem start path
      problemStartPath: null,

      //The player color
      playerColor: 0,

      //Solution paths
      solutionPaths: false,

      //Auto play vars
      solveAutoPlay: true,
      solveAutoPlayDelay: 500,

      //Navigation blocked flag
      solveNavigationBlocked: false,

      /**
       * Set solve auto play delay
       */
      setSolveAutoPlay: function(autoPlay) {
        if (this.solveAutoPlay !== autoPlay) {
          this.solveAutoPlay = autoPlay;
          this.broadcast('settingChange', 'solveAutoPlay');
        }
      },

      /**
       * Set solve auto play delay
       */
      setSolveAutoPlayDelay: function(delay) {
        if (this.solveAutoPlayDelay !== delay) {
          this.solveAutoPlayDelay = delay;
          this.broadcast('settingChange', 'solveAutoPlayDelay');
        }
      },

      /**
       * Set player color
       */
      setPlayerColor: function(color) {
        if (this.playerColor !== color) {
          this.playerColor = color;
          this.broadcast('settingChange', 'playerColor');
        }
      },

      /**
       * Get player color
       */
      getPlayerColor: function(asOnBoard) {
        if (asOnBoard && this.board) {
          return this.board.colorMultiplier * this.playerColor;
        }
        return this.playerColor;
      },

      /**
       * Toggle solution paths
       */
      toggleSolutionPaths: function(solutionPaths) {

        //Toggle if not given
        if (typeof solutionPaths === 'undefined') {
          solutionPaths = !this.solutionPaths;
        }

        //Change?
        if (solutionPaths !== this.solutionPaths) {
          this.solutionPaths = solutionPaths;
          this.broadcast('settingChange', 'solutionPaths');
        }
      },

      /**
       * Auto play next move
       */
      autoPlayNext: function(immediately) {

        //Must have game and children
        if (!this.game || !this.game.isLoaded() || this.game.node.children.length === 0) {
          return;
        }

        //Init vars
        var children = [];
        var self = this;
        var i;

        //When picking a child node, we always prefer to pick a valid solution
        for (i = 0; i < this.game.node.children.length; i++) {
          if (this.game.node.children[i].solution) {
            children.push(this.game.node.children[i]);
          }
        }

        //No solution nodes? Just use all nodes then.
        if (children.length === 0) {
          children = this.game.node.children;
        }

        //Pick a random child node
        i = Math.floor(Math.random() * children.length);

        //No delay?
        if (immediately || !this.solveAutoPlayDelay) {
          this.next(children[i]);
          return;
        }

        //Block navigation and run the timeout
        this.solveNavigationBlocked = true;
        $timeout(function() {

          //Move to next move and unblock navigation
          self.next(children[i]);
          self.solveNavigationBlocked = false;

        }, this.solveAutoPlayDelay);
      },

      /**
       * Start solving from the current game node
       */
      solve: function() {

        //Must have a game
        if (!this.game || !this.game.isLoaded()) {
          return false;
        }

        //Reset flags
        this.problemSolved = false;
        this.problemOffPath = false;

        //Remember problem start path
        this.problemStartPath = this.game.getPath(true);

        //Restrict start of navigation to the current node
        this.restrictNode();

        //Auto play next move if it's not our turn
        if (this.solveAutoPlay && this.game.getTurn() !== this.playerColor) {
          this.autoPlayNext();
        }
      },

      /**
       * Restart the problem
       */
      restartProblem: function() {

        //Must be in solve mode, must have game
        if (this.mode !== PlayerModes.SOLVE || !this.game || !this.game.isLoaded()) {
          return;
        }

        //Reset flags
        this.problemSolved = false;
        this.problemOffPath = false;

        //Go back to the start path
        if (this.problemStartPath) {
          this.goto(this.problemStartPath);
        }

        //Auto play next move if it's not our turn
        if (this.solveAutoPlay && this.game.getTurn() !== this.playerColor) {
          this.autoPlayNext();
        }
      }
    });

    /**
     * Player mode definition
     */
    var PlayerModeSolve = {

      /**
       * Parse config instructions
       */
      parseConfig: function(config) {

        //Extend from default config
        this.config = angular.extend({}, this.config, defaultConfig, config || {});

        //Process settings
        this.toggleSolutionPaths(this.config.solution_paths);
        this.setPlayerColor(this.config.player_color);
        this.setSolveAutoPlay(this.config.solve_auto_play);
        this.setSolveAutoPlayDelay(this.config.solve_auto_play_delay);
      },

      /**
       * Setting changes handler
       */
      settingChange: function(event, setting) {

        //Solution paths setting changes?
        if (setting === 'solutionPaths') {
          drawSolutionPaths.call(this, this.solutionPaths);
        }

        //Player color changed?
        if (setting === 'playerColor') {

          //Draw (or hide) solution paths
          drawSolutionPaths.call(this, this.solutionPaths);

          //Make an auto play move if it's not our turn
          if (
            !this.problemSolved && this.solveAutoPlay && this.game.getTurn() !== this.playerColor
          ) {
            this.autoPlayNext(true);
          }
        }
      },

      /**
       * Hover handler
       */
      hover: function(event) {

        //Update hover mark
        if (this.board) {
          this.board.removeAll('hover');
          updateHoverMark.call(this, event.x, event.y);
        }
      },

      /**
       * Board update event handler
       */
      boardUpdate: function() {

        //Show move variations
        if (this.solutionPaths) {
          drawSolutionPaths.call(this, true);
        }
      },

      /**
       * Handler for keydown events
       */
      keyDown: function(event, keyboardEvent) {

        //Switch key code
        switch (keyboardEvent.keyCode) {

          //Right arrow
          case KeyCodes.RIGHT:

            //Arrow keys navigation enabled?
            if (this.arrowKeysNavigation) {
              keyboardEvent.preventDefault();

              //Navigation not blocked?
              if (!this.solveNavigationBlocked && this.game.node !== this.restrictNodeEnd) {

                //Go forward one move if solved
                if (this.problemSolved) {
                  this.next();
                }
              }
            }
            break;

          //Left arrow
          case KeyCodes.LEFT:

            //Arrow keys navigation enabled?
            if (this.arrowKeysNavigation) {
              keyboardEvent.preventDefault();

              //Navigation not blocked and not reached the start?
              if (!this.solveNavigationBlocked && this.game.node !== this.restrictNodeStart) {

                //Go back one move
                this.previous();

                //Go back one more if this is not the player's turn and if
                //the problem hasn't been solved yet
                if (
                  !this.problemSolved && this.solveAutoPlay &&
                  this.game.getTurn() === -this.playerColor
                ) {
                  this.previous();
                }
              }
            }
            break;
        }
      },

      /**
       * Handler for mouse click events
       */
      click: function(event) {

        //Falling outside of grid?
        if (!this.board || !this.board.isOnBoard(event.x, event.y)) {
          return;
        }

        //A valid variation
        if (this.game.isMoveVariation(event.x, event.y)) {

          //Get the node
          var i = this.game.getMoveVariation(event.x, event.y);

          //Advance to the next position and get the next node
          this.next(i);
          var node = this.game.getNode();

          //No children left? Check if we solved it or not
          if (node.children.length === 0) {
            if (node.solution === true) {
              this.problemSolved = true;
              this.broadcast('solutionFound', node);
            }
            else {
              this.broadcast('solutionWrong', node);
            }
          }

          //Auto-play next move?
          else if (!this.problemSolved && this.solveAutoPlay) {
            this.autoPlayNext();
          }
        }

        //Unknown variation, try to play
        else if (this.game.play(event.x, event.y)) {
          this.problemOffPath = true;
          this.processPosition();
          this.broadcast('solutionOffPath', this.game.getNode());
        }
      },

      /**
       * Path change event
       */
      pathChange: function() {

        //Update hover mark
        if (this.board) {
          this.board.removeAll('hover');
          updateHoverMark.call(this);
        }
      },

      /**
       * Handler for mode entry
       */
      modeEnter: function() {

        //Set available tools for this mode
        this.setTools([
          PlayerTools.MOVE
        ]);

        //Set default tool
        this.tool = this.tools[0];

        //Draw solution variations
        if (this.solutionPaths) {
          drawSolutionPaths.call(this, true);
        }
      },

      /**
       * Handler for mode exit
       */
      modeExit: function() {

        //Hide any solution variations
        if (this.solutionPaths) {
          drawSolutionPaths.call(this, false);
        }
      }
    };

    //Return
    return PlayerModeSolve;
  };
});
