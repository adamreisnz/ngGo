
/**
 * Coordinates :: This class is used for drawing board coordinates
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Object.Coordinates.Service', [
  'ngGo',
])

/**
 * Factory definition
 */
.factory('Coordinates', function() {

  //Kanji
  const kanji = [
    '一', '二', '三', '四', '五', '六', '七',
    '八', '九', '十', '十一', '十二', '十三', '十四',
    '十五', '十六', '十七', '十八', '十九', '二十',
    '二十一', '二十二', '二十三', '二十四', '二十五',
    '二十六', '二十七', '二十八', '二十九', '三十',
    '三十一', '三十二', '三十三', '三十四', '三十五',
    '三十六', '三十七', '三十八', '三十九', '四十',
  ];

  //Character codes
  const aChar = 'A'.charCodeAt(0);
  const aCharLc = 'a'.charCodeAt(0);

  /**
   * Coordinate generators
   */
  const coordinates = {

    //Kanji coordinates
    kanji(i) {
      return kanji[i] || '';
    },

    //Numbers from 1
    numbers(i) {
      return i + 1;
    },

    //Capital letters from A
    letters(i) {

      //Initialize
      let ch = '';

      //Beyond Z? Prepend with A
      if (i >= 25) {
        ch = 'A';
        i -= 25;
      }

      //The letter I is ommitted
      if (i >= 8) {
        i++;
      }

      //Return
      return ch + String.fromCharCode(aChar + i);
    },

    //JGF coordinates (e.g. 0, 1, ...)
    jgf(i) {
      return i;
    },

    //SGF coordinates (e.g. a, b, ...)
    sgf(i) {
      let ch;
      if (i < 26) {
        ch = aCharLc + i;
      }
      else {
        ch = aChar + i;
      }
      return String.fromCharCode(ch);
    },
  };

  /**
   * Coordinates object
   */
  const Coordinates = {

    /**
     * Draw
     */
    draw() {

      //Can only draw when we have context and dimensions
      if (!this.context || !this.board.hasDrawSize()) {
        return;
      }

      //Get cell size
      const cellSize = this.board.getCellSize();

      //Get boundary coordinates
      const xl = Math.ceil((this.board.drawMarginHor - cellSize / 2) / 2);
      const xr = this.board.drawWidth - xl;
      const yt = Math.ceil((this.board.drawMarginVer - cellSize / 2) / 2);
      const yb = this.board.drawHeight - yt;

      //Get theme properties
      const theme = this.board.theme;
      const fillStyle = theme.get('coordinates.color');
      const vertical = {
        font: theme.get('coordinates.vertical.font'),
        size: theme.get('coordinates.vertical.size'),
        style: theme.get('coordinates.vertical.style'),
        inverse: theme.get('coordinates.vertical.inverse'),
      };
      const horizontal = {
        font: theme.get('coordinates.horizontal.font'),
        size: theme.get('coordinates.horizontal.size'),
        style: theme.get('coordinates.horizontal.style'),
        inverse: theme.get('coordinates.horizontal.inverse'),
      };

      //Configure context
      this.context.fillStyle = fillStyle;
      this.context.textBaseline = 'middle';
      this.context.textAlign = 'center';

      //Helper vars
      let i, j, x, y, ch;

      //Draw vertical coordinates
      for (i = 0; i < this.board.height; i++) {

        //Inverse?
        j = i;
        if (vertical.inverse) {
          j = this.board.height - i - 1;
        }

        //Get character
        if (typeof vertical.style === 'function') {
          ch = vertical.style.call(this, j);
        }
        else if (coordinates[vertical.style]) {
          ch = coordinates[vertical.style].call(this, j);
        }
        else {
          ch = j;
        }

        //Draw
        y = this.board.getAbsY(i);
        this.context.font = vertical.size(ch, cellSize) + ' ' + vertical.font;
        this.context.fillText(ch, xl, y);
        this.context.fillText(ch, xr, y);
      }

      //Draw horizontal coordinates
      for (i = 0; i < this.board.width; i++) {

        //Inverse?
        j = i;
        if (horizontal.inverse) {
          j = this.board.width - i - 1;
        }

        //Get character
        if (typeof horizontal.style === 'function') {
          ch = horizontal.style.call(this, j);
        }
        else if (coordinates[horizontal.style]) {
          ch = coordinates[horizontal.style].call(this, j);
        }
        else {
          ch = j;
        }

        //Draw
        x = this.board.getAbsX(i);
        this.context.font = horizontal.size(ch, cellSize) + ' ' + horizontal.font;
        this.context.fillText(ch, x, yt);
        this.context.fillText(ch, x, yb);
      }
    },
  };

  //Return
  return Coordinates;
});
