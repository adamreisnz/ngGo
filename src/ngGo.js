/**
 * ngGo
 *
 * This is the AngularJS implementation of WGo, based on WGo version 2.3.1. All code has been
 * refactored to fit the Angular framework, as well as having been linted, properly commented
 * and generally cleaned up.
 *
 * Copyright (c) 2013 Jan Prokop (WGo)
 * Copyright (c) 2014 Adam Buczynski (ngGo)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Module definition and dependencies
 */
angular.module('ngGo', [])

/**
 * ngGo constants
 */
.constant('ngGo', {
	name:		'ngGo',
	version:	'3.0.2',
	error:		{
		MOVE_OUT_OF_BOUNDS:			1,
		MOVE_ALREADY_HAS_STONE:		2,
		MOVE_IS_SUICIDE:			3,
		MOVE_IS_REPEATING:			4
	}
})

/**
 * Stone color constant
 */
.constant('StoneColor', {
	E: 0,
	NONE: 0,
	B:	1,
	BLACK: 1,
	W:	-1,
	WHITE: -1
});