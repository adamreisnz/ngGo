
/**
 * Markup :: This class is used for drawing markup
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Markup.Service', [
  'ngGo',
  'ngGo.Board.Object.Service',
])

/**
 * Factory definition
 */
.factory('Markup', function(MarkupTypes, BoardObject) {

  /**
   * Math constants
   */
  const cosPi4 = Math.cos(Math.PI / 4);
  const cosPi6 = Math.cos(Math.PI / 6);

  /**
   * Triangle draw handler
   */
  function drawTriangle(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = Math.round(
      theme.get('stone.radius', s, markup.scale) *
      theme.get('markup.triangle.scale')
    );

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const lineWidth = markup.lineWidth || theme.get('markup.lineWidth', s) || 1;
    const strokeStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate(lineWidth);

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.strokeStyle = strokeStyle;
    this.context.lineWidth = lineWidth;

    //Draw element
    this.context.beginPath();
    this.context.moveTo(x, y - r);
    this.context.lineTo(x - Math.round(r * cosPi6), y + Math.round(r / 2));
    this.context.lineTo(x + Math.round(r * cosPi6), y + Math.round(r / 2));
    this.context.closePath();
    this.context.stroke();

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Square draw handler
   */
  function drawSquare(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = Math.round(
      theme.get('stone.radius', s, markup.scale) *
      theme.get('markup.square.scale')
    );

    //Determine cos
    const rcos = Math.round(r * cosPi4);

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const lineWidth = markup.lineWidth || theme.get('markup.lineWidth', s) || 1;
    const strokeStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate(lineWidth);

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.strokeStyle = strokeStyle;
    this.context.lineWidth = lineWidth;

    //Draw element
    this.context.beginPath();
    this.context.rect(x - rcos, y - rcos, 2 * rcos, 2 * rcos);
    this.context.stroke();

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Draw circle handler
   */
  function drawCircle(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = Math.round(
      theme.get('stone.radius', s, markup.scale) *
      theme.get('markup.circle.scale')
    );

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const lineWidth = markup.lineWidth || theme.get('markup.lineWidth', s) || 1;
    const strokeStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate();

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.strokeStyle = strokeStyle;
    this.context.lineWidth = lineWidth;

    //Draw element
    this.context.beginPath();
    this.context.arc(x, y, r, 0, 2 * Math.PI, true);
    this.context.stroke();

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Draw mark handler
   */
  function drawMark(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = Math.round(
      theme.get('stone.radius', s, markup.scale) *
      theme.get('markup.mark.scale')
    );

    //Determine cos
    const rcos = Math.round(r * cosPi4);

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const lineWidth = markup.lineWidth || theme.get('markup.lineWidth', s) || 1;
    const lineCap = markup.lineCap || theme.get('markup.mark.lineCap');
    const strokeStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate(lineWidth);

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.strokeStyle = strokeStyle;
    this.context.lineWidth = lineWidth;
    this.context.lineCap = lineCap;

    //Draw element
    this.context.beginPath();
    this.context.moveTo(x - rcos, y - rcos);
    this.context.lineTo(x + rcos, y + rcos);
    this.context.moveTo(x + rcos, y - rcos);
    this.context.lineTo(x - rcos, y + rcos);
    this.context.stroke();

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Draw select handler
   */
  function drawSelect(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = Math.round(
      theme.get('stone.radius', s, markup.scale) *
      theme.get('markup.circle.scale')
    );

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const lineWidth = markup.lineWidth || theme.get('markup.lineWidth', s) || 1;
    const fillStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate();

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.fillStyle = fillStyle;
    this.context.lineWidth = lineWidth;

    //Draw element
    this.context.beginPath();
    this.context.arc(x, y, r, 0, 2 * Math.PI, true);
    this.context.fill();

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Last move draw handler
   */
  function drawLast(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = Math.round(
      theme.get('stone.radius', s, markup.scale) *
      theme.get('markup.last.scale')
    );

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const fillStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate(s);

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.fillStyle = fillStyle;

    //Draw element
    this.context.beginPath();
    this.context.moveTo(x, y);
    this.context.lineTo(x + r, y);
    this.context.lineTo(x, y + r);
    this.context.closePath();
    this.context.fill();

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Draw happy smiley handler
   */
  function drawHappySmiley(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = Math.round(
      theme.get('stone.radius', s, markup.scale) *
      theme.get('markup.smiley.scale')
    );

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const lineWidth = markup.lineWidth || theme.get('markup.lineWidth', s) || 1;
    const lineCap = markup.lineCap || theme.get('markup.smiley.lineCap');
    const strokeStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate();

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.strokeStyle = strokeStyle;
    this.context.lineWidth = lineWidth;
    this.context.lineCap = lineCap;

    //Draw element
    this.context.beginPath();
    this.context.arc(x - r / 3, y - r / 3, r / 6, 0, 2 * Math.PI, true);
    this.context.stroke();
    this.context.beginPath();
    this.context.arc(x + r / 3, y - r / 3, r / 6, 0, 2 * Math.PI, true);
    this.context.stroke();
    this.context.beginPath();
    this.context.moveTo(x - r / 1.6, y + r / 8);
    this.context.bezierCurveTo(
      x - r / 1.8, y + r / 1.5, x + r / 1.8, y + r / 1.5, x + r / 1.6, y + r / 8
    );
    this.context.stroke();

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Draw sad smiley handler
   */
  function drawSadSmiley(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = Math.round(
      theme.get('stone.radius', s, markup.scale) *
      theme.get('markup.smiley.scale')
    );

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const lineWidth = markup.lineWidth || theme.get('markup.lineWidth', s) || 1;
    const lineCap = markup.lineCap || theme.get('markup.smiley.lineCap');
    const strokeStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate();

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.strokeStyle = strokeStyle;
    this.context.lineWidth = lineWidth;
    this.context.lineCap = lineCap;

    //Draw element
    this.context.beginPath();
    this.context.arc(x - r / 3, y - r / 3, r / 6, 0, 2 * Math.PI, true);
    this.context.stroke();
    this.context.beginPath();
    this.context.arc(x + r / 3, y - r / 3, r / 6, 0, 2 * Math.PI, true);
    this.context.stroke();
    this.context.beginPath();
    this.context.moveTo(x - r / 1.6, y + r / 1.5 - 1);
    this.context.bezierCurveTo(
      x - r / 1.8,
      y + r / 8 - 1,
      x + r / 1.8,
      y + r / 8 - 1,
      x + r / 1.6,
      y + r / 1.5 - 1
    );
    this.context.stroke();

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Draw label
   */
  function drawLabel(markup) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(markup.x);
    const y = this.board.getAbsY(markup.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;

    //Determine radius
    const r = theme.get('stone.radius', s, markup.scale);

    //Get stone color
    const stoneColor = this.board.get('stones', markup.x, markup.y) *
      this.board.colorMultiplier;

    //Get theme properties
    const font = markup.font || theme.get('markup.label.font') || '';
    const fillStyle = markup.color || theme.get('markup.color', stoneColor);
    const canvasTranslate = theme.canvasTranslate();

    //First, clear grid square below for clarity
    if (!this.board.has('stones', markup.x, markup.y)) {
      this.board.layers.grid.clearCell(markup.x, markup.y);
    }

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Configure context
    this.context.fillStyle = fillStyle;
    this.context.textBaseline = 'middle';
    this.context.textAlign = 'center';

    //Convert to text
    if (typeof markup.text === 'number') {
      markup.text = markup.text.toString();
    }

    //Determine font size
    if (markup.text.length === 1) {
      this.context.font = Math.round(r * 1.5) + 'px ' + font;
    }
    else if (markup.text.length === 2) {
      this.context.font = Math.round(r * 1.2) + 'px ' + font;
    }
    else {
      this.context.font = r + 'px ' + font;
    }

    //Draw element
    this.context.beginPath();
    this.context.fillText(markup.text, x, y, 2 * r);

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Clear label
   */
  function clearLabel(markup) {

    //No stone on location? Redraw the grid square, if we cleared it
    if (!this.board.has('stones', markup.x, markup.y)) {
      this.board.layers.grid.redrawCell(markup.x, markup.y);
    }
  }

  /**
   * Markup class
   */
  const Markup = {

    /**
     * Draw
     */
    draw(markup) {

      //Can only draw when we have dimensions and context
      if (!this.context || !this.board.hasDrawSize()) {
        return;
      }

      //Drawing depends on type
      switch (markup.type) {

        //Triangle
        case MarkupTypes.TRIANGLE:
          drawTriangle.call(this, markup);
          break;

        //Square
        case MarkupTypes.SQUARE:
          drawSquare.call(this, markup);
          break;

        //Circle
        case MarkupTypes.CIRCLE:
          drawCircle.call(this, markup);
          break;

        //Mark
        case MarkupTypes.MARK:
          drawMark.call(this, markup);
          break;

        //Select
        case MarkupTypes.SELECT:
          drawSelect.call(this, markup);
          break;

        //happy
        case MarkupTypes.HAPPY:
          drawHappySmiley.call(this, markup);
          break;

        //Sad
        case MarkupTypes.SAD:
          drawSadSmiley.call(this, markup);
          break;

        //Last move marker
        case MarkupTypes.LAST:
          drawLast.call(this, markup);
          break;

        //Label
        case MarkupTypes.LABEL:
          markup.text = markup.text || '';
          drawLabel.call(this, markup);
          break;
      }
    },

    /**
     * Clear
     */
    clear(markup) {

      //Can only draw when we have dimensions and context
      if (!this.context || !this.board.hasDrawSize()) {
        return;
      }

      //Call parent method
      BoardObject.clear.call(this, markup);

      //Special handling for label
      if (markup.type === MarkupTypes.LABEL) {
        clearLabel.call(this, markup);
      }
    },
  };

  //Return
  return Markup;
});
