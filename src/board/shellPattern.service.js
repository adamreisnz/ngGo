
/**
 * ShellPattern :: This is a helper class to draw shell patterned white stones.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.ShellPattern.Service', [
  'ngGo',
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
    const x1 = x + radius * Math.cos(startAngle * Math.PI);
    const y1 = y + radius * Math.sin(startAngle * Math.PI);
    const x2 = x + radius * Math.cos(endAngle * Math.PI);
    const y2 = y + radius * Math.sin(endAngle * Math.PI);

    //Math magic
    let m, angle;
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
    const c = this.factor * radius;
    const dx = Math.sin(angle) * c;
    const dy = Math.cos(angle) * c;

    //Curvature coordinates
    const bx1 = x1 + dx;
    const by1 = y1 - dy;
    const bx2 = x2 + dx;
    const by2 = y2 - dy;

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
    let startAngle = angle;
    let endAngle = angle;

    //Loop lines
    for (let i = 0; i < this.lines.length; i++) {
      startAngle += this.lines[i];
      endAngle -= this.lines[i];
      shellLine.call(this, ctx, x, y, radius, startAngle, endAngle, strokeStyle);
    }
  };
});
