
/**
 * ShellPattern :: This is a helper class to draw shell patterned white stones.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.ShellPattern.Service', [
  'ngGo'
])

/**
 * Factory definition
 */
.factory('ShellPattern', function() {

  /**
   * Helper to draw a shell line
   */
  function shellLine(ctx, x, y, radius, startAngle, endAngle, strokeStyle) {

    //Initialize
    ctx.shadowBlur = 2;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = (radius / 30) * this.thickness;
    ctx.beginPath();

    //Lower radius
    radius -= Math.max(1, ctx.lineWidth);

    //Determine coordinates
    var x1 = x + radius * Math.cos(startAngle * Math.PI);
    var y1 = y + radius * Math.sin(startAngle * Math.PI);
    var x2 = x + radius * Math.cos(endAngle * Math.PI);
    var y2 = y + radius * Math.sin(endAngle * Math.PI);

    //Math magic
    var m, angle;
    if (x2 > x1) {
      m = (y2 - y1) / (x2 - x1);
      angle = Math.atan(m);
    }
    else if (x2 === x1) {
      angle = Math.PI / 2;
    }
    else {
      m = (y2 - y1) / (x2 - x1);
      angle = Math.atan(m) - Math.PI;
    }

    //Curvature factor
    var c = this.factor * radius;
    var dx = Math.sin(angle) * c;
    var dy = Math.cos(angle) * c;

    //Curvature coordinates
    var bx1 = x1 + dx;
    var by1 = y1 - dy;
    var bx2 = x2 + dx;
    var by2 = y2 - dy;

    //Draw shell stroke
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(bx1, by1, bx2, by2, x2, y2);
    ctx.stroke();
  }

  /**
   * Shell pattern drawer
   */
  return function(ctx, x, y, radius, angle, strokeStyle) {

    //Initialize start and end angle
    var startAngle = angle;
    var endAngle = angle;

    //Loop lines
    for (var i = 0; i < this.lines.length; i++) {
      startAngle += this.lines[i];
      endAngle -= this.lines[i];
      shellLine.call(this, ctx, x, y, radius, startAngle, endAngle, strokeStyle);
    }
  };
});
