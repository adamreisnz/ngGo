/**
 * Module definition and dependencies
 */
angular.module('ngGo.Board.Directive', [
	'ngGo.Board.Service'
])

/**
 * Directive definition
 */
.directive('board', function(Board) {

	//Get pixel ratio
	var pixelRatio = window.pixelRatio || 1;

	/**
	 * Helper to create a layer canvas
	 */
	var createLayerCanvas = function(name) {

		//Create canvas element and get context
		var canvas = document.createElement('canvas'),
			context = canvas.getContext('2d');

		//Scale context depending on pixel ratio
		if (pixelRatio > 1) {
			context.scale(pixelRatio, pixelRatio);
		}

		//Set class
		canvas.className = name;

		//Set initial canvas width/height based on our own size
		canvas.width = this.clientWidth * pixelRatio;
		canvas.height = this.clientHeight * pixelRatio;

		//Append to element now and return context
		this.appendChild(canvas);
		return context;
	};

	/**
	 * Directive
	 */
	return {
		restrict:	'E',
		scope:		true,

		/**
		 * Linking function
		 */
		link: function($scope, element, attrs) {

			//Init vars
			var i, context, layer,
				existingInstance = true;

			//Instantiate board if not present in scope
			if (!$scope.Board) {
				existingInstance = false;
				$scope.Board = new Board();
			}

			//Get parent element
			var parent = element.parent(),
				parentSize = Math.min(parent[0].clientWidth, parent[0].clientHeight);

			//Set initial dimensions
			if (parentSize > 0) {
				element.css({width: parentSize + 'px', height: parentSize + 'px'});
				$scope.Board.setDrawSize(parentSize * pixelRatio, parentSize * pixelRatio);
			}

			//Listen for board resize events
			$scope.$on('ngGo.board.resize', function(event, width, height) {

				//First set the new dimensions on the canvas elements
				var canvas = element.find('canvas');
				for (i = 0; i < canvas.length; i++) {
					canvas[i].width = width * pixelRatio;
					canvas[i].height = height * pixelRatio;
				}

				//Next set it on the board itself
				element.css({width: width + 'px', height: height + 'px'});
				$scope.Board.setDrawSize(width * pixelRatio, height * pixelRatio);
			});

			//Static board?
			if (attrs.static === 'true') {

				//Make the board static
				$scope.Board.makeStatic();

				//Create single canvas and link to all relevant layer service classes
				context = createLayerCanvas.call(element[0], 'static');
				for (i = 0; i < $scope.Board.layerOrder.length; i++) {
					layer = $scope.Board.layerOrder[i];
					$scope.Board.layers[layer].setContext(context);
				}
			}

			//Create individual layer canvasses and link the canvas context to the layer service class
			else {
				for (i = 0; i < $scope.Board.layerOrder.length; i++) {
					layer = $scope.Board.layerOrder[i];
					context = createLayerCanvas.call(element[0], layer);
					$scope.Board.layers[layer].setContext(context);
				}
			}

			//Observe the board size attribute
			attrs.$observe('size', function(size) {
				if (typeof size == 'string' && size.toLowerCase().indexOf('x') !== -1) {
					size = size.split('x');
					$scope.Board.setSize(size[0], size[1]);
				}
				else {
					$scope.Board.setSize(size, size);
				}
			});

			//Observe the coordinates attribute
			attrs.$observe('coordinates', function(attr) {
				$scope.Board.toggleCoordinates(parseBool(attr));
			});

			//Link board to player if present
			if ($scope.Player) {
				$scope.Player.setBoard($scope.Board);
			}

			//Redraw board if we had an existing instance (it might contain data)
			if (existingInstance) {
				$scope.Board.redraw();
			}
		}
	};
});