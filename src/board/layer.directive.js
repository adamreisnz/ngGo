/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Layer.Directive', [
	'ngGo.Board.Layer.Service',
	'ngGo.Board.Layer.GridLayer.Service',
	'ngGo.Board.Layer.ShadowLayer.Service'
])

/**
 * Directive definition
 */
.directive('boardlayer', function($injector) {
	return {
		restrict: 'E',
		template: '<canvas></canvas>',
		link: function($scope, element, attrs) {

			//Get name and type of layer
			var name = attrs.class || '',
				type = attrs.layerType || 'board',
				pixelRatio = window.pixelRatio || 1;

			//Get canvas element and context
			var canvas = element.find('canvas'),
				context = canvas[0].getContext('2d');

			//Scale context depending on pixel ratio
			if (pixelRatio > 1) {
				context.scale(pixelRatio, pixelRatio);
			}

			//Watch the scope dimensions for changes
			$scope.$watch('dimensions', function(dim) {
				canvas.attr('width', dim.width * pixelRatio);
				canvas.attr('height', dim.height * pixelRatio);
				canvas.css({
					width: dim.width,
					height: dim.height
				});
			});

			//Add to board
			$scope.addLayer(name, type, context);
		}
	};
});