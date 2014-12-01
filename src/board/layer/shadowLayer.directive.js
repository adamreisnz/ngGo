/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.ShadowLayer.Directive', [
	'ngGo.Board.Layer.ShadowLayer.Service'
])

/**
 * Directive definition
 */
.directive('shadowlayer', function(ShadowLayer) {
	return {
		restrict: 'E',
		template: '<canvas></canvas>',
		link: function($scope, element, attrs) {

			//Must have board
			if (!$scope.Board) {
				console.warn('No board present in scope for shadow layer');
				return;
			}

			//Get pixel ratio and name of layer
			var pixelRatio = window.pixelRatio || 1,
				name = attrs.name || 'shadow';

			//Get canvas element and context
			var canvas = element.find('canvas'),
				context = canvas[0].getContext('2d');

			//Scale context depending on pixel ratio
			if (pixelRatio > 1) {
				context.scale(pixelRatio, pixelRatio);
			}

			//Listen for board resize events
			$scope.$on('ngGo.board.resize', function(event, width, height) {
				canvas.attr('width', width * pixelRatio);
				canvas.attr('height', height * pixelRatio);
				canvas.css({
					width: width,
					height: height
				});
			});

			//Add layer to board
			$scope.Board.layers[name] = new ShadowLayer($scope.Board, context);
		}
	};
});