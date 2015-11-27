
/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.HoverLayer.Service', [
  'ngGo',
  'ngGo.Board.Layer.Service',
  'ngGo.Board.Object.Markup.Service',
  'ngGo.Board.Object.StoneFaded.Service'
])

/**
 * Factory definition
 */
.factory('HoverLayer', function(BoardLayer, Markup, StoneFaded) {

  /**
   * Constructor
   */
  var HoverLayer = function(board, context) {

    //Container for items to restore
    this.restore = [];

    //Call parent constructor
    BoardLayer.call(this, board, context);
  };

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
    hover.object = {
      x: x,
      y: y
    };

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
      console.warn('Unknown hover type', hover.type);
      return;
    }

    //Check if we need to hide something on layers underneath
    if (this.board.has(hover.type, x, y)) {
      this.restore.push({
        x: x,
        y: y,
        layer: hover.type,
        value: this.board.get(hover.type, x, y)
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
    var hover = this.grid.get(x, y);
    if (hover.objectClass && hover.objectClass.clear) {
      hover.objectClass.clear.call(this, hover.object);
    }

    //Other objects to restore?
    for (var i = 0; i < this.restore.length; i++) {
      if (this.restore[i].x === x && this.restore[i].y === y) {
        this.board.add(this.restore[i].layer, this.restore[i].x, this.restore[i].y, this.restore[i].value);
        this.restore.splice(i, 1);
      }
    }
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
    var i, hover = this.grid.all('layer');

    //Clear them
    for (i = 0; i < hover.length; i++) {
      if (hover[i].objectClass && hover[i].objectClass.clear) {
        hover[i].objectClass.clear.call(this, hover[i].object);
      }
    }

    //Clear layer and empty grid
    this.clear();
    this.grid.empty();

    //Restore objects on other layers
    for (i = 0; i < this.restore.length; i++) {
      this.board.add(this.restore[i].layer, this.restore[i].x, this.restore[i].y, this.restore[i].value);
    }

    //Clear restore array
    this.restore = [];
  };

  /**
   * Draw layer
   */
  HoverLayer.prototype.draw = function() {

    //Can only draw when we have dimensions and context
    if (!this.context || this.board.drawWidth === 0 || this.board.drawheight === 0) {
      return;
    }

    //Loop objects and clear them
    var hover = this.grid.all('hover');
    for (var i = 0; i < hover.length; i++) {
      if (hover.objectClass && hover.objectClass.draw) {
        hover.objectClass.draw.call(this, hover.object);
      }
    }
  };

  //Return
  return HoverLayer;
});