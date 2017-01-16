
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.HoverLayer.Service', [
  'ngGo',
  'ngGo.Board.Layer.Service',
  'ngGo.Board.Object.Markup.Service',
  'ngGo.Board.Object.StoneFaded.Service',
])

/**
 * Factory definition
 */
.factory('HoverLayer', function(BoardLayer, Markup, StoneFaded) {

  /**
   * Constructor
   */
  function HoverLayer(board, context) {

    //Container for items to restore
    this.restore = [];

    //Call parent constructor
    BoardLayer.call(this, board, context);
  }

  /**
   * Prototype extension
   */
  angular.extend(HoverLayer.prototype, BoardLayer.prototype);

  /**
   * Add hover item
   */
  HoverLayer.prototype.add = function(x, y, hover) {

    //Validate coordinates
    if (!this.grid.isOnGrid(x, y)) {
      return;
    }

    //Remove any previous item at this position
    this.remove(x, y);

    //Create hover object
    hover.object = {x, y};

    //Stones
    if (hover.type === 'stones') {
      hover.objectClass = StoneFaded;
      hover.object.color = hover.value;
    }

    //Markup
    else if (hover.type === 'markup') {
      hover.objectClass = Markup;
      if (typeof hover.value === 'object') {
        hover.object = angular.extend(hover.object, hover.value);
      }
      else {
        hover.object.type = hover.value;
      }
    }

    //Unknown
    else {
      throw new Error('Unknown hover type ' + hover.type);
    }

    //Check if we need to hide something on layers underneath
    if (this.board.has(hover.type, x, y)) {
      this.restore.push({
        x, y,
        layer: hover.type,
        value: this.board.get(hover.type, x, y),
      });
      this.board.remove(hover.type, x, y);
    }

    //Add to stack
    this.grid.set(x, y, hover);

    //Draw item
    if (hover.objectClass && hover.objectClass.draw) {
      hover.objectClass.draw.call(this, hover.object);
    }
  };

  /**
   * Remove the hover object
   */
  HoverLayer.prototype.remove = function(x, y) {

    //Validate coordinates
    if (!this.grid.has(x, y)) {
      return;
    }

    //Get object and clear it
    const hover = this.grid.get(x, y);
    if (hover.objectClass && hover.objectClass.clear) {
      hover.objectClass.clear.call(this, hover.object);
    }

    //Other objects to restore?
    this.restore
      .forEach((item, i) => {
        if (item.x === x && item.y === y) {
          this.board.add(item.layer, item.x, item.y, item.value);
          this.restore.splice(i, 1);
        }
      });
  };

  /**
   * Remove all hover objects
   */
  HoverLayer.prototype.removeAll = function() {

    //Anything to do?
    if (this.grid.isEmpty()) {
      return;
    }

    //Get all item as objects
    const hover = this.grid.all('layer');

    //Clear them
    hover
      .filter(item => item.objectClass && item.objectClass.clear)
      .forEach(item => item.objectClass.clear.call(this, item.object));

    //Clear layer and empty grid
    this.clear();
    this.grid.empty();

    //Restore objects on other layers
    this.restore.forEach(item => {
      this.board.add(item.layer, item.x, item.y, item.value);
    });

    //Clear restore array
    this.restore = [];
  };

  /**
   * Draw layer
   */
  HoverLayer.prototype.draw = function() {

    //Can only draw when we have dimensions and context
    if (!this.context || !this.board.hasDrawSize()) {
      return;
    }

    //Loop objects and draw them
    this.grid.all('hover')
      .filter(item => item.objectClass && item.objectClass.draw)
      .forEach(item => item.objectClass.draw.call(this, item.object));
  };

  //Return
  return HoverLayer;
});
