
/**
 * Stone :: This class is used for drawing stones on the board.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Stone.Service', [
  'ngGo',
  'ngGo.Board.Object.Service',
  'ngGo.Board.ShellPattern.Service',
])

/**
 * Factory definition
 */
.factory('Stone', function($injector, BoardObject, StoneColor, ShellPattern) {

  /**
   * Shell random seed
   */
  let shellSeed;

  /**
   * Mono colored stones
   */
  function drawMono(stone) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(stone.x);
    const y = this.board.getAbsY(stone.y);
    const s = this.board.getCellSize();
    const theme = this.board.theme;
    const r = theme.get('stone.radius', s, stone.scale);

    //Don't draw shadow
    stone.shadow = false;

    //Apply color multiplier
    const color = stone.color * this.board.colorMultiplier;

    //Get theme properties
    const lineWidth = theme.get('stone.mono.lineWidth', s) || 1;
    const fillStyle = theme.get('stone.mono.color', color);
    const strokeStyle = theme.get('stone.mono.lineColor', color);
    const canvasTranslate = theme.canvasTranslate();

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Apply transparency?
    if (stone.alpha && stone.alpha < 1) {
      this.context.globalAlpha = stone.alpha;
    }

    //Configure context
    this.context.fillStyle = fillStyle;

    //Draw stone
    this.context.beginPath();
    this.context.arc(x, y, Math.max(0, r - lineWidth), 0, 2 * Math.PI, true);
    this.context.fill();

    //Configure context
    this.context.lineWidth = lineWidth;
    this.context.strokeStyle = strokeStyle;

    //Draw outline
    this.context.stroke();

    //Undo transparency?
    if (stone.alpha && stone.alpha < 1) {
      this.context.globalAlpha = 1;
    }

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Glass stones
   */
  function drawGlass(stone) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(stone.x);
    const y = this.board.getAbsY(stone.y);
    const s = this.board.getCellSize();
    const r = this.board.theme.get('stone.radius', s, stone.scale);

    //Apply color multiplier
    const color = stone.color * this.board.colorMultiplier;

    //Get theme variables
    const canvasTranslate = this.board.theme.canvasTranslate();

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Apply transparency?
    if (stone.alpha && stone.alpha < 1) {
      this.context.globalAlpha = stone.alpha;
    }

    //Begin path
    this.context.beginPath();

    //Determine stone texture
    if (color === StoneColor.W) {
      this.context.fillStyle = this.context.createRadialGradient(
        x - 2 * r / 5, y - 2 * r / 5, r / 3, x - r / 5, y - r / 5, 5 * r / 5
      );
      this.context.fillStyle.addColorStop(0, '#fff');
      this.context.fillStyle.addColorStop(1, '#aaa');
    }
    else {
      this.context.fillStyle = this.context.createRadialGradient(
        x - 2 * r / 5, y - 2 * r / 5, 1, x - r / 5, y - r / 5, 4 * r / 5
      );
      this.context.fillStyle.addColorStop(0, '#666');
      this.context.fillStyle.addColorStop(1, '#111');
    }

    //Complete drawing
    this.context.arc(x, y, Math.max(0, r - 0.5), 0, 2 * Math.PI, true);
    this.context.fill();

    //Undo transparency?
    if (stone.alpha && stone.alpha < 1) {
      this.context.globalAlpha = 1;
    }

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Slate and shell stones
   */
  function drawSlateShell(stone) {

    //Get coordinates and stone radius
    const x = this.board.getAbsX(stone.x);
    const y = this.board.getAbsY(stone.y);
    const s = this.board.getCellSize();
    const theme = this.board.them;
    const r = theme.get('stone.radius', s, stone.scale);

    //Get random seed
    shellSeed = shellSeed || Math.ceil(Math.random() * 9999999);

    //Apply color multiplier
    const color = stone.color * this.board.colorMultiplier;

    //Get theme variables
    const shellTypes = theme.get('stone.shell.types');
    const fillStyle = theme.get('stone.shell.color', color);
    const strokeStyle = theme.get('stone.shell.stroke');
    const canvasTranslate = theme.canvasTranslate();

    //Translate canvas
    this.context.translate(canvasTranslate, canvasTranslate);

    //Apply transparency?
    if (stone.alpha && stone.alpha < 1) {
      this.context.globalAlpha = stone.alpha;
    }

    //Draw stone
    this.context.beginPath();
    this.context.arc(x, y, Math.max(0, r - 0.5), 0, 2 * Math.PI, true);
    this.context.fillStyle = fillStyle;
    this.context.fill();

    //Shell stones
    if (color === StoneColor.W) {

      //Get random shell type
      const type =
        shellSeed %
        (shellTypes.length + stone.x * this.board.width + stone.y) %
        shellTypes.length;

      //Determine random angle
      const z = this.board.width * this.board.height +
        stone.x * this.board.width + stone.y;
      const angle = (2 / z) * (shellSeed % z);

      //Draw shell pattern
      ShellPattern.call(shellTypes[type], this.context, x, y, r, angle, strokeStyle);

      //Add radial gradient
      this.context.beginPath();
      this.context.fillStyle = this.context.createRadialGradient(
        x - 2 * r / 5, y - 2 * r / 5, r / 6, x - r / 5, y - r / 5, r
      );
      this.context.fillStyle.addColorStop(0, 'rgba(255,255,255,0.9)');
      this.context.fillStyle.addColorStop(1, 'rgba(255,255,255,0)');
      this.context.arc(x, y, Math.max(0, r - 0.5), 0, 2 * Math.PI, true);
      this.context.fill();
    }

    //Slate stones
    else {

      //Add radial gradient
      this.context.beginPath();
      this.context.fillStyle = this.context.createRadialGradient(
        x + 2 * r / 5, y + 2 * r / 5, 0, x + r / 2, y + r / 2, r
      );
      this.context.fillStyle.addColorStop(0, 'rgba(32,32,32,1)');
      this.context.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');
      this.context.arc(x, y, Math.max(0, r - 0.5), 0, 2 * Math.PI, true);
      this.context.fill();

      //Add radial gradient
      this.context.beginPath();
      this.context.fillStyle = this.context.createRadialGradient(
        x - 2 * r / 5, y - 2 * r / 5, 1, x - r / 2, y - r / 2, 3 * r / 2
      );
      this.context.fillStyle.addColorStop(0, 'rgba(64,64,64,1)');
      this.context.fillStyle.addColorStop(1, 'rgba(0,0,0,0)');
      this.context.arc(x, y, Math.max(0, r - 0.5), 0, 2 * Math.PI, true);
      this.context.fill();
    }

    //Undo transparency?
    if (stone.alpha && stone.alpha < 1) {
      this.context.globalAlpha = 1;
    }

    //Undo translation
    this.context.translate(-canvasTranslate, -canvasTranslate);
  }

  /**
   * Constructor
   */
  const Stone = {

    /**
     * Draw a stone
     */
    draw(stone) {

      //Can only draw when we have dimensions and context
      if (!this.context || !this.board.hasDrawDimensions()) {
        return;
      }

      //Determine style of stone
      const style = this.board.theme.get('stone.style');

      //Draw using the appropriate handler
      switch (style) {

        //Slate and shell
        case 'shell':
          drawSlateShell.call(this, stone);
          break;

        //Glass stones
        case 'glass':
          drawGlass.call(this, stone);
          break;

        //Mono stones
        case 'mono':
          drawMono.call(this, stone);
          break;

        //Custom type
        default:
          const handler = $injector.get(style);
          if (handler) {
            handler.call(this, stone);
          }
      }

      //Add shadow
      if (!this.board.static && stone.shadow !== false &&
        this.board.theme.get('stone.shadow')) {
        this.board.layers.shadow.add(stone);
      }
    },

    /**
     * Clear a stone
     */
    clear(stone) {

      //Can only draw when we have dimensions and context
      if (!this.context || !this.board.hasDrawDimensions()) {
        return;
      }

      //Call parent method
      BoardObject.clear.call(this, stone);

      //Remove shadow
      if (!this.board.static && stone.shadow !== false &&
        this.board.theme.get('stone.shadow')) {
        this.board.layers.shadow.remove(stone);
      }
    },
  };

  //Return
  return Stone;
});
