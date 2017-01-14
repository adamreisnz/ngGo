
/**
 * PlayerModeCommon :: This class governs common event handling of the player shared by
 * various player modes. It's basically an abstract player mode and it can't be actively set.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Player.Mode.Common.Service', [
  'ngGo',
  'ngGo.Game.Scorer.Service',
])

/**
 * Run block
 */
.run(function(Player, PlayerModes, PlayerModeCommon) {

  /**
   * Register common event handlers
   */
  Player.on('keydown', PlayerModeCommon.keyDown, [
    PlayerModes.REPLAY, PlayerModes.EDIT,
  ]);
  Player.on('mousewheel wheel', PlayerModeCommon.mouseWheel, [
    PlayerModes.REPLAY, PlayerModes.EDIT,
  ]);
  Player.on('mousemove', PlayerModeCommon.mouseMove, [
    PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE,
  ]);
  Player.on('mouseout', PlayerModeCommon.mouseOut, [
    PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE,
  ]);
  Player.on('mousedown', PlayerModeCommon.mouseDown, [
    PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE,
  ]);
  Player.on('mouseup', PlayerModeCommon.mouseUp, [
    PlayerModes.REPLAY, PlayerModes.EDIT, PlayerModes.SOLVE,
  ]);
})

/**
 * Factory definition
 */
.factory('PlayerModeCommon', function(Player, PlayerTools, GameScorer, KeyCodes) {

  /**
   * Helper to build drag object
   */
  function dragObject(event) {

    //Initialize drag object
    let drag = {
      start: {
        x: (this.mouse.dragStart.x > event.x) ? event.x : this.mouse.dragStart.x,
        y: (this.mouse.dragStart.y > event.y) ? event.y : this.mouse.dragStart.y,
      },
      stop: {
        x: (this.mouse.dragStart.x > event.x) ? this.mouse.dragStart.x : event.x,
        y: (this.mouse.dragStart.y > event.y) ? this.mouse.dragStart.y : event.y,
      },
    };

    //Fix boundaries
    if (drag.start.x < 0) {
      drag.start.x = 0;
    }
    if (drag.start.y < 0) {
      drag.start.y = 0;
    }
    if (drag.stop.x > this.board.width - 1) {
      drag.stop.x = this.board.width - 1;
    }
    if (drag.stop.y > this.board.height - 1) {
      drag.stop.y = this.board.height - 1;
    }

    //Return
    return drag;
  }

  /**
   * Normalize the mousewheel event helper
   */
  function normalizeMousewheelEvent(event) {

    //Initialize vars
    let deltaX = 0;
    let deltaY = 0;

    //Old school scrollwheel delta
    if ('detail' in event) {
      deltaY = event.detail * -1;
    }
    if ('wheelDelta' in event) {
      deltaY = event.wheelDelta;
    }
    if ('wheelDeltaY' in event) {
      deltaY = event.wheelDeltaY;
    }
    if ('wheelDeltaX' in event) {
      deltaX = event.wheelDeltaX * -1;
    }

    // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
    if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
      deltaX = deltaY * -1;
      deltaY = 0;
    }

    //New type wheel delta (WheelEvent)
    if ('deltaY' in event) {
      deltaY = event.deltaY * -1;
    }
    if ('deltaX' in event) {
      deltaX = event.deltaX;
    }

    //Set in event (have to use different property name because of strict mode)
    event.mouseWheelX = deltaX;
    event.mouseWheelY = deltaY;

    //Return
    return event;
  }

  /**
   * Player extension
   */
  angular.extend(Player, {

    /**
     * Mouse coordinate helper vars
     */
    mouse: {

      //Drag start
      dragStart: null,

      //Last grid coordinates
      lastX: -1,
      lastY: -1,
    },
  });

  /**
   * Player mode definition
   */
  let PlayerMode = {

    /**
     * Handler for keydown events
     */
    keyDown: function(event, keyboardEvent) {

      //No game?
      if (!this.game || !this.game.isLoaded()) {
        return;
      }

      //Switch key code
      switch (keyboardEvent.keyCode) {

        //ESC
        case KeyCodes.ESC:

          //Cancel drag event, and prevent click event as well
          this.mouse.dragStart = null;
          this.preventClickEvent = true;
          break;

        //Right arrow
        case KeyCodes.RIGHT:

          //Arrow navigation enabled?
          if (this.arrowKeysNavigation) {
            keyboardEvent.preventDefault();

            //Advance to the next move
            if (this.tool === PlayerTools.MOVE && this.game.node !== this.restrictNodeEnd) {
              this.next();
            }
          }
          break;

        //Left arrow
        case KeyCodes.LEFT:

          //Arrow navigation enabled?
          if (this.arrowKeysNavigation) {
            keyboardEvent.preventDefault();

            //Go to the previous move
            if (this.tool === PlayerTools.MOVE && this.game.node !== this.restrictNodeStart) {
              this.previous();
            }
          }
          break;

        //Up arrow
        case KeyCodes.UP:
          break;

        //Down arrow
        case KeyCodes.DOWN:
          break;
      }
    },

    /**
     * Handler for mousewheel events
     */
    mouseWheel: function(event, mouseEvent) {

      //Disabled or not using move tool?
      if (!this.scrollWheelNavigation || this.tool !== PlayerTools.MOVE) {
        return true;
      }

      //No game?
      if (!this.game || !this.game.isLoaded()) {
        return true;
      }

      //Normalize mousewheel event
      mouseEvent = normalizeMousewheelEvent(mouseEvent);

      //Find delta
      let delta = mouseEvent.mouseWheelY || mouseEvent.deltaY;

      //Next move
      if (delta < 0) {
        if (this.board) {
          this.board.removeAll('hover');
        }
        this.next();
      }

      //Previous move
      else if (delta > 0) {
        if (this.board) {
          this.board.removeAll('hover');
        }
        this.previous();
      }

      //Don't scroll the window
      if (delta !== 0) {
        mouseEvent.preventDefault();
      }
    },

    /**
     * Mouse out handler
     */
    mouseOut: function() {
      if (this.board) {
        this.board.removeAll('hover');
      }
    },

    /**
     * Mouse move handler
     */
    mouseMove: function(event, mouseEvent) {

      //Attach drag object to events
      if (
        this.mouse.dragStart &&
        (this.mouse.dragStart.x !== event.x || this.mouse.dragStart.y !== event.y)
      ) {
        mouseEvent.drag = dragObject.call(this, event);
      }

      //Nothing else to do?
      if (!this.board || !this.board.layers.hover) {
        return;
      }

      //Last coordinates are the same?
      if (this.mouse.lastX === event.x && this.mouse.lastY === event.y) {
        return;
      }

      //Remember last coordinates
      this.mouse.lastX = event.x;
      this.mouse.lastY = event.y;

      //Broadcast hover event
      this.broadcast('hover', mouseEvent);
    },

    /**
     * Mouse down handler
     */
    mouseDown: function(event) {
      this.mouse.dragStart = {
        x: event.x,
        y: event.y,
      };
    },

    /**
     * Mouse up handler
     */
    mouseUp: function(event, mouseEvent) {
      if (
        this.mouse.dragStart &&
        (this.mouse.dragStart.x !== event.x || this.mouse.dragStart.y !== event.y)
      ) {
        mouseEvent.drag = dragObject.call(this, event);
        this.broadcast('mousedrag', mouseEvent);
      }
      this.mouse.dragStart = null;
    },
  };

  //Return
  return PlayerMode;
});
